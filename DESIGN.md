# SpennyPiggy — Design System Rules

> Single source of truth for visual consistency. Follow these on every new/redesigned surface. If code and this doc disagree, fix the code.

## Background
- **Page background is always brand mint: `#A2E4B8`.** Do not use a full dark page background.
- Content sits on the mint in **cards/panels** (dark or light surfaces), never edge-to-edge tinted sections.

## Border radius (STRICT — no other radii)
Only two radius values across the product:

| Token | Value | Use on |
|---|---|---|
| **Large** | `30px` (`rounded-[30px]`) | cards, tiles, panels, hero container, modals, dropdowns, any large container |
| **Small** | `20px` (`rounded-[20px]`) | inputs, search bar, chips/pills, buttons, badges, tags, small controls |

- **Circles stay circles** — avatars, status dots, icon-only round buttons use `rounded-full`. That is not a "radius" element.
- Do **not** use `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-lg`, or arbitrary values like `rounded-[25px]/[26px]`. Snap to 30 or 20.

## Color
| Role | Value |
|---|---|
| Background (mint) | `#A2E4B8` |
| Ink / text on mint | `#0B0B0F` (black) |
| Dark surface (cards/hero) | `#16161C` (text: white) |
| Light surface (inputs/chips) | `#fdfbf7` |
| Accent (primary) | `#FF007F` (pink) |
| Verified tick | `#3BA3FF` |

- **One accent only: pink `#FF007F`.** No yellow. Use pink for active states, CTAs, highlights.
- **Exception — semantic green.** The reward hint ("🎁 You get: …", `RewardHint.jsx`) uses emerald (`emerald-50` bg / `emerald-600` border / `emerald-700` text). It signals a positive "you receive something", not an interactive accent, so it is deliberately outside the pink rule.

## Typography
- Display / headlines: **Anton** (`font-anton`), uppercase, tight tracking.
- Body / labels: default sans.

## Elevation & borders
- Dark surfaces: hairline border `border-white/10`, soft shadow (`shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)]`). No hard black offset shadows.
- On mint, dark cards provide their own contrast — avoid heavy borders.

## Motion
- framer-motion, always gated by `useReducedMotion()`. Subtle > loud.

## Ink ramp (muted text) — 3 steps, no Tailwind grays
Tailwind's grays are cool/blue-tinted and clash with the mint + pink brand; `text-gray-400` also fails AA. Checkout previously mixed **nine** gray shades with four ink-alpha steps for the same roles. Use only:

| Role | Token | Contrast on white |
|---|---|---|
| Primary text | `text-black` | 21:1 |
| Secondary | `text-black/80` | 12.6:1 |
| Muted / small print | `text-black/60` | 5.74:1 |

`text-gray-*` is banned on payment surfaces. Below `/60` is banned everywhere for text.

## Elevation scale (hard offset shadows) — 4 steps
One language, always the 4-arg form `shadow-[Npx_Npx_0px_0px_rgba(0,0,0,1)]`:

| Step | Use |
|---|---|
| `2px` | pressed / active state |
| `4px` | controls — buttons, selectable options |
| `6px` | cards — context cards, method options at rest |
| `8px` | primary panel — the order receipt |

Borders: `border-2` hairline (fields), `border-[3px]` structural (cards, buttons). No other widths.

## Contrast (WCAG AA — non-negotiable)
- Body/secondary text on white bottoms out at **`text-black/60`** (5.74:1). `text-black/40` (2.85:1) and `text-black/50` (3.95:1) FAIL AA — never use them for text, including placeholders and 10–12px small print.
- Small print (≤12px) gets no exemption; it needs the same 4.5:1.

## Checkout control vocabulary (payment surfaces)
Import from `resources/js/Components/Checkout/` — never hand-roll a field or button on a payment screen. Eight checkouts previously invented their own (3 border treatments × 3 paddings × 3 focus rings); that is what these exist to prevent.

| Need | Use | From |
|---|---|---|
| Any input / textarea | `fieldClass` (or `TextField` / `TextAreaField`) | `Checkout/FormKit.jsx` |
| Field label / hint / error | `Label`, `FieldError` | `Checkout/FormKit.jsx` |
| Primary pay action | `PayButton` | `Checkout/SummaryReceipt.jsx` |
| Cancel / Back / Copy | `SecondaryButton`, `QuietButton` | `Checkout/FormKit.jsx` |
| Order summary (who/what/get/total) | `SummaryReceipt` | `Checkout/SummaryReceipt.jsx` |
| Who/what/get without a total | `OrderContextCard` | `Checkout/SummaryReceipt.jsx` |

- **Field recipe:** white bg, `border-2 border-black/15`, `rounded-box-sm`, `px-4 py-3 min-h-[44px]`, focus = `border-black` + `ring-4 ring-[#FF007F]/25`. One recipe, every surface.
- **Buttons are 20px controls, not 30px containers.** `.main-button`, `.size-lg` and `.btn-pink-md` were corrected to 20px + `min-h-[44px]`; keep them there.
- **Every checkout answers who / what / what-you-get / how much / what's next** before the pay button. The "What you get" panel is required, not decorative.
- **Display type is Anton, everywhere.** `font-gulfs` and `font-GillSans` were removed from checkout headings; never put a display face on a button or label.
- **One accent.** The Piggy Pot widget ran its own palette — `#e85d9a` (a near-miss pink on the *pay button*), `#FFD700`/`#f5c72f` gold, `#0d1b2a` navy, plus a pink/blue/yellow/green avatar cycle. All normalised to pink `#FF007F`, mint `#A2E4B8`, ink `#16161C`. States are told apart by weight (ink vs mint), never by inventing a hue.
- Semantic error text uses `#C81E5B` (harmonises with the brand pink) — the only colour outside the core palette, and only for validation messages.
- ⚠️ Legacy globals still off-system: `.y` (yellow — violates the one-accent rule) and `.b` (teal `#003D4F`, not in the palette). Not used on checkout; fix before reusing them anywhere.

## Applies to
Discover page is the reference implementation for general surfaces; the checkout components above are the reference for any payment screen. Extend the same rules to any redesigned surface.
