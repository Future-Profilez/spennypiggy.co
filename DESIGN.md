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

## Typography
- Display / headlines: **Anton** (`font-anton`), uppercase, tight tracking.
- Body / labels: default sans.

## Elevation & borders
- Dark surfaces: hairline border `border-white/10`, soft shadow (`shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)]`). No hard black offset shadows.
- On mint, dark cards provide their own contrast — avoid heavy borders.

## Motion
- framer-motion, always gated by `useReducedMotion()`. Subtle > loud.

## Applies to
Discover page is the reference implementation. Extend the same rules to any redesigned surface.
