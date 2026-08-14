# CLAUDE.md — spennypiggy.co (public platform)

This file loads when Claude Code works with files under this directory. It carries the
guidance specific to **this app only**.

**Read alongside the repository root `../CLAUDE.md`**, which holds the repo layout, the
shared-database rules, the development workflow, the Definition of Done, the UI conventions,
and everything spanning both apps. This file does not repeat any of it.

Guidance for the admin back office lives in `../admin.spennypiggy.co/CLAUDE.md` — do not copy it here.

## Unified reward contract — "what does the supporter get?" (24 July 2026, spennypiggy.co)

Every sellable item answers that question in **one shape**, and `App\Services\RewardService::for($item)` is the only implementation. Before this, each module answered it differently (wish read `content_file`, shop read `success_page_type`/`success_page_value`, task read `deliverable_content_type`) and **bills and memberships could not answer it at all** — a supporter paid and received nothing until the creator happened to post.

**Columns (migration `2026_07_24_100000`, all 7 item tables — `wish_items`, `bills`, `memberships`, `shops`, `tasks`, `piggy_pots`, `tip_goals`):** `reward_title` (varchar 60), `reward_type` (`file|message|link`), `reward_body` (message text or link URL), `reward_description`. Existing rows were backfilled to `'Exclusive reward'`; `App\Models\Concerns\HasRewardContract` applies the same fallback at read time. The migration also gave **bills** a `rewards` perks column (it had none) and **memberships** a `content_file` (+ type/name/size). Both apps' models carry the columns (shared DB).

- **`reward_body` is `$hidden` on every item model** — it *is* the paid deliverable when the reward is a message or link. Entitled surfaces opt back in with `revealReward()` (Shop's `withDeliverable()`/`entitledFor()` already do).
- ⚠️ **The owning creator is revealed automatically.** `HasRewardContract::bootHasRewardContract()` hooks `retrieved` and un-hides `reward_body` when `Auth::id()` matches the row's `user_id`/`creator_id`. Without it the edit form loaded with an empty message/link box and **silently wiped the content on save** — `$hidden` kept it out of the serialised item. Any new item model using this trait inherits the behaviour; do not remove it to "tidy up" the hidden list.
- **A buyer sees the reward headline before paying, never the body.** `Components/Reward/RewardSummary.jsx` renders `reward_title` + `reward_description` + type chip from the raw item columns (no server payload shape needed) — used on the add-to-cart popup (`wishlist/AddCart.jsx`) and each basket row (`cart/CartItem.jsx`). The basket's "What you get" list names each item's reward instead of the old generic "everything in your basket". The cart payload in `WishitemController` carries `reward_title`/`reward_type`/`reward_description` (and `user.avatar_url`, which it was missing entirely — the basket rendered a letter tile for every creator).
- **`RewardService::for()` prefers the new columns and falls back to each module's legacy ones**, so nothing had to be migrated for existing listings to render. It returns `{module, title, type, description, media{url,kind,mime,name,size}, text, link, perks[], is_recurring, post_access, is_instant}`.
- **Bills and Memberships are different products, and the perks list is what separates them.** Both are recurring and both grant subscriber/member-only post access, but a **Bill sells ONE content stream** (weekly/monthly/yearly, no tiers, **no perks list**) while a **Membership sells tiers** (bronze→lifetime) **with** a perks bundle. Bills were briefly given perks during this work and the two products became indistinguishable — do not re-add them. There is no separate `bundle` reward type: a recurring item is a one-off reward with more attached, flagged `is_recurring`.
- `RewardService::hasOnPlatformPerk()` enforces the Stripe ≥1-on-platform-benefit rule for **memberships only**. A Bill meets it structurally instead: it cannot be published without a subscriber-only post, and `EnforcePostingCadence` pauses collection if the creator stops posting.
- `RewardEditor` takes `showPerks` (defaults to `recurring`) plus `postAccessLabel`/`ongoingLabel` — Bills pass `showPerks={false}` and "Subscriber-only posts".
- **Config is single-source:** `config/rewards.php` (server) and `resources/js/constants/rewards.js` (client) — accepted MIME list, kind map, title/message limits, perk catalogue. Every uploader reads the shared list; the hardcoded per-form `accept` strings are gone.
- **Links:** https only, shorteners rejected (`RewardService::linkError()`) — a shortener hides the destination from both moderation and the supporter.
- **A physical shop product has no digital reward** — its deliverable is the parcel and its name already describes it, so the form never asks for a second headline. `reward_title` is `required_unless:type,physical` on shop, and `ShopsController::shopRewardColumns()` fills it from the product name. Requiring it unconditionally blocked every physical listing with "The reward title field is required".
- ⚠️ **Checkout cards take `avatar_url`, never `avatar`.** `users.avatar` is a bare Uploadcare uuid; the display URL is the appended `avatar_url`. Every checkout passed the raw column, so all of them rendered a broken-image tile. `SummaryReceipt`/`OrderContextCard` now resolve a bare uuid to a CDN URL themselves, so a wrong prop degrades to a picture rather than a broken icon.
- **Every checkout surface names the reward.** `rewardLines(item)` (in `constants/rewards.js`) returns `[reward_title, reward_description]` and is prepended to the `whatYouGet` list on all payment screens — shop, task, piggy pot, wish/subscription, bill, membership, basket. It never includes `reward_body`.
- **Controllers share the rules:** `RewardService::validationRules()` + `fileRule()` (`required_unless:reward_type,message,link` — a file is only mandatory when the reward *is* a file) + `columnsFrom()`/`columnsWithFile()` for persistence, wired into wish/shop/task/pot/bill/membership save+edit. `reward_title` is validated with `NoExpenseOrBrandName` everywhere. Shop **derives** its legacy `success_page_type`/`success_page_value` from the reward so the order screens keep working — do not ask the form for both.

- **A timed Paid Task cannot offer a "file" reward.** Its deliverable is custom work handed over later via escrow/proof, and the download route is not gated on task type — a pre-uploaded file would be downloadable the moment the buyer pays, before delivery. `RewardEditor` takes `allowedTypes` (Tasks pass `["message","link"]` when `type !== 'instant'`), the task-type toggle resets a `file` reward to `message`, and the editor coerces an out-of-range type so a legacy `file` row never renders with nothing selected.
- ⚠️ **`columnsWithFile()` reads the file columns off the request, so a partial edit that omits `content_file` would wipe the paid file.** `WishitemController::updateWishItem` therefore `$request->merge()`s the safe fallback (existing file for a file reward, null for a message/link reward) BEFORE calling it. PiggyPot uses `columnsWithFile()` too so switching a pot away from `file` clears the stale `content_file`.
- **`RewardService::hasOnPlatformPerk()` is the single enforcement of the membership on-platform-content rule** — `MembershipController::hasOnPlatformContent()` delegates to it rather than keeping a second copy of the perk list.
**Creator UI:** `Components/Reward/RewardEditor.jsx` (title, type toggle, uploader/textarea/link, perks + post-access for recurring) with `RewardPreview.jsx` beside it rendering the *supporter's* component live. Buyer UI: `Components/Reward/RewardBlock.jsx` + `RewardMedia.jsx` (video uses `LazyVideo` — no autoplay, `preload="none"`).

**Add-item shell:** `Components/Sheet.jsx` (mobile full-screen bottom sheet with drag-to-dismiss + safe areas, desktop `max-w-*` modal) + `Components/ItemFormShell.jsx` (stepped form, per-step validation, sticky footer CTA, desktop preview column). Piggy Pot, Bills and Membership (add + edit) are fully on it; Wish, Shop and Task keep their own shells and embed `RewardEditor`.

### Reward hint on item cards ("you get something back")
Every sellable item card now shows what the buyer gets in return, so it reads as a purchase, not a one-way gift. `resources/js/Pages/discover/components/RewardHint.jsx` ("🎁 You get: …") renders on the wish, bill, membership, shop and task cards. It was Discover-only because only the Discover payload carried the reward columns; `UserProfileService` now selects `reward_title`/`reward_type`/`reward_description` in `getOptimizedWishItems/Memberships/Bills/ShopItems/Tasks` too (Piggy Pot is a full-model query, already had them), so the hint works on the profile page as well. ⚠️ **The Discover payload did NOT actually carry the reward columns** — `DiscoveryService`'s `map()` closures dropped them, so the hint silently never rendered on Discover despite the cards importing it. Fixed: a private `DiscoveryService::rewardFields($item)` (fail-soft, `reward_body` never exposed) is spread into all 10 featured/search maps (wishes/bills/memberships/tasks/shops). RewardHint uses a semantic **green** pill (an intentional exception to the one-accent rule; see DESIGN.md).

- Fallback: description → type label → a generic "Exclusive content" when a legacy row has only a backfilled title. **A physical shop product is excluded from the generic fallback** — its deliverable is the parcel, not digital content.
- Piggy Pot card (`PiggyPotWidget`) shows a "You get in return" box preferring `reward_title`/`reward_description` over the legacy `content_description`.

### Reward in the buyer's purchase email
The confirmation email now shows the reward, not just the legacy file deliverable. Shared partial `resources/views/email/reward-block.blade.php` renders `RewardService::for($item)` — title + description + the no-refund `digital-content-notice` + the paid content (message inline / link button / file button). `reward_body` IS shown (the email goes to the buyer who paid).

- `@include`d in the BUYER templates: `taskpurchased_supporter`, `bill_checkout_to_user` (+`rewardShowFile`), `membership_to_user` (+`rewardShowFile`), `piggy-pot-receipt` (replaced its own legacy reward block, `rewardShowFile`). **Shop** already renders the deliverable via `success_page_value`; **wish/cart** (`checkout-user`) already shows FILE rewards through the Deliverable loop.
- ⚠️ **`rewardShowFile` defaults to false** — the legacy templates already render a file's download link, so the block only adds the pieces they miss (title, description, message/link). Pass `true` where the block is the ONLY reward surface (pot) or where the template's own section doesn't cover the welcome file (bill/membership).
- **Open gap (flagged, not fixed):** a message/link WISH reward does not create a `Deliverable` with a `deliverable_url`, so it never reaches `checkout-user`'s consolidated-deliverables loop — the buyer sees it on the thank-you page but not inline in the wish/cart email. Fixing needs the deliverable pipeline (`ProcessWishItemDeliverable`) to emit a row for message/link rewards.
- Creator mail + push, and buyer push, already fire on every purchase flow (unchanged).

### The reward is recorded on the Stripe payment itself
Stripe's record of a charge used to say only who paid whom and how much — nothing about what was sold, which is the difference between a defensible content purchase and an unexplained transfer in a dispute or a compliance review.

- `Helpers::buildStripeMetadata()` attaches `reward_title` / `reward_type` / `reward_detail` to **every** payment type. It finds the item by walking the payment model's known relations (`wish_item`, `shop`, `task`, `piggyPot`, `bill`, `membership`…) and is wrapped in try/catch — descriptive metadata must never be why a payment cannot be created. **`reward_body` is never sent**: it is the paid content, and Stripe is not where it belongs.
- `Helpers::rewardLineDescription($item, $fallback)` builds the Stripe **line-item description** ("You get: …") shown on the last screen before payment and on the receipt. Wired into every checkout's `product_data`. The **statement descriptor is unaffected** — that stays the 22-char `{USERNAME} CONTENT` form.
- Migration `2026_07_24_110000` replaced the `'Exclusive reward'` placeholder on legacy rows with each item's own name (memberships read "Gold membership"), so no listing sells a non-answer.

### Thank-you page (`ThankYouController`, route `thank-you`)
The reward used to travel **in the query string** alongside the purchase. It is now resolved server-side from the item and gated on the payment row:

- **The item is resolved from the PAYMENT ROW, not from `item_id`.** Each redirect handler passes something different — Shop/Task/Bill/Membership a uuid, the wish flows a numeric id, Piggy Pot nothing at all — so trusting the URL meant the reward silently failed to render on most flows, and a guessable id pointing at another table is worse than no reward. `source` is an **allow-list** of payment tables, each mapping to its item model + foreign key; `stripe_payment_items` reads buyer and status from its parent `stripe_payment_details`. `item_id` is only a last-resort fallback (uuid or numeric id), and tips are excluded from it because their `item_id` is a payment id.
- The reward **headline and description always render** (they describe the purchase); the **content is withheld** unless the signed-in viewer matches the payment row's buyer column AND the status is settled. A guest is told to check their email rather than being handed content on a guessable row id.
- `awaiting_settlement` distinguishes "your bank is still confirming" (SEPA/ACH, `processing`) from "we could not confirm this is your purchase" — different copy, different fix. **Never hand over content on money that has not cleared.**
- The redirect handlers no longer put `wish_content`/`benefits`/`success_page_type` in the thank-you URL.

Tests: `tests/Unit/RewardServiceTest.php` (legacy fallbacks, link rules, kind resolution) and `tests/Feature/ThankYouRewardTest.php` (entitlement, settlement, tampered source).

⚠️ **A Ramsey UUID object in `route()` query params serialises as an object, not its value** — `http_build_query` expands its properties. Cast model uuids to string when building a URL query.

## Membership upsell after a one-off purchase (1 August 2026, spennypiggy.co)

`App\Services\MembershipUpsellService` is the only decision of whether a buyer is shown a
creator's membership, and which tier. It renders nothing.

The moment someone has just paid a creator is the moment they are likeliest to pay again — and
both surfaces occupying that moment were empty. The thank-you page offered nothing; the receipt
email's only forward step was a generic *"Discover more creators on Spenny Piggy"* link to the
home page that did not even name the creator just bought from. A one-off sale earns one
commission; a membership earns one every month, and it is also what carries a creator past their
own first-sale threshold.

- **Every reason to stay quiet lives in the service**, so a second surface cannot forget one:
  no published membership · unapproved (they are created `approved=0` and cleared by an admin —
  advertising one sends the buyer to a dead page) · suspended · `price = 0` · the viewer is
  already an active member. `ThankYouController` adds one more: never upsell a membership to
  someone who just bought a membership.
- ⚠️ **The CHEAPEST tier is offered, deliberately.** This is a first step for someone who has
  bought once, not a pitch for the top tier — a visitor who bounced off a £50 tier does not come
  back, whereas an entry-tier member can move up.
- ⚠️ **The service never throws.** It runs on the thank-you page and inside a receipt, both of
  which confirm money has changed hands; an upsell must never be why a buyer cannot see their
  receipt. Everything is wrapped and falls back to "show nothing".
- **"Already a member" mirrors the active-subscription definition** used by the posting-cadence
  enforcer (paid + `recurring_for = continue` + `end` null or future), so a lapsed member becomes
  a candidate again rather than being silenced forever.
- ⚠️ **The checks are TIER-level only — nothing asks whether the CREATOR is sellable.** A suspended
  creator, one with no `account_id` (Stripe Connect unfinished, so checkout cannot route money), or
  one under a `content_posting_paused_at` pause is still advertised — the last recruits new monthly
  members for a creator whose existing subscriptions `EnforcePostingCadence` is pausing for not
  posting. `StockWaitlistService::buyable()` is the pattern to copy. Open in TASKS.
- ⚠️ **Format the price ONCE, server-side.** The email partial hardcodes `£` for GBP and an empty
  string otherwise, so a USD tier reads "Join for 9.99/mo" — a bare number on a recurring-charge
  button — while `MembershipOffer.jsx` formats correctly via `Intl.NumberFormat`.
  ✅ **Fixed 3 Aug 2026:** `Helpers::getCurrency()` used to `return $arr[$curr]` with **no fallback**,
  throwing an undefined-key error on an unlisted code — inside a receipt email, so the failure was a
  mail that never arrived about money that had already moved. It now falls back to the uppercase ISO
  code: a bare "NOK" is a worse symbol than a real one and a far better outcome than no email.
- **UI: `Components/MembershipOffer.jsx`** on the thank-you page, placed **below** the receipt and
  reward — the buyer must first see their purchase landed; an upsell above the thing they just
  paid for reads as the platform caring more about the next sale. "Cancel any time" is stated on
  the button row: a recurring charge someone feels eased into is a chargeback, not a member.
- **Email: `resources/views/email/membership-offer.blade.php`**, same self-resolving pattern as
  `email.reward-block` — a template only says who the creator is. Wired into the ONE-OFF buyer
  receipts only; bill and membership receipts are deliberately excluded, since those buyers are
  already on a recurring product. ⚠️ Pass `buyer` wherever the template has it, or the
  already-a-member check cannot run.
- ⚠️ **A refusal is remembered, per creator.** `membership_offer_dismissals` (migration
  `2026_08_01_000000`) records "No thanks" so a buyer who purchases from the same creator ten
  times is not asked ten times. Stored **server-side, not in localStorage**, because the offer
  also appears in receipt emails and a browser-only dismissal cannot silence an email. Refusing
  one creator says nothing about another, and a refusal expires after
  `MembershipUpsellService::DISMISSAL_DAYS` (**90**) — "not now" is not "never", and a creator
  may have published a great deal more three months later. The journey card makes the same
  decision with a 7-day window; this one is far longer because it is a sales prompt rather than
  the creator's own to-do list.
- **The email carries its own refusal.** `membership-offer.dismiss-link` is a
  `temporarySignedRoute` expiring after `DISMISSAL_DAYS`, validated with `hasValidSignature()` in
  the controller (redirect home, not a bare 403 — the same shape as `/unsubscribe/{user}`).
  ⚠️ Identity travels in the URL here, which the POST endpoint forbids — that is correct *because
  it is signed*: the signature proves the platform minted the link.
- **`membership-offer:prune-dismissals`** runs daily at 03:55 and deletes only rows past the
  window; an expired dismissal is dead weight the service already ignores.
- ⚠️ **Receipt templates pass the creator MODEL, never a username string.**
  `taskpurchased_supporter` assigns `$creatorUsername` *after* the include and the mailable never
  passed it, so the offer silently resolved to null and that receipt never showed one — green
  build, green tests, no error. The mailables eager-load `creator`/`user`/`supporter` so the
  partial re-queries nothing.
- ⚠️ **`POST /membership-offer/dismiss` is signed-in only and takes identity from the SESSION.**
  Accepting an email from the request body would let anyone silence the offer for someone else by
  guessing their address. A guest sees the thank-you page once and loses nothing.
- ⚠️ **The "already a member" and "already refused" checks match on the email as well as the
  account id.** `shop-buy-user` and `checkout-user` carry no buyer model — only a deliverable — so
  without the email branch an existing member would be emailed an invitation to join what they
  already pay for. `checkout-user` also has no `$creatorUsername`: the creator is resolved from
  the first deliverable's `creator` relation, and a cart spanning several creators offers the
  first one only rather than becoming a list of adverts.
- **A Bill buyer on the thank-you page still sees the offer** (decided 1 August 2026). A Bill
  sells one content stream; a Membership sells tiers with a perks bundle — the platform keeps
  them distinct everywhere else, so this is a next step rather than a repeat. Only the bill
  *receipt email* is left unwired.
- ⚠️ **`creatorCanSell()` gates on the CREATOR, not just the tier.** An `approved = 1` tier on a
  suspended creator, or one who never finished Stripe Connect, still fails at checkout after the
  buyer has committed — worse than never offering.
- ⚠️ **The price always renders with a symbol.** The email hardcoded `'GBP' ? '£' : ''`, so a USD
  tier read "Join for 10/mo". The symbol comes from the `currencies` table, falling back to the
  ISO code, never to nothing.
- ⚠️ **`requires_account` warns a guest before the price does.** `membership.checkout` resolves to
  `MembershipController@buyLevel`, one of the four checkouts that force login — and guest checkout
  IS allowed on Piggy Pot and Wishes, which is exactly how a guest reaches this offer.
- ⚠️ **`suspended_account` is NOT in `User::$fillable`** — `update()` drops it silently, so a test
  asserting suspension behaviour passes against unchanged data. Use `forceFill()->saveQuietly()`.
- Tests: `tests/Feature/MembershipUpsellTest.php` (24) — every silent case, cheapest-tier
  selection, lapsed membership re-qualifying, guest, a null creator being silent not fatal,
  per-creator refusal, refusal by email, and the endpoint ignoring an unauthenticated caller.

## Help Centre — `/help` (13 Aug 2026, spennypiggy.co)

Full write-up: `docs/implementations/HELP_CENTRE.md` (schema, the token system, the AI layer's
guardrails and cost controls, how to write an article, the runbook, known gaps). The rules
below are the load-bearing ones.

Public, indexed, and the only self-serve route a **guest** has — `IntercomProviderFixed`
returns early for logged-out visitors, so before this they had nothing. 70 articles across nine
categories.

**Tables** (migration `2026_08_13_000000`, all website-owned; the admin CMS declares them with a
guarded migration when it is built — do NOT add a second create migration there):
`help_categories` · `help_articles` · `help_article_slug_history` · `help_article_stats` ·
`help_search_misses`. Migration `2026_08_13_000100` adds `embedding` / `embedding_hash` /
`embedded_at` to `help_articles`.

**Routes** (`help.*`): `GET /help` · `GET /help/search` (JSON, throttle 60/min) ·
`POST /help/ask` (throttle 20/min) · `POST /help/feedback` (throttle 30/min) ·
`GET /help/{category}` · `GET /help/{category}/{article}` · `GET /seo/sitemap-help.xml`.

- 🚨 **Declared ABOVE `require auth.php`** in `web.php`, and `/help/search` + `/help/ask` +
  `/help/feedback` are declared **before** `/help/{category}` or "search" is matched as a
  category slug. `route:list` shows them either way — that is what makes it invisible.
- 🚨 **NEVER type a price, rate, threshold or seat count into an article.** Use a `{{token}}`
  resolved by `App\Support\HelpTokens` from the same config the platform charges from. The
  homepage FAQ published an 8% fee and £29.99/mo for a year because they were typed. An unknown
  token renders as an empty string and is logged; the seeder reports them loudly.
- ⚠️ **No token in a TITLE.** Titles are printed into page titles, breadcrumbs, JSON-LD and
  search results, none of which render tokens. Summary and body only; a test asserts it.
- 🚨 **Bodies are Markdown rendered by `App\Support\HelpMarkdown` with `html_input => strip` and
  `allow_unsafe_links => false`.** That stripping is load-bearing security, not tidiness — the
  HTML is injected with `dangerouslySetInnerHTML` on a public page and becomes admin-authored
  text once the CMS ships. Do not relax either option to embed a video.
- ⚠️ **`audience` is a DEFAULT FILTER, never a gate.** A supporter following a link to a creator
  article reads it in full; hiding it would 404 a URL that is in the sitemap. The category page
  reports how many it hid and offers "Show everything" — a filter the reader cannot see is
  indistinguishable from missing content.
- **Visibility is decided by TIME** (`HelpArticle::visible()`), so a scheduled article goes live
  at its minute with no worker running. `feature_flag` holds a config key; an article documenting
  a kill-switched feature is hidden and dropped from the sitemap.
- ⚠️ **Retitling keeps the old URL working** via `help_article_slug_history` + a 301, same reason
  `post_slug_history` exists. A slug reused from an earlier edit is removed from history, or the
  live URL would redirect to itself.
- **Stats are AGGREGATE ONLY** — one row per article per day, no IP, no cookie id, exactly like
  `site_visit_stats` / `item_view_stats`. ⚠️ `help_article_stats.date` has **no cast**, the
  documented Eloquent/SQLite bucket-fragmentation trap. The view write is deferred with
  `afterResponse()`.
- 🚨 **`help_search_misses` is the backlog.** Every zero-result search is recorded — outside the
  response cache, or a miss is counted once and served from cache while people keep searching
  for it. ⚠️ `normalise()` REMOVES apostrophes rather than replacing them with a space, or every
  contraction fragments one real question across several rows.
- **Seeder is idempotent and NEVER overwrites an admin-edited row** (`edited_at` set), so content
  lives in git today and moves to the CMS later without the two fighting. Content lives in
  `HelpCentreSeeder` + `Database\Seeders\Help\ExtraArticles`.
- **Deflection:** `Components/Help/HelpSuggestions.jsx` sits above the message box in
  `transactions/SupportModal.jsx` and `Support/Guest/Create.jsx`, expanding articles INLINE —
  sending a reader elsewhere loses the form they were filling in. A "yes" from that context
  counts as `deflected`; a "no" counts as `escalated` and immediately offers the escalation
  routes. `Components/Help/HelpLink.jsx` is the drop-anywhere inline version.
- ⚠️ **There is no general "contact us" form on this platform** — a ticket is always attached to
  a payment. `HelpController::escalation()` returns what is genuinely available to THIS viewer
  rather than linking a form that will refuse them.
- **SEO:** meta/canonical/JSON-LD applied server-side (SSR is off, unfurlers run no JS);
  `/seo/sitemap-help.xml` listed in BOTH the index and robots.txt; unknown slug is a real 404,
  never a 200 empty state.
- Design: the categories **abut, sharing hairlines** (`gap-px` over a black parent — the
  `WaysToGetPaid` device), one accent per group. ⚠️ An **odd tile count must span two columns**,
  or the parent shows through as a solid black block.
- Tests: `HelpCentreTest` (31), `HelpAiAnswerTest` (21), `HelpCentrePruneTest` (4).

### Ask AI — grounded answers, off by default

`App\Services\Help\HelpAnswer` + `HelpEmbeddings`. `text-embedding-3-small` → cosine similarity
in PHP → `gpt-4o-mini`. **No vector database**: at ~100 articles cosine over a JSON column is
milliseconds and needs no extra infrastructure.

Env: `OPENAI_API_KEY` (falls back to the legacy `DALLE_SECRET_KEY`) + `HELP_AI_ENABLED=true`,
then `php artisan help:embed`. ⚠️ **ONE OpenAI key covers images, chat and embeddings** — there
is no separate "DALL·E key"; `OpenAIContentService` already uses that same key against
`chat/completions`, so the variable name has been misleading for a long time.

🚨 **The model never answers from its own knowledge, and every guardrail below is load-bearing.**
This help centre states fees, payout timing and reserve rules; an invented "10% every month"
would publish as policy on our domain in our voice.

1. The prompt forbids outside knowledge and forbids any figure not literally in the supplied
   articles.
2. **Anything not about Spenny Piggy returns `NO_ANSWER`**, and the prompt tells the model to
   ignore instructions embedded in the question.
3. 🚨 **Below `min_similarity` (0.28) nothing is generated at all** — the chat endpoint is never
   called. This is both the off-topic guard and the cheapest one.
4. Every answer carries the articles it came from.
5. Any failure — disabled, no key, rate limited, OpenAI down, weak match — falls back to keyword
   results plus a route to a human, never to silence.
6. 🚨 Model output is rendered through `HelpMarkdown`, which strips raw HTML. An instruction is
   not a security boundary.

**Cost** (`config/help.php`): input is most of the bill, so `context_articles` is **3** and each
body is truncated to `max_context_chars` (**1,400**, cut on a paragraph boundary — slicing
mid-sentence hands the model half a rule). `max_tokens` 200, answers cached **7 days** per
normalised question, 15 generations per IP per hour, questions capped at 200 characters
**server-side** (the endpoint is public).

⚠️ **An article edit does not invalidate the answer cache.** Run `cache:clear` after a material
content change or a stale answer survives the week.

🚨 **A FAILED answer is cached for that week too** (confirmed 13 Aug 2026, unfixed). `ask()`
wraps `generate()` in `Cache::remember` and `generate()` returns `request_failed` / `exception`
/ `embedding_unavailable` as ordinary values, so one OpenAI blip or a bad key poisons that
question for seven days — and the questions asked most are the ones asked during an outage.
**`cache:clear` is therefore part of turning the AI layer ON**, not a tidy-up: every question
asked before the key was right stays broken without it. `HelpAiAnswerTest` sets `cache_ttl => 0`
for every test in the file, so the suite cannot see this. Full write-up + the other six review
findings: `docs/implementations/HELP_CENTRE.md` §6 and §15.

⚠️ **`help_articles.embedding` is `$hidden`** — ~1,500 floats that would otherwise serialise into
every payload carrying an article. `help:embed` re-embeds only what changed (`embedding_hash`),
runs against drafts, and reports the API's own error verbatim rather than hiding it in the log.

**Commands:** `help:embed` (hourly at :24) · `help:prune` (daily 03:52 — retention 400 days for
stats, 365 for misses measured on `last_seen_at`, both floored).

## SEO (spennypiggy.co) — the discovery layer (27 July 2026)

`docs/implementations/SEO_IMPLEMENTATION.md` documents the tag/sitemap plumbing. The rules below are the load-bearing ones found broken during the audit; do not regress them.

- ⚠️ **`/sitemap.xml` IS the sitemap index.** It used to be a flat urlset of static pages, while `/seo/sitemap-creators.xml`, `-wishlists.xml` and `-posts.xml` sat at URLs **nothing linked to** — robots.txt named only `/sitemap.xml`, so no creator, wish or post URL was reachable through a sitemap at all. `robots.txt` now lists the index *and* each child.
- ⚠️ **`users.is_public_profile` does not exist.** `SitemapController` filtered creators (and posts, via `whereHas('user')`) on it; the query threw, the `catch` swallowed it, and the creator sitemap returned an **empty urlset on every request, silently**. The real filter is `role = 1` (1 = creator, 0 = fan) + `suspended_account = 0`. Local check after the fix: creators 0 → 46, posts 0 → 7. **A sitemap must never 500** (Search Console drops a broken one wholesale) — but a swallowed error that returns "no URLs" is indistinguishable from success, so guard the *query*, not just the response.
- **Child sitemaps are chunked** (`CHUNK` = 5000, `?page=N`, enumerated by the index) and **ordered by `id`, never `updated_at`** — paging over a column that changes under you skips and repeats rows. Cached `CACHE_TTL` = 1h with `Cache-Control: public` (every response was previously `no-store`, so each crawl re-ran the queries on Lambda). `clearCache()` forgets every chunk.
- **`lastmod` on static pages is the deploy time** (`public/build/manifest.json` mtime), not `now()` — "changed just now" on every request is a signal Google learns to ignore.
- **Meta copy is a Stripe-facing surface.** Titles/descriptions are printed in search results and social cards, so the content-first ban list applies in full. `SeoMeta::DEFAULT_TITLE` and `App\Services\SeoTemplateService` own the wording; the old copy ("Financial Gifts, Donations & Memberships", "Send tributes, adopt bills", "Gift X to Y") is gone from all three call sites including the unrouted `OptimizedProfileController`.
- **`SeoTemplateService` was entirely dead code** (zero callers) — Person schema, Product/Offer schema, hreflang and the title/description length caps were all written and never wired. `AuthenticatedSessionController::setSeoMetaTags` now calls it: **Person** JSON-LD on a creator profile, **Product + Offer** on a wish page. ⚠️ **The claim that this was "the only per-item public URL" was wrong** (corrected 30 July 2026): `shop/item/{slug}/{uuid}` and `task/{uuid}` are public routes of their own, and `membership/details/{uuid}` + `billing/bill/{uuid}` exist but sit behind `auth`. There is no `wish.show` route at all — the "wish page" IS the creator profile. `SeoTemplateService::setWishlistMeta()` is **dead code with zero callers**, and canonicalises against a `wish.show` route that does not exist; the live path is `AuthenticatedSessionController::setSeoMetaTags`. Its Product builder read `$wishItem->description` / `->image_url`, **neither of which is a column** — it reads `reward_description` and `thumbnail`.
- ⚠️ **hreflang is self-referencing only** (`en` + `x-default`). It used to point `en-GB` at `uk.spennypiggy.co`, a host that does not exist — an hreflang to a dead URL makes Google discard the whole cluster.
- **An unknown or suspended profile returns a real status code.** `getUserProfile` rendered `NotFound` and `Suspanded` with **HTTP 200**, so every junk username was indexed as a soft-404. Now **404** for unknown and **410 Gone** for suspended (410 drops out of the index faster), both `noindex`.
- **noindex/Disallow coverage** lives in two places that must stay in step: `StaticPageSeoMiddleware` (`$noIndexExact` + `$noIndexPrefixes`) and `SeoController::robots`. robots.txt stops the crawl; the meta tag stops the indexing — a URL only Disallow'd can still be indexed from an external link, so anything that must never appear needs both. `/leaderboard/{period}` is six near-identical boards: the five non-default ones are `noindex` and canonical to `/leaderboard`.
- **Search Console verification is config-gated:** `services.google.site_verification` (`GOOGLE_SITE_VERIFICATION`) renders nothing when unset. It is an ownership proof, not a tracking tag — it loads no Google script — but without it the sitemap cannot be submitted and there is no ranking or impression data at all. See "Google tags" below for what analytics/ads actually run.
- ⚠️ **Inline `@php(...)` is unusable in this project's Blade.** It compiles to a bare `<?php(...)` with no closing tag and swallows the rest of the template — every page 500s with *"unexpected end of file, expecting endif"*. Call `config()` inline or use a full `@php ... @endphp` block. Verify a Blade change with `Blade::compileString()` + `php -l`, not just by loading one page.
- **SSR is OFF by default** (`config/inertia.php`, `INERTIA_SSR_ENABLED=false`). Lambda cannot host the long-running Node process Inertia SSR needs and the deploy never built `bootstrap/ssr/ssr.js`, so `true` pointed every request at an SSR server that does not exist. Turning it on needs an external SSR host — see `docs/guides/Vapor_Inertia_SSR_Guide.md`. **Until then crawlers get server-rendered `<head>` (tags, canonical, JSON-LD) but a client-rendered body.**
- **Vapor deploys run `npm run build:production`**, not `npm run build` — the plain script skips `sw:build`, so every deploy shipped the PWA without a fresh service worker.
- **Viewport no longer blocks pinch-zoom** (`user-scalable=no`/`maximum-scale=1` removed from both the `<head>` tag and the iOS-standalone JS that re-applied it) — it fails the Lighthouse accessibility audit and locks out anyone who needs to zoom. `viewport-fit=cover` stays; the safe-area insets need it.

### Google tags (11 Aug 2026)

⚠️ **ONE gtag.js loader, TWO configs**, in `resources/views/app.blade.php`: GA4 `G-EQCXDEV7QV` and Google Ads `AW-11395921981`. That is Google's documented way to run both from a single tag. **Never add a second `gtag.js` `<script>`** — a duplicate loader re-registers `dataLayer` and double-counts.

⚠️ **The site is an SPA, so GA4 needs the `page_view` listener in `resources/js/app.jsx`.** `gtag('config', …)` fires once, on the initial document load; without the Inertia `navigate` handler GA4 records one page view per session and every page after the first is invisible. Ads does not need it (conversions are their own events), so it was briefly removed when GA4 was — and removing it is what would make GA4 look half-broken rather than dead.

The tag history, because it explains two false leads:

- A **hardcoded `G-9F1M3QZZB3`** lived in `includes/Footer.jsx` and called `gtag('config', …)` but **never loaded gtag.js**, so it only pushed onto `dataLayer` and sent Google nothing. It also names a *different* property from the one the client is watching. Removed.
- `thirdPartyScriptManager.js::loadGoogleAnalytics()` — dead, zero callers. Removed.
- A config-gated GA4 block (`services.google.analytics_id` / `GOOGLE_ANALYTICS_ID`) was added and then removed on the same day; the property id is hardcoded now, matching the Ads tag, so it cannot go missing because an environment variable was not set.

⚠️ **Neither tag is environment-gated**, so both fire on local and on `dev.spennypiggy.co` as well as production — dev traffic enters the GA4 property and the Ads remarketing audiences. Wrapping the block in `@production` is the one-line fix if that becomes a problem.

⚠️ **The Ads tag records NO conversions on its own.** It gives remarketing and tag-active status only. Conversions need either a URL-based conversion configured in the Ads UI (a page view of `/thank-you` works — the Stripe return is a real document load, not an SPA navigation) or an explicit `gtag('event','conversion',{send_to:'AW-11395921981/<label>'})`. The label is per-conversion-action and has to come from the client's Ads account.

⚠️ **The service worker serves cached HTML for up to 24h** (`public/service-worker.js`, StaleWhileRevalidate on `request.mode === 'navigate'`, cache `pages-v1`). A returning visitor gets the cached page first, so after a tag change existing users load the old `<head>` once before the fresh copy lands. Expect a lag before data appears; it is not a broken tag.

## Brand handover page — `/brand/email-signatures` (12 Aug 2026, spennypiggy.co)

`BrandAssetController::emailSignatures` → `Brand/EmailSignatures.jsx`. Public and
unauthenticated: the people installing a signature do not all have accounts, and it
discloses nothing the site footer and Terms of Service do not already publish.

- 🚨 **The signature markup is read verbatim from `resources/views/brand/signatures/*.html`
  and is BOTH the preview and the clipboard payload.** That is the point — what the page
  hands over is byte for byte what a mail client receives. Never rebuild it in JSX.
- ⚠️ **`.html`, never `.blade.php`.** A signature contains `jack@spennypiggy.co`, and Blade
  reads a leading `@word` as a directive — the compiler chokes on `@spennypiggy`.
- ⚠️ The controller strips **every** HTML comment before serving. Safe only while none of
  these files carry an Outlook conditional comment (`<!--[if mso]>`), which IS markup.
- ⚠️ The route is declared **above the `auth.php` require** — `/{username}/{page?}` matches
  two segments as readily as one, so below it this reads as a profile for "brand".
- ⚠️ **`SeoMeta` has no `setTitle`/`setDescription`** — calling them 500s the route. Title
  comes from the page's Inertia `<Head>`; `noindex` is set three ways (middleware `brand/`
  prefix, the controller, and a `/brand/` Disallow in `SeoController::robots`).
- Source of truth for the files is `docs/assets/email-signatures/`; the app keeps its own
  copies because `docs/` is not deployed. **Edit one, copy it across.**

## System Diagnostics — severity, history, redaction (30 July 2026, spennypiggy.co)

`admin/system-diagnostics` runs 32 checks. The page used to print them as a flat list with every label hardcoded in the JSX, so a dead queue worker (nobody is being paid) rendered identically to "disk 76% full", and each run was a snapshot with no memory. Rebuilt around three questions: what is broken, is it worse than last time, what do I do about it.

- **`App\Services\Diagnostics\CheckCatalog` is the ONE definition** of each check's label, group, severity and remediation. React reads none of it — the page renders from the server payload, so adding a check is a row in the catalog, not an edit in the JSX. A key with no catalog entry still renders (falls back to WARNING + its own key), so a new check can never make the page throw.
- ⚠️ **CRITICAL is reserved for "money cannot move, the site is down, or data is at risk."** A page where everything is critical prioritises nothing. `queue_health` and `scheduled_tasks` ARE critical — per the queue-reliability rules above, both fail silently while deliverables, receipts, moderation scans and payouts quietly stop.
- ⚠️ **`skipped` is a first-class status and is never green.** A check that could not run tells you nothing, and rendering it as a pass is how a broken probe reads as a healthy system. It also does not count toward `passed`.
- ⚠️ **The two Stripe checks CREATE REAL OBJECTS** — a Connect Express account and a PaymentIntent. They are listed in `CheckCatalog::MUTATING_CHECKS`, skipped on a standard run, and reachable only via the **Deep run** toggle / `--deep`. `diagnostics:run` is scheduled **daily**, so before this the platform was minting a real Connect account and a real PaymentIntent **every night**. Never add a mutating check without adding its key to that list.
- **`diagnostic_runs` + `diagnostic_results`** (migration `2026_07_30_000000`, retention `DiagnosticsRunner::RETENTION_DAYS` = 90, pruned by `diagnostics:run --prune`) exist so each run can be described as a **change** — `new` / `worse` / `resolved` / `improved` / `same`, or **`null` when the previous run did not measure that check**. A snapshot saying "4 failed jobs" is unreadable without knowing it was 0 an hour ago. **A deep run diffs against the previous DEEP run**: comparing it to a standard run would report every skipped mutating check as newly broken.
  - ⚠️ **An absent check is `null`, never `new`.** `--only` runs are persisted, so the next full run legitimately finds checks the previous one never measured. Returning `new` for any absent key put a red "New" chip on ~30 healthy rows after a single scoped run. Absent is *unknown*, and unknown is not a change. `previousResults()` returns `['statuses' => …, 'run_at' => …]` for this reason — the run timestamp used to be smuggled into the status map as `__run_at`, which made "was this check measured?" indistinguishable from "is the map non-empty?".
  - ⚠️ **The run row and its results are written in ONE transaction.** A run persisted with zero results leaves the next run with an empty status map, so nothing compares and every delta is silently wrong from that point on. Persistence failures are otherwise logged and swallowed — recording a run must never be why the run fails.
- ⚠️ **`App\Support\LogFingerprint` redacts before anything reaches a screen.** The error panel printed log lines verbatim, carrying Stripe secret-key fragments (including Stripe's own half-masked `sk_test_****iinahX` form), payment intent / customer / account ids, buyer email addresses, Sentry public keys, absolute paths and entire serialized queue payloads onto an admin page that gets pasted into tickets. It also **groups by signature, not by `substr($line, 0, 100)`** — those first 100 characters begin with the timestamp, so the same fault three minutes apart counted as three distinct errors. Live: "11 unique errors" was really 5 signatures across 15 lines.
- **Every finding names its rows.** `financial_integrity` and `referral_system` return `ids` (capped at 25) instead of a bare count — "2 transaction(s) have amount calculation mismatch" previously cost a hand-written tinker query to act on.
- **One check throwing is one red row, never a dead page** (`CheckResult::threw`). A check returning a status nobody defined is treated as **failed**, not passed.
- `diagnostics:run` supports `--deep`, `--only=`, `--dry-run` (records nothing, so it cannot become the baseline the next run diffs against) and `--prune`. Alert recipients moved from a hardcoded pair in the command to `services.diagnostics.alert_emails` (`DIAGNOSTICS_ALERT_EMAILS`, comma-separated) — **the old pair stays as the config default on purpose**, since dropping it would silently stop alerting anywhere the new variable is not set.
- **Known duplication:** `queue_health` / `scheduled_tasks` overlap `admin.spennypiggy.co`'s `InfrastructureHealthService` (`failedJobs`/`queueBacklog`/`schedulerHealth`), which already runs hourly with throttled alerting. The two apps share a database but not code, so this cannot be deduplicated without moving the screen into the admin app — where its `role === '2'` gate would also finally match a real user. Tracked in TASKS.
- Tests: `tests/Unit/LogFingerprintTest.php` (redaction of each secret shape, signature collapsing, grouping) and `tests/Feature/DiagnosticsRunnerTest.php` (severity ordering, skipped ≠ passed, deep gating, delta states, deep-vs-deep diffing, persistence, prune).

## Queue reliability — one-shot jobs must be retryable (25 July 2026, spennypiggy.co)

**A worker started without `--tries` attempts each job exactly ONCE.** A scheduled batch job re-runs tomorrow; a job dispatched once per purchase or per signup does not, so one transient Stripe/SMTP/S3 blip loses that deliverable, certificate, moderation scan or verification email permanently — and with no `failed()` hook it dies into `failed_jobs` with a stack trace that doesn't say which purchase was lost.

`App\Jobs\Concerns\RetriesCriticalWork` is the shared policy: `$tries = 3`, `$backoff = [30, 120, 300]`, and a `failed()` that writes `Log::critical` + captures to Sentry. A job may implement `failureContext(): array` to name the affected purchase/user in that log line.

- **Applied to the one-shot set only:** `ProcessWishItemDeliverable`, `GenerateSupportCertificateJob`, `CheckMediaModeration`, `CheckAdultContent`, `CheckProfilePhotosAdult`, `CreateStripeCustomer`, `SubscriptionCancelAtEnd`, `DeleteStripeProductJob`, `Dispute\Send*MailJob` (×3), `VerifyEmail`, `ForgotPassword`, `SendIdentityVerificationEmail`, `SendPaymentSuccessEmail`.
- ⚠️ **Only add the trait to a job whose `handle()` is safe to run twice.** `CheckoutMailToUser` and `CreateThankYouPostJob` are deliberately excluded — they `Deliverable::create(...)` / `Post::create(...)` on a non-natural key, so a retry would double the row. Make the write a `firstOrCreate` on a natural key first, then add the trait.
- `CreateStripeCustomer` re-reads the user and returns early when `stripe_id` is already set — without that, a retry created a second Stripe customer and orphaned the first.
- Batch/scheduled jobs (`ProcessFounderPayouts`, `ProcessFounderMonthlyBonuses`, `CheckFounderQualifications`) intentionally do **not** carry it: they already catch per-item, leave the row `pending`, and the daily schedule is their retry.
- Jobs with their own policy already (`ShopBuyed`, `ShopBuyedUser`, `SendEngagementNotification`, `CheckoutTweet`, `UpdateSupportPaymentStripeMetadata`, `EnrichSupportTicketStripeEvidence`, `FraudWarning\SendFraudWarningMailJob`) are left alone — PHP fatals if a class redeclares a trait property with a different default.

⚠️ **`withoutOverlapping()` on a CLOSURE task requires `name()` first, and getting it wrong takes down the WHOLE schedule.** `Illuminate\Console\Scheduling\CallbackEvent::withoutOverlapping()` throws a `LogicException` without a name, and it throws while the schedule is being *built* — so it does not disable that one entry, it disables every scheduled task in the application. `schedule:work` keeps running and looks healthy; nothing inside it executes and nothing is logged. This was introduced and caught the same day (31 July 2026): the tell was `scheduler_heartbeat` going stale while the process list still showed `schedule:work`. **Verify any change to `Kernel.php` with `php artisan schedule:list`** — that is where the exception surfaces. The heartbeat is `->name('scheduler-heartbeat')->everyMinute()->withoutOverlapping()`.

⚠️ **The queue-worker probe is rate-limited on when it was last DISPATCHED, not on when it last RAN.** `queue_worker_heartbeat` is written by the probe itself, so it only advances while a worker is alive — guarding on it alone meant that with `schedule:work` up and `queue:work` down the condition was true every minute, the closure was queued and never executed, and the `jobs` table gained a row a minute indefinitely. It is inert on a machine with a worker, which is why it survived: reported by a second developer, not seen locally. A separate `queue_worker_probe_sent` marker, written *before* the dispatch, caps a dead worker at one probe per 5-minute window. ⚠️ **`max(id)` on `jobs` cannot measure this** — it reads the highest *remaining* row, so an insert-then-delete is invisible; use `information_schema.TABLES.AUTO_INCREMENT`.

⚠️ **`checkout:recover`'s every-minute tick requires the schedule to actually be short.** It exists to observe a deliberately shortened `CHECKOUT_RECOVERY_SCHEDULE_MINUTES` (e.g. `1,2`); it was firing every minute on *every* local machine, so developers who had never touched that variable ran the command 1,440 times a day for nothing. Now gated on `min(AbandonedCheckoutService::schedule()) < 60`; otherwise `hourlyAt(20)` everywhere.

⚠️ **The scheduler heartbeat and the queue-worker probe are two separate things and must stay in separate try/catch blocks** (`app/Console/Kernel.php`, 30 July 2026). The probe is a `dispatch(closure)`, which on the **database queue driver writes to `jobs`** — so when MySQL is unreachable it throws, and while it sat inside the heartbeat's own `try` that throw was logged once a minute as **`Scheduler heartbeat failed to write cache`**: the wrong diagnosis, blaming a cache write that had already succeeded (the cache driver is `file` locally and never went down). The probe is also **only re-dispatched once `queue_worker_heartbeat` is older than 300s**, not every minute — the old form queued an identical closure per minute forever while a worker was stopped, which is where the `TimeoutExceededException: Closure (Kernel.php:29)` entries in `failed_jobs` came from.

### 🚨 On Vapor, `cli-timeout` is the budget for the whole MINUTE (12 Aug 2026, spennypiggy.co)

Every command due in the same minute runs **sequentially inside one `schedule:run`
invocation**, and on Vapor that invocation is a CLI Lambda killed at `cli-timeout`. So the
setting is not a per-command limit — it is the budget for everything due at once.

- 🚨 **A killed invocation logs NOTHING.** Vapor buffers the run's output and flushes it only
  when the invocation *ends*, so a minute that hits the ceiling leaves no line at all — no
  start, no error, no partial output. It is indistinguishable from the scheduler never having
  fired, which is exactly how this was mis-diagnosed for a week as "the payout cron is dead".
- **Measured 7 Aug 2026, both environments:** the Friday `payout:run-weekly` slot was gone from
  CloudWatch — `09:59:46 ✓ · [10:00 absent] · 10:01:49 ✓` on production, the same on
  development — while the REPORT line for that invocation read `Duration: 120000` exactly, the
  `cli-timeout: 120` ceiling. Development hit it **21 times in that one day** (every `:00` and
  `:30` tick), so this was silently truncating far more than payouts.
- **`cli-timeout` raised to 600 on both environments** (Lambda's own ceiling is 900), and the
  two heaviest commands moved off the crowded `:00` minute: `payout:run-weekly` → **Fri 10:07**,
  `ProcessFounderPayouts` → **10:03**. Both halves matter; neither alone is the fix. Minute `:00`
  carries six hourly commands plus every `*/5`, `*/10` and `*/15` tick — **do not schedule
  anything long there**, and prefer a quiet minute over relying on the raised timeout.
- ⚠️ **A killed process never releases its `withoutOverlapping()` mutex**, so every command it
  was running is then blocked for the lock's full expiry (default 24h). Found live on both
  environments — `creators:nudge-first-listing` was still holding a lock twelve hours after its
  00:00 run. `schedule:list` prints `Has Mutex ›` for these; **`php artisan schedule:clear-cache`
  is the repair**, and a stale lock is the first thing to check when a command "stops running"
  for no reason.
- ⚠️ **Do not diagnose this by AWS event timestamp** — the CLI log stream ingests with lag, so
  filtering `filter-log-events` by time returns the wrong window. Match on the timestamp *inside*
  the message (`schedule:run` prints its own), and read `Duration:` off the REPORT lines to find
  the kills.

## Abandoned checkout recovery (30 July 2026, spennypiggy.co)

A supporter who opened Stripe Checkout and closed the tab left a stale row in whichever module payment table the flow uses and a risk-ledger `Payment` stuck at `initiated`. **Nothing ever followed up** — recovery was zero. `App\Services\AbandonedCheckoutService` is the only implementation.

- **`abandoned_checkouts`** (migration `2026_07_30_000000`, unique `session_id`) is written once per checkout session by `record()`, so the six payment tables stay untouched and the funnel (abandoned → reminded → recovered) is measurable in one place. Columns: `checkout_url`, `expires_at`, `product_type`, `item_id`, `creator_id`, `user_id`, `guest_email`, `amount_minor`, `currency`, `fee_profile`, `reminder_count`, `last_reminded_at`, `recovered_at`, `closed_at`, `closed_reason` (`paid`/`expired`/`failed`/`opted_out`/`unrecoverable`).
- ⚠️ **`record()` sits on the money path and must never throw.** It is wired into all 8 live checkouts (cart `CheckoutController`, anonymous cart + wish-subscription + tip in `StripeController`, `ShopsController`, `TaskController`, `PiggyPotPaymentController`, `BillsController`, `MembershipController`) and swallows its own errors. A lost recovery row costs one email; an exception there costs the sale. The **unrouted legacy cart in `StripeController` is deliberately not wired** — it never stores `session_id`.
- ⚠️ **Never chase money that is already moving.** `processing` is a bank/SEPA/ACH debit the supporter HAS authorised, and is deliberately absent from `UNPAID_STATUSES`. `isStillRecoverable()` fails **closed** on every branch and returns *no close reason* for `processing`, so the row is left open rather than written off. Telling a paying supporter their purchase failed is the worst thing this feature could do.
- **The reminder links back to the SAME Stripe session** (`checkout_url`). A fresh session would re-resolve the payment tier and mint a second ledger row.
- ⚠️ **A Paid Task writes no `TaskPurchase` row until fulfilment**, so for `task` a MISSING payment row is proof of non-payment; for every other module the row exists before the redirect, so a missing row means we cannot prove it is unpaid and must not chase. That is the 5th element of `SOURCES` (`rowCreatedUpfront`) — mirror the `SweepStuckPayments` table map when adding a checkout.
- **Schedule: `checkout:recover` HOURLY at :20** (`--max`, `--dry-run`), not daily — a session lives ~24h, so a daily pass would send dead links. It runs **after** `payments:sweep-stuck` by design. On **`local`/`testing` it runs every minute** instead, or a shortened schedule could never be observed.
- **Timing is config, not constants — `config/checkout_recovery.php`.** `CHECKOUT_RECOVERY_SCHEDULE_MINUTES` (default `60,1200` = 1h then 20h) is **minutes**, and the number of entries IS the account-holder reminder cap; `CHECKOUT_RECOVERY_GUEST_MAX` (1), `CHECKOUT_RECOVERY_RETENTION_DAYS` (180), `CHECKOUT_RECOVERY_LOOKBACK_DAYS` (3). Read via `AbandonedCheckoutService::schedule()` / `guestMaxReminders()` / `retentionDays()`, never `env()` directly. **Local `.env` is set to `1,2` for testing.** ⚠️ Do not push the last entry past 24h — the reminder would link to an expired session and the row would be closed instead of sent. ⚠️ An **empty** schedule falls back to `[60, 1200]`, never to "no reminders": a blank env value silently stopping the whole feature is worse than ignoring it. The mail's "your link expires soon" copy keys off `count(schedule())`, so it always lands on whichever reminder is actually last.
- **Dedup is an atomic claim, not a lookup:** `claimReminder()` is the UPDATE (`where reminder_count = N`), so two workers cannot both win; a failed send calls `releaseReminder()` so the next run retries. It deliberately does NOT use the `engagement_notifications` claim — that would persist past a failed send and silently lose the reminder forever.
- **Channels:** account holder → bell + email via `NotificationDispatcher` with `$marketing = false` (**their `abandoned_checkout_emails_enabled` preference is checked by the command first**); guest → one `Mail::to()`. **No push** — a buzz about an unfinished purchase reads as pressure.
- **New preference category `abandoned_checkout_emails_enabled`** (migration `2026_07_30_000001`, default true) in `EmailPreferenceController::CATEGORIES`, `User` `$fillable`/`$casts`, and `EmailPreference/Index.jsx`. Missing/null = opted IN, as everywhere else.
- **`reward_body` never leaves the platform** — `App\Mail\AbandonedCheckoutReminder` + `email.abandoned-checkout` show the reward **headline** and description only; the content is delivered after payment. Copy is content-first (no gift/tip/donation/fundraise).
- **Closed by the webhook, not by the redirect handlers:** `checkout.session.completed` and `async_payment_succeeded` → `markRecovered()`; `async_payment_failed` → `closed_reason = failed`; `checkout.session.expired` → `expired`. Marking recovered on `completed` is correct **even when `payment_status` is still `unpaid`** — the supporter finished the flow and is waiting on their bank. Redirect handlers were left alone on purpose: the command re-checks the payment row before every send, so they are redundant.
- **`prune()` runs on every `checkout:recover` tick** — one row is written per checkout *attempt*, so this table grows faster than any payment table and is unbounded without it. Deletes **closed** rows past `RETENTION_DAYS` (180) in 1,000-row batches; open rows are live work and are never touched.
- ⚠️ **A guest can unsubscribe too.** "One email only" is not the same as "no way to stop us", and a guest has no settings page. `GET /checkout-reminders/stop/{checkout}` (`checkout-reminders.stop`, signed URL, **30-day** expiry — this mail may sit unread far longer than the 24h marketing links allow) → `EmailPreferenceController::stopCheckoutReminders` → `suppressGuest()` closes every open row for that address. **The opt-out marker IS the closed row** (`closed_reason = 'opted_out'`), which `isSuppressed()` reads — no suppression table, because nothing else would use one. The command checks it before every guest send. Signature is validated in the controller (redirect home, not a bare 403), matching `/unsubscribe/{user}`.
- **Creator-facing panel: "Stopped at checkout"** on `financial.opportunities` — `CreatorOpportunityService::abandonedCheckouts()` adds an `abandoned` key (count · value · recovered · `recovery_rate` · up to 8 listings). It is the **only demand-side signal** the creator gets; without it the whole feature is invisible to them. Deliberately **not** gated on `hasSupporters` — a creator with no sales is exactly who needs it. `recovery_rate` is **null, never 0**, when no checkout was started ("nobody started" ≠ "nobody completed").
- ⚠️ **No supporter identity ever leaves `abandonedCheckouts()`** — not the email, not a name, not a user id. An abandoned checkout is a weaker relationship than a completed purchase, not a stronger one, and the platform's rule that a creator never receives supporter contact details applies in full. A test asserts the encoded payload contains none of it.
- ⚠️ **A wrong `SOURCES` entry fails SILENTLY** — the payment row is simply never found, the check fails closed, and that module's reminders quietly stop. Nothing errors, nothing logs. `tests/Feature/AbandonedCheckoutAllModulesTest.php` is the only thing that would catch it: it drives all 8 product types through record → due → recoverable → send, and asserts each stops once `markRecovered()` fires. **Add a row there when adding a checkout.**
- Tests: `tests/Feature/AbandonedCheckoutRecoveryTest.php` (record fail-safety, idempotent re-record, schedule timing, guest cap, `processing` never chased, settled/expired/no-recipient/no-creator/suspended-creator closed, atomic claim, one-guest-email, dry-run, opt-out, prune + prune dry-run, guest suppression + signed/unsigned unsubscribe, creator panel totals + identity leak).

## Shareable item links (30 July 2026, spennypiggy.co)

A shared listing link unfurled as the generic site card — no product name, no picture, no price — because the shop-item and task pages emitted **no OpenGraph at all**. `App\Services\ItemShareService` is the only implementation.

- ⚠️ **The meta MUST be server-side.** SSR is off (`INERTIA_SSR_ENABLED=false`), and a link unfurler never runs the page's JavaScript, so an Inertia `<Head>` is invisible to it. `applySeo()` is called from the page controller.
- **Only genuinely public pages are in `TYPES`: `shop` and `task`.** `membership/details/{uuid}` and `billing/bill/{uuid}` exist but carry `Authenticate` — an unfurler is redirected to login, so tagging them buys nothing. The wish "page" is the creator profile and is already handled by `AuthenticatedSessionController::setSeoMetaTags`.
- ⚠️ **`image_is_url` per type is load-bearing.** Task stores a **full CDN URL** in `media_url` while Shop stores a **bare uuid** in `image`; getting it backwards yields `ucarecdn.com/https://ucarecdn.com/…` and a dead card everywhere the link is posted. `uuidFromUrl()` extracts the uuid from a stored URL that may already carry operations.
- ⚠️ **`-/quality/smart/`, never `-/quality/85/`** — the numeric form is not a valid Uploadcare operation and the CDN answers **400**, which shows up only as a broken preview. Same trap as the post carousel.
- **`reward_body` never reaches the preview.** A link card is the most public surface on the platform; only the reward *headline* and the creator's own description are used. A test asserts it.
- **Meta is a Stripe-facing surface** — the content-first ban list applies to the title, description and the prefilled share caption, and is enforced by test.
- **A sold-out item stays shareable** (the waitlist is exactly what a sold-out visitor is there for) but its Offer reports `OutOfStock`. The title never says "Sold out" — that would kill the click the waitlist depends on.
- **Share links carry `utm_source=creator_share`** (`ItemShareService::SHARE_SOURCE`). ⚠️ `VisitTracker::SOURCES` is a **fixed list** — a source missing from it is silently counted as `direct` and the whole channel disappears from the funnels, so the value is registered there AND mirrored in the admin app's `MarketingSpendController::CHANNELS`. Distinct from `creator_invite`, which recruits a creator rather than selling an item.
- **UI: `Components/ShareButton.jsx`** — the OS share sheet via `navigator.share` (which is how sharing actually happens on a phone, and the only way to reach Instagram/Messages/Signal), falling back to copy-link + WhatsApp/X/Facebook. ⚠️ **The old Instagram button was removed, not fixed**: it opened `instagram.com/?url=…`, and Instagram has no URL-share endpoint, so it never shared anything.
- **QR code** via `qrcode.react` (`QRCodeSVG`) — its own small button beside Share, not a menu row: on mobile the fallback menu never opens because the OS sheet takes over, and the QR's job is getting a link off a desktop screen onto a phone or handing it over in person. Rendered on white with a quiet zone, which a scanner needs to read it at all.
- **The item pages are in the sitemap** — `/seo/sitemap-shop-items.xml` and `/seo/sitemap-tasks.xml`, chunked and ordered by `id` like the other children, listed in BOTH the index and robots.txt (a child in neither is unreachable — the original bug that left the creator/wishlist/post sitemaps unread). Only publicly buyable rows: approved, not suspended, creator `role=1` and not suspended. ⚠️ `shopQuery()` guards `status`/`is_suspended` with `Schema::hasColumn` — `shops.status` has no migration, so an unguarded `where` throws into `safely()` and publishes an **empty** urlset, which looks exactly like "this creator sells nothing".
- Tests: `tests/Feature/ItemShareTest.php` (attributable canonical link, `reward_body` never in the preview, content-first copy, valid CDN operation, full-URL vs uuid handling, sold-out honesty, unsupported type yields nothing).

## Per-listing analytics (30 July 2026, spennypiggy.co)

A creator could see that something sold, or that it did not — and nothing else. That hides two opposite problems: **seen a lot but not bought** (price/description) versus **barely seen** (distribution). The fix for one is the wrong move for the other. `App\Services\ItemViewTracker` counts, `App\Services\ItemFunnelService` assembles.

- **`item_view_stats`** (migration `2026_07_30_200000`) — one row per item per day per source, unique on all four. **Aggregate only**, exactly like `site_visit_stats`: no per-visitor row, no IP, no stored cookie id.
- ⚠️ **`ItemViewStat` deliberately has NO `date` cast** — with one, Eloquent writes `Y-m-d H:i:s`, MySQL truncates it but SQLite keeps the time, so the unique bucket stops matching and each day fragments into separate rows. Same trap as `SiteVisitStat` and `LeaderboardSnapshot`.
- ⚠️ **This does NOT use `VisitTracker`'s cache-buffer pattern, and cannot.** That flush enumerates `SOURCES × PAGE_TYPES`, a **fixed** key space. Item ids are unbounded, so buffered per-item counters could never be found again and would expire in the cache unread. `ItemViewTracker` writes straight to the table — one upsert per view, insert-then-`DB::raw` increment so two concurrent views cannot read the same value and both write it back.
- ⚠️ **The creator's own views are never counted.** They open their own listing many times a day, and this is the number they are meant to act on. Bots are excluded by reusing `VisitTracker::isBot()`; the source comes from `VisitTracker::resolveSource()` — neither is reimplemented.
- ⚠️ **THREE view states, not two** (`view_state`: `ok` / `none` / `unknown`). Views only exist from the day tracking was switched on, so a zero is ambiguous — and an early version collapsed "tracking was not running yet" with "genuinely nobody looked" into one grey "no data" message, which **hid the distribution problem the whole feature exists to surface**. `unknown` is set when `ItemViewTracker::trackingSince()` (cached MIN over the table) is later than the window start; only then is a zero unreadable. `none` is the actionable one and says "Nobody found this — share the link".
- **Rates are `null`, never `0`,** when the denominator is empty, and the buy-rate badge only renders above 10 viewers — a percentage from three views is noise dressed as signal.
- **Unique views are per ITEM per day**, claimed with `Cache::add` on a key derived from the existing 24-hour `sp_v` visitor cookie — no new cookie and no stored identifier. Deliberately different from `site_visit_stats.unique_visitors`, which is once per day across the **whole site** and therefore meaningless on one listing.
- **"Started checkout" comes from `abandoned_checkouts`**, which records *every* checkout (a completed one is merely marked recovered), so it is the honest "reached the payment screen" count that no payment table can give alone. **"Sold" is defined by a small failure set** (`NOT_PAID`), not a positive list that would need updating on every new status.
- **Owner only** — the funnel is attached inside `shopList`'s `$isOwner` branch. Everything is batched: one query per signal for a whole page, never one per row.
- ⚠️ **The view write is deferred with `dispatch(…)->afterResponse()`.** A listing page is exactly what a popular item hammers, and counting a view must never sit between the visitor and the page. The **unique claim is still taken on the request** (it depends on that request's cookie); only the write moves. Consequence: a test must call `$this->app->terminate()` to make the write happen, because there is no response cycle.
- **UI: `Components/ItemFunnelLine.jsx` is a ruled three-cell strip, not a sentence.** It replaced a run-on line that wrapped mid-arrow, read as body copy and gave three unrelated-looking numbers equal weight. Below it a one-line **verdict** names the problem in the creator's terms ("Nobody found this — share the link" vs "{n} reached checkout and none finished"), and stays silent when the numbers say it already. ⚠️ **`{sold}/{sold + stock} Sold` printed "0/0 Sold" on a new listing** — a fraction of nothing, which reads as a bug; the chip now shows remaining stock ("3 left" / "Sold out") and disappears entirely when stock is untracked and nothing has sold.
- `item-views:prune` (daily 03:50, `--days`/`--dry-run`, `RETENTION_DAYS` = 400) — the table grows with the catalogue rather than with traffic, but is unbounded without it. ⚠️ **Pruning forgets the `trackingSince` cache**: it moves `MIN(date)` forward, and a stale value there answers "were we counting yet?" wrongly for up to an hour.
- ⚠️ **The funnel is attached to APPROVED tasks only.** An unapproved task's page 404s for everyone but its creator, so it has no views by definition — and the funnel would have told them "nobody found this, share the link" about something they cannot share. Advice that cannot be followed is worse than none.
- **`listingPerformance()` caps its scan at `LISTING_SCAN_LIMIT` (60) per type.** Only five a side are rendered; without the cap a creator with a large catalogue pulled every listing and computed a full funnel for each. **`sources()` is skipped entirely when views are unmeasured** — there is nothing to attribute, and it would be a wasted query on every page load of a fresh install.
- ⚠️ **The deferred closure carries its OWN try/catch.** It runs outside `record()`'s, after the response has been sent, so an analytics failure there would otherwise become an unhandled error on a request the visitor already received.
- **Traffic sources per listing** — `ItemFunnelService::sources()` returns the top three by viewers from the `source` column, in one grouped query. Without it a creator cannot tell whether the link they shared did anything, which is the question `creator_share` was added to answer.
- **Three surfaces, two questions:** the per-item strip (`MyShopProducts`, `Tasks/Index`) answers "how is this one doing"; `CreatorOpportunityService::listingPerformance()` powers a **"Which listings are working"** panel on `financial.opportunities` answering the one that only appears across the whole catalogue — which listing deserves promotion and which is quietly doing nothing. A listing with no sales AND no view data is excluded from "stuck": unmeasured is not the same as failing, and telling a creator to fix it would be guessing.
- Tests: `tests/Feature/ItemFunnelTest.php` (owner/bot exclusion, views vs unique views, unsupported type, funnel counts and rates, unpaid ≠ sold, null rates, window boundary, prune).

## Sold-out waitlist (30 July 2026, spennypiggy.co)

A limited-stock listing that sold out went dead: card said "Sold out", the button was disabled, and every visitor after the last sale simply left. The creator never learned the demand existed, so they never restocked. `App\Services\StockWaitlistService` is the only implementation.

- **`stock_waitlists`** (migration `2026_07_30_100000`) — one row per (item, person). `notified_at` is both the state and the claim: once set the entry is spent, so nobody is nagged on every future restock. Two uniques (`shop_id+user_id`, `shop_id+email`) because a guest and an account holder are identified by different columns.
- **Guests may join with just an email.** Requiring an account on a sold-out page throws away the demand the feature exists to capture. `POST /waitlist/join` is public, `throttle:20,1`, and carries `ensureTurnstileVerified` like the other guest-facing writes.
- ⚠️ **`POST /waitlist/leave` is signed-in only and NEVER accepts an email.** Join and leave are not symmetric: the worst a stranger can do by joining is add an address that receives one unsubscribable notice, whereas taking an email on leave would let anyone remove anyone else from a list by guessing their address, unauthenticated. A guest leaves through the signed link in their email, and the button renders as a non-interactive confirmation for them.
- ⚠️ **Restock is detected by a SWEEP, not by a model event — this is the load-bearing decision.** Every path that puts stock back bypasses Eloquent: the refund handler uses `Shop::where(...)->increment()`, the creator edit uses `Shop::where(...)->update()`, and the **admin app shares this database and runs none of this code at all**. A `Shop::updated` observer would have sat there firing on nothing and the feature would have silently never worked. `waitlist:notify-restock` (scheduled **every 10 min**, `--max`, `--dry-run`) is the guarantee; `checkRestock()` is called from the two known sites only for immediacy.
- **Stock alone is not enough to notify** — `buyable()` also requires the listing to be approved, not suspended and its creator sellable. Sending people to a listing that refuses them is worse than saying nothing.
- ⚠️ **`buyable()` reads each publication flag only when the row carries it.** `shops` differs between a freshly migrated database and the deployed one, and an absent column is not evidence that a listing is unpublished — treating it as `0` would make every item permanently unbuyable and silence the feature.
- **The notice states the stock count** and links **straight to the item** (`single-shop-list`), not the creator's shop tab. Everyone waiting is told at once and only a few can buy; making them hunt for a listing we just called nearly-gone guarantees they lose the race.
- **Guest mail is `Mail::to()->queue()`, never `->send()`** — the notify loop can run over thousands of entries in one sweep, and a synchronous SMTP call per guest would hold the scheduler for as long as the mail server takes. ⚠️ Consequence: **the whole feature now needs `queue:work` as well as `schedule:work`** — with no worker the entry is still claimed (`notified_at` set) but nothing is delivered, to guests or account holders.
- **Notifying is idempotent** — the claim is a per-row `whereNull('notified_at')->update(...)`, so a concurrent sweep and an immediate check cannot both notify the same person. A failed send releases the claim for the next sweep. Fan-out capped at `MAX_PER_RESTOCK` (5000), mirroring `CreatorEventNotifier`.
- **A notified person can rejoin** when the item sells out again — the same row re-opens rather than the join being refused.
- **New preference category `restock_emails_enabled`** (migration `2026_07_30_100001`, default true). An account holder who turns it off still gets the bell and push: they explicitly asked to be told, so the send is `$marketing = false` and only the email channel is dropped. A guest's opt-out is the signed 30-day link `GET /waitlist/stop/{waitlist}`, which simply removes that one entry — there is no account-wide list for them to leave.
- ⚠️ **`is_waiting` (viewer-specific) must never enter the profile/Discover payloads** — `UserProfileService::getOptimizedShopItems` is cached for 600s and shared across viewers, so one person's state would render for everyone. It is set only on the uncached item page (`singleShopList`); cards render the button without it and the server dedupes the join. `waiting_count` (not viewer-specific) is attached to the owner's `shopList` via ONE grouped query (`waitingCounts()`), never one per row.
- **Creator UI: "N waiting" chip** on `MyShopProducts.jsx` next to the sold-out warning — this number is the whole point on the supply side; it is what makes a creator restock.
- **The creator is pushed on demand MILESTONES, never on every join** — `DEMAND_MILESTONES` = 1, 5, 10, 25, 50, 100, 250, 500. A listing that attracts fifty people would otherwise send fifty pushes, and a creator who mutes the feature after the third never sees the fiftieth, which is the one worth acting on. Bell + push only (no mailable, and their inbox is not where operational data about their own listing belongs), `$marketing = false` — it is their own sales data, not promotion. Deduped by the `engagement_notifications` claim keyed `shop:<id>:<milestone>`, so two simultaneous joins cannot both fire it and a leave-then-rejoin cannot repeat a milestone. `notifyCreatorOfDemand()` never throws — a join must not fail because a notification did.
- Tests: `tests/Feature/StockWaitlistTest.php` (guest join, duplicate join, in-stock/unlimited refusal, creator self-join both ways, notify-once, sweep-finds-a-query-builder-restock, unapproved/suspended/still-sold-out notify nobody, rejoin, dry-run, batched counts, endpoint refusal surfacing, signed/unsigned leave link, opted-out still gets the bell).

## First listing nudge (30 July 2026, spennypiggy.co)

A creator who connected Stripe onboarding and bank details, but never published a listing, is stuck before using any of the platform's core selling tools. `App\Services\CreatorSetupService` handles checking this.

- **"Has a listing" spans SIX tables:** Check `WishItem` (user_id), `Shop` (user_id), `Task` (creator_id), `PiggyPot` (user_id), `Bills` (user_id), and `Membership` (user_id). Note that `Task` uses `creator_id`, not `user_id`.
- **needsFirstListing is false unless setup is complete:** `stripe_details_submitted` must be 1, `suspended_account` must be 0, and no listing must exist (approved or unapproved).
- **Shared Inertia prop `auth.needs_first_listing`** reads `needsFirstListingFast()`, **not** `needsFirstListing()`. ⚠️ The two return the same answer, but the plain form walks the six tables with `exists()` and short-circuits — so a creator who already sells costs one query while a creator with **zero** listings costs all six, on **every** Inertia navigation. That is exactly the cohort the feature exists for, so the people being helped were paying the most for it. The fast form reuses `candidateQuery()` (one `whereNotExists` per table in a single statement): **measured 1 query vs 6**, and it cannot drift from the emailer's idea of who is eligible because it *is* the emailer's query.
- **OnboardingNudge.jsx second state:** When setup is complete but `needs_first_listing` is true, shows: "You're set up. Now put something up for sale." → *Add your first item*. Uses session key `spenny_first_listing_nudge_dismissed` to avoid collision with setup dismiss.
- **Dashboard card: `FirstListingCard.jsx` was REPLACED by `CreatorJourneyCard.jsx`** (31 July 2026) — it only knew about one step of six. The journey card renders whatever `auth.journey` says, so the listing prompt is now one state of it rather than its own component. Its three-way chooser (file / order / physical) survives, because the listing step is the one place a single button is the wrong answer.
- **Query Parameter `?add=wish|shop|digital|physical`** opens the matching form. ⚠️ **`Dashboard.jsx`'s `Toggle` reads it exactly ONCE during render into `addIntent` and passes it down as a prop — never re-parse `window.location` in a child.** Two separate bugs came from that: `Toggle`'s mount effect strips the query string with `history.replaceState`, and `AddItem` is **lazy-loaded**, so its chunk resolved *after* the strip and read nothing — `?add=digital` opened only the generic chooser. And `FirstListingCard` used to fire a `toggleAddOptions` CustomEvent whose `detail.type` the handler ignores (it only calls `setShowAdd(true)`), so all three of its options did the same thing and the recommendation was meaningless. **The card now navigates** — "Take an order" to `task.create`, and **both shop paths ("Sell a file" / "Sell physical") to `shop-list`, the creator's own shop dashboard** (client direction, 31 July 2026). That screen is where a listing is managed once it exists, and it avoids the stacked chooser-behind-modal that `?add=digital` produced — closing the form there used to drop the creator back onto the chooser. `?add=` is now only used by the nudge email's `wish` CTA.
- **Nudge command `creators:nudge-first-listing`:** Runs daily. Evaluates days since `stripe_connected_at` (falls back to `created_at`). Nudges at 3 days (stage 3) and 10 days (stage 10).
- **Backfill rule:** Creators already past 10 days get exactly one email (stage 10) once. Deduped using `NotificationDispatcher::claim` with key `nudge:<stage>`.
- **Email template:** layout `email.default-2`; `PublishYourFirstItem::subjectFor($stage)` is the one definition of the wording, read by the email subject **and** the bell/push title so the two cannot drift. Sender comes from `config('mail.from.*')` — ⚠️ **never `env()`**, which returns null once Vapor caches config on deploy and silently falls back to a hardcoded default.
- ⚠️ **Consent is enforced by the COMMAND, not the dispatcher.** The send is `$marketing = false` because a creator's own account state is operational — but that flag bypasses the consent gate entirely, so `channelsFor()` drops **only the email channel** when `creator_updates_enabled` is false. Without that the unsubscribe link printed in the email was decorative: the creator clicked it, the flag flipped, and the next run emailed them anyway. Bell and push are kept regardless, the same split the sold-out waitlist uses.
- **`--max` caps creators NUDGED, not creators examined.** ⚠️ Capping the query instead meant a run whose first N candidates were all too recent sent nothing, while creators past day 3 beyond the cap were never reached on *any* run — silent, and it grows with the table. The command iterates `candidateQuery()` with a cursor ordered by `COALESCE(stripe_connected_at, created_at)` and breaks on sends.
- ⚠️ **`candidateQuery()` builds each `whereNotExists` from the model's own builder closed with `toBase()`**, so global scopes apply. All six listing models soft-delete; a hand-written `from($table)` subquery bypasses that, and a soft-deleted listing would still count as published — the creator would never be nudged again while `hasAnyListing()` said the opposite.
- ⚠️ **`stageFor()` returns null for a future `stripe_connected_at`.** `diffInDays()` is absolute, so clock skew or bad data would otherwise read as "connected 90 days ago" and fire the final nudge immediately.
- **Admin Funnel Stage:** Added "Published something" stage between "Stripe connected" and "First sale" in `admin.spennypiggy.co/app/Services/FunnelAnalyticsService.php`, ensuring each stage is a mathematically strict subset of the previous stage.
- **Tests:** `tests/Feature/FirstListingNudgeTest.php`, 20 passing — each of the six listing types stopping the nudge, Stripe/suspended/role gating, unapproved listings still counting, soft-delete bringing it back, backfill, `--dry-run`, `--max` capping nudges rather than rows, a future connect date, the email channel dropping on opt-out, and **one creator receiving stage 3 then stage 10 then nothing**. ⚠️ Assertions go against `engagement_notifications` and the queued `SendEngagementNotification` (channels + `marketing === false`), **not** the command's console output — counters moving proves nothing was delivered. ⚠️ A data-provider key must match the test's parameter name (`fieldsCallback`, not `fields`) or the cases report as *deprecated* rather than passed and break on PHPUnit 11.

## Creator journey — one answer to "what do I do next" (31 July 2026, spennypiggy.co)

`App\Services\CreatorJourneyService` is the ONLY definition of a creator's next step. Before it, that question was answered by a dashboard checklist, a setup nudge bar, the first-listing card, a fourteen-day drip **running in the admin app**, and the posting-cadence enforcer — none of which knew what the others had said.

- **State-based, never calendar-based.** The current step is the first one in `STEPS` that is not done: `profile → identity → stripe → first_listing → first_post → first_sale → done`. Finish three in an hour and the journey moves three places in an hour. This is what stops a creator who set everything up on day one still being emailed "add your first item" on day three.
- ⚠️ **`awaiting_review` is the load-bearing flag.** Two steps are finished by the creator but *completed by an admin* (`avatar_approved`/`bio_approved`, and `identity_status = 2` meaning submitted). "Not done" therefore does not mean "they have not acted" — measured on live data, **11 of the 30 creators sitting on `profile` had already written a bio and were waiting on approval**. `nextStep()` swaps in `REVIEW_COPY` ("Your profile is being reviewed — nothing to do") and **callers MUST NOT nudge, email or push while it is true.** Nagging someone for work they have done is precisely how a guidance system teaches people to ignore it.
- **Live distribution when this shipped (46 creators):** profile **30** · first_listing 8 · stripe 4 · first_sale 1 · identity 1 · done 2. Module 5 targeted the 16 stuck at `first_listing`; **twice that many are stuck before it**.
- ⚠️ **`users.journey_step` exists because the two apps share a database but not code.** The onboarding drip that emails creators runs in `admin.spennypiggy.co` and cannot call this service, so the website computes the answer and **the admin app only READS the column** — the alternative was a second copy of the step logic on the admin side, which is the cross-app drift trap. Migration `2026_07_31_000000` adds `journey_step` (indexed), `journey_step_at` and `journey_completed_at`. `journey_step_at` is when the creator **entered** the step, not when it was last written — a creator stuck for three weeks is the signal worth acting on, and a plain updated-at cannot express it. NULL means "not computed yet", never "at the beginning".
- **`journey:sync` runs HOURLY** (`--user=`, `--dry-run`), deliberately before the admin drip's 10:00/20:00 sends. A sweep, not a model observer: the signals it reads are written from many places — a listing created here, a post approved in the **admin app**, an identity webhook from Stripe — and several bypass Eloquent events entirely.
- **Copy lives in `STEPS`/`REVIEW_COPY` and every surface renders from it**, so the card, the bar and the drip email cannot contradict each other. Content-first wording only — this text coaches creators on what to publish, and Stripe reads what they publish. Each step also carries its own `route` + `params`.
- ⚠️ **A step's CTA must not point at the page the card is already on.** `first_post` and `first_sale` both used a bare `'dashboard'` route, and `CreatorJourneyCard` renders **on** the dashboard — so two of six steps had a button that navigated nowhere. `first_post` now carries `['add' => 'post']` and `first_sale` has **no route at all**: it renders `Components/ShareButton.jsx` in place, because sharing is the action and sending someone elsewhere to find a share button is one step more than they need.
- **`?add=post` opens the composer DIRECTLY, deliberately not via `showAdd`.** The `AddPost` inside the chooser would need the chooser open behind it — the stacked-modal problem `?add=digital` already had, where closing the composer drops the creator onto a menu they never asked for. `Dashboard.jsx` renders its own controlled `AddPost` outside the chooser for this.
- **Dismissing a step hides it for `DISMISS_DAYS` (7), not forever.** Six steps each with a permanent hide is six chances for a creator to bury their own blocker — usually the listing step — and never see it again on that device. Closing a card means "not now", not "never".
- **`OnboardingNudge.jsx` derives nothing.** It used to read `stripe_details_submitted`, `avatar_approved`, `identity_status` and count "steps left" itself — a second implementation that could disagree with the card. It now renders `auth.journey` and suppresses itself on the dashboard, where the card is already saying the same thing.

### "Paused" now says what it costs (3 Aug 2026)

⚠️ **The cadence states were surfaced as their raw keys** — `grace` / `at_risk` / `paused` — which say nothing about money to the person whose money it is. Creators repeatedly did not understand that `paused` meant their subscription income had stopped. `PostingCadenceService::statusFor()` now also returns:

- **`headline`** (`HEADLINES`) — the state in the creator's terms ("Your subscription payments have stopped").
- **`consequence`** — one sentence naming the money, never the rule: *"Your 4 subscribers are not being charged right now… collection restarts automatically the moment you post again."*
- **`checklist[]`** — ordered steps, each an ACTION with its own CTA route ("Publish 2 more posts for members" → `dashboard?add=post`). A diagnosis is not an instruction, and the activity page was full of diagnoses.

All three are read by every surface, so the profile strip, the widget and `/creator/activity` cannot describe different requirements.

- **`Components/Creator/ActivityStatusBanner.jsx`** — the state plate, the consequence, and a **three-block post meter** (three discrete posts, not a percentage; a bar cannot say "one of these expires on Thursday"). Its device is the page's own offset shadow, **red once income has stopped**. Exports `PostMeter`.
- **`Components/Creator/CadenceChecklist.jsx`** — the steps, rendered at the top of `Creator/ActivityStatus.jsx` above all the existing reporting.
- ⚠️ **`CreatorActivityWidget` was rebuilt and MOVED to the top of the creator's own profile tab, above "About me"** — it previously sat ~1,000 lines down the page behind a Stripe-connected gate, and set its whole body in dark red so the failure, the reassurance and a neutral count all shouted equally. Colour now appears only on the state plate. **There is exactly one of these on the page**: a second strip was briefly added at the top and left the profile saying the same thing twice in two tones. It keeps the "Separate rule" divider — the top half is the 28-day purchase-time content gate, the bottom half is the 30-day posting cadence.

### Posting cadence tells the creator BEFORE the money stops

- `warnAtRisk()` sends bell + push + **email** (`App\Mail\PostingCadenceWarning`) while a creator is below the threshold, claimed **once per ISO week** (`posting_cadence_warning`, key `week:<o-W>`) — the command runs daily, so an unclaimed warning would arrive every morning and be muted long before it mattered.
- ⚠️ **There is now a NOTICE PERIOD, because there used to be no gap at all.** The logic was `below && !paused && !pastGrace → grace`, then `below && !paused → pause` — a creator past grace who dropped below the threshold was paused by the *same run*. A warning placed in the grace branch therefore only reached creators inside their first window, the ones with the least at stake; on live data it reached **0 people**. Now: the first past-grace run **warns and stamps `users.content_posting_warned_at`** (migration `2026_07_31_100000`), and collection is paused only once that stamp is older than `PostingCadenceService::WARNING_DAYS` (**3**). Enforcement exists for Stripe compliance and three days costs it nothing; income stopping unannounced costs the creator a lot.
- ⚠️ **The stamp is written BEFORE the send and outside the weekly claim.** If it were set only on a successful send, a creator whose warning failed or was suppressed by the claim would never start their notice period and could never be paused — enforcement would silently stop for them. Failing this way round gives them the full window without the message, rather than a pause without one.
- ⚠️ **Meeting the threshold CLEARS the stamp.** Without that a recovered creator keeps a spent clock, and their next lapse pauses them instantly with no notice — reintroducing the exact failure. The grace branch deliberately does **not** start the clock: it would run down before they are even pauseable, so grace would end and collection stop on the same day.

### 🚨 The meter says WHY a post did not count (14 Aug 2026)

A creator published two posts and the strip still read **0 / 3**, with a checklist telling
them to write more. Two rules exclude a post the creator can see on their own profile, and
the count could express neither, so "the platform lost my posts" and "they are in the queue"
looked identical.

- **`pending_review`** — member posts inside the window at `approved = 0`. Every post is
  created unapproved and is cleared in the **admin app**, so a creator who has just done the
  work legitimately reads zero. ⚠️ There is **no reject handler for posts anywhere in either
  app** (`can_reject` is false for the `post` queue), so `approved = 0` always means
  *waiting*, never *refused* — which is what lets the copy promise it will count.
- **`non_member_posts`** — posts in the window whose `for_module` is not in `GATED_MODULES`.
  ⚠️ Computed **only when the creator is short** (`$count < MIN_POSTS`): a creator who is
  fine does not need to be told their public posts are public, and it saves the query.
  `for_module` **is** editable on `editPost`, so the copy says to change that post's
  audience rather than to start again (an edit re-enters moderation, as any edit does).
- 🚨 **Neither may EVER be folded into `member_posts`.** That number is the rule that pauses
  real subscription income; a meter reading 3 / 3 while collection stops is worse than the
  confusion it fixes. They are separate keys, and `PostMeter` draws pending posts as
  **half-filled dashed** blocks — work done, not yet counted.
- `countingPostsQuery()` is still the ONE definition of a counting post; it and the two new
  queries now share `postsInWindowQuery()` (user + non-system + window) so the predicates
  exist once. ⚠️ System `support_thanks` posts are excluded from **all three** — the platform
  wrote them, so surfacing one as a near-miss the creator can fix is wrong advice.
- ⚠️ A pending post whose `created_at` is already outside the window can never count once
  approved (the window keys on `created_at`), so it is **not** reported as waiting — telling
  the creator it will count would be a lie. Pre-existing behaviour, now asserted.
- Surfaces: `PostMeter` (shared by the profile strip, `CreatorActivityWidget` and
  `/creator/activity`), the checklist rows `awaiting_review` and `wrong_audience` — both
  inserted **above** "publish more posts", because telling that creator to write another one
  is both wrong and the reason the number looked broken.
- Tests: `tests/Feature/PostingCadenceUncountedPostsTest.php` (8). ⚠️ A test helper named
  `post()` is a fatal collision with `TestCase::post()` — same trap as `session()`.

## The landing page sells only what is BUILT (10 Aug 2026, spennypiggy.co)

Client review of the whole page, top to bottom. The single theme: the homepage was
advertising the store-item wishlist — *"drop a link to anything from any store,
delivered to your door"* — **which is not built and is not scheduled until 2027**.
It appeared in the hero cards, both How-It-Works sections, the wishlist showcase,
a paste-box section, and the card mock-ups.

- 🚨 **Nothing on this page may describe a feature that does not exist**, and the
  same rule now applies to DEAD copy: `Welcome.jsx`'s `FUN_CARDS` was declared and
  never rendered, yet still carried *"buy the things on your list, from any
  store"*. Dead copy is the copy that gets pasted back in.
- 🚨 **`home/WishlistShowcase.jsx` was missed on the first pass and is LIVE** — it
  is rendered by `LiveBarSection`, not by `Welcome.jsx`, so it survived a sweep of
  the obvious files. Its 3D card fan advertised **AirPods Max £499, Stanley
  Tumbler £49.99, iPhone 16 Pro £1,200 and Ninja Slushie £349.99**, each with an
  "Add to wishlist" button: the unbuilt store wishlist AND four brand names
  `NoExpenseOrBrandName` rejects on a real listing. ⚠️ **It also hid from a
  rendered-text sweep** — the fan is 3D-transformed and lazy-loaded below the
  fold, so `document.body.innerText` did not contain it. **Grep the SOURCE, and
  scan `document.documentElement.innerHTML` rather than `innerText`, when
  clearing copy.**
- ⚠️ **Meta copy carried the ban list too, in two places nobody thinks of.**
  `app.jsx`'s `createInertiaApp({ title })` appends a suffix to EVERY page title
  on the site (it read *"…Gifts, Memberships, Exclusive Content & More."*), and
  `StaticPageSeoMiddleware`'s `$seoData` map said "tips" on the home, features,
  register and tools entries — the one word a whole feature was renamed to avoid.
  Both are printed in search results and social cards.
- **Removed entirely:** `home/NotForBusiness.jsx` (a SECOND "How it works" whose
  step 2 sold the store wishlist) and `home/WhyLove.jsx` (the "Add from your
  Favourite Stores" paste box — an input for a feature that does not exist).
  ⚠️ Removing a section means removing its `CHAPTERS` entry in `Welcome.jsx` too:
  `act-build` went with `NotForBusiness`, and a rail stop that scrolls nowhere has
  nothing equivalent to `route:list` to catch it.
- **Mock-ups are held to the platform's own validation.** `WishlistPreview.jsx`
  listed AirPods Max / Stanley Tumbler / iPhone 16 Pro — wording
  `App\Rules\NoExpenseOrBrandName` REJECTS on a real listing, so the homepage was
  modelling a listing the platform refuses. Now content/custom-work/membership at
  prices inside the real per-feature limits. `"sent"` became `"unlocked"` /
  `"joined"` for the same reason — *sent* reads as a gift.
- ⚠️ **"No fees, ever" is gone from step 3 and must not return.** It is untrue
  (platform fee + monthly subscription) and an unqualified free claim is a Google
  Ads policy flag on a page that runs paid acquisition. The honest line is
  stronger: *"You keep 100% of your listed price — supporters cover the fees at
  checkout."*

### New sections

- **`home/WaysToGetPaid.jsx`** — every way a creator can be paid, in one place.
  The range is the most persuasive thing the platform has and it was spread over
  six sections, so nobody saw it. ⚠️ The heading COUNTS what is on screen
  (`countWord(TOTAL)`) rather than stating "Eight" — one entry is behind a switch,
  and a hardcoded number becomes a lie the moment it is pulled.
  ⚠️ Piggy Bank is described as a ONE-OFF content purchase, which is what it is;
  the client's draft called it *"ongoing backing… not just buy from you"*, which
  both misdescribes it and undoes its content-first reframing.

  🚨 **THE SHAPE IS THE ARGUMENT, and the first build got it wrong.** Eight equal
  bordered cards in a gapped rail is a CATALOGUE, and a catalogue makes eight
  things read as eight chores rather than eight places money arrives from. Three
  structural fixes, all of which should survive any future restyle:
  - **The tiles ABUT.** The hairline between them is the GROUP's background
    showing through a 1px gap (`gap-px` over a tinted parent), never a border per
    tile — borders double up between neighbours and need per-position resets at
    every breakpoint. The group then reads as one object made of parts, which is
    the thesis: many sources, one income.
  - **They are grouped by WHEN THE MONEY ARRIVES** — paid once (5) vs paid every
    month (2). That is the only axis a creator decides on, and it is true of the
    products rather than imposed on them.
  - ⚠️ **ONE colour per group, not one per tile.** Eight accents is no accent, and
    that alone was most of why it read as generic. Mint = paid once, pink =
    recurring, violet = the announced-but-unbuilt exception.
  - **The payout terminus is the only FILLED block in the section.** It is why the
    tiles above are joined at all; spending the section's boldness anywhere else
    leaves it reading as one more card.
- **`rounded-box-sm`/`rounded-box` and the dashed edge are now a small system.**
  ⚠️ **On the landing page a DASHED border means "announced, not built".** It is
  used on the stablecoin tile in `WaysToGetPaid` and on the whole
  `StablecoinTipsAnnouncement` frame, and it goes solid when
  `STABLECOIN_TIPS_LIVE` does — not when the feature merely feels closer.
- **`home/PricingSection.jsx`** — "no charge until your first sale" had lived as
  an 11px asterisk under the hero. ⚠️ **No supporter fee PERCENTAGE appears on it**:
  rates differ per payment method and per creator (bespoke agreements), so any
  single number is wrong for someone. It states that supporters see their full
  total before paying and links to the breakdown.
- **`home/StablecoinTipsAnnouncement.jsx`** — see below.

### 🚨 Stablecoin Tips is ANNOUNCED, NOT BUILT

`resources/js/constants/stablecoinTips.js` is the ONE source of its copy and the
two flags that govern it: `STABLECOIN_TIPS_ANNOUNCED` (publishes the marketing)
and `STABLECOIN_TIPS_LIVE` (flips future tense to present). There is no route, no
model and no provider adapter — the build is gated on legal review and on Coinflow
confirming their payout mechanics.

⚠️ **Four claims in the client's draft copy are NOT in the agreed specification**
("Stablecoin Tip — Agreed Specification", 6 Aug 2026) and are deliberately absent.
Do not restore them without a spec change:

| Draft claimed | Spec says |
|---|---|
| "Doesn't wait for the Friday payout" | The opposite — payouts *"should follow the normal Friday rhythm"*, and whether Coinflow supports scheduling is unconfirmed |
| "No Spenny Piggy reserve" | Whether a reserve applies is an OPEN item owned by the client and Coinflow |
| "$5 to $1,000 per tip" | £5–£1,000, with GBP-vs-USD denomination flagged as unresolved and blocking. £1,000 ≈ $1,270 |
| "No wallet needed" | Not stated anywhere; whether USDC pay-in is even enabled on the account is an open question |

What IS safe to say, and is what ships: a voluntary, content-free tip in USDC,
settled through a partner independently of Stripe, creator receives the full
amount, opt-in, creators in the US/UK/EU/Brazil. ⚠️ The content-free framing is
**required**, not a slip — the spec mandates a checkout disclosure saying the
supporter receives nothing in exchange. ⚠️ No launch date is printed: the build
has not started, so any date is a guess the page would be held to.

🚨 **The section is deliberately NOT dressed as crypto.** The spec is explicit
that this is *"payment resilience, not a crypto pivot"*, so neon gradients and
chain imagery would misrepresent the product as well as looking like every other
page that mentions a stablecoin. It is built instead around the one genuinely
remarkable thing: **every other payment on this platform is required to produce a
`Deliverable` — this is the exception.** Hence the heading (*"Nothing to make.
Nothing to send."*) and the signature, a three-step strip whose first two steps
are HOLLOW and whose third is solid. The absence is the product, so the shape
shows it and no sentence has to.
⚠️ **The filled step takes BLACK text, not white** — measured, white on `#924DFF`
is 4.44:1 and AA wants 4.5 at that size; black is 4.73:1, and it matches the
black-on-pink the payout terminus already uses for a filled brand block.

### The FAQ was publishing wrong prices and payout terms

⚠️ It said *"service fee, starting at just 8%"*, *"£29.99 per month"* and a
*"2-day roll / 7-day roll"* payout timing — all published, all findable in search,
none true for a long time. Replaced with the client's eight questions, **SFW second
so it is visible without expanding anything**. The price and the free-period
promise are READ FROM `constants/creatorSubscription`, never retyped. (There is no
FAQPage JSON-LD on this page — the answers are a plain array.)

### The free-period promise is a CONFIG SWITCH, in four places

`creator_subscription.free_until_first_sale` is a switch the client intends to
revisit, so every surface that states it BRANCHES rather than asserting it:
`Hero.jsx`'s `TRUST_POINTS`, its footnote, `PricingSection`, `FAQ`, and
`Components/JoinUs.jsx`. Switching the policy off must change the page, not leave
it advertising something the billing code no longer does.

### 🚨 dev.spennypiggy.co was fully indexed by Google

`config/seo.php` → `seo.indexable`, defaulting to `APP_ENV === 'production'`
(`SEO_INDEXABLE` overrides). `StaticPageSeoMiddleware` serves
`noindex,nofollow,noarchive` plus an **`X-Robots-Tag` response header** on a
non-indexable host — the header covers fetchers that never render the markup.

🚨 **A non-production host does NOT get `Disallow: /`.** Google must CRAWL a page
to read the noindex on it, so blocking the crawler is exactly what freezes an
already-indexed dev site in the results permanently. `SeoController::robots()` and
`::robotsTxt()` therefore serve a permissive file with **no sitemaps advertised**.
⚠️ Removing what is already indexed still needs a Search Console removal request —
the noindex only stops it recurring. ⚠️ `testing` is non-indexable by default, so a
test asserting the production robots.txt must set `config(['seo.indexable' => true])`.

Tests: `tests/Feature/NonProductionNoIndexTest.php` (6 — the header, production
carrying none, the crawl staying open, no sitemaps advertised, and the default
being production-only).

### 🚨 A hook dependency array is evaluated EAGERLY (found 3 Aug 2026)

`resources/js/Pages/cart/SubCheckout.jsx` declared

```js
const onTurnstileVerify = useCallback(..., [setData]);   // reads setData HERE
const { data, setData } = useForm({...});                // declared BELOW
```

The dep array is a plain argument — unlike the callback body it is NOT deferred — so
`[setData]` read the binding inside its temporal dead zone and threw *"Cannot access 'm'
before initialization"* on **every** render. **The entire wish/subscription checkout was
dead for every visitor**, and had been since the Turnstile stable-ref change landed
(confirmed byte-identical in `git show HEAD:`). `npm run build` and esbuild both pass —
an undefined/TDZ identifier is not a syntax error, so nothing catches it before the
browser. `MemberCheckout.jsx` has the correct order; match it.

**THREE separate bugs of this class reached the browser during one feature** — a missing
import, an undeclared variable, and a map parameter referenced by the wrong name
(`creatorIdOf(item)` inside `items.map((c) => …)`, which turned a mispriced basket into an
unreachable one). Every one of them passed `npm run build`. Three scanners exist for
exactly what the build cannot see, each verified against a fixture reproducing the real
bug: a **TDZ check** (balanced-paren match of each hook call, then compare its dep array
against where each binding is declared), a **pricing-symbol check** (every file calling
`feeRatesFor`/`supporterTotal`/`creatorIdOf` must import it, and `__pageProps` must be
declared), and an **unbound-identifier check** (a bare identifier passed to any of those
helpers must be bound in the file). Same class as the admin app's documented "component
used but never imported = white screen".

⚠️ **Creator net was one minor unit SHORT on non-GBP charges** — pre-existing, found by
sweeping 288 price/currency/method/rate combinations (an earlier GBP-only sweep reported
it clean). The supporter total is CEILed while the Stripe and platform fees round half-up,
so the parts could sum to more than the whole; the currency-converted £1 admin fee added a
second rounding. `calculateStripeDirectChargeFlow` now takes any shortfall off the
**application fee** — never off the supporter, which would be a silent price rise for every
creator on standard pricing. Guarded so it can only reduce the platform's take, and it
logs loudly if the shortfall ever exceeds the fee.

Tests: `tests/Feature/CreatorFeeOverrideTest.php` (11) and `CreatorFeeOverridePricingTest.php` (10) —
no-override byte-identical, per-method independence, ended/future/renegotiated agreements, a typo'd
rate rejected, preview == charge, history immunity after a deal change, the repricing job
grandfathering an increase, and the 288-combination creator-net sweep.
JS: `tests/javascript/pricing.test.js` (13), run with `npm test`.

⚠️ **Jest had never run in this project** — FOUR faults at once: `jest.config.js` was CommonJS
under `"type": "module"`; `moduleNameMapping` is a typo for `moduleNameMapper`, so `@/` never
resolved; `jest-environment-jsdom`, `jest` and `babel-jest` were not installed; and the
`setupFilesAfterEnv` file the config pointed at did not exist. Fixed — config is now
`jest.config.cjs`. ⚠️ **Babel options are declared INLINE in that config with
`configFile: false`**: a root `babel.config.js` would also be picked up by
`@vitejs/plugin-react` and change what the production bundle compiles to, so a test-only
concern must never reach the build.

**`npm run check` runs three static checks and `npm run build` depends on it** — see the
scanner note above. They exist because the build cannot see this class of fault.

## Creator subscription — no charge until first sale (31 July 2026, spennypiggy.co)

Client decision: a creator is **not charged until they make their first sale**. The card is still collected at exactly the same step, so the filter keeping junk sign-ups away from Stripe Identity (which bills the platform per check) and the admin queue is **unchanged** — only the moment of the first charge moved. Previously the card was taken at sign-up and charged 3 days later, before the creator had earned anything, which was the largest drop-off in creator onboarding.

- **`config/creator_subscription.php` + `App\Support\SubscriptionPlan` are the ONE source** of price, VAT and the promise wording; `resources/js/constants/creatorSubscription.js` mirrors it for the frontend. The figure and the copy were previously retyped across twelve files — which is how `creators/Disputes.jsx` came to advertise a stale **£4/month**, and `SiteSubscription.jsx` carried its own `const PRICE`. Nothing should read `config('creator_subscription.*')` directly or retype the price in JSX.
- **`free_until_first_sale` is a switch, not a constant** (`CREATOR_SUBSCRIPTION_FREE_UNTIL_FIRST_SALE`). The client's stated plan is to run it during the early phase and revisit charging from day one once the platform has a track record; turning it off restores the old `legacy_trial_days` behaviour. Other env: `CREATOR_SUBSCRIPTION_PRICE` (8.99), `CREATOR_SUBSCRIPTION_VAT_RATE` (20), `CREATOR_SUBSCRIPTION_FREE_PERIOD_DAYS` (1095), `CREATOR_SUBSCRIPTION_TRIAL_DAYS` (3).
- ⚠️ **Stripe has no infinite trial** — `trial_end` is always a timestamp. The subscription is parked on a `free_period_days` trial and `App\Services\SubscriptionActivationService` ends it on the first sale via `StripeControl::endSubscriptionTrial()` (`trial_end: 'now'`, idempotency key required — it CHARGES). `SubscriptionPlan::freePeriodDays()` clamps to ≥1: a zero or negative value would put `trial_end` in the past and Stripe would bill on day one, the exact outcome the feature prevents.
- **The free period is gated on "has this creator ever SOLD", never on "has this creator used a trial".** The old `$hasUsedTrial` test billed a returning creator immediately even though they had never earned — the objection the change exists to remove. A creator who HAS sold is billed straight away on their return (ToS §21.1.4). **There is one definition of "first sale"** — `CreatorJourneyService::isDone($creator, 'first_sale')` (completed income FTs only, so a refunded or pending payment is not a sale). Do not write a second query; billing and the journey card disagreeing is a week-long bug.
- ⚠️ **`monthly_charges.first_sale_activated_at` (migration `2026_07_31_000001`) IS the idempotency claim, not an audit field** — claimed with `whereNull(...)->update(...)` BEFORE the Stripe call. It is claimed **by `stripe_id`, across every row carrying it**, never by local row id: the webhook and the redirect handler each create their own `monthly_charges` row, so one Stripe subscription can be described by two local rows and claiming only the one you read leaves the other for the next sweep to bill again. A failed Stripe call **releases** the claim — leaving it set would mark the creator activated while Stripe still had them on a trial, and they would sell for months unbilled.
- **`subscription:activate-on-sale`** (scheduled **every 15 minutes**, `--max`/`--user`/`--dry-run`). A sweep, not a model event: the paths that complete a sale write through query builders and webhooks that fire no Eloquent events. `--max` caps creators **activated**, not examined.
- ⚠️ **`payMonthlyCharge` must create the row with `'status' => 'initiated'`.** The column is nullable with no default, and `handleMandatorySubscription` refuses anything whose status is not exactly `'initiated'` — so a NULL-status row made the success redirect answer *"Subscription already processed!"* **every time**, never recording `stripe_id`. The webhook was the only path that ever completed a subscription, and every checkout left an orphan row behind.
- 🚨 **`User::computeSubscriptionStatus()` treats a live free period as an ALLOW-LIST (`trialing`/`trial_ending`), never a deny-list.** The parked trial date sits ~2 years out and is **not cleared when billing starts**, so any status that slips through reads as "still free" and the creator keeps selling for two years. Written first as `!== 'initiated'`, a failed card promptly slipped past: `invoice.payment_failed` writes `'failed'`, which read as an ongoing free period. On the old 3-day trial that hole was three days wide; the parked trial made it two years. Add a status there only if it genuinely means "not charged yet, by design".
- 🚨 **An `initiated` row is a checkout that was STARTED, not one that completed, and `User::computeSubscriptionStatus()` must not read it as an ongoing trial.** Trial dates are written *before* the creator is sent to Stripe, so abandoning the Stripe page still granted payment eligibility for the length of the trial. That was a 3-day hole; with the parked trial it would have become a permanent one.
- **`trial_ending` is now actually written.** `customer.subscription.trial_will_end` sets it and returns early — previously that event fell into the create-a-trial-record branch, which was wrong. It is already in all three allow-lists (eligibility, `CONVERTIBLE_STATUSES`, cancellation timing), so a creator in that state stays eligible and still activates on first sale. ⚠️ Under free-until-first-sale the parked trial is 730 days out and Stripe fires this 3 days before trial end, so in practice the branch is unreachable — it matters only if the policy is switched off.
- **Statuses:** `initiated` (checkout started) → `trialing` (free period, written by the webhook and the redirect handler) → `paid`. `CONVERTIBLE_STATUSES` = `trialing`/`trial_ending` is what the sweep looks for — if a future writer uses a different string, **nobody is ever billed and nothing errors**.
- **Legal:** ToS §21.1.2–21.1.5 — free until first sale, a refund does not reverse a subscription already started, returning sellers bill immediately, **no cancellation or exit fee**.
- ⚠️ **The digital waiver is a real checkbox, not a stamp.** `payMonthlyCharge` used to write `digital_waiver_confirmed_at => now()` with the comment *"Auto-confirm since it's not required to be clicked"* — the platform recorded a consent the creator had never given. It now validates `digital_waiver` as `accepted` and stores the exact wording shown (`SubscriptionPlan::waiverText()`) in `digital_waiver_text`, so the record says *what* was agreed, not just when. **`mandatory.checkout` is a POST for this reason** (a consent a link can trigger is not consent, and a GET carries no CSRF token) — `ActivateSubscription.jsx` submits it with `router.post`.
- 🚨 **`£0.00` is only true while the creator has never sold.** `ActivateSubscription.jsx` derives one `dueToday` value (`freeRun ? '£0.00' : plan.total_formatted`) and both the card and the mobile sticky bar read it, so they cannot disagree. A returning creator who HAS sold is billed the moment they subscribe — printing £0.00 at 80px to them would be the most prominent lie on the platform. Same rule on `SiteSubscription.jsx`, where the promise panel and the period meter are both suppressed unless `free_until_first_sale` and the creator is pre-first-sale.
- 🚨 **Checkout runs in `setup` mode: the card is saved and NO subscription is created until the first sale.** Stripe renders a subscription's trial terms itself and offers no way to suppress them, so the parked 730-day trial made the checkout page read *"730 days free — then £10.79 per month starting July 31, 2028"* while a creator selling next week is charged then — two years before the date printed on the screen where they hand over their card. With no subscription there is no trial for Stripe to describe. `CREATOR_SUBSCRIPTION_CHECKOUT_MODE=subscription` rolls it back **without a deploy**; an unrecognised value falls back to the legacy path rather than silently opting creators into the newer one.
- **Both activation paths coexist, so nothing had to be migrated.** `SubscriptionActivationService::activate()` branches on whether `stripe_id` is set: a legacy row has a parked trial to END, a setup-mode row has only `monthly_charges.stripe_payment_method` (migration `2026_08_01_000000`) and gets its subscription CREATED. The claim and idempotency key follow the same split — Stripe subscription id when there is one, local row id when there is not.
- ⚠️ **`invoice_settings.default_payment_method` must be set explicitly.** Stripe attaches the card itself when Checkout creates the subscription; nothing does that for a card saved by a SetupIntent, so omitting it creates a subscription that immediately fails to collect. `createPlatformSubscription()` also passes `default_payment_method` directly, belt and braces.
- ⚠️ **SUPERSEDED 12 Aug 2026 — see "Site Subscriptions is a list of CREATORS, not of billing rows" below.** The precedence rule below still holds; the separate `noCardQuery()` listing and the row-based table it describes are gone. **Admin `/monthly-charges` classifies each CREATOR once, by precedence — never counts rows by status.** Every billing creator also owns an `ended` row (the free-period row is closed when the paid-period row is created), so a `GROUP BY status` put the same person in "Billing" and "Stopped" at once and made paying creators read as churn. Order: billing → card on file → failed → stopped → abandoned. ⚠️ **Bucketed in SQL, never by loading rows** — `monthly_charges` gains a row per billing period per creator forever, so grouping them in PHP was fine at 14 creators and would be tens of thousands of rows on every admin page view later (2 queries, measured). Each summary card links to its cohort. ⚠️ The **"no card"** count needs its own query against `users`: those creators have no `monthly_charges` row at all, so the page's own listing can never show them — and they are the largest group (44 vs 13 billing when this shipped). Its list and its count share `noCardQuery()` — a headline number that does not match the list behind it is worse than no number. The list shows profile / identity / payouts state rather than billing columns, because these creators have no billing data and empty cells would repeat the "N/A · N/A" mistake.
- ⚠️ **Billing history lists rows that were actually CHARGED** (`current_start_subscription_date` set), not every `monthly_charges` row. A free-period row has no dates, no charge and no invoice, so `SubscriptionHistory.jsx` rendered it as "N/A · N/A" with a stray Stripe id and an amount — a billing record for something never billed. Legacy trial rows are the same case.
- ⚠️ **The subscription email must never print `monthly_charges.status`.** It is an internal enum, and each billing period gets its own row — the row that started a subscription is flipped to `ended` the moment the paid-period row is created, so `email/monthly-subs.blade.php` read *"Your payment for monthly subscription is ended"* in a subscription-STARTED email. Note that mailable renders **`email.monthly-subs`**; `email/creator_subscription4_start.blade.php` is referenced by nothing.
- 🚨 **The creator is told when billing starts — email, bell and push.** `MonthlySubscribedJob` carried a `'success'` branch, a mailable and a template all along, and **nothing in the codebase ever dispatched it**: the only dispatch anywhere passes `'failure'`. So a creator's card was charged in silence. `activate()` now sends all three on a successful collection, `$marketing = false` (money has already moved; there is no version of that a creator may opt out of), skipped when the charge failed, and wrapped — a failed notification must never make a completed activation look failed.
- 🚨 **Eloquent query builders are MUTABLE — never reuse one across a claim and its release.** The activation claim's `whereNull('first_sale_activated_at')` stayed attached to the shared builder, so the release on failure matched nothing and the claim was kept forever: that creator was marked activated and could never be billed. Silent, and visible only in the database. Build a fresh query each time (a closure, not a variable).
- 🚨 **`subscriptions->create()` does not accept an inline `price_data.product_data`** — that is a Checkout convenience and fails with *"Received unknown parameter: items[0][price_data][product_data]"*. A subscription needs a real product id; `StripeControl::platformSubscriptionProductId()` creates-or-reuses one under a deterministic id so no per-environment configuration is needed.
- 🚨 **The local status is derived from what Stripe actually did, never assumed to be `paid`.** An off-session charge needing authentication, or a declined card, leaves the subscription `incomplete` — writing 'paid' there tells the creator they are subscribed while nothing is collected, and an `incomplete` subscription sits ~23 hours before Stripe gives up, so the webhook does not correct it quickly either. Mapping: `active` → `paid`, `trialing` → `trialing` (a real on-sale trial), anything else → `failed` (which the eligibility allow-list blocks), and a null status falls back to `paid` because only the webhook can then say otherwise.
- 🚨 **A dead `monthly_charges` row must never describe the creator's current state.** `computeSubscriptionStatus()` picks its row by DATE MATCH first, and `latest('id')` only orders *within* what that matched — so an abandoned checkout, which keeps whatever trial window it was given, outranked the creator's newer live row and returned its own `expired` status. Live symptom: a creator who had just saved their card was told to add one. `initiated` and `expired` are now excluded from that lookup.
- 🚨 **Setup mode writes NO trial dates.** `payMonthlyCharge` used to persist them whenever `trial_period_days > 0` regardless of mode; with no subscription created there is no trial for them to describe, and the stale window is what let the row above win the date match.
- 🚨 **`syncUserSubscription()` must not read "card saved, no subscription yet" as "no subscription".** It clears `is_subscribed` when Stripe returns nothing, and `subscription:sync` runs **every 15 minutes** — under setup mode that fired for every creator in their free period, on every tick. Guarded on a `trialing`/`trial_ending` row that has a `stripe_payment_method` and no activation claim. ⚠️ **The guard belongs on BOTH writes** — the `is_subscribed` flag *and* the `MonthlyCharge ... update(['status' => 'expired'])` immediately below it. Guarding only the first left the row being expired every 15 minutes, which is the same lockout by another route. ⚠️ **The guard has to cover the row-expiring UPDATE as well as the `is_subscribed` flag** — guarding only the flag left the same sweep flipping the row to `expired`, so the creator was still told to add a card they had already added.
- 🚨 **A dead `monthly_charges` row must never describe the creator's current state.** `computeSubscriptionStatus()` matches on trial/period DATES, and an abandoned checkout (`initiated`) or a written-off period (`expired`) keeps whatever dates it was given — so the date match found an old row and returned its status while a newer live row sat behind it. `latest('id')` cannot save you: it only orders within whatever the WHERE already matched. Excluded explicitly. ⚠️ It is a deny-list on that axis, so any future status meaning "dead row" must be added or the bug returns.
- ⚠️ **Setup mode writes no trial dates.** No subscription is created, so there is nothing for `current_start_trial_date`/`current_end_trial_date` to describe — writing them left a row claiming a two-year trial window that nothing on Stripe backed, which is exactly what the date-matching above then trusted.
- **Cancelling before a first sale has nothing to cancel on Stripe** — the local row is marked cancelled and `is_subscribed` cleared; calling Stripe with a null subscription id would just error.
- **A future genuine trial is `CREATOR_SUBSCRIPTION_TRIAL_DAYS_ON_SALE`**, applied to the subscription created on first sale. ⚠️ Non-zero means billing lands on a DATE rather than on a sale, and Stripe cannot render terms for a subscription that does not exist yet — so it MUST be disclosed in our own copy before the card is taken. `custom_text.submit.message` on the setup session is where that disclosure lives.
- ⚠️ **Stripe caps a trial at 730 days and rejects the whole Checkout session above it** — "The maximum number of trial period days is 730 (2 years)", so the creator cannot subscribe at all. This shipped broken at 1095 and was caught in the browser. `SubscriptionPlan::STRIPE_MAX_TRIAL_DAYS` clamps `freePeriodDays()` at both ends, so a bad config value is reduced rather than breaking every checkout.
- **A resend is a new ROUND, not a flag that ignores the claim.** `--resend` (bare = today's date as the label, or `--resend=followup2`) sends to everyone again under a fresh `dedup_key` — so the resend is itself idempotent, still resumable with `--max`, and the record of who received which round survives. ⚠️ `remainingCount()` is scoped to the round, not just the type: filtering on type alone reports a fresh round as already complete, because everyone still carries their first-round claim. ⚠️ A bare `--resend` resolves to `null` through `option()`, indistinguishable from the flag being absent — presence is read from `$this->input->hasParameterOption('--resend')`. The resend confirms before sending and **defaults to no**, so `--no-interaction` aborts rather than blasting a second copy.
- **`--max` is resumable, not a cap on the announcement.** The claim is taken per creator immediately before the send, so a capped run leaves everyone past the cap unclaimed and the next run continues from there. Re-running is therefore the intended way to finish; the command reports how many are left. ⚠️ Its counters keep **`already sent`** apart from **`failed`** — folding them into one "skipped" made a normal second batch look like a broken run.
- **Announcement: `creators:announce-subscription-policy`** (`--dry-run`/`--max`/`--user`/`--preview=<path>`), run by hand, never scheduled. `App\Mail\SubscriptionPolicyChanged` + `email.subscription-policy-changed`. ⚠️ **Three cohorts, three messages** (`VARIANT_BILLING` / `VARIANT_FREE_PERIOD` / `VARIANT_NONE`): telling a creator who is already billing "you won't be charged", or showing "add your card" to one who added theirs months ago, turns an announcement into a support ticket. ⚠️ **Consent is checked BEFORE the dedup claim** — `EmailService::sendCategoryEmail` returns silently on opt-out, so claiming first counted opted-out creators as sent AND burned their claim, permanently excluding them. A failed send releases the claim.
- **Cancelling before any payment is immediate; cancelling after it is at period end.** `StripeController::cancelMandatorySubscription` decides with `in_array($charge->status, ['trialing','trial_ending'], true) && ! $charge->current_start_subscription_date && ! $charge->first_sale_activated_at` — the same allow-list as the eligibility check, plus proof that billing never started. ⚠️ **All three signals are load-bearing, and `first_sale_activated_at` is the one that closes the race**: `SubscriptionActivationService` claims that column BEFORE telling Stripe to charge and only flips the status to `paid` after, so in the window between the two the other signals still read "free period" — a creator cancelling in that moment lost access instantly having just been billed, which is the one outcome this branch must never produce. A failed activation releases the claim, so the immediate path correctly returns. Nothing was paid, so nothing is owed and access stops at once; once a period has been paid for it runs to the end.
- ⚠️ **`auth.has_ever_sold` is a LEDGER QUERY on the shared Inertia payload, so it is gated to `role === 1`.** The shared payload is sent with every navigation in the app, and fans can never have creator income — running it for them was a query per page view for a value that is always false. Same reason `needs_first_listing` uses its fast form. Only `SiteSubscription.jsx` reads it; anything else needing it should take a page prop rather than widening this.
- **`legacy_trial_days` and `SubscriptionPlan::legacyTrialDays()` were removed** (31 July 2026). `free_until_first_sale => false` now means day-one billing — the card is charged as soon as it is added — not a 3-day trial. ⚠️ The config value is a literal `true`, no longer `env()`-backed, so switching the policy off is a code change rather than an environment one.
- **Existing paying creators are deliberately NOT migrated** (client decision). Consequence to watch: a paying creator with no sales can read "no charge until your first sale" on the public pages — a support-policy question, not a code one.
- Tests: `tests/Feature/SubscriptionFirstSaleActivationTest.php` (refund ≠ sale, pending ≠ sale, claim idempotency, two-rows-one-subscription, dry-run claims nothing, policy switch off, abandoned checkout grants no eligibility, and — **the one that matters most** — a creator in their free period still returns `subscription_status` 1 or 2, because that accessor feeds the eight supporter-checkout gates and a wrong value blocks every sale on the platform).

### 🚨 The card checkout had ONE path, and it was the browser (12 Aug 2026, spennypiggy.co)

Found on a live creator: profile approved, `journey_step = 'subscription'`, and a
`monthly_charges` row reading `status = 'initiated'` · `stripe_payment_method = NULL`
· `updated_at = created_at + 1s`. Stripe's own record of that session:
`status: "open"`, and the customer had no payment method — so in that case the card
genuinely was never saved. But finding it exposed the real fault:

🚨 **Only Stripe's `success_url` reaching the browser could turn `initiated` into a
card on file.** There was **no webhook** (a setup-mode session is not in
`checkout.session.completed`'s metadata routing, and every other `MonthlyCharge`
webhook handler keys on `stripe_id`, which a setup-mode row does not have until the
first sale) and **no sweep**. A creator who saved their card and then lost the
redirect — closed tab, dead connection, expired session — had the card on Stripe and
nothing at all here, permanently, with no retry and no reminder, unable to sell.
Every other checkout on this platform is written so the redirect and the webhook
RACE; this one, the step that gates selling entirely, could not.

- **`App\Services\SubscriptionCheckoutService` is the ONE definition** of completing
  a setup-mode checkout, called by the redirect handler, the webhook and the sweep.
  ⚠️ The status flip is an **atomic claim** (`where status = 'initiated'` → update),
  so the redirect and the webhook arriving together is safe and exactly one wins.
- ⚠️ **The redirect handler no longer treats "I did not complete it" as failure.**
  If the webhook won the race the card IS saved, and telling the creator it failed
  sends them to do it all again. It re-reads the row and only errors if it is still
  `initiated`.
- ⚠️ **Rows are matched on `session_id`, never on metadata.** The setup session set
  its metadata under `setup_intent_data` only, so the event arrived carrying
  `metadata: {}` — a metadata-only lookup would recover none of the creators already
  stuck. Session-level metadata is now set as well (same trap the bank-payment
  fulfilment hit), but the lookup does not depend on it.
- **`checkout.session.expired` now closes the row.** `handleCheckoutSessionExpired`
  updated the risk-ledger `Payment` table and nothing else, so an abandoned
  subscription checkout sat at `initiated` long after its link was dead — and each
  retry added another row beside it (`payMonthlyCharge` creates, never reuses).
- **`subscription:reconcile-checkouts`** (every 10 min, `--max` / `--remind-after` /
  `--dry-run`) is the backstop: asks Stripe about each unresolved row and either
  **recovers** it (session complete → record the card), **closes** it (session
  expired or gone), or **reminds** the creator once. ⚠️ Every ten minutes, not daily:
  a Checkout session lives ~24h, so a lost redirect has to be found while the session
  can still be read and the reminder link still works.
  - ⚠️ **"Stripe has no record of this" and "Stripe did not answer" are different
    answers, and only the first is a decision.** Closing a row on a transient API
    failure writes off a checkout the creator may be completing at that moment. Only
    `InvalidRequestException` closes it.
  - ⚠️ Rows younger than `SETTLE_MINUTES` (3) are skipped — the redirect should get
    its chance first, or the sweep is a Stripe call per checkout for nothing.
- **The reminder is claimed per CHECKOUT, not per creator** (`subscription_checkout`,
  key `checkout:<row id>`). A creator who abandons twice has two unfinished checkouts
  and should hear about the second; a per-creator key silences them forever after the
  first. `App\Mail\FinishAddingYourCard` + `email.finish-adding-card`, bell + push +
  email, `$marketing = false` (it is their own account state, and the thing blocking
  them from selling) with the email channel dropped on `creator_updates_enabled`.
  A failed send **releases** the claim.
  - ⚠️ **Deliberately NOT wired into `AbandonedCheckoutService`.** That service is
    supporter-facing — its reminder reads *"Your purchase from {creator}"* and
    `RecoverAbandonedCheckouts::deliver()` dereferences `$row->creator` unguarded, so
    a creator-less subscription row would crash it. Different audience, different
    message, different opt-out.
- ⚠️ **`FinishAddingYourCard::subjectLine()`, not `subject()`** — `Mailable` already
  declares a `subject()` with a different signature, and redeclaring it is a fatal
  incompatibility rather than an override. Same class of trap as a test method named
  `session()`, which collides with Laravel's `TestCase::session()`.
- `SubscriptionCheckoutService::paymentMethodFor()` is a `protected` seam purely so
  the rules above are testable without a live Stripe account.
- 🚨 **The setup session's currency is the BILLING currency, not the visitor's
  display-currency cookie.** It read `$request->cookie('currency')`, so a US creator's
  session was created in `usd` — and Stripe picks which payment methods to offer from
  the session currency, so that session offered `us_bank_account`, `cashapp` and
  `amazon_pay`. Those are **USD-only**, while the subscription created on the first
  sale is GBP (`SubscriptionPlan::currency()`): a creator who saved one could never be
  charged. `activate()` would fail, release its claim, and the 15-minute sweep would
  retry forever while they sold and were never billed — silently. Setup mode charges
  nothing, which is exactly why this looked cosmetic.
  ⚠️ The **subscription-mode** branch has the mirror of this and was deliberately left
  alone: it bills in the cookie currency while the `monthly_charges` row always
  records `GBP 8.99 + 1.80`, so a US creator would be charged in USD and reported in
  GBP. It is not the live path; which currency creators are billed in is a product
  decision, so it carries a warning rather than a silent change.
- ⚠️ **`SubscriptionPayload::has_card` was `! empty(stripe_payment_method)`** — that
  column is written only by setup-mode checkout, so every creator who subscribed
  under the older subscription-mode flow has it NULL. Measured on live data: **9 of
  the 10 creators the platform is actively collecting from**, all told by
  `SiteSubscription.jsx` that they had no card. A live collecting subscription cannot
  exist without a payment method, so the flag reads either signal. Same bug and same
  fix as the admin app's cohort `has_card`.
- Tests: `tests/Feature/SubscriptionCheckoutRecoveryTest.php` (11) — the card
  recorded, only one caller completing it, a session with no card leaving the row
  open, a settled row untouched, closing idempotent, a completed checkout never
  written off, lookup by session id, the sweep ignoring resolved and brand-new rows,
  and one reminder per checkout.

### 🚨 The daily auto-suspend was locking out every free-period creator (4 Aug 2026, spennypiggy.co)

`app:auto-suspend-account` (daily) suspended any creator with **no `monthly_charges`
row at status `paid`**. That was survivable while the card was charged three days
after signup — the row went `paid` almost at once. Under **free-until-first-sale**
the row sits on `trialing` for up to two years by design and is never `paid`, so the
cron suspended **every creator in their free period** — which, because the journey is
`profile → subscription (card) → stripe`, is exactly the cohort that has just
connected Stripe. Nothing un-suspends automatically, so each one stayed locked out
until an admin noticed.

- ⚠️ **Eligibility is `User::subscription_status` ∈ `[1, 2]`, never "has a `paid` row".**
  Same allow-list as the eight supporter-checkout gates and the Connect
  `subscriptionGate` — **2 IS the free period.** Any new surface deciding whether a
  creator's subscription is in good standing must read that accessor.
- ⚠️ **Suspension requires proof the creator ever ENTERED billing** (`BILLED_STATUSES`
  = `paid`/`active`/`renew`/`failed`, or a `current_start_subscription_date`). A
  creator who has never been charged owes nothing; the Connect gate and the checkout
  gates already stop them selling, and locking them out of their own account is a far
  heavier penalty than the situation warrants. An `initiated` (abandoned checkout) row
  is therefore **not** a suspension reason.
- **Every automatic suspension now leaves a trace** — `AutoSuspendAccount::LOG_MARKER`
  in a `Log::warning` and a `logs` row. The old command wrote nothing at all, so a
  cron suspension was indistinguishable from an admin one and could not be reversed
  in bulk. The command also gained `--dry-run` / `--max` and skips already-suspended
  creators (it used to re-send the suspension email on every daily run).
- **Repair: `subscription:restore-wrongly-suspended`** (`--apply` / `--user` / `--max`,
  **dry run by default**). Un-suspends only creators whose subscription is currently
  eligible AND who carry **no admin suspension log** — an admin suspension writes a
  `logs` row (admin `UserController`), the old cron did not, so "no log" is the
  strongest available signal it was the cron. Never a blanket un-suspend.

### 🚨 A newly connected account is not tampering with its payout schedule (4 Aug 2026)

Two risk handlers in `StripeWebhookController` suspended creators for the platform's
own doing, and both hit newly connected accounts hardest.

- ⚠️ **`handleAccountUpdated` trusted the EVENT PAYLOAD.** Stripe does not guarantee
  event ordering, so an `account.updated` generated *before* our create-time manual
  write can be delivered *after* it — and that stale payload reads exactly like a
  creator switching their payout schedule to automatic. It now **re-retrieves the live
  account** and returns if that says `manual`. If the read fails it does **nothing**:
  an unenforced schedule is fixed by `payout:enforce-manual` within ten minutes, a
  wrongly locked-out creator is not fixed at all.
- ⚠️ **`PAYOUT_SCHEDULE_GRACE_HOURS` (48).** A brand-new Express account carries
  Stripe's own automatic default until our manual write lands, and a creator who
  connected an hour ago has had no opportunity to change anything. Inside the window
  the schedule is reverted silently, never suspended.
- 🚨 **An AUTOMATIC payout is Stripe's scheduler, not the creator.** `payout.created`
  suspended on any payout it could not attribute to the platform — including the
  automatic sweep a non-manual schedule produces. A creator *cannot* create an
  automatic payout, so `$payout->automatic === true` now forces the schedule back to
  manual and logs critical instead; the schedule decision belongs to
  `handleAccountUpdated`, which alone re-reads the live account and honours the grace
  window. A genuine creator-initiated manual payout still suspends.
- All five platform `createPayout` call sites pass `metadata.reason`, so the
  is-this-ours check does not depend on the `PayoutRecord` row having been written yet
  (the webhook can arrive first).
- Tests: `tests/Feature/AutoSuspendAccountTest.php` (10).

### A refused sale is told to the creator, and counted (3 August 2026, spennypiggy.co)

Seven checkouts refuse a purchase when the creator's subscription is not payment-eligible. Every
one of them already dispatched a `SubscriptionBlockedNotification`, but that only ever reached the
creator's email — the one channel a creator who has stopped paying is least likely to be reading.
The supporter, meanwhile, simply saw the purchase fail. `App\Support\BlockedPaymentAlert` sits
beside each of those dispatches and turns a silently-lost sale into a reason to reactivate.

- **`blocked_payment_attempts`** (migration `2026_08_03_000000`) — one row per refused purchase:
  creator, amount, currency, reason. ⚠️ **No supporter identity is stored — not an email, not a
  name, not an id.** A creator never receives supporter contact details anywhere else on this
  platform, and a *failed* purchase is a weaker relationship than a completed one, not a stronger
  one. The row exists to be counted, not to be followed up.
- ⚠️ **`record()` never throws.** It runs on the supporter's checkout path, after the refusal has
  already been decided. An analytics write must never be why a request errors.
- **The bell fires once a day and states the count over `WINDOW_DAYS` (7)** — deduped by the
  `engagement_notifications` claim. One notification per refused purchase would be a dozen buzzes
  in an afternoon telling the creator the same thing, and the number is what makes the case: "3
  people tried to buy from you this week" is an argument, "someone tried to buy" is noise.
- ⚠️ **The wish gate at `WishitemController` ~line 1103 had NO notification of any kind** — that
  path refused purchases in total silence, so the creator lost wish sales and was never told by any
  channel. It is now wired like the other seven.
- **`blocked-payments:prune`** (daily 03:55, `--days=90`/`--dry-run`, batched 1,000) — this table
  grows with traffic against blocked creators and nothing else would remove a row. Retention is
  clamped to at least `WINDOW_DAYS` so a bad `--days` cannot delete rows the creator-facing count
  still reads.

### 🚨 The free period is identified by STATUS, never by trial dates (3 August 2026)

Setup-mode checkout saves a card and creates **no Stripe subscription**, so
`payMonthlyCharge` deliberately writes **no trial dates** — there is no trial for
them to describe. But every creator-facing surface decided *"is this creator in
their free period?"* by looking for `current_start_trial_date` /
`current_end_trial_date`. With those columns NULL the checks all fell through to
"never started", so a creator who had **just saved their card** was told to add one —
on the subscription popup ("NOT STARTED" · *Add card and start selling*), the About
chip (*Add your card now…*) and the Creator Studio row at once. Reported from a live
account whose row read `status=trialing · payment_method=YES · no dates of any kind`.

- **`SiteSubscription.jsx` gained a `CARD_ON_FILE` scenario** — status in
  `trialing`/`trial_ending`, no subscription dates, `has_card` true. Its theme has
  **no CTA**: there is nothing for the creator to do, and a button asking for a card
  they already gave us is the bug itself.
- ⚠️ **The card is reported as a BOOLEAN (`monthly_charges.has_card`), never as the
  `pm_…` id.** The page only needs to know one is saved, and a payment-method
  identifier has no reason to leave the server.
- ⚠️ **`SubscriptionStatusChip` status 2 must never ask for a card.** The row only
  reaches `trialing` once the setup session returns a payment method; before that it
  is `initiated`, which is status 3. It was printing `PLAN.promise_long` ("Add your
  card now…") for someone whose card was already on file.
- ⚠️ **"Active Subscription" is wrong for status 2.** The Creator Studio row printed
  it beside a "No Charge Yet" chip, so the row contradicted itself. Each code now
  says its own thing: `1` Billing monthly · `2` Card saved — no charge yet · `0`
  Needs attention.
- ⚠️ **`billedRecords()` (exported from `SubscriptionHistory.jsx`) is the ONE
  definition of "a row that was actually billed".** The Creator Studio list counted
  every `monthly_charges` row while the modal showed only billed ones, so a creator
  who had never been charged read **"1 Records"** and opened it onto *"No billing
  history yet"*. Any new surface counting subscription rows must use it.

### Review fixes on the above (3 August 2026)

- ⚠️ **`border-current/20` emits NO CSS at all.** Tailwind cannot compute alpha
  against `currentColor`, so the class is silently absent and the divider falls back
  to `currentColor` at full strength — in `CreatorActivityWidget`'s paused state that
  drew a solid red rule on the card the divider exists to calm. Same class of trap as
  the `border-accent/40` one in the admin panel: **an opacity modifier on a colour
  Tailwind cannot resolve produces nothing, and the only symptom is the absent rule.**
  Use `border-black/10`, or the `border-current border-opacity-20` form.
- ⚠️ **`PostingCadenceService::countingPostsQuery()` is the ONE definition of "a post
  that counts."** The window of publish dates re-declared all four predicates
  alongside `recentPostCount()`; two copies of a rule that pauses real income drift
  silently, and the number would say a creator is safe while the window it is drawn
  from says otherwise. `statusFor()` now plucks once and derives the count from the
  same rows — one query, and they cannot disagree.
- ⚠️ **`PostingWindow` nudges overlapping marks apart and counts how many posts share
  a drop-out day.** Three posts published in one sitting sit within ~0.2% of each
  other and stack into a single dot while the header reads `3 / 3`; and "you'll be on
  2 of 3" understates a pause when all three age out together.
- ⚠️ **A cohort card and the list it opens must read ONE definition.**
  `SubscriptionCohorts::COHORT_STATUSES` is it — the cards counted
  `paid|active|renew` while linking `status=active` (paid/active only), so "Billing"
  led to a list missing every `renew` creator, and "Abandoned" linked nowhere at all.
  `counts()` is now `Cache::remember`'d for `CACHE_SECONDS` (300): it runs on every
  load of two admin screens and full-scans a table that gains a row per billing
  period per creator forever.
- ⚠️ **`NotificationDispatcher`'s email channel is a NO-OP without a `mailable` in
  the payload.** Passing `ALL_CHANNELS` therefore looks like three channels while
  sending two. `BlockedPaymentAlert` passes bell + push explicitly — the email on
  that refusal is already sent by `SubscriptionBlockedNotification` at the same call
  site, and a second one would be a duplicate.
- ⚠️ **`BlockedPaymentAlert` counts ATTEMPTS, never distinct buyers.** One person
  retrying a blocked checkout writes several rows and no supporter identity is stored
  to deduplicate by, so the copy says "3 purchases were turned away", not "3 people".
  A failed send **releases** the day's claim, or the creator hears nothing for the
  rest of the day while every further attempt is recorded and silently suppressed.
- **`blocked_payment_attempts` carries a composite `(creator_id, created_at)`** — the
  count runs on every refused checkout across seven gates, and on a `creator_id`
  index alone the date is a row filter, so cost grows with that creator's lifetime
  attempts rather than with the 7-day window. The standalone `created_at` index stays
  for the prune.
- **Activity Status carries the same "Separate rule" divider as
  `CreatorActivityWidget`** — the page's badge is the purchase-time content gate
  (28 days) and the window is the posting cadence (30 days, member posts only). The
  window's tone reads `postingCadence.status`, never `contentCount`, which belongs to
  the other rule and painted it green while it read `1 / 3`.

### Site Subscriptions is a list of CREATORS, not of billing rows (12 Aug 2026, admin.spennypiggy.co)

`/monthly-charges` answers one question — *where does every creator stand on the
platform subscription* — and it could not answer it, because it listed
`monthly_charges` rows. Live when this was rebuilt: **31 rows described 11 people**,
so a paying creator appeared six times with none of the six authoritative, and the
**43 creators with no row at all could not appear on the screen** — the largest and
only actionable group. `App\Support\SubscriptionCohorts` is now creator-based
throughout and is the ONE definition; the listing, the cards, the totals and the
export all read it.

- 🚨 **The cohort cards did not filter the table.** The page ignored its own Inertia
  props and fetched `/api/monthly-charges` over axios, and that endpoint had no
  `cohort` handling — so a card changed the URL and its own highlight while the list
  below stayed unfiltered. The **status dropdown did nothing at all** (its effect
  listed only `search` in its deps) and **paging set a page number nothing ever
  fetched**. The page now renders the props; `apiIndex` and `getStatuses` are deleted.
- **`FLAG_PRECEDENCE` is the only place the order is written.** `cohortCase()` (which
  labels a creator), `cohortWhere()` (which filters to one cohort) and the `GROUP BY`
  that counts them are all generated from it, so a card's number and the list behind
  it are the same rule *by construction*. A test asserts every card equals its list.
  Buckets: billing · card_on_file · no_card · failed · stopped · abandoned ·
  **suspended** · **other**, and they sum to the platform's creator count — a strip
  that does not add up is hiding someone. `other` renders only when non-zero.
- 🚨 **MRR was ~3× the truth.** `SUM(amount)` over `status IN ('paid','active')` added
  up every billing period a creator had ever had — 29 rows for 10 creators. It is now
  one figure per creator (`billing_amount`), and **`mrr_creators` counts them**.
- ⚠️ **Platform totals are GBP-CONVERTED, per-creator figures are not.** Creators are
  charged in their own currency (live: one of ten on USD), so the summary reads
  `billing_amount_gbp` / `lifetime_gbp` while a row shows the creator's own currency.
  `App\Support\GbpRates` is the one rate map — `BulkEmailAudience::gbpRates()` now
  delegates to it. It is **memoised per request**: `map()` costs 3 round trips and the
  cohort SQL builds its CASE three times a page load (9 of 14 queries before).
- ⚠️ **A subscription PERIOD is not a CHARGE.** The legacy 3-day trial was backfilled
  as a real period at **£0.00**, so counting "rows with a period" reported 3 billing
  cycles against £21.58 — a figure that cannot be divided by the monthly price.
  `CHARGED_ROW` (start date set AND amount+tax > 0) governs `cycles`, `lifetime` and
  `last_charge_at`; `wasCharged()` is its PHP twin so the row and its history agree.
- ⚠️ **`has_card` is not `stripe_payment_method IS NOT NULL`.** That column is written
  only by SETUP-mode checkout, so reading it alone printed **"No card" against all six
  creators the platform actively collects from**. A live collecting subscription
  cannot exist without a payment method, so the flag reads either signal.
- 🚨 **`User::$appends` lazy-loads five accessors.** Serialising 20 creators fired
  **206 queries**; `setAppends(['avatar_url'])` takes the page to **3 warm**. Any admin
  listing built on `User` needs this — `subscription_status` alone reads that
  creator's charges, verification and card rows.
- ⚠️ **Admin cancel was cancelling EVERY active subscription on the Stripe customer**,
  not the one the row names, and always immediately — taking a month's money and
  removing the access it paid for. It now cancels the row's own `stripe_id` and uses
  **`cancel_at_period_end` once a period has been billed**, matching the creator's own
  cancel path. The route also gained `can:update-data`; it had no gate at all.
- Row expand loads `GET /monthly-charges/history/{userId}` on demand — shipping every
  row for twenty creators is the row-shaped payload this rebuild removed. `no_card` is
  no longer a separate table, just another cohort.
- Migration `2026_08_04_000000` declares WEBSITE-owned columns
  (`monthly_charges.stripe_payment_method`/`first_sale_activated_at`/`name`/`email`,
  `users.journey_step*`/`stripe_details_submitted`) so this app's own test database can
  run the cohort queries. Guarded, `down()` empty — same pattern as `2026_07_31_000001`.
  ⚠️ The test DB declares `monthly_charges.amount` as **INT** where the shared database
  uses `DOUBLE(10,2)`, so a test asserting pennies is asserting the schema.
- **Payments → Site Subscriptions is now a server-side REDIRECT** to
  `admin.monthly-charges` (same shape as the `fast-start-bonus` hop). The tab ran a
  second, row-based `MonthlyCharge` query — carrying the dead `status = 'trial'`
  filter — and then rendered nothing but a link to this screen. Its branch,
  `SiteSubscriptionsTab.jsx` (already unimported) and the CTA card are deleted.
- Tests: `tests/Feature/SubscriptionCohortsTest.php` (10) — one creator counted once
  however many periods, no-card counted, buckets summing to the creator total, every
  card equalling its list, the £0 period, per-creator MRR, currency conversion, a
  collecting subscription counting as a card.

### Tax Collected — `/all-tax-collection` rebuilt (12 Aug 2026, admin.spennypiggy.co)

🚨 **The screen this replaces read ONE of seven payment tables** while its own copy
said it covered "tips, wishes, memberships, and shop sales" — three of those four
were not in the query. Measured live it reported **£582.59 of roughly £2,855**, and
**£405.16 of that £582.59 had been REFUNDED** and was being counted as collected. It
had no total, no date column, no period filter, no export and no permission gate,
and gave its two widest columns to the buyer's message and the creator's thank-you
note — 100% empty on every row in the database, and nothing to do with tax.

- **`App\Support\TaxLedger::SOURCES` is the ONE definition** of where tax lives, per
  module. The seven payment tables do not agree on where VAT is stored, what the
  status column is called, or which statuses mean the money was kept.
- ⚠️ **`tax_columns` is an ORDERED FALLBACK, never a sum.** Each module carries two
  or three tax-shaped columns (`tax`, `tax_amount`, `vat_amount`, `vat_tax_amount`)
  and exactly one is populated per row — verified across all seven tables, zero rows
  have two at once. Adding them would double-count the day a writer fills the second.
- 🚨 **A line item has no status or currency of its own.** `stripe_payment_items`
  must be joined to `stripe_payment_details`; reading the item alone is precisely how
  refunded tax was counted as collected.
- ⚠️ **`shop_payments.user_id` is the BUYER.** The creator whose VAT it is comes
  through the listing (`shops`/`memberships`/`bills` → `user_id`), left-joined and
  guarded: a listing deleted after it sold costs that row its NAME, never its TAX.
- ⚠️ **The UK tax year is 6 April – 5 April.** A "year" that quietly meant January is
  the easiest way for this screen to produce a wrong return. Periods: month ·
  quarter · tax year · custom, and a reversed custom range is corrected rather than
  returning nothing.
- ⚠️ **Four states, not two** — collected · refunded · pending · failed. Refunded is
  reported ALONGSIDE collected, never netted off it: an accountant needs both, and a
  blended figure answers neither question.
- ⚠️ **An unrecognised status counts as COLLECTED and is reported as unrecognised.**
  Dropping it would silently remove real tax from a return; counting it silently
  would hide the assumption. The page states how much of the headline rests on it.
- ⚠️ **Every figure is per currency AND converted** (`GbpRates`). One number across
  GBP and USD is a lie printed in bold, and this is the screen where that matters
  most. A module whose table is absent is NAMED, not silently excluded from the total.
- **Gated `can:access-risk`** (Super Admin + Finance + Support) — it had none at all.
  Export is CSV-injection-safe (`=`/`+`/`-`/`@` prefixed).
- ⚠️ **`Schema::hasTable`/`hasColumn` are queries.** Unmemoised, one page load cost
  **101 queries**, none of them about tax — the source builders run twice (totals and
  listing) across seven tables. `TaxLedger::columnsOf()` memoises per request: **33**.
- Deleted: `Admin/StripePaymentDetails/AllTaxes.jsx`, `allTaxCollection()` and the
  ungated `GET /taxes` endpoint.
- Tests: `tests/Feature/TaxLedgerTest.php` (15) — tax-year boundaries either side of
  6 April, reversed and unparseable custom ranges, refunded/pending/failed never
  counted as collected, an unknown status counted but flagged, all seven modules
  present, and every source able to resolve a status and a currency.

### The admin test database was missing website-owned schema (12 Aug 2026)

Two long-standing failures — `UserControllerN1Test` and `UserProfileViewSnapshotTest`,
both on `/{username}/details` — were **`post_mentions` not existing in the admin app's
own test database**. The table is created by the website's migration, so the shared
database has it and the page works in production; only the test DB, built from this
app's migrations alone, did not. `UserController::userDetails` eager-loads
`posts.mentionedUsers`, so every call threw.

- 🚨 **A catch-all that reports its own message hides the cause.**
  `userDetails` ends `catch (\Throwable $e) { report($e); abort(500, 'Unable to load
  user details.'); }`, and in the test environment `report()` wrote nothing — so the
  failure read as a bare 500 for weeks. Surfacing it needed BOTH a temporary rethrow
  **and** `withoutExceptionHandling()`; either alone still yields a 500. Worth
  remembering before assuming a 500 on this page is the page's own logic.
- Migration `2026_08_04_000001` declares `post_mentions`, guarded, `down()` empty.
- ⚠️ **`UserProfileViewSnapshotTest` could never pass twice.** `cleanDataForSnapshot`
  normalised the `uuid` KEY but not the UUID embedded in `post_url`, so the snapshot
  captured a per-run value and the test failed on the very next run after any
  regeneration. Any UUID in any string value is now replaced.
- Regenerate all four snapshot tests with
  `php artisan test --filter <test> -d --update-snapshots` after changing a route or a
  shared prop — they capture the Ziggy route list, so this rebuild's route changes
  fail them by design.

### Admin subscription filters had to follow the policy (3 August 2026, admin.spennypiggy.co)

The policy moved billing from a DATE to a SALE, and the admin screen was still asking
date questions.

- ⚠️ **`status = 'trial'` is a value this platform has never written** — the free
  period is `trialing`. All THREE copies of the filter matched on it, plus a live
  trial-date window; under setup-mode checkout the row carries no trial dates at all,
  so both halves matched nobody and the filter silently returned an empty list. They
  now read `SubscriptionCohorts::COHORT_STATUSES['card_on_file']`.
- ⚠️ **"No Trial" was shown for every setup-mode row**, making a creator with a card
  saved and ready to bill look identical to one who never gave us a card — the single
  distinction the screen exists to draw. The row now carries a `has_card` boolean
  (never the `pm_...` id) and reads "Card saved — billed on first sale".
- **`trial_ending` is empty by design** and is kept only so an old bookmark resolves:
  it can only match a legacy date-driven trial, which exists solely under
  `checkout_mode = 'subscription'`.
- Labels follow the creator-facing wording — `trialing` is "No charge yet", not
  "Trialing", which reads as a clock running down.

### The subscription start/renew email says what was actually billed (3 August 2026)

- ⚠️ **A renewal sent no email at all.** `MonthlySubscribedJob` had a `'success'` branch that
  nothing ever dispatched — only `'failure'` was wired — so a creator was charged £8.99 each month
  with no receipt. `StripeWebhookController`'s renewal branch now dispatches it after the new
  active-period row is created, wrapped in try/catch (a mail failure must not fail a webhook that
  has already recorded money).
- ⚠️ **The template printed the raw DB status**, so a creator's start email read *"Your payment for
  monthly subscription is ended"*. It now names the state in the creator's terms and carries an
  Amount / Period starts / Period ends / Next charge table, with `array_filter` dropping any row
  whose value is null rather than printing "N/A".
- ⚠️ **`email/creator_subscription4_start.blade.php` is referenced by nothing.** The live template
  is `email.monthly-subs` — check the mailable before editing a subscription email.


## Creator onboarding — one account read, one step order (4 Aug 2026, spennypiggy.co)

`App\Services\Stripe\StripeAccountState` is the ONE answer to "what state is this creator's
connected account in?", and `CreatorJourneyService::STEPS` is the ONE definition of the step
order. Both existed in several copies that had already drifted apart.

- 🚨 **`CreatorJourneyService::STEPS['stripe']['route']` was `stripe.connect` — the ACTION
  endpoint.** `/stripe/connect-init` needs a POST carrying `termaccept` plus a country, so the
  dashboard journey card's "Connect payouts" button bounced back with a red error toast **every
  single time it was clicked**. It is `stripe.index` (`/stripe/authorize`), the page that collects
  those. `tests/Feature/StripeOnboardingFlowTest` asserts every step's CTA resolves to a real
  route, and that the Connect one answers GET.
- 🚨 **The Stripe setup page rendered a step order that had been superseded.** `stripe/Stripe.jsx`
  carried its own five-entry array still listing identity BEFORE connect (reversed 31 July 2026),
  so the rail highlighted *"Identity verified — you're here"* while the panel directly beneath it
  read *"Step 4 of 5 — Connect your payments"*. One screen, two answers. The rail now renders from
  the server (`journey_steps`, built by `CreatorJourneyService::stepStates()`), passed as a **page
  prop, not a shared one** — only the setup screens draw it. **Never hardcode the order in JSX.**
  The panel's step number is derived from that array too, so adding a step cannot leave a literal
  "Step 4 of 5" behind.
- **New journey step `subscription` (card on file), between `profile` and `stripe`.** ⚠️ The rule
  existed on `CreatorVerification.jsx` only — the server never looked, so opening `/stripe/authorize`
  directly walked straight past it. `StripeController::subscriptionGate()` enforces it on both
  `index()` and `initConnect()`, using the same `subscription_status` in `[1, 2]` allow-list the
  eight checkout gates use (2 IS the free period). ⚠️ **It applies ONLY while `account_id` is empty**
  — this method is also Stripe's `refresh_url`, so gating an existing account would strand a creator
  mid-onboarding with an account they cannot finish. Mirrored in the admin app's
  `CreatorJourneySteps::ORDER` (the drip reads `users.journey_step` and would otherwise treat the
  new value as unrecognised).
- 🚨 **The cached account state was never invalidated — anywhere.** `connectReturn()` carried its
  `Cache::forget` calls **commented out**, and `account.updated` — the moment Stripe tells us the
  state changed — did not touch the cache either. A creator finished onboarding, came back, and was
  told for another five minutes that action was required. `StripeAccountState::forget()` is now
  called from `connectReturn`, both already-connected branches of `index`/`initConnect`,
  `enableCardPayments` (it mutates capabilities), and the webhook.
- ⚠️ **The profile render made FIVE sequential Stripe retrieves of the SAME account** on every cache
  miss — `getAccount` + `checkAccountMigrationNeeds` + `isAccountReadyForCheckout` +
  `getAccountRequirements`, plus `getMigrationStatus` behind its own separate key (so the page could
  show a migration warning and a capability panel built from two reads taken minutes apart). Now one
  retrieve: `StripeControl::accountRequirementsFrom($account)` / `::accountReadyForCheckoutFrom($account)`
  are object-taking twins of the id-taking versions, and migration need is read off the same object.
  `AuthenticatedSessionController::getStripeCapabilities` and `OptimizedProfileController`'s verbatim
  copy of it both delegate. Cache key bumped to `stripe_acct_state_v2_`.
- **Resuming is a first-class state.** A creator who backed out mid-form already HAS an account and
  an account's **country is fixed at creation**, so re-asking for it is a question with no effect —
  and `initConnect` already skips the terms gate once an account exists. `index()` passes
  `has_account`/`account_country`, and the page collapses to a single **"Resume Stripe setup"**
  button. `connectReturn`'s `details_submitted = false` branch redirects to that page instead of
  dropping the creator on their profile with an error and nowhere to go.
- ⚠️ **Stripe exception text never reaches a creator.** `initConnect` printed
  `'Account creation error:'.$e->getMessage()` — Stripe writes those for a developer ("Keys for
  idempotent requests can only be used with the same parameters…") and on a connect screen it reads
  as though the creator's account is broken. Same fix in `enableCardPayments`, whose fallback was the
  raw message. Detail goes to `Log::error`.
- **Deleted: `StripeController::stripeReturn()`** — it returned nothing at all (no response). The
  `stripe.return` route maps to `connectReturn`; it had no callers.
- ⚠️ **`getServiceAgreementType()` returns `'full'` for every country**, so the old migration check
  could never return true — it was a Stripe round trip that could only ever answer "no". The state
  service reads `tos_acceptance.service_agreement === 'recipient'` off the account instead.
- Tests: `tests/Feature/StripeOnboardingFlowTest.php` (12) — CTA resolves and answers GET, every
  step route exists, card→connect→identity order, `stepStates` covers the whole journey,
  awaiting-review is not a task, the gate blocks a cardless creator and **never** blocks an existing
  account, `forget` drops the entry and tolerates a null id.

### Identity verification moved AFTER Stripe Connect (31 July 2026)

Stripe Identity **bills the platform per check**, and the gate sat in front of Connect — so we paid for a check on every creator who merely got a profile approved. Connect onboarding costs us nothing and demands bank details plus Stripe's own KYC, so a creator who completes it has already proved they are serious. Order is now **profile → subscription (card) → Connect → identity → can list**. (The card step became a real, server-enforced journey step on 4 Aug 2026 — see the section above.)

- **The requirement did not go away, it moved.** `App\Http\Middleware\EnsureIdentityVerifiedForListings` (alias `identityBeforeListing`) is on the six item-**create** routes: `save_wish_item`, `bill.save`, `membership…save`, `piggy-pots.store`, `add-shop`, `tasks.store`. ⚠️ **Create only, never edit or delete** — blocking those would strand a creator who listed before the change with items they can neither sell nor take down. Browsing is deliberately unblocked: a creator explores the whole platform unverified, they just cannot put anything up for sale.
- ⚠️ **Three callers, three answers — and Inertia must be checked FIRST.** An Inertia request sets `X-Requested-With` too, so an `ajax()` check alone answered it with raw JSON, which Inertia renders as an error modal rather than a message on the page; it gets `back()->with('error')`. Plain axios gets a JSON 403 (`identity_required`), a normal browser gets a redirect to the verification page.
- ⚠️ **The middleware answers JSON to a JSON caller.** Every add-item form here submits over axios or Inertia; handing one an HTML redirect surfaces as a spinner that never resolves with nothing explaining why. `identity_status = 2` (submitted, awaiting Stripe) gets *"being reviewed"*, not *"verify your identity"* — telling someone to verify again is how a second billable check gets started.
- `StripeController::index()` and `initConnect()` no longer require `identity_status == 1`; `CheckStripeIdentityVerification` now also requires `stripe_details_submitted == 1`, so identity is demanded only once Connect is done. That middleware is still only attached to the `routes/auth.php` account/profile group — it is not what gates listings.
- ⚠️ **`CreatorJourneyService::STEPS` order changed to `profile → stripe → identity → …` and `admin.spennypiggy.co`'s `App\Support\CreatorJourneySteps::ORDER` mirrors it.** The admin drip reads `users.journey_step` and skips days whose step the creator has passed; leaving the mirror stale would coach creators on a step they are not on. The identity step's body now reads "You cannot list anything for sale until this is done" — the old wording said "cannot be paid", which is no longer what it blocks.
- ⚠️ **THREE surfaces render the step order and all three must be changed together.** `CreatorJourneyService::STEPS` (dashboard card), the admin app's `CreatorJourneySteps::ORDER` (drip), and **`Pages/Profile/CreatorVerification.jsx`**, which builds its own `steps` array with its own `locked`/`lockReason` per step. The JSX one was missed on the first pass and kept showing *"Verify ID → Get paid (LOCKED — unlocks once your identity is verified)"* while the dashboard card said *"Step 2 of 6 — Connect your payouts"*: the same creator was told two different things on two screens. Connect is now locked on profile-approved + card-on-file, identity on `stripe_details_submitted`, and the rail label reads **Payouts** rather than "Get paid" — the latter read as the end of the journey when it is no longer the last step.
- Tests: `tests/Feature/IdentityBeforeListingTest.php` (verified may list, unverified may not, JSON refusal shape, awaiting-review copy, fans unaffected, Connect reachable unverified, step order, identity not demanded before Connect).

## The Stripe action panel is the creator's ONLY view of what Stripe wants (3 Aug 2026, spennypiggy.co)

**Creators do not open the Stripe dashboard.** Everything Stripe asks for therefore has to be legible on `Dashboard.jsx` — anything not rendered there is something nobody acts on, and the account quietly stops taking money. `StripeControl::buildAccountRequirements()` is the ONE decision of what that panel says; `getAccountRequirements()` wraps it with the API read.

- ⚠️ **One root cause used to render as FIVE "ACTION REQUIRED" panels.** A creator who backed out of the hosted form left `disabled_reason = requirements.past_due`, a full `currently_due`, and both `card_payments`/`transfers` inactive — each produced its own card, plus `Dashboard.jsx`'s standalone `EnableCardCapabilities` block, all five linking to `/stripe/enable_card_payments`. Five panels read as five separate problems. Now: **exactly one primary card** naming the actual state, plus only cards that say something genuinely different.
- 🚨 **A terminal `disabled_reason` is NEVER collapsed and NEVER gets an onboarding button.** `TERMINAL_DISABLED_REASONS` (`rejected.*`, `listed`, `platform_paused`) can be set on an account that never finished onboarding — telling that creator to "finish your Stripe setup" sends them round a loop that cannot terminate and never mentions support. Terminal returns alone, `action_url = null`, `contact_support = true`.
- ⚠️ **`info` severity is a first-class state and must not be styled as a failure.** `pending_verification` / `under_review` mean there is genuinely nothing to do; labelling that "ACTION REQUIRED" is how creators learn to ignore the panel that matters.
- **Cards that are genuinely different, and so still stack:** `payouts_disabled` (charges work, money cannot be withdrawn — only shown when `charges_enabled`, otherwise the primary card covers it) and `requirement_errors`.
- ⚠️ **`requirements.errors` is surfaced verbatim and was never shown before.** It is where Stripe says *why* it refused a document ("The image supplied is not readable"), so without it a creator re-uploaded the same unreadable passport indefinitely. Stripe writes those strings for the account holder — do not re-word them into something less specific.
- ⚠️ **`requirements.current_deadline` reaches the creator.** It is the date payments get switched off and it lived only in the Stripe dashboard. Returned as ISO on the card; `ActionRequired.jsx` renders "Complete by 15 August — 6 days left" and turns it red inside 7 days.
- **`App\Support\StripeRequirementLabels` is the one place raw Stripe keys become words** — `external_account` → "Your bank account for payouts". It also **collapses `dob.day`/`dob.month`/`dob.year` into a single "Date of birth"** (a creator supplies one thing, not three) and strips `individual.` / `company.` / `person_<id>.` prefixes so all three read alike. An unmapped key falls back to prettified words, never a machine key — Stripe adds keys over time and that path WILL be hit.
- ⚠️ **A read failure is `connection_error`, an unknown state — not "nothing to do".** `Dashboard.jsx`'s `hasStripeActionPanel` deliberately ignores that type, so a transient Stripe outage cannot suppress the standalone `EnableCardCapabilities` CTA and leave the creator with no route forward.
- ⚠️ **`ActionRequired.jsx` had ONE `loading` flag shared by every card, toggled on click** — clicking one button put *all* of them into "Processing…", it flipped back on a second click, and the `<a>` is a full page load so the state meant nothing. Rebuilt per-card with no async state; it also no longer `sort()`s the props array in place (the result was computed and discarded).
- Tests: `tests/Unit/StripeAccountRequirementsTest.php` (one card when incomplete, every terminal reason kept separate and buttonless, under-review not urgent, payouts-vs-charges split, error reasons deduped, deadline, healthy = no cards) and `tests/Unit/StripeRequirementLabelsTest.php`.

### Stripe account creation — prefill and the idempotency key

- 🚨 **The idempotency key MUST be derived from the payload** (`initConnect`). It was a fixed `connect_account_user_<id>_<country>`, and Stripe refuses a reused key whose parameters changed — *"Keys for idempotent requests can only be used with the same parameters they were first used with."* Any payload change then hard-fails the connect flow for **every creator who had already attempted one**. Adding the `individual` prefill did exactly that in production; the metadata's per-consent `mor_consent_id` would have done it on its own after a re-consent. The key is now `connect_acct_u<id>_<country>_<sha256(payload) first 24>`, which keeps the retry-safety the key exists for while letting a genuinely different request through. Concurrent creates are prevented by the row lock + claim, not by this key.
- `StripeControl::createAccount()` converts an idempotency conflict into creator-facing copy and a `Log::error` — Stripe's own wording ("Try using a key other than…") is addressed to a developer and reads on a connect screen as though the creator's account is broken.
- **`StripeController::individualPrefill()`** hands Stripe what the platform already knows so onboarding asks for less. Wired into **all three** account-create paths (`initConnect`, `migrateAccount`, `loginToStripe`) — a creator migrated to a new account redoes onboarding from scratch, which is where being asked twice stings most.
- ⚠️ **It deliberately does NOT prefill `first_name`/`last_name`.** `users.name` is a DISPLAY name ("Oink Store", a stage name) and Stripe runs its KYC identity check against those fields — a creator who clicks straight through would submit a legal name that does not match their document and fail verification days later with no visible cause. An empty field is better than a confidently wrong one.
- ⚠️ **Address and phone cannot be prefilled — creators have no such columns.** `gifter_addresses` is supporters only, and since 1 Aug 2026 it holds country alone. Realistically the prefill removes **at most 3 of ~9 fields** (`dob`, and only for creators who filled the optional profile DOB). Removing the rest needs them collected at signup — a product decision.
- `migrateAccount` was requesting `card_payments` **without `transfers`**, which Stripe refuses — the migrated account came back missing the capability the migration exists to obtain. Fixed.

## My Listings — one catalogue over six modules (6 Aug 2026, spennypiggy.co)

`GET /my-listings` (`catalogue.index`) → `Creator/Catalogue/Index.jsx`. A creator sells six
different things and every one of them lived on its own screen with its own idea of what "live"
means, so "what is on sale, and what is stuck?" could only be answered by opening six pages.
**`App\Support\CatalogueRegistry` is the ONE definition of the catalogue**; `App\Services\CatalogueService`
reads it. Adding a seventh sellable type is a row in `TYPES`, never an edit in the controller, the
service and the JSX.

- **One status vocabulary for six modules** (`STATUSES`, ordered by how much it wants attention):
  `suspended · rejected · expired · sold_out · in_review · paused · not_featured · completed ·
  archived · live`. **That order IS the default sort** — newest-first buries the listing rejected
  three weeks ago, which is the row this screen exists to surface.
- ⚠️ **"In review" and "Changes needed" are different states.** A held item with a
  `moderation_reason` has been looked at and refused; one without has not been reached yet.
  Collapsing them tells a creator to fix something nobody has judged.
- ⚠️ **Piggy Pot delegates to `PiggyPotStatusService::visibility()`** — the ONE definition. A pot's
  real state is not readable from `status` alone: the expiry sweep is hourly, so a pot that closed
  at midnight still reads `active` until it runs.
- 🚨 **The chip counts describe the WHOLE catalogue, never the filtered slice.** Filtering the
  *fetch* by type made every unselected chip read 0, so opening "Paid requests" told the creator
  they had no wishes, no shop and no pots — and the only way to find out otherwise was to press
  each chip. All six types are always fetched (one capped query each); the type filter is applied
  after the counts. Same rule the admin cohort cards follow.
- 🚨 **`CatalogueRegistry::columns()` must select the `active` column, which is NOT in `extra`.**
  Left out, a paused shop item is selected without its own `status`, reads as null, and is reported
  to the creator as **live** — the exact state they turned off.
- ⚠️ **`piggy_pots` has no `is_suspended` column** (`2026_05_08_175853_add_is_suspended_to_items_tables`
  predates the table and was never extended), hence the per-type `suspend` key. Selecting it there
  is a SQL error, not a false.
- ⚠️ **`memberships.level`/`.status` and `shops.status` are declared by NO migration.** Every
  deployed database has them; one built from migrations alone does not. `optional` columns are
  resolved once per request with `Schema::hasColumn`, and **one type failing is logged and skipped,
  never fatal** — the creator's other five are still worth showing.
- **Nothing returns a model.** The six models append `perma_link`, `real_category`, `total_sold`
  and `content_file_url`, several of which query per row — the documented 206-query trap. Explicit
  `select()` + plain arrays, which is also what guarantees **`reward_body` never reaches the
  browser** (asserted by test).
- **Sales are LIFETIME counts, one query per type** (`CatalogueRegistry::SALES`), filtered by the
  `NOT_PAID` failure set rather than a positive "paid" list. ⚠️ **Wish counts `stripe_payment_items`
  only** — a recurring wish writes that row *and* a `wish_item_subscriptions` row, so counting both
  doubles every subscription. ⚠️ A NULL `payment_status` is a checkout that was started, not one
  that completed.
- **Views/funnel exist for `shop` and `task` only** (`ItemViewTracker::TYPES`) and `ItemFunnelLine`
  is reused as-is. The other four have no public page of their own to count; rendering an empty
  funnel for them would read as "nobody looked", which is a different and far more alarming finding.
- **Pause is offered only where an endpoint exists to honour it** — shop's `deactivate-shop`, and
  only when `shops.status` is present. A button that cannot do anything is worse than no button.
- **`public_url` is null for anything not live** (sending a creator to their own 404 to "check how
  it looks" is the opposite of useful) and `share` reuses `ItemShareService::SHARE_SOURCE` so a
  shared link stays attributable.
- **Read-only, and deliberately not a seventh place to edit from.** "Manage" sends each type to its
  own module screen; only Paid Requests have a dedicated edit page.
- **Measured: 31 queries for 60 listings across all six types** — bounded, asserted at ≤35.
- ⚠️ **A listing with no image of its own gets a FALLBACK thumbnail, never a broken-image
  glyph** (14 Aug 2026). The catalogue builds its own square crop from plain arrays — models
  are never returned here — so it bypassed every module's `perma_link` accessor and had no
  fallback at all. Measured live: **all 16 paid requests, 6 of 13 bills and 5 of 14
  memberships store no image**, so the glyph was most of the page, and to a creator it reads
  as their own upload having failed. `CatalogueService::fallbackUuid()` decides:
  **`MediaUrl::FALLBACK_THUMBNAIL`** (`901c0a0e…`, the platform piggy placeholder) for five
  types, and a Membership falls back to its **TIER art** — the tier IS the product, and five
  identical piggy tiles say nothing about which one is being looked at.
  ⚠️ **The uuids have ONE definition each** — `MediaUrl::FALLBACK_THUMBNAIL` (was retyped in
  `Bills`, `WishItem`, `ShopCard.jsx`, `AddBills.jsx`) and `Membership::defaultThumbnailUuid()`
  (was an if/elseif chain inside the accessor). Never retype either; a type added later just
  renders the broken glyph again. ⚠️ `Membership::perma_link` used to return **`false`** for an
  unrecognised level — a bare `false` in an `<img src>` is a broken image — and now falls
  through to the placeholder. `ListingRow.jsx` keeps an `onError` that degrades a dead CDN
  reference to a quiet tile.
- Entry points: Creator Studio row (`Accountsetting.jsx`), an owner-only card on the profile
  (`Dashboard.jsx`), and a link from `financial.opportunities`' "Which listings are working" panel,
  which only ranks the two types that have view data.
- ⚠️ The route sits in `routes/auth.php` **above** the `/{username}/{page?}` catch-all, and behind
  that group's `CheckStripeIdentityVerification` — same gate as the financial dashboard, so a
  creator mid-onboarding is redirected rather than shown an empty catalogue.
- Tests: `tests/Feature/CatalogueTest.php` (21) — all six types in one list, another creator's
  catalogue never returned (Task keys on `creator_id`), each status, a pot expiring before the
  sweep, `reward_body` absent, unpaid ≠ sold, a wish sale counted once, soft-deleted excluded,
  attention-first sorting, **a type filter not zeroing the other chips**, and the query budget.

### Duplicate a listing (6 Aug 2026)

`POST /my-listings/{type}/{id}/duplicate` (`catalogue.duplicate`, `identityBeforeListing` +
`throttle:10,1`) → `App\Services\ListingDuplicator`.

- 🚨 **A LISTING CANNOT BE COPIED AS A DATABASE ROW.** Every one of the six carries its own
  `stripe_product_id` / `price_id`, created on the creator's connected account at save time. A
  row copy would carry those over and the new listing would **charge the ORIGINAL's price
  forever** — edit the copy to £30 and the supporter still pays £19.99. Silent; visible only in
  a payout.
- **A duplicate is a RE-SUBMISSION, not a copy.** `ListingDuplicator` builds the payload the
  module's own create form would have posted and calls that module's own `store()`. The price
  limits, `NoExpenseOrBrandName`, the blocked-word check, the reward contract, the media
  moderation scan, the Stripe product and the created-unapproved default therefore all come
  free and cannot drift. Same forge-a-Request pattern as the admin app's
  `ReviewDispatchController::decide`.
- **What is never carried over is what is simply absent from the payload:** the Stripe ids, the
  uuid, the approval flags, `moderation_reason`, and the social-engagement counters — all of
  which belong to the original's history.
- ⚠️ **The reward HEADLINE is never suffixed, only the listing title.** `reward_title` is what
  the supporter reads on the card, at checkout and on the receipt; "The full set (copy)"
  describes the creator's workflow, not what is being sold.
- ⚠️ **A pot's deadline is NOT copied.** The original's date is usually past, and a pot created
  already expired is invisible the moment it is made. `is_pinned` is false for the same reason.
- ⚠️ **Task takes its media as an ARRAY** (`media_file['url']`), not a string — the bare url is
  dropped in silence and the copy publishes with no picture. **Membership posts `month_price`,
  not `price`**, and its `level` is unique per creator, which is what the " (copy)" suffix
  exists to satisfy. A physical shop item rebuilds its `shop_shipping_info` rows into the
  `shipping` JSON the form posts, fail-soft — losing shipping costs one field, losing the
  duplicate costs the whole form.
- **Success is "did a row appear?"** The six store methods return four different shapes between
  them (JSON, `back()->with('error')`, `withErrors`, a thrown `ValidationException`); reading
  each correctly would be a fifth place to drift. A refusal surfaces the module's own message.
- ⚠️ **This layout does not toast flash**, so the catalogue page carries its own deduped flash
  effect. `useAlerts()` on the website is a plain factory returning **fresh closures every
  render** — held in a ref and kept out of every dependency array, or the effect re-runs on
  every render (the documented toast-storm loop).
- ⚠️ **The six end-to-end paths are NOT unit tested and cannot be** — every `store()` creates a
  real Stripe product, and no test in this repo has ever created a listing through a
  controller. `payloadFor()` is public so the load-bearing rules (what is and is not copied)
  are testable without Stripe; the happy paths are browser-verified.
- Tests: `tests/Feature/ListingDuplicateTest.php` (12).

⚠️ **More undeclared schema found while testing this** — `wish_items.reward`, `wish_items.ai_generated`,
`memberships.rewards`, `memberships.level`, and the entire `shop_shipping_infos` table are
created by **no migration**. Every deployed database has them; one built from migrations alone
does not, which is why creating a wish, a membership or a physical product is impossible in a
fresh test database without the `Schema::table` patches in `CatalogueTest`/`ListingDuplicateTest`.
Same class of gap as `users.role`, `users.cover_approved` and `shops.status`.

## Guest purchase lookup (6 Aug 2026, spennypiggy.co)

Guest checkout is allowed on **Piggy Pot, Wishes and the Piggy Bank**, so a real supporter
can pay a creator and hold nothing but a receipt email. Lose that email — deleted, or filed
in spam — and there was **no route back to the content at all**: they cannot sign in,
because there is nothing to sign in to. Every one of those was a support ticket.

`GET /find-my-purchase` (form) · `POST /find-my-purchase` (`throttle:5,1`, Turnstile) ·
`GET /my-purchases-link` (signed, `throttle:30,1`) → `App\Services\GuestPurchaseLookup`.

- 🚨 **The response is IDENTICAL whether or not the address has purchases.** "No purchases
  found for this email" turns the form into a way to ask *"is this person on Spenny
  Piggy?"* of any address a stranger cares to type. The difference is only in what is
  **sent**, never in what is **said** — and a mail failure is logged, never surfaced,
  because that difference is the same signal by another route.
- 🚨 **Paid content is withheld until the money has cleared.** `PAID` mirrors
  `ThankYouController::PAID` deliberately — these two are the only surfaces that hand paid
  content to someone who is not signed in, and they must agree. A `PENDING` (bank/SEPA/ACH)
  row says "your bank is still confirming"; anything else says nothing at all. The reward
  **headline** always renders: it describes the purchase and is not the purchase.
- ⚠️ **Shop, Paid Tasks, Bills and Memberships are deliberately NOT lookup sources.** All
  four force login at checkout, so a row there carrying a guest email is an anomaly — and
  serving its content on the strength of an email would be a way around the account gate
  those checkouts exist to enforce.
- ⚠️ **The address travels IN the URL**, which the POST endpoint would never accept. That is
  correct only because the URL is **signed** — the signature proves the platform minted the
  link and mailed it to that address. It is also why the page sends
  `X-Robots-Tag: noindex` and `Referrer-Policy: no-referrer`: **the URL is the credential**.
  A guest has no id, so the email is the only identifier available.
- **Link expiry is 7 days** (`GuestPurchaseController::LINK_DAYS`) — shorter than the 30 the
  checkout-reminder opt-out uses, because this grants access to paid content rather than
  flipping a preference.
- ⚠️ **`stripe_payment_details.guest_email` is declared by no migration** (it is in the
  model's `$fillable` only), so every source is guarded with `Schema::hasColumn`; one source
  throwing is logged and skipped rather than answering a supporter with "you have no
  purchases", which is the one wrong thing this page can say.
- Matching is case-insensitive — the address typed at checkout and the one typed into the
  form are the same address whatever the capitals.
- Mail is **transactional** (`Mail::to()->queue()`, `GuestPurchaseLink` +
  `email.guest-purchase-link`): it is about money already moved and content already paid
  for, so it never routes through `EmailService::sendMarketingEmail`. Sender comes from
  `config('mail.from.*')`, never `env()`.
- **Three entry points**, because a guest has no account to come back to:
  **the login page** ("Bought without an account?" — trying to sign in is exactly what
  someone does when their receipt is gone), **the thank-you page** (guest only, the moment
  they have just paid), and **the receipt email itself** via the shared partial
  `email.guest-purchase-hint`, wired into the three guest-capable buyer receipts
  (`piggy-pot-receipt`, `tip-granted`, `checkout-user`). ⚠️ The partial renders for a
  **guest only** — an account holder has `/my-purchases`, and telling them they have no
  account is worse than saying nothing. Each template supplies `isGuest` from its own row
  (`empty($pay->user_id)` / `$isGuest` / `empty($data->user_id)`); the partial resolves
  everything else, and builds its URL from `config('app.url')`, never `env()`.
- ⚠️ **The item query uses `withTrashed()`.** All six item models soft-delete, and a
  creator taking a listing down does not un-buy it — the name, creator and reward are all
  still on the row. Without it a soft-deleted listing rendered as a nameless card whose
  title was the bare type label, which reads as the listing having been *called* "Wish".
  A genuinely absent row (live data has paid wish subscriptions whose `wish_items` row was
  hard-deleted) carries `item_missing`, is titled **"Removed listing"**, and its note
  **replaces** the awaiting-settlement one — together they read "your content unlocks here
  soon" and "there is nothing left to collect" on the same card.
- Tests: `tests/Feature/GuestPurchaseLookupTest.php` (11) — identical response either way,
  nothing queued for an unknown address, content withheld on unsettled money, a failed
  payment not reported as awaiting, one guest's purchases never reaching another,
  unsigned/tampered/expired links, and the noindex + no-referrer headers.

### Three frontend traps found building these pages (6 Aug 2026)

- 🚨 **`leading-<n>` in this project means N PIXELS, not Tailwind's ratio.**
  `tailwind.config.js` extends `lineHeight` with numeric keys 0–100 mapped to `px`, which
  **overrides Tailwind's own scale** — so `leading-6` is `6px`, not `1.5rem`, and 15px
  paragraphs render **on top of each other**. `fontSize` is extended the same way, which is
  why the codebase writes `text-[15px]`. Use an arbitrary value (`leading-[1.55]`) or a
  deliberate pixel number (`leading-24`). This shipped visibly broken before it was caught.
- ⚠️ **`FlashMessenger` is already mounted in BOTH layouts** and its own docblock says to
  "remove individual flash handling from page components". A page adding its own
  `flash.success` effect is the duplicate-toast problem that component exists to prevent —
  and the earlier claim in this file that GuestLayout does not toast flash was simply wrong.
- ⚠️ **`Turnstile` takes no `siteKey` prop** — it reads `turnstileSiteKey` from the shared
  page props itself — and its default `size` is `compact`, which crops Cloudflare's own
  chrome so its lines overlap. Pass `size="normal"` on a full-width form. A red *"For
  testing only. If seen, report to site owner"* banner is a **Cloudflare dashboard setting**
  on the widget, not a fault in this code.

### Guest lookup data faults (6 Aug 2026)

Both found by opening the page against real data, not by the suite.

- 🚨 **`total_paid` is 0 on older rows with the real figure in `amount`**, so `total_paid ??
  $row->amount` keeps the zero and the purchase renders as **£0.00**. Use `total_paid ?:
  amount` — the same convention the Purchase Hub and the CSV export already use. Measured:
  every pre-2026 `wish_item_subscriptions` row.
- ⚠️ **A purchase can outlive its listing.** Live data has paid wish subscriptions whose
  `wish_items` row is gone entirely, so there is no title, no creator and no reward. The
  purchase is still shown — hiding money someone spent is the worst answer this page could
  give — but it carries `item_missing` and says the listing was removed, rather than
  rendering an empty card the reader has to interpret.
- ⚠️ **`RewardBlock`'s `locked` copy promises the content "unlocks as soon as your bank
  confirms"**, which is true while a debit clears and a plain lie on a refunded or failed
  payment. The block is therefore rendered only when settled or awaiting; a terminal
  payment gets a note instead of a promise. Three states, not two — the same rule as the
  funnel's `view_state`.

⚠️ **`piggy_pot_contributions.status` keeps its ORIGINAL tight enum on sqlite.** Migration
`2026_07_13_000003` widened it for bank payments but is MySQL-guarded, so a test inserting
`processing` or `failed` there is a CHECK violation — use `pending` / `refunded`, which mean
the same thing for these purposes.

## Scheduled listings (6 Aug 2026, spennypiggy.co)

A creator could publish a listing now or not at all, so a product drop meant being at a
keyboard at the right minute. `publish_at` (migration `2026_08_06_000000`, all six item
tables) is the whole feature: NULL behaves exactly as before, a future timestamp means the
listing is not on sale yet.

**Draft is deliberately NOT part of this.** The six `store()` methods validate every field
as required and a Stripe product cannot be created without a price, so a draft means a
SECOND save path per module — the duplication the duplicator exists to avoid. Separate
feature.

- 🚨 **Visibility is a GLOBAL SCOPE (`App\Models\Concerns\HasScheduledPublishing`), and
  that is the load-bearing decision.** A listing's visibility is decided in ~15 places —
  `UserProfileService`'s six methods, `DiscoveryService`'s ten map closures, two sitemaps,
  the item pages and the seven checkout gates. Adding a predicate to each means finding
  every one, and being wrong once is **silent** — and the silent failure is *someone buys a
  product that is not on sale yet*. **No checkout needed changing**: the scope means the
  row simply is not found, which is the safe default.
- ⚠️ **Visibility is decided by TIME, not by the publisher command.** The scope compares
  `publish_at` to the clock on every query, so a listing goes live at its minute whether or
  not `listings:publish-scheduled` (every 5 min) runs — a dead worker must not mean a
  launch silently fails. The command owns only the once-per-listing work: clearing the
  guest profile cache (without it the listing is live in the database and invisible on a
  cached profile) and telling the creator. `schedule_released_at` is the claim.
- ⚠️ **Deliberately NOT viewer-aware**, same as `Post`'s scope: a scope that let the owner
  through would also let the sitemap and a checkout through on any query that happens to
  run inside an authenticated request. **18 owner sites opt out with `withScheduled()`** —
  the six manage screens, edit/delete on each module, the catalogue and the duplicator.
  Missing one costs a creator sight of their own listing; that failure is visible, which is
  why the scope is the safer default in the other direction.
- ⚠️ **Approval is unchanged.** A listing that reaches its publish time unapproved does not
  go live — it goes live when an admin approves it, like any other. The publisher counts
  those separately rather than announcing them.
- ⚠️ **`scheduled` is the LOWEST-ranked catalogue status above `live`, and is checked
  LAST.** A scheduled listing that is also rejected is a REJECTED listing — telling its
  creator it goes live on Friday would be false.
- ⚠️ **`dateTime`, never `timestamp`.** A TIMESTAMP NOT NULL column with no explicit
  default is silently promoted by MySQL/MariaDB to `ON UPDATE CURRENT_TIMESTAMP`, so any
  later UPDATE would rewrite the creator's chosen time to now — the trap
  `platform_activities.occurred_at` already documents.
- **The picker lives on the catalogue row, not on the six forms** (`POST
  /my-listings/{type}/{id}/schedule`, `catalogue.schedule`, throttle 30/min). A schedule is
  a property of the catalogue, and six differently-shaped forms are six places for it to
  drift. Capped at `CatalogueController::MAX_SCHEDULE_DAYS` (90); a **past** date publishes
  now rather than erroring, and rescheduling clears `schedule_released_at` so the
  announcement re-arms. ⚠️ The client sends a full **ISO instant** — a raw
  `datetime-local` string carries no timezone and would be read against the server clock.
- 🚨 **Deploy order matters.** The scope is live in code the moment it ships; every listing
  query throws `Unknown column publish_at` until the migration runs. Vapor migrates on
  deploy, so this only bites a local checkout — run `php artisan migrate`.
- 🚨 **A scheduled listing still COUNTS as having listed.** `CreatorSetupService`'s
  `hasAnyListing()`, `hasAnyListingFast()` and `candidateQuery()` all read the six listing
  tables, and the last two close their subqueries with `toBase()` — which applies EVERY
  global scope, deliberately so for soft-deletes and wrongly for scheduling. Without an
  explicit `withScheduled()` a creator who prepared a launch would be told to "publish your
  first item", emailed the `creators:nudge-first-listing` mail, and left stuck on that step
  of `users.journey_step` — which the **admin app's onboarding drip** then reads and coaches
  them on. Being asked for work you have already done is how a creator learns to ignore the
  next message. Any new "has this creator listed anything?" check needs the same opt-out.
- 🚨 **Activity Status has TWO rules and listings feed one of them.** The posting cadence
  (`PostingCadenceService`, 30 days) counts `Post` rows only and is untouched. The
  **28-day content gate** (`CreatorActivityService::getContentBreakdown`) — which decides
  whether a creator may take payments at all — counts all six listing types, and it now
  windows on **`COALESCE(publish_at, created_at)`**, not `created_at`. Windowed on the
  drafting date, a listing scheduled three weeks out would burn 25 of its 28 days
  unpublished and count for three — **the gate would penalise a creator for planning a
  launch**, which is the opposite of what scheduling is for. `publish_at` is NULL on every
  listing that was never scheduled, so the old behaviour is unchanged. A listing that is
  not live yet does not count at all (the global scope excludes it), which is correct: the
  gate exists so a supporter paying gets an actively-selling creator.
- ⚠️ **Any future time-window over items must read `COALESCE(publish_at, created_at)`.** No
  public surface sorts or windows on item `created_at` today (checked: `DiscoveryService`'s
  30-day window is on `users`, `UserProfileService`'s two are on payment rows), but a "new
  this week" rail keyed on `created_at` would show a scheduled listing as already old the
  day it launches.
- **The publish date is SHOWN wherever a creator sees their own item.**
  `Components/ScheduledBadge.jsx` ("Goes live 12 Aug, 09:00") renders on the shop
  dashboard, the task card, the wish card and the bill card, plus the catalogue row. A
  scheduled listing otherwise looks identical to a live one on the creator's own screens,
  and the difference between "selling" and "nobody can buy this yet" would be invisible
  until the sales did not arrive. ⚠️ It renders **nothing** for a past date — `publish_at`
  stays on the row after a listing goes live, and labelling a live listing "scheduled"
  would be the opposite of true.
- ⚠️ **The owner sees their own scheduled listings on their own profile.** All five
  `UserProfileService::getOptimized*` builders opt out with
  `withoutGlobalScope('published')` on the `$isOwner` branch, and `publish_at` is added to
  each explicit `select()` — an unselected column is null, which is indistinguishable from
  "never scheduled".
- 🚨 **The admin review console says so before an admin approves.** Approving a scheduled
  listing does NOT put it on sale; without the note a reviewer approves, sees nothing
  appear on the site, and reasonably concludes the approval failed.
  `ReviewDispatchService` carries `publish_at` (read defensively — it is a website-owned
  column this app's models do not declare) and `Dispatch/Index.jsx` renders "Approving this
  will not publish it. It goes on sale on …". The admin app has no global scope of its
  own, so **scheduled items reach the review queue normally** — review happens straight
  away, only the going-live waits.
- Tests: `tests/Feature/ScheduledListingTest.php` (16) — invisible to the public, checkout
  cannot find it, live on time with the publisher never running, owner still sees it,
  scheduled never outranking a real problem, the cap, cross-creator refusal, the
  claim-once publisher, review still gating, dry run, every type carrying the scope, and a
  scheduled listing still satisfying the first-listing checks, and the content gate
  counting a listing from the day it went live rather than the day it was drafted.

## Engagement engine — reactivation, creator events, milestones, whale alerts (spennypiggy.co)

Turns the (previously display-only) churn signals into outbound messages. **Everything is queued — needs `queue:work`.**

- **Delivery:** `App\Services\NotificationDispatcher` → bell + push + email in one call, via queued `App\Jobs\SendEngagementNotification`. It is the **only writer to the `notifications` bell table** (nothing wrote to it before, so MagicBell pushes never appeared on-site). Use `NotificationDispatcher::queue()`, never `send()` directly from a request/loop — the push call is synchronous HTTP.
- **Consent:** `users.push_notifications_enabled` / `users.reactivation_emails_enabled` (migration `2026_07_20_000000`, default true) gate **marketing-class** sends per channel; pass `$marketing = false` for transactional messages to bypass. Marketing email still routes through `EmailService::sendMarketingEmail`.
- **Cross-sender cooldown:** the automatic engine, an admin's manual send and a creator's "Send platform reminder" each claim under their OWN dedup namespace, so the per-cycle lock alone cannot stop a supporter hearing from all three in one morning. Both manual senders therefore also refuse if *any* reactivation row exists for that supporter in the last **7 days** (`REACTIVATION_COOLDOWN_DAYS`).
- **Dedup (the core safety property):** `NotificationDispatcher::claim(userId, type, dedupKey)` INSERTs into `engagement_notifications` (migration `2026_07_20_000001`, unique on user+type+key) and returns false on duplicate. The claim IS the insert, so racing workers can't both win and re-running a command is a no-op. Keys encode the cycle — reactivation uses `lastPurchaseDate|stage`, so a new purchase legitimately re-opens it.
- **One churn definition:** `App\Services\SupporterLapseService::EXCLUDED_STATUSES` mirrors the admin SupporterIntelligence dashboard (same `financial_transactions`, same `MAX(transaction_date)`). Never fork it, or the engine and the dashboard will disagree.
- **Commands (all daily, `--dry-run` supported):** `reactivation:notify` 10:15 (exact-day 7/14/30 lapse) · `milestones:notify` 08:15 (birthday needs `users.date_of_birth`, optional; anniversary from `created_at`; 29 Feb greeted 28 Feb in non-leap years) · `whale:retention-alerts` 08:45 (**internal** alert to admins, one per risk episode — the supporter is never messaged).
- **Creator events:** `App\Observers\CreatorContentObserver` on WishItem/Shop/PiggyPot/Membership/Bills → `CreatorEventNotifier` fans out to `follows`, capped 5,000/item. **Moderation-aware:** held items (`moderation_hold`, `approved=0`) only notify when they cross into live on `updated` — never announce content still under review. Plain edits don't re-notify.
- **Reactivation email (July 2026):** `reactivation:notify` originally passed only `[CHANNEL_BELL, CHANNEL_PUSH]`, so the email channel — and `users.reactivation_emails_enabled` with it — was dead. It now passes `ALL_CHANNELS` with `App\Mail\ReactivationReminder` (view `email.reactivation-reminder`) and names up to **three creators the supporter has actually paid**, resolved via `creatorsSupportedBy()` (income FTs; **`user_id` IS the creator on an income row — there is no `creator_id` column**). Per-stage subject/heading/body live in `ReactivationReminder::COPY`, separate from the short bell/push copy in the command. Mailable args must stay primitives — it is constructed from a serialized queue payload, spread with `new $class(...$args)` so a **keyed** payload becomes named arguments and reordering keys at a call site cannot hand the mailable its arguments in the wrong order. Layout `email.default-2` had **no `<meta charset>`**, so every emoji/em-dash in *every* email rendered as mojibake; fixed there, not per-template.
- **Copy stays content-compliant** (no gift/tip/donation/fundraise wording).

⚠️ **SQLite gotcha:** binding a PHP float into `havingRaw` makes SQLite treat it as TEXT, and SQLite orders every numeric below every text — `SUM(...) >= ?` then silently matches nothing in tests while passing on MySQL. Use `CAST(? AS DECIMAL(12,2))` (see `WhaleRetentionAlerts`).

## 🚨 Push reachability — the server never knew if push worked (14 Aug 2026, spennypiggy.co)

`App\Support\PushReachability` is the ONE answer to "can we still confirm this person receives
push?", read by the heartbeat endpoint, the reminder sweep, the banner gate and the delivery
log's annotation so all four cannot disagree about who is stale.

🚨 **Push is registered ENTIRELY client-side** — MagicBell's `WebPushClient({ userEmail })
.subscribe()` in `Pages/webpush/MagicBellNotification.jsx`. Nothing was ever written
server-side, so `Helpers::sendNotification` posted to MagicBell, **MagicBell answered 200
because it ACCEPTED the notification — not because any device received it** — and
`notification_logs` recorded `sent` beside an empty phone. A creator could stop receiving
alerts for months with no error, no failed job and nothing in Sentry.

### 🚨 The root cause was ONE localStorage flag written on four different outcomes

`localStorage.isSubscribed = 'true'` was set on **success**, on an **unsupported browser**, on
a **denial**, and on a **MagicBell load failure**. So one dismissal or one transient error
retired the enable-notifications prompt **permanently on that device**, with no path back short
of clearing site data. Replaced by:

- **Nothing records a local "subscribed" flag any more.** `readPushState()` asks the browser
  directly (`registration.pushManager.getSubscription()`) — the registration is the only truth.
- **`spenny_push_prompt_dismissed_at` EXPIRES after `DISMISS_DAYS` (30).** "Not now" is not
  "never"; a permanent hide is one tap away from silently opting out of every sale alert.
- ⚠️ **`unsupported` and `denied` persist NOTHING.** Both are re-derived free on every mount,
  and a browser moves out of both — someone who blocked notifications can allow them in site
  settings, and an iOS visitor becomes supported the moment they install the PWA. Writing a
  flag there is what made those recoveries invisible forever.

### 🚨 It never asserts push is broken — only that we cannot CONFIRM it

A MagicBell subscription lives in the browser and at MagicBell; it does **not** die when our
7-day Laravel session expires. So a stale heartbeat is a much weaker claim than "push stopped",
and every piece of copy is worded that way. **Nothing here may suppress a send** —
`Helpers::sendNotification` still posts every push whatever this says.

- **`logNoteFor()` annotates a `sent` row, never downgrades it.** MagicBell genuinely accepted
  it, so `skipped` would be its own lie; what the log could not say before is that no device was
  known to be listening. Memoised per request, two columns, bounded at 500 entries.
- ⚠️ **`isLive()` fails OPTIMISTIC on an unselected column.** A missing attribute is null, which
  is indistinguishable from "never confirmed", and every surface built on this either nags
  someone or marks their log row. Same reasoning as `User::profileMediaVisible()`.

### Columns + the heartbeat

Migration `2026_08_14_000000`: `users.push_verified_at` (indexed), `push_permission_state`
(granted/denied/unsupported/default), `push_reminded_at`. ⚠️ **None are `$fillable`** — derived
telemetry, never posted by a form.

`POST /push/heartbeat` (`push.heartbeat`, `auth`, `throttle:20,1`) ← `utils/pushHeartbeat.js`,
client-throttled to `HEARTBEAT_THROTTLE_HOURS` (6) but **always posting on a CHANGE**.

- 🚨 **`subscribed` is the ONLY thing that stamps `push_verified_at`. PERMISSION IS NOT A
  SUBSCRIPTION** — a browser reports `granted` while never having completed `subscribe()`, in
  which case MagicBell has no device and delivers nothing. Treating `granted` alone as
  confirmation is the false positive that would email people whose push works while staying
  silent about those it does not.
- 🚨 **The write is a direct `User::query()->update()`, NOT `forceFill()->save()`.** Eloquent
  writes only DIRTY attributes, and the guard's in-memory user may already hold null — so
  clearing `push_reminded_at` was silently dropped and the row kept its claim, leaving a creator
  who had just reconnected unable to be told again for 30 days. It also fires no model events
  (`User::updated` re-renders the attribution watermark, which has no business on a page load).
- The heartbeat fires on **every mount**, not only when the banner shows — the banner is hidden
  for exactly the accounts whose subscription may have lapsed.

### `push:remind-stale` (daily 09:20, `--dry-run` / `--max` / `--user`)

Email only. Pushing about push is circular, and the bell is read by someone already in the app —
which is the act that refreshes the heartbeat and makes the message unnecessary.

- 🚨 **It only fires when there was SOMETHING TO MISS** — a `sent` push row in the delivery log
  since the last confirmation. A creator who lost nothing being told their alerts might be off
  is what teaches people to ignore the next one. This is what stops it being a blind 14-day timer.
  ⚠️ Answers TRUE when the log is unreadable: "we cannot tell" is not "nothing happened".
- **`STALE_DAYS` 14, deliberately DOUBLE the 7-day session lifetime** — anyone opening the app in
  a normal week re-confirms long before it. `REMIND_EVERY_DAYS` 30.
- ⚠️ **`denied` and `unsupported` are excluded from the sweep**, not merely worded around —
  neither is fixed by opening the app, so an email is advice that cannot be followed.
- **The claim is the UPDATE** (`where push_reminded_at < cutoff` → now), taken per creator before
  the send and **released on failure**, so one SMTP blip does not cost that creator the window.
  A confirmed subscription **clears** the claim.
- ⚠️ `--max` caps creators EMAILED, not examined — capping the query means a run whose first N
  candidates all had nothing to miss reaches nobody, and the gap grows with the table.
- Creators only (`role = 1`), `push_notifications_enabled` respected, `$marketing = false`
  (operational account state; the audience is already consent-filtered by the query).
- Guarded on `Schema::hasColumn` — it is scheduled, and a daily throw for a missing migration is
  not a fault.

Tests: `tests/Feature/PushReachabilityTest.php` (15).

## Payout notifications (spennypiggy.co)

Every payout tells the creator three things: it was sent, and then whether it arrived or failed.

- **Sent** — `PayoutService::executePayouts` pushes the existing MagicBell notification **and** sends `App\Mail\PayoutInitiated` (amount, date, destination, Stripe payout id, estimated arrival).
- **Arrived / failed** — the `payout.paid` / `payout.failed` webhook sends `App\Mail\PayoutCompleted` for **standard runs only** (`bonus_type` empty); Founder and Fast-Start bonuses have their own emails in the same handler.
- The failure copy states the amount returns to the balance and retries next run — that is what `requeueFailedRunPayout` actually does, and a creator not told this opens a support ticket for an already-handled case.

**Conventions:** payout mail is **transactional** — never route it through `sendMarketingEmail`/`sendCategoryEmail`, there is no opt-out. Every send is wrapped in try/catch and logged, because a mail failure must never interrupt a payout that has already moved real money.

⚠️ **Stripe's `arrival_date` reaches the creator** (12 Aug 2026). It was already stored on `PayoutRecord`, but only `PayoutCompleted` printed it — *after* the money landed, which is the one moment nobody needs a date. `PayoutInitiated` now takes an `?string $arrivalDate` and the template renders "Estimated arrival" **only when it is present**: Stripe may omit the field, and printing a date the bank never promised is worse than the generic "a few business days" line.

⚠️ **A mailable's `from:` must read `config('mail.from.*')`, never `env('MAIL_FROM_*')`.** `env()` returns null once Vapor caches config on deploy, so the hardcoded fallback wins silently — and it is wrong: `MAIL_FROM_NAME` is `"Support - Spennypiggy"` while the fallback says `"Spenny Piggy"`. Fixed across the seven payout mailables; **~70 other mailables still carry the `env()` form** and mislabel their sender in production (tracked in TASKS).

### 🚨 A payout executed from the ADMIN panel sends NO email (12 Aug 2026, both apps)

The two apps share the database but not the code, and **each has its own `PayoutService`**. The website's `executePayouts()` sends `PayoutInitiated`; the admin app's copy (`/finance/payout/execute` → `Admin\RiskController` / `AdminFinanceDashboardController`) contains **one** notification call — `Helpers::sendNotification()`, a push — and no `Mail::` of any kind. There is no payout mailable in `admin.spennypiggy.co/app/Mail` at all.

So every manually-executed run leaves creators with money in flight and nothing in their inbox. Confirmed on production 7 Aug 2026: a run executed at 11:58:58 UTC produced a `push` row in `notification_logs` at 11:59:04 and **no email row in any state** — not `sent`, not `failed`, not `skipped` — while the logger was demonstrably working (two other emails captured the same day).

- **Repair: `payout:send-initiated-mails`** (website) — `--date=` (default today) · `--run=` · `--creator=` · `--max=` · `--dry-run`. Sends `PayoutInitiated` for payout records that went out without one.
- ⚠️ **The claim is taken BEFORE the send and keyed on the PAYOUT RECORD, not the creator** (`engagement_notifications`, type `payout_initiated_backfill`). It is run by hand, usually more than once, against money that has already moved — so a re-run must be a no-op. Per-record rather than per-creator because a creator paid twice in one day was genuinely paid twice and should be told twice. A failed send **releases** the claim, or one SMTP blip means that creator is never told by any later run.
- ⚠️ **Only `in_transit` / `paid` / `pending` qualify.** "Your payout is on the way" is false for a `failed` or `canceled` payout, and it is the kind of false that generates a support ticket.
- ⚠️ **Bonus payouts are skipped** (`metadata.bonus_type`) — they have their own initiated email, and sending the standard one on top describes the same money twice.
- Tests: `tests/Feature/SendPayoutInitiatedMailsTest.php` (9).

**The real fix is still open:** the admin app should send `PayoutInitiated` itself, or this command has to be run by hand after every manual payout. Tracked in TASKS.

### `payout:run-weekly --dry-run`, and an empty run that says so (12 Aug 2026)

- **`--dry-run`** runs `calculatePayouts()` only — no Stripe call, no `payout_runs` row, no email — and prints a per-creator table (net payout · reserve held · reserve release · pending · payment count · cutoff) with a **notes** column naming why a creator nets zero (`below £1 minimum`, `awaiting delivery`, `review hold`, `negative balance`). It **skips the Friday gate**: a dry run pays nobody, so the gate would only block the one thing that is safe on any day.
- ⚠️ **A run with nobody eligible used to return in silence** — before the success email, so no row, no log, no notification. Identical from the outside to a scheduler that never fired, which is precisely what it was mistaken for. It now logs, prints a diagnosis, and sends a `NOTHING TO PAY` ops email (never on a dry run). The diagnosis counts unpaid payments, how many are still inside the 7-day hold, and how many creators have payouts paused.
- Tests: `tests/Feature/WeeklyPayoutDryRunTest.php` (6).

### ⚠️ A first risk evaluation is not a risk CHANGE (31 July 2026, both apps)

`RiskService::evaluateRisk()` emails the creator whenever `risk_level` differs from its previous value. **A DB default is not applied to a just-created in-memory model**, so the row `CreatorMetric::firstOrCreate()` returns held `risk_level = NULL` even though the column defaults to `'low'` — the very first evaluation then compared `'low' !== null`, counted as a change, and sent **"Account Status Update: Restrictions Lifted"** (`email.risk.low_risk_restored`) to a brand-new creator who had never been restricted, with no sales and no listings.

It fired the moment a new creator opened their dashboard: `Api\CreatorRiskController::getRiskStatus` calls `recalculateMetrics()` on every load, as do the listing-create paths in `ShopsController`, `BillsController` and `MembershipController`.

- **`CreatorMetric::$attributes` now mirrors the column defaults** (`risk_level => 'low'`) in **both** apps — the shared table means the admin app's copy of the model needs it too. Any model whose first read happens in the same request as its `firstOrCreate()` needs the same treatment; the DB default will not save you.
- `evaluateRisk()` also treats a `wasRecentlyCreated` / NULL / empty level as the `'low'` **baseline**, so a legacy row cannot resurrect the bug, and the else-branch writes `risk_level` back so a NULL row is normalised instead of being re-detected as "first" forever.
- A first evaluation that genuinely lands on `high` **still** emails — the baseline is `low`, not "skip the notification".
- The admin app's `RiskService` never emailed (no notify call), but had the same NULL comparison writing a false "Risk Level Changed" log line; fixed alongside.
- Tests: `tests/Feature/RiskLevelChangeNotificationTest.php` (new creator silent, baseline is `low`, genuine escalation and genuine recovery both still email). ⚠️ `risk_thresholds.min_tx_count` is seeded at **10**, so a dispute-rate test needs 10 payments before any rule fires.

## Creator financial dashboard — three tabs, one hero (29 July 2026, spennypiggy.co)

`Creator/Financial/Dashboard.jsx` (route `financial.dashboard/{tab?}`) was one long scroll that printed **"Available for Friday payout" four times** — the hero, the "where the rest sits" list, the "this week's balance" panel and the "queued" status card all rendered the same figure, so nothing on the page read as the answer. Rebuilt around one number and three tabs; **no controller, route or prop change** — `{tab?}` already accepts any string and an unrecognised value falls back to Overview.

- **Hero renders on every tab**: next payout figure + real state chip (`payoutState` — paused / balance recovery / below minimum / on schedule, never a blanket green) + three explaining figures (Clearing · Reserve held · Pending delivery). The reserve tile is the entry point to the reserve modal.
- **Tabs are `overview` · `payouts` · `tax`** (`TABS` const is the definition). Overview = where the money sits, upcoming sales, earnings snapshot, trend, income by type, top supporters. Payouts = payable maths, schedule, reserve policy, per-status buckets, bonuses, payout history, full ledger. Tax = tax-year totals, set-aside, year progress, business details, every statement/record download.
- ⚠️ **`LedgerHistoryTable` branches on `active_tab === 'overview'`** for tax-year vs all-time. The Tax tab therefore passes the literal `"overview"`, not its own tab key — passing `tab` through would silently switch it to an all-time list under a tax-year heading.
- **The page uses `rounded-box` / `rounded-box-sm` throughout** (it was hardcoded `rounded-[30px]` mixed with `rounded-xl`/`rounded-lg`) and one shared `CARD` / `MONEY` / `LABEL` / `BTN` token set. Cards are white on `bg-gray-50`; the single gradient left is the hero.
- **Every list has a mobile form.** The reserve modal's 6-column table now has a card list under `md:`; payout history keeps its existing cards/table split. Tab strip is sticky, 48px tall, horizontally scrollable; page carries `min-h-dvh` + `pb-28` for the bottom nav.
- Copy is plain and content-compliant — "Your next payout", "Arrives in 3 days", "The money stays in your balance and retries next Friday" on a failed payout (the requeue behaviour, so a creator doesn't open a ticket for a handled case).

## Revenue Opportunity Centre (spennypiggy.co)

`GET /financial/opportunities` (`financial.opportunities`, auth group; returns JSON when `wantsJson`) → `CreatorFinancialController::opportunities` + `App\Services\CreatorOpportunityService`, page `Creator/Financial/Opportunities.jsx`.

**Entry points (24 July 2026 — discoverability):** reached from three places — the small link in the dashboard Records card (kept), a **prominent pink CTA** in the financial-dashboard "Your money" band (`Dashboard.jsx`, right under the payout hero), AND an **owner-only** "Grow your income" banner on the creator's own public profile (`Pages/Dashboard.jsx`, beside `CreatorRiskBanner`, gated `IsloggedIn && role==1` so fans never see it). All three link to `financial.opportunities`; none add a query to the host page (static CTAs, no live counts by design — the service's 5–6 queries would run on every dashboard/profile load).

**New-creator "getting started" mode:** `Opportunities.jsx` gates the supporter/retention sections on `hasSupporters` (`totals.supporters > 0`). A creator with no sales sees a growth checklist (publish content, connect payouts, share profile) plus the tailored `publish_*` actions instead of empty zero-value panels — the page is useful from day one, not only once earnings exist.

**Revenue-by-feature on the page (24 July 2026):** `for()` now returns `revenue_by_type` — income split across the seven features (Memberships / Bills / Wishes / Tasks / Shop / Piggy Pot / Tips), grouped from the ledger by `source_type`, summed `net + VAT`, converted per currency (never a raw cross-currency SUM). Every feature is returned even at zero (a zero is itself an opportunity), rendered as share bars on `Opportunities.jsx`. The `source_type→label/colour/icon` map mirrors the dashboard's "Income by Type" widget so the two screens agree; Tips = `TipGoalsPayment`. This makes the page self-contained against the client's Priority-3 brief (previously the breakdown lived only on the financial dashboard).

**Review hardening (24 July 2026):**
- **Spend thresholds are currency-correct.** `lifetime_spent`/`monthly_spent` are in the creator's DISPLAY currency, but `HIGH_VALUE_GBP`/`PLATINUM_SPEND_GBP` are GBP — `alerts()` and `suggestedActions()` now take `$currency` and convert the threshold once (via a shared `convert()` helper) before comparing, so a non-GBP creator's whale/thank/Platinum signals no longer misfire. Alert/action copy amounts are formatted in the display currency (`fmtMoney()`), not a hardcoded `£`.
- **"Platinum" is a SPEND tier, not the engagement Level.** `new_platinum` (alert) and `contact_platinum` (action) fire on lifetime spend ≥ `PLATINUM_SPEND_GBP` (£500), matching the client's money-tier intent — the engagement Level (score) still drives `top_tier`/`follow_up_vip`. Filtering `new_platinum` on engagement score silently missed a high-spend, low-frequency supporter.
- **"Piggy Bank", never "Tips"** — `revenueByType()` labels `TipGoalsPayment` as Piggy Bank (banned-vocabulary compliance on a creator-facing surface).
- **Retention has a `cooling` bucket** (last purchase 30–60 days) between reactivated and lost — a drifting-but-winnable supporter used to fall through every branch and be counted nowhere. Rendered as a 5th retention tile.
- **Revenue-by-type panel is gated on `revenueTotal > 0`, not `hasSupporters`** — guest/anonymous checkouts (Piggy Pot/Wish) earn without a `supporter_id`, so a guest-only creator would otherwise see "no supporters" and no revenue panel despite real income.
- **Shared helpers** cut the repeated ledger-query scaffold and currency idiom: `incomeQuery()` (one definition of the income-FT filter), `convert()`, `GROSS_EXPR` const (`net + COALESCE(vat,0)`), and the tier list is read from `VipScoreService::levels()` instead of a second hand-copied colour/icon map.

**VIP tier is enriched for ALL supporters, not just the displayed top 10 (24 July 2026):** `supporters()` calls `VipScoreService::badgesFor()` once over every supporter id (batched — six source queries total regardless of count), so the score-based alerts/actions (`new_platinum` score ≥ 90, `top_tier` / `contact_platinum` score ≥ 70, `follow_up_vip` 50–69) and the tier-distribution bar see the whole set — a high-engagement supporter who ranks low on lifetime spend is no longer missed. `tierDistribution()` counts from that already-enriched collection (no second VIP lookup). Alerts/actions filter on `vip.score`, never the label, because `VipScoreService::TIERS` renamed the gem names to `Level 1–5` — a string check on `'Platinum'` silently matches nothing.

Answers "what should I do next" where the dashboard answers "what did I earn": per-supporter lifetime spend / purchase count / first+last purchase / AOV, VIP tier, 30-day retention split (new / returning / **reactivated** = back after 60+ days silence / lost), and ranked suggested actions.

**Conventions:**
- VIP tier comes from `VipScoreService::for()` — the same source as the public leaderboard. Never compute a second tier definition.
- **A one-time buyer is never flagged `at_risk`** (requires `purchases > 1`). They were never a regular, and flagging them buries the established supporters worth chasing.
- VIP enrichment costs a query per supporter, so it is capped at `VIP_ENRICH_LIMIT` (the displayed slice), not run across all supporters.
- Excluded-status list matches the ledger/payout definition.
- **All outbound suggestions are advisory** — with ONE sanctioned exception. The platform never exposes supporter contact details to a creator; copy points them at their own social channels. The exception (July 2026, closes the brief's "trigger platform reminder where allowed"): **`POST /financial/opportunities/remind/{supporterId}`** (`financial.opportunities.remind`, throttle 10/min) lets a creator fire the platform's OWN fixed reactivation template at one of THEIR at-risk supporters. "Where allowed" is enforced server-side: ledger-verified ownership + repeat buyer + 30d quiet, the same consent gates as the engine, one nudge per creator per quiet spell via the shared `engagement_notifications` claim (`creator:<id>|<lastPurchaseDate>`), fixed copy only (reuses `ReactivationReminder` naming that creator), and the supporter's contact details still never reach the creator. Button lives on the at-risk rows of `Opportunities.jsx`.
- **All named VIP alerts exist (July 2026):** top-tier · at-risk (churn) · new supporters · **new whale** (first purchase in-window AND already past `HIGH_VALUE_GBP`) · **new Platinum** (Platinum-tier supporter whose first purchase from this creator is in-window — distinct from the combined top-tier count) · **returning whale** (high-value AND in `retention()['reactivated_ids']` — back after 60+ days silent) · **high-value purchase** (biggest single order in-window ≥ `BIG_PURCHASE_GBP` £100, computed max-per-currency-then-convert, because a raw SQL MAX across currencies calls 1,000 JPY bigger than 100 GBP). `alerts()` now takes the creator as its first argument.
- **Per-supporter monthly spend (24 July 2026):** `supporters()` returns `monthly_spent` (current calendar month) alongside `lifetime_spent` — a single conditional-SUM (`transaction_date >= startOfMonth`) in the same grouped query, converted per currency like the lifetime total (no extra query). Rendered under the lifetime figure on `Opportunities.jsx`; `first_purchase` ("since …") is also now shown on each supporter row.
- **Suggested actions now cover all five client types:** `thank_high_value`/`welcome_new` · **`contact_platinum`** (a Platinum/Diamond supporter) · **`follow_up_vip`** (a still-active Gold-tier supporter) · **`upgrade_membership`** (fires when the creator ALREADY sells a membership — distinct from `publish_membership` for creators with none) · **`promote_wishlist`** (fires when the creator has a published `WishItem` — distinct from `publish_wish` for creators who never sold one). VIP-based actions read the enriched `vip.level` (only the top `VIP_ENRICH_LIMIT` slice carries it). `soldProductTypes()` is fetched once and shared by the promote/publish branches. All copy stays content-compliant (no gift/tip/donation/fundraise) and advisory (points at the creator's own channels).

## Email Preferences System (spennypiggy.co)

### Overview
Users can opt in/out of marketing emails, with a one-click unsubscribe link and an audit log of all changes.

### Database
- `users.marketing_emails_enabled` (boolean, default TRUE), `users.marketing_unsubscribed_at` (timestamp, nullable).
- `email_preference_logs` table: `user_id`, `old_value`, `new_value`, `source`, `created_at`.

### Backend & routes
- `EmailPreferenceController`: `GET /email-preferences` (`showPreferences`), `POST /email-preferences/update` (`updatePreferences`), `GET /unsubscribe/{user}` (`unsubscribe`).
- Unsubscribe links are Laravel **signed URLs that expire in 24 hours**, protected by the `signed` middleware.
- `EmailService::sendMarketingEmail(User $user, Mailable $mailable)` checks the consent flag before sending.
- Checkout reads a `marketing_opt_in` flag and records it via `EmailPreferenceController::logPreferenceChange` with source `checkout_opt_in`.
- Admin audit view at `/admin/email-preferences` (`auth:admin` + `2fa`), with filtering and CSV export.

### Frontend
- `resources/js/Pages/EmailPreference/Index.jsx` (manage preferences).
- Checkout opt-in checkbox is rendered by the live checkout page/controller (the old orphaned `Pages/checkout/GlobalCheckout.jsx` was removed in the unused-file cleanup).

### Preference categories (July 2026)
Users control each category separately, so turning off promotions does not silence product announcements. `EmailPreferenceController::CATEGORIES` is the list: `product_updates_enabled`, `creator_updates_enabled`, `reactivation_emails_enabled`, `push_notifications_enabled` (migrations `2026_07_20_000000` / `2026_07_20_000002`, all default true). `marketing_emails_enabled` stays separate because it also stamps `marketing_unsubscribed_at`.

- **Security, legal and transactional mail has no switch by design** — it must always send. Never add one, and never route it through a consent-checking helper.
- **A missing/null preference always means opted IN.** Every read path uses `?? true`; DB defaults aren't applied to a just-created in-memory model, so a strict check would wrongly read as opted-out.
- `updatePreferences` validates every field as `sometimes`, so the page can submit one toggle without clobbering the others.
- **Category-aware unsubscribe:** `generateUnsubscribeToken($user, $category)` signs the category into the link, so an email footer can turn off just that category. Omit the category and it behaves as before. The audit `source` stays exactly `unsubscribe_link` for the marketing opt-out (the admin view/CSV export filters on that literal); category links use `unsubscribe_link:<column>`.
- UI: `resources/js/Pages/EmailPreference/Index.jsx` renders one switch per category plus an always-on explainer card.

### Sending email
```php
// Promotional/marketing — respects marketing_emails_enabled
EmailService::sendMarketingEmail($user, new MarketingMail($data));

// Product/creator/reminder categories — respects that category's column
EmailService::sendCategoryEmail($user, new ProductUpdateMail($data), 'product_updates_enabled');

// Security, legal, receipts — no opt-out exists
Mail::to($user->email)->send(new PasswordReset($data));
```
The mailable must **not** send itself in its constructor or `build()`. Never use `Mail::to()` directly for marketing or category email — only for transactional mail.

## Bank Payments — Pay by Bank / SEPA / ACH (spennypiggy.co)

Multi-method checkout (July 2026 client spec): supporters pay by **card/wallet (21% construction — unchanged)** or **bank (15%)**; the creator ALWAYS receives exactly the listed price — fees are grossed-up into the supporter price per **fee profile** (`config/payments.php` → `fee_profiles.card|bank`). Plaid was evaluated and rejected (MoR/regulatory shift; old POC in `Future-Profilez/uk.spennypiggy.co` — do not port). Everything runs on existing Stripe Connect rails; payouts/reserves/ledger untouched. Full plan: `docs/specs/PAY_BY_BANK_TECHNICAL_PLAN.md`.

- ⚠️ **The creator's net is only as right as the STRIPE FEE ESTIMATE.** The supporter's price is grossed up from `fee_profiles.*.stripe_rate` + `stripe_fixed_fee`, and the platform's cut is taken as a fixed application fee — so when Stripe's real fee exceeds the estimate, the difference comes out of the **creator's** net, not the platform's. Verified 27 July 2026: the formula itself never underpays (32/32 prices £4.99–£10,000 on both profiles returned net ≥ listed, never short). The exposure is entirely in the estimate: **card assumes 2.9% + fixed, and Stripe charges more than that for non-domestic cards**; the bank profile estimates above its real cost, so bank is safe. This already cost a creator once — a £15 listing charged £19.05 where Stripe took a flat £0.30 against an assumed 1%, paying £14.89. `payments:verify-creator-net` (scheduled **daily 06:30**, `--days`/`--limit`/`--all`) compares the real balance-transaction fee against the estimate per payment and logs a warning on any shortfall; `StripeControl::getChargeFactsForPaymentIntent()` returns the charged amount, real fee, application fee and the profile in one retrieve. ⚠️ **The profile MUST be read from the intent's metadata, not from `payments.fee_profile` — that column does not exist**, so assuming "card" silently mis-checks every bank payment. The `stripe_fee_actual`/`stripe_fee_expected` columns on the payment models are still never written; the command is the only thing comparing the two.
- **Pricing engine:** `Helpers::calculateStripeDirectChargeFlow($listed, $currency, $reserveRate, $feeProfile='card')` — 4th param selects the profile; returns `fee_profile` in the breakdown. `App\Services\PaymentMethodPricingService` wraps it (`dualPrices()`, `bankMethodsForCurrency()`, `hasDelayedSettlement()`). Nothing else may compute supporter prices.
- **Connected accounts must have bank capabilities REQUESTED via API** — Stripe's dashboard "on by default" toggle only reaches accounts with Stripe Dashboard access, so Express/Custom connected accounts silently lack `pay_by_bank_payments` / `sepa_debit_payments` / `us_bank_account_ach_payments` and checkout refuses with *"Bank payment is not available for this creator yet"*. Country allow-list lives in `StripeControl::bankCapabilitiesForCountry()` (PbB = GB/FI/FR/DE, SEPA = Eurozone, ACH = US — requesting an ineligible one errors). Three layers, so no creator is ever missed:
  1. **Onboarding** — bank capabilities are included in the `capabilities` payload at account creation (`StripeController`, the two main create sites).
  2. **Self-healing (authoritative)** — `StripeWebhookController::ensureBankCapabilities()` runs on every `account.updated` event (including when onboarding completes) and requests only what's missing. Accounts are created from ~6 code paths, so this webhook top-up — not per-site patching — is what guarantees coverage.
  3. **Backfill** for accounts that connected before all this: `php artisan stripe:request-bank-capabilities [--dry-run] [--user=]`.
  ⚠️ Read capabilities via **`StripeControl::capabilitiesMap($account)`** — a raw `(array)` cast on a Stripe `StripeObject` returns its internals (`_values`, `_opts`, …), not capability names, which silently makes every capability look "missing".
- **Bank methods per charge currency** (`payments.bank_methods`): GBP→`pay_by_bank`, EUR→`pay_by_bank`+`sepa_debit`, USD→`us_bank_account`; other currencies = card only. Master flag `BANK_PAYMENTS_ENABLED` (default **false**) + per-method flags (`PAY_BY_BANK_ENABLED`, `SEPA_PAYMENTS_ENABLED`, `ACH_PAYMENTS_ENABLED`).
- **Progressive tiers** (`PaymentTierService`, GBP-equiv per transaction, env `PAYMENT_TIER_OPEN_MAX`=250 / `PAYMENT_TIER_CARD_MAX`=1000): ≤250 all methods; 250–1000 bank recommended, card only if buyer passes risk checks (`BlockedPayment` recent 90d + open `Dispute` by email) — soft "use bank" prompt, never a hard block; >1000 bank required, card fallback = forced 3DS. Unconvertible currency → fails closed to bank-required.
- **Resolver:** every one-off buy controller (Shop `buyShopItem`, Task `purchase`, Wish `wishItemSubscribe` onetime, PiggyPot `contributePayment`, Tip `tipToJar`) calls `App\Services\CheckoutMethodResolver::resolve(requestedMethod, listing pref, price, currency, buyer, guestEmail, connectedAccountId)` → `{fee_profile, payment_method_types, force_3ds}` or soft refusal. Card capability check skipped on bank path; bank capability via `StripeControl::activeBankMethodTypes()` (fails open like the card check).
- **Recurring stays card-only** (Bills/Memberships/recurring wish) — bank is one-off only.
- **Per-listing preference:** `payment_methods_accepted` (`card|bank|both`, default `both`) on `shops`/`tasks`/`wish_items`/`piggy_pots`/`tip_goals`; payment rows record `fee_profile` (`shop_payments`, `task_purchases`, `piggy_pot_contributions`, `tip_goals_payments`, `stripe_payment_details`). Migration `2026_07_13_000000`. **Creator-facing selector intentionally removed (14 July 2026 decision — every listing accepts both by default);** backend/resolver still honour the column and `Components/PaymentMethodsAcceptedField.jsx` is kept unwired for easy re-enable.
- **Settlement gating (SEPA/ACH are async):** `checkout.session.completed` with `payment_status='unpaid'` → webhook marks risk-ledger Payment `processing` and defers ALL fulfilment; `checkout.session.async_payment_succeeded` re-runs `handleCheckoutSessionCompleted` (processors are idempotent) + flips Shop/Tip/Task/Pot rows; `async_payment_failed` marks them failed. Redirect success handlers gate on `fee_profile==='bank' && !paid` → "processing" message, **fail closed** on Stripe API errors (never fulfil unconfirmed bank money). Pay by Bank (GBP) settles near-instantly — normal flow.
- **API:** `POST /payments/price-preview` (`payments.price-preview`, public, throttle 60/min) → `{prices:{card,bank,saving}, rules}`. **Non-binding and amount-only** — it takes NO buyer email and runs NO buyer risk lookup (that would let an unauthenticated caller enumerate blocked/disputed emails, and would add DB queries to a public endpoint); authoritative enforcement is `CheckoutMethodResolver` at buy time. Bank capability checks **fail closed** (`StripeControl::activeBankMethodTypes` returns `[]` on a Stripe API error → card path) so a transient outage can't offer a method the creator's account doesn't support.
- **Dev-only route:** `GET /dev/refresh-my-dates` (back-dates the caller's own content, clears `content_posting_paused_at`) is **excluded from production** in `routes/web.php` and `abort(404)`s there — it would otherwise let any authenticated creator self-bypass the posting-cadence pause and creator-activity payment gate via a plain GET (also CSRF-reachable). Supporter UI: `Components/PaymentMethodSelector.jsx` (dual price + tilted "Save £X" sticker, pressed-shadow selection) wired on ALL one-off checkout surfaces: shop `BuyShopItem.jsx`, `Tasks/Show.jsx`, wish `cart/SubCheckout.jsx` (onetime only), `PiggyPots/PiggyPotWidget.jsx`, `TipJar/TipInner.jsx`, cart `cart/UserCarts.jsx`. Cart basket flow (`CheckoutController::createCheckout`) is bank-wired too (basket-total tier resolution; the `StripeController` cart methods are unrouted legacy). Checkout redesign: shared `Components/Checkout/SummaryReceipt.jsx` (ticket-style receipt + `PayButton` + `SectionLabel`) used by `bills/BillCheckout.jsx` + `membership/MemberCheckout.jsx` (receipt-rail layout, sticky right column).
- **`fee_profile` is recorded end-to-end** (mode of payment per transaction): payment rows (`shop_payments`, `task_purchases`, `piggy_pot_contributions`, `tip_goals_payments`, `stripe_payment_details`, `wish_item_subscriptions` — migration `2026_07_13_000001`) AND the ledger (`financial_transactions.fee_profile`, migration `2026_07_13_000002`, NULL = card). Every resync/recompute path (`SyncFinancialTransactions` all sections, webhook FT syncs, `CheckoutMailToUser` fallback) passes the stored profile to `calculateStripeDirectChargeFlow` — never recompute a bank row with card rates. Admin app mirrors profiles in its own `config/payments.php`; `AdminFinanceDashboardController::computeRevenue` groups FTs by `fee_profile` and `DashboardService::getPlatformFeeRevenue` joins items→details per profile. **Risk-engine spend windows count `succeeded/review_hold/processing`** (bank in-flight counts; abandoned `initiated` checkouts don't — `IdentityRollupService`).
- **Async fulfilment has a session_id fallback (belt & braces):** `handleAsyncPaymentSucceeded` first routes via session metadata, then — if `type`/`deliverable_type` is absent — calls `completeBySessionLookup($session)`, which finds the payment row by `session_id` (pot → tip → shop → task) and runs that processor directly. Without it, a session created before session-level metadata existed settles and is **silently dropped** (event delivers 200, but no deliverable/notification/email). Recovery tool for anything already stuck: **`php artisan payments:reconcile {cs_...} [--dry-run]`** — pulls the live session, fulfils only when Stripe reports `payment_status=paid`, idempotent.
- **Bank async completion needs SESSION-level metadata + matching `type`** (critical — only bites bank/SEPA/ACH, card completes via redirect handler): the webhook reads `$event->data->object->metadata` (**session-level**) to route `checkout.session.async_payment_succeeded` to the right processor. Pot/Tip/one-time-Wish checkouts previously set metadata only under `payment_intent_data.metadata` → session-level was empty → webhook couldn't route the delayed bank settlement → payment stuck `processing`, no deliverable, no notification/mail. Fix: pot (`PiggyPotPaymentController`), tip (`tipToJar`), one-time wish (`wishItemSubscribe`) now also set top-level `'metadata' => $paymentIntentData['metadata']` on the session payload (shop/task already did). ALSO: `Helpers::buildStripeMetadata('piggy_pot')` tags `type='piggy_pot_contribution'`, but the webhook checked `=== 'piggy_pot'` — now accepts both. When adding a new one-off checkout, always set session-level metadata whose `type`/`deliverable_type` matches the webhook routing in `handleCheckoutSessionCompleted`, or bank payments silently never fulfil.
- **Status columns must allow `processing`** (bank/SEPA/ACH in-flight): migration `2026_07_13_000003` widened `piggy_pot_contributions.status` (was a tight `enum('pending','paid','refunded','disputed')` → `varchar(20)`) and added `processing` to the `payments.status` enum — a bank pot payment set `status='processing'` and MySQL threw "Data truncated for column 'status'", surfacing to the buyer as "Something went wrong while verifying the payment." The migration is **MySQL-guarded** (`DB::getDriverName() !== 'mysql'` early-return) so the raw `ALTER … MODIFY` doesn't break the sqlite test DB. `shop_payments`/`tip_goals_payments`/`task_purchases`/`wish_item_subscriptions` status columns are already varchar and fine.
- New transactions only; historical rows keep `fee_profile` NULL (= card pricing).

## One ledger, four surfaces — `LedgerRules` (4 Aug 2026, spennypiggy.co)

`App\Services\Ledger\LedgerRules` is the ONE definition of how a ledger row is read:
is this money earned, is the item fulfilled, what did the supporter pay, what did the
creator keep. Before it, the earnings dashboard, Support History (`/history`), the
Purchase Hub (`/my-purchases`) and the payout engine each had their own copy and
**disagreed about the same pot of money**.

- 🚨 **The fulfilment gate mirrors `PayoutService` deliberately** — the payout engine is
  what actually moves the money, so anything a creator is SHOWN as earned must be
  something the payout run agrees to pay. `EARNED_TASK_STATUSES` is the shared list.
- ⚠️ **An INSTANT task is fulfilled on payment; only a TIMED task waits for acceptance.**
  `FinancialService::getSummary` and the `/history` feed excluded EVERY unfinished task
  while `PayoutService` excluded only timed ones — so an instant task was **paid out
  without ever appearing on the creator's own dashboard**.
- ⚠️ **`/history` had NO physical-shop-delivered gate at all** (the dashboard and the
  payout engine both did), so a creator's "Received" total was higher than both. Three
  numbers, one pot of money.
- ⚠️ **An ORPHANED task ledger row still counts.** The payout engine pays it (its gate
  can only exclude a task it can find), so excluding it here would show the creator LESS
  than they are paid — the same bug in the other direction. `finance:audit-ledger`
  reports the orphan instead.
- 🚨 **`gross_amount` is the SUPPORTER's charge; `net + vat` is the CREATOR's gross.**
  Two different numbers, repeatedly confused. `buyerPaid()` / `creatorGross()` /
  `creatorNet()` / `fees()` are the only readers. `buyerPaid()` rebuilds the charge from
  the row's own parts when a legacy row recorded no gross, rather than reporting a real
  purchase as £0 — the spend-limit windows in `ProfileController` select the fallback
  columns for exactly this reason.
- **`state()` + `STATE_LABELS`** give one word for what is happening to the money —
  `settled` · `awaiting_delivery` · `awaiting_settlement` · `on_hold` · `refunded` ·
  `disputed` · `failed`. Raw DB statuses used to reach the reader as jargon
  (`review_hold`), and "delivered but not accepted" vs "waiting on the bank" rendered
  identically as nothing.
- **`breakdown()` is rendered by all three transaction surfaces** from the same payload
  (`Components/Transactions/LedgerBreakdown.jsx`), so a creator and their supporter can
  never be shown different arithmetic for the same payment. ⚠️ **A supporter's copy is
  `Arr::except`'d of the fee split, reserve and payout id** — the payload omits them and
  the component guards again.
- ⚠️ **`fulfilmentMap(Collection)` is the batched form and is what callers must use.**
  `isFulfilled()` issues its own queries and will N+1 in a loop.
- ⚠️ **`CreatorFinancialController::attachLedgerBreakdown()` MUST run before the row
  mapping**, which overwrites `gross_amount` with the creator's gross — the breakdown
  needs the supporter's charged figure.

### Purchase Hub reads the ledger, not the seven payment tables

`GifterHubController::buildSpendSummary()` summed `total_paid ?: amount` straight off
each payment row while Support History summed the ledger — two implementations of "what
this person has spent". It now reads `FinancialTransaction`.

- **Refunded and in-flight money is reported SEPARATELY, never netted off the total**
  (`refunded_total` / `pending_total`). A blended figure answers neither "what have I
  spent" nor "what came back", and a refunded purchase used to vanish from this page
  entirely while still being listed in Support History.
- ⚠️ **`unsyncedSpend()` still counts purchases the ledger has no row for yet.**
  `finance:sync-transactions` reconciles every 30 minutes, so a payment whose webhook did
  not write a ledger row would otherwise be missing from the buyer's own record — their
  money left their account, and "where is my purchase?" is the worst question this page
  can provoke. Reported as `awaiting_ledger_count`.

### Commands

- **`finance:audit-ledger`** (`--days` `--user` `--sample` `--json`, scheduled **daily
  06:45**) — read-only reconciliation: settled payments with no ledger row, rows where
  the supporter is recorded paying less than the creator earned, and ledger rows whose
  payment record is gone. A payment that never produced a ledger row is money the creator
  is not shown, not paid, and cannot ask about — **and nothing errors**. Exits non-zero
  when it finds anything.
- **`finance:backfill-ledger-gross`** (`--dry-run` `--limit` `--user`) — repairs rows the
  orphan-checkout recovery path priced from the metadata's `tax` key with `stripe_fee`
  hardcoded to 0. ⚠️ **Only supporter-facing and fee columns are rewritten** —
  `net_amount`, `reserve_amount` and `reserve_status` drive payouts and are never touched.
  That sync branch (`SyncFinancialTransactions::syncOrphanCheckouts`) now prices through
  `calculateStripeDirectChargeFlow` like the main wish path.

⚠️ **`shops` was created with six columns and grew ~17 more that no migration declared**
(migration `2026_08_04_000000`, guarded, empty `down()`). Every deployed database has
them, so nothing failed in production — but a database built from these migrations came
out with a `shops` table the app cannot insert into, which is why the shop paths had no
feature test: they could not run. Same class of gap as `users.role` and
`users.cover_approved`. **`shops.status` is deliberately still absent** — several call
sites guard on `Schema::hasColumn('shops','status')` precisely because it is.

Tests: `tests/Feature/LedgerConsistencyTest.php` (14) and
`tests/Feature/LedgerMaintenanceCommandsTest.php` (8).

## Customer-facing risk messaging — `App\Support\RiskMessages` (10 Aug 2026, spennypiggy.co)

Client brief "Customer-Facing Messaging Brief" (9 Aug 2026, `docs/client/9 AUg/`), 18 message
states. **`App\Support\RiskMessages` is the ONE definition of every customer-facing risk /
account-state string.** The wording used to live in ~18 places — 14 inline in
`RiskEngineService`, plus hardcoded copies across the checkout JSX — and had already drifted
("Guest checkout is disabled" vs "Guest checkout is currently disabled" vs "Guest checkout is
currently disabled. Please log in to continue."). Copy is the client's, **verbatim**, emoji
included.

**THREE RULES, enforced by `tests/Feature/RiskMessagesGoldenRulesTest.php` (8 tests, 596
assertions) rather than by review:**

1. 🚨 **Never reveal a threshold to a supporter.** No cooldown minutes, no spend headroom, no
   attempt count. Three strings were live violations: `"Please wait 15 minute(s)"`, `"You can
   support 1 new creator per day for safety."` and `"Larger payments more than £50 need to
   login."` — the last repeated in **11 JSX files**. The test scans every supporter string for
   any digit; `SUPPORTER_DIGIT_ALLOWLIST` holds the single exception (`£1`, the card
   verification charge — a disclosed price, not a line to stay under).
2. **Never imply the supporter is a criminal.** `BANNED_SUPPORTER_WORDS` — fraud / suspicious /
   flagged / violation / risk / denied / blocked / security reasons / throttle / freeze /
   elevated. The internal state names must never surface. (Creator-facing copy may say "fraud
   warning" — it is what the card issuer told us and softening it costs them the window to act.)
3. **Always give a next step.** A dead end is what sends someone to their bank instead of the
   chat, which is a chargeback the platform caused itself.

- 🚨 **AUDIENCE IS RESOLVED SERVER-SIDE, never branched in JSX.** A guest has no `/history`, no
  dashboard and no account. `RiskMessages::get($key, $audience)` returns a `cta` whose URL is
  already correct for that viewer (`null` for a guest), and `resolveCta()` additionally refuses
  any route not in `GUEST_SAFE_ROUTES` — so handing a guest a link into the authenticated app is
  structurally impossible rather than a rule to remember. Msg 4a/4b is the case the brief calls
  out: the logged-in variant links `/history#limits`, the guest variant shows **no spend figures
  at all** (guest identity is keyed to card fingerprint, device and IP, so a running total on an
  unauthenticated screen is a live readout of remaining headroom).
- **`REASON_CODE_MAP`** maps every engine reason code onto a state; an unmapped code falls back
  to `GENERIC_HOLD`, which still obeys all three rules. The old fallback — `"Payment blocked for
  security reasons."` — broke every one of them at once. A test asserts all 16 emitted codes map
  to a real state.
- **`HIGH_VALUE_GUEST` is a SEPARATE state from `GUEST_CHECKOUT_DISABLED`.** Telling someone
  paying £60 that "guest checkout is switched off for a bit" is untrue — they could pay less
  right now.
- `RiskEngineService` now returns reason codes only and **writes no copy**; `formatResponse()`
  renders through `RiskMessages` and returns `[]` for ALLOW (building a message for a successful
  payment would put refusal copy in its payload). `RiskEnforcement`, `Api/RiskController`,
  `Helpers::guestCheckoutRestriction`, `VerificationService` (OTP errors) and
  `CreatorAvailabilityMessageService` all read the same source.
- **Frontend:** `Components/Risk/RiskMessage.jsx` renders a server `ui` object;
  `constants/riskMessages.js` mirrors ONLY the two guest gates decided in the browser. ⚠️ Do not
  add states there — a message the server decides belongs in the PHP, or the two copies drift.
- 🚨 **`Components/Risk/StepUpModal.jsx` — ANY checkout wired to `RiskEnforcement` must render
  it.** A screen that can receive STEP_UP and cannot show the code field is a dead end: the
  supporter is told the payment failed while holding a valid code, and the sale is lost. ⚠️ The
  response key is **`step_up_required`, not `step_up`** — `PiggyPotWidget` checked the latter,
  which the trait has never sent, and that was harmless only while the pot's enforcement was
  broken. Repairing the bypass made STEP_UP reachable there (a contribution over the step-up
  threshold, or several rapid payments, both well inside the £4.99–£500 pot range), so the
  widget was wired at the same time. The modal renders OUTSIDE the form so backing out of it
  keeps the amount, email and accepted terms. Seven other checkouts still carry their own copy
  of this flow — migrate them onto the shared one rather than writing a ninth.
- ⚠️ **`CreatorAvailabilityMessageService` no longer explains the creator's state to a
  supporter.** It said "due to an account status issue" / "this creator's Wishlist plan is not
  active", which a supporter can do nothing with and which discloses the creator's billing
  situation to anyone who opens their page. Branches resolve to one honest answer ("this
  creator's page is paused right now"); the creator still gets the specific reason on their
  own dashboard.
  - ⚠️ **ONE exception (14 Aug 2026, client direction after an Intercom ticket): the POSTING
    gate names its reason.** `CreatorActivityService` status `insufficient_content` →
    `RiskMessages::CREATOR_CONTENT_PAUSED` ("they've got some new posts to publish before
    purchases can go through again… worth giving them a nudge"). It is the only pause reason
    that discloses nothing private — the creator's feed is public either way — and the only
    one a supporter can act on. Subscription and Stripe branches are unchanged.
  - ⚠️ **`CONTENT_GATE_STATUSES` is an ALLOW-LIST, never `! $activityCheck['eligible']`.** Any
    future failing status from that service would otherwise silently start telling supporters
    a creator owes posts when it means something else. Unrecognised → generic message.
  - ⚠️ **No count reaches the supporter** (rule 1). `CREATOR_CONTENT_PAUSED` (supporter) and
    `CREATOR_POSTING_PAUSED` (creator, carries `:required` / `:window`) are two states and
    must stay two — the golden-rules test fails the moment a digit lands in the supporter one.
  - **No call site changed.** All ~30 checkout gates already say which check failed by which
    argument they pass (`supporterMessage(null, $activityCheck)` is the posting gate), so the
    branch lives entirely in the service.
  - Tests: `tests/Feature/CreatorAvailabilityMessageTest.php` (6).
- 🚨 **Six checkout screens hand-wrote their own "creator can't be paid" copy, and two of them
  printed `(Card Payments capability missing)`** — an internal Stripe capability name, on a
  buyer's screen, about somebody else's account (Tasks/Show, cart/UserCarts panels; plus
  toasts in shop/BuyShopItem, TipJar/TipInner ×2, cart/UserCarts). All six now render
  `RISK_MESSAGES.CREATOR_UNAVAILABLE` from `constants/riskMessages.js`, byte-identical to the
  PHP `CREATOR_SUBSCRIPTION_INACTIVE` supporter copy, via `riskMessageBody()` /
  `riskMessageTitle()`.
  - ⚠️ **That state is allowed in the JS mirror because it is BROWSER-decided** — every
    checkout already has a `card_capabilities` prop and refuses before it posts. The
    posting-gate message is NOT: only the server knows whether a creator is behind on posts,
    so `CREATOR_CONTENT_PAUSED` stays PHP-only. The "do not add states here" rule is about
    server-decided messages.
- **Gifter limits: `/history#limits`.** The spend-vs-limit panel already existed and nothing
  linked to it. It now carries the anchor, a per-window progress bar, and the plain-language
  explanation that each limit lifts on its own.
- **Creator msg 13 (posting cadence) was already richer than the brief** —
  `PostingCadenceService` returns `headline` / `consequence` / `checklist` with CTAs and
  `pause_in_days`, and `warnAtRisk()` already sends bell + push + email with a 3-day notice
  period. Left alone deliberately.

### 🚨 Three enforcement bugs found and fixed in the same pass

- 🚨 **Piggy Pot bypassed the risk engine entirely.** `PiggyPotPaymentController` called
  `evaluate()` and then `if ($riskData instanceof JsonResponse) { return $riskData; }` —
  `evaluate()` **always returns an array**, so every BLOCK / COOLDOWN / STEP_UP was silently
  discarded and checkout carried on. Its context also used the keys
  `creator`/`supporter`/`identity`/`type` instead of
  `creator_id`/`email`/`ip`/`device_id`/`is_guest`, so `creator_id` was null (new-creator and
  cross-creator rules dead), a brand-new orphan `RiskIdentity` was resolved from an empty
  context on every call (rollups always zero), and `risk_identity_id` on the ledger row was
  always null. It now uses the shared `RiskEnforcement` trait like the other eight checkouts —
  which also applies the guest-checkout gate it never called. ⚠️ Consequence: a GUEST
  contributing above the high-value threshold is now asked to log in here, exactly as on the
  wish flows. Guarded by `is_array()`, not `instanceof`, so a future return-type change cannot
  reopen the same hole.
- 🚨 **`RiskIdentity.is_guest` was a one-way latch.** `RiskIdentityService` only ever moved it
  true → false, so anyone who signed in once and later signed out kept `is_guest = false`
  permanently — and the guest block reads exactly that column, so that visitor evaded it for
  good. It now follows the current request in both directions; an absent `is_guest` leaves the
  stored value alone. (Mutation-checked: restoring the latch fails the test.)
- 🚨 **`GET /api/risk/limits` published every threshold, unauthenticated.** It returned
  `max_spend_1h`/`24h`/`7d`, `step_up_threshold`, `review_hold_threshold` and
  `cooldown_minutes` to anyone. A **guest now receives `{guest_allowed}` only** — the sole field
  the frontend reads for them; a signed-in supporter still gets their own limits, which they are
  shown on `/history` by design.
- ⚠️ **`RiskEnforcement` multiplied every amount by 100** to reach minor units, so a
  zero-decimal currency (JPY, KRW) was inflated a hundredfold and put over every spend cap.
  Now via `Helpers::isZeroDecimalCurrency()` — this affected all nine checkouts, not just pots.

Tests: `tests/Feature/RiskMessagesGoldenRulesTest.php` (8) and
`tests/Feature/RiskEngineEnforcementTest.php` (7 — the engine never returning a response object,
Piggy Pot using the shared trait, a refusal carrying its copy, ALLOW carrying none, the
`is_guest` round trip, and the limits endpoint withholding thresholds from a guest).

**Not done — phase 2, deliberately deferred:** no email is sent when a payment is blocked or
held (on-screen only, so a guest who navigates away has nothing — client questions 5 and 9);
guest step-up codes still have no "wrong email?" recovery path (question 8); creator states
14–18 (`CREATOR_ACCOUNT_ISSUE`, `CREATOR_RESERVE_APPLIED`, `CREATOR_PAYOUT_HELD`,
`CREATOR_FRAUD_WARNING`, `CREATOR_REFERRAL_BONUS_READY`) are **defined in `RiskMessages` but
their existing notification surfaces still carry their own copy**; SMS step-up does not exist.

## The basket is an accordion, one creator at a time (5 Aug 2026, spennypiggy.co)

`/cart` groups by creator because checkout is **one Stripe session per creator**
(`/create-checkout-session/{ownerId}/…`) — a basket spanning three creators is three
payments and cannot be merged. `Cart.jsx` used to render a full `UserCarts` per group.

- ⚠️ **Only the OPEN basket mounts its checkout — collapsed ones render no form at all,
  not a hidden one.** Every basket expanded meant a Turnstile widget, a
  `/payments/price-preview` poll, an `/api/risk/limits` call and a full set of buyer
  fields **per creator** on one screen. A mounted-but-invisible form still boots its
  Cloudflare widget for a creator nobody is paying. Verified live: 3 creators → 1 form,
  1 email input, 1 panel.
- **`UserCarts` takes `creatorKey` / `collapsible` / `expanded` / `onToggle` / `onSummary`.**
  `collapsible` is false for a single-creator basket, which then has no disclosure control
  at all — a triangle on the only section on the page cannot do anything useful.
- 🚨 **The header total CONVERTS each basket before adding it up.** `formatMultiPrice`
  always renders in the viewer's `global_currency`, so grouping by CHARGE currency and
  printing each group put two figures **in the same symbol** side by side — read as one
  total the buyer is expected to add themselves. The per-currency-never-summed rule
  applies to figures printed in their own currency, which these are not. A missing rate
  falls back to the same treatment each row already takes; the header and the rows under
  it must never disagree. Verified: £1,269.28 + £97.36 + £490.06 = the £1,856.70 shown.
- **The basket total is reported UP by each `UserCarts`, never recomputed in `Cart.jsx`** —
  a second copy of the gross-up would drift from what the buyer is charged.
- **The amount is on the pay button** (`Checkout £24.40`): with several baskets on one
  page a bare "Checkout" says neither which creator is about to be paid nor how much.
- **No offset shadows on this page** (client direction, 5 Aug 2026) — `border-2 border-black`
  and the `rounded-box` / `rounded-box-sm` tokens carry the frame. The house `main-button`
  / `PayButton` shadows are untouched, since they are shared with every other checkout.
- PWA: `dvh` on the empty state, `env(safe-area-inset-bottom)` added to the bottom-nav
  clearance, 44px+ on the remove-item button and the accordion rows, primary action above
  "Clear" on mobile (`flex-col-reverse`). Verified at 390px: no horizontal overflow.
- ⚠️ **`OrderContextCard` was removed from the basket** — on the accordion it repeated the
  creator's avatar and name a third time and titled itself "Your basket" directly under the
  page heading of the same name. Its "what you get" list is kept as a plain panel.
- ⚠️ **The quantity stepper is hidden by design**, so a row prices ONE unit while the total
  covers all of them. `CartItem` prints `× N` when quantity > 1, or the row reads as an
  arithmetic error.

## Shop module (spennypiggy.co) — hardening pass (23 July 2026)

`Auth\ShopsController` + `Shop` model + shop React pages. Audited end-to-end; the load-bearing rules below are now enforced — do not regress them.

- **The paid deliverable is hidden by default.** `Shop::$hidden` includes `reward_file`, `success_page_value`, `price_id` (and `getRewardFileUrlAttribute` is no longer auto-appended). They previously serialised on every public listing → anyone seeing a card got the digital content free. Reveal ONLY to the entitled viewer: `Shop::withDeliverable()` (owner-known), or `Shop::entitledFor($userId, $sessionId)` which unlocks a logged-in user's own paid rows (user_id-bound) or a guest's own checkout `session_id` — a bare session_id never overrides the user_id scope. `singleShopList` calls `entitledFor(Auth::id(), $session_id)`; owner list surfaces (`shopList`, `UserProfileService` shop methods) call `withDeliverable()` only for the owner; order screens (`ordersList`) call `withDeliverable()` because the buyer paid.
- **`slot_limitation` IS remaining stock** (server decrements per sale) — every surface treats it that way now (`Item.jsx`, `ShopCard.jsx`, `MyShopProducts.jsx` show `sold/(sold+remaining)`, "Only N left", "Sold out"). `successPayment` decrements with a **conditional atomic UPDATE** (`where slot_limitation >= qty`) so two buyers racing the last unit can't drive it negative; an oversold order still fulfils (money taken) but notifies the creator. Refund webhook **restores** stock (`increment`) and flips the linked `Deliverable` to `refunded`.
- **`buyShopItem` validation:** quantity is clamped `>= 1` (and to 1 when `quantity_allow` is off) — `?quantity=0` used to make the order free; only `approved=1 status=1 is_suspended=0` items are buyable. `addShopItems`/`updateShopItems` require `price` (was `sometimes`, an omitted price bypassed the £4.99–£10,000 rule and left a £0 listing) and reject a `shipping_profile_id` not owned by the creator. `updateShopItems` re-runs the SFW gate on changed image/reward media (edit was a moderation bypass).
- **SFW gate now also scans the reward file** (`moderateRewardFile`), not just the shop-front thumbnail.
- **IDOR fixes:** `updateFulfillment` now requires the caller to own the listing (was open to any signed-in user); `cancelPayment` only flips its own buyer's `pending`/`unpaid` row and never rolls back a `paid`/`processing` order (public cancel URL was a write for anyone); `saveShippingProfile` rejects another user's `id` before the `updateOrCreate` duplicate-key 500. `successPayment`'s catch now sits OUTSIDE the DB transaction so a mid-flight failure rolls back instead of committing a half-applied order.
- **Destructive routes are POST** (`delete-shop`, `deactivate-shop`) — were state-changing GETs (no CSRF, fireable from an `<img>`). Frontend calls `axios.post`.
- **Reminder command** (`app:send-shop-order-reminder-email`) filters `deliverable_type='shipping'` + not `needs_admin_review` — a high-value DIGITAL item held for admin review was being nagged to "ship".
- **N+1 removed:** shop list endpoints eager-load `category` + `withCount('paidPayments')` (`total_sold`/`real_category` no longer fire a query per row); `ordersList` batches the per-order `Deliverable`/`User` lookups.
- ⚠️ **`shops.image` is in the model's `$hidden` list — the frontend only ever sees the appended `perma_link`.** Any JS reading `item.image` gets `undefined`. This blocked editing outright: `AddItem.jsx`'s step-1 guard allowed an existing thumbnail via `isEdit && item?.image`, which was never true, so a listing that already had a thumbnail — rendered by the form immediately above the check — was refused with "Please add a thumbnail image" and could not be saved. Read `perma_link` (or `image_url`). The controller already falls back to `$shop->image` when the request omits it, so not re-uploading never wipes the picture.
- **Frontend structural fix:** `AddItem.jsx`'s form was a component declared inside the parent (`<AddForm/>`) → remounted and wiped all input on any parent re-render; inlined to module body. Content-compliant seed copy in `AddShop.jsx` (no Instagram/Zoom brand names, no "coffee"); fee copy corrected everywhere (no hardcoded 19/20%); UI moved onto `rounded-box`/`rounded-box-sm`, `min-h-dvh`, 44px touch targets, bottom-nav padding, skeletons + explicit error states.

## Creator announcement card (29 July 2026, spennypiggy.co)

The "{name} is now on Spenny Piggy" image a creator posts to their own socials. Built client-side by `generateCardAndUpload` in `Pages/account/EditProfile.jsx` (html2canvas, authored at 600 × 337.5 and captured at `scale: 2` → a 1200 × 675 PNG), uploaded to `users.social_image`. Distinct from the Open Graph image — that is the profile's `og:image`; this one is a deliberate share asset.

- ⚠️ **`unicode-range: U+0020-#FF007F` in the font-generation scripts.** A search-and-replace of the brand pink (`#FF007F`) landed inside `U+0020-007F` — basic ASCII — in `scripts/optimize-fonts.js` and `scripts/subset-fonts-basic.js`. Running either emits `@font-face` rules whose range is invalid, so the face is dropped for all ASCII and the text falls back to a system serif. Both scripts are fixed; `resources/css/theme.css` and `fonts-optimized.css` were already correct in git (the corruption only ever existed in an uncommitted working copy, presumably from a past script run). **This was NOT the cause of the missing `.` and `:` in creators' cards** — see the next bullet.
- ⚠️ **Punctuation disappearing from the card's URL was never reproduced, and the obvious explanations are ruled out.** Both `gulfs` (`newfont.woff2`) and `CeraGR` contain `.`/`:`/`/` and render them correctly, and html2canvas 1.4.1 rasterises the URL intact at `letter-spacing` of `1px`, `0` and `-0.4px`. The most likely explanation left is display, not code: the old URL was thin white text on pink at 22 px authored, where a period is a couple of pixels and vanishes under feed downscaling and JPEG compression. The redesign sidesteps it — near-black bold on a solid white bar. **If it recurs on the new card, the cause is still unknown; do not assume the font stack.**
- **The card carries no gift imagery.** `resources/assets/social-bg.png` (gift boxes, a money bag, a sparkle) is no longer used; the arc-and-halftone pattern is drawn with plain divs and a `radial-gradient`, which costs nothing to ship. This is the most-shared asset the platform produces, so the content-first rules apply to it in full.
- **Layout is relative, not hardcoded offsets.** The old template pinned "is now on" at `top:180px; left:210px` and the logo at `top:190px; left:310px`, so nothing could move without moving everything.
- 🚨 **The rows are `display:table`, NOT flex — do not "modernise" them back.** A flex child sized by `flex:1` inside a `gap` row is mis-placed by html2canvas: measured on the exported PNG the creator's name was drawn **~53px LEFT of its column and overlapped the avatar**, while the category pill directly beneath it — same parent, same box — landed correctly. Both the avatar/name row and the VISIT bar are now `display:table` + `table-layout:fixed` with explicit cell widths, which rasterises 1:1. ⚠️ This **contradicts the "flex and `gap` render fine" line below**, which was verified on a simpler row without `flex:1`; the table form is the live rule. ⚠️ `overflow:hidden` on a `table-cell` is undefined per CSS — clip with an inner block if you need it.
- ⚠️ **`line-height` on the name must stay ≥ 1** (`NAME_LINE_HEIGHT`, currently 1.02). `gulfs` is a heavy display face whose ink runs past its line box, so at `0.9` the name's descenders ate the 10px gap and sat on top of the category pill in the raster. The fitter's two-line budget reads the same two constants (`NAME_FONT_SIZE` × `NAME_LINE_HEIGHT`) — it was a hardcoded `2 * 43 * 0.9`, which silently measures against a line box the card no longer uses the moment either value changes.
- ⚠️ **A card change you cannot see in the app is a STALE SERVICE WORKER, not a broken fix — check that before touching the markup again.** `public/service-worker.js` caches the hashed JS chunks, and `npm run build` does **not** rebuild it (`build:production` = `build` + `sw:build`), so the browser keeps serving the old `EditProfile` chunk and every regenerate reproduces the bug that was just fixed. Unregister the worker + clear site data, or run `build:production`. Two rounds of this were spent re-fixing correct code.
- 🚨 **The CSS gap and the OPTICAL gap are different numbers, and only the optical one is the design.** `gulfs` ink runs ~12px past the bottom of its own line box at 43px, so the 14px `margin-top` under the name rendered as **2px of daylight** and the pill read as glued to the letters. It is `26px` for ~14px visible. Measured sweep: margin 14 → 2px optical · 22 → 10 · **26 → 14** · 34 → 22. Never tune this by reading the CSS value; measure ink-bottom to pill-top **on the canvas**.
- 🚨 **NOTHING on this card may centre text with `vertical-align: middle`.** html2canvas draws a text run near the **bottom of its line box** instead of on the browser's baseline, and it does so whichever way the box is centred — `vertical-align: middle` on a `table-cell` and an explicit `line-height` equal to the box height rendered identically wrong. Measured: the badge label sat **6.75px below** the pill's centre and the URL **9.5px below** the bar's centre. Every such box therefore carries an explicit `height` and a deliberately **shorter** `line-height` picked so the text lands centred **in the PNG**: pill `height:25px/line-height:13px` (dot `margin-bottom:-5px`, `vertical-align:baseline`), URL cell `44px/24px`, VISIT chip `44px/32px`, logo cell centred with plain padding. The offset moves ~0.5px per 1px of line-height — that is how the values were derived. ⚠️ **The live DOM now looks slightly wrong and the PNG looks right, deliberately.** The element is generated off-screen and discarded; only the PNG is ever seen. Verified good state (authored px from box centre): pill label 0.25 · dot vs label −0.25 · URL −0.25 · VISIT −0.25.
- 🚨 **A verification harness MUST load the app's compiled stylesheet (`public/build/css/app-*.css`), served so `/build/assets/*.woff2` resolves — otherwise it lies.** A harness with its own `@font-face` and no app CSS rendered the card *clean* while the app rendered it broken, and cost three rounds of "fixed / still broken". Two things it silently changes: Tailwind preflight's `box-sizing: border-box` (the avatar ring is 108px total in the app, 116px without it) and which hashed `newfont.woff2` variant `gulfs` actually resolves to. Serve **`public/`** as the web root, copy `html2canvas.min.js` and a placeholder image in beside the harness, then read every number off the **canvas** — the DOM box metrics were correct in every failing round and told us nothing.
- **The category pill shows the creator's first TWO categories, not three.** Three joined with " · " ran the pill to the card's right edge and turned the 10px uppercase text into a cramped strip. The creator is not told only two appear (see Known gaps).
- **The name shrinks to fit, it never truncates or breaks mid-word.** `word-break:break-all` in a 200 px box turned "Alexandria Constantinopolous" into "ALEXANDRI / A / CONSTANTI / NOPOLOUS". The fitter steps the size down from 43 px until the name fits two lines, and it runs **after `document.fonts.ready`** — measuring before `gulfs` loads sizes against fallback metrics.
- ⚠️ **Keep the markup inside html2canvas' supported CSS, and verify by rasterising — not by looking at the DOM in a browser.** No `-webkit-line-clamp`, no `color-mix()`, no multi-stop radial gradients. Verified against html2canvas 1.4.1: flex, `gap`, `linear-gradient`, `text-shadow`, `border-radius` + `overflow:hidden` and absolutely-positioned circles all render. **`box-shadow` does not render at all**, and the fine `radial-gradient` halftone layer does not either, so the exported PNG is flatter than the same markup looks in Chrome. Adjacent cells that share a background also show a hairline seam in the raster.
- The link bar is full width: black `VISIT` chip, the address, and the logo closing the right end. Interpolated values go through an HTML-escaper — the name is user input being written into an `innerHTML` string.
- ⚠️ **`users.social_image` is ALSO first in the profile's `og:image` chain** (`AuthenticatedSessionController::setSeoMetaTags`), so this card doubles as the link preview for every creator who has one — a 16:9 poster with a printed URL, centre-cropped to 1200 × 630. Changing the card changes what every shared profile link looks like; the two are not independent.
- **Known gaps:** the card is only regenerated from `generateSocialImage`, which requires an avatar. A creator who renames themselves or edits their categories keeps the old card, and existing users keep the gift-box card until they press the button. Generating also does **not** persist it — `social_image` is only uploaded when the profile form is submitted (`ProfileController` line ~276), so "Generate Banner" followed by navigating away saves nothing.

## Sign in with Google (1 Aug 2026, spennypiggy.co)

Full write-up: `docs/implementations/GOOGLE_SIGN_IN_IMPLEMENTATION.md` (setup steps, gate table, known limits). The rules below are the load-bearing ones.

`laravel/socialite` + `Auth\GoogleController` (`GET /auth/google`, `GET /auth/google/callback`, both `throttle:20,1`). Button on register and login, rendered only when `GOOGLE_CLIENT_ID` **and** `GOOGLE_CLIENT_SECRET` are set (`config/services.google.*`; `redirect` is built from `APP_URL` so it matches the console entry exactly). Scopes are left at Socialite's defaults — openid + profile + email, all non-sensitive, so the app needs no Google verification review. **Adding a scope beyond those three changes that.**

- 🚨 **`GoogleController` NEVER creates a user.** A new person's verified profile goes into the session and they are sent to the ordinary register screen; the account is created by `RegisteredUserController::store()`, the same method the password form posts to. `store()` runs eight gates before it writes a row (platform freeze, device cookie, accounts-per-IP, blocked words, `role` in [0,1], supporter country, creator receipts ack, email domain) — a second create path would have to repeat all eight, and the day one was added to `store()` and forgotten here the Google button would become the documented way around a block.
- 🚨 **The email is read from the SESSION, never the request.** The session copy was written only after Google reported it verified. Trusting the posted copy would let anyone holding a Google session claim someone else's address *and* have it stamped `email_verified_at`. Covered by a test.
- 🚨 **`emailIsVerified()` fails closed.** Absent or unrecognised → not verified. A Workspace admin can mint any mailbox on a domain they control, so an unchecked email match is an account-takeover hole.
- **Only two gates are skipped, both deliberately:** Turnstile (Google is the bot gate, and no widget was ever rendered) and the email-domain allowlist (six providers — enforcing it would refuse every Google Workspace address, and Google has already proved the mailbox receives mail). Everything else runs.
- 🚨 **A 2FA account IS challenged, through a passwordless path — the highest-risk code in this feature.** `verify2FA` cannot re-authenticate a Google user with `Auth::attempt(['email','password'])` because there is no password, so `signIn()` stashes `google_2fa_pending` (`email` + a 15-minute `expires_at`) and the OTP screen completes the login with `Auth::login()` directly. **Three things make that safe and all three must stay:** the session entry is written only after Google verified the address; the posted email must equal the session email; and the OTP is verified against that user's own `tfa_key`. Holding both a real Google session for the address *and* its authenticator means the person genuinely is the account owner. `POST /verify-2fa` keeps `throttle:5,1`, and `POST /auth/google/cancel` clears the pending entry so a closed OTP box cannot trap someone on the login page.
- ⚠️ **Gate order in `signIn()` is load-bearing: trashed → suspended → 2FA.** The suspended check must stay *above* the 2FA branch, or a suspended account would be handed a pending entry and could complete the passwordless login. `verify2FA` itself does **not** check `suspended_account` (pre-existing, and it affects the password path too), so this ordering is the only thing stopping it.
- ⚠️ **Both lookups use `withTrashed()`.** Without it Eloquent hides a soft-deleted row, so the `trashed()` refusal never ran — the person was treated as new, sent to `/register`, and the submit then died on a duplicate email/username. The account is matched on `google_id` first (stable across email changes), falling back to email and back-filling `google_id` on the match.
- **Suspended and soft-deleted accounts are refused** here too, mirroring `AuthenticatedSessionController`.
- ⚠️ **`email_verified_at` is set AFTER `User::create()`, via `forceFill()`.** It is not in the model's `$fillable`, so passing it to `create()` is dropped **in silence** — the Google user was still being sent to the "check your inbox" screen. Deliberately not widened into `$fillable`: a verification stamp must not be mass-assignable. ⚠️ **`tfa_key`, `cover` and `cover_approved` are dropped the same way on every signup** — pre-existing, `tfa_key` is NULL for every user in the database. Tracked in TASKS.
- 🚨 **A `redirect` query parameter is carried across the round trip and is NOT validated** —
  `redirect($context['redirect'])` and `url.intended` both take it straight from the URL, so
  `/auth/google?redirect=https://evil.com` lands the person on `evil.com` immediately after a
  genuine sign-in on the real domain. **Fixed** by `GoogleController::safeRedirect()` — see
  `docs/implementations/GOOGLE_SIGN_IN_IMPLEMENTATION.md` §13. **Any redirect target taken from a
  request must be a same-origin relative path**: reject anything not starting `/`, reject `//`
  (protocol-relative reads as another origin) and reject `/\` (browsers normalise the backslash).
  The same rule applies anywhere else a request-supplied URL is followed.
- **Attribution survives the round trip:** `?ref=`, `?type=` and the utm tags are stashed in the session before redirecting and read back on return. Without it the referring creator is silently never credited.
- **The password column gets a random 48-char hash** (it is NOT NULL). The person can set a real one later through forgot-password, which also gives them a second way in if they lose the Google account.
- **A Google CREATOR skips the `credentials` step; a Google SUPPORTER does not** — that screen also carries **country**, which the server requires for role 0. `stepsFor(role, hasGoogle)` encodes it; dropping the step for everyone made the form pass client-side then fail on a field never shown.
- Tests: `tests/Feature/GoogleSignInTest.php` (13) — the spoofed email, the spent session, role 2, the receipts ack, supporter country, the domain skip *and* that the password path still enforces it.

### ⚠️ 14 `users` columns and 5 `gifter_addresses` columns had no working migration

`migrate:fresh` produced a schema the app could not register a user against — the first insert died on `gender`, then `creator_category`, and so on. **That is why `store()` has never had a feature test: it could not run.**

- `2026_08_01_000100_add_missing_users_columns` adds the fourteen (gender, tfa_key, is_2fa, applicant_id, inspection_id, kyc_verification_status, creator_category, min_surprise_amount, promo_code_id, notification_send, push_noti_enabled, passwordless_login_token, vat_amount_percentage, show_piggy_bank, profile_reject_reason). Types read from the production schema, each `hasColumn`-guarded, `down()` empty — a **no-op on every real environment**. Same class of gap as `users.role` and `users.cover_approved`.
- ⚠️ **`2025_04_22_071226` dropped a column and added five in ONE `Schema::table` closure.** SQLite has no `ALTER TABLE DROP COLUMN`, so Laravel rebuilds the table from its existing definition and **discards columns added in the same Blueprint** — `gifter_addresses` came out with none of the five, on SQLite only. MySQL does both in one ALTER, so every deployed database was correct and the fault was invisible. **Split the drop and the adds into separate `Schema::table` calls.**

## Registration rebuilt — one question per screen (1 Aug 2026, spennypiggy.co)

`Auth/Register.jsx` was a 2,030-line component putting ~14 fields on one screen behind a role picker and a full-page warning. It is now an orchestrator over `resources/js/Pages/Auth/register/`: `RoleChooser` · `IdentityStep` · `CredentialsStep` · `CreatorProfileStep` · `ReviewStep`, plus `ProgressRail`, `PreviewCard`, `Field` and `constants.js`. **Single column at every width**, each step sized to one 390×844 viewport.

- **Steps are declared in `constants.js` `STEPS`, per role** — creator `role → identity → credentials → profile → confirm` (5), supporter drops `profile` (4). The rail, the "2/5" counter, the back button and `advance()` all read that array, so a screen cannot exist without a step label. The old flow numbered steps 0–3 and skipped 1 and 2 for supporters, which made an honest progress indicator impossible.
- 🚨 **The supporter billing address is NO LONGER collected at signup.** `RegisteredUserController` asked for country + street (`min:20`) + city + state + postal before the person had bought anything. The signup copy was strictly worse data at the most expensive moment, and `min:20` rejects a genuine short address ("12 High St"). **Only `country` is asked for** (it sets the display currency); `GifterAddress::create` writes that column alone. ⚠️ **CORRECTED 6 Aug 2026 — this entry used to say `successCheckout` "already" wrote the card-verified address on the first purchase. It never did.** Nothing outside `RegisteredUserController` has ever written those columns, and **none of the seven checkouts asks Stripe for a billing address** (`billing_address_collection` appears once in the whole codebase, on the £500 verification session). So from the day signup stopped asking, every new gifter's address stayed NULL. It is now collected at the £500 gate — see "Gifter billing address" below. The old `addressCheck` checkbox and the "Important notice" modal that opened *on submit* are gone — their substance (own details, one account per person) is a visible consent on the confirm screen.
- ⚠️ **`GifterAddress` encrypts every column and its accessors had NO null guard**, so the moment a row existed with `street_address`/`city`/`state`/`postal_code` NULL, any read threw `DecryptException: The payload is invalid.` Both getters and setters are now null-safe. **The admin app's copy of this model already guarded them** — the website's was the odd one out, which is exactly the cross-app drift the shared-DB rules warn about.
- **Username suggestions.** `suggestUsernames(name)` derives up to four handles from the display name, every candidate pre-filtered through `usernameError` so a suggestion can never be one the server rejects on format. The first is filled in automatically; "Type my own" swaps to a free-text field and stops suggestions overwriting it. ⚠️ **The taken-handle auto-advance keys on WHICH handle was rejected, not a boolean.** `validateRemote()` therefore returns the server's error object, and the caller stores `takenUsername = value`. A bare `taken` flag stayed true for one render after the value changed, so the *next* suggestion was skipped as though it were taken too.
- **There is no confirm-password field.** With a working reveal toggle it only ever cost a retype; the server rule is still `confirmed`, satisfied by writing `password_confirmation` alongside `password` in the same `setData`.
- **Pronouns default to `they`, never `he`.** The old form defaulted the `gender` select to `"he"`, which is a guess about a person the platform has not met.
- ⚠️ **`includes/Header.jsx` renders its own 75px spacer div** (line ~301) after the fixed bar. Page-level `pt-28` stacks on top of it — that was ~170px of dead space above the fold on a phone. Any full-height page should assume the clearance is already handled.
- ⚠️ **`resources/css/index.css` styles `input[type="checkbox"]` globally with `text-[#FF007F]`**, which under @tailwindcss/forms is the *checked fill* — so the supporter's violet form drew pink ticks. Inline `color` is the only thing that reliably beats it.
- **`LoaderButton` is deliberately not used here.** It hardcodes `rounded-[30px]` and `main-button` (fighting the `rounded-box-sm` token) and renders its spinner whenever `disabled` is set — so an unticked consent box showed the form as though it were saving.
- **The creator's "no charge until your first sale" promise is on the confirm screen**, read from `constants/creatorSubscription.js` — never retyped. It was absent from signup entirely despite being the strongest reason to sign up.
- Copy is content-first throughout (no gift/tip/donation/fundraise). The old creator screen — a whole step reading *"Heads up, Babe! 🚨 … your application might be rejected"* — is gone; the social-profile requirement is one line on the confirm screen, where it is a next step rather than a threat.
- **Not built: "Sign up with Google".** ✅ Superseded — see "Sign in with Google" above.

## A refused sign-up becomes a lead, not a lost click (15 Aug 2026, spennypiggy.co)

When the platform risk state is **FREEZE**, `RegisteredUserController::store()` refuses a
creator registration. Until now the person received one sentence — *"New creator
registration is temporarily paused due to system maintenance"* — and **nothing else**: no
waitlist, no address captured, no way back. Every one of those is a click the live Google
and X campaigns were billed for.

- **`signup_leads`** (migration `2026_08_15_000000`, unique `email`) — `role` · `reason` ·
  `platform_state` · `source` · `landing_page` · `notified_at` · `converted_at`.
  **ONE ROW PER EMAIL, ever**: an account can only exist once per address, so a converted
  lead is closed rather than deleted.
- **`App\Services\SignupLeadService` is the ONE way a row is written.** `capture()` never
  throws — it sits on the registration path, and a lead we failed to record costs one
  email where an exception costs the person their error message.
- ⚠️ **Someone who already has an account is never captured.** They were not refused a
  first account, they were refused a second — putting them on a "you can sign up now" list
  reads as the platform having lost their account.
- 🚨 **The endpoint's response is IDENTICAL whether or not it stored anything.** `capture()`
  returns null for an existing address, so branching on it would turn
  `POST /signup-waitlist` into *"does this person have a Spenny Piggy account?"* for any
  address a stranger types. What differs is what is STORED, never what is SAID — the same
  rule `GuestPurchaseLookup` follows.
- ⚠️ **The FREEZE gate moved BELOW the Google block.** A Google sign-up posts no email (the
  verified address is merged in from the session), so gating first meant refusing the person
  with nothing to capture them by — the exact failure this closes.
- 🚨 **The refusal key is `signup_paused`, NOT `email`.** `Register.jsx` branches on it to
  render `register/SignupPausedPanel.jsx` **in place of the form**, and its owner-finder maps
  `email` back to the credentials step — an `email` key would bounce the person to a field
  they cannot fix. It is deliberately not toasted: the refusal lasts as long as the pause,
  and a toast that fades leaves them on a form that will refuse them again.
- 🚨 **`ensureTurnstileVerified` REFUSES a request carrying no token whenever a secret is
  configured**, and returns early when it is not. A panel that renders no widget therefore
  passes every local run and fails every production one. The panel renders `Turnstile` and
  posts `cf_turnstile_response`; the button is gated `(turnstileSiteKey && !captchaToken)`,
  the house form, so an environment with no Cloudflare keys is never hard-blocked. Asserted
  by test — the server half and the client half cannot drift apart again.
  ⚠️ `onVerify` is a `useCallback`-stable ref (the documented widget-remount storm), and a
  failed post resets the widget because a Turnstile token is single-use.
- **Copy is `RiskMessages::CREATOR_SIGNUP_PAUSED`**, never written in JSX. 🚨 It replaces a
  sentence that was **untrue** — the platform is not under maintenance, it has stopped
  opening creator accounts because a safety threshold tripped. We need not say which
  threshold (rule 1), but we must not invent a different reason.
- **`signup-leads:notify`** (every 30 min, `--max` caps SENDS not rows read, `--dry-run`) →
  `App\Mail\SignupWaitlistOpen`. ⚠️ **Returns immediately while the platform is still
  paused** — the mail links at the form that would refuse them again, and one wrong send
  means the next is ignored. `notified_at` is the CLAIM (the UPDATE that reads it), released
  on a failed send. `Mail::queue`, so this needs `queue:work`.
- **`signup-leads:prune`** (daily 03:57, `--days=180` floored at 7, `--dry-run`) — 🚨 every
  row is a contact detail for somebody with **no account** who agreed to exactly one thing.
  Nothing else removes one, so without this the table is a permanent shadow mailing list.
  It prunes on AGE, not state: a lead still pending after the window is a dead address.
- Tests: `tests/Feature/SignupLeadCaptureTest.php` (14).

### 🚨 The GMV spike triggers now need an absolute floor, not just a ratio

`App\Support\PlatformGmvTrigger` is the ONE definition of whether a GMV ratio trigger fires.

**A ratio alone is meaningless at this platform's volume.** Measured 15 Aug 2026: 30-day GMV
**£23,013**, 7-day GMV **£0**, 24h GMV **£0**. After a quiet week the 7-day daily average is
pennies, so the next ordinary sale is a 3x, 10x or infinite "spike" — and
`MonitorPlatformRiskState` **CAUTIONed or THROTTLEd the platform for taking one payment**,
throttling exactly the ad-driven growth those states exist to protect.

| Trigger | Multiplier | Floor (added) |
|---|---|---|
| Daily CAUTION | 24h ≥ 1.5× 7d avg | 24h GMV ≥ **£2,000** |
| Daily THROTTLE | 24h ≥ 2.0× 7d avg | 24h GMV ≥ **£5,000** |
| Weekly THROTTLE | 7d ≥ **2.0×** prev 7d (was 1.3×) | 7d GMV ≥ **£15,000** |

- ⚠️ **The weekly multiplier was the worst of the three.** At 1.3 the platform throttled
  itself for **30% week-on-week growth** — a healthy ramp, and the outcome the campaigns are
  bought to produce. Both halves matter; do not lower it without raising its floor.
- 🚨 **The floor is ANDed, never ORed.** A state change needs the day to be both
  disproportionate AND materially large.
- 🚨 **Values are GBP MINOR UNITS**, matching `payments.amount` (and `new_creator_daily_cap`
  = 50000 = £500). A floor typed in pounds is a hundredfold too low and silently reinstates
  the bug. Asserted by test.
- ⚠️ **Only the GMV triggers are touched.** The dispute-rate FREEZE, the EFW counts and the
  creator-cluster count are absolute risk signals already — they are what actually catches
  fraud, and nothing here softens them.
- ⚠️ **A cleared floor means "ratio only" (the old behaviour), never "never alarm".** A zero
  multiplier still disables its own trigger, the existing convention everywhere in the risk
  engine.
- **A trigger held back by its floor is REPORTED** (`reportSuppressed()` → console + a
  `Log::info`). The floors were picked against one GMV snapshot, and this is the only signal
  saying whether they are right — "the trigger never fired" and "the trigger was suppressed"
  are different findings with different fixes.
- **`--dry-run`** evaluates every trigger and writes no `PlatformRiskState` row. 🚨 That row
  gates creator registration, so a "safe" inspection that froze the platform would be the
  worst outcome of a dry run.
- Migration `2026_08_15_000001` seeds the three keys into `platform_state_triggers`,
  **adding only what is missing** — an admin may have tuned any of them, and the weekly
  multiplier is raised **only if it still holds the shipped 1.3**.
- ⚠️ **The rule lives outside the command deliberately.** `MonitorPlatformRiskState` computes
  its metrics in raw MySQL (`NOW() - INTERVAL 30 DAY`), which sqlite cannot execute, so the
  command cannot run in the test suite at all. The rule is the part worth asserting.
- ⚠️ **`onboarding_limits` (NORMAL 25/day) is DEAD CODE** — `CreatorActivationService` has
  zero callers, so there is no daily sign-up cap and FREEZE is the only thing that stops a
  registration. If it is ever wired, add a `daily_cap` reason to `SignupLead::REASONS` and
  capture on it too, or that refusal becomes the silent lead-loss this work just closed.
- Tests: `tests/Unit/PlatformGmvTriggerTest.php` (9).

## Login and forgot-password wear registration's shell (12 Aug 2026, spennypiggy.co)

Registration was rebuilt 1 Aug; `Auth/Login.jsx` and `Auth/ForgotPassword.jsx` were not. Login sat
on mint green and forgot-password on the legacy `blackbg`/`headingLg`/`containerbox` classes, both
inside a **fake browser window** (red/yellow/green traffic-light dots), so one flow changed
appearance twice. All three screens now share one shell.

- **The shell:** `#0B0B0C` page, ONE mint radial wash, white panel
  `rounded-box border-[3px] border-black bg-white shadow-black`, `font-gulfs` uppercase heading
  with a mint rule under it (the house device — the accent carries as a rule, it does not colour
  the type). Page is `flex justify-center` on `min-h-[85vh]`.
- **Every auth input is `Pages/Auth/register/Field.jsx`.** Login had hand-rolled inputs with
  gradient-blur focus rings and forgot-password had `<ul><li><label>` over the legacy `TextInput`,
  so the same field was three different heights with three error placements. **Do not hand-roll an
  auth input.**
- ⚠️ **The accent on these two screens is MINT `#05EFB8`, deliberately neither of registration's.**
  Pink is the creator's colour and violet the supporter's (`register/constants.js` `ACCENT`); login
  and password reset serve both, so either would signal a role the page cannot know yet.
- **Two columns from `lg`** — `lg:grid-cols-[minmax(0,1fr)_440px]`, words left, form right — with
  **ONE DOM order** (heading → panel → aside). The desktop split is explicit cell placement
  (`lg:col-start-*`/`lg:row-start-*`/`lg:row-span-2`), **never a second copy of the markup**, so a
  phone stacks in the order the screen is used and login's guest block still lands below the form.
- 🚨 **Grid rows must be `auto`, never `1fr 1fr`.** Equal fractions force the short one-line row
  under the heading to match the heading's own height — the block inflates and the panel, spanning
  both rows, is centred in dead space and lands far down the page against nothing. Everything is
  `lg:self-start`, so the panel's top edge lines up with the top of the headline.
- 🚨 **`animate-shake` was defined in NO stylesheet.** Login set it on every failed sign-in and the
  class emitted nothing, so that feedback had never existed. Now a `shake` keyframe in
  `tailwind.config.js`; the panel carries it with `motion-reduce:animate-none`. Same class of trap
  as the documented opacity-modifier-on-`var()` one — **verify a new utility against
  `public/build/css/app-*.css`, not by reading the class name.**
- **Password reveal toggle, no confirm field** — same reasoning as registration.
- **Forgot-password states the link's life BEFORE the address is typed.** `LINK_TTL_MINUTES` (10)
  is mirrored as a const in the JSX from `PasswordResetLinkController::LINK_TTL_MINUTES` — ⚠️ keep
  the two in step; a page promising a window the server does not honour is worse than silence. It
  also says only the newest link works (`createToken()` deletes the previous row), which is what
  stops someone requesting a second link and killing the first.
- **Success there is a STATE, not a toast** — it names the address the mail went to, which is what
  turns "nothing arrived" into "I typed it wrong" without a support ticket. The old page cleared
  the field and relied on a toast, so seconds later the screen was an empty form again,
  indistinguishable from a request that never happened.
- 🚨 **`PasswordResetLinkController::store()` is still an account-existence oracle** — it answers
  an unknown address with *"Email address is invalid or didn't match with our records."* on an
  unauthenticated endpoint, while `changePassword()` directly below it returns one message for
  every failure precisely to avoid that. Open in TASKS; the redesign deliberately preserved the
  existing response behaviour.

## Gifter billing address — collected at the £500 gate (6 Aug 2026, spennypiggy.co)

🚨 **A gifter's billing address was collected NOWHERE.** Signup stopped asking on 1 Aug 2026
on the strength of a claim — repeated in this file, in `RegisteredUserController` and in the
`GifterAddress` model — that `successCheckout` filled the rest from Stripe on the first
purchase. **It never did.** Two facts, both greppable in seconds:

- The only two writes to `GifterAddress` in the entire website app are in
  `RegisteredUserController` — signup (country only) and `cardVerificationSuccess`
  (`stripe_address` only). `successCheckout` does not touch the model.
- `billing_address_collection` appears **once** in the whole codebase, on the £500
  verification session. **None of the seven checkouts** (cart/wish · shop · task · pot · tip ·
  bill · membership) asks Stripe for a billing address, so even a write would not have had a
  full address to store — Stripe's default `auto` returns roughly country + postcode.

`street_address` / `city` / `state` / `postal_code` were therefore written by nothing, and
every gifter created after 1 Aug had them NULL permanently.

**What that broke.** The admin gifter review (`CreatorReviewService::addressComparison()`)
compares what the gifter gave US against `stripe_address`. `compare()` returns `UNKNOWN` the
moment either side is blank, and `addressMismatchCount()` counts only `DIFFERS` — so with our
side empty the mismatch count is **always 0** and the match report has nothing to report. The
review a person performs before letting somebody spend past £500 decided nothing.

**The fix — asked once, at the gate that needs it.**

- `POST /gifter-verification-address` (`gifter.verification.address`, `throttle:20,1`) →
  `RegisteredUserController::saveVerificationAddress`. Form is
  `Pages/gifter/VerificationAddressForm.jsx`, rendered inside `ActivateCard`.
- 🚨 **No address, no charge.** `gifterCardVerification()` returns **422 `needs_address`**
  before the Stripe client is even constructed. The button is one `axios.get` away for anyone
  with a console, so the UI gate is a courtesy and the server one is the rule. A mutation check
  confirms the test fails when the guard is removed.
- 🚨 **`stripe_address` is NEVER written here.** It is the second, independent record — what
  the gifter types into Stripe Checkout moments later — and both being entered separately is
  the entire value of the comparison. The form is also never pre-filled from it.
- **`GifterAddress::isComplete()` is the ONE definition** of "we have an address", read by the
  server gate and by the screen deciding whether to show the form. Two copies drift, and the
  direction that drifts silently is a screen skipping the form for a charge the server then
  refuses — a gifter stuck at the gate with nothing to fill in.
- ⚠️ **`REQUIRED_FIELDS` is street + city + country only.** `postal_code` and `state` are
  deliberately optional: several countries have no postcode and many have no state, and this is
  the gate standing between a gifter and their ability to spend, so a field they cannot fill
  must never be a dead end. A blank reads as `unknown`, never as a mismatch.
- ⚠️ **No `min:20` on the street.** The signup rule it replaces had exactly that and refused
  "12 High St" — eleven characters, a real address.
- 🚨 **Country is stored as the ISO code, never the label.** The old signup wrote "United
  Kingdom", which put "India" against Stripe's "IN" and flagged every gifter in the admin queue.
- ⚠️ **Asked ONCE.** A complete address collapses to a summary with an Edit button. It stays
  editable because a rejection may well have been *about* the address, and locking it would
  leave the gifter with a refusal they cannot act on.
- ⚠️ **The shared prop `auth.verification_gate` (`{address, charge}`) is gated to the cohort at the gate**
  (`role = 0`, not `profile_status_lock = 2`, and either `is_500_limit_exceeded` **or** a
  `profile_reject_reason`). The shared payload ships with every Inertia navigation, so an
  ungated read is a query per page view for a question only a handful of accounts are asked —
  same rule as `has_ever_sold`. The `OR profile_reject_reason` half is load-bearing: a rejected
  gifter reaches `ActivateCard` without the £500 flag, and gating on the flag alone showed them
  an empty form for an address they had already given us.
- ⚠️ **`LoaderButton` renders its spinner off `disabled`**, so the missing-address gate is a
  muted style plus the guard in `checkTerms`, never `disabled` — otherwise the Activate button
  spins until an address is typed and reads as "already processing".
- **`resources/js/includes/Countries.jsx` now exports `COUNTRIES`** at module scope. The
  `<Countries>` select emits `JSON.stringify(country)` and is uncontrolled, so it can never
  pre-select — fine for signup, useless for an edit form, and copying 500 rows to work around
  it is how two lists drift.
- ⚠️ **`GifterAddress::readable()` fails CLOSED on an undecryptable column.** Both readers are
  now on paths where a throw is worse than a blank: `toFormArray()` feeds the SHARED Inertia
  payload, so one corrupt row would take down every page for that gifter with no route to the
  form that fixes it; and `isComplete()` is the server gate, where an exception is a 500 rather
  than a refusal. Unreadable counts as absent — the gate refuses, the gifter retypes. The usual
  cause is `APP_KEY` rotating, so it logs at warning.

### The gate itself — three bugs found while rebuilding it (6 Aug 2026)

- 🚨 **The screen promised "£1" and the card was charged £2.95 — and the verification must NOT
  go through `calculateStripeDirectChargeFlow` at all.** That formula prices a supporter buying
  from a creator: it grosses the listed price up so the creator still nets it after a 17%
  platform fee, a 2% compliance fee, a flat £1 admin fee and Stripe's cut. Run against a £1
  verification it returned **£2.95**, with the breakdown reporting `net_to_creator: 1` for a
  charge that **has no creator** — the platform was billing itself £1.56 in application fees and
  passing it to the gifter, on the one payment whose whole purpose is to establish trust. A
  surprise amount is precisely what produces the dispute this gate exists to prevent.
  **`App\Support\GifterVerificationCharge` is now the ONE definition and the charge is FLAT**
  (`AMOUNT_GBP`, client decision 6 Aug 2026: £1, of which Stripe takes ~£0.33). Quoted and
  charged are the same number because there is only one number. ⚠️ Formats through
  `Helpers::getCurrency()` — **never a hardcoded `£`**, since the charge is taken in the
  visitor's own currency cookie — and falls back to GBP when a conversion rate is missing,
  because Stripe rejects a zero-amount charge and the gate would silently stop working for that
  currency.
- 🚨 **After paying, the "Activate Account" button was still on screen.**
  `cardVerificationSuccess` sets `profile_status_lock = 1` and `is_subscribed = 1` but **never
  clears `is_500_limit_exceeded`** (nothing in the codebase does), so `needsVerification` and
  `isPending` were both true and rendered together — a gifter who had just paid £2.95 saw "We're
  reviewing your details" with the pay button above it and could pay again. `ActivateCard` now
  resolves ONE exclusive state in order: approved → rejected → paid (pending) → action. Do not
  reintroduce two independent booleans.
- 🚨 **`cardVerificationFailed($uuid)` had no ownership check** while `cardVerificationSuccess`
  did. A uuid is a public identifier on this platform, so any signed-in account could flip
  another gifter's latest verification to `failed` by visiting their uuid — and a gifter who had
  paid minutes earlier would be shown "Payment Failed or Canceled" about a charge that
  succeeded. Same `Auth::id()` guard as its sibling.
- ⚠️ **`GifterCardVerification.jsx` carried a dead second copy of the checkout redirect** —
  `handlePaymentRedirect` plus five unused bindings and two unused imports, none of it rendered.
  Its `!h-[80vh]` also broke the documented "never trust `vh`" rule and clipped the card outright
  once it grew a form; it is `min-h-[70dvh]` with padding and `pb-28` for the bottom nav.
- ⚠️ **`Shell` must stay at module scope in `ActivateCard`.** Declared inside the component it is
  a new type every render, so React remounts the subtree — and it wraps `VerificationAddressForm`,
  which holds what the gifter is typing. Every `loading` toggle would have wiped the form. Same
  trap as `AddItem.jsx`.
- **UI: a three-step rail** (Your address → Verify your card → We check it) at the top of every
  state. The gate is a three-part process and the screen never said so, which is the whole reason
  it read as a demand rather than a step. The pending state says "Nothing for you to do."
- Tests: `tests/Feature/GifterVerificationAddressTest.php` (16) — the charge refused without an
  address, ISO country enforced, a short street accepted, postcode/state optional, the Stripe
  copy untouched, a row created when none exists, an undecryptable row treated as absent,
  creator/guest refused, one gifter unable to write over another's or to fail another's
  verification, the charge being flat rather than grossed up, and a missing conversion rate
  falling back to GBP.

## Auth hardening — reset, verify, throttles (4 Aug 2026, spennypiggy.co)

A pass over every login/register/reset path. The two headline faults were the same
mistake twice: **a public identifier used as if it were a secret.**

### 🚨 `users.uuid` is NOT a token, ever

It is in profile payloads, item routes and admin URLs all over this codebase. Two
endpoints treated it as proof:

- **Password reset was a complete account takeover.** `POST /change-password/{uuid}`
  had no token at all — its only guard was `expired_at`, which *any* unauthenticated
  `POST /forgot-password` set into the future for *any* email. Request a reset for the
  victim, post a new password at their uuid, done. It now requires a single-use random
  token minted by `Password::broker()->createToken()`, verified with `tokenExists()`
  and spent with `deleteToken()`; the uuid in the URL only says WHICH account.
  Password rules match registration (`Rules\Password::defaults()` — it was `min:6`,
  the weakest gate on the platform sitting on the one endpoint that replaces a
  password), `remember_token` is rotated so old "remember me" cookies die, and every
  refusal returns ONE message so the form is not an account-existence oracle.
  The old handler also read `$user->expired_at` *before* its own `! empty($user)`
  check, inside a `try` that returned nothing — an unknown uuid was a null-deref
  answered with an empty response.
- **`GET /user/{uuid}` verified any account's email**, unauthenticated. It is now a
  `URL::temporarySignedRoute('email.verify.uuid', 7 days)`, with the signature checked
  in the controller (readable message on a stale link, not a bare 403 — same shape as
  `/unsubscribe/{user}`).

### ⚠️ `env()` inside a Blade view is NULL once the config is cached

Both auth mails built their link as `{{ env('APP_URL') }}/…`, so **every reset and
verification link shipped without a host on every Vapor deploy**. Both URLs are now
built in the JOB (`ForgotPassword`, `VerifyEmail`) and passed in; the template only
renders. `ForgotPassEmail::build()` had the same trap on `MAIL_FROM_*`, and wrapped
itself in a `try` that returned NULL from `build()` — a mailable with no view rather
than a reportable error.

### Unthrottled auth endpoints

Every one of these is unauthenticated and answers a question about an arbitrary
address, sends mail, or both: `verify-user` (10/min — it is the pre-step of every
password login and says "no account exists with this email"), `forgot-password`
(6/min — enumerates AND sends mail, so unlimited it is a mail bomb),
`change-password` (10/min), `webauthn/check` + `webauthn/login/options` (30/min — the
login page fires check on every keystroke), `register/validate` +
`username-availablity` (60/min), `email/send-verification-email` (3 per 10 min).

### Smaller faults fixed in the same pass

- **Open redirect on login.** `?redirect=` went straight into `router.visit()` after a
  successful sign-in. `Login.jsx` now has a client-side `safeRedirect()` mirroring
  `GoogleController::safeRedirect()` — **keep the two in step.**
- ⚠️ **`verify2FA` looked its user up case-sensitively** (`where('email', $email)`)
  while every other door lowercases — `LoginRequest::prepareForValidation`,
  `verifyUser`'s `LOWER(email)`, `GoogleController`. A stored address with any
  uppercase in it passed the password step and then found no user at the second
  factor: a 2FA account that could never finish signing in. It now matches lowercased
  + `withTrashed()`, and refuses a soft-deleted account.
- **`checkCouponCode` said every code was valid.** `! empty($collection)` — an Eloquent
  Collection is an OBJECT, always truthy — and it returned `message` while the form
  reads `msg`, so the text never rendered either.
- **`checkUsername` used `alpha_num`**, rejecting the full stops and underscores
  registration allows: `jane.doe` came back as a validation error on the availability
  check while being perfectly registrable.
- ⚠️ **`gifter_addresses.country` stores the ISO CODE at signup**, not the display
  label. It wrote "United Kingdom" until the first purchase replaced it with Stripe's
  "GB", so one column meant two things depending on funnel depth.
- **`ForgotPassword.jsx`'s catch called `setQuantity(intialItem)`** — neither exists
  there — so every failed request threw a ReferenceError instead of showing anything,
  under the message *"Unable to update quantity."*
- **`EnterOTP` hid every real refusal.** `verify2FA` answers a bad code with 422 and a
  suspended account with 403, and **both put their text in `msg`**; the catch read only
  `message`, so all of it surfaced as "Something went wrong."
- ⚠️ **The verification screen ran `window.location.reload()` every 5 seconds, forever.**
  A full page load per tick per open tab, and the screen could not be read. It now polls
  `GET /email/verification-status` every 10s (skipped while the tab is hidden) and
  reloads once, when the address is actually verified.
- **Re-entrancy guards + one-toast error handling** on login, forgot-password and the
  OTP form: the disabled re-render loses the double-tap race, and `LoginRequest` returns
  `message` AND `errors.email` carrying the same string, which put the identical failure
  on screen twice.
- Tests: `tests/Feature/PasswordResetSecurityTest.php` (7) and
  `tests/Feature/EmailVerificationLinkTest.php` (3).

## A closed Piggy Pot leaves the profile (3 Aug 2026, spennypiggy.co)

`App\Services\PiggyPotStatusService` is the ONE definition of whether a pot is open, whether it belongs on the public profile, and — when it does not — what the creator has to do about it.

- ⚠️ **Nothing had ever flipped a pot to `expired`.** The deadline was enforced only at the moment of purchase, so a pot whose date passed months earlier still sat in the creator's featured slot and sent every visitor who clicked it to *"this content is no longer available"*. Live when this shipped: **6 such pots, 3 of them pinned.**
- **`piggy-pots:expire` (hourly, `--max`/`--dry-run`)** closes them and pushes a bell + push notice (`$marketing = false` — it is the platform saying a listing stopped selling). A sweep, not a model event: a deadline passes because TIME passed, not because anybody saved a row. The claim is `where('status','active')->update(...)`, so two runners cannot both notify.
- ⚠️ **The status filter alone is not enough on the public query** — `expired` is written hourly, so a pot that closed at midnight is still `active` until the sweep runs. `scopePubliclyVisible()` checks `status = active` AND the deadline, and `UserProfileService::getOptimizedPiggyPots` applies it **before** the pinned/fallback branch, so a closed pinned pot no longer wins the slot and silences the fallback. `completed` is public no longer either — checkout already refused it.
- ⚠️ **The deadline is INCLUSIVE of its own day** (`endOfDay`). Object and query form must agree or a pot vanishes a day before it stops taking money.
- ⚠️ **`deadlinePassed()` is typed `?CarbonInterface`, never `?Carbon`.** Two unrelated Carbon classes are in play — `Illuminate\Support\Carbon` (what a `datetime` cast returns) and `Carbon\Carbon` (what controllers import) — and typing either one makes the other a fatal TypeError at the call site. That 500'd the reopen rule on its first real use.
- **A future deadline REOPENS a closed pot** (`PiggyPotController::update`). Without it the fix the dashboard tells the creator to make does not work: the edit form legitimately posts `status = expired` (that IS the pot's status) and the pot stays hidden with no clue why. Deliberately does not touch `completed` or `moderation_hold`.
- **Creator UI:** `PiggyPots/PotVisibilityNotice.jsx` on every card — `deadline_passed` (red, "Set a new deadline" opens the edit form) · `moderation_hold` · `completed` · `archived` · `not_featured`, each with its own fix; silent when live. The pinned chip reads **"Pinned · not showing"** when the pot is closed — a plain "⭐ Pinned" on a pot the profile stopped showing is the badge stating the opposite of the truth, which is how a lapsed pot went unnoticed for months. `featuredPotId()` mirrors the profile's featured-slot rule so the dashboard cannot claim a pot is featured while the profile shows another.
- Tests: `tests/Feature/PiggyPotExpiryTest.php` (11).

## Scheduled posts (3 Aug 2026, spennypiggy.co)

- 🚨 **Visibility is decided by TIME, in a global scope on `Post`, not by the command.** `posts:publish-scheduled` (every 5 min) owns only the once-per-post work — the release stamp, the guest cache clear, the creator notice. A stopped queue worker therefore cannot silently swallow a creator's whole content calendar.
- **Columns (migration `2026_08_03_000000`):** `scheduled_at` (indexed, the creator's intent) and `schedule_released_at` (the publisher's idempotency claim, **not** an audit field). Mirrored in the admin app's `Post` model (shared DB).
- ⚠️ **`created_at` IS the publish time for a scheduled post**, written at save rather than mutated at release. Every feed, sitemap and cadence window on this platform orders and filters posts by `created_at`, so a post keeping its drafting date would go live already buried in its own creator's feed and would count toward the posting window from a day it was not visible on.
- ⚠️ **The scope is deliberately NOT viewer-aware.** A viewer exception would also let `PostingCadenceService` count a queued post — and a post nobody can read must not hold a creator's subscription income open. Surfaces that must see the queue opt out with **`Post::withScheduled()`**: `editPost`, `deletePost`, `togglePin`, the owner branches of `UserProfileService`, and the publisher. `Post::onlyScheduled()` is the queue itself.
- 🚨 **`generateUniqueSlug()` must use `withScheduled()`** — `slug` carries a UNIQUE index, and uniqueness is a property of the table, not of what the current viewer may read. Without it the check hands back a taken slug and the insert dies on the constraint.
- ⚠️ **An edit that omits `scheduled_at` leaves the schedule alone** (`$request->has(...)`); several callers post a partial payload and "absent" is not "the creator cleared it". Clearing it publishes (subject to review) and resets `created_at` to now.
- **Approval is still the gate.** A due-but-unapproved post is not released; the creator gets a one-off "waiting for review" notice (claimed via `engagement_notifications`) because the schedule is a promise the platform made on their behalf.
- **Limits:** `MAX_SCHEDULE_DAYS` 90, `MAX_QUEUED_POSTS` 20. ⚠️ The picker sends a full ISO instant, never the raw `datetime-local` string — that has no timezone and would be read against the server's clock.
- **UI:** schedule toggle in the composer's right column; `feed/Post.jsx` shows a mint "🕒 <date>" chip that **outranks** the "In review" chip. Admin: a **Scheduled** tab on `/posts` (soonest first) and a per-row chip that says **"Slot missed"** in red once a scheduled post is past its time and still unapproved.
- ⚠️ **Pre-existing schema gaps fixed to make this testable:** `posts.type`/`for_module`/`image`/`ai_generated`/`status`/`edited_*` had **no migration at all** (`2026_08_03_000002`, guarded, empty `down()`), and the website had no `logs` table migration although `editPost` reads it (`2026_08_03_000003` — that table is **owned by the admin app**; do not grow it into a second source of truth). Same class as the documented `users.role` gap.
- Tests: `tests/Feature/ScheduledPostTest.php` (11).

## The composer is a page, not a dialog (3 Aug 2026, spennypiggy.co)

`Pages/feed/AddPost.jsx` renders through `Popup` with `fullscreen hidecontrols hideclose`.

- **`Popup`'s `fullscreen` was half-implemented and used by nothing** — a full-height panel inside a padded, centred, separately-scrolling box. It now takes the viewport, the panel owns the scroll, and `hideclose` suppresses the floating close circle for panels with their own header control.
- Layout: black header (close · title · audience · Publish) → left "sheet" (headline, body, media in ONE bordered card with hairline rules) → right column (audience as four radio rows, a schedule switch, and a permanent live preview) → sticky footer on phones only.
- ⚠️ **`LoaderButton` is not used here.** It renders its spinner whenever `disabled` is set, so an empty composer showed a blank pill that read as "already saving", and it hardcodes a radius that fights the house tokens. Same trap as the registration screens.
- ⚠️ **The headline input is NOT `font-GillSans`.** It is a heavy display face for short uppercase headings; at input size in sentence case it reads as a broken graphic rather than a field. Display type belongs in the page header.
- `previewBody` is held in a variable because it renders twice (phone toggle, desktop column) — a second copy of that markup would drift, and the preview's whole job is matching what publishes.

### 🚨 The composer's uploader context must be unique per mount (14 Aug 2026)

Three faults, all reported together, all from `Popup` unmounting its CHILDREN on close
while `AddPost` itself stays mounted.

- 🚨 **`ctxName` was the literal `add-post-context` on every instance.**
  `feed/Post.jsx` and `PostDetail.jsx` each render an `AddPost` per post for the edit
  sheet, so a profile feed carried a dozen `lr-config` elements claiming one Uploadcare
  context — which is why **the drop area sometimes rendered completely blank**. It is now
  `add-post-<useId>-<openSeq>`, and `openSeq` increments on every CLOSE so reopening the
  same composer builds a fresh context rather than reusing one whose collection and
  preview step had already settled.
- 🚨 **`mediaList` is `AddPost`'s own state and survives the sheet closing**, so a creator
  who published — or simply closed it — reopened to find the previous post's images still
  attached, one tap from publishing them twice. `mediaFromItem(item)` is the ONE seed
  (an edited post's files; nothing for a new post) and every open re-seeds from it.
  ⚠️ Neither open nor close is observable from `AddPost`: in uncontrolled mode `Popup`
  owns the flag, so `modalAction` is `undefined` throughout and an effect watching it
  never fires. The `OnOpen` child's mount/unmount IS the signal.
- 🚨 **`Uploader.jsx` claimed a uuid AFTER its awaited adult scan.**
  `LR_UPLOAD_FINISH` fires more than once for the same file (the preview step settles the
  collection again once CDN modifiers are applied), so both events read the same
  unclaimed uuids and **one uploaded image was handed over twice**. The claim is now taken
  synchronously before the first `await`; a refusal un-claims via `handleResetUploader`.
  `LR_REMOVE` also gained the context guard the other handlers already had — without it,
  removing a file in any uploader on the page cleared this one's collection.

⚠️ **The headline field announced nothing about being required.** It is mandatory on the
server (`postRules`: `title` → `required`; it is what the post's URL, feed card and every
share preview are built from) and the form's only clue was a grey placeholder — so a
creator typed the post into the body, found Publish dead, and had nothing saying why. It
carries the sheet's existing required-field grammar now (eyebrow label + pink `*`, hint
line, red state on blur), and a blocked submit focuses it rather than only toasting.

⚠️ **"Use AI" is switched off** (14 Aug 2026, client direction) — `ImageGenerationWithAI`
and its import are commented out together in `AddPost.jsx`. `getAIImage` and its
watermarking transform are still wired, so re-enabling is uncommenting both.

## Edit Profile — Appearance merged into Profile (3 Aug 2026, spennypiggy.co)

Photos, bio and name are one job. Splitting them meant a creator changing their avatar and their display name had to save, switch tab and save again. The Appearance tab is gone; its block renders **above** the fields via `order-first` on a `flex flex-col` form — expressed where it is read rather than cutting and pasting ~110 lines of upload wiring.

## Post editing & image-required (spennypiggy.co)

- 🚨 **Every creator post must carry a TITLE** (14 Aug 2026) — `postRules()` makes `title` `required`, and `AddPost.jsx` gates `canSubmit` on it and no longer says "(optional)" in the placeholder. It had been `nullable` while the slug generator fell back to the literal string `post`, so the second untitled post ever written died on the unique index (see below). The title is also what the post's URL, its feed card and every share preview are built from. **The two sides must move together** — a field the form calls optional and the server rejects reads as a post button that silently fails.
- **Every creator post must carry an image** — `PostsController::postRules()` makes `image` `required` (caption optional). A members-only feed of text-only posts gives a paying subscriber nothing to look at. System `support_thanks` posts are written server-side and never hit this rule. Frontend enforces it too (`AddPost.jsx`: submit blocked without an image, field marked `*`).
- **Post edit was wired but dead:** the edit modal (`AddPost` with `isEdit`) was rendered INSIDE the post's dropdown `Menu`, so selecting "Edit Post" closed the menu and unmounted the modal before it could open. `AddPost` now supports a controlled `open`/`onClose` pair (no internal trigger when controlled), and `feed/Post.jsx` renders it OUTSIDE the menu, opened by an `editing` state flag. Ownership + re-moderation on edit already existed server-side (`editPost`: author-only 403, `approved=0` on save).
- ⚠️ **A card can only act on the columns it was given.** `UserProfileService::getOptimizedPosts()` selected six columns, so the profile feed's cards had no `slug` (post links fell back to the uuid), no `is_pinned` (the owner menu always read "Pin Post"), and no `title`/`type`/`media`/`for_module`. Any column the card renders or acts on must be in that select.

### Post mentions — `@creator` (28 July 2026, spennypiggy.co)

A creator can tag other creators in a post. `post_mentions` (migration `2026_07_28_000000`: `post_id`, `user_id`, `notified_at`, unique post+user) stores the resolved mention — **by user id, never the typed username**, so a handle change keeps the link and the notification working.

- **`App\Services\PostMentionService`** is the only parser/resolver. `sync($post)` runs on save AND edit (`PostsController::savePost`/`editPost`). **Creators only** (`role=1`): a fan has no public creator page, so tagging one would link to nowhere. Skips self-mentions, suspended accounts, and either side of a `UserBlock`. Capped at `MAX_PER_POST` = **5** — extra handles stay plain text and notify nobody.
- ⚠️ **An edit only drops mentions that have not been notified yet.** Deleting a notified row would let the same creator be notified twice by removing and re-adding the handle.
- **Notification fires on APPROVAL, not on save.** A post is created `approved=0`, so notifying at save time would send someone to a post only its author can see. `mentions:notify` (scheduled **every 10 minutes**, `--dry-run`) picks up mentions whose post is now `approved=1`. Approval happens in the **admin app** — this poll is what closes the loop across the two codebases without the admin app needing any change.
- Delivery is `NotificationDispatcher` → **bell + push + email** (`App\Mail\MentionedInPost`, view `email.mentioned-in-post`), deduped by the `engagement_notifications` claim keyed `post:<id>` — so a re-run, a crash mid-batch or two workers racing cannot double-send. Needs `queue:work` + `schedule:work`.
- ⚠️ **Sent with `$marketing = false`.** Being tagged is a direct interaction, like a comment on your post, and it has no opt-out of its own — routed through the marketing gate, every creator who had unsubscribed from promotions was silently never told (`EmailService::sendMarketingEmail - Skipping marketing email for user 80`). Do not "tidy" this back to the default.
- **Typeahead:** `GET /post/mention-search?q=` (`post.mention-search`, auth, **throttle 30/min** — it is a user-search endpoint and must not become account enumeration), exact-prefix matches ranked first, 8 results. UI is `Components/MentionTextarea.jsx` (debounced, arrow/Enter/Tab/Esc, inserts `@username`); the suggestion list uses `onMouseDown`, not `onClick`, because blur fires first and would close the menu before a click landed.
- ⚠️ **`formatPostContent(text, mentions)` links only handles the server resolved.** Without the list every `@word` became a link, so a typo or "@everyone" led to a 404. Posts carry `mentionedUsers` (eager-loaded in `UserProfileService`'s post queries and in `showPostDetail`); pasted links stay `rel="noopener noreferrer nofollow"`.
- Tests: `tests/Unit/PostMentionServiceTest.php` (ordering/dedupe, email addresses ignored, title+content, trailing full stop).

### 🚨 A slug check must see rows the viewer cannot (14 Aug 2026)

Production 500 on `POST /post/save`: *"Duplicate entry `'post'` for key
`posts.posts_slug_unique`"*. An untitled post fell back to the literal slug `post`, the
row already holding it was **soft-deleted** and therefore invisible to the uniqueness
loop, so the loop never ran and the insert hit the index.

⚠️ **`posts.slug` is UNIQUE, so every predicate that hides a row from
`Post::slugTaken()` is a 500 on the creator's own post button.** Three hid rows and all
three are now lifted — the `published` global scope (a scheduled post), **SoftDeletes**
(a trashed post still occupies the index), and **`post_slug_history`**, whose own slug
column is unique and serves the 301 for a retitled post: a new post taking a retired
slug both collides there and shadows the redirect for the post that used to own it.

- **The ladder is title-slug → `title-slug-username` → numeric → random token.** The
  creator's username is the first fallback (client direction) because it reads as a real
  URL; it is **never** appended when the plain slug is free. `generateUniqueSlug($title,
  $ignoreId, $userId)` takes the creator's **id** and resolves the username only on
  collision, so the common path costs no extra query.
- ⚠️ **The method never returns an unchecked slug.** The random-token branch loops until
  it is free — fifty collisions means something is wrong with the input, not with the
  creator, and they should still get a working URL rather than a failed post.
- ⚠️ `$ignoreId` excludes the post's own history rows too, or retitling back to an
  earlier name walks the ladder for no reason.
- Tests: `tests/Feature/PostSlugUniquenessTest.php` (8).

### Retitling a post changes its URL (28 July 2026)

`PostsController::editPost` regenerates `posts.slug` whenever the title changes, and the JSON response carries the new `slug`/`url` so the composer can move the browser to it (`router.visit(..., {replace: true})` — the old address is the same post, not a separate history entry).

- **`post_slug_history`** (migration `2026_07_28_000001`: `post_id`, unique `slug`) keeps every retired slug, and `showPostDetail` answers a retired slug with a **301** to the current one. Without it, retitling would 404 every link already shared and everything already indexed — which the sitemap and canonical work assume stays valid.
- `Post::generateUniqueSlug($title, $ignoreId)` takes the post to exclude from the uniqueness check; without it a retitled post collided with its own current slug and came out as `my-post-1`.
- A slug being reused from an earlier edit is removed from the history table on save, or the live URL would redirect to itself.
- ⚠️ An edit sets `approved = 0`, so the new URL is owner-only until it clears review — a guest hitting it gets a 404 by design, exactly like any unapproved post.

### A locked post says how much is inside (28 July 2026)

⚠️ **`UserProfileService` stripped `content` and `image` from a locked post but NOT `media`** — so every locked multi-image post shipped the Uploadcare uuids of its paid photos in the page payload, and anyone could open them straight off the CDN. `stripLockedMedia()` is now the one place that hides a locked post's content, and it nulls `media` too.

What replaces the files is a count: `locked_image_count` / `locked_video_count` render on the locked panel as "3 photos · 1 video". Telling a visitor what they would be buying is the whole job of that screen — and it costs no file.

### Post media carousel (28 July 2026)

`Components/PostMediaCarousel.jsx` is the one implementation for the feed card, the post detail page and the composer's preview — swipe, arrows, dots, `n/N` counter, arrow keys; video via `LazyVideo` (no autoplay, `preload="none"`).

- ⚠️ **`-/quality/85/` is not a valid Uploadcare operation** — the CDN answers **400**, so every multi-image post rendered a broken thumbnail. Quality takes named values; `mediaSrc()` uses `-/format/jpeg/-/quality/smart/` and leaves a uuid that already carries operations (AI-watermarked images) alone.
- The counter sits **bottom-right**: the card's audience badge owns the top-right corner and the two overlapped.
- The composer preview renders the same card frame + carousel + `formatPostContent`, so what the creator previews is what publishes.
- ⚠️ **A dead `setRewardImage("")` call** left over from an earlier refactor threw a ReferenceError inside `AddPost`'s success handler, which landed in `.catch()`: the post saved (server answered 200) but the modal stayed open with a generic error. That was the "update works but the popup never closes" bug. An edit now `router.reload()`s in place instead of jumping to the profile feed.
- The **waiting-for-approval** notice is a chip on the image (`⏳ In review`), not a four-line block above it — it is a status, not the content.

### Post detail page (`/{username}/post/{slug}`) — design + SEO

Route `post.show` → `PostsController::showPostDetail` → `feed/PostDetail.jsx`. Two-column on `lg` (post + sticky rail), single column on mobile.

- ⚠️ **This page opts OUT of the house neo-brutalist frame** (client direction, 27 July 2026), like the leaderboard: no black borders, no offset shadows. Separation is white panels on the cream page plus space; the `rounded-box`/`rounded-box-sm` radius tokens still apply. Each audience owns an accent (`AUDIENCE` map — support pink / members violet / subscribers olive / public green) used on the badge, the locked panel and its CTA.
- **The locked panel is the page's main job for a visitor** — audience chip, what-it-is, one CTA. It carries the class **`paywalled-content`**, referenced by the page's JSON-LD; renaming it breaks that contract.
- **SEO is server-side, via `App\SeoMeta` in `applyPostDetailSeo()`** — link unfurlers (X, Facebook, WhatsApp, Slack, iMessage) never run the page's JS, so an Inertia `<Head>` would leave every shared post with the generic site card. Emits title/description/canonical/robots, OpenGraph `article` (+`article:published_time`/`modified_time`/`author`), Twitter `summary_large_image`, `SocialMediaPosting` JSON-LD with `interactionStatistic`, and a breadcrumb.
- ⚠️ **Meta is built from the post AFTER `checkPostAccessAndLockStatus()` has nulled `content`/`image` on a locked post**, so paid content can never leak through a description or an `og:image` — a locked post falls back to the creator's avatar. Google's paywall markup (`isAccessibleForFree: false` + `hasPart` → `.paywalled-content`) is what keeps the teaser from reading as cloaking.
- **A post awaiting moderation, or one on a suspended/hidden profile, is `noindex,follow`** — reachable by its owner, never indexed. The sitemap filter must agree with this rule.
- **Posts sitemap:** `SitemapController::posts()` at `/seo/sitemap-posts.xml` (+ `/app-sitemap-posts`, `/dynamic-sitemap-posts`, listed in both sitemap indexes). Public + approved posts only, excluding `support_thanks` (near-identical thin pages) and suspended creators — a members-only post renders as a locked teaser, so submitting it sends crawlers to a page with nothing to index.
- ⚠️ **Two pre-existing sitemap faults fixed here:** `max('updated_at')` returns a **string**, and `->toW3cString()` on it fatalled — `/app-sitemap-index` was a 500, so no sub-sitemap was ever discovered (`w3c()` helper). And `users.is_public_profile` **does not exist on this schema**, so the creators sitemap filtered on a missing column and returned an empty urlset behind its own catch (`visibleCreator()` applies it only when `Schema::hasColumn`).

## Support History feed (spennypiggy.co)

`/history` page (`resources/js/Pages/transactions/Transactions.jsx`) + its ajax endpoint `/history-feed` are both served by `ProfileController::buildFinancialTransactionsFeed()`. Each event exposes a **normalized item+reward contract** (one shape for all 7 source types — wish/shop/task/membership/bill/piggy-pot/tip): `item_title`, `open_link` (`/{creatorUsername}?page=<wishes|shop|tasks|memberships|bills|piggy-pots|tips>`), and `reward = { description, media{url,type,name}, file_url, perks[], is_instant }`, plus `certificate_url` and `vat_amount`. The frontend renders one "What you get" / "What you delivered" block from `reward` — do not re-add per-type keys (`wish_content`/`benefits`/`e.wish`/`e.shop` etc. are gone). File UUIDs are CDN-prefixed (`https://ucarecdn.com/<uuid>/`) server-side. Shop `ask_question`/`answer`/`payment_id` retained for the in-card Q&A flow.

## My Purchases / Gifter Hub (spennypiggy.co)

Self-service buyer hub at `/my-purchases` (route `gifter.hub`; ajax `/my-purchases-feed` = `gifter.hub.feed` for media pagination; `/my-purchases-data` = `gifter.hub.data` returns the full 4-section payload as JSON), in the `auth`+`mustHaveToVerify` group in `routes/auth.php`. Served by **`GifterHubController`** → Inertia `gifter/Hub.jsx` (**lowercase `gifter/` — the on-disk folder is lowercase; `Inertia::render('gifter/Hub')` must match it or Vite's case-sensitive glob 404s**). Nav link in `includes/Header.jsx` next to "Support History" (reuses the existing animated `ShoppingBagIcon` from `@animateicons/react/lucide` — do not re-import a lucide-react `ShoppingBag`, it collides). The **buyer is always `Auth::user()`** — unlike the legacy `ProfileController::gifter*` JSON methods, which resolve the buyer from a `{username}` URL param (do not copy them).

**UI:** the hub UI lives in `gifter/PurchasesHub.jsx` (presentational, props-driven, `embedded` flag toggles the page background/hero). Reused in two places: (1) `gifter/Hub.jsx` wraps it in `AuthenticatedLayout` for the standalone page; (2) `gifter/GifterPurchasesTab.jsx` self-fetches `/my-purchases-data` and renders it embedded as an **owner-only "Purchases" tab** on the gifter profile (`gifter/Gifter.jsx`, gated by `isOwner = auth.user.id === user.id` so subscriptions/spending stay private — never shown to other profile visitors). Design follows the profile's neo-brutalist system (mint `#A2E4B8` bg, white `border-[3px] border-black shadow-[6px_6px_0px]` cards, `font-black uppercase tracking-widest`, pink `#FF007F` accents); motion via `framer-motion`, all gated by `useReducedMotion()`.

**Earned-status parity (important):** a `TaskPurchase` counts as earned ONLY when its status is in `['completed','completed_accepted','paid_out']` — a `delivered` task is still in escrow until the buyer accepts (or auto-confirm runs). This exact list is used by `FinancialService::getSummary`, `PayoutService` (`calculatePayouts`/`getHeldReserves`/`getUpcomingPayoutPreview`), `ReleaseReserves`, AND the `/history` feed's `is_included_in_totals` flag — keep them in sync or the feed will claim money is counted that the dashboard and payout exclude.

**Surfaced backends + relationship layer (gifter UX upgrade):** the hub payload also carries `supporter_status`, `receipts`, `incoming`, `creators` (added to `index`/`data` via `surfaced()`):
- **Supporter VIP status** — `App\Services\VipScoreService::for($user)` returns `{score, level (Bronze→Diamond), color, icon, next_level, to_next, progress, breakdown, totals}`. It is the **single source of truth**: the scoring formula `min(40,spendGBP)+min(30,gifts×2)+min(20,creators×4)+min(10,types×2)+recency` lives in `VipScoreService::scoreFromTotals()` and the tier thresholds in `VipScoreService::tier()` — **both** the per-user `for()` and `LeaderBoardController::vipSupporters()`/`getVipLevel()` call these statics, so the gifter's tier and the public leaderboard can never drift. (Same last-90-day window, six paid sources, refund/dispute exclusion via `financial_transactions`.) Rendered as a tier chip + progress bar in the hero. To change scoring, edit the two statics only.
- **Receipts** (certificate wallet) — `Deliverable.certificate_url` (gifter_id) + `TipGoalsPayment.certificate_url` (user_id), capped 80 each; new **Receipts** tab with download links.
- **Incoming** (delivery tracking) — `Deliverable` rows `whereNotIn status [delivered,refunded]`; **Incoming** tab appears only when non-empty; shows courier/tracking (shop) or SLA `due_at`/overdue (task). Overdue = `due_at` past + not delivered.
- **Creators** rollup — per-creator aggregate (total spent GBP, purchase count, active subs, `support_story_url`), new **Creators** tab.
- **Subscriptions tab lists active AND ended** — `buildSubscriptions()` keeps the latest row per membership/bill regardless of state and flags `is_active`; ended ones render an "Ended" chip with no renewal date and no Cancel action (previously they were dropped, so a cancelled purchase vanished from the hub). `buildIncoming()` is capped at 80 like receipts.
- **Renewing-soon** banner (subs charging ≤7 days) + **inline cancel** (POST `/subscriptions/{raw_id}/cancel` = `SubscriptionsController::cancelSubscriptionById`, optimistic local removal) + **buy-again** links. Subscriptions carry `raw_id` + `cancelable`.
- **Pre-renewal reminder** — `renewals:notify` command (`NotifyUpcomingRenewals`, scheduled daily 09:45) pushes a MagicBell heads-up (`Helpers::sendNotification`) a few days (`--days`, default 3) before an active Bill/Membership auto-renews — filling the "warn me before the charge" gap (the old `SendRenewMail` only fires *after*). Dedup via new nullable `renewal_reminded_for` datetime on `bill_payments` + `membership_payments` (migration `2026_06_25_000000`) = the `upcoming_payment` last reminded, so each renewal cycle fires exactly once; when the sub renews and `upcoming_payment` advances, the next window reminds again. Active filter: `status=paid` + `recurring_for=continue` + `stripe_id` set + `end` null/future. Supports `--dry-run`.
- **Currency**: hub uses a request-cached rate map (`convert()`) instead of per-row `Helpers::priceFormat` (avoids 2 DB hits/row in the spend + creators loops).
- **Save-for-later** — `saved_items` table (`user_id`, `product_type`, `item_id`, unique together; migration `2026_06_25_010000`), `SavedItem` model (`TYPES` = wish/shop/membership/bill/piggypot/task). `SavedItemController`: `POST /saved/toggle` (`saved.toggle`, body `{product_type,item_id}` → `{saved:bool}`) and `GET /saved/mine` (`saved.mine` → ids grouped by type, for marking browse buttons active). Hub **Saved** tab via `buildSaved()` (bulk-loads referenced items per type, resolves title+creator, skips deleted/invalid). Reusable **`Components/SaveButton.jsx`** (heart toggle, optimistic, CSRF-aware axios) — drop onto any item card: `<SaveButton productType="wish" itemId={id} initialSaved={item.is_saved} />`. Wired into `wishlist/Wishlistbox.jsx` (gifter-only, `!isCreator`). NOTE: browse surfaces don't yet preload `is_saved` per item (defaults false) — pass `is_saved` from the controller, or call `/saved/mine` once per page, to pre-light hearts. Distinct from Follow (social) — this is buy-later intent.

### Hub rebuild — four tabs, server-side search, real actions (27 July 2026)

The hub had grown to **eight tabs** whose search lied and whose only actions were "open the creator's profile". Rebuilt around what the buyer is actually asking:

- **Four tabs** (`TABS` in `PurchasesHub.jsx`): **Library** (Media · Access passes) · **Orders** (In progress · Subscriptions) · **Money** (spend timeline + where-it-went + creators rollup + receipts + CSV export) · **Saved**. Sub-views are a segmented control (`ViewSwitch`), not more tabs. The old Creators tab became a **creator filter** in the toolbar that persists across tabs ("show me everything from @x") — deliberately NOT cleared on tab switch.
- ⚠️ **Media search/filter/sort run SERVER-side** (`GifterHubController::applyMediaQuery`, served by `feed()` and applied by `index()` too). The library paginates 30/page, so the old client-side filter only ever saw the loaded page and reported "no matches" for anything further in — its own button said "Load more to search further". `feed()` returns `total_matched`; `media_types` carries whole-library type counts so filter chips and the tab count stay honest when the page is opened on a filtered URL. Every other list is complete in memory and still filters client-side.
- **URL sync** (`?tab=&view=&creator=&q=`, `history.replaceState`, skipped when `embedded`). ⚠️ The per-view tool reset must skip its first run (`firstViewRun` ref) or a shared `?q=` link clears itself on arrival.
- **Landing tab is `orders` when any delivery is overdue** — the one thing on the page needing action used to sit behind the media grid.
- **A cancelled subscription STAYS in the list.** Cancel is at-period-end, so the row shows "Access until <date> · no further charges" plus **Resume**; the old code removed it optimistically, which read as "my access is gone". New `POST /subscriptions/{id}/resume` (`subscriptions.resume` → `SubscriptionsController::resumeSubscriptionById`) clears `cancel_at_period_end` locally and on Stripe via new `StripeControl::uncancelSubscription()` — **distinct from `resumeSubscription()`, which clears a `pause_collection` set by the posting-cadence enforcer**. Membership/bill cancel handlers now return JSON when `expectsJson` (the hub calls them over axios). `subscriptionRow()` is the single builder for both types and emits `is_canceling`/`resumable`/`ends_at`/`last_charge_at`.
- **Orders carry real actions:** a delivered Paid Task can be **accepted from the hub** (`task_uuid` + `can_accept` from `buildIncoming`, POSTs `task.review-proof` — escrow release, so it goes through a confirm dialog), and every row has "Problem with this?" which opens a `support.tickets.store` ticket prefilled with the creator + deliverable. Authorization is unchanged: `TaskController::reviewProof` still checks `Auth::id() === $purchase->supporter_id`.
- **`GET /my-purchases-export`** (`gifter.hub.export`) streams a purchase CSV — creators had an earnings statement, buyers had nothing. Amounts are emitted twice (as charged + converted), and ⚠️ every free-text cell goes through `csvSafe()`, which prefixes `=`/`+`/`-`/`@` so another user's item title can't execute as a formula in Excel/Sheets.
- **Saved items carry `price` + `unavailable_reason`** (`shopUnavailable()` reads `slot_limitation` as remaining stock, plus suspended/unapproved) — a buy-later list with neither can't be acted on.
- **`spend_summary` gained `by_month`** (rolling 12, zero-seeded so a quiet month is a zero bar not a gap) and `last_month`, rendered as a bar timeline with a vs-last-month delta.
- **Video tiles use the real poster** via `useVideoPoster(media_url, owner.avatar)`; the lightbox passes `LazyVideo fallback=` only. It previously showed the creator's avatar in the grid and passed the **raw video URL as `posterSrc`** — the one thing the video-poster section forbids.
- `RowCard` is the shared row (avatar/tile + title + @creator + meta + actions + right rail) for all five list views, which had drifted apart. Hero mosaic is `lg:`-only and stats are a 3-up row — on a phone the old hero filled the fold before any content. Every empty state now offers "Find creators" instead of dead-ending. Native `confirm`/`alert` replaced by `ConfirmDialog`/`ReportDialog`/`Toast`. "New since last visit" badges come from `localStorage` (`spenny_hub_seen_at`) — no migration, nothing personal stored server-side.
- Tests: `tests/Feature/GifterHubMediaQueryTest.php` (search/filter/sort/reindexing of `applyMediaQuery`).

**Profile consolidation:** the owner profile (`gifter/Gifter.jsx`) was reduced from 7 tabs to **About / Feed / Purchases** — the redundant Memberships/Gifts/Tips/Media tabs (now covered by the hub) were removed; the `gifter-*` JSON endpoints stay for viewing *other* users' profiles. The `?tab=` deep-link `categories` array tracks the new owner tab set.

Four sections from one `loadSources()` fetch (wish/shop/task/piggypot/tip/membership/bill rows for the buyer):
- **media_library** (paginated, 30/pg via the `feed` endpoint): one card per media-bearing purchase. Media read from the *item*, not the payment row — wish `WishItem.content_file_url` (fallback `reward_url`), shop `Shop.reward_file_url`, task `Task.deliverable_content` (instant) / `TaskPurchase.proof_content['file']` (custom), piggypot `PiggyPot.content_file` (bare UUID → server-prefixed). `media_kind` resolved from real MIME, else task enum (`voice`→audio), else URL extension. **Video uses `LazyVideo`; `poster_url` is null** (LazyVideo resolves the real poster client-side — never pass a raw video URL as a poster).
- **subscriptions**: active recurring entitlements only — `MembershipPayment`+`BillPayment` where `status=paid` AND `recurring_for='continue'` AND (`end` null or future); latest row kept per `membership_id`/`bills_id`. Bills surface `content_file_url`.
- **unlocked**: one-time content entitlements (wish/shop/task/piggypot) + tips. One-time purchases grant **lifetime** access (`is_active=true`, `expires_at=null`).
- **spend_summary**: gross spend (`total_paid` ?: `amount`) per type + total + this-month + counts, each converted to the buyer's `default_currency` via **`\App\Helpers::priceFormat($from, $amount, $to)`** (wish currency comes from `payment->currency`; `StripePaymentItems` has none).

Excluded rows are filtered by `paidOk()` (blocks refunded/failed/cancelled/disputed/expired/pending/initiated/processing/unpaid; empty status passes for legacy line items). All copy stays content-compliant (no gift/tip/donation/fundraise — tips shown as "Piggy Bank").

## Earnings Statements & Persistent Login (spennypiggy.co)

**One-Click Earnings Statements:** `GET /financial/statement/download` (`financial.statement.download`, auth group) — params `period` (`month` YYYY-MM / `tax_year` / `custom` from+to ≤366 days) + `format` (`pdf`/`csv`). `CreatorFinancialController::downloadStatement()` + helpers; totals reuse `FinancialService::getSummary()` (single source of truth — statement always equals dashboard), refunds line is its own query (income FTs `status=refunded`, net+vat, `Helpers::priceFormat` conversion), payout dates from `PayoutRecord` by creator uuid. PDF via `barryvdh/laravel-dompdf` (^3.1, pure PHP, Vapor-safe), template `resources/views/pdf/earnings-statement.blade.php` (tables-only CSS, escaped `{{ }}` only). Transactions capped 500 rows (truncation flagged). UI: `StatementDownloadCard.jsx` in the Dashboard Records section. Month parse pitfall: always `createFromFormat('Y-m-d', $month.'-01')` — bare `'Y-m'` inherits the current day and overflows short months. Legacy `exportCsv` (tax-year CSV) + `generateIncomeStatement` (printable page) intentionally untouched.

**Persistent login:** `config/session.php` `lifetime` is **hard-coded 10080** (7 days) with an explanatory comment — deliberately NOT env-driven; don't revert to `env('SESSION_LIFETIME')`. Login page has a Remember-me checkbox (`Login.jsx`) → `LoginRequest` already passed `remember` to `Auth::attempt`; `verify2FA()` also honours `$request->boolean('remember')` (defaults false — 2FA OTP form doesn't forward it yet, known follow-up).

**Gotchas fixed (keep):** `User::creating` casts uuid to string (`(string) Uuid::uuid4()`) — Ramsey object in-memory broke same-request `array[$user->uuid]` lookups; migration `2026_06_24_000000_add_discovery_performance_indexes.php` has an sqlite branch in `indexExists()` (MySQL `information_schema` query killed the whole sqlite test suite).

## PWA first-launch onboarding (spennypiggy.co)

Installed-PWA-only intro carousel that makes the app feel native instead of dropping the user on the homepage cold. **Client-only, no backend/route/DB.**

- **Gate lives in `resources/js/utils/pwaInstall.js`:** `isStandalone()` (display-mode:standalone OR iOS `navigator.standalone`), `shouldShowOnboarding()` (standalone AND `localStorage` flag unset), `markOnboardingSeen()`, `resetOnboarding()`. Flag key is **versioned** — `spenny_onboarding_seen_v1` — bump the suffix to re-onboard installed users on a major feature drop.
- **`Components/Onboarding/OnboardingOverlay.jsx`** — self-gating (`return null` unless `shouldShowOnboarding()`), mounted as a sibling of `<App>` in `app.jsx` `setup()` so it overlays every page **without blocking** load (app renders underneath). 4 swipe slides (framer-motion, `useReducedMotion`), Skip/Next/Back/Get-started, progress dots; `min-h-dvh`, safe-area insets, ≥44px controls, `rounded-box`/`rounded-box-sm`.
- **`Components/Onboarding/slides.js`** — slide copy (welcome + Piggy Pot/Wishlist + Shop/Paid Requests + Purchases/Support History). Content-compliant (no gift/tip/donation/fundraise). Edit here to change slides.
- Shows once per install (finish OR skip both set the flag). Browser/desktop never see it. No SW/manifest change; ships with the normal Vite build.

## 🚨 Every rendered image is width-capped (14 Aug 2026, spennypiggy.co)

**A browser holds a DECODED BITMAP, not the file. Cost is `width × height × 4`
bytes whatever the JPEG weighs.** A 4032×3024 phone photo is **48 MB of RAM**,
and a creator profile renders a grid of them plus an avatar and a cover. Ten
uncapped images is ~490 MB — which is how iOS came to kill the Safari tab on a
profile the moment the user switched apps. **It returns as a BLACK SCREEN with
no error anywhere**, because the process the page was running in is gone: no JS
exception, nothing in Sentry, not reproducible on desktop.

`App\Support\MediaUrl` is the ONE place the caps are defined —
`THUMB_WIDTH` 800 (item cards) · `AVATAR_WIDTH` 400 · `COVER_WIDTH` 1600 ·
`POST_WIDTH` 1200. Build a URL with `MediaUrl::thumb($uuid, $width)`, or append
`MediaUrl::fitOps($width)` after an existing crop modifier.

- 🚨 **`-/format/jpeg/` CONVERTS, it does not downscale.** For a long time it
  was the only operation on these URLs, so every item thumbnail, avatar and post
  image was served at the creator's original camera resolution. `User::cover_url`
  with no crop modifier was worse still — a bare `ucarecdn.com/{uuid}/` with no
  operations at all, meaning no cap *and* no format conversion, so a HEIC cover
  rendered nothing.
- ⚠️ **`-/preview/WxW/`, NEVER `-/resize/Wx/`.** Both cap a large image
  identically, but `resize` **upscales** anything smaller than the target — a
  200px thumbnail stretched to 800px costs 16× the memory the cap exists to
  save. `preview` only ever scales down and preserves aspect ratio.
- Ops apply in sequence, so the order is crop modifier → cap → format → quality
  → `-/overlay/` watermark. Verified against the live CDN: chained previews
  (`-/preview/-/preview/400x400/`), a crop chain, and the watermark appended
  after a cap all answer **200**.
- ⚠️ **`resources/js/Components/PostMediaCarousel.jsx`'s `IMAGE_OPS` mirrors
  `POST_WIDTH`** — a multi-image post is composed client-side from bare uuids
  and never passes through the PHP accessor. Change both.
- 🚨 **A paid reward file is NEVER capped.** `reward_url` / `content_file_url`
  are what the buyer paid for; downscaling them degrades the product. Same rule
  that keeps the watermark off them.
- ⚠️ **Still uncapped, and deliberately left alone:** `piggy_pots.cover_media`
  and `tasks.media_url` store a FULL URL rather than a uuid, and that stored
  string is re-posted by the add/edit forms and by `ListingDuplicator` — an
  accessor that appended ops would see the capped URL saved back as the source,
  a permanent quality loss. Cap those at the payload/render layer, using
  `ItemShareService::uuidFromUrl()` to recover the uuid.
- ⚠️ Pre-existing and still live: `Post::getResponsiveImageData()` and
  `Shop::getResponsiveImageData()` emit `-/quality/85/`, an invalid Uploadcare
  operation the CDN answers **400** to. Only `OptimizeImages` reads them.
- ⚠️ `resources/css/core-web-vitals.css` is **dead** — `content-visibility`,
  `will-change`, `contain: paint` and the rest have **0 usages** across
  `resources/js`. Ruled out as a cause; do not chase it.
- Tests: `tests/Unit/ItemWatermarkAccessorTest.php`,
  `tests/javascript/mediaSrc.test.js`. Both assert through `MediaUrl::thumb()` /
  the shared `IMAGE_OPS` const rather than a hardcoded URL, so changing a cap
  does not fail them.

## 🚨 A push that reaches nobody is recorded as `sent` (14 Aug 2026, spennypiggy.co)

Reported by a creator: three approval **emails** arrived, no push. They were signed out of
the installed app. **Nothing anywhere could tell** — push is registered entirely client-side
(MagicBell's `WebPushClient({ userEmail }).subscribe()` in the bell component), and MagicBell
answers **200** because it accepted the notification, whether or not any device exists to
receive it. `Helpers::sendNotification` therefore succeeds, `notification_logs` records
`sent`, and a creator can go months without a single alert about a sale, a moderation hold or
a payout.

**`App\Support\PushReachability` is the ONE answer to "can we still confirm this person
receives push?"** — read by the heartbeat endpoint, the reminder sweep and the delivery log.

- 🚨 **CONSENT IS NOT DELIVERY.** `users.push_notifications_enabled` records that someone
  WANTS pushes and says nothing about whether a device exists. They are different columns
  answering different questions; never read one for the other.
- 🚨 **This service NEVER asserts push is broken.** A MagicBell subscription lives in the
  browser and at MagicBell — it does **not** die when our Laravel session expires — so a stale
  heartbeat means "we have not been able to CONFIRM it", a much weaker claim. Every piece of
  copy built on it is worded as an unconfirmed state, never as a failure. ⚠️ Nothing here may
  suppress a send: every push still goes to MagicBell whatever this says.
- **Columns** (migration `2026_08_14_000000`, all nullable + guarded, none in `$fillable` —
  derived state written with `forceFill`): `push_verified_at` (indexed) · `push_permission_state`
  · `push_reminded_at`. NULL means "never heard from this browser", which is where every
  existing row starts.
- 🚨 **PERMISSION IS NOT A SUBSCRIPTION.** A browser can report `granted` and never have
  completed `subscribe()`, leaving MagicBell with no device. `POST /push/heartbeat` takes
  `subscribed` (bool) **and** `permission` separately, and **only `subscribed` stamps
  `push_verified_at`** — treating `granted` alone as confirmation is the false positive that
  would email people whose push works while staying silent about those it does not.
- ⚠️ **`isLive()` fails OPTIMISTIC on an unselected column.** A missing attribute is null,
  indistinguishable from "never confirmed", and every surface here either nags someone or
  marks their log row. Same reasoning as `User::profileMediaVisible()`.
- ⚠️ **`denied` and `unsupported` outrank staleness and are excluded from the sweep**, not
  merely worded around — neither is fixed by opening the app, so an email would be noise.
  `default` (never asked) IS remindable.
- **`push:remind-stale`** (daily 09:20, `--max` caps creators EMAILED not examined,
  `--dry-run`) → `App\Mail\PushAlertsNeedChecking`. ⚠️ **EMAIL ONLY, deliberately** — sending
  this by push is circular, and the bell is read only by someone already in the app, which is
  the exact act that refreshes the heartbeat and makes the message unnecessary.
- ⚠️ **A creator who missed NOTHING is left alone** (`missedSomething()` reads
  `notification_logs` for a `sent` push since their last confirmation). Being told your
  notifications are broken when nothing was sent is noise. It fails OPEN — "we cannot tell"
  is not "nothing happened", and silently dropping every candidate would make the command
  look like it works while reaching nobody.
- ⚠️ **The claim is the UPDATE** (`where push_reminded_at < cutoff` → set now), so two workers
  cannot both send; a failed send **releases** it to the previous value, never to null — a
  creator reminded last month must not become eligible again today because one SMTP call blew
  up. `REMIND_EVERY_DAYS` 30, `STALE_DAYS` 14 (double the 7-day session lifetime, so tripping
  it means genuinely not having been back).
- **Client: `resources/js/utils/pushHeartbeat.js`**, called on every mount of the bell
  component and forced right after a successful `subscribe()`. ⚠️ Reported on EVERY mount, not
  only when the enable-banner shows — the banner is suppressed for anyone who dismissed it,
  and those are precisely the accounts whose subscription may have lapsed. Self-throttled to
  `HEARTBEAT_THROTTLE_HOURS` (6) **unless the answer changed**, since someone who just revoked
  or restored permission is the case this exists to catch.
- ⚠️ **The command guards on `Schema::hasColumn`** — it is scheduled, so on an environment
  where the migration has not landed an unguarded run would throw into Sentry daily for a
  condition that is not a fault.
- Tests: `tests/Feature/PushReachabilityTest.php` (15).

## The bottom bar owns its own height (14 Aug 2026, spennypiggy.co)

`Layouts/BottomBar.jsx` + `resources/css/retro-bottombar.css`. Redesigned to read as a
real app tab bar on iOS and Android: **labelled tabs** (Home · Basket · (+) · Discover ·
Account), the active state as a squircle pill **inside** the bar, and a hairline top rule
in place of the 3px slab.

The colour system is unchanged and is still the point — **yellow = where you are, mint =
the one action, squircle = a place, circle = an action**. The bar's problem was never its
palette, it was geometry: the active tab used to HANG OFF the top rule (flat top, no top
border, a negative margin that had to stay exactly equal to the bar's padding, clipped by
`overflow: hidden` if it drifted by a pixel), which is what made it read as unfinished.

- 🚨 **`--sp-bottombar-h` is the ONE definition of the bar's height, and it is a `calc`,
  not a typed number.** THREE things clear the bar — the page's bottom padding, the
  Intercom launcher and the open messenger's `max-height` — and they were three unrelated
  magic numbers (80 / 96 / 132) that had to be re-derived by hand on every change. All
  three now derive from it.
- 🚨 **The row height is ASSERTED (`height: var(--sp-bottombar-row)`), never left to add up
  from padding + icon + label, and `padding` carries `!important`.**
  `retro-enhancements.css` was setting `.retro-nav-button { padding: 10px 8px }` at the
  **same specificity** and a **later `@import`** (see the top of `app.css` — this file is
  imported at line 2, so almost any other stylesheet beats it on source order alone). The
  bar therefore rendered 6px taller than the file defining it claimed, and every clearance
  below it was short by the difference, silently. That override is deleted.
- ⚠️ **The 1px top rule counts toward the painted height.** The bar sets no explicit
  height, and `box-sizing` only applies once one is set — so the border adds on. Measured:
  6 + 56 + 6 + 1 = **69px**, plus the safe-area inset, which each consumer adds because it
  is a property of the device rather than of the bar.
- 🚨 **Deleted from `retro-enhancements.css`: `body { padding-bottom: 80px }` on every
  mobile page.** It was unconditional, so it also applied to logged-out screens where
  there is no bar at all — 80px of dead space at the foot of every guest page.
  `body:has(.retro-bottom-bar) main` already does this, and only when the bar exists.
  ⚠️ That selector needs a `<main>`; both `AuthenticatedLayout` and `GuestLayout` have one,
  and it beats `AuthenticatedLayout`'s own `pb-28` on specificity.
- **The pill is a `::before`, inset 6px, so the TAP TARGET stays edge-to-edge** while the
  indicator keeps its proportions. The docblock's original rule holds — targets tile the
  full width because the gaps between islands are dead space your thumb still aims at —
  and the visible pill no longer has to obey it.
- **Labels, because two glyphs here are both person-shaped** (your page, your account) and
  are indistinguishable without them. Both iOS HIG and Material 3 label their tabs.
  ⚠️ **The add button stays unlabelled deliberately** — the circle already says "do
  something" where every squircle says "go somewhere", and a fifth word flattens that.
- ⚠️ **Contrast measured, not assumed:** the inactive label is `rgba(0,0,0,.85)` on pink =
  **5.09:1**, which clears AA for 10px text; the old `.7` was 4.15:1 — fine for a glyph,
  under AA the moment a label exists. Black on the yellow pill is **16.4:1**, so the pill
  is not decoration, it is what makes the current tab the most legible thing on the bar.
- ⚠️ **The basket badge was sized for the old 26px glyph.** At 20px it sat 8.5px from the
  top rule and read as clipped; it is 16px with a 2-digit-safe `min-w`, 12.5px clear.
- The bar's own rules are unchanged and still hold: **no `box-shadow` anywhere in this
  file**, **no scale on press** (opacity and brightness only), brand pink in both themes
  with no `prefers-color-scheme` block, and the safe-area inset living *inside* the bar as
  padding.
- Verified in a browser against the **compiled** `public/build/css/app-*.css` served from
  `public/` as web root (a harness with its own CSS lies — the documented trap): 69px at
  390px and 320px, no horizontal overflow, no label clipped, smallest tap target 48px,
  0 shadows, 0 scale classes.

## Video autoplay & lazy posters (spennypiggy.co)

**No video autoplays anywhere** and every `<video>` uses `preload="none"` — the browser fetches **zero** video bytes until the user clicks play. This was the fix for runaway Uploadcare bandwidth bills (autoplay was eagerly downloading videos sitewide). Do not re-add `autoPlay` or `preload="metadata"/"auto"` to user-facing video.

**Real posters (lazy, generic, cached):** posters are generated from the source video via the Uploadcare `thumbs` conversion op and cached in the new `video_posters` table (`source_uuid` unique, `poster_uuid`, `poster_token`, `status` = pending/processing/ready/failed, `attempts`), keyed by source UUID so one table serves every video surface (no poster columns on posts/shop/bills/wish/etc).
- `Uploadcare::generatePoster($uuid)` → `convert/video/` path `{uuid}/video/-/thumbs~1/0/` (returns thumbnails-group UUID + job token). NOTE: `generateThumb()` makes a video *clip*, not a still — use `generatePoster()` for posters. Poster URL = `{poster_uuid}/nth/0/` (`VideoPoster::url()`).
- `App\Jobs\GenerateVideoPoster` (queued, re-dispatches itself to poll, caps at 6 polls → `failed`): stores the thumbnails-group UUID upfront, poll only confirms the conversion finished; never flips to `ready` without a `poster_uuid`.
- Endpoint `POST /video-posters` (`VideoPosterController@resolve`, public, `throttle:60,1`): body `{uuids: []}` (≤50), returns `{posters: {uuid: url|null}}`; `firstOrCreate` + dispatch on miss (covers existing videos, no upload-path changes). Page load does **no** synchronous Uploadcare HTTP (unlike the legacy `UserIntro::getPosterUrlAttribute()` which blocks — do not copy that pattern).
- Frontend: `resources/js/Components/LazyVideo.jsx` (drop-in `<video>` with `preload="none"` + lazy poster, `fallback` = creator avatar) backed by `resources/js/utils/videoPoster.js` (`useVideoPoster` hook + batched fetch, bounded in-memory LRU cache). Public feeds use `LazyVideo`; intros already carry a real `poster_url` via `UserIntro`.
- ⚠️ **The Discover "Intro Videos" rail (`Pages/discover/IntrosVideos.jsx`) was calling the blocking `poster_url` accessor per intro.** `WishitemController::discover_all_creators` mapped `'poster_url' => $intro->poster_url` for **up to 30 rows/page**, each a synchronous 3s Uploadcare round-trip (+ `generateThumb` when empty) — the whole rail took tens of seconds to load. Fixed: it now calls the existing `UserIntro::posterUrlNonBlocking()` (returns the stored poster instantly or `null` + warms it on the queue, avatar fallback client-side). The rail also **defers its fetch until it scrolls near the viewport** (IntersectionObserver, 300px margin) so it never competes with the initial Discover load, and its skeleton is a dark `animate-pulse` matching the final card. Needs `queue:work` for posters to warm.

### 🚨 The intro card renders on every profile tab — its data must too (14 Aug 2026)

The verification-video card moved out of the About tab into the sticky identity rail
(31 July 2026) and now renders on **every** page of the profile. Its loader did not
move: `AuthenticatedSessionController::getUserProfile` built the `intro` prop inside
`if ($page == 'about')`. Publishing a post navigates to `?page=feed`
(`AddPost.jsx`), so **a creator's own verification video silently turned back into an
empty "Add Verification Video" card the moment they posted** — on Wishes, Shop and
every other tab too. Nothing was deleted; the row was never sent to the page.

- ⚠️ **`AddIntro` reads the `intro` PAGE PROP, never `user.intro`** (so does
  `ProfileSteps`, which embeds it). Any gate deciding whether to render it must read
  the same prop. `Dashboard.jsx` gated on `user?.intro?.approved`, and that relation
  is eager-loaded in **one rare Stripe-resync branch** (`UserProfileService` ~:1433) —
  so it is `undefined` on virtually every load and **an approved intro was invisible
  to every visitor, on every tab including About.** Gate and card now read one prop.
- 🚨 **`UserIntro::$appends` carries `poster_url`, and that accessor makes a
  SYNCHRONOUS Uploadcare request** (3s timeout, plus a `generateThumb` + save when no
  poster exists yet). Survivable on one tab; on every tab it is a blocking round trip
  on every profile page load. The controller therefore `setAppends(['perma_link'])`
  and supplies `poster_url` from **`UserIntro::posterUrlNonBlocking()`** — the same
  path the Discover intros rail takes. ⚠️ It is serialised with `toArray()`
  deliberately: writing the value back onto the MODEL lands it in `$attributes`, where
  Laravel re-applies the accessor on `toArray()` and the blocking call happens anyway.
  Consequence: needs `queue:work` to warm a missing poster, and the card falls back to
  the creator's avatar until it does. Line above ("intros already carry a real
  `poster_url` via `UserIntro`") is true of Discover only, no longer of the profile.
- ⚠️ **`user_intros` had FIVE columns declared by no migration** — `poster`,
  `poster_token`, `width`, `height`, `duration`, all read and written by the model and
  by `ProfileController` — and `content` was declared NOT NULL while **nothing has ever
  written it** (both intro save paths set only uuid/user_id/height/width). Every
  deployed database is fine; one built from migrations alone came out with a table the
  app cannot insert into, **which is why the intro paths had no test — they could not
  run.** Declared by `2026_08_14_000000`, guarded, `down()` empty; the `content`
  nullable change is itself guarded on the column actually being NOT NULL, so an
  environment that is already correct takes no ALTER at all. Same class of gap as
  `users.role`, `users.cover_approved` and `shops.status`.
- Tests: `tests/Feature/ProfileIntroPropTest.php` (8) — the intro surviving every tab,
  gate and card reading one prop, a creator with no intro sending null, and **no
  outbound Uploadcare request during the render** (`Http::preventStrayRequests()`).
  ⚠️ It calls `Cache::flush()` in `setUp`: `RefreshDatabase` resets the database and
  does not touch the cache, the profile payload is cached as
  `profile_page_data_{userId}_…` with its version token cached ~30s under the same id,
  and every test here starts from an empty table so its creator is id 1 — one test was
  intermittently served the previous test's payload for a user that no longer existed
  and the whole file failed with a bare 500. An artefact of ids repeating, which cannot
  happen in production.

## Creator attribution watermark (13 Aug 2026, spennypiggy.co)

Full write-up: `docs/implementations/CREATOR_WATERMARK.md` (the four scoping
decisions, the CDN probes behind the dimensions rule, how to enable and roll back,
the review findings, and what is still unwired). The rules below are the
load-bearing ones.

Stamps the creator's profile URL onto **public preview images** via Uploadcare's
`-/overlay/`. `App\Support\MediaUrl` is the ONE place a watermark reaches a URL.

🚨 **Attribution, NOT piracy protection.** The operation lives in the URL, so
`ucarecdn.com/<uuid>/` still returns the clean original to anyone. Do not let it
be sold internally as anti-piracy — real protection needs Uploadcare secure
delivery plus blocking unsigned originals, which was scoped out (client decision).

**Ships DISABLED** — `MEDIA_WATERMARK_ENABLED` (default false), `config/media.php`.
Each overlay creates a new derived asset per variant and this platform has already
had one runaway Uploadcare bandwidth bill, so enable after a cost check.

### What it can never touch

- 🚨 **Video.** Uploadcare video conversion supports size/quality/format/cut/thumbs
  and **has no overlay of any kind** (checked against their docs). `-/overlay/` on a
  video uuid is silently ignored, which reads as a broken feature rather than an
  unsupported file — hence the guards on both sides.
- SVG (CDN operations are ignored on it), PDF/zip/audio/documents.
- **The paid reward file a buyer downloads** — watermarking what someone paid for
  degrades the product. `reward_body` / `content_file` are not wired.
- Avatars, covers, preset banners, and the wish fallback placeholder
  `901c0a0e-e5de-4d7a-8ac3-de11a4632542` (a PLATFORM image, not that creator's work).
- Generated thank-you images, whose stored `posts.image` already carries its own
  `/-/text/` + `/-/font/` operations — ⚠️ **that column is not always a bare uuid.**

### 🚨 Uploadcare overlay dimensions MUST be two-dimensional

Verified against the live CDN, and it cost a real 400 during implementation:

| URL | Result |
|---|---|
| `-/overlay/<uuid>/34p/` | 200 |
| `-/overlay/<uuid>/34p/4p,92p/45p/` | **400** *"Failed to parse remainder"* |
| `-/overlay/<uuid>/34px34p/4p,90p/45p/` | 200 |

A one-dimensional size parses on its own but makes the CDN reject the
**coordinates that follow it**, 400ing the whole image. `MediaUrl` validates each
of the three arguments against the exact shape that works
(`OPS_DIMENSIONS`/`OPS_COORDINATES`/`OPS_OPACITY`) rather than a loose charset, so
a bad config value yields an unwatermarked image and never a broken URL. **Do not
relax `OPS_DIMENSIONS` to allow a bare `34p`.**

### Everything fails OPEN

`MediaUrl::watermark($url, $uuid)` returns its input **byte-for-byte** unless every
check passes. `false`/`null` are meaningful ("this item has no image") and survive
untouched. Feature off → identical output, asserted by test.

### 🚨 The flag gates the SPEND and the SCHEMA, not just the pixels

Two things would otherwise happen the moment this deploys, both with the feature
switched off — the one state that must change nothing:

- **`MediaUrl::ownerColumn()`** returns `,watermark_uuid` only while the feature is
  on, and the ~16 owner eager-loads in `UserProfileService` / `DiscoveryService`
  are built with it. Naming the column unconditionally would throw an
  unknown-column error on **every Discover query and every profile listing** in the
  window between the code landing and the migration running. It also keeps the
  payload shape identical: an unselected column cannot appear as a new JSON key.
  Verified live — flag off, `watermark_uuid` never reaches SQL; flag on, it does.
- **Rendering uploads a file to Uploadcare per creator.** The daily sweep, the job
  and both `User` hooks all return early unless the feature is enabled, so the day
  this deploys it spends nothing on images nothing will stamp. `--force` is the
  deliberate pre-warm escape hatch.

⚠️ The trade: enabling the flag *before* running the migration errors. Enabling is
a manual step (migrate → pre-warm → switch on), not something a deploy does.

### 🚨 No relation, no query, no watermark

`App\Models\Concerns\HasCreatorWatermark` reads the owner relation **only when it
is already loaded**. `User` carries ~15 appended accessors, several of which query,
so eager-loading it purely for a watermark is the documented 206-query blow-up on
a paginated feed. Consequence, and it is intended: to watermark a surface,
eager-load its owner **and** add `watermark_uuid` to that surface's column list —
an unselected column is null, and null means no watermark.

- Shops/wishes already load the owner, so `watermark_uuid` was appended to those
  `user:id,name,username,…` selects in `UserProfileService` + `DiscoveryService`.
- **Posts deliberately do NOT load the owner.** `UserProfileService::stampWatermark()`
  does one memoised scalar lookup per creator instead and sets
  `creatorWatermarkOverride` (feeds the server `image_url` accessor, single-image
  posts) plus a serialised `watermark_ops` (feeds the client carousel, multi-image
  posts). Both surfaces exist, so both are answered from the one lookup.

### Columns, jobs, commands

- Migration `2026_08_13_000100`: `users.watermark_uuid` + `watermark_for_username`,
  both nullable. ⚠️ **Neither is `$fillable`** — derived, written with `forceFill`.
- 🚨 **Deploy order: migration BEFORE code.** The owner selects now name
  `watermark_uuid`; without the column those queries error.
- `App\Services\CreatorWatermarkService` renders the PNG with **GD + FreeType**
  (font `resources/assets/fonts/legacy/CeraGRMedium.ttf`) and uploads it. ⚠️ A
  generated PNG, deliberately **not** Uploadcare's `-/text/` operation — text
  overlay is **disabled by default on every Uploadcare project and needs their
  sales team to switch it on**, an external dependency with no timeline.
- `App\Jobs\GenerateCreatorWatermark` (one-shot, `RetriesCriticalWork`). Creators
  only (`role = 1`).
- **`watermarks:generate`** (`--user` `--max` `--force` `--sync` `--dry-run`),
  scheduled **daily 03:20**. `--max` caps creators QUEUED, not examined. ⚠️ It is a
  no-op while the feature is off unless `--force` is passed — see the spend gate
  above. **Pre-warm every creator BEFORE flipping the flag** so nobody sees a
  half-stamped site: `watermarks:generate --force --sync`.
- ⚠️ **A rename makes the PNG WRONG, not stale** — it prints a profile URL that
  then 404s. `User::updated` re-renders on a `username` change, and the daily sweep
  compares `watermark_for_username` against the live handle **because the admin app
  shares this database but not this code**, so a handle changed from the back
  office fires no event here. `User::created` covers a brand-new creator, who would
  otherwise serve unwatermarked previews until the next daily sweep — up to 24h,
  and they can publish within the hour.
- Frontend: `mediaSrc(media, { watermarkOps })` in `PostMediaCarousel.jsx`. JS never
  composes the geometry — it validates the server's `User::watermark_ops` string
  and drops a malformed one. ⚠️ Fixed in passing: `mediaSrc` guarded on
  `media.isVideo` only, so a video declaring itself through `mimeType` alone was
  already being handed `-/format/jpeg/`; it now uses `isVideoItem()`.
- Tests: `tests/Unit/MediaUrlWatermarkTest.php` (13),
  `tests/Unit/ItemWatermarkAccessorTest.php` (10),
  `tests/Feature/CreatorWatermarkGenerationTest.php` (9 — nothing reaches
  Uploadcare while the feature is off, `--force` still pre-warms, new creator
  queued, supporter never, rename re-renders),
  `tests/javascript/mediaSrc.test.js` (8).

⚠️ **Still live and unfixed:** `-/quality/85/` in `Post::getResponsiveImageData()`
and `Shop::getResponsiveImageData()` (6 spots) — an invalid operation the CDN 400s.
Only `OptimizeImages` reads them, so it was left out of this change's blast radius.

## A creator can hide their total earned (14 Aug 2026, spennypiggy.co)

`users.show_piggy_bank` is the ONE definition of whether a creator's earnings figures are
public, read through **`UserProfileService::earningsVisibleTo(User $creator)`**. The owner
always sees their own — a placeholder on their own screen reads as "the data failed to
load", the same rule `User::profileMediaVisible()` follows.

🚨 **This was NOT a missing feature — it was a broken one.** The toggle has shipped in
account settings since long before this work, labelled *"Show earnings goal on profile"*,
and `TipJar/MyGoal.jsx` has honoured it since it shipped. Three newer surfaces did not:
`Components/Profile/EarningsMilestone.jsx` (the big bar on the profile), the "Total earned"
row + progress bar in `ProfileRightRail.jsx`, and `GET /user/tip/goal/{username}` itself.
So creators who had already switched it off were still publishing the number, and the
stored value described nothing a visitor actually saw.

- 🚨 **The gate is SERVER-SIDE, on the endpoint as well as the payload.**
  `/user/tip/goal/{username}` is public and unauthenticated, so gating the component alone
  leaves the figure one curl away. Hidden responses carry `{hidden: true, percent}` and
  **no `fullfilled`, `target` or `currency` key at all** — omitted, not zeroed.
- **Hidden keeps the bar and the percentage, drops the money** (client decision, 14 Aug
  2026). The milestone still reads as progress; only the amount goes.
  ⚠️ `EarningsMilestone`'s `complete` must be derived from `pct` when hidden — the old
  `remaining <= 0` reads 0 against absent figures and reported every hidden creator as
  having met their goal.
- ⚠️ **`overviewForViewer()` redacts at the CALL SITE, never inside the cached closure.**
  `profile_overview_v1_*` is one entry per creator shared by every viewer; baking the
  viewer into the key would multiply it by every visitor. Both callers
  (`AuthenticatedSessionController::getUserProfile`, `OptimizedProfileController`) wrap
  `getProfileOverview()` in it. Hidden replaces `earned`/`earned_target` with
  `earnings_hidden` + `earned_percent`.
- ⚠️ **`piggyBankSetting` must forget `user_earnings_v2_{id}` AND `profile_overview_v1_{id}`.**
  `clearUserCaches()` does not cover them and both live 600s, so without this a creator
  turns the toggle off and the figure stays public for up to ten minutes.
- 🚨 **The column default was flipped 0 → 1 and existing creators backfilled to visible**
  (migration `2026_08_14_000100`, client decision). It shipped defaulting to **0**, so
  honouring it as-is would have hidden the figure on most creator profiles overnight —
  a platform-wide change nobody asked for. Nothing visibly changes on deploy; a creator
  opts OUT deliberately. ⚠️ Its `down()` reverses the default only — it cannot tell a row
  it wrote from one a creator has since turned off.
  ⚠️ **Raw `ALTER … MODIFY`, MySQL-guarded — NOT `$table->tinyInteger()->change()`**, which
  routes through Doctrine DBAL, has no `tinyinteger` type registered, and throws *Unknown
  column type "tinyinteger" requested* inside every `RefreshDatabase` boot — taking the
  whole suite down, not just the migration. Same pattern as `2026_07_13_000003`.
- ⚠️ **`User::$attributes` now mirrors the column default** (`show_piggy_bank => 1`). A DB
  default is not applied to a just-created in-memory model, so without it a creator read
  back in the same request answers null and is silently hidden without ever choosing it.
  Same trap as `CreatorMetric::risk_level`.
- 🚨 **Fixed in passing: `ProfileRightRail` hardcoded `currency: "GBP"`** in its own `gbp()`
  formatter while the value it renders is in the creator's `default_currency` — a USD
  creator's $80 rendered as **£80**. It reads `PriceFormat`'s `formatMultiPrice` now, like
  every other money figure on the profile.
- **What this is NOT:** unrelated to the leaderboard (which ranks by supporter reach, never
  money) and unrelated to `leaderboard_opt_out`. Neither affects this figure.
- ⚠️ **The figure itself is sales value, not the ledger.** `getUserEarnings()` sums six
  payment tables where `status = 'paid'` — it is not `financial_transactions`, not net, and
  not what was paid out, so it is legitimately higher than the creator's own earnings
  dashboard. It also `->sum('amount')` with no currency grouping, and a partially refunded
  row keeps `paid` and counts in full. Not changed here; flagged to the client.
- Tests: `tests/Feature/EarningsVisibilityTest.php` (6). ⚠️ The fixture is **£250 against
  the £1,000 rung (25%)**, deliberately not £50/50% — under £100 the ladder's first rung is
  £100, so the amount and the percentage are the same number and the "amount never reaches
  the body" assertion passes on the percentage, proving nothing.

## Supporter profile — the card, and what is public (2026-08-12, spennypiggy.co)

A supporter (`role = 0`) profile had no answer to "who is this and what have they done".
Two new props on the profile payload, both built by `UserProfileService` and both
**About-page only** — the other tabs never read them.

### `gifter_stats` — public

`getGifterStats($userId)` → engagement `vip` payload (level, icon, colour, progress,
`next_level`, `to_next`, `window_days`) plus lifetime `purchases`, `creators`, `since`,
`member_since`.

🚨 **NO MONEY LEAVES THE SERVER.** `VipScoreService::for()` returns spend, so the method
`unset()`s `totals.amount_gbp` and `breakdown.spend` before returning. The engagement Level
is already public (leaderboard, every creator's supporter wall); the spend behind it is not,
and a public profile is the one surface where it could reach anyone holding the URL. Counts
only — which is also the platform rule that supporters rank by purchase count, never amount.

- **UI: `Components/Gifter/SupporterLevel.jsx`** renders it as an actual membership CARD, not
  a dashboard panel. The product already ships that metaphor (`ActivateCard`,
  `GifterCardVerification`, `users.gifter_card_verification`), so the profile hero is a card
  object: tier foil down the left edge, level in a punched disc, `MEMBER SINCE` / `NO.`
  footer. `NO.` is `user.id` zero-padded — signup order, real information, not an ornament.
  Surface is `#12131A`, the house's existing premium black (the Founder banner uses it for
  the same reason), and the tier colour comes from `VipScoreService::TIERS`, so the card, the
  leaderboard badge and every supporter wall show one person in one colour.
- **Badges are earned facts, never aspirational copy** — Supporter (≥1 unlock) · Regular
  (≥10) · Multi-creator (≥3 creators) · Explorer (≥3 kinds) · Founder. None earned = no strip.
- 🚨 **Removed: a fabricated "Your Exclusive Benefits" grid** — six invented perks (Zero Wait
  Time, Exclusive Badges, Creator Access, Impact Tracking, Private Feed, Custom Flair), none
  of which are real features, occupying the largest block on the page. Also removed the bio
  placeholder *"The overall effect is both humbling and inspiring in its clarity."*, which
  was rendered to real users on their own profile.

### `gifter_creators` — OWNER ONLY

🚨 `getGifterCreators($userId)` is gated in the controller on `Auth::id() === $user->id` and
**must stay that way unless it is a deliberate product decision.** Each edge is already
public from the other side (a creator's page lists its own supporters; the leaderboard lists
VIPs), but collecting every creator one person buys from onto a single page is a different
exposure — a taste profile, on a platform hosting adult-adjacent work, that the supporter
never opted into. The public card shows the COUNT; only the owner sees who.

- ⚠️ **Read `avatar_url`, never build the CDN string.** That accessor checks
  `avatar_approved`, so a hand-built URL would serve unapproved avatars — the query selects
  `avatar`, `avatar_approved` and `avatar_cdn_modifier` for it.
- ⚠️ **A suspended creator keeps its tile but loses its link** (their page answers 410).
  Silently dropping them would erase a purchase the supporter actually made.
- 3 queries, batched — never one per creator. UI: `Components/Gifter/CreatorsBacked.jsx`.

### Gifter tabs match the creator profile

`Gifter.jsx`'s tab strip mirrors `InstantTabSystem`'s structure and classes (left-aligned,
flush with the content column), and **all three panels share `max-w-4xl`** — About was `4xl`,
Feed `700px` and Purchases unbounded, so the page width jumped on every tab switch.

⚠️ **`ActivateCard` returns null unless verification is needed, and an empty wrapper still
applies its own margin** — a phantom 16px above the tabs on every normal profile. Its
wrapper carries `empty:hidden [&:not(:empty)]:mb-4`.

## The activity card only exists once there is money to stop (2026-08-12, spennypiggy.co)

`CreatorActivityWidget` is gated on **Stripe connected AND identity verified**
(`stripe_details_submitted == 1 && identity_status == 1`), client direction.

⚠️ It previously ran for every creator, on the reasoning that the component states its own
"finish verifying" case. But its headline is **"YOUR PAYMENTS ARE PAUSED"**, and a creator
who has not finished Connect has no payments to pause — it reads as a fault on their account
at the exact moment they are being asked to trust the platform with their bank details. The
journey card is what speaks to a creator before this point. **Measured on live data: 31 of 62
creators no longer see it** (29 pre-Connect, 2 Connect-but-unverified).

- **`canSeeActivityCard` is ONE predicate** read by the fetch guard, the effect and the
  render. The fetch guard used to carry the old, looser condition, so `/creator/activity/status`
  fired on every profile load for the largest cohort of creators — the ones who could never
  see the result.
- ⚠️ **It reads `auth.user` directly, NOT `AuthUserStripeConnected`.** That state is declared
  ~500 lines below the effect, and naming it in a dependency array is a temporal-dead-zone
  ReferenceError.
- ⚠️ The effect depends on the predicate itself, so a creator who finishes Connect or clears
  identity mid-session gets the card without a full reload.

## Tab strip overflow — the traps (2026-08-12, spennypiggy.co)

`InstantTabSystem` has seven tabs and does not fit the profile column. It used to clip the
last one, which reads as a broken layout rather than "there is more".

- 🚨 **The scroll arrows are OVERLAID, never laid out.** An arrow that takes layout width
  narrows the strip, which can stop it overflowing, which hides the arrow, which makes it
  overflow again — an oscillation. Absolute positioning over the edge fades avoids any reflow.
- 🚨 **A wheel listener must be registered natively with `{ passive: false }`.** React
  attaches wheel listeners as passive, so `preventDefault()` from an `onWheel` prop is
  ignored and the vertical-wheel-scrolls-sideways behaviour silently does nothing. It also
  leaves a genuine horizontal gesture alone and never hijacks the page scroll when nothing
  overflows — that hijack IS the "scrolling is difficult" complaint, since shift+wheel is the
  only other way and nobody discovers it.
- ⚠️ **`ResizeObserver` watches the CONTAINER, so a content-width change never fires it** —
  and the display face is a late-loading webfont. On first paint the tabs measure with the
  fallback, fit, and the arrow is never shown; the real font then lands and they overflow in
  silence. Re-measure on `document.fonts.ready`.
- The edge fade is the page's own mint (`#A2E4B8`), so the strip dissolves into the page. The
  active tab is scrolled into view on mount and on change — reloading on the last tab used to
  leave the current tab off-screen.

⚠️ **Item cards in a grid are already equal height; what breaks a row is INTERNAL.**
`wishlist/Wishlistbox.jsx` let its title wrap freely, so a two-line name pushed that card's
price, CTA and byline out of step with its neighbours. Titles now reserve two lines
(`line-clamp-2 min-h-[45px]` — `text-lg` × `leading-tight` × 2), and the CTA block carries
`mt-auto` so the button and byline pin to the card floor whatever optional blocks rendered
above them.

## The creator app is built from `Components/UI` (14 Aug 2026, spennypiggy.co)

Five primitives, so a creator screen is assembled rather than hand-drawn. Before them the same
card was rewritten per page with a different border width, radius and one of 25 shadow values,
which is why panels meant to read as siblings did not. The no-shadow rule and the black-on-pink
rule both live in the root `CLAUDE.md` — not repeated here.

⚠️ **There is no shadow token in `tokens.js`, deliberately** — nothing to reach for. `Panel`
takes `emphasis` (`quiet` / `normal` / `strong` = border weight) where it used to take
`elevate`, and its exported `PRESS` is brightness plus a 2px translate.

- **`tokens.js`** — `ACCENT` (the four brand hues **and what each one MEANS**: pink money and
  primary action · mint earned/settled · violet pending/scheduled · yellow needs attention),
  `GROUND`, `TYPE`, `ON_ACCENT`. ⚠️ Every value is a **literal** class string or hex: Tailwind's
  JIT emits nothing for `bg-[${accent}]`, so anything driven by a runtime value is an inline
  `style`. ONE accent per section — a screen where every panel has its own colour has none.
- **`Panel.jsx`** — the card (`tone` paper/ink/accent, `accent`, `elevate`, `pad`) plus the
  exported `PRESS` idiom, which moves an element INTO its own shadow on `:active`. A coloured
  offset **replaces** the black one; drawing both reads as a printing misregistration.
- **`StatStrip.jsx`** — the signature: figures that **abut**, the hairline being the black parent
  showing through `gap-px`, never a border per tile (adjacent borders double up). It is the
  argument the screen makes — money arrives from many places and is one balance. ⚠️ An odd tile
  count spans two columns or the parent shows through as a solid black block; handled inside, so
  no caller has to remember it. ⚠️ `SPAN` is written longhand — `md:col-span-${cols}` emits no
  CSS. ⚠️ `key` is destructured OUT of the spread (React errors on a spread `key`), and a
  skeleton tile's empty-string label is not nullish, so `label ?? i` keyed every one of them to
  `""`.
- **`RowGroup.jsx` / `Row`** — a list whose rows share hairlines (`divide-y`) inside one frame.
  🚨 The right-hand column is `shrink-0 whitespace-nowrap tabular-nums` and the title side
  `min-w-0`: an unconstrained right column is what broke these rows at 390px, breaking the meta
  phrase mid-way while the creator's NAME truncated beside a handle that still fitted.
- **`SectionHead.jsx`** — eyebrow, title, action, accent rule. The accent is on the eyebrow and
  the rule, never on the display type.
- **`Chip.jsx`** — ⚠️ the tinted form takes a DARKENED text colour, not the raw accent (raw pink
  on its own 10% tint is under AA); `danger` is for a genuine failure, never for "worse than last
  month".

### `/earnings` rebuilt on it, and three faults it was hiding

- 🚨 **`LeaderBoardController::graphData()` 500'd for any creator with Piggy Pot income** —
  `$labelKey()` can return `Piggy_Pots` and the `$monthData` seed had no such key, so
  "Undefined array key" killed the whole monthly-revenue chart on the first such transaction. A
  creator whose only income is pots never saw the chart at all. Seeded, and the accumulate is
  `?? 0` so a future label costs that source its bar rather than the chart.
- 🚨 **`MonthlyRevenue.jsx` drew 5 of the 8 series the endpoint returns** — Piggy_Pots, Shops and
  Subscriptions were never plotted, so those creators read a flat chart and concluded they had
  earned nothing. `SERIES` is now one definition read by both the legend and the lines; the
  legend used to map its own colours with a ternary chain while each `<Line>` repeated the hex.
  ⚠️ Brand yellow is a 1.4:1 stroke on white — Wishes keeps the darker olive `#BEC50F`.
- ⚠️ **Five `text-black/60` elements sat on the page's own `bg-black` hero** — the subtitle, two
  figures and the period buttons were invisible on the live page. And `shadow-[4px_4px_0px_0px_#FF007F]xl`
  was not a class at all, so that panel had no shadow.
- The seven "performance breakdown" cards shared one shell but five off-palette accent families
  (emerald/amber/indigo/purple/blue) for their chips. One frame, one chip, one heading now — the
  card's title already says what it is, so the coloured word was noise.
- ⚠️ `RefreshRecordsButton` already sets `min-h-[44px]`, `text-sm`, `font-poppins` and
  `rounded-box-sm`; a second value for any of those is a conflicting-utility pair that
  `npm run check` fails the build on. Pass frame and colour only.

**`Components/Dashboard/DashboardHero.jsx`** was a gradient band with a 60px diffuse glow and
glass tiles — the only surface on the creator screens drawn in a second elevation language. It is
now an ink block with an accent offset and a joined stat strip under a rule; **props unchanged**,
so its three callers needed no edit. `accent="ink"` still means "no colour on this one" and
borrows mint.

## Item cards: one column on a phone, status notices in flow (14 Aug 2026, spennypiggy.co)

Two faults, both on the creator's own profile, both reported from a phone.

### 🚨 A sellable item card is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

The wish grid (`Pages/Dashboard.jsx`) and the shop grid
(`Pages/shop/profile/ProfileProductLists.jsx`) opened at **two columns on every
width**. A card of that family carries a title, a price, a reward line, a delivery
note and a CTA — at ~170px each of those wraps to two or three lines, so `US$100.00`
filled the card, `EXCLUSIVE CONTENT · INSTANT DOWNLOAD` ran to three lines, and the
whole thing read as broken text rather than as a product. The second column starts at
`sm` (640px).

⚠️ The task, bill and membership lists were **already** `grid-cols-1 md:grid-cols-2`
and were left alone — this was two grids out of step with the rest, not a new rule.

### 🚨 A status notice is NEVER absolutely positioned over the thumbnail

`ShopCard.jsx` stacked three of them — SUSPENDED, "Waiting for approval / Under
review" + `moderation_reason`, and "Admin requested changes" + `edited_reason` — at
hand-tuned `top-2` / `top-12` / `top-16` offsets. Those offsets can only ever separate
**two**, and every one of the three carries an admin-written reason of arbitrary
length, so a suspended item with both reasons drew all three on the same pixels, over
the `DIGITAL`/`PHYSICAL` badge and through the product title. They are now a
`flex flex-col gap-2` block **above** the image: it costs vertical space and cannot
overlap, whatever the copy says. `hasStatusNotice` gates the wrapper so a healthy card
does not carry its bottom margin.

- ⚠️ **`MADE WITH AI` and `RewardHint` were both pinned to `bottom-2 left-2`** and drew
  on top of each other on every AI-generated listing. The AI badge moved to top-right
  (the type badge owns top-left); **`RewardHint` moved into the content flow** — it is
  product information whose text is creator-written and of unknown length, and over the
  image it truncated to "You get: …", which says nothing.
- **`wishlist/Wishlistbox.jsx`: the drag handle and the action buttons (save + kebab)
  now live inside the IMAGE box, not on the card.** Anchored to the card they sat at
  `top-4` — the same pixels as the first status message in flow above the image — so on
  any wish awaiting approval the move icon and the kebab were drawn straight through
  the admin's reason text. Its suspend banner left `absolute top-18` for normal flow for
  the same reason.
- 🚨 The rule generalises: **anything anchored to a card rather than to the thing it
  labels will collide the moment an optional block renders above it.** Overlay only what
  describes the PICTURE (type badge, sold-out veil, AI mark); everything else is flow.

### The My Listings chip strip scrolls like the profile tab strip

`Creator/Catalogue/Index.jsx`'s eight filter chips overflowed, clipped the last one, and
showed a **native horizontal scrollbar running the full page width** — which reads as a
broken page, and was reported as "a scrollbar in the window". It now carries the same
affordance as `InstantTabSystem`: `no-scrollbar`, gradient edge fades in the page's own
`gray-50`, overlaid arrow buttons, `ResizeObserver` + `document.fonts.ready`
re-measurement, and vertical-wheel-scrolls-sideways.

- 🚨 Every trap documented on `InstantTabSystem` applies here and is repeated in the
  code comments — the wheel listener must be **registered natively with
  `{ passive: false }`** (React attaches wheel listeners as passive, so
  `preventDefault()` from an `onWheel` prop is ignored and the whole thing silently does
  nothing), and the arrows are **overlaid, never laid out** (an arrow that takes layout
  width narrows the strip, which can stop it overflowing, which hides the arrow, which
  makes it overflow again).
- ⚠️ **`.no-scrollbar` is the utility to use** — it is defined in `resources/css/home.css`,
  which `app.jsx` imports globally. `.scrollbar-hide` lives in `tabbed-dashboard.css`,
  which is **not** globally imported.
- ⚠️ **The horizontal padding is on the INNER flex, not on the scroller.** A `w-max` child
  inside a padded scroll container drops the container's trailing padding, so the last
  chip ends flush against the edge.
- 🚨 Fixing this hit the documented `{/* … */}` trap again: inside a ternary's
  parenthesised branch it is an **object literal**, not a comment, and it fails the whole
  Vite build (`Expected ")" but found "className"`). Put the comment above the ternary.

## The installed app's launch screen (14 Aug 2026, spennypiggy.co)

Three layers cover a cold start, and they are one field on purpose — brand pink
`#FF007F` ground, mint/yellow blocks, a violet arc, the icon tile, the `gulfs`
wordmark. **`App\Support\PwaSplash` is the ONE definition** of which devices are
supported and what each one's file is called; it renders the `<link>` tags AND
feeds the artwork generator, so the two cannot drift.

| Layer | What draws it |
|---|---|
| Android / Chrome | `background_color` + the 512 icon. **Flat colour only** — it cannot carry artwork. |
| iOS | `apple-touch-startup-image` PNGs, `resources/proxy/splash/`, served by the `ios.splash` route |
| Both, after that | `#initial-loading-screen` in `app.blade.php` — CSS, one image, no assets |

### 🚨 What was broken before this

- **Every `apple-touch-startup-image` pointed at `apple-touch-icon.png` (512x512).**
  iOS matches a startup image on EXACT device pixel dimensions and ignores a tag
  whose image is not that size — it does not scale it and it does not fall back —
  so the whole set was inert and **the installed app launched to a blank screen**.
- 🚨 **`/apple-touch-icon.png` answered 404 in production** (measured) while every
  sibling icon resolved: a file under `public/` is not served on the app domain and
  this one had no proxy route. That is the iOS home-screen icon *and* the 180x180
  entry in `site.webmanifest`, so an installed app carried a blank tile. It also
  shipped as a **512 declared as 180**; it is a real 180 now, asserted by test.
- ⚠️ **`/siteicon.png` 404s for the same reason**, and it was the old loading
  screen's logo — so every installed user saw a broken image on every launch. It
  was also the `msapplication-TileImage`. **Never reference a bare `public/` path
  from this file; read a routed one.**
- ⚠️ **`config/laravelpwa.php`'s `splash` block is DEAD** (`@laravelPWA` is
  commented out and the vendor meta view is included nowhere), and every entry was
  `/siteicon.png`. Left pointing at the real route so re-wiring it cannot silently
  reinstate a broken set.

### `background_color` IS the Android splash

`#FF007F` in **three** places that must move together — `resources/proxy/manifest.json`,
`resources/proxy/site.webmanifest` and `config/laravelpwa.php`. Two values means the
installed app flashes a different colour depending on which manifest was read;
`PwaLaunchScreenTest` asserts all three agree.

⚠️ **`html, body` stay `#000000`.** Only the manifest colour changed. The rule about
keeping them in agreement still holds for the *page*; what closes the gap here is
that the in-app launch screen paints pink with the document's first paint, so there
is no black flash between the OS splash and the app.

### The in-app screen

- **The id `initial-loading-screen` is load-bearing** — `app.jsx` adds `app-loaded`
  and then removes the element, and the boot watchdog further down the blade hides
  it by id at 8s. Neither can be renamed away, and the watchdog is what guarantees a
  failed boot can never trap someone behind it.
- ⚠️ **No longer excluded on marketing routes.** It used to sit inside
  `@unless($isMarketingRoute)` and the manifest's `start_url` **is `/`** — so it
  never rendered on a cold start of the installed app, the only moment it exists for.
- **Gating is `html.sp-standalone`**, stamped from the existing standalone-detection
  IIFE in `<head>` before `<body>` is parsed. A browser visitor never renders it, and
  the `<img>` inside is never fetched because the element is `display: none`.
- 🚨 **NEVER `#initial-loading-screen span`.** That selector carries id specificity,
  so it beat every later class rule: the two wordmark lines and the dot row were
  turned into absolutely-positioned black-bordered circles, and both words drew on
  the same pixels inside an ellipse. Shapes are a named class list.
- ⚠️ **The base unit is `min(100vw, 55vh)`, not viewport width** — the same U the
  generator uses. A width-relative type scale is ~27% too large for the height a
  tablet has and collides with the violet field. The wordmark size is `--w` and the
  tagline/arc positions derive from it, so the stack cannot fall out of step.
- ⚠️ `line-height` is a **ratio** (`0.92`). Numeric line-heights are remapped to
  PIXELS by this project's Tailwind config, and the same mistake in raw CSS reads as
  text on top of itself.
- Black type on pink (5.56:1 vs white's 3.78:1), no `box-shadow`, no scale on
  anything, and every animation is dropped under `prefers-reduced-motion`.

### Regenerating the artwork — `npm run pwa:splash`

`scripts/build-pwa-splash.mjs`. Needs `rsvg-convert` + `magick` on PATH; deliberately
**not** part of `npm run build` — a deploy should not depend on two native binaries.
19 portrait files, **0.76 MB total**.

- **The design is FLAT on purpose.** It matches the app's own language, and a flat
  PNG at 1290x2796 quantises to ~47 KB where the same size as a smooth gradient is
  hundreds. These ship inside the Lambda.
- ⚠️ **Portrait only** — the manifest declares `orientation: portrait`, and a
  landscape set would double the payload. iOS shows nothing in landscape; accepted.
- ⚠️ **librsvg on macOS does not honour `FONTCONFIG_FILE`**, so `font-family` inside
  the SVG silently falls back to a system sans. Shapes come from `rsvg-convert`; TEXT
  is drawn afterwards by ImageMagick with an explicit TTF path. Do not move it back.
- ⚠️ ImageMagick `-pointsize` and CSS `font-size` do **not** give the same cap height
  for `gulfs` — the two layers were matched by measuring rendered width (~60% of U
  for the longer word), not by sharing a number.

### ⚠️ Two verification traps this hit, both of which faked a bug

- **A browser harness must resolve the built stylesheet from `public/build/css/`,
  never a hardcoded content hash.** The hash changed mid-session, the link 404'd, and
  the wordmark rendered in a fallback face — which reads exactly like the brand font
  failing to load. Same class as the documented "a harness with its own CSS lies".
- **Headless Chrome clamps its window width (~500px), so a `--screenshot` taken at a
  narrower `--window-size` is a CROP, not a render.** That crop made the wordmark
  look edge-to-edge and produced a "fix" that shrank the type by a third. Measure
  text with a `Range` and read the numbers; do not size type off a screenshot.

Tests: `tests/Feature/PwaLaunchScreenTest.php` (8) — every declared device having
artwork at its exact pixel size, the route serving it, an unpublished size and a
traversal attempt both refused, the apple-touch icon served at a real 180, filenames
derived rather than typed, no two devices claiming one media query, and the three
manifests agreeing on the splash colour. ⚠️ It needs `RefreshDatabase`: the routes
serve a static file and touch no model, but they sit in the `web` group, whose
shared Inertia props read the `currencies` table — without a migrated database every
one of them answers 500, including the cases asserting a 404.

## First-launch onboarding continues the launch screen (15 Aug 2026, spennypiggy.co)

`Components/Onboarding/OnboardingOverlay.jsx` + `slides.js` + `SlideMark.jsx`. Same
gate as before (`shouldShowOnboarding()` — installed app only, once per install,
versioned localStorage key), rebuilt so the four slides are the launch screen
continuing rather than a second design.

🚨 **THE FIELD IS THE PROGRESS INDICATOR. There are no dots.** The launch screen
leaves a violet arc risen to ~70% of a pink ground; slide 1 opens with it at 74%
and each slide CLIMBS it (74 → 54 → 32 → 4), so the last slide is fully violet and
hands off to the app on the colour it opened on. `slides.js` `field` values must
stay strictly descending — a test asserts it, because a value out of order is a
progress bar that goes backwards.

### What it replaced

A black overlay with emoji tiles, **three off-palette accents** (`#8B7CFF`,
`#FF9F45`, `#FF5FA2` — none of them brand colours) and a glow `boxShadow`, which
read as a different product from the one that had just launched.

- 🚨 **Emoji are drawn by the OS**, so the same slide looked like a different app on
  iOS, Android and a desktop install — and it is the one element in the flow the
  brand does not control. `SlideMark.jsx` draws four flat outlined marks instead,
  in the launch screen's own language.
- ⚠️ **Yellow is the marks' only fill, on purpose.** Mint is spent entirely on the
  single action and violet is the progress field, so a mark tinted in either would
  compete with the two things that carry meaning.

### 🚨 The field carries NO black outline, unlike the same arc on the launch screen

It travels **through the copy**. A 3px black rule crossing a headline or a
paragraph reads as a rendering fault — it was visibly wrong at the 54% stop. The
pink/violet boundary is its own hard edge, and black type clears AA on both sides,
so dropping the line costs nothing. Keep the outline on the launch screen, where
nothing crosses it, and on the mint circle.

- ⚠️ **The mint circle is declared BEFORE the field.** Both are absolutely
  positioned with no z-index, so paint order is DOM order — declared after, it
  would sit on top and the last slide would show a mint disc floating on violet
  instead of the field having covered it.
- ⚠️ **ALL TYPE IS FULL BLACK.** 5.56:1 on pink, 4.76:1 on violet — both clear AA,
  and both fail the moment an opacity is put on them. Hierarchy is size, weight and
  tracking, which costs no contrast. The overlay it replaced used white on a colour
  that would have measured 3.78:1.
- ⚠️ `border-[#000]`, never `border-black` — `.border-black` is redefined in this
  project as a full `border` shorthand that resets the width to 2px, so a
  `border-[3px] border-black` frame renders at 2px with the 3px discarded silently.
  A test greps the rendered markup for that pair.

### Testing a component that only exists in the installed app

`tests/javascript/onboarding.test.jsx` (14) renders it with `renderToStaticMarkup`
and a stubbed `matchMedia`: the gate, the palette, the descending field, no shadow,
no opacity on type, no emoji, and the content-first vocabulary of every slide (this
copy describes what money buys, so gift/tip/donation wording is banned here as
anywhere else).

- ⚠️ **`setupTests.js` now polyfills `TextEncoder`/`TextDecoder`.** jsdom ships
  neither and `react-dom/server` reads them at IMPORT time, so a test that renders a
  component to markup fails to even load — with an error pointing at its own first
  import line rather than at the missing shim.
- ⚠️ **framer-motion serialises its `initial` variant**, so the slide body is
  `opacity: 0` in static markup. Assert on content, never on visibility, and force
  it when generating a preview.

## Route-change feedback runs everywhere now (15 Aug 2026, spennypiggy.co)

`Components/NavigationProgress.jsx` was gated to the installed app; it runs in every context
(client direction). **Two tiers, deliberately** — Inertia's top bar at 100ms answers a fast
navigation, this veil answers a slow one, and `SHOW_AFTER_MS` differs per context:
**160ms standalone · 280ms browser**, because a browser tab already has the OS tap highlight
and a top bar you can actually see. ⚠️ Neither number may go to 0: a veil that appears on a
40ms navigation and vanishes reads as a flicker, which is worse than no feedback.

- ⚠️ **NProgress's spinner is now OFF** (`app.jsx` `progress.showSpinner`). With the veil in
  every context it had become a second indeterminate indicator for the same wait, in a
  different vocabulary, in the opposite corner. The bar stays.
- 🚨 **No `backdrop-blur` on the veil.** A blur on a full-viewport element is the most
  expensive thing the compositor can be asked for, on the exact frame the app is painting the
  new page — it lengthens the wait it describes. It is also modal vocabulary, and a navigation
  cannot be dismissed. The veil is the house ink `#0B0B0C/70`, fading in over 120ms.
- **The plate is the house device at its smallest** — two cells that ABUT, the hairline being
  the black parent through a `gap-px`, same shape as `StatStrip`. Solid **violet** block +
  white cell with a `gulfs` label and the sweep. Violet because `tokens.js` says violet is
  PENDING; pink would sit between the pink header and the pink bottom bar and read as chrome.
- ⚠️ **`border-[#000]`, never `border-black`** — measured on this plate: `.border-black` is
  redefined in `index.css` as the full shorthand `border: 2px solid var(--black)`, so
  `border-[3px] border-black` rendered at **2px** with the 3px silently discarded. Verified
  3px after the change.
- **Everything animated is opacity or transform**, and all three animations (veil fade, the
  block's pulse, the sweep) are dropped under `prefers-reduced-motion` — the state stays
  legible with nothing moving. Keyframes live in `resources/css/app.css` beside the sweep.
- ⚠️ Still above the bottom bar (999999) and the drawer (1000002) at `z-[1000003]`: the tap
  that started the visit usually came from one of them, so a veil underneath would leave the
  control that was just pressed looking live.
- Verified live at 1440 and 390: plate 235×57 / 207×57, fits the viewport, no horizontal
  overflow, `box-shadow: none`, 0 console errors.

## Mobile chrome pass — bar, launcher, account page, sheets (15 Aug 2026, spennypiggy.co)

Four faults reported off one round of phone screenshots. Each was measured in a browser before
being touched; the traps below are the parts worth keeping.

### The bottom bar's five items were not evenly spaced

`.retro-nav-add` was a 60px island (48px circle + 6px margins) among 78.5px tabs, so the two
INNER gaps were 69.2px against 78.5px outer — the bar read as squeezed in the middle, on every
page, not just the homepage. It is now a full flex slot (`flex: 1 1 0`) with the mint circle drawn
by a centred `::before` at `--sp-bottombar-circle`, the same device `.retro-nav-button::before`
already uses: the visible shape keeps its proportions while the target tiles the row.

- 🚨 **With `flex-basis: 0`, padding is added OUTSIDE the distributed free space.** The first pass
  set `padding: 0` on the action and reproduced the squeeze 5px smaller (75.6 / 75.6 / **71.6**).
  The action's horizontal padding must equal the tabs'.
- ⚠️ **The active marker sat 0.5px under the label's descender**, so the yellow rule read as a
  mis-rendered underline rather than a position marker. `.retro-nav-button` now reserves the
  marker's lane on EVERY item (`padding: 0 2px 7px`), not only the active one — gap is 4px.
- Height arithmetic untouched: 4 + 48 + 4 + 1 = 57, so all three derived clearances still hold.

### 🚨 The Intercom launcher had TWO offsets, and one selector list that stopped matching

Reported as "sometimes far above the bar, sometimes touching it" — a 139px jump whose timing
depended on whether the messenger had booted.

- **`resources/views/app.blade.php` carried a hardcoded
  `.intercom-lightweight-app-launcher { margin-bottom: 90px !important }`** at `max-width: 991px`.
  It STACKED on the derived offset (90 + 69 = 159px up, i.e. 102px clear of the bar), and its
  breakpoint was 224px wider than the bar's own 767px — so on a tablet with no bar it still
  pushed the launcher up. Deleted; a comment now says the offset lives in one place.
- 🚨 **Intercom REPLACES the launcher after boot, and the booted element carries only emotion
  build hashes** — measured live: `intercom-lightweight-app-launcher intercom-launcher` before,
  `intercom-with-namespace-4wz414 edrs4yi0` after. The old list matched nothing post-boot, so
  Intercom's own `bottom: 20px` won and the icon sat 37px INSIDE the bar, over the ACCOUNT tab.
  ⚠️ Match `[class*="intercom-with-namespace"]` — emotion's **label**, authored by Intercom — and
  NEVER the hash, which changes per build. `margin-bottom: 0 !important` is on the rule so a
  stray margin cannot reintroduce the stack.
- Verified: 12px gap on every surface in BOTH states; load → boot → open → close never moves it;
  a bar-less tablet correctly keeps Intercom's default 20px.
- ⚠️ **Still open, a product decision:** the three Support pages hide only the *lightweight*
  launcher, so it reappears after boot. Hiding it properly needs
  `:not(.intercom-messenger-frame)` on the structural selector, or a `.livechat` link opens a
  messenger that is itself hidden.

### 🚨 A flex row's CONTROL absorbs the whole squeeze — `min-w-0` / `shrink-0`

On `/account`, the "Earnings on profile" switch rendered **16px wide against its own `w-11`
(44px)** with the knob 6px OUTSIDE the card. Text cannot shrink below its min-content width and a
flex item shrinks by default, so a long description pushes the entire deficit onto the control.

- ⚠️ The neighbouring "Email Notifications" row has **identical markup** and survives only because
  its subtitle is short — i.e. it is correct by accident of COPY, not of layout. Both rows now
  carry `min-w-0` on the text side and `shrink-0` on the icon tile and the switch.
- **The same gap was in the shared `SettingItem`**, so every icon tile on the page was a squashed
  oval (40–58px against the 60px square it asks for). Fixed at the component — 12 rows at once.
- ⚠️ Pre-existing: both switches were 44×**24**, under the 44px touch floor. An invisible
  `before:-inset-y-[10px]` makes the target 44×44 with the pill visually unchanged.
- **Top spacing** was `pt-8` with NO breakpoint — desktop spacing at every width — stacking on the
  wrapper's `py-6` for 56px of dead grey above the title. `md:pt-8` takes 390px from 58.5 → 26.5px
  and leaves 768/1440 byte-identical.

### Every popup is full screen below `md`

`Sheet.jsx` + `ItemFormShell.jsx` already did this — which is why Piggy Pot, Bills and Membership
were correct while Wish, Shop, Task and the account modals were still windowed cards with a
traffic-light title bar. `Popup.jsx` now goes full-bleed below `md`.

- ⚠️ **`max-h-[80dvh]` inside a `100dvh` panel leaves a dead band** under the content; it is
  `md:`-scoped now. And `pb-[…] md:pb-0` silently stripped the DESKTOP modal's bottom padding —
  it must be `max-md:`. The traffic-light dots are desktop-only: a drawing of a window frame on a
  full-screen sheet re-asserts the metaphor the sheet exists to remove.
- **The wrapper card is frameless below `sm`** in `ItemFormShell` and `PiggyPotModal` — on an
  already-full-screen sheet it was a second frame around the same content, 22px a side.
  ⚠️ Those resets need `!`: `index.css` redefines `.border-black` as a full `border` shorthand
  AFTER the utilities layer, so an unflagged `max-sm:border-0` loses on source order.
- 🚨 **Desktop modal borders went 2px → 3px.** Moving the frame to `md:border-black` means it no
  longer matches the legacy `.border-black` shorthand that was silently resetting the width. The
  source always said `border-[3px]`, so this is the documented intent finally rendering — but it
  is a real 1px delta on every desktop modal, not a no-op.
- 🚨 **`.container` IS NOT TAILWIND'S IN THIS PROJECT** — `home.css` hard-codes
  `padding: 0 20px` on it. `Tasks/Create.jsx` stacked `px-3` + `.container` + the form's own
  `p-6` = **112px of chrome before the first field**: content was 278px of 390 (71%). One 16px
  page gutter and no horizontal form padding below `md` takes it to 358px (92%), and 208 → 288px
  at 320px.
- ⚠️ **Not click-tested: Add a Wish, Shop "New Offering", and the Bills/Membership sheets** — their
  triggers sit behind the identity-verification gate and the test account does not clear it. Their
  geometry is entirely `Popup`/`Sheet`-determined and that was measured on six live modals, but
  they want a click-through on a verified creator account before sign-off.
