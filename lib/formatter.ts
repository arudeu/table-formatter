import { PageType, ParsedTable, StyleOptions } from "@/types";

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

function genId(): string {
  return "tf-" + Math.random().toString(36).slice(2, 8);
}

/**
 * Renders a fully-styled, brand-colored snippet in the same shape as the
 * hand-written Tournament Page / MPP templates, with every color and
 * spacing value swapped in from `style`. Each output is scoped to a
 * generated id so pasting several formatted tables on one page never lets
 * their styles collide.
 */
function normalizeOutputEntities(html: string): string {
  return html
    .replace(/[–—]/g, "&ndash;")
    .replace(/\b(\d+)\s*-\s*(\d+)\b/g, "$1 &ndash; $2")
    .replace(/\s-\s/g, " &ndash; ");
}

export function generateOutput(
  type: PageType,
  parsed: ParsedTable,
  style: StyleOptions,
  titleOverride?: string,
  includeTitle: boolean = true
): string {
  const title = (titleOverride ?? parsed.title).trim() || "Table Title";
  const id = genId();
  const {
    brandColor,
    brandTextColor,
    fontSize,
    cellPadding,
    containerPadding,
    maxHeight,
  } = style;

  if (type === "tournament") {
    const headerCells = parsed.headerCellsHtml
      .map((html) => `    <th style="color: ${brandTextColor}">${html}</th>`)
      .join("\n");
    const bodyRows = parsed.bodyRowsHtml.map((r) => "    " + r).join("\n");

    return normalizeOutputEntities(`<style>
#${id} .table tbody th,
#${id} .table tbody tr td,
#${id} .table thead th {
  font-size: ${fontSize}px;
  vertical-align: middle;
}

#${id} .tablescroll {
  overflow: auto;
  max-height: ${maxHeight}em;
}

#${id} .tablescroll th {
  position: sticky;
  top: 0;
  z-index: 2;
}

#${id} {
  border: 1px solid ${brandColor};
  padding: ${containerPadding}em ${containerPadding}em 0;
  margin-top: 10px;
  box-shadow: 0 0 20px #d4d4d4;
}

#${id} summary {
  font-weight: bold;
  margin: -${containerPadding}em -${containerPadding}em 0;
  padding: ${containerPadding}em;
  background-color: ${brandColor};
  color: ${brandTextColor};
}

#${id}[open] summary {
  border-bottom: 1px solid ${brandColor};
  margin-bottom: 10px;
}

#${id} .tablescroll-accord {
  overflow: auto;
}

#${id} .tablescroll-accord th {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>

<details id="${id}">
${includeTitle ? `<summary>${escapeHtml(title)}</summary>` : ""}
<div class="tablescroll-accord" style="display: flex; flex-wrap: wrap;">
<table class="table table-striped table-bordered" style="text-align: center; background-color: ${brandTextColor};">
<thead>
<tr style="color: ${brandTextColor}; background-color: ${brandColor};">
${headerCells}
</tr>
</thead>
<tbody>
${bodyRows}
</tbody>
</table>
</div>
</details>`);
  }

  // MPP
  const headerCells = parsed.headerCellsHtml
    .map(
      (html) =>
        `      <th style="background-color: ${brandColor}; color: ${brandTextColor};">${html}</th>`
    )
    .join("\n");
  const bodyRows = parsed.bodyRowsHtml.map((r) => "    " + r).join("\n");

  const titleRow = includeTitle
    ? `    <tr>
      <th style="color: ${brandTextColor}; background-color: ${brandColor};" colspan="${parsed.columnCount}">
        <strong>${escapeHtml(title)}</strong>
      </th>
    </tr>
`
    : "";

  return normalizeOutputEntities(`<table class="table table-striped table-bordered" style="text-align: center; background-color: #fff;">
  <thead>
${titleRow}    <tr style="background-color: ${brandColor}; color: ${brandTextColor};">
${headerCells}
    </tr>
  </thead>
  <tbody style="color: ${brandTextColor};">
${bodyRows}
  </tbody>
</table>`);
}

export const DEFAULT_STYLE: Omit<StyleOptions, "brandColor" | "brandTextColor"> = {
  fontSize: 12,
  cellPadding: 0.5,
  containerPadding: 0.75,
  maxHeight: 20,
};
