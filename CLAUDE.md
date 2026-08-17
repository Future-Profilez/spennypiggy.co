# CLAUDE.md — spennypiggy.co (public platform)

This file loads when Claude Code works with files under this directory. It carries the
guidance specific to **this app only**.

**Read alongside the repository root `../CLAUDE.md`**, which holds the repo layout, the
shared-database rules, the development workflow, the Definition of Done, the UI conventions,
and everything spanning both apps. This file does not repeat any of it.

Guidance for the admin back office lives in `../admin.spennypiggy.co/CLAUDE.md` — do not copy it here.

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

## 🚨 The email approved-list is gone — `EmailDomainPolicy` (16 Aug 2026, both apps)

`App\Support\EmailDomainPolicy` is the ONE decision of whether an address may be registered,
in one order: **override → blocklist → mail server**. Read it from there and nowhere else.

🚨 **`allowed_domains` could not do the job it was written for.** Its stated intent was to keep
throwaway and undeliverable addresses out; an allow-list can only achieve that by refusing every
legitimate custom domain as well. Measured on the live list, it held **six** domains — it
permitted `yopmail.com` (a disposable service) while refusing **Outlook, Hotmail, Proton** and
every creator on their own brand domain, and `gmail.com` was on it, so it stopped no spammer who
wanted in. The seeder ships eleven providers; someone had pruned it to six via the admin screen
and added three internal domains.

- **Blocklist** — `blocked_domains` (migration `2026_08_16_000000`), admin-editable, **~100
  domains**. ⚠️ **`EmailDomainPolicy::BASELINE_BLOCKED` also blocks in code**, so a fresh
  environment is not wide open to every throwaway service at once, silently.
- 🚨 **The table is filled by a MIGRATION (`2026_08_16_000002`), not only by the seeder** —
  **Vapor's deploy hooks run `migrate --force` and never run a seeder**, so left to
  `BlockedDomainSeeder` alone production would come up with the table CREATED AND EMPTY until
  somebody remembered it. Nothing would break (the code baseline still refuses these), which
  is exactly what makes the omission dangerous: the admin screen would read "No domains
  blocked yet" while signups were being refused, and there would be no list to extend. Both
  paths read `BASELINE_BLOCKED`, are idempotent, and **never delete** — a domain an admin
  unblocked deliberately stays unblocked. `2026_08_16_000002` re-prunes the override list
  against the grown baseline, since `000001` only pruned it as it stood.
- **Mail-server check** — `checkdnsrr` MX, cached `MX_TTL` (24h). ⚠️ **An A/AAAA record counts**
  (RFC 5321 implicit MX): a handful of long-standing business domains are set up that way, and
  refusing them recreates the problem this replaces. ⚠️ **FAILS OPEN** — a DNS blip, a slow
  resolver or a host where the function is disabled must never refuse every signup on the
  platform.
- 🚨 **`allowed_domains` is now an always-allow OVERRIDE that BEATS the blocklist.** An admin
  vouching for a partner domain wins over an automated list — which is why migration
  `2026_08_16_000001` **prunes any baseline-blocked domain out of it on release**: carried across
  unchanged, `yopmail.com` sitting there would have become an explicit instruction to permit a
  throwaway service.
- **Three refusals, three messages** (`REASON_DISPOSABLE` / `REASON_NO_MAIL_SERVER` /
  `REASON_MALFORMED`). The old gate answered all of them *"Invalid Email Id."*, which reads as
  "you typed it wrong" — so people retyped a perfectly good business address and left.
- ⚠️ **Enforced at THREE call sites and they must stay in step:** `validateRegistration` (the
  live check), `store()`, and `EmailVerificationNotificationController::changeEmail` — without
  the last, the change-email screen is a way around the signup gate. The **Google path skips it
  entirely**, deliberately: Google has already proved the mailbox receives mail.

### 🚨 Gmail aliasing was the real bulk-signup hole

`jane@gmail.com`, `jane+1@gmail.com` and `j.a.ne@gmail.com` are **one mailbox**. `unique:users,email`
only catches the exact spelling, so all three registered, all three passed the device and IP caps,
and all three received a verification link. Nothing to do with which domains are permitted.

- `normalise()` strips plus-tags everywhere and **dots on Gmail/Googlemail ONLY** — elsewhere a dot
  is a literal character and two addresses differing by one are two different people.
- ⚠️ **The stored address is what the person typed**, never the normalised form. That is what we
  mail and what they recognise; normalisation answers only "is this the same mailbox?".
- `aliasOfExistingAccount()` is scoped to the aliasable providers and to a first-letter prefix, so
  it is a narrow indexed lookup rather than normalising the whole users table.

### `POST /register` had no throttle at all

Now `throttle:10,60`. The device cookie and the 3-accounts-per-IP cap were the only brakes — a
script ignores the first, and the second has **no time window**, so a caller could create accounts
as fast as the server answered. Rate limiting is what actually stops someone hammering the
endpoint; the domain list never could.

⚠️ **Card testing is a CHECKOUT concern and is already covered** — `RiskEngineService` velocity
(3 payments in 10m → STEP_UP/3DS, 5 → COOLDOWN), 1h/24h/7d spend caps, the new-creator daily cap,
guest gates, and all seven checkouts on the `RiskEnforcement` trait. Nothing about an email domain
touches it. ⚠️ `RISK_ENGINE_ENABLED=false` bypasses every one of those by design — confirm it is
not set in production.

Tests: `tests/Feature/EmailDomainPolicyTest.php` (19). ⚠️ Every test pre-seeds the mail-server
verdict in the cache — a suite whose result depends on the network, or on whether a third party's
domain is up today, fails for reasons unrelated to this code. `GoogleSignInTest`'s
`test_the_domain_allowlist_still_applies_without_google` was exactly that: after the gate changed
it kept passing only because `somecompany.com` happens to have no MX, and would have flipped the
day that domain gained one. Rewritten against a disposable domain.

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

## Detailed topic index — load the skill, do not inline this content

The dated feature write-ups that used to sit in this file now live as **skills**: only the
one-line description below is resident, and the full text loads when you invoke the skill.
🚨 **Every prohibition, money rule and Definition-of-Done gate stayed in this file.** If a task
touches one of the topics below, invoke its skill BEFORE writing code — the detail there is the
same text, moved, not rewritten.


- **`spco-creator-subscription`** — spennypiggy.co creator subscription: no charge until first sale, trial and billing state machine, entitlement gates and the pricing page. Load before touching creator billing, subscription status, or anything gated on a paying creator.
- **`spco-creator-onboarding`** — spennypiggy.co creator activation: the creator journey "what do I do next", onboarding step order and one account read, the Stripe action panel, and the first-listing nudge. Load when working on onboarding, Connect status surfaces, or new-creator prompts.
- **`spco-listings`** — spennypiggy.co listings across the six sellable modules: My Listings catalogue, scheduled listings, per-listing analytics, sold-out waitlist, shareable item links, closed Piggy Pots, and the Shop hardening pass. Load when working on creating, scheduling, listing or analysing any sellable item.
- **`spco-checkout-purchase`** — spennypiggy.co buying paths: the unified reward contract (what the supporter gets), membership upsell, abandoned-checkout recovery, guest purchase lookup, the accordion basket, gifter billing address at the £500 gate, customer-facing RiskMessages, and My Purchases / Gifter Hub. Load before touching any checkout, cart, receipt or supporter-facing purchase screen.
- **`spco-auth-signup`** — spennypiggy.co authentication: Sign in with Google, the one-question-per-screen registration rebuild, refused sign-ups captured as leads, login/forgot-password shell, auth throttles and reset hardening, and the server-side verification email. Load when working on register, login, password reset, or email verification.
- **`spco-posts-profile`** — spennypiggy.co creator profile and content: scheduled posts, the composer page, post editing and image-required rules, profile badges, the creator attribution watermark, hiding total earned, the public supporter profile, the activity card, and link-in-bio. Load when working on posts, the composer, profiles or /{username} pages. Also covers the creator announcement card.
- **`spco-pwa-mobile`** — spennypiggy.co installed-app and mobile behaviour: PWA first-launch onboarding, launch screen, route-change feedback, the mobile chrome pass, the service worker route, the install banner, tab-strip overflow, item cards on a phone, and video autoplay/lazy posters. Load when working on PWA, install prompts, the service worker, or mobile layout.
- **`spco-notifications-engagement`** — spennypiggy.co engagement and creator money notices: the engagement engine (reactivation, creator events, milestones, whale alerts), push reachability, payout notifications, and the Revenue Opportunity Centre. Load when working on engagement campaigns, push, payout emails or creator revenue prompts.
- **`spco-site-content`** — spennypiggy.co public and informational surfaces: the Help Centre (/help), the SEO discovery layer, the brand email-signature handover page, the landing page "sells only what is BUILT" rule, Support History, Earnings Statements, and the creator financial dashboard. Load when working on marketing pages, SEO/meta, help articles or the earnings dashboard.
- **`spco-platform-ops`** — spennypiggy.co platform operations: the System Diagnostics screen (severity, history, log redaction) and queue reliability — one-shot jobs must be retryable. Load when working on diagnostics, queued jobs, retries or scheduled commands.
