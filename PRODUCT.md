# SpennyPiggy Product & Design System Specifications

## 1. Design System Rules (STRICT BORDER RADIUS & STYLING)

All UI surfaces across the web application and PWA MUST strictly adhere to the SpennyPiggy Design System:

### Border Radius Rules (STRICT — No arbitrary or intermediate radii)

| Element Category | Radius Token | Value | Tailwind Class | Examples |
|---|---|---|---|---|
| **Large Containers** | `radius-lg` | **`30px`** | `rounded-[30px]` | Cards, Panels, Modals, Hero containers, Large tiles, Outer PWA prompts, Content cards |
| **Small Elements** | `radius-sm` | **`20px`** | `rounded-[20px]` | Inputs, Buttons, Search bars, Badges, Chips, Pills, Dropdowns, Action items, Small boxes |
| **Circles** | `radius-full` | `50%` | `rounded-full` | Avatars, Status indicators, Circular icon-only buttons |

> ⚠️ **STRICT RULE:** Do NOT use `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-lg`, or arbitrary intermediate values like `rounded-[25px]` / `rounded-[15px]`. Snap all large containers to `30px` and small elements/controls to `20px`.

---

## 2. Color Palette & Typography

- **Brand Mint Background:** `#A2E4B8` (Page background for main surfaces)
- **Dark Surface:** `#16161C` or `#000000` (Cards, PWA panels, Modals)
- **Primary Pink Accent:** `#FF007F` (CTAs, Active states, Badges, Highlights)
- **Primary Teal Accent:** `#05EFB8` (PWA status bar, Theme color, Highlights)
- **Display Typography:** `Anton` (`font-anton`), Uppercase
- **Body Typography:** `Poppins` / Sans-serif (`font-sans`)

---

## 3. PWA (Progressive Web App) Specifications

- **Theme Color:** `#05EFB8`
- **Background Color:** `#000000` (Dark background for splash screen to prevent white flash)
- **Display Mode:** `standalone`
- **Service Worker:** `/service-worker.js` (Unified MagicBell push notifications + Workbox offline asset pre-caching)
- **Offline Fallback:** `/offline.html` (Branded offline page with 30px container / 20px buttons)
- **Install Prompt:** `PwaInstallPrompt.jsx` (Automatic Chrome `beforeinstallprompt` + iOS 3-step manual install instructions)
