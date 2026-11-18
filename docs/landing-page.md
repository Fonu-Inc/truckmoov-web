# Landing Page (`apps/landing-page`)

The public marketing site, built to match the Figma file **"Fleet Pro (Landing Page)"**
(`JakSWfBz5JgHM4NKaGMvfL`, page "Landing page") at 1440px wide, and responsive below that.
Brand copy follows the design ("FleetPro" / "Fleet Pro Enterprise").

Runs on `http://localhost:3000` (`pnpm dev:landing`).

## Structure

```
src/
  index.css            design tokens (colours, type scale, shadows, utilities)
  router.tsx           every route; inner pages are lazy-loaded; `*` → not-found
  lib/app-links.ts     `routes` + every nav / footer link list (single source of truth)
  ui/
    shadcn/            this app's own shadcn primitives (see file-structure.md)
    components/        shared building blocks + one folder per page template
    pages/             data-only pages, grouped by section
```

### Page templates

Pages that share a layout in Figma share one template component. A page file only passes
its data to the template; the data lives in a sibling `*-data.ts` file (the
`react-refresh/only-export-components` lint rule forbids exporting constants from component
files).

| Template (`src/ui/components/…`) | Pages (`src/ui/pages/…`) | Routes |
|---|---|---|
| `home/` (one component per section, `home-data.ts`) | `home.tsx` | `/` |
| `stakeholder-layout/` | `stakeholders/*`, `roles/*` (`stakeholders-data.ts`, `roles-data.ts`) | `/stalkholder/*`, `/roles/*` |
| `product-layout/` | `products/*` (`products-data.ts`) | `/product/*` |
| `solution-layout/` | `solutions/*` (`solutions-data.ts`) | `/solutions/*` |
| `resources/` (`resource-page.tsx` + parts) | `resources/*` (`resources-data.ts`) | `/resources/*` |

A template renders a section only when its data is present, so per-page differences are
expressed in data, not in new components. Per-frame spacing differences use optional
`classNames` / `bands` fields rather than forks of the template.

### Shared building blocks (`src/ui/components/`)

- `layout.tsx`: the site shell. It renders the fixed 80px `nav-bar/` (with mega menu and mobile menu), the page, `cta-band.tsx` ("Ready to Optimize…"), `footer.tsx` and the floating `support-pill.tsx`. Pages never render these themselves.
- `page-hero.tsx` + `content-sheet.tsx`: the dark inner-page hero, and the white body that overlaps it with 50px rounded corners.
- `section-container.tsx`: a full-width band around the 1200px `page-container` column.
- `section-header.tsx`: eyebrow, title and description.
- `feature-card.tsx`, `media-card.tsx`, `icon-chip.tsx`, `card-grid.tsx`, `explore-link.tsx`, `faq-accordion.tsx`, `dark-backdrop.tsx`: the recurring card, grid and backdrop pieces.
- `cta-buttons.tsx`: the "Apply for Account Creation" / "Apply as Returning Customer" pair. Both open the Get Started wizard.
- `contact-dialog/`: the Contact Us form. It is used by the nav, the mobile menu and the support pill.
- `get-started/`: the onboarding wizard, which calls the real API (`@truckmoov/api/auth`).

## Design tokens

Colours, type sizes and shadows come from Figma and live in `src/index.css`. Never use hex
values in class names. Add a token instead.

- **Colour:** `text-heading` is the `#000` heading colour.
- **Type sizes:** `text-display` (60/60), `text-section` (50/45), `text-heading-md` (40/50), `text-title` (30/40), `text-subtitle` (24/36), `text-lead` (20/25), `text-2xs` (10/15).
  - Don't name a font-size token after an existing colour token. `text-heading` used to be both, and Tailwind resolved it as the colour.
  - Don't combine `leading-*` with these sizes at the same breakpoint, because it overrides the token's line height. Use `max-md:leading-tight` for the mobile override.
- **Fonts:** Instrument Sans (`font-sans`) and IBM Plex Sans (`font-plex`), loaded in `index.html`.
- **Icons:**
  - Most Figma icon layers are named after Phosphor icons, so use `@phosphor-icons/react`.
  - Layers named `li:*` are Lucide icons, so use `lucide-react`.
  - Figma's "Settings" is Phosphor `Gear` and "Map" is `MapTrifold`.

## Matching the design

1. Export the frames from Figma as PNG (1x) to use as references. Export them as SVG too, with "Outline text" off and "Include id" on, which gives exact text, positions and colours.
   - Exporting works with view-only access.
   - The REST API is rate-limited on the Starter plan, so use the browser export instead.
2. Screenshot the running page at 1440px wide with the scrollbar and the floating support pill hidden, and with lazy images forced to load.
3. Pixel-diff the screenshot against the reference (e.g. `pixelmatch`, threshold 0.15) and fix by region. What's left at the end is font antialiasing and photo resampling, typically ≤5%.

## Content still to supply

`TODO(content)` and `TODO(api)` comments mark items the design doesn't provide:
- the Contact form's submit endpoint
- downloadable documentation files
- answers for the FAQ and help articles, beyond the one shown in the design
