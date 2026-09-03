"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface Props {
  code: string | null;
  emptyLabel?: string;
}

export function OutputPanel({ code, emptyLabel }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail silently,
      // the code is still selectable/copyable by hand.
    }
  }

  if (!code) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {emptyLabel ?? "Formatted code will appear here."}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="secondary"
        onClick={handleCopy}
        className="absolute right-2 top-2 gap-1.5"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre className="thin-scrollbar h-[420px] overflow-auto rounded-md border bg-secondary/40 p-4 pr-20 text-xs leading-relaxed">
        <code className="font-mono-code font-mono">{code}</code>
      </pre>
    </div>
  );
}
