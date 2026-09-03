"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { PageType, StyleOptions } from "@/types";

interface Props {
  pageType: PageType;
  title: string;
  titlePlaceholder: string;
  includeTitle: boolean;
  onIncludeTitleChange: (v: boolean) => void;
  onTitleChange: (v: string) => void;
  style: StyleOptions;
  onStyleChange: (patch: Partial<StyleOptions>) => void;
  colorIsCustom: boolean;
  textColorIsCustom: boolean;
  onResetColors: () => void;
}

export function CustomizationPanel({
  pageType,
  title,
  titlePlaceholder,
  includeTitle,
  onIncludeTitleChange,
  onTitleChange,
  style,
  onStyleChange,
  colorIsCustom,
  textColorIsCustom,
  onResetColors,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-title">Table title</Label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              id="include-title"
              type="checkbox"
              checked={includeTitle}
              onChange={(e) => onIncludeTitleChange(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-accent"
            />
            Add title
          </label>
        </div>
        <Input
          id="title-input"
          value={title}
          placeholder={titlePlaceholder}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={!includeTitle}
        />
        <p className="text-xs text-muted-foreground">
          {pageType === "tournament"
            ? "Shown in the collapsible header."
            : "Shown in the merged title row."}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Brand colors</Label>
          {(colorIsCustom || textColorIsCustom) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-muted-foreground"
              onClick={onResetColors}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="color-swatch" className="font-normal">
              Accent
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="color-swatch"
                type="color"
                value={style.brandColor}
                onChange={(e) => onStyleChange({ brandColor: e.target.value })}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <Input
                value={style.brandColor}
                onChange={(e) => onStyleChange({ brandColor: e.target.value })}
                className="font-mono-code text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="text-color-swatch" className="font-normal">
              Text
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="text-color-swatch"
                type="color"
                value={style.brandTextColor}
                onChange={(e) => onStyleChange({ brandTextColor: e.target.value })}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <Input
                value={style.brandTextColor}
                onChange={(e) => onStyleChange({ brandTextColor: e.target.value })}
                className="font-mono-code text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SliderField
          label="Font size"
          value={style.fontSize}
          min={10}
          max={18}
          step={1}
          suffix="px"
          onChange={(v) => onStyleChange({ fontSize: v })}
        />
        <SliderField
          label="Cell padding"
          value={style.cellPadding}
          min={0.25}
          max={1.5}
          step={0.05}
          suffix="em"
          onChange={(v) => onStyleChange({ cellPadding: v })}
        />
        {pageType === "tournament" && (
          <>
            <SliderField
              label="Panel padding"
              value={style.containerPadding}
              min={0.25}
              max={1.5}
              step={0.05}
              suffix="em"
              onChange={(v) => onStyleChange({ containerPadding: v })}
            />
            <SliderField
              label="Scroll max-height"
              value={style.maxHeight}
              min={10}
              max={40}
              step={1}
              suffix="em"
              onChange={(v) => onStyleChange({ maxHeight: v })}
            />
          </>
        )}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="font-normal">{label}</Label>
        <span className="font-mono-code text-xs text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
