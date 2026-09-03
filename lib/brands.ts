export interface CategoryColors {
  color: string;
  text: string;
}

export interface Brand {
  key: string;
  name: string;
  /** Category label -> colors. A brand with only one entry has no visible category picker. */
  categories: Record<string, CategoryColors>;
}

export const BRANDS: Brand[] = [
  {
    key: "betmgm",
    name: "BetMGM",
    categories: {
      "Casino, Arcade & Sports": { color: "#d4b962", text: "#000000" },
      Poker: { color: "#00a35b", text: "#ffffff" },
    },
  },
  {
    key: "borgata",
    name: "Borgata Online",
    categories: {
      "Casino & Arcade": { color: "#1F00AE", text: "#ffffff" },
      Poker: { color: "#f47523", text: "#ffffff" },
      Sports: { color: "#5ac8e8", text: "#ffffff" },
    },
  },
  {
    key: "partycasino",
    name: "PartyCasino",
    categories: {
      Default: { color: "#f00a47", text: "#ffffff" },
    },
  },
  {
    key: "partypoker",
    name: "Party Poker",
    categories: {
      Default: { color: "#e8490d", text: "#ffffff" },
    },
  },
  {
    key: "wof",
    name: "Wheel of Fortune Casino",
    categories: {
      Default: { color: "#efe700", text: "#000000" },
    },
  },
  {
    key: "shared",
    name: "Shared",
    categories: {
      Default: { color: "#475eec", text: "#ffffff" },
    },
  },
];

export function getBrand(key: string): Brand {
  return BRANDS.find((b) => b.key === key) ?? BRANDS[0];
}

export function getCategoryKeys(brand: Brand): string[] {
  return Object.keys(brand.categories);
}
