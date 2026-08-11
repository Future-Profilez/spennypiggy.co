---
target: homepage
total_score: 17
max_score: 32
na_heuristics: 7,9
p0_count: 2
p1_count: 4
timestamp: 2026-08-11T07-03-03Z
slug: resources-js-pages-welcome-jsx
---
Method: dual-agent (A: a90a7b4a5670f1a41 · B: ab83c1dc68a2ea873)

## Design Health 17/32 (53%, Acceptable) — h7 & h9 n/a (Persuade surface)
1 Visibility 1 · 2 Match 3 · 3 Control 1 · 4 Consistency 1 · 5 Error prevention 2
6 Recognition 2 · 7 n/a · 8 Aesthetic 1 · 9 n/a · 10 Help 3

## Audit Health 10/20 (Acceptable)
A11y 2 · Perf 2 · Responsive 2 · Theming 1 · Implementation integrity 3

## Design specificity
Voice in three sections (WaysToGetPaid, StablecoinTips, PayByBank), stock template in
seventeen. One anatomy — eyebrow pill / font-gulfs h2 with one pink word / subhead /
3 cards / centred pill CTA / dim footnote — repeated 11 times.

## Priority issues (state at time of critique)
P0 Three overlays on first paint; PWA prompt copy said "tribute" / "request payment 👀"
P0 CustomPricingNote CTA rendered rgb(0,0,0) on a near-black canvas (band-era rationale)
P1 ChapterNav observed nothing — "Proof" active at all 9 measured scroll positions
P1 Middle third restates itself: act-earn is 5,507px (32% of page); product list appears 4x
P1 8 malformed class strings shipping dead utilities; LiveBar textclassName never read
P1 Single Suspense over 18 sections behind an 80px fallback (CLS + serialised chunks)
P2 Contrast: swipe cue 2.48:1, white-on-pink 3.78:1, white-on-violet 4.44:1
P2 Theming: 64 non-token radii vs 8 token uses; two violets; one-digit-off yellow

## Verdicts
Content compliance CLEAN (zero banned vocabulary in live user-facing copy).
Build integrity CLEAN (3 static scanners pass).
Rhythm: page has no shape — one continuous dark canvas for 15,374px of 17,165px.

## Open, NOT addressed by the polish pass
Information architecture: ReferEarn duplicates EarnMore card 3; FeatureShowcase
scroll-jacks 1,771px repeating WaysToGetPaid; "What is Spenny Piggy?" sits at position 11;
FeatureSuggestionSection asks a stranger for product management 2 sections before the close.
Testimonials all dated Oct-Nov 2023. Header currency pill reads "N/A". #features tab is a
dead link. Nine CTAs, four labels for one register action.
