export type PageType = "tournament" | "mpp";
export type DetectMode = "auto" | PageType;

export interface StyleOptions {
  brandColor: string;
  brandTextColor: string;
  fontSize: number; // px, table cell text
  cellPadding: number; // em, table cell padding
  containerPadding: number; // em, details/summary padding (tournament only)
  maxHeight: number; // em, scroll container max height
}

export interface ParsedTable {
  title: string;
  titleWasDetected: boolean;
  columnCount: number;
  headerCellsHtml: string[]; // inner HTML of each column-header <th>
  bodyRowsHtml: string[]; // outer HTML of each <tr> in the body, colors stripped
}

export class TableFormatError extends Error {}
