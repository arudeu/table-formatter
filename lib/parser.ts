import { DetectMode, ParsedTable, PageType, TableFormatError } from "@/types";

function stripBrandColors(el: HTMLElement) {
  el.style.removeProperty("color");
  el.style.removeProperty("background-color");
  if (el.getAttribute("style") === "") el.removeAttribute("style");
}

function stripBrandColorsDeep(root: HTMLElement) {
  stripBrandColors(root);
  root.querySelectorAll<HTMLElement>("*").forEach(stripBrandColors);
}

/** Removes Word/CMS noise while preserving meaningful formatting. */
function cleanCell(cell: HTMLElement) {
  // Width/height can be present as attributes or inline CSS.
  cell.removeAttribute("width");
  cell.removeAttribute("height");
  cell.style.removeProperty("width");
  cell.style.removeProperty("height");

  // Remove paragraph wrappers inside table cells while preserving their contents.
  // Word commonly wraps every cell's content in <p>, which is not wanted in
  // the final table markup. Empty paragraphs (including <p><strong></strong></p>)
  // are removed; non-empty paragraphs are unwrapped so their children remain.
  cell.querySelectorAll("p").forEach((p) => {
    const meaningful = p.textContent?.replace(/\u00a0/g, " ").trim() || "";
    if (!meaningful && p.querySelectorAll("img,br").length === 0) {
      p.remove();
      return;
    }

    p.replaceWith(...Array.from(p.childNodes));
  });

  // Remove empty strong tags left behind by Word.
  cell.querySelectorAll("strong, b").forEach((el) => {
    if (!(el.textContent?.replace(/\u00a0/g, " ").trim())) el.remove();
  });

  stripBrandColorsDeep(cell);

  // Normalize text transformations requested for table content.
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    // Do not alter text inside an existing <sup>.
    if (node.parentElement?.closest("sup")) continue;

    let value = node.nodeValue ?? "";
    // Word often uses an en/em dash. Also normalize a plain dash surrounded
    // by spaces to an HTML entity so the output is consistently &ndash;.
    value = value.replace(/[–—]/g, "&ndash;");
    // Normalize numeric ranges such as 6-7 or 8 - 10 to the requested
    // HTML entity format: 6 &ndash; 7.
    value = value.replace(/\b(\d+)\s*-\s*(\d+)\b/g, "$1 &ndash; $2");
    // Normalize other standalone dashes surrounded by spaces.
    value = value.replace(/\s-\s/g, " &ndash; ");
    value = value.replace(/(\d+)(st|nd|rd|th)\b/gi, "$1<sup>$2</sup>");
    value = value.replace(/\bTotal\s*:/gi, "Total");

    // Since this is text-node content, insert the generated markup safely.
    if (value.includes("&ndash;") || /<sup>.*<\/sup>/i.test(value)) {
      const holder = document.createElement("span");
      holder.innerHTML = value;
      node.replaceWith(...Array.from(holder.childNodes));
    } else {
      node.nodeValue = value;
    }
  }

  // Final pass: no <p> wrappers are allowed inside table cells.
  cell.querySelectorAll("p").forEach((p) => {
    const meaningful = p.textContent?.replace(/\u00a0/g, " ").trim() || "";
    if (!meaningful && p.querySelectorAll("img,br").length === 0) p.remove();
    else p.replaceWith(...Array.from(p.childNodes));
  });
}

function cellIsBlank(cell: HTMLTableCellElement): boolean {
  const clone = cell.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("br").forEach((br) => br.remove());
  return !(clone.textContent?.replace(/\u00a0/g, " ").trim());
}

/**
 * Merges unused blank cells into the nearest useful cell. A run of blank
 * cells immediately after a useful cell becomes additional colspan; leading
 * blank cells are merged into the first useful cell. This is especially
 * useful for Word tables where visual spacing is represented by empty cells.
 */
/** Automatically bolds a trailing "Total" label in a table row.
 * The last non-empty cell is considered the row's ending cell, so rows with
 * trailing blank cells still get the Total label formatted correctly.
 */
function boldTrailingTotal(row: HTMLTableRowElement) {
  const cells = Array.from(row.cells);
  for (let i = cells.length - 1; i >= 0; i--) {
    const cell = cells[i];
    const text = (cell.textContent ?? "").replace(/\u00a0/g, " ").trim();
    if (!text) continue;

    if (/^Total$/i.test(text)) {
      const strong = cell.querySelector("strong");
      if (!strong) {
        const wrapper = document.createElement("strong");
        while (cell.firstChild) wrapper.appendChild(cell.firstChild);
        cell.appendChild(wrapper);
      }
    }
    break;
  }
}

function mergeBlankCells(row: HTMLTableRowElement) {
  const cells = Array.from(row.cells);
  if (!cells.length) return;

  // Work from right to left so removing cells doesn't invalidate indexes.
  for (let i = cells.length - 1; i >= 0; i--) {
    const cell = cells[i];
    if (!cellIsBlank(cell)) continue;

    let target: HTMLTableCellElement | undefined;
    for (let j = i - 1; j >= 0; j--) {
      if (!cellIsBlank(cells[j])) {
        target = cells[j];
        break;
      }
    }
    if (!target) {
      for (let j = i + 1; j < cells.length; j++) {
        if (!cellIsBlank(cells[j])) {
          target = cells[j];
          break;
        }
      }
    }

    if (target) {
      target.colSpan = Math.max(1, target.colSpan) + Math.max(1, cell.colSpan);
      cell.remove();
    }
  }
}

function cleanTable(table: HTMLTableElement) {
  table.querySelectorAll<HTMLElement>("[width],[height]").forEach((el) => {
    el.removeAttribute("width");
    el.removeAttribute("height");
    el.style.removeProperty("width");
    el.style.removeProperty("height");
  });

  table.querySelectorAll<HTMLTableCellElement>("th,td").forEach(cleanCell);
}

function titleCaseHeader(html: string): string {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  const walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.parentElement?.closest("sup")) continue;
    node.nodeValue = (node.nodeValue ?? "").replace(/\b([A-Za-z][A-Za-z0-9']*)\b/g, (word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }
  return holder.innerHTML.trim();
}

/**
 * Detects Tournament Page vs MPP from HTML markup.
 */
export function detectPageType(rawHtml: string): PageType | null {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  if (doc.querySelector("details, summary, .tablescroll-accord, .tablescroll")) return "tournament";
  if (doc.querySelector("table")) return "mpp";
  return null;
}

/** Converts clipboard text from Word (TSV/tab/newline) into a real HTML table. */
export function wordTextToTable(raw: string): string {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n").filter((line) => line.trim());
  if (!lines.length) throw new TableFormatError("Paste a table copied from Word to get started.");

  const rows = lines.map((line) => line.split("\t"));
  const width = Math.max(...rows.map((r) => r.length));
  const htmlRows = rows.map((cells) => {
    const padded = [...cells, ...Array(Math.max(0, width - cells.length)).fill("")];
    return `<tr>${padded.map((cell) => `<td>${escapeText(cell)}</td>`).join("")}</tr>`;
  });
  return `<table><tbody>${htmlRows.join("")}</tbody></table>`;
}

function escapeText(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));
}

interface ParseResult {
  type: PageType;
  table: ParsedTable;
}

export function parseTableSnippet(rawHtml: string, mode: DetectMode): ParseResult {
  const trimmed = rawHtml.trim();
  if (!trimmed) throw new TableFormatError("Paste a table snippet to get started.");

  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  const table = doc.querySelector("table");
  if (!table) {
    throw new TableFormatError("No <table> element found. For a Word table, use the Word Table option or copy the table as HTML.");
  }

  const detected = detectPageType(rawHtml);
  const type: PageType = mode === "auto" ? detected ?? "mpp" : mode;
  const summaryEl = doc.querySelector("summary");
  const summaryTitle = summaryEl?.textContent?.trim() || null;

  cleanTable(table);

  const firstRow = table.rows[0] ?? null;
  const firstRowLooksLikeHeader = !!firstRow && firstRow.cells.length > 0 &&
    Array.from(firstRow.cells).every((c) => c.tagName === "TH");

  const theadRows = table.tHead
    ? Array.from(table.tHead.rows)
    : firstRowLooksLikeHeader && firstRow ? [firstRow] : [];

  let titleRow: HTMLTableRowElement | null = null;
  let columnHeaderRow: HTMLTableRowElement | null = null;
  for (const row of theadRows) {
    const cells = Array.from(row.cells);
    if (cells.length === 1 && cells[0].colSpan > 1) titleRow = row;
    else if (!columnHeaderRow) columnHeaderRow = row;
  }

  // Word clipboard tables often have no thead. Promote the first non-empty row
  // to the header for the dedicated Word mode (TH is created below).
  const detectedTitle = summaryTitle || titleRow?.textContent?.trim() || null;
  const columnHeaderCells = columnHeaderRow ? Array.from(columnHeaderRow.cells) : [];

  const consumedRows = new Set<HTMLTableRowElement>(
    [titleRow, columnHeaderRow].filter((r): r is HTMLTableRowElement => r !== null)
  );
  const allRows = table.tBodies.length
    ? Array.from(table.tBodies).flatMap((tb) => Array.from(tb.rows))
    : Array.from(table.rows);
  const bodySourceRows = allRows.filter((r) => !consumedRows.has(r));

  if (columnHeaderCells.length === 0 && bodySourceRows.length === 0) {
    throw new TableFormatError("The pasted table doesn't have any rows or header cells to format.");
  }

  const allSourceRows = [...(columnHeaderRow ? [columnHeaderRow] : []), ...bodySourceRows];
  allSourceRows.forEach((row) => mergeBlankCells(row));
  cleanTable(table);
  allSourceRows.forEach((row) => boldTrailingTotal(row));

  const columnCount = Math.max(
    1,
    ...allSourceRows.map((row) =>
      Array.from(row.cells).reduce((sum, cell) => sum + Math.max(1, cell.colSpan), 0)
    )
  );

  const headerCellsHtml = columnHeaderCells.map((cell) => titleCaseHeader(cell.innerHTML)).filter(Boolean);
  const bodyRowsHtml = bodySourceRows.map((row) => {
    cleanTable(table);
    return row.outerHTML.trim();
  });

  return {
    type,
    table: {
      title: detectedTitle || "Table Title",
      titleWasDetected: Boolean(detectedTitle),
      columnCount,
      headerCellsHtml,
      bodyRowsHtml,
    },
  };
}

/** Parse HTML or clipboard TSV from Microsoft Word. */
export function parseWordTable(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) throw new TableFormatError("Paste a Word table to get started.");

  const looksLikeHtml = /<table[\s>]/i.test(trimmed);
  const html = looksLikeHtml ? trimmed : wordTextToTable(trimmed);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) throw new TableFormatError("I couldn't detect a table in the Word content.");

  cleanTable(table);

  const rows = Array.from(table.rows);
  if (!rows.length) throw new TableFormatError("The Word table has no rows.");

  // Treat the first row as the header and title-case its text.
  const headerRow = rows[0];
  Array.from(headerRow.cells).forEach((cell) => {
    const th = document.createElement("th");
    th.innerHTML = cell.innerHTML;
    for (const attr of Array.from(cell.attributes)) {
      if (attr.name !== "width" && attr.name !== "height") th.setAttribute(attr.name, attr.value);
    }
    cell.replaceWith(th);
  });

  // Merge blank/unused cells into useful neighbors, preserving colspans.
  rows.forEach(mergeBlankCells);
  cleanTable(table);
  rows.forEach(boldTrailingTotal);

  const headerCellsHtml = Array.from(headerRow.cells)
    .map((cell) => titleCaseHeader(cell.innerHTML))
    .filter(Boolean);

  const bodyRowsHtml = rows.slice(1).map((row) => row.outerHTML.trim());
  const columnCount = Math.max(1, headerRow.cells.length ? Array.from(headerRow.cells).reduce((n, c) => n + Math.max(1, c.colSpan), 0) : 1);

  return {
    type: "mpp",
    table: {
      title: "Table Title",
      titleWasDetected: false,
      columnCount,
      headerCellsHtml,
      bodyRowsHtml,
    },
  };
}
