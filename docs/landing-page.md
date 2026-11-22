# Landing Page (`apps/landing-page`)

The public marketing site, built to match the Figma file **"Fleet Pro (Landing Page)"**
(`JakSWfBz5JgHM4NKaGMvfL`, page "Landing page") at 1440px wide, and responsive below that.
Brand copy follows the design ("FleetPro" / "Fleet Pro Enterprise").

It is a **Next.js 16** app (App Router) with `reactCompiler` and `output: "export"` (see
`next.config.ts`). React 19, Tailwind v4 via PostCSS, zod 4. Every page prerenders at build
time into `out/`, which nginx serves as static files; nothing renders per request. Cache
Components and Partial Prefetching are off because export mode rejects their PPR runtime.

Runs on `http://localhost:3000` (`pnpm dev:landing`, which is `next dev -p 3000 -H ::`).
`pnpm --filter landing-page build` then `pnpm --filter landing-page start` serves the
static export on the same port. Deploying is covered in
[landing-deploy.md](landing-deploy.md).

Next 16 differs from older Next versions. Its docs ship in the package at
`apps/landing-page/node_modules/next/dist/docs/`. Read the relevant guide there before using
an API you are unsure of. For example, `next/image` takes `preload`, not `priority`.

## Structure

The layout follows `elvis-business/main-frontend`:

```
src/
  app/                    route files + metadata files ONLY
    layout.tsx            fonts, root metadata, Organization/WebSite JSON-LD, site shell
    page.tsx              home
    not-found.tsx
    product/[slug]/  solutions/[slug]/  stalkholder/[slug]/  roles/[slug]/  resources/*/
    sitemap.ts  robots.ts  manifest.ts  opengraph-image.tsx  apple-icon.tsx  icon.jpg
  proxy.ts                dev-only 404 guard for unknown [slug] URLs
  features/<feature>/
    page/<X>Page.tsx      the page body (one per page type)
    components/           pieces used only by this feature
    utils/<x>Content.ts   copy, icons and images (per slug for templated pages)
    utils/<x>Slugs.ts     X_SLUGS + XSlug type for templated pages (no imports)
    hooks/  schemas/
  shared/
    components/           shared PascalCase components at the top level, plus
      layout/             SiteHeader, MegaMenu, MobileMenu, SiteFooter, PageHero, ContentSheet…
      sections/           CtaBand, CtaButtons, FaqAccordion, SupportPill, BandSection…
      icons/  providers/  shadcn/
    hooks/  stores/  utils/ (cn, routes)
    seo/                  site.ts, metadata.ts, JsonLd.tsx, BrandMark.tsx
    env/                  type-envgen output (env.ts) + barrel
    global.css            design tokens
```

- Components are PascalCase `.tsx` files with **named exports**. Only `src/app` files use
  default exports.
- Hooks are `useX.ts`. Other `.ts` files are camelCase.
- Imports use the full `@/…` path to the exact file and are never relative. The only barrels
  are `@/shared/utils` (`cn`), `@/shared/env` and `@/shared/components/providers`.
- `src/shared/utils/routes.ts` holds `routes` and every nav and footer link list. It is the
  single source of truth for URLs. `app/sitemap.ts` is derived from it, so a new route is
  listed automatically.

### Routes and page types

An `app/**/page.tsx` file is thin. It imports the page component, sets metadata with
`pageMetadata({ title, description, path })` from `@/shared/seo/metadata` (or with
`generateMetadata`), and default-exports the page.

| Feature (`src/features/…`) | Page component | Content | Routes |
|---|---|---|---|
| `home/` | `HomePage` | `homeContent.ts` | `/` |
| `stakeholders/` | `StakeholderPage` | `stakeholderContent.ts` | `/stalkholder/[slug]` |
| `roles/` | `RolePage` | `roleContent.ts` | `/roles/[slug]` |
| `products/` | `ProductPage` | `productContent.ts` | `/product/[slug]` |
| `solutions/` | `SolutionPage` | `solutionContent.ts` | `/solutions/[slug]` |
| `resources/` | `DocumentationPage`, `FaqsPage`, `HelpArticlesPage` | `resourceContent.ts` | `/resources/*` |

Pages that share a layout in Figma share one page component. `utils/<x>Slugs.ts` exports
`X_SLUGS` (`as const`) and the `XSlug` type. The content module keys its data by
`Record<XSlug, XPageData>` and exports `getXContent(slug): XPageData | null`. Per-page differences are
expressed in that data, not in new components. A page component renders a section only when
its data is present. Per-frame spacing differences use optional `classNames` / `bands`
fields, not forks of the component. These `utils/<x>Content.ts` files are the agreed exception
to the "no data files" rule in [file-structure.md](file-structure.md).

### Dynamic routes

A dynamic route must:

- return every slug from `generateStaticParams`
- call `notFound()` for an unknown slug
- read `params` only inside a `<Suspense>` child, never in `Page` itself. `Page` renders
  `<Suspense><XRoute params={params} /></Suspense>`, and the non-exported `XRoute` in the same
  file awaits `params` and renders the page component. `generateMetadata` may await `params`.
  Each slug is emitted as its own HTML file.

Unknown slugs produce no file under `out/`, so nginx answers a real **404**. `src/proxy.ts`
rewrites unknown slugs to an unmatched path for `next dev`; the static export never runs it.

`app/product/[slug]/page.tsx` is the worked example.

## Rendering rules

The site should not render anything it doesn't need to:

1. **Server Components by default.** Add `"use client"` only to a file that has state,
   effects, event handlers or an interactive Radix primitive. Never pass a function or a
   component reference (such as an icon) from a Server Component into a Client Component prop.
   Pass strings, numbers and plain objects, or render the icon on the server and pass it as
   `children`.
2. **Icons** come from `@phosphor-icons/react/dist/ssr` and `lucide-react`.
3. **Page components.** A slug page component takes **only** `slug: string` and looks its
   content up synchronously inside. Content objects hold icon components, which are not
   serialisable, so never pass a content object through a Client Component boundary.
4. **React Compiler** is on and memoises every client component. Don't write `useMemo`,
   `useCallback` or `memo` by hand. Effects list their real dependencies. Never disable
   `exhaustive-deps`.
5. **Dialogs** (Get Started, Contact) are mounted once, in
   `shared/components/providers/DialogHost.tsx`, which code-splits them and loads each on its
   first open. To open one, render `<DialogTrigger dialog="get-started" | "contact">`
   (`@/shared/components/DialogTrigger`). It renders its own `<button>`, which you style with
   `buttonVariants` from `@/shared/components/shadcn/button-variants`. Never use Radix `Slot`
   or `<Button asChild>` in a Server Component with server-rendered children, because it
   hydrates differently from the server HTML. The trigger writes to
   `shared/stores/dialogStore.ts` and holds no state. The host is the
   store's only subscriber, so opening a dialog re-renders nothing else.
   `<DialogTrigger dialog="get-started" intent="returning">` opens the wizard for a returning
   (existing MTN) customer (see [Apply wizard](#apply-wizard-get-started)).
6. **Header.** The desktop mega menu is CSS-only. `MobileMenu` is the header's only client
   island.
7. **Images** use `next/image` with an explicit `width`/`height`, or `fill` + `sizes`. The
   above-the-fold LCP image gets `preload`. Public assets live in `public/brand/*` and
   `public/images/*`. The static export sets `images.unoptimized`, so the original file is
   served — size it for the rendered box instead of relying on Next's image optimiser.

## Apply wizard (Get Started)

`features/get-started/` is the "Apply for Account Creation" dialog. `/?apply=1` opens it too:
`DialogHost` turns the param into an open wizard (intent `"new"`) and strips it from the URL.

The main app has the same flow as a public page, `/apply` (`apps/main/src/features/apply/`),
which its sign-in page's "Apply for one" links to. Both run the same steps, fields and
onboarding-applications calls, so **change both apps together**: `schemas/applySchemas.ts` and
`utils/applyTypes.ts` here are copies of main's `utils/applySchemas.ts` and `utils/applyTypes.ts`.

### Flow

It runs the onboarding-applications API calls (`@truckmoov/api/auth`). The steps are:

1. customer type
2. details and M2M plan
3. email code
4. phone code
5. fleet (vehicles and device requests)
6. documents
7. review / submit
8. status
9. payment
10. installation scheduling

The orchestrator is `GetStartedDialog.tsx`, a port of main's `ApplyForAccount.tsx`; each
step component names the main component it mirrors. The look follows the Figma Get Started dialog:
- `StepLayout` + `DialogFooter` for each step
- `SubDialog` for nested dialogs
- the class recipes in `utils/getStartedContent.ts`
- native `<select>` and `CityInput` (a datalist of `CITIES_BY_STATE`)

### Resume

Progress is kept in this browser so the applicant can come back to the step they stopped at.

| Where | What |
|---|---|
| localStorage `truckmoov_onboarding_token` | draft token (`setOnboardingTokenStorage("local")` in `GetStartedHost`) |
| localStorage `truckmoov_landing_apply_*` | application id, customer type, current step, step 1 fields typed before the application exists, `saved_at`, and the persisted zustand store (`_draft`: plan, returning flag, device fulfilment, installation form) |
| IndexedDB `truckmoov_landing_apply` / `files` | `doc:<slot>` (uploads that failed on network or 5xx, retried from the Documents step) |

All of it goes through `utils/applyDraftStorage.ts` and `utils/draftFiles.ts`.

Entry points (`dialogStore.open("get-started", intent)`):

- **Apply for Account Creation** (`intent: "new"`): starts fresh. If a draft is saved, it
  first asks "Continue my application" or "Start a new application".
- **Apply as Returning Customer** (`intent: "returning"`): the applicant is an **existing MTN
  customer**, not someone resuming a draft. See [Returning customers](#returning-customers).
  A draft already saved in this browser still resumes.
- `DialogHost` reopens the wizard in resume mode (`intent: "resume"`) on page load in two
  cases. A resume rehydrates the saved draft: the server stage decides payment,
  installation or status; otherwise the stored step, never past the first unfinished step:
  - a resume link `?token=…&applicationId=…`, which is adopted and then stripped from the
    URL;
  - the payment provider's return, `?payment=return`.

  `PaymentStep` sends `redirectUrl` = the current page + `?payment=return`.

Cleanup:

- **`clearApplyDraft()`** removes every key above and deletes the IndexedDB database. It
  runs when installation is booked or the applicant goes to sign in, on "Start a new
  application", and when the draft is dead. A draft is dead after a 404 from the API or
  when `saved_at` is more than 30 days old, matching the server's idle expiry.
- **`clearSubmittedDraft()`** runs on submit. It drops the step 1 draft and all IndexedDB
  files, which are now on the server, but keeps the token and id so status, payment and
  installation can resume.
- Closing the dialog never clears anything.

### Returning customers

The wizard follows the design app's two entries: **Apply for Account Creation** (new) and
**Returning Customers**, meaning an existing MTN customer (`intent: "returning"` here,
`/apply?returning=1` in main).

- The flag is persisted with the draft (`returning` in the draft store). A reload or a
  resume link keeps it.
- Returning changes two things. The heading copy becomes "Returning MTN customer
  onboarding", and the only required document is the **Customer Request Letter**
  (`RETURNING_DOCUMENTS` / `documentsForApplicant` in `utils/applyTypes.ts`).
- ponytail: client-side only. The API doesn't know about returning customers yet. It still
  lists every document in `missingDocuments`, so a returning submit can come back
  `incomplete` until the backend supports it.

### Where the design and the API differ

The forms follow the design app (`https://fleetflow-pro-fork.vercel.app`, `/apply`) field for
field.

**Dropped to match the design, though the API still expects them.** Submit shows the API's
`incomplete` message on Review until the backend catches up:

- the Indemnity Agreement section and its signature upload, which the API needs before submit
- Proof of Ownership on Documents (still in the API's `missingDocuments`). Vehicle licences
  are attached in Add Vehicle, as in the design.
- RC Number / TIN and ID Type / ID Number, which are optional server-side but feed
  automated approval
- "Save & Continue Later". Resume links from emails still work.

**Adapted to the API:**

- Customer Details' City and State are plain inputs. The state is normalised to the
  canonical name (`normalizeState` in `schemas/applySchemas.ts`).
- Installation scheduling keeps the state select, the city datalist and the API's time-slot
  select. The design uses free text and a clock time.
- Vehicle Type and Type of Purchase use the API's values. The design's Pickup, Other
  (vehicle type) and Rental have no API value.

**Built UI-only until the endpoint exists**, each marked `TODO(api)`:

- Device Fulfilment: the pickup store and area lists are empty, and the choice isn't sent
- the ID type on the identification card upload
- the quotation lines Delivery fee / Discount / Subtotal / VAT, shown only when the order
  returns them
- device-request edit, done as delete + add
- the Excel bulk-upload wizard: not built yet. It needs an xlsx parser, and adding one is
  undecided.

## SEO

- `shared/seo/site.ts` holds `SITE_NAME`, `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`),
  `DEFAULT_DESCRIPTION`, `THEME_COLOR` and `absoluteUrl()`.
- `pageMetadata()` sets the title, description, canonical URL, Open Graph and Twitter card for
  each page.
- Structured data goes through `<JsonLd data={…}>`. The root layout emits
  Organization/WebSite. The home page adds SoftwareApplication and an FAQPage built from
  `homeFaqs`.
- Metadata routes in `src/app` produce `/sitemap.xml`, `/robots.txt`,
  `/manifest.webmanifest`, `/opengraph-image` (1200×630) and `/apple-icon` (180×180). The
  generated images draw the logo tile with `shared/seo/BrandMark.tsx`.

## Environment

Variables are declared in `.env.example` and validated with zod by
[type-envgen](https://www.npmjs.com/package/type-envgen). The generated module
`src/shared/env/env.ts` is imported by `next.config.ts`, so a missing or invalid variable stops
`dev`, `build` and `start`. App code reads `env.X` from `@/shared/env` and never reads
`process.env` (the `node/no-process-env` lint rule enforces this).

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | the Get Started wizard's API calls (`@truckmoov/api`) |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap, Open Graph, JSON-LD |
| `NEXT_PUBLIC_MAIN_APP_URL` | main (tenant) app origin; `SIGN_IN_URL` (`shared/utils/routes.ts`) = `<it>/auth`, used by every Sign In button |

To add a variable:

1. Add it to `.env` (with its `# @type` comment) and to `.env.example`.
2. Run `pnpm env:generate` to regenerate `env.ts`. Do not edit `env.ts` by hand.

`pnpm env:check` fails when `env.ts` is out of date. `pnpm env:watch` regenerates it on every
save. Both variables are `NEXT_PUBLIC_*`, so they are inlined at build time. In CI they come
from the `LANDING_ENV` secret.

## Buttons

`buttonVariants(...)` in `src/shared/components/shadcn/button-variants.ts` runs its classes
through `cn` (tailwind-merge), so call it directly on links and dialog triggers. Don't use a bare
cva recipe. Without the merge, the base `rounded-[15px]`/`px-4` and the variant's `rounded-full`/`px-[…]`
all land on the element and CSS order picks the winner. That is how the CTAs ended up with an 8px radius.

Radii from Figma: `brand`, `onDark` and `pill` (Sign In, Contact Us, the Apply CTAs, the Contact
dialog) are full pills. The Get Started dialog buttons are 12px. The base button is 15px.

## Design tokens

Colours, type sizes and shadows come from Figma and live in `src/shared/global.css`. Never
use hex values in class names. Add a token instead.

- **Colour:** `text-heading` is the `#000` heading colour.
- **Type sizes:** `text-display` (60/60), `text-section` (50/45), `text-heading-md` (40/50), `text-title` (30/40), `text-subtitle` (24/36), `text-lead` (20/25), `text-2xs` (10/15).
  - Don't name a font-size token after an existing colour token. `text-heading` used to be both, and Tailwind resolved it as the colour.
  - Don't combine `leading-*` with these sizes at the same breakpoint, because it overrides the token's line height. Use `max-md:leading-tight` for the mobile override.
- **Fonts:** Instrument Sans (`font-sans`) and IBM Plex Sans (`font-plex`), loaded with `next/font/google` in `app/layout.tsx`.
- **Icons:**
  - Most Figma icon layers are named after Phosphor icons, so use `@phosphor-icons/react/dist/ssr`.
  - Layers named `li:*` are Lucide icons, so use `lucide-react`.
  - Figma's "Settings" is Phosphor `Gear` and "Map" is `MapTrifold`.

## Matching the design

1. Export the frames from Figma as PNG (1x) to use as references. Export them as SVG too, with "Outline text" off and "Include id" on, which gives exact text, positions and colours.
   - Exporting works with view-only access.
   - The REST API is rate-limited on the Starter plan, so use the browser export instead.
2. Screenshot the running page in headless Edge/Chrome at 1440px wide. Hide the scrollbar and the floating support pill, and force lazy images to load. In `next dev` the first request to a route compiles it, so retry if the first shot times out.
3. Pixel-diff the screenshot against the reference (e.g. `pixelmatch`, threshold 0.15) and fix by region. Render a side-by-side image (Figma | ours) and crop it to the region you are fixing.
4. What's left at the end is font antialiasing and photo resampling. The baseline is about 1.9% for inner pages and about 3.3% for home. A change that moves a page above its baseline has changed the visuals.
   - The home hero deliberately differs from Figma: it fills the screen below the header (`min-h-[calc(100dvh-5rem)]`, copy vertically centred), where Figma has it at 642px. To diff home, screenshot at a 1440×722 viewport, where the hero is exactly 642px tall.

## Content still to supply

`TODO(content)` and `TODO(api)` comments mark items the design doesn't provide:
- the Contact form's submit endpoint
- downloadable documentation files
- answers for the FAQ and help articles, beyond the one shown in the design
