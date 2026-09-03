"use client";

import { useMemo } from "react";

interface Props {
  html: string | null;
  emptyLabel?: string;
}

const BOOTSTRAP_CDN =
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";

export function PreviewPane({ html, emptyLabel }: Props) {
  const doc = useMemo(() => {
    if (!html) return "";
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="${BOOTSTRAP_CDN}" />
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: #ffffff;
      }
      table { margin-bottom: 0; }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;
  }, [html]);

  if (!html) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {emptyLabel ?? "Paste a table snippet to see a live preview."}
      </div>
    );
  }

  return (
    <iframe
      title="Formatted table preview"
      srcDoc={doc}
      sandbox=""
      className="h-[420px] w-full rounded-md border bg-white"
    />
  );
}
