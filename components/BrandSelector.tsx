"use client";

import { BRANDS, getBrand, getCategoryKeys } from "@/lib/brands";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  brandKey: string;
  categoryKey: string;
  onBrandChange: (key: string) => void;
  onCategoryChange: (key: string) => void;
}

export function BrandSelector({
  brandKey,
  categoryKey,
  onBrandChange,
  onCategoryChange,
}: Props) {
  const brand = getBrand(brandKey);
  const categories = getCategoryKeys(brand);
  const showCategoryPicker = categories.length > 1;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="brand-select">Brand</Label>
        <Select value={brandKey} onValueChange={onBrandChange}>
          <SelectTrigger id="brand-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BRANDS.map((b) => (
              <SelectItem key={b.key} value={b.key}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category-select">Vertical</Label>
        <Select
          value={categoryKey}
          onValueChange={onCategoryChange}
          disabled={!showCategoryPicker}
        >
          <SelectTrigger id="category-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
