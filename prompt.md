## Project Brief — MedInterp Portal

### What this is
A static website hosted on GitHub Pages (no backend, no build step) serving as a **reading and learning reference tool** for ~200 Russian–English medical interpreters. It is not a real-time lookup tool. Interpreters use it to study terminology before or between assignments.

---

### Audience
Medical interpreters translating between English and Russian in clinical settings. They encounter terms in the context of patient encounters — a doctor ordering a procedure, describing a condition, referencing anatomy. The tool is organized to match that encounter context.

---

### Information architecture

**Two-level navigation** (deliberately simplified from a three-level plan):

```
Home (category grid)
  └── Category page (e.g. Cardiac)
        └── Sections rendered as tabs on the same page
```

There is no third-level page. A category page IS the content page — sections within it are tabs, not separate pages.

**Three-level data hierarchy** (in the JSON/folder sense):
```
Category (e.g. Cardiac)
  └── Type/Section (e.g. Anatomy, Conditions…)
        └── Term cards
```

---

### Why types are universal across categories
Early discussion considered making subcategories domain-specific (e.g. Neurology → Spine / Psychiatric). This was rejected. The correct level-2 axis is **type of term**, not subspecialty — because interpreters encounter terms by type ("doctor is describing a procedure"), and this keeps the structure uniform across all domains.

The five types that apply to every category:
- `anatomy`
- `conditions`
- `procedures`
- `devices`
- `pharmacology`

Not every category needs all five files — only create what exists.

---

### File/folder structure

```
data/
├── index.json              ← manifest: lists all categories and their available types
├── cardiac/
│   ├── anatomy.json
│   ├── conditions.json
│   ├── devices.json
│   ├── pharmacology.json
│   └── procedures.json
└── pulmonary/
    ├── anatomy.json
    ├── conditions.json
    ├── devices.json
    ├── pharmacology.json
    └── procedures.json
```

Currently only `cardiac` and `pulmonary` exist. More categories will be added later using the same pattern.

`index.json` shape:
```json
[
  {
    "id": "cardiac",
    "label": "Cardiac",
    "description": "Heart and vascular system",
    "types": ["anatomy", "conditions", "procedures", "devices", "pharmacology"]
  }
]
```

---

### JSON schema

**Section file** (e.g. `cardiac/anatomy.json`):
```json
{
  "intro": "Short 1–2 sentence description of what this section covers. Optional.",
  "reading": "Longer background explanation, e.g. how the heart works. Optional. Plain prose.",
  "terms": [ ...array of term objects... ]
}
```

**Term object**:
```json
{
  "en": "Aorta",
  "ru": "Аорта",
  "example_en": "The aorta carries oxygenated blood from the heart.",
  "example_ru": "Аорта переносит насыщенную кислородом кровь от сердца.",
  "note": "Interpreters often hear 'aortic' as the adjective form.",
  "image": "https://..."
}
```

All fields except `en` and `ru` are optional. `image` is a URL (no local image hosting). `note` is specifically an interpreter-context note — usage tips, common confusions, shorthand, adjective forms, etc. — not a medical definition.

---

### What exists now

**`home.html`** — fully built skeleton home page:
- Catppuccin Macchiato color palette (full CSS variable set defined)
- Sticky navbar: logo `MedInterp / EN–RU` + buttons: Home (active), Glossary, Resources, About
- Content capped at 750px max-width, centered
- Category grid using `auto-fill minmax(190px, 1fr)` — collapses to 2-col on mobile
- Six placeholder category tiles (Cardiac, Pulmonary, Neurology, Dentistry, Orthopedics, Oncology) — only Cardiac and Pulmonary have real data so far
- Mobile responsive at 600px breakpoint

**Data files** — not yet populated with real content. Schemas finalized (above), files created, content to be filled in.

---

### What does NOT exist yet

- `category.html` — the category page (e.g. Cardiac), which will show:
  - Breadcrumb: `Home › Cardiac`
  - Category title + description
  - Five section tabs (Anatomy / Conditions / Procedures / Devices / Pharmacology)
  - Per-tab content: `intro` block, `reading` block, then a list of term cards
  - Term card renders: EN term + RU term (visually distinct color), example EN, example RU, optional note, optional image
- JavaScript to fetch JSON and render pages dynamically
- `index.json` populated
- Any real term data in the JSON files

---

### Design system

**Color palette:** Catppuccin Macchiato. All variables already defined in `home.html`. Key semantic uses:
- `--base` (`#24273a`): page background
- `--mantle` (`#1e2030`): navbar, secondary card backgrounds
- `--surface0` (`#363a4f`): primary card/tile backgrounds
- `--surface1` (`#494d64`): borders, dividers
- `--text` (`#cad3f5`): primary text
- `--subtext0` (`#a5adcb`): secondary/meta text
- `--mauve` (`#c6a0f6`): active states, primary accent
- `--blue` (`#8aadf4`): links
- `--teal` (`#8bd5ca`): Russian term text (visually distinguishes RU from EN)
- `--peach` (`#f5a97f`): interpreter notes
- `--lavender` (`#b7bdf8`): section labels, reading block headings

**Typography:** `'Segoe UI', system-ui, -apple-system, sans-serif` — no external font dependency.

**Layout:** 750px reading width. Navbar is full-width but content is capped. No sidebar.

---

### Constraints
- GitHub Pages only — purely static, no server, no database
- No frameworks (no React, no Vue) — plain HTML/CSS/JS
- No npm, no build pipeline
- JS will use `fetch()` to load JSON files at runtime
- One HTML file per page type (`home.html`, `category.html`) — JS handles all rendering from JSON
