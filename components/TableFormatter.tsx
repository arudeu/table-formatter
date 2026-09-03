"use client";

import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BrandSelector } from "@/components/BrandSelector";
import { CustomizationPanel } from "@/components/CustomizationPanel";
import { PreviewPane } from "@/components/PreviewPane";
import { OutputPanel } from "@/components/OutputPanel";
import { detectPageType, parseTableSnippet, parseWordTable } from "@/lib/parser";
import { DEFAULT_STYLE, generateOutput } from "@/lib/formatter";
import { getBrand, getCategoryKeys } from "@/lib/brands";
import { DetectMode, PageType, StyleOptions, TableFormatError } from "@/types";
import { AlertTriangle, Sparkles } from "lucide-react";

const SAMPLE_INPUT = `<table class="table table-striped table-bordered">
  <thead>
    <tr>
      <th>Date</th>
      <th>Time</th>
      <th>Event</th>
      <th>Buy-in &gt; Package</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>April 1</td>
      <td>8:35 PM</td>
      <td><strong>KICK OFF SEAT + CASH (LIVE)</strong></td>
      <td><strong>$100 &gt; $600</strong></td>
    </tr>
  </tbody>
</table>`;

const MODE_OPTIONS: { value: DetectMode; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "tournament", label: "Tournament Page" },
  { value: "mpp", label: "MPP" },
];

export function TableFormatter() {
  const [rawInput, setRawInput] = useState("");
  const [inputMode, setInputMode] = useState<"html" | "word">("html");
  const [mode, setMode] = useState<DetectMode>("auto");
  const [brandKey, setBrandKey] = useState("betmgm");
  const [categoryKey, setCategoryKey] = useState(
    getCategoryKeys(getBrand("betmgm"))[0]
  );
  const [titleOverride, setTitleOverride] = useState("");
  const [includeTitle, setIncludeTitle] = useState(true);
  const [colorOverride, setColorOverride] = useState<string | null>(null);
  const [textColorOverride, setTextColorOverride] = useState<string | null>(null);
  const [numericStyle, setNumericStyle] = useState(DEFAULT_STYLE);

  const brand = getBrand(brandKey);
  const brandColors = brand.categories[categoryKey] ?? Object.values(brand.categories)[0];

  const style: StyleOptions = {
    ...numericStyle,
    brandColor: colorOverride ?? brandColors.color,
    brandTextColor: textColorOverride ?? brandColors.text,
  };

  const detected = useMemo(() => detectPageType(rawInput), [rawInput]);

  const result = useMemo(() => {
    if (!rawInput.trim()) return { error: null, output: null, pageType: null as PageType | null, detectedTitle: "" };
    try {
      const { type, table } =
        inputMode === "word"
          ? parseWordTable(rawInput)
          : parseTableSnippet(rawInput, mode);
      const output = generateOutput(type, table, style, titleOverride || undefined, includeTitle);
      return { error: null, output, pageType: type, detectedTitle: table.title };
    } catch (e) {
      const message = e instanceof TableFormatError ? e.message : "Couldn't parse that snippet — check that it's valid HTML.";
      return { error: message, output: null, pageType: null as PageType | null, detectedTitle: "" };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawInput, mode, inputMode, style, titleOverride, includeTitle]);

  function handleBrandChange(key: string) {
    setBrandKey(key);
    const nextBrand = getBrand(key);
    setCategoryKey(getCategoryKeys(nextBrand)[0]);
    setColorOverride(null);
    setTextColorOverride(null);
  }

  function handleCategoryChange(key: string) {
    setCategoryKey(key);
    setColorOverride(null);
    setTextColorOverride(null);
  }

  function handleStyleChange(patch: Partial<StyleOptions>) {
    const { brandColor, brandTextColor, ...numericPatch } = patch;
    if (brandColor !== undefined) setColorOverride(brandColor);
    if (brandTextColor !== undefined) setTextColorOverride(brandTextColor);
    if (Object.keys(numericPatch).length > 0) {
      setNumericStyle((prev) => ({ ...prev, ...numericPatch }));
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Table Formatter</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Paste a table snippet, pick a brand, and get pixel-matched MPP or Tournament Page markup back.
          </p>
        </div>
        <Badge variant="accent" className="w-fit">{brand.name}</Badge>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: input + controls */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{inputMode === "html" ? "HTML Table" : "Word Table"}</CardTitle>
                  <CardDescription>
                    {inputMode === "html"
                      ? "Paste raw HTML table markup."
                      : "Paste a table copied directly from Microsoft Word. HTML and tab-separated clipboard data are supported."}
                  </CardDescription>
                </div>
                {!rawInput && (
                  <Button variant="outline" size="sm" onClick={() => setRawInput(SAMPLE_INPUT)}>
                    Load sample
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={inputMode === "html" ? "default" : "outline"} onClick={() => setInputMode("html")}>
                  HTML
                </Button>
                <Button type="button" size="sm" variant={inputMode === "word" ? "default" : "outline"} onClick={() => setInputMode("word")}>
                  Word Table
                </Button>
              </div>

              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={inputMode === "html" ? "<table>...</table>" : "Paste your Word table here…"}
                className="thin-scrollbar h-48 font-mono-code font-mono text-xs"
                spellCheck={false}
              />

              {inputMode === "html" && <div className="flex flex-wrap items-center gap-2">
                {MODE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={mode === opt.value ? "default" : "outline"}
                    onClick={() => setMode(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
                {mode === "auto" && detected && (
                  <span className="text-xs text-muted-foreground">
                    Detected: <span className="font-medium text-foreground">{detected === "tournament" ? "Tournament Page" : "MPP"}</span>
                  </span>
                )}
              </div>}

              {inputMode === "word" && (
                <p className="text-xs text-muted-foreground">
                  Word mode automatically removes widths and empty paragraphs, cleans dashes and “Total:”, title-cases headers, converts ordinals to <code>&lt;sup&gt;</code>, and merges unused blank cells with <code>colspan</code>.
                </p>
              )}

              {result.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand & styling</CardTitle>
              <CardDescription>Applied automatically — override anything below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <BrandSelector
                brandKey={brandKey}
                categoryKey={categoryKey}
                onBrandChange={handleBrandChange}
                onCategoryChange={handleCategoryChange}
              />
              <Separator />
              <CustomizationPanel
                pageType={result.pageType ?? "mpp"}
                title={titleOverride}
                titlePlaceholder={result.detectedTitle || "Table Title"}
                includeTitle={includeTitle}
                onIncludeTitleChange={setIncludeTitle}
                onTitleChange={setTitleOverride}
                style={style}
                onStyleChange={handleStyleChange}
                colorIsCustom={colorOverride !== null}
                textColorIsCustom={textColorOverride !== null}
                onResetColors={() => {
                  setColorOverride(null);
                  setTextColorOverride(null);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: preview + output */}
        <Card className="h-fit lg:sticky lg:top-8">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Live preview, rendered with the same table classes as production.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <PreviewPane html={result.output} />
              </TabsContent>
              <TabsContent value="code">
                <OutputPanel code={result.output} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
