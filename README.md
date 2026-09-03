# Table Formatter

A Next.js + TypeScript + Tailwind + shadcn/ui app that takes a raw HTML
table snippet, figures out whether it's an **MPP** table or a
**Tournament Page** table, and rewrites it with the correct brand
colors, structure, and inline styles — with a live preview and a
one-click copy of the final code.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000. This app has no backend and stores
nothing — everything happens in the browser.

## How it works

1. **Choose an input mode.** Use **HTML** for existing `<table>...</table>`
   markup, or **Word Table** for a table copied directly from Microsoft Word.
   Word mode accepts both Word's HTML clipboard output and tab-separated
   clipboard text.
2. **Detection.** With "Auto-detect" selected, the app looks for
   `<details>`/`<summary>`/`.tablescroll-accord` to identify a
   **Tournament Page** table, and falls back to **MPP** for a bare
   `<table>`. You can override this with the Tournament Page / MPP
   buttons if the auto-detect guesses wrong.
3. **Brand & vertical.** Pick a brand from the dropdown. Brands with more
   than one vertical (BetMGM, Borgata Online) show a second dropdown for
   Casino/Poker/Sports, since each has its own accent color. The correct
   `brand_color` / `brand_text_color` pair is applied automatically.
4. **Customize.** Override the table title, hand-pick colors (the color
   pickers start pre-filled with the brand's colors — edit them and hit
   **Reset** to snap back), and adjust font size, cell padding, and (for
   Tournament Page tables) the accordion panel padding and scroll
   max-height.
5. **Preview & copy.** The **Preview** tab renders the actual output in
   a sandboxed iframe loaded with Bootstrap, so it looks the way it will
   on the live page. The **Code** tab shows the final markup with a
   **Copy** button.

## What gets preserved vs. rewritten

The app parses your snippet's real DOM (via the browser's `DOMParser`)
rather than doing a blind find-and-replace, so it's tolerant of extra
whitespace, existing inline styles, or bold/strong text inside cells:

- **Preserved as-is:** the text/markup inside every header and body
  cell (so a `<strong>` around "Total:" or a link inside a cell survives
  untouched).
- **Rewritten:** the wrapping structure (`<details>`/`<summary>` vs.
  plain `<table>`), the `class` names, and every inline `color` /
  `background-color`, which are replaced with the selected brand's
  colors.
- **Scoped styling:** each generated snippet gets a unique id (e.g.
  `tf-a1b2c3`) and all of its `<style>` rules are scoped to that id, so
  pasting several formatted tables on the same page never lets their
  styles collide with each other or with the rest of the site.

## Error handling

If the pasted snippet has no `<table>` element at all, or a table with
no rows or header cells, the app shows an inline error explaining what's
missing instead of guessing — nothing is written to the preview/code
tabs until it can produce a real result.

## Project structure

```
app/                 Next.js app router entry (layout, page, globals.css)
components/
  TableFormatter.tsx   Top-level state + layout
  BrandSelector.tsx     Brand / vertical dropdowns
  CustomizationPanel.tsx Title, color, spacing controls
  PreviewPane.tsx        Sandboxed iframe live preview
  OutputPanel.tsx        Code view + copy button
  ui/                    shadcn/ui primitives (button, card, select, ...)
lib/
  brands.ts     Brand → color lookup table (edit this to add/adjust brands)
  parser.ts     Detects page type and extracts table content from the DOM
  formatter.ts  Renders the final MPP / Tournament Page markup
types/index.ts  Shared TypeScript types
```

## Adding or editing a brand

Everything about brand colors lives in `lib/brands.ts`. Each brand has
one or more "categories" (verticals), each with a `color` and `text`
hex value:

```ts
{
  key: "betmgm",
  name: "BetMGM",
  categories: {
    "Casino, Arcade & Sports": { color: "#d4b962", text: "#000000" },
    Poker: { color: "#00a35b", text: "#ffffff" },
  },
}
```

A brand with a single `Default` category (like PartyCasino) skips the
vertical dropdown automatically.

## Adjusting the output templates

The actual markup generation lives in `lib/formatter.ts` in two
functions' worth of template literals — one branch for `"tournament"`,
one for `"mpp"`. Both take a `ParsedTable` (extracted content) and a
`StyleOptions` object (colors + spacing) and return the final HTML
string. If the target templates change, that's the only file you need
to touch.
