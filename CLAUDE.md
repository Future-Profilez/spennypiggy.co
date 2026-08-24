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

### Preference categories (July 2026, extended 23 Aug 2026)
Users control each category separately, so turning off promotions does not silence product announcements. `EmailPreferenceController::CATEGORIES` is the list: `product_updates_enabled`, `creator_updates_enabled`, `birthday_emails_enabled`, `reactivation_emails_enabled`, `abandoned_checkout_emails_enabled`, `restock_emails_enabled`, `push_notifications_enabled` (migrations `2026_07_20_000000` / `2026_07_20_000002` / `2026_07_30_000001` / `2026_07_30_100001` / `2026_08_23_300000`, all default true). `marketing_emails_enabled` stays separate because it also stamps `marketing_unsubscribed_at`.

- **Security, legal and transactional mail has no switch by design** — it must always send. Never add one, and never route it through a consent-checking helper.
- **A missing/null preference always means opted IN.** Every read path uses `?? true`; DB defaults aren't applied to a just-created in-memory model, so a strict check would wrongly read as opted-out.
- `updatePreferences` validates every field as `sometimes`, so the page can submit one toggle without clobbering the others.
- **Category-aware unsubscribe:** `generateUnsubscribeToken($user, $category)` signs the category into the link, so an email footer can turn off just that category. Omit the category and it behaves as before. The audit `source` stays exactly `unsubscribe_link` for the marketing opt-out (the admin view/CSV export filters on that literal); category links use `unsubscribe_link:<column>`.
- UI: `resources/js/Pages/EmailPreference/Index.jsx` renders one switch per category plus an always-on explainer card.

### 🚨 Email Preferences & Contact Management Centre (23 Aug 2026)

Developer Master Plan, 19 Aug 2026, §E. Extends the existing system — nothing was rebuilt.

- 🚨 **`EmailPreferenceController::catalogue()` IS THE ONE DEFINITION OF THE CENTRE** — key, title, plain-language description and section, read by both preference pages so the same switch can never be described two ways. A switch that is not in `CATEGORIES` cannot appear in it, and **security/legal/transactional mail has no column, so it can never appear at all**. `Pages/EmailPreference/Index.jsx` renders whatever the server sends; it holds no category list of its own.
- 🚨 **A NON-ACTIVE CREATOR COULD NOT UNSUBSCRIBE, AND TWO SEPARATE THINGS CAUSED IT.** `/email-preferences` sits inside the `auth` group, and `CheckSuspendedUser` (in the **`web` middleware group**, so it runs on every web request) force-logs-out and bounces any account with `suspended_account = 1` — so a suspended creator can neither reach that page nor ever sign in to reach it. Their only control was the emailed link, and that link **expired after 24 hours**: an email opened two days later answered *"Invalid or expired unsubscribe link"* and dropped them on the homepage with no way to stop the mail at all, for ever. Both are fixed:
  - **`LINK_TTL_DAYS = 30`** for every emailed preference link. `generateCheckoutReminderOptOut` already used 30 days for exactly this reason — *a dead unsubscribe link is worse than no link at all*.
  - **A signed, no-login preference centre**: `manage()` / `updateManaged()` render and write the FULL list without a session. Same page component, `signed: true` → `GuestLayout`, posts to a signed URL the server supplies.
  - **The one-click unsubscribe now lands on that centre** instead of `/`. The opt-out is still written *before* the redirect — one click still unsubscribes — but the person then sees what else is on, rather than choosing between one category and silence.
- ⚠️ **`generateManageToken()` / `generateManageUpdateToken()` return NULL when the route is not registered**, deliberately. `URL::temporarySignedRoute()` **throws** on an unknown route name and these are called from inside `Mailable::content()` — a missing route line would not produce a missing footer link, it would take the whole email down. Every caller and both Blade footers guard on null, and the unsubscribe redirect falls back to `/`.
- ⚠️ **The signed page gets a whitelisted, MASKED account shape (`na***@example.com`), never the `User` model**, and both signed responses set **`Referrer-Policy: no-referrer`** (a signed URL can be forwarded; same precaution `GuestPurchaseController` takes). `SecurityHeaders` only sets that header when one is not already present — do not relax that guard.
- **`applyPreferences()` is the ONE write path** shared by both pages: `sometimes` rules, `?? true` comparisons, an audit row per changed column. Audit sources: `settings_page` / `settings_page:<column>` (signed-in), **`preference_centre_link`** (no-login page), `unsubscribe_link` / `unsubscribe_link:<column>` (email links — the bare literal is what the admin view and CSV export filter on, unchanged).
- 🚨 **NO AUTOMATIC RESUBSCRIBE EXISTS AND NONE MAY BE ADDED WITHOUT LEGAL SIGN-OFF.** The brief flags automatic resubscribe triggers as needing legal review *before* implementation. `handleMarketingOptIn` is the place one would go and is deliberately not one — it requires a `marketing_opt_in` the person submitted. Under UK PECR/GDPR an opt-out is withdrawn consent; inferring a new one from a purchase or a return visit is a lawyer's decision, not a commit.
- **Routes needed in `routes/web.php`** (outside the `auth` group, beside `email.unsubscribe`; signature checked in the controller, not by the `signed` middleware, so a stale link explains itself instead of 403ing):
  ```php
  Route::get('/email-preferences/manage/{user}', [EmailPreferenceController::class, 'manage'])
      ->name('email.preferences.manage');
  Route::post('/email-preferences/manage/{user}', [EmailPreferenceController::class, 'updateManaged'])
      ->name('email.preferences.manage.update');
  ```
  ⚠️ Both are single-segment-prefixed but sit under `/email-preferences/`, so the `/{username}/{page?}` catch-all is not a hazard here — still declare them **above** `require __DIR__.'/auth.php'`. Run `php artisan ziggy:generate` after adding them. Until they exist the feature is inert by design (null links, `/` fallback) and `EmailPreferenceCentreTest::setUp` registers them at runtime — delete that `setUp`, not the tests, when the real lines land.

### 🚨 Birthday email has its own switch — and it is an ADDITIONAL gate (23 Aug 2026)

`birthday_emails_enabled` (migration `2026_08_23_300000`, default true). Discovery Phase 4 shipped with the weekly campaign on `marketing_emails_enabled` and the per-creator reminder on `creator_updates_enabled`; neither column MEANS "birthday emails", so stopping the birthday round-up cost you every promotion, or every piece of news about every creator you support.

- 🚨 **THE NEW COLUMN NEVER REPLACES THE ONE THE MAIL ALREADY RODE.** `birthday:remind` passes `SendBirthdayReminders::CATEGORY = ['birthday_emails_enabled', 'creator_updates_enabled']` and `birthday:weekly` passes `sendMarketingEmail($user, $mailable, 'birthday_emails_enabled')` — **every named column must be on**. A new, defaulted-on column must never quietly overturn an opt-out somebody already made; without this a supporter who turned off creator updates last month would have started receiving birthday mail the day the column landed.
- **`EmailService::sendCategoryEmail()` now takes `string|array`** and `sendMarketingEmail()` takes an optional third `$alsoRequire`. Both route through the private `categoriesAllow()` — the ONE place consent is decided. An unknown column is **refused**, not ignored: a mistyped category that fell through would send consent-free mail that looks exactly like consent-checked mail.
- 🚨 **Fixed while here: `sendMarketingEmail` read `! $user->marketing_emails_enabled` with no `?? true`**, so a row predating the column (NULL) read as opted-OUT and was silently skipped — the exact fault this file's own rule warns about, in the platform's largest fan-out.
- **Both birthday footers now carry TWO links**: the narrowest possible opt-out (`category=birthday_emails_enabled` — stops both birthday sends, nothing else) and "Choose what you hear from us" → the no-login centre. *Stop this one* and *choose what I do want* are different intentions, and a footer offering only the first is what makes people opt out of everything.
- ⚠️ **Admin app needs nothing.** It reads preference columns as raw attributes with `?? true` (`SupporterOutreachController`), casts none of them except `birthday_discovery_opt_in`, and never reads this one. Migration in this app only. ⚠️ Do not confuse `birthday_emails_enabled` (the RECIPIENT's consent to receive birthday mail) with `birthday_discovery_opt_in` (the CREATOR's consent to be shown on Birthday Discovery) — different people, different decisions.
- Tests: `tests/Feature/EmailPreferenceCentreTest.php` (15), alongside `EmailPreferenceTest` (4) and `CommunicationPreferenceCategoriesTest` (14). `BirthdayDiscoveryTest`'s footer assertion was updated to the narrower category.

### Sending email
```php
// Promotional/marketing — respects marketing_emails_enabled
EmailService::sendMarketingEmail($user, new MarketingMail($data));

// Product/creator/reminder categories — respects that category's column
EmailService::sendCategoryEmail($user, new ProductUpdateMail($data), 'product_updates_enabled');

// Several categories — ALL must be on. Use this when a mail gains a narrower
// switch but must keep honouring the broader one it already rode.
EmailService::sendCategoryEmail($user, new BirthdayReminder(...), ['birthday_emails_enabled', 'creator_updates_enabled']);

// Marketing with an extra gate on top of marketing_emails_enabled
EmailService::sendMarketingEmail($user, new BirthdaysThisWeek(...), 'birthday_emails_enabled');

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

🚨 **THE FULL EXTENT OF THIS IS NOW MEASURED — `docs/guides/SCHEMA_DRIFT_AUDIT.md` (24 Aug 2026).**
An empty MySQL database built with `migrate:fresh` has **139 tables against the live 164**:
**26 tables no migration creates** (including `post_comments`, `post_likes`,
`shop_varients`, `login_logs`, `payout_details`) and **56 columns no migration declares**
across 15 tables. `shops`, `wish_items` and `memberships` were the three found by accident;
this is the rest. ⚠️ **The mechanism is a MISSING COLUMN, not a NOT NULL violation** — zero
of the 56 are required-without-a-default on live, so a fresh build fails with `Unknown
column` or silently skips a `Schema::hasTable`-guarded feature. Nothing is wrong in
production; what is wrong is every environment built from the repo, which is why whole
areas here have no test coverage. Close it one guarded additive migration per table, types
transcribed from `SHOW COLUMNS` — never guessed.
⚠️ **Separately, the shared dev database is 5 migrations behind**, including the entire
23 Aug marketing-consent feature, so `marketing_suppressions` does not exist there.
`MarketingConsent::isSuppressed` fails OPEN, which is why nothing complained.

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

## 🚨 One label map decides LIVE NOW vs COMING SOON (20 Aug 2026, spennypiggy.co)

`config/discovery.php` is the ONE place the Discovery marketing surfaces read their
capability labels from — the landing-page section (A1), and, as they are built,
`/creators/discovery` (A2) and `/creators/link-in-bio` (A3) — all three live. Client brief: "Spenny Piggy ·
Developer Master Plan", 19 Aug 2026 (`../docs/client/19 Aug/`).

- 🚨 **NOTHING MAY BE LABELLED LIVE NOW THAT IS NOT LIVE IN THE PRODUCT.** This is a
  standing client prohibition, and it is the one that reaches an actual creator: they sign
  up for a capability the label promised. `tests/Feature/DiscoveryMarketingTest.php` pins
  the live set against a list of the code that backs each claim, so adding a key fails the
  suite until someone records the evidence.
- 🚨 **The flags are in PHP config, NOT in a JS constant.** Section F of the plan requires
  a label flip to be a config change with **no deploy**; a JS constant means an edit, a
  rebuild and a release. `DISCOVERY_ANALYTICS_LIVE` (env, default **false**) is the only
  env var this adds. Four flips are already scheduled — analytics (Discovery Phase 2),
  `more_creators` (Mon 31 Aug), `birthday` (Phase 4), `tips` (when Bridge lands).
- ⚠️ **Copy still lives in `resources/js/constants/discovery.js`**, the house pattern (see
  `constants/stablecoinTips.js`) — transcribed **word for word** from the brief and reused
  by A2. Items are stored as one flat list carrying a `key`, never their own label, so a
  capability moving from COMING SOON to LIVE NOW needs no edit in either file. An unknown
  key falls to COMING SOON: the safe direction.
- **`Components/discovery/DiscoveryStatsPanel.jsx` is the Phase-2 dashboard component**,
  not a marketing lookalike. The brief's wording is "build as the real dashboard component
  with mock data + flag", and from Phase 2 the creator dashboard renders this same file
  with real attribution numbers. ⚠️ While `live` is false the coming-soon badge is not
  optional — the figures (428 / 62 / £625, supplied by the client) are illustrative and
  the badge is the only thing separating an illustration from a claim. ⚠️ **Zero is a
  state, not an absence**: the panel stays visible at 0 with an explanatory line and never
  returns null.
- ⚠️ **`Pages/home/DiscoverySection.jsx` is imported EAGERLY in `Welcome.jsx`** while every
  other homepage section is `lazy()`. It sits directly beneath the hero — the second thing
  a visitor sees — so a Suspense placeholder would flash inside the LCP window. It also
  adds the `act-discover` stop to that file's `CHAPTERS` rail; every id there must exist in
  the markup.
- **UTM attribution needed no work** — `app.jsx` captures `utm_source/medium/campaign` on
  any page into localStorage, `users` already carries the columns, and
  `users.signup_landing_page` records the ad page. New `/creators/*` pages inherit it, but
  🚨 **must be registered in BOTH `VisitTracker::AD_LANDING_ROUTES` and `PAGE_TYPES`** or
  their visit counters are incremented in the cache, never written to the database, and
  expire unread — the page reports zero visits forever and nothing errors.
- **`App\Support\DiscoveryPayload::forInertia()`** is the one shape all three surfaces
  send. A page assembling its own copy of that array is a page that can be handed a
  different label map from the others, which is the drift the config was centralised to
  prevent.
- ⚠️ **`/creators/discovery` (A2) draws Discover rather than screenshotting or embedding
  it** — a deliberate, flagged departure from the brief's "screenshot or live embed". Both
  alternatives put **real creators' names and faces into a paid advert**: a screenshot
  freezes whoever was on Discover that morning into an asset nobody can revoke, and an
  embed does it live, with the whole app's weight and a second header inside the frame. A
  public profile is not the same permission as appearing in our advertising. The frame
  shows the real page's layout with anonymous placeholders and links out to the live page.
  Swap it for a screenshot once Jack confirms the creators have agreed.
- ✅ **A3's SECTIONS 3 AND 6 WENT LIVE ON 20 AUG 2026** — they shipped as "COMING SOON"
  against the brief's own "LIVE NOW" label, the one deliberate departure on these pages,
  and `bio_direct_sales` flipped in the same release that carries the B stream.
  🚨 **The flip must travel with the code it claims** — the label lives in `config/discovery.php`,
  so it deploys with the app; flipping it on a branch that ships before B would put a LIVE NOW
  claim on a capability no creator has. Verified before flipping: `bio.buy` routed, the
  `creator_bio_items` migration ran, the editor's four `bio.items.*` endpoints exist, and
  `BioDirectSalesTest` passes (19). `DiscoveryMarketingTest` **inverted** its gate rather than
  deleting it — while the label is live, the buying path must exist or the build fails.
  🚩 **One clause of section 6 is still ahead of the product and is a copy question for Jack:**
  *"Choose which items appear, in what order, and what it looks like."* The first two are live
  and the editor carries hide/show and custom button text, but there is **no theme, colour or
  appearance control** in `Pages/Bio/Edit.jsx`. The historical reasoning for the departure:
  **`/{username}/bio` already existed** (`BioPageController`, `BioLinkController`,
  `Pages/Bio/Show.jsx`, editor at `/bio-links`) but its own docblock states it has **"no
  checkout, no price and no payment method"**: its rows link out to profile pages. Selling
  from the bio page is the B stream, due Fri 28 Aug — three days AFTER the plan puts the ad
  page live on Tue 25. The plan lists *"Mark anything LIVE NOW in marketing that is not
  live in the product"* under **Never**, and a standing prohibition beats a section label.
  That key has since flipped — see the ✅ note above; this paragraph is the history.
  ⚠️ `bio_phone` (section 4) IS live and is labelled so — that page genuinely renders no
  layout and opens in one scroll.
- ⚠️ **The brief bans "instant" / "immediate" / "seconds" from A3 outright** (no settlement
  speed has been confirmed for stablecoin tips), plus competitor names, payment-provider
  names and any creator's earnings. Asserted by test. 🚨 **That scan must blank comments
  first** — the constants file's own docblocks name the banned words in order to prohibit
  them, and it must start AFTER the section's header comment, not at the marker inside it,
  or the fragment has no opening `/*` for the strip to match. Both mistakes were made and
  fixed while writing that test.
- ⚠️ **A3's Tip block is copied from `Pages/Bio/Show.jsx`'s `Stablecoin` component** —
  dashed edge (the house signal for "announced, not built"), greyed, on the bio page's own
  `#A2E4B8` ground — because the brief asks for it "greyed out exactly as it appears in the
  product". Change both together. ⚠️ Note `constants/stablecoinTips.js` documents the
  provider as **Coinflow** while the 19 Aug plan states the stablecoin rail is **Bridge**
  and supersedes older references; neither name is user-facing, so nothing rendered is
  wrong, but the two documents disagree and the B stream needs that settled.
- ⚠️ **A "keep intact" phrase cannot be asserted against the rendered HTML.** There is no
  Inertia SSR here, so a server response carries only the props JSON — every word of
  marketing copy lives in the JS bundle and arrives client-side. The test asserts against
  `constants/discovery.js` **and** that the page still imports the constant holding them;
  an earlier version hit the route and searched the body, and failed on all four phrases
  for that reason. ⚠️ The house display style renders them **uppercase** (`font-gulfs
  uppercase`), same as the landing-page headline — the words are verbatim, the casing is
  typography.
- **A3 argues in DRAWN UI, never a screenshot (23 Aug 2026).** Sections 2, 4 and 6 carried
  headings and word-pills only; they now carry wireframe phone screens (the four-tap cold
  path vs the one warm screen), a `social chips → spennypiggy.co/yourname → outcome` route,
  and a mock of the link-page editor. Same reasoning as A2's draw-Discover departure above:
  a screenshot of a live page puts real creators, and whatever state the product was in that
  morning, into a paid advert nobody can revoke. ⚠️ **The section-6 editor mock carries a
  visible "Illustration of the link page editor" caption** — that section is gated on
  `bio_direct_sales`, and a mock a visitor reads as a screenshot is a product claim, the same
  hazard `DiscoveryStatsPanel`'s coming-soon badge exists to close. A drawn mock also cannot
  drift silently: it never *looks* current, so nobody trusts it as a spec.
- ⚠️ **Platform names are set in TYPE, not logos** — the brief's competitor/third-party-mark
  ban covers a rendered wordmark or glyph as much as a sentence, and a marketing surface has
  no licence to any of them. Naming Instagram/TikTok/X as plain text is nominative use.
- ⚠️ **The drop-off is drawn with opacity on the DECORATIVE screens only** (`aria-hidden`);
  the step labels beside them stay at full contrast. Fading the words to dramatise "each tap
  loses supporters" would make the argument by making the argument unreadable, and would put
  the fade on content a screen reader announces.

## 🚨 Discover is a shop front, not a directory (24 Aug 2026, spennypiggy.co)

Rebuilt around the supporter's buying questions — what can I afford, what do I
get, has anyone bought before — because the page answered none of them above the
click. `routes/auth.php` (the `discover` closure), `app/Services/DiscoveryService.php`,
`Pages/discover/Discover.jsx` + `components/{TopBar,CreatorCard,ResultsGrid}.jsx`,
`components/DiscoverHero.jsx`. Tests: `tests/Feature/DiscoverBrowseTest.php` (7).

**Six faults this pass fixed, all of them live for months:**

- 🚨 **`$type` DEFAULTED TO `'trending'`, so a bare `/discover` was never the
  landing page.** Every request set `filters[type]`, which put the closure in its
  search branch — the featured rails were built and thrown away, and the landing
  was a bare grid of creators in id order. The default is now `null`;
  `/discover/trending` still asks for that grid explicitly.
- 🚨 **"Trending" meant `orderByDesc('id')`** (the code called itself a
  placeholder), and every creator payload carried a hardcoded `'clicks_24h' => 0`,
  so the flame badge could never render. Ranking is now `rankedCreatorIds()` /
  `creatorScore()` over real signals: 24h clicks from `search_clicks` (weighted
  hardest — freshest and hardest to fake), purchases, the items' own
  `rising_score`, listing count only as a tiebreak.
- 🚨 **Page 2 was page 1.** `getSearchBills/Memberships/Tasks/Shops` ran
  `limit($limit)` with **no offset**. All four now page, and the grid ACCUMULATES
  pages client-side keyed on a filter signature — "Load more" used to replace the
  rows the visitor was reading. `ResultsGrid` never rendered a Load-more control
  at all; `onLoadMore` was passed to a component that ignored it.
- 🚨 **The heading counted the page, not the results** ("Showing 24 results" on
  page 1 of 40, and again on page 2). `getSearchCounts()` returns real per-type
  totals; `hasNext` is computed from them instead of from "this page came back
  full", which lied in both directions.
- 🚨 **`route('discover.suggestions')` DID NOT EXIST.** `TopBar` called it on
  every keystroke and ziggy THROWS for a name it does not carry — while the
  dropdown markup sat commented out below. The route is added (above the
  `discover/{type?}` catch-all, `throttle:60,1`) and the dropdown is live; a
  suggestion goes straight to the profile, tagged `search-recs`.
- ⚠️ **The empty state's "Clear All Filters" ran `window.location.reload()`** —
  reloading with the filters still applied.

**New business rules:**

- 🚨 **THE CARD'S PRICE PLATE IS FEE-INCLUSIVE FOR A LOGGED-OUT VISITOR.**
  `price_from` on the wire is the LISTED price; `CreatorCard` grosses it up
  through `PriceFormat().calculateTotalSupporterPays` exactly as
  `wishlist/Wishlistbox.jsx` does, and prints "*Fees included". Rendering
  `price_from` raw would advertise a cheaper number on Discover than the checkout
  charges, on the one surface whose whole job is a first purchase.
- **Cheapest-listing is decided in GBP** (`Helpers::priceFormat(..., 'GBP')`), so
  a foreign-currency listing cannot win the "from" slot by being a bigger number
  in its own currency. Same rule for `PRICE_BANDS` — a band is a GBP-equivalent
  question, applied as an id set (`listingIdsInBand`) rather than a SQL BETWEEN
  on mixed currencies, so the count and the grid cannot disagree.
- **Browsing hides a creator with nothing listed; a NAMED search still finds
  them** (and still finds fan accounts). A profile with nothing for sale is a
  dead end while browsing; answering "no results" for an account someone typed by
  name is the worse failure.
- ⚠️ **`tasks` has neither `supporter_count` nor `rising_score`** (the four other
  listing tables do) and keys its owner on `creator_id`. Both are probed via
  `Schema::hasColumn` / `listingSources()`, never assumed — selecting them blind
  is a 1054 that takes the whole page down.

**New API surface:** `GET discover/suggestions` (name `discover.suggestions`).
New page props: `counts`, `priceBands`, `unlockTypes`, `budgetWishes`,
`boardCreators`. New filters accepted: `priceBand` (`under10`/`10to25`/`25to50`/
`over50`), `unlock` (`instant`/`monthly`/`custom`), plus the existing `sortBy` —
both validated against `DiscoveryService::PRICE_BANDS` / `UNLOCK_TYPES` and
dropped if unknown. ⚠️ The page cache key is now a **whitelist** of those filters,
not `md5($request->all())` — any stray query string used to mint its own entry.

**Content rule — the labels are the SUPPORTER'S words, the ids are ours.**
Nobody arrives wanting to buy "a Bill" or "a Task": Wish List → **Unlock now**,
Bills → **Monthly content**, Memberships → **Membership tiers**, Tasks → **Made
for you**, Shops → **Buy direct**, Creators → **People**. Ids still map to the
platform `contentType`, so routing, search and the admin side are untouched. The
hero states the transaction ("Buy straight from the creator · pay once, unlocks
straight away, from £4.99") rather than a mood, and the ticker no longer ranks
**earnings** — how much a creator took is our fact, not the visitor's, and a
leaderboard of takings reads as a plea rather than a shop.

**Design:** eight near-identical rails → **three** (Under £10 · Trending ·
New and verified) over one paged board. Creator cards moved off dark `#16161C`
onto the house white + `border-black` frame (the grid was mixing three ground
colours), emoji headings dropped for data eyebrows, and the bare
`hover:-translate-y-1` (banned without a shadow partner) replaced with a border
+ brightness change. `ResultsGrid`'s `SpotlightSection` was deleted — its three
hardcoded cards linked to `?search=under 20` and `?search=expiring`, i.e. keyword
searches for the literal words.

**Not done, deliberately:** quick-view checkout from the grid (a real feature, not
a polish item), and a save/follow control on the creator card — `SavedItem::TYPES`
has no `creator` type, and the follow endpoint EMAILS the creator on every
follow, which a browse-grid button would fire far too easily.

### The page has to work before the visitor does (24 Aug 2026)

Everything above waits for a search, a chip or a scroll. These three do not, and
they are the reason a first-time visitor stays:

- **Spotlight** (`components/SpotlightRotator.jsx`) — one creator at a time,
  with a real listing at a real price, rotating every 6s. 🚨 **IT SITS IN ITS OWN
  BAND UNDER THE BANNER, NEVER INSIDE IT** (client direction, 24 Aug 2026): it
  was built into the hero's right-hand side and took the drifting face wall away
  — **the wall is the banner's design and stays.** The band is the same card in
  a wide layout, so nothing was lost by moving it. 🚨 **THREE CARDS, NOT ONE WIDE
  BAND** (same direction): a single full-width strip on a 1440px screen is one
  creator's name and a mile of empty dark — the row shows up to three (two on
  `sm`, one on a phone) and the whole set shifts through the pool, so a wide
  screen carries more of the catalogue rather than more emptiness.
  🚨 `prefers-reduced-motion`
  stops the rotation entirely rather than slowing it — a self-advancing carousel
  is precisely what that setting asks us not to do.
- **Live unlocks** (`components/LiveUnlocks.jsx` + `DiscoveryService::recentUnlocks()`,
  `GET discover/live`, name `discover.live`) — what people actually bought here
  in the last 30 days, replacing the hero's synthetic "trending now" ticker
  (never both: two scrolling strips under one headline is noise, and the
  synthetic one undercuts the real one).
  🚨 **THE BUYER IS NEVER IN THE PAYLOAD** — not a name, not initials, not an
  id, and no amount. The row is exactly `{title, username, unlock, at}`, pinned
  by a test asserting the KEYS (a substring test would pass for the wrong
  reason: a buyer id like "2" appears inside any timestamp). Reads `deliverables`
  — the one table written once per purchase — never the seven payment tables.
  ⚠️ Only public, unsuspended creators; the same item bought repeatedly collapses
  to ONE line; and an empty feed renders **nothing** rather than being padded
  with older activity, which reads as a dead site to the first person who checks
  a timestamp.
- **Content-first tiles** — the creator card's image is now up to three of the
  creator's own listing thumbnails (`top_wish_images` = `perma_link`, the PUBLIC
  card image — never `reward_url`/`content_file_url`, which are the paid content
  and are signed per buyer). The cover photo is the fallback. A shop shows the
  goods, not the shopfront.

### Quick view, personal rows, and four more faults (24 Aug 2026)

- **Quick view** — the price plate on a creator card opens the creator's whole
  shelf in place (`components/CreatorQuickView.jsx`, `DiscoveryService::creatorPreview()`,
  `GET discover/creator/{username}/preview`). 🚨 **IT SHOWS THE SHELF, IT DOES
  NOT TAKE THE MONEY**: every row links to that item's EXISTING checkout
  (`?item={uuid}` on the profile — the parameter the profile controller already
  reads — or `/task/{uuid}`). Nothing on that path computes a charge, fee or
  total. Prices are listed prices, grossed up in the modal by the same
  PriceFormat helper as everywhere else.
- 🚨 **`IsloggedIn` ON A LISTING CARD MEANS "THE CREATOR IS LOOKING AT THEIR OWN
  LISTING", NOT "a user is signed in".** Truthy swaps the buyer's Unlock button
  for the owner's Share/Edit one and shows the PRE-FEE price. Discover passes
  `false` always — it is never the owner's view. The creator card follows the
  same rule: its "From £X" plate is fee-inclusive for everyone.
- **Save-for-later on Discover** — `SaveButton` + `/saved/toggle` already
  existed and no browse surface used them. Item cards carry a heart, signed-in
  only (the route is behind auth, and a heart that silently fails is worse than
  none). ⚠️ Creator cards do not: `SavedItem::TYPES` has no `creator` type, and
  the follow endpoint EMAILS the creator on every follow.
- **Personal rows** — "Creators you follow" (`follows`), "You've supported
  these" (`deliverables` for the signed-in user), and "Pick up where you left
  off" (`components/RecentlyViewed.jsx`, **localStorage only — it never leaves
  the device**, so a guest gets the same continuity and we store nothing).
  🚨 **PERSONAL ROWS ARE BUILT OUTSIDE THE PAGE CACHE** — `$data` is cached per
  filter set and served to everyone; a follow list in there would show one
  supporter's follows to the next visitor. ⚠️ `publicCreatorCards()` re-checks
  visibility: a follow survives the creator being suspended, the rail must not.
- 🚨 **`getTopEarners` RANKED NOTHING.** It applied `limit($limit)` BEFORE any
  ordering, never read a payment, and stamped `total_amount => 0` — so "Top
  Earners This Week" was an arbitrary handful of accounts, on Discover and on
  the **homepage**, which still calls it. It now ranks on the canonical ledger
  (completed `income`, summed on the stored `gbp_amount`, never re-converted).
  ⚠️ `total_amount` STAYS 0: the ORDER is public, the sum is not.
- **Search relevance** — `searchRelevance()` scores exact handle > handle prefix
  > name prefix > word-boundary name hit > substring > bio, and 🚨 **relevance
  outranks every other sort when somebody typed something**. Explicit price/new
  sorts still apply inside equal relevance.
- **Interests are the EXISTING taxonomy.** `App\Support\Badges` +
  `users.creator_category` already hold curated, slugged interests that creators
  pick in their profile — Discover reads those (`interestFacets()`, `?interest=`)
  rather than growing a second list. ⚠️ **NOT `user_categories`**, which is a
  creator's own free-text grouping of their wishes. ⚠️ Filtering happens in PHP
  via `Badges::sanitiseInterests()` because the column has held BOTH labels and
  slugs; a `whereJsonContains` on the slug silently drops every pre-migration
  creator. New page `GET discover/c/{slug}` (name `discover.interest`, above the
  catch-all) forwards into the Discover closure rather than reimplementing it,
  and every slug is in the static sitemap — the only indexable Discover URLs
  beyond the root, since a filtered Discover is `noindex,follow`.
  ⚠️ `SeoMeta` has no `setTitle`; for a title, `addTag`'s SECOND argument is the
  string itself — passing a props array renders
  `<title>Array to string conversion</title>`.
- **Trending also counts listing views** (`item_view_stats`, weight 1 against a
  click's 4). ⚠️ Profile visits cannot be used: `site_visit_stats` aggregates by
  page TYPE, not by creator.
- 🚨 **ONE ROW OF CHIPS, THEN A "FILTERS" BUTTON — ON DESKTOP TOO** (24 Aug 2026).
  The bar reached THREE rows: 8 type chips + 4 price bands + 3 unlock types + 12
  interests + a sort control, about **28 controls stacked above the first
  result**, with the interest row running off the right edge mid-word and no
  scroll affordance. A filter bar taller than the thing it filters is not a
  filter bar. Price, interests and sort now live in the same `Sheet` at every
  width, behind a button carrying the active count.
  ⚠️ **The unlock chips were REMOVED FROM THE UI** (the `?unlock=` filter still
  works on the wire): they restated the type chips in a second vocabulary — "Made
  for you" appeared TWICE on one screen, and "Unlock now"/"Instant unlock" and
  "Monthly content"/"Monthly" were the same choice offered twice. The type chips
  are the more precise of the two.
  ⚠️ **Applied filters are listed once, under the bar, each removable**, plus
  "Clear all". Two active chips in two different rows told the visitor nothing
  about the combination they had built.
- **Infinite scroll, button kept.** The observer fires ONCE PER PAGE (`armedFor`
  records the count it last loaded at), so a sentinel that stays on screen cannot
  spend the whole result set in one scroll; the button stays because a sentinel
  is invisible to a keyboard.
- 🚨 **THE INTRO-VIDEO CARD OPENED AN EMPTY MODAL.** `<Popup text={…} />` was
  self-closing — `text` is the TRIGGER, `children` is the body — so the play
  button on the intros rail has never played anything. The video is now the
  modal's children. ⚠️ The in-viewport silent preview described in an earlier
  version of this note was REMOVED at the client's request the same day — see
  "Dead ends, real collections" below.

### ⚠️ The CSP nonce test failed for whoever had `npm run dev` running (24 Aug 2026)

`CspInlineScriptTest` renders `view('app')` DIRECTLY, so no middleware runs and no
`cspNonce` is shared. Blade blocks survive that (`nonce="{{ $cspNonce ?? '' }}"` still
prints `nonce=""`), but **Laravel's Vite helper omits the attribute entirely when it has
no nonce** — and in HOT (dev-server) mode `@viteReactRefresh` emits an INLINE
`<script type="module">` preamble. So the suite failed on any machine with `public/hot`
present and passed everywhere else, and the failure read exactly like a code regression.

`AppServiceProvider::boot()` now calls `Vite::useCspNonce()` as a default, and
`SecurityHeaders` overrides it per request with the same value it shares with Blade.
Built assets are `src=` tags and were never affected — this is a dev-mode and
test-determinism fix, not a production one.

### Dead ends, real collections, and what the page reports (24 Aug 2026)

- 🚨 **"NO MATCHES" IS NOT AN ANSWER, IT IS A DEAD END.** A visitor who has stacked an
  interest, a price band and an unlock type onto a search cannot tell which one emptied
  the page, and "try adjusting your search" asks them to guess. The empty state now lists
  every active refinement with its own remove control, and its primary button drops the
  **NARROWEST** one (the last thing that could have emptied it) rather than clearing
  everything the visitor deliberately chose. "Start again" is the secondary.
- **Collections render on the LANDING page**, not only on a failed search. ⚠️ Only
  `hidden_gems` and `almost_funded`: `trending` and `new_creators` are the page's own
  rails, and the same creators under two headings reads as a bug.
- **Interest pages describe themselves** — `CollectionPage` JSON-LD plus an
  `interestLabel` prop so the grid headlines "Artist creators" instead of the generic
  board heading. 🚨 **The JSON-LD names the COLLECTION, never its creators.** An
  `ItemList` of real people is a durable, machine-readable record of who was on the page
  that day, and a creator who leaves cannot take it back. Pinned by test.
- **Discover reports four events** (`discover_search`, `discover_filter`,
  `discover_load_more`, plus the existing page view) through the same
  `trackClientEvent` path as everything else. 🚨 **NO QUERY TEXT, NO CREATOR AND NO ITEM
  NAME LEAVES THE PAGE** — a search term is something a person typed and can name
  anybody. `discover_search` carries the term's LENGTH and the result count, which
  answer "did searching work" and identify nobody. Same rule as `AnalyticsParams::scrub()`.
  ⚠️ One event per settled search (the debounce means a props change is a completed
  search), never one per keystroke.
- **A11y:** every filter chip is a toggle and now carries `aria-pressed` (state was
  carried by background colour alone, which a screen reader does not read), and the
  result count is an `aria-live="polite"` status — filtering rewrites the grid with no
  other signal that the page responded.
- ⚠️ **INTRO VIDEOS DO NOT AUTOPLAY** (client direction, 24 Aug 2026). The in-viewport
  muted preview on the intros rail was built and then removed at the client's request;
  the rail is posters and a play button. The empty-modal fix stays — `<Popup text={…} />`
  was self-closing, so the play button opened a modal with nothing in it. The video in
  that modal does autoplay, because the visitor pressed play to open it.

### Four more, mostly things that were built and never wired (24 Aug 2026)

- 🚨 **THE CHIP ROW RENDERED TWICE.** Collapsing the bar to one row replaced the
  refinement rows but left the original quick-filter block above them, so eight type
  chips drew twice on every Discover page. Reported from a screenshot, not caught by any
  scanner — `npm run check` has nothing to say about a duplicated block.
- **Four featured rails stopped being BUILT.** `featuredBills` / `featuredMemberships` /
  `featuredTasks` (and shops) were fetched on every landing request and shipped in the
  payload after the eight-rails-to-three cut left nothing rendering them. The service
  methods are untouched — bring a rail back by rendering it, never by re-adding a fetch
  nothing reads.
- ⚠️ **`creatorMeta` IS CACHED PER CREATOR, NOT PER SET.** It keyed on `md5(id list)`, so
  every page, rail and filter combination minted its own entry holding the same creators —
  a cache that grows with the number of QUESTIONS asked rather than with the number of
  creators, and misses on page 2 of the same list.
- **Search suggestions return ITEMS as well as people.** The wish half of
  `getSuggestions()` was written and left commented out, so a shop front's search box could
  only ever answer "which creator" while half the searches are for a THING. An item
  suggestion goes straight to that item's own checkout (`?item={uuid}`), never back into a
  search. ⚠️ **The owner filter is a SUBQUERY, not a join:** `listingQuery()`'s guards are
  written unqualified (`deleted_at`, `is_suspended`, `publish_at`), so joining `users`
  makes every one of them ambiguous — SQLSTATE 1052, a 500 on a public endpoint.

### 🚨 The board sells THINGS, not people (24 Aug 2026, client direction)

Discover was a directory of accounts: the board listed creators, two of the three
rails listed creators, and the only content on the page was one wish rail. **A
supporter does not buy a creator — they buy something a creator made.**

- **`DiscoveryService::mixedFeed($filters, $perType)`** is one feed of listings across
  all five modules. ⚠️ Each row is `['mode' => …, 'item' => …]` carrying the payload
  **its own card already expects** (the existing `getSearch*` maps, untouched), so
  nothing re-describes a listing and no card was rewritten. `ResultsGrid` reads the mode
  off the ROW when `mode="mixed"`.
- ⚠️ **Rows are ROUND-ROBINED across modules, not concatenated** — ordering by type
  gives a board of six wishes and then six bills, a shop front whose first screen is one
  department. **Price sorts still sort globally, in GBP**: "cheapest first" that is only
  cheapest-within-type is a lie.
- **Landing order is now:** Under £10 (mixed) → Just added (mixed) → Trending creators →
  New and verified → **Everything for sale** (the mixed board) → Creators to follow.
  The creator grid moved BELOW the goods and is what the "People" chip renders.
- ⚠️ The Under-£10 rail was wishes only, so the cheapest way in advertised ONE module
  while shop items and paid tasks under a tenner sat unlisted. It is the mixed feed now.
- ⚠️ **TASKS SORT LAST, WHATEVER THE ROUND SAYS** (client direction, 24 Aug 2026). A task
  card is a full-width ROW — it is a brief, not a product tile — so one landing mid-grid
  splits the board in half and leaves the tiles above it ragged. At the foot it reads as
  its own section.
- 🚨 **EVERY CARD FILLS ITS CELL (`[&>*]:h-full` on the wrapper, plus `h-full flex
  flex-col` on the bill card's own root).** The grid CELL was already full height and the
  cards inside were not, so a mixed board of five different card components came out
  ragged — each row ending at a different place, which reads as broken rather than as
  varied. Task rows opt out (`[&>*]:h-auto`).
- **The shop card's "Buy Now" is the house CTA now** — same shape as BillItem's
  Subscribe (radius token, black frame, brightness press), only the colour differs.
  ⚠️ It carried `rounded-[15px]` (a hardcoded radius matching no token) and a bare
  `active:translate`, which is the banned lift with no shadow partner; its blue sibling
  on the same card carried the same press and was fixed with it.

**Two undeclared-schema faults this uncovered — both the documented class of gap:**

- 🚨 **`getSearchShops` filtered on `shops.status` with NO `Schema::hasColumn` GUARD.**
  That column exists on every deployed database and in **no migration in this repo**, so
  shop discovery threw on any database built from migrations. The rest of the app guards
  it for exactly this reason; this call site did not.
- 🚨 **`shop_shipping_infos` HAD NO MIGRATION AT ALL** and is eager-loaded by
  `Shop::shippingInfo()`, so every shop query on a fresh database threw "no such table" —
  which is why the shop paths had no feature test: they could not run. Added as a
  **guarded** create (`2026_08_24_000000`) mirroring the live schema, with a deliberate
  no-op `down()`.

## 🚨 Discovery attribution — Phase 1 (20 Aug 2026, spennypiggy.co)

Every profile visit and every purchase is recorded as **creator-generated** (their own
audience) or **SP-generated** (a surface we chose to put them on). Every figure later phases
publish — the dashboard banner, the marketing proof point, "we show you what Discovery is
worth" — is this table, summed. Reference: Developer Master Plan, 19 Aug 2026, §C Phase 1.

- 🚨 **A SURFACE THAT IS NOT TAGGED IS INVISIBLE FOR EVER.** Attribution is recorded at the
  moment of the visit; there is no backfill for a click nobody marked. Any internal link
  where *Spenny Piggy* chose to show a creator must go through
  `resources/js/lib/discoveryLink.js`.
- **`App\Support\DiscoverySources`** holds the twelve reserved keys and the class each
  belongs to. ⚠️ **An unknown key is CREATOR-generated, never SP** — the published number is
  "how many people SP brought you", so the safe direction to fail is the one that
  under-claims. ⚠️ **`bio-link` is creator-generated**: the brief is explicit that sales
  from a creator's own link are their traffic.
- 🚨 **`TrackDiscoveryVisit` is deliberately NOT folded into `TrackSiteVisit`.** That class
  guarantees it stores no personal data — load-bearing for consent and deletion requests —
  and this one writes a row naming a creator and a visitor. `discovery_events` therefore
  cascades on user delete and identifies a logged-out visitor only by the existing
  anonymous `sp_v` cookie, never an IP or a fingerprint.
- ⚠️ **The `sp_disc` cookie is a MAP keyed by creator, and it is LAST-touch** (the opposite
  of `VisitTracker`'s first-touch landing cookie). One global "last source" would credit
  Discovery with a sale that came from a different creator's own bio link in the same
  browser. It is capped at `AttributionService::MAX_TRACKED_CREATORS` (20) — uncapped, a
  crawler grows it past the 4KB header limit and the browser drops it silently.
- ⚠️ **`TrackDiscoveryVisit` writes the cookie back onto the REQUEST after queueing it**, or
  the very first tagged visit — the one that matters most — records with no source.
- **`financial_transactions.discovery_source` / `.discovery_class`** carry the source on the
  ledger row itself, per the brief. `DiscoveryReportService::ledgerEarnings()` cross-checks
  the event total against it; **when they disagree the ledger is right**, because it is what
  the creator is paid from. Columns mirrored into the admin app's model (read-only there).
- 🚨 **A ROW WITH NO BROWSER IS ATTRIBUTED FROM STRIPE METADATA** (20 Aug 2026 — this closes
  the Phase 1 known gap). Bank payments (SEPA/ACH) settle asynchronously via webhook, days
  after the supporter closed the tab, so the cookie can never see them.
  `Helpers::buildStripeMetadata()` stamps **`sp_discovery_source`** (`AttributionService::METADATA_KEY`)
  into the `$commonFields` merge at checkout — the one moment a browser is present — resolved
  from the cookie for the `creator_id` that switch already resolved. ⚠️ **No resolvable
  numeric creator (`platform`, blank, a type with no creator) omits the key rather than
  guessing**, and only a `DiscoverySources::normalise()`-approved key is ever stored.
  `StripeWebhookController::handle()` then calls `AttributionService::rememberPaymentMetadata($metadata)`
  once per event (beside `openNotificationContext`, same reasoning, cleared in a `finally`),
  and the **`FinancialTransaction::created` hook is still the ONE hook** — cookie first,
  remembered metadata second (`attributeTransactionFromMetadata`). `syncOrphanCheckouts` does
  the same from `stripe_payment_details.metadata`, the stored copy of that payload.
  - ⚠️ **The metadata's `creator_id` must equal the ledger row's `user_id` or the source is
    refused.** One event can write several rows (a basket spanning creators) and a source key
    only ever meant the creator whose cookie entry produced it.
  - 🚨 **Idempotent by CLAIMING the row**: the stamp is a targeted
    `whereKey(...)->where(discovery_source null/'')->update(...)` (never `save()` — the reserve
    `updating` guard), and a 0-row result means someone already attributed it, so no second
    `discovery_events` purchase row is written. An attributed row is never overwritten —
    last-touch is decided at purchase time, not at replay time.
  - 🚨 **CLOSED (20 Aug 2026) — THE SOURCE IS PERSISTED ON THE PAYMENT ROW.** Shop, task,
    bill, membership and wish ledger rows are written by the queued `SyncCreatorLedger` →
    `finance:sync-transactions`, in a worker with neither cookie nor event metadata (only pot
    and tip FTs are written inline by the webhook). The ambient metadata is still deliberately
    NOT propagated across the queue — that job rebuilds ALL of a creator's rows, so one
    payment's source would leak onto every other row it touched. Instead a nullable
    **`discovery_source` (40) column** (migration `2026_08_20_200000`) sits on every table the
    sync reads: `shop_payments`, `task_purchases`, `piggy_pot_contributions`,
    `tip_goals_payments`, `stripe_payment_details`, `wish_item_subscriptions`, `bill_payments`,
    `membership_payments`, `rye_product_payments`. ⚠️ **Longer than the `fee_profile` list** —
    bills/memberships/Rye choose no payment method but do produce ledger rows; follow
    `SyncFinancialTransactions`, never the fee-profile list.
    - **Only the key is stored; the class is DERIVED** via `DiscoverySources::classFor()`. One
      definition beats nine copies. (`financial_transactions` keeps its denormalised
      `discovery_class` on purpose — the report groups by it on every read.)
    - **One resolution, used everywhere:** `AttributionService::sourceForCreator($creatorId, $metadata = null)`
      — cookie first, then the payment's own Stripe metadata (creator-id checked). Both the
      payment-row column and `Helpers::buildStripeMetadata()`'s `sp_discovery_source` read it,
      so the key Stripe carries and the key the row stores can never disagree.
    - **Set at purchase time** in all seven one-off checkouts plus both `TaskPurchase` creates
      (redirect + webhook, from the session metadata, so whichever wins the race stores the same
      value). ⚠️ **A RENEWAL INHERITS the original sale's source** — bill, membership and wish
      subscription renewals copy the column forward exactly as `copyFeeRateColumns` does, and
      the wish renewal's `StripePaymentDetail` inherits it from the subscription. There is no
      browser on month 2, and the surface that introduced the supporter earned the stream.
    - **The sync reads it back** through `SyncFinancialTransactions::attributeDiscovery()`,
      called after EVERY `updateOrCreate` (all nine sections). ⚠️ Explicitly, not via the
      `FinancialTransaction::created` hook — that fires only on INSERT, so a row created by an
      earlier run would never be attributed. It routes through `AttributionService::attributeTransactionFromSource()`
      → the same `stamp()`, so a re-run never overwrites an attributed row and never writes a
      second `discovery_events` purchase row. Wrapped: attribution never fails a sync run.
    - ⚠️ **Admin app needs nothing.** It declares its own copies of these models but never
      inserts a payment row (no `*Payment::create` anywhere in it) and its copies do not carry
      `fee_profile` either; `$fillable` does not affect reads. Migration in this app only.
    - Tests: `tests/Feature/DiscoveryPaymentSourceTest.php` (7).
- **Tagged so far:** homepage showcase (`trending`, `new-creators`) and Discover's
  `CreatorCard` (`search-recs`). ⚠️ **Discover's item grid, featured carousels and the
  automated supporter emails are NOT yet tagged** — `DiscoverySources::LIVE_KEYS` lists what
  is wired, and the brief's "tag every SP surface that exists today" is not finished.
- Tests: `tests/Feature/DiscoveryAttributionTest.php` (12), including the two cases the
  brief asks to be shown end to end. ⚠️ One test asserts the JS key list matches the PHP
  one — a key the helper offers but the server refuses is dropped silently, which looks
  exactly like a tagged link that works.

## 🚨 Discovery Phase 3 · security headers · and three traps found on 20 Aug 2026

### Phase 3 — "More creators to support"
`App\Services\Discovery\CreatorRecommendationService` picks four creators (Similar ·
Emerging · Popular · Discovery Pick) for the foot of every public profile.

- 🚨 **NOTHING READS AN AMOUNT.** "Popular" is a COUNT of distinct supporters, not a sum of
  money, and `card()` whitelists six keys by name rather than spreading a row — an internal
  signal cannot reach a card by being added to the pool. Verified in the browser and pinned
  by test.
- **`users.exclude_from_discovery`** (migration `2026_08_20_100000`) is the admin switch.
  ⚠️ **Cast only, deliberately NOT `$fillable`** — same rule as `bonus_scheme_eligible`;
  write it with `forceFill()`. ✅ **Mirrored in the admin app** (cast declared there too,
  written by the one validated endpoint `Admin\CreatorDiscoveryController` →
  `admin.creator-discovery.toggle`, surfaced as `Components/Admin/DiscoveryVisibility.jsx`
  on the creator's own page). Shared DB, migration in this app only — never add a second.
- Two caches: the platform pool (`discovery_pool_v1`, 900s, capped at 750 creators) and the
  per-profile selection (`discovery_more_creators_v1_{id}_{hourBucket}`, 900s, pure PHP over
  the pool). Warm cache is **zero queries per profile view**. The rotation bucket is in the
  key, so the Pick flips hourly regardless of write time.
- Exposure balancing damps Emerging/Pick only — `1 / (1 + log10(1 + exposure_14d / 25))`,
  never a hard cut-off. Bands are internal and never leave the service.
- A small pool renders FEWER cards; it never pads with an ineligible creator.

### Security headers now actually ship
`SecurityHeaders` was registered nowhere in either app (and `public/.htaccess` is inert on
Lambda), so nothing shipped. Both apps now send `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, plus HSTS on HTTPS.

- 🚨 **THE SITE-WIDE `Referrer-Policy` IS A FLOOR, NOT A CEILING.** The middleware is first
  in the `web` group, so its "after" work runs last and a plain `set()` **overwrote** the
  stricter `no-referrer` that `GuestPurchaseController` and `MaintenanceAccessController`
  set on purpose — a signed URL carrying the guest's EMAIL, and one carrying a bypass
  TOKEN. That was a security downgrade introduced by security hardening. It is now guarded
  with `if (! $response->headers->has('Referrer-Policy'))`. Caught by
  `GuestPurchaseLookupTest`.
- ⚠️ **CSP ships `Report-Only` and must be watched before it is enforced**
  (`SECURITY_CSP_ENFORCE`, default false). It is also **skipped in `local`/`testing`**, so a
  developer never sees a violation locally — the first report will come from a deployed
  environment. If enforced today it would break the un-nonced inline `gtag`/JSON-LD blocks
  in `app.blade.php`. 🚨 On Vapor `ASSET_URL` points at the S3/CloudFront host, so a policy
  listing only `'self'` would block **the whole app bundle** — not reproducible locally,
  where `ASSET_URL` is empty. `assetOrigin()` threads that host through every directive.
- ⚠️ `payment` and `camera` are **delegated to Stripe, not denied** — denying them kills
  Apple/Google Pay and Stripe Identity capture. `COOP` is `same-origin-allow-popups` because
  Google sign-in and Connect onboarding talk back through `window.opener`.
- **Password policy is `min(12)->uncompromised()`** in both apps, applied only when a
  password is SET (existing 8-character accounts still sign in). The HIBP verifier is
  rebound to a **3s** timeout — the stock 30s outlives the Lambda, which would turn its
  fail-open into a 504 on registration.
- 🚨 **`Auth::logoutOtherDevices()` DOES NOT YET REJECT OTHER SESSIONS.** It rotates the
  password hash; the `auth.session` middleware is what actually turns other sessions away,
  and it is deliberately NOT on the `web` group (enabling it wrongly can log out every
  user). "Log out everywhere" therefore does not work today — a decision for a human, not
  a bug to quietly fix.
- ⚠️ **`bill/checkout/{uuid}` and `membership/checkout/{uuid}` are each registered TWICE**
  in `routes/auth.php` — once inside the `auth` group and again near the bottom. Laravel
  keys on method+URI and the LAST registration wins, so the live route carries **no**
  `Authenticate` middleware. The login requirement comes from the `!Auth::check()` redirect
  in `buyBill`/`buyLevel`. Do not remove that redirect on the strength of the route group
  above it.

### Three traps this session cost real time
- 🚨 **`php artisan test` EXITED 0 WITH FAILING TESTS**, twice. Do not gate a release on the
  exit code alone — parse the `Tests:` summary line. This matters for the Section F
  regression gate.
- 🚨 **`wish_items` had two columns no migration declared** (`reward`, `ai_generated`), so a
  database built from migrations produced a table the app cannot insert into — which is why
  the wish paths had no feature test: they could not run. Same fault as `shops`; fixed by
  guarded additive migration `2026_08_20_300000` with an empty `down()`. **Verified the
  fresh-built schema now matches live, 50 columns to 50.**
- ⚠️ **`['a' => 0] + $overrides` KEEPS THE LEFT VALUE.** A test helper used `+` to apply
  overrides, so every "this creator should be excluded" fixture silently built a perfectly
  eligible creator and then asserted it was excluded. Use `array_merge`.
- ⚠️ **The test suite must never call HaveIBeenPwned.** `Password::defaults()` applies in
  tests too, so `uncompromised()` put a real HTTP request in every registration test —
  network-dependent, and it failed a password that met our own policy (`Password123!` is 12
  characters but is in the breach corpus). The verifier is offline in `testing` only.

## 🚨 Discovery Phase 4 — Birthday Discovery (21 Aug 2026, spennypiggy.co)

`App\Services\Discovery\BirthdayDiscoveryService` answers "whose birthday is it, who may
be shown, and what may be shown about them" for all three surfaces: `birthday:remind`
(daily 09:30, three stages — 7d / 1d / on the day), `birthday:weekly` (daily 09:45, the
Monday "Birthdays This Week" campaign) and `/discover/birthdays`.

- 🚨 **THE BIRTH YEAR IS NEVER DISPLAYED ANYWHERE.** `users.date_of_birth` is **not** in
  `User::$hidden` on either app, so nothing but discipline keeps a year off a public card
  or out of an e-mail sent to strangers. Three structural guards: no query in the service
  selects `date_of_birth`; `card()` whitelists **nine** keys by name (never a spread); and
  `birthdayLabel()` builds "12 March" from a fixed month table with **no date object to
  format**. New columns `birthday_day` / `birthday_month` / `birthday_discovery_opt_in`
  (migration `2026_08_21_200000`) exist so the year never has to be in scope.
- **Opt-in is the creator's own, default FALSE.** A birthday already on file is not consent
  — the migration backfills day/month but never the switch. `birthday_discovery_opt_in` is
  `$fillable` (the creator sets it on their own profile); `birthday_day` / `birthday_month`
  are **cast-only and derived** by `ProfileController` from `date_of_birth`.
- 🚨 **ONE COPY PER PERSON for the Monday campaign.** It claims a row in
  `engagement_notifications` keyed `type = birthdays_this_week` + `dedup_key = <ISO week>`
  — **the week only, no creator id** — so supporting eight of that week's creators still
  produces one e-mail. The per-creator REMINDER is deliberately the opposite: one per
  creator, keyed `{creatorId}|{stage}|{year}`.
- 🚨 **Eligibility is DUPLICATED from `CreatorRecommendationService::eligibleCreators()`
  clause for clause** (role 1, not suspended, `profile_status_lock = 2`, approved avatar,
  name + username, `exclude_from_discovery` off) plus opt-in and ≥1 live item. The
  duplication is deliberate — Phase 3's service is owned elsewhere — so a data-provider
  test asserts BOTH services agree on every clause. Change one, change the other.
- **Sending ships OFF.** `DISCOVERY_BIRTHDAY_REMINDERS` / `DISCOVERY_BIRTHDAYS_THIS_WEEK`,
  both default false; a flag-off run reports and claims nothing (so the first real send is
  never suppressed). The collection page is **not** flag-gated — it answers to the DATA
  (`collection_min_creators`, default 3) and renders a coming-soon state below it, and the
  campaign waits for the same number so an e-mail CTA never lands on a greyed page.
- 🚨 **A SUSPENDED ACCOUNT IS NOT MAILED — found by the tests, 21 Aug 2026.** `birthday:weekly`
  is the platform's largest fan-out (every account with an address) and had **no
  `suspended_account` filter**, so a suspended account received a promotional round-up;
  `birthday:remind` had the same hole and it is reachable in ordinary data, because a
  supporter is selected out of `financial_transactions` and somebody who paid before being
  suspended stays in that list for ever. Both now filter. `AnnounceSubscriptionPolicy` is
  the precedent — it excludes them in its send AND its remaining-count query.
- **Attribution:** reserved keys `birthday-reminder` and `birthdays-this-week`, both
  SP-generated, tagged **server-side** via `DiscoverySources::profileUrl()` — never
  hand-built in Blade. ⚠️ Both mailables' `$creator`/`$creators` are **`protected`, not
  public**: `Mailable::buildViewData()` merges public properties OVER `Content(with: …)`,
  which silently replaces the tagged array with the raw one (see the section below on that
  trap). Asserted against rendered HTML, not the payload.
- **Unsubscribe works on day one** on every birthday e-mail — the reminder is
  category-class (`creator_updates_enabled`, via `EmailService::sendCategoryEmail`), the
  weekly campaign is marketing-class (`sendMarketingEmail`). Neither may use `Mail::to()`.
- **Admin app:** the three columns are mirrored as **casts only** in its own `User` —
  deliberately none of them `$fillable`, because the two derived columns must keep agreeing
  with `date_of_birth` and the opt-in is the creator's own campaign consent. A back-office
  opt-out, if ever needed, is a validated endpoint writing `forceFill()` + an audit note,
  exactly like `exclude_from_discovery`.
- Tests: `tests/Feature/BirthdayDiscoveryTest.php` (36).

## 🚨 The bio page sells now — Link in Bio, B stream (21 Aug 2026, spennypiggy.co)

`/{username}/bio` carries item cards that lead, in one tap, straight into the checkout
each listing already had. Client brief: Developer Master Plan, 19 Aug 2026, §B.
🚨 **`Pages/Bio/Show.jsx`'s old docblock claim — "no checkout, no price and no payment
method" — is SUPERSEDED and has been rewritten in place.** Anything still quoting it
(including the A3 note above) is describing the page as it was before this.

- 🚨 **THERE IS STILL NO CHECKOUT ON THIS PAGE, AND THAT IS THE WHOLE DESIGN.** A card is
  a link to a buying path that already exists: wish → `wish.subscribe.checkout` ·
  shop → `single-shop-list` (its own page, which carries `BuyShopItem` and the
  shipping/quantity fields an order needs) · task → `task.show` · bill →
  `bill.checkout` · membership → `membership.checkout` · pot → the profile's pot grid
  with `?pot={uuid}`. Every rule runs where it always did, on arrival:
  `CheckoutMethodResolver`, the risk engine, `Helpers::priceWithinLimits`, the
  supporter-account requirement, the £1 card-verification gate, `fee_profile`
  threading, and the Deliverable. **Nothing in this feature creates a payment intent or
  computes a price.**
- 🚨 **A CARD SHOWS THE CREATOR'S LISTED PRICE, NEVER THE SUPPORTER'S TOTAL.**
  `creator_bio_items` (migration `2026_08_21_100000`) stores a **type and an id and
  nothing else** — no title, no price, no image. Every word and figure is read from the
  live listing at render, so an edited price, a closed pot, a sold-out item and a
  moderation hold all take effect with no editing and no cron. A denormalised price on
  the page a creator shares everywhere is a price that will eventually disagree with the
  checkout behind it.
- 🚨 **MODERATION IS THE PROFILE'S OWN FILTER, REUSED.** `BioPageService::items()`
  selects only listings whose approval columns are clear, that are not suspended and
  (pots) that `PiggyPotStatusService::scopePubliclyVisible` accepts — so an item held by
  `CheckMediaModeration` has no card. The selection row **survives** the hold and the
  card returns on its own when an admin clears it. There is deliberately **no free-text
  field on an item**: the listing's title has already been through
  `NoExpenseOrBrandName` and the media scan, and a renameable card would be a new
  moderated surface. ⚠️ The live filter is **re-run at click time**, not trusted from a
  render that can be a minute stale.
- **`App\Support\BioSellableItems`** is the ONE place a card becomes a checkout —
  `checkoutUrl()`, `requiresAccount()` (Bills/Memberships/Tasks/Shop true;
  guest checkout only for Wishes and Piggy Pot, matching the compliance rule), `cta()`,
  `MAX_ITEMS` (12). ⚠️ **The type list is `CatalogueRegistry::TYPES`, never restated** —
  and the editor's picker is `CatalogueService::for(..., status: live)`, the same list
  My Listings shows.
- 🚨 **PIGGY POT IS THE ONE TYPE WITH NO STANDALONE CHECKOUT PAGE.** It is bought through
  `PiggyPotWidget`, opened as a popup by `PiggyPotsGrid`, so the deep link is
  `/{username}/piggy-pots?pot={uuid}` and that grid now opens the named pot on arrival.
  ⚠️ The parameter can only select from the pots the server already sent, so it can never
  surface one the page was not allowed to show. Building a second pot checkout to avoid
  the hop would create the new Stripe surface this feature exists to avoid.
- **Attribution: `/bio/buy/{uuid}` is the load-bearing moment.** It counts the tap, sets
  the `sp_disc` cookie to **`bio-link`** (CREATOR-generated — the brief is explicit that
  sales from a creator's own link are their traffic), and redirects to a destination
  rebuilt server-side from the stored row. `AttributionService::sourceForCreator()` reads
  exactly that cookie inside every buy path, so the key reaches the payment row and
  `financial_transactions.discovery_source` with no further wiring.
  🚨 **The page also stamps, and when it does it DROPS the shared-cache header** —
  `sp_disc` is a per-visitor map, and a CDN holding a response with that `Set-Cookie` on
  it would hand one visitor's attribution to the next hundred. The page only queues the
  cookie when the map would actually change, so a repeat view is still edge-cached; the
  redirect stamps unconditionally and is never cached, which is what makes it the
  reliable one.
- **Tip button — built in full, switched off.** `App\Support\BioTipRail` (USD/USDC, min
  $5, max $1,000, presets 10/25/50/100/250/500, £1 admin fee **added to** the tip) +
  `App\Services\Bio\BioTipService` (`payload()`, `quote()` which FREEZES the rate,
  `amountError()`, and `send()` — the single unimplemented seam) + `BioTipController`
  (`/bio/tip/quote`, `/bio/tip/{username}`). Switched by the existing
  **`config('discovery.labels.tips')`** key, the same one the three marketing surfaces
  read, so one flip turns the product on and removes COMING SOON from the ads together —
  a config change, no deploy.
  - 🚨 **The greyed button is a rendering decision; BOTH endpoints answer 503 while the
    flag is off.** Anyone can post past a disabled control.
  - 🚨 **NEVER "instant" / "immediate" / "seconds", and NEVER the provider's name** on any
    user-facing surface. No settlement speed has been confirmed by anybody.
  - 🚨 **A tip is the ONE payment with no deliverable**, so it creates no `Deliverable`,
    carries no `fee_profile`, never calls `calculateStripeDirectChargeFlow`, and is
    deliberately NOT run through `Helpers::priceWithinLimits` (that rule is the
    content-first per-feature price band and would apply the wrong floor and ceiling).
  - ⚠️ **THE PROVIDER IS UNSETTLED IN OUR OWN DOCUMENTS.** `constants/stablecoinTips.js`
    records Coinflow (spec 6 Aug 2026); the 19 Aug plan says Bridge and supersedes older
    references. Everything built here is provider-agnostic and neither name is
    user-facing — but the two documents disagree and only the client can settle it.
- ✅ **`config/discovery.php`'s `bio_direct_sales` key flipped to `live` on 20 Aug 2026**,
  in this release — that is what turned A3's sections 3 and 6 from COMING SOON to LIVE NOW.
- ⚠️ The Tip amount UI is appended INSIDE `Show.jsx`'s existing `Stablecoin` component
  rather than replacing it, so A3's copy of that card (which the brief requires to look
  "exactly as it appears in the product") is still a truthful subset.
- Tests: `tests/Feature/BioDirectSalesTest.php`.

## 🚨 Enhanced Creator Earnings + Revenue Opportunity Centre (21 Aug 2026, spennypiggy.co)

The brief's nine rows (Developer Master Plan, 19 Aug 2026, §C) were **already built** as
`CreatorOpportunityService` + `CreatorFinancialController::opportunities()` + the
`Creator/Financial/Opportunities` page. Rows 1–8 existed; **row 9 did not** — the module was
a page you had to go and find, reached by a plain "Grow your income" link. That link is now
`Components/earnings/OpportunityPanel.jsx`, rendered directly under `DiscoveryStatsPanel` in
the owner-only column of `Pages/Dashboard.jsx`. **Find out what exists before building here —
`VipScoreService`, `SupporterLapseService`, `NotificationDispatcher` and
`EngagementNotification` all already back parts of this.**

- 🚨 **`LedgerRules` NOW HAS A SQL SIDE, AND IT IS THE ONLY ONE.** `CREATOR_GROSS_SQL`,
  `BUYER_PAID_SQL` and **`countedScope($query)`** are the aggregate twins of `creatorGross()`,
  `buyerPaid()` and `countsTowardTotals()`. An aggregate screen cannot hydrate every row to
  call the PHP readers, so before this it retyped the expressions — which is exactly how the
  four surfaces `LedgerRules` reconciles drifted apart originally. **Change one, change its
  twin, same commit.** Pinned row-by-row by `EarningsIntelligenceTest`.
- 🚨 **`whereNotIn('status', [refunded, disputed, review_hold, pending, failed])` IS NOT THE
  MONEY GATE and looks exactly like it.** It admits `processing` (bank money that has not
  settled) and applies **no fulfilment gate at all**, so it counts a physical shop order
  nobody posted and a timed task nobody accepted. `CreatorOpportunityService::incomeQuery()`
  and `remindSupporter()` both carried one, so the Opportunity Centre reported a bigger pot
  than the earnings dashboard beside it and than the payout run. Both now use
  `LedgerRules::countedScope()`. ⚠️ `SOLD_EXCLUDED_STATUSES` is the one deliberate survivor —
  "has this creator ever sold a membership" is not a money question, and a settling bank
  payment means yes.
- ⚠️ **`countedScope()`'s morph comparison is `COALESCE(source_type,'')`, not `source_type`.**
  `source` is a nullable morph; `NOT (NULL AND TRUE)` is NULL, which SQL drops — so a row with
  a null `source_type` whose `source_id` collided with a `task_purchases` id vanished from
  every total, silently. The shop branch picks the deliverable by **lowest id**, matching
  `fulfilmentMap()`'s `orderBy('id')->first()`; `hasOne()` on `session_id` has no deterministic
  order and the two must not disagree.
- 🚨 **A supporter's "lifetime spend" is `buyerPaid()`, not `creatorGross()`.** This screen
  labelled the creator's gross as the supporter's spend — short of what that person was
  actually charged by the whole fee stack, and in disagreement with their own Purchase Hub.
  `supporters()` now returns **both**: `lifetime_spent` (what they paid) and `lifetime_earned`
  (what the creator kept), and the UI labels them "Paid you" / "You earned". Revenue-by-feature
  stays `creatorGross()` — that one genuinely is the creator's revenue.
- **Row 2 labels are the brief's current feature names**, with the in-product menu name
  carried alongside as `product` so a creator reading "Recurring Content" can find the thing
  their nav calls "Bills": Memberships · Recurring Content (Bills) · Sell Exclusive Content
  (Wishlist) · Paid Tasks · Shop (Sell Something) · Content Goals (Piggy Pots).
  🚨 **The brief's seventh name is "Tips" and we ship "Piggy Bank"** — tip/donation vocabulary
  is banned on every user-facing surface by the Stripe content-first rule, and a standing
  prohibition beats a row label (same call as the A3 ad page). Pinned by two tests.
  ⚠️ `RyeProductPayment` is absent from the map, so Oink Store income is not in this
  breakdown — it is kill-switched, and the brief lists seven features.
- **Row 8's prompt is one constant**, `CreatorOpportunityService::SOCIAL_CHANNELS_PROMPT`,
  transcribed verbatim. ⚠️ **It is a privacy control, not copy.** The platform never gives a
  creator a supporter's email, so an action that says "contact this person" must say how, or
  the next question becomes "show me their address". Supporter privacy on these screens is
  exactly three fields: **display name (or Anonymous), amount, country**.
- **`App\Support\OpportunityPanelPayload`** is the one shape the dashboard module receives —
  same arrangement as `DiscoveryPayload`. ⚠️ **`supporterCard()` whitelists keys by name**
  (never spreads the service row), so `supporter_id` and `username` cannot reach a dashboard
  by being added upstream. 🚨 **Owner-and-creator gated in
  `AuthenticatedSessionController`** — `/{username}` is also the PUBLIC profile, and this
  payload is a creator's customer list.
- **`config/earnings_intelligence.php` decides LIVE vs greyed "Coming soon", per row, in
  config** — Section F requires a label flip with no deploy, so it is PHP config and not a JS
  constant (copy lives in `resources/js/constants/earningsIntelligence.js`, the house
  pattern). Env: `EI_ROW_*` (nine, all default **true**) and `EI_PANEL_CACHE_SECONDS` (300).
  🚨 **All nine rows always draw; only their `live` flag varies** — the brief's own rule is
  that an unfinished row ships greyed rather than missing. ⚠️ **Greying keys on the FLAG,
  never on whether data arrived**: a creator with no alerts this week must not be told the
  feature is "Coming soon". ⚠️ **Row 7 (`reminder_action`) HIDES its control when false
  rather than greying it** — every other row is a read; that one sends mail.
- **Caching:** `opportunity_panel_v1_{id}_{CCY}` (dashboard) and
  `opportunity_centre_v1_{id}_{CCY}` (full page), both `EI_PANEL_CACHE_SECONDS` — the same TTL
  as `DiscoveryPayload::dashboardStatsFor` above it, because two panels side by side that
  refresh on different clocks read as one being broken. ⚠️ **The key is per-currency and the
  display currency follows a COOKIE**, so `financial.refresh` drops all three candidates
  (cookie, account default, GBP). `forDashboard()` swallows its own failures — an analytics
  roll-up must never 500 a public profile.
- **No new routes and no migration.** `financial.opportunities` and
  `financial.opportunities.remind` (`throttle:10,1`) already existed.
- Tests: `tests/Feature/EarningsIntelligenceTest.php` (12), alongside the existing
  `CreatorOpportunityTest.php` (9).

## 🚨 A public property on a Mailable silently overwrites its view data

`Mailable::buildViewData()` reflects over **public** properties and merges them
**over** the `Content(with: […])` array. So a promoted constructor property named the
same as a key `content()` computes wins — and the computed version is discarded.

- **Live consequence, found 20 Aug 2026:** `ReactivationReminder::content()` passed
  `taggedCreators()` (each profile URL carrying `?sp_d=personalised`) under the key
  `creators`, and `public array $creators` replaced it with the raw untagged input. The
  email rendered perfectly — right creators, working links — and carried **no attribution
  at all**. Measured: `taggedCreators()` returned a tagged URL while the rendered HTML
  contained **zero** `sp_d=`. Discovery attribution has no backfill, so every visit and
  purchase that email produced is permanently recorded as creator-generated.
- **Fix:** make the property `protected`. It still serializes for the queue, so nothing
  about dispatching changes.
- ⚠️ **Check any mailable that transforms a constructor value in `content()`.** The
  collision only bites when the names match.
- 🚨 **SWEPT ALL MAILABLES, 24 Aug 2026 — TWO MORE WERE LIVE.** 19 carried a public property
  matching a `content()` key; a plain `'x' => $this->x` passthrough is harmless (the merge is
  a no-op), so only the COMPUTED ones are faults:
  - **`AbandonedCheckoutReminder::$firstName`** — the earlier note here said this class was
    fine, which was true of its tagged URL and **wrong about the greeting**.
    `resolvedFirstName()` exists to fall back to `"there"` when no name is known, and a
    public `null` overwrote it: the mail rendered *"You are one step away, "* — a dangling
    comma with nothing after it, on a recovery e-mail sent to supporters.
  - **`ContentUnderReview::$manageUrl`** — an empty string overwrote `content()`'s
    `config('app.url')` fallback, so a mail sent without an explicit URL rendered
    **`href=""`**: a link to nowhere, on the e-mail telling a creator their item is held.
  - **`StockBackInStock::$stock`** — overwrote a `max(0, …)` clamp, making it dead code
    (minor; the column is an int and normally positive).
  All three are now `protected`, which still serialises for the queue. Tests:
  `tests/Feature/MailableViewDataCollisionTest.php` (3) — two render assertions plus a
  **general guard that scans every Mailable**, so the next one fails a test instead of
  shipping. ⚠️ Verified the tests FAIL against the bug (properties flipped back to public)
  before accepting them; asserted on RENDERED output, since the payload is exactly what
  lies here.

## 🚨 The admin app's health endpoints did not exist

`admin.spennypiggy.co/vapor.yml` sets `health-check: '/vapor-health'`, but
`routes/health.php` was never `require`d — `RouteServiceProvider` grouped only `api.php`
and `web.php` — so `/vapor-health`, `/health` and `/ping` all 404'd. Every health check
Vapor made against that app failed, and **nothing reported it**: a 404 reads as an
unhealthy app, not as a missing route.

- Now registered with **no middleware group**, deliberately. The `web` group carries
  sessions, CSRF and this app's maintenance-mode middleware — behind those, the one request
  that must answer during an incident is the one that stops answering when the site is taken
  down. The file's own docblock asks for the same thing.
- The three endpoints return a literal status and nothing else, so there is nothing for an
  unauthenticated caller to learn.
- ⚠️ The website is NOT affected: its `vapor.yml` sets `health-checks: false` and its health
  routes resolve anyway.

## ⚠️ A cache key must carry every input that changes the payload

`BioPageService::items($user, $isOwner)` returns a different list for an owner (who sees
their inactive selections) than for a visitor — and cached both under `bio_items_{id}`.
The live flow hid it, because the owner is always signed in and takes the
`auth()->check()` branch that skips the cache. That is what made it dangerous: the fault
only surfaces the day something calls it for an owner without a session — a queued job, an
artisan command, an SSR render — and then it serves the wrong payload in silence.

⚠️ **Changing a cache key means changing its eviction too.** The first fix left
`forgetCaches()` forgetting the bare key, so a creator editing what their bio page sells
would have gone on serving the stale public list until the TTL expired — exactly when it
is most wrong. Both variants are now forgotten.

## The bio page redesign + its three product gaps (20 Aug 2026, spennypiggy.co)

`/{username}/bio` was reworked against client-supplied link-in-bio references, over four
passes — mint-with-frames was rejected three times before the dark direction below.

**Design rules this page now follows (`Pages/Bio/Show.jsx`) — settled after six passes;
mint-with-2px-frames, then a full dark theme, were both rejected:**
- **Ground is `#FFF6EC`** — the app's own warm cream (Dashboard uses it), not a colour
  invented for this page. Surfaces are white; **every drawn line is 1px black**
  (`border border-[#000]`). ⚠️ Never `border-black`: that class is a `border:2px` SHORTHAND
  in `resources/css/index.css` and silently resets the width.
- **The link tiles are colour-blocked, one fixed tint per module** (`LINK_TINTS`, keyed on
  the server's `target_type` so a reorder never re-colours a tile the creator learned). All
  brand pastels, all with black type and a black edge.
- **The hero is RESPONSIVE IN KIND, not just in size:** on a phone the cover is full-bleed
  and fades out of its own bottom edge; at `md` it is a framed card. ⚠️ The fade is a
  **mask** (`mask-image` + `-webkit-mask-image`, both, switched off at `md`) — a wash in the
  page colour turned a dark cover grey. 🚨 `mask-image` CREATES A STACKING CONTEXT, so the
  content block needs `relative z-10` or the masked cover paints over the avatar and its
  fade dims it.
- 🚨 **Top spacing belongs to the shell (`md:pt-5`), never as `mt` on the hero.** A margin on
  the first child collapses through the container, and `html`/`body` are BLACK in this app —
  that gap rendered as a black band across the top of the desktop page.
- **`gulfs` is spent on the creator's name (24px) and the small section rules, nowhere
  else**; everything a person reads is Poppins with real weights. Creator-authored text is
  never display caps — it mangles long titles and cannot render accents. The verified tick is
  sized through the component's own `SIZES` map (`size="lg"`) and centred with
  `items-center`, never with a Tailwind text class.
- **Item cards are full-width product ROWS; internal links are a 2-up TILE grid.** Navigation
  is not merchandise — seven full-width nav rows outweighed everything for sale. ⚠️ Tile
  labels are `line-clamp-2` **and `break-words`**, with smaller type/padding below `sm`:
  "Memberships" is one word, so clamping alone let it overflow a 320px tile. ⚠️ The odd tile
  spans both columns and `bills` claims that slot (longest label), falling back to whichever
  label is longest.
- **Three radii only** — `rounded-box` for things that contain things, `rounded-box-sm` for
  what sits inside one (incl. the announced-tip strip, an alert ROW not a panel),
  `rounded-box-xs` for badges and progress bars. Verified live: 24/16/10 at 390px and
  30/20/12 at 1440px, no other radius on the page but the circular social chips.
- **One accent, and it belongs to the money.** Pink is buy buttons and the "Buy from me"
  rule; **mint is progress**. Black on pink, never white.
- **An announced-but-unbuilt feature gets a line, not a form.** The stablecoin block ran
  ~900px of disabled checkout — bigger than everything buyable — and is now one dashed strip;
  the wired `TipAmounts` picker renders only when BOTH switches say live.

**Three product gaps found and fixed:**
- 🚨 **New route `GET /bio/pot/{pot}` (`bio.pot`)** — the featured tile was the only element
  counting nothing and the only one that could reach a checkout without a click-time
  `bio-link` stamp (the page itself may be CDN-cached with its Set-Cookie stripped). Same
  contract as `/bio/buy`: uuid in, destination rebuilt server-side, pot re-checked as
  publicly visible at tap time. It also fixes the destination — the old link dropped the
  visitor on the pot GRID because it carried no `?pot=`.
- 🚨 **Migration `2026_08_20_000100`: `piggy_pots.bio_click_count` + `bio_last_clicked_at`.**
  Shared DB — `PiggyPot` in BOTH apps carries them in `$fillable`. Surfaced to the owner in
  the bio page's owner bar; the featured pot usually has no `creator_bio_items` row to count
  on.
- 🚨 **The featured pot is never also a card** — a creator who had selected their pinned pot
  as an item got it twice on one screen. `card()` returns `listing_uuid` for a pot and
  `BioPageController::show()` drops the duplicate; the hero survives.
- ⚠️ **Bio payload caches are now busted by the LISTING, not only by the bio editor.**
  `AppServiceProvider::registerBioCacheBusting()` hooks `saved`/`deleted` on Shop, WishItem,
  Bills, Membership, PiggyPot and Task (`creator_id`, not `user_id`) →
  `BioPageService::forgetCachesForUserId()`. A price corrected in Shop kept being advertised
  for up to 60s on the page the creator shares everywhere. The admin app has its own cache
  store, so an admin-side edit still waits out the TTL — bounded, deliberate.
- ⚠️ **The empty state keys on SELLABLE things** (`items.length === 0 && !featured`), not on
  links too: internal buttons are derived, so a creator with one post has seven of them and
  the one creator with nothing buyable used to get no prompt at all. Owner copy points at
  the editor, visitor copy at the profile.

## 🚨 Identity / KYC data now has a retention job — `identity:prune` (23 Aug 2026, spennypiggy.co)

Identity data was the only class of personal data on the platform with **no prune at all**,
while `item-views:prune`, `help:prune`, `signup-leads:prune`, `notification-logs:prune` and the
activity-feed sweep all bound their tables. The one deletion anyone ever wrote for it is still
**commented out** at `ProfileController::deleteAccount` (`// UserDocuments::where(...)->delete();`).

**What is actually held locally.** Verification is Stripe-hosted end to end —
`StripeController::createVerificationSession()` mints the session, the document never touches
this server, and on a pass `StripeWebhookController` calls
`identity->verificationSessions->redact()`. Two residues survive that:

- **`user_documents`** — legacy SumSub-era rows. ⚠️ **Every `front`/`back` value on the dev
  database is a bare 36-char UUID**, and admin.spennypiggy.co's `UserDocuments` model appends
  `front_url`/`back_url` = `https://ucarecdn.com/{value}/`, rendered as an `<img>` in
  `Admin/Users/details/Documents.jsx` — an unsigned, non-expiring public CDN URL for a photo ID.
  ⚠️ **Nothing writes new rows.** The only writer is `Auth\TestController::reviewWebhook()`,
  which instantiates `App\SumSubClient` — **a class that does not exist in this codebase**, so
  the path fatals before it inserts. The table has been frozen since 2024-12-19.
  🚨 **CONFIRMED LIVE, 23 Aug 2026 — these are not hypothetical.** A `HEAD` of all 8
  references on the dev database (4 rows × front + back) returned **HTTP 200 `image/jpeg`,
  7KB–1.5MB each**: three ID cards and a residence permit, readable by anyone holding the
  URL, with no authentication and no expiry. Do the same check against production and delete
  what you find — `identity:prune` only reaches rows past the retention window.
- **payload columns on `users`** — `identity_verification_details`, `identity_verification_error`,
  `identity_admin_notes`, `kyc_error`.

🚨 **The command clears evidence, never the attestation.** `identity_status`,
`identity_verified_at`, `identity_admin_status`, `identity_admin_reviewed_at` and
`kyc_verification_status` are the **outcome** of a check and are **never touched** — nulling them
would silently un-verify a live creator and destroy the platform's own proof a check ran. Never
add them to `PruneIdentityData::PAYLOAD_COLUMNS`.

🚨 **It is REPORT-ONLY until armed.** `IDENTITY_RETENTION_ENABLED` defaults to **false**, and the
reason is structural, not timidity: **this schema has no legal-hold marker of any kind** — no
`legal_hold` column, flag, model or table in either app. Every other exclusion is derived from a
marker that provably exists; "under legal/regulatory hold" cannot be expressed, so a human arming
the flag stands in for it. Deleting identity evidence during a live dispute is worse than keeping
it too long.

**Exclusions — a user matching ANY of these keeps their identity data regardless of age:**

| Hold | Marker (all verified against the live schema) |
|---|---|
| Suspended account | `users.suspended_account != 0` |
| Open dispute | `disputes.creator_id` (= **`users.uuid`**, per `Dispute::creator`) with `resolved_at IS NULL` **or** status outside `won`/`lost`/`warning_closed` |
| Open early fraud warning | `early_fraud_warnings.closed_at IS NULL`, owner resolved **through `payments`** — ⚠️ the model's `creator()` relation points at a `creator_id` the table does not have |
| Payment still moving | `payments.status` in `initiated`/`step_up`/`review_hold`/`processing`/`disputed`/`blocked`/`failed`, or `platform_holds_funds = 1` |
| Payout not settled | `payout_records.status` outside `paid`/`zero_payout` — ⚠️ **`failed` is NOT settled**: `requeueFailedRunPayout()` retries it, so the money is still owed |
| Earnings unpaid / reserve held | `financial_transactions.payout_run_id IS NULL` **or** `reserve_status = 'held'` |

- An **orphan** `user_documents` row (a `user_id` with no `users` row) is releasable — every
  exclusion is a property of a user who no longer exists.
- Config `config/identity_retention.php`. Env: **`IDENTITY_RETENTION_ENABLED`** (default `false`,
  arms deletion), **`IDENTITY_RETENTION_DAYS`** (default `1825` = five years, deliberately the UK
  MLR 2017 statutory maximum, so out of the box it finds almost nothing — the window is a
  compliance decision), **`IDENTITY_RETENTION_CHUNK`** (default `500`).
🚨 **THE ROW IS NOT THE DOCUMENT.** Deleting only the `user_documents` row leaves the photo
ID on a permanent public CDN URL with **nothing left pointing at it** — unfindable, and
impossible to clean up afterwards. That is strictly worse than keeping the row, so the
command deletes the **Uploadcare object first** (`Uploadcare::getApiObj()->file()->deleteFile()`,
bare-uuid values only — a Stripe/SumSub id is not ours to delete) and **keeps any row whose
CDN delete failed**, so the next run retries it. "Already gone" counts as success.
`IDENTITY_RETENTION_DELETE_CDN` (default true) and `--keep-files` disable it; both print a
warning, and it is forced **off in `testing`** via phpunit.xml so the suite never calls
Uploadcare.

- `identity:prune {--days=} {--dry-run} {--details} {--keep-files}`, scheduled **daily 03:45** (clear of the
  03:40/03:50/03:52/03:55/03:57 prunes — on Vapor every command due in the same minute shares one
  cli-timeout budget). It never calls Stripe.
- ⚠️ **`user_documents` was in NO migration in this repo** — it existed only on live databases, so
  nothing touching it could be tested. `2026_08_23_200000_create_user_documents_table.php` adds a
  **guarded** create (no-op where the table exists) mirroring the admin app's
  `2026_04_28_000006_create_testing_core_tables`. Its `down()` is a deliberate **no-op**: it would
  otherwise drop a production table it never created.

## 🚨 Paid content is signed; public media is NOT (23 Aug 2026, spennypiggy.co)

`App\Support\SecureMedia` is the ONE place a PAID deliverable's CDN URL is signed.
Everything a supporter buys used to resolve to a bare, permanent
`https://ucarecdn.com/{uuid}/…` — no expiry, no revocation. The access control around it
is real but only ever **HIDES** the URL (`UserProfileService::stripLockedMedia()`,
`Shop::withDeliverable()`, `Membership::$hidden`), so anyone who ever paid kept a
shareable link **after a refund, a cancelled membership, a chargeback, or the listing
being deleted**.

- 🚨 **SHIPS OFF (`MEDIA_SECURE_ENABLED`, default false) AND MUST STAY OFF UNTIL A HUMAN
  ENABLES SECURE DELIVERY IN THE UPLOADCARE DASHBOARD** (Project → Delivery) and pastes
  the hex CDN secret it issues into `UPLOADCARE_SECURE_KEY`. With the account setting off
  a token is an ignored query parameter (harmless, but buys nothing); with the setting on
  and the flag off, **every paid download 403s**. Verify with **`php artisan
  media:secure-check`** before flipping anything — it reports signed vs unsigned status
  codes separately, because the key being wrong and the setting being off are different
  failures that look identical.
- ⚠️ **`UPLOADCARE_SECURE_KEY` is not necessarily `UPLOADCARE_SECRET_KEY`.** `SecureMedia`
  falls back to the API secret (which on this project is a valid 20-char hex string, so the
  fallback works) — but if the project's CDN secret differs, that fallback signs with the
  wrong key and 403s everything while looking exactly like a misconfigured account.
- 🚨 **SIGNING THE WRONG THINGS IS WORSE THAN SIGNING NONE.** A token breaks edge caching
  and OG/link previews and puts an expiry on something meant to be permanent. `SecureMedia`
  does not decide what is paid — **the call site does**.
  - **SIGNED:** `WishItem::reward_url` · `WishItem::content_file_url` ·
    `Bills::content_file_url` · `Membership::content_file_url` · `Shop::reward_file_url` ·
    `StripePaymentItems::message_url` · `RewardService::media()` (the ONE builder for the
    unified `reward_file` column, so it covers task and Piggy Pot, which have no accessor
    of their own) · `Post::image_url` **only when `isGatedContent()`** ·
    `DeliveriesController`'s redirect · `Api\DeliverableController`'s `content_url` ·
    the `$cdn()` closure on the buyer's own Support History feed.
  - **DELIBERATELY UNSIGNED:** every `perma_link` card thumbnail (Wish/Bill/Membership/
    Shop/Pot/Task) · `User::avatar_url` / `cover_url` / `social_image_url` ·
    `Post::image_url` on a `public` post · `SeoTemplateService` / `ItemShareService` /
    `CatalogueService` OG images · `PresetCovers` · `UploadcareThankYouImageService` ·
    a creator's own non-Uploadcare link (a Dropbox URL is returned untouched).
- ⚠️ **The operation chain is preserved byte-for-byte and the token goes AFTER it.** A paid
  reward file is never width-capped (see the `MediaUrl` section) and signing must not
  become a second place that re-processes it. The ACL is `/{uuid}/*`, not `/{uuid}/` —
  our paid URLs carry ops, and the bare ACL would authorise only the untransformed original.
- **Token lifetime is 3600s (`MEDIA_SECURE_TTL`), not the 300s the old dead signer used.**
  300s can expire mid-download of a large video, and a 4GB download that dies at 40% is a
  support ticket. `MEDIA_SECURE_DELIVERY_TTL` (30 days) exists for links that leave the
  site in an e-mail; it is clamped at both ends (60s floor, 30-day ceiling).
- 🚨 **THE STORED `deliverables.deliverable_url` COLUMN IS DELIBERATELY LEFT UNSIGNED.**
  A token written at purchase time expires and then serves a permanently broken link, and a
  leaked row would carry a live grant. Signing happens at **read** time in
  `DeliveriesController` (per click) and `Api\DeliverableController`. Receipt e-mails
  already point at `route('deliverable.access', $uuid)` rather than at the CDN, so the whole
  e-mail path inherits the per-click mint. Same reasoning keeps `RewardService::media()`'s
  `uuid` key bare — callers re-derive from it, and forms round-trip it.
- ⚠️ **STILL UNSIGNED, KNOWN GAP: a members-only post's MULTI-IMAGE `media[]` array.**
  `Post::$casts` sends it raw and `PostMediaCarousel.jsx` builds each URL client-side from
  the bare uuid.
  - 🚨 **THE ROUND-TRIP IS REAL — CONFIRMED 23 Aug 2026, and it is now CLOSED at the write
    path.** `AddPost.jsx` opens an edit with the post's own stored array (`mediaFromItem`)
    and submits it back verbatim (`media: mediaList`), and `dedupeMedia` is the ONE write
    path for both store and update — so a `signed_url` appended at render time WOULD have
    been persisted, expiry and all, into the column for ever: the `piggy_pots.cover_media`
    trap exactly. `PostsController::storableMediaEntry()` now whitelists the uploader's own
    nine keys and drops everything else on the way in, so a read-time accessor may add
    whatever it needs. Pinned by `tests/Feature/PostMediaRoundTripTest.php` (4).
  - ⚠️ **The signing itself is deliberately NOT done yet**, and not for want of the
    blocker: `MEDIA_SECURE_ENABLED` is still false and secure delivery is not enabled in
    the Uploadcare dashboard, so a token today buys nothing — while the carousel's own
    `mediaSrc()` appends transform ops AND an optional watermark chain AFTER the URL it is
    given, which would land after the `?token=` and corrupt it. Signing the wrong things
    is worse than signing none (the rule above). Do it when the flag is armed, ops-chain
    order first.
- ⚠️ **Signing is not authorisation.** `content_file_url` is in `$appends` on Bills,
  Membership and WishItem and is **not** in `$hidden` the way `reward_body` is — so a public
  listing card can still serialise it. A signed URL handed to a non-buyer is a valid
  one-hour download. That is a separate finding and signing does not close it.
- ⚠️ **`App\Uploadcare::getUrl()` is superseded.** Its two call sites
  (`StripePaymentItems.php`, `WishItem.php`) were commented out; both are now served by
  `SecureMedia`. Its `AkamaiToken` path also calls `getExpired()` twice — once for the URL
  and once inside the HMAC — so it can sign a different timestamp than it prints.
- Tests: `tests/Unit/SecureMediaTest.php` (21).

## Intro videos are a CREATOR surface (21 Aug 2026, spennypiggy.co)

A gifter (role 0) uploaded an intro video, because **nothing on the path checked
the role** — not `POST /update/intro/video`, not the component, not the discovery
query. Intro videos feed the profile identity rail and the `/discover` intros
rail, both of which answer "who is this creator".

- **`ProfileController::saveIntroVideo` answers 403** to any account with
  `(int) role !== 1`. This is the real guard; everything below is display.
- **`AuthenticatedSessionController::getUserProfile`** builds the `intro` PAGE
  PROP (⚠️ *not* `OptimizedProfileController`, which also declares one — the
  `/{username}/{page?}` catch-all routes to the former). Both now send `null` for
  a non-creator, which blanks the card for owner and visitor alike.
- **`WishitemController::discover_all_creators`** gained `where('role', 1)` on
  both the eager-load closure and the `whereHas` — the intros rail had no role
  filter at all. ⚠️ It is cached 600s per `{order}_{gender}_{page}`.
- **`DiscoveryService::getSearchCreators`** gates the intro **per row**
  (`$u->intro && (int) $u->role === 1`): search is the one discovery query that
  deliberately returns fans as well as creators, so its own role filter cannot do it.
- **`AddIntro.jsx`** returns null when the role is known and not 1 — owner reads
  `auth.user.role`, visitor reads `user.role`. An **unknown** role still renders:
  `ProfileSteps` mounts it without a `user` prop, so guessing "gifter" would blank
  the card for creators. ⚠️ The check sits AFTER every hook.
- 🚨 **A gifter is never OFFERED the upload either** — the empty AddIntro card *is*
  the "add" affordance for the owner, so hiding the video alone would still show a
  gifter an upload box. Both call sites carry their own creator gate:
  `Dashboard.jsx` (`isCreatorProfile`, the profile OWNER's role — also keeps the
  lazy chunk off a gifter's page) and `ProfileSteps.jsx`'s "Add Intro Video" row.
  The checklist only mounts for a Stripe-connected account, but the role check is
  explicit rather than second-hand.
- **Existing gifter rows are hidden, NOT deleted** (client decision) — a gifter who
  later becomes a creator keeps their upload.
- Tests: `tests/Feature/ProfileIntroPropTest.php` (11). ⚠️ `UserIntro`'s poster
  accessor indexes straight into `result.result[0]` with no guard, so an
  `Http::fake` returning a bare 200 fails with *"Undefined array key"* and reads
  like a role-gate failure — fake the `generateThumb` shape.

## 🚨 Production Sentry sweep (21 Aug 2026, spennypiggy.co)

Seven live faults off the Sentry project `spenny-piggy/javascript-react`. Every one of
them is a class that repeats, so the rule matters more than the fix.

- 🚨 **`ShopPayment`, `BillPayment` and `MembershipPayment` all `use SoftDeletes` against
  tables that had no `deleted_at`.** `2024_01_03_000001` wraps each CREATE in
  `if (! Schema::hasTable(...))`, and all three tables already existed from an earlier
  schema — so the `softDeletes()` inside never ran, while the trait appends
  `where deleted_at is null` to EVERY query those models make. Live symptom:
  `Unknown column 'shop_payments.deleted_at'` on `/shop/orders-list`. Migration
  `2026_08_21_100000` backfills all three, guarded **per column** (a fresh database
  already has them). ⚠️ **A guarded create is invisible until a model reaches for what
  it skipped** — the same trap as `shops`, `wish_items` and `users.role`.
  ⚠️ **Cross-app check done: the admin app carries the SAME guarded create AND the same
  three `use SoftDeletes` models**, so it was hitting the identical crash on the shared
  database. The migration is added in THIS app only (never double-run a shared-DB
  migration) and the admin app needs no code change — `deleted_at` is not `$fillable`
  on either side.
- 🚨 **`ProfileController::destroy` read `$bills->bill->user->account_id` on the
  COLLECTION**, so deleting an account with any paid bill threw
  `Property [bill] does not exist on this collection instance` **before a single
  subscription was cancelled** — the user believed the account was gone while their
  Stripe subs stayed live. The connected account is **per bill** (each belongs to a
  different creator), so one shared id would have cancelled against the wrong account
  even once the crash was gone. Each cancel is now individually try/caught: one
  un-cancellable subscription must not abort the rest.
- 🚨 **PHP closures capture NOTHING by default, and the failure is invisible until the
  branch runs.** Both guest-cart `$supporterPays` closures in `WishitemController`
  (`addToCart`, `updateCartQuantity`) read a creator variable that was not in their
  `use` list — a 500 on `/add-to-cart` for logged-out supporters only. Sentry reported
  the first; the second was found beside it and had never fired.
- 🚨 **`public/` DOES NOT EXIST ON THE LAMBDA.** Vapor uploads it to S3/CloudFront and
  strips it from the deployment package, so `file_get_contents(public_path('offline.html'))`
  worked on every machine and threw `Failed to open stream` in production. That 500 also
  broke **service-worker install** — `precacheAndRoute` fetches `/offline.html` during
  install and one failure rejects the whole worker, taking push and offline caching with
  it. The file now lives at **`resources/proxy/offline.html`**, the existing house
  location for route-served assets (the PWA icons are there for the same reason);
  `routes/web.php` and `scripts/build-sw.js` must name the same path.
- **CSP report-only earned its keep on day one.** `connect-src`/`script-src` were short
  of the whole **Google Ads** host family (`www.google.<ccTLD>`, `*.doubleclick.net`,
  `pagead2.googlesyndication.com`, `www.googleadservices.com`) and of Termly's regional
  consent host (`us.consent.api.termly.io` — the embed is on `app.termly.io`, the API is
  not). ⚠️ **A wildcard does not match a bare host**: `*.analytics.google.com` was listed
  while `analytics.google.com`, the host GA4 actually posts to, was not. The remaining
  un-nonced inline blocks in `app.blade.php` (the pre-boot React patch, two JSON-LD
  blocks, the `gtag` config) now carry `$cspNonce`, so `SECURITY_CSP_ENFORCE` is no
  longer blocked on them.
- **Stale-chunk recovery now covers the case where the import RESOLVES to nothing.**
  `resources/js/utils/lazyRetry.js` is a drop-in `React.lazy` that reloads once (sharing
  `app.jsx`'s cooldown key, so the two cannot loop each other) when a chunk resolves
  without a default export — `undefined is not an object (evaluating 'y._result.default')`.
  There is no error to catch: the promise resolves. Applied to `includes/Footer.jsx`
  first because it renders on every page. ✅ **Completed 23 Aug 2026: all 83 remaining call
  sites across 16 files now use it** — `Welcome.jsx` (16), `Dashboard.jsx` (42),
  `wishlist/Userprofile.jsx` (9) and thirteen others. **`React.lazy` should not appear in
  `resources/js` again**; there is no case where the plain form is wanted, and a single
  un-migrated site is a white screen for whoever has that page open across a deploy.
  ⚠️ **Neither `npm run build` nor the four scanners can prove this migration is safe** —
  esbuild never resolves free variables, so a file that gained a `lazyRetry(` call without
  its import builds clean and throws `ReferenceError` on render (the documented trap that
  shipped `InstallAppCard`). It was verified two ways instead: every file containing
  `lazyRetry(` asserted to carry `^import lazyRetry`, and the three heaviest pages
  (homepage, a creator profile, the basket) loaded **through the Vite DEV server**, which
  serves the real source modules, with 0 console errors.
- **`Inertia::render(...)->withHeaders(...)` throws** — `Inertia\Response` is
  `Responsable`, not a `Response`. Already fixed in `OptimizedProfileController`; listed
  here because the error message (`Method Inertia\Response::withHeaders does not exist`)
  names the class and not the missing `->toResponse($request)`.

**Two Sentry entries that are NOT code faults**, recorded so nobody re-triages them:
`AwsS3V3Adapter $bucket must be of type string, null given` is an **empty `AWS_BUCKET`
on that environment**, and the `"payout" namespace` / `Command "update-help-centre" is
not defined` errors are mistyped `php artisan` invocations (`update-help-centre` is a
skill, not a command).

## 🚨 ONE promo surface — the profile slider (21 Aug 2026, spennypiggy.co)

`Components/Promo/PromoSlider.jsx` on the profile's About tab is **the only place a
promo may appear**. Three always-on banners used to stack there above "About me" —
`OfferAnnouncement`, `ReferralBanner` and `FeatureSuggestionBanner`, plus the right-rail
membership block — so the page a creator visits most read as a noticeboard. Adding a
fourth was a JSX edit, which is why there was nothing stopping a fifth.

- 🚨 **A NEW PROMO IS A `config/promos.php` ENTRY, NEVER A NEW BANNER.** The config is
  the only definition; the slider renders exactly one card at a time whatever is in it.
  `banners` are evergreen features, `announcements` are time-boxed news (`starts_at` /
  `ends_at`, priority above every feature card because a time-boxed card that does not
  lead the deck while it is live never will).
- 🚨 **`priority` IS A WEIGHT, NOT A SORT ORDER.** The deck opens on a weighted-random
  pick, so a priority-10 card is the most *likely* first card, not the guaranteed one —
  a straight sort means the bottom half of the deck is seen only by people who swipe,
  and most do not. The deck is then reordered so no two cards share a ground colour
  back to back: the whole design rests on the colour changing, and two mint cards in a
  row makes a swipe look like it did nothing.
- 🚨 **ELIGIBILITY OUTRANKS PRIORITY, and it lives in `PromoBannerService`, not the
  config** (config must stay cacheable; eligibility needs the DB). A creator who has
  already sold is never shown "free until your first sale" however high it sits — a card
  describing a state the viewer has left is the slider telling them something untrue
  about their own account. A key with no rule in `isEligible()` is always shown.
- ⚠️ **A logged-out visitor sees the WHOLE deck.** Eligibility answers "have you already
  done this", which has no meaning without an account, and these cards are advertising
  the features *to* them.
- 🚨 **NOTHING ON THIS PATH MAY THROW.** The deck is built in
  `HandleInertiaRequests::share()`, so it runs on every Inertia response — a failure
  would take down every page on the site to hide a marketing card. Same house pattern as
  `VisitTracker`: catch `\Throwable`, log a warning, return an empty deck. Pinned by
  `test_a_broken_deck_never_throws`. A promo naming an unknown route is dropped with a
  warning rather than being allowed to `route()`-throw.
- ⚠️ **The deck is cached per viewer for `promos.cache_ttl` (300s), and the cache key
  carries `has_ever_sold` and `is_creator`** — without them, a creator who has just made
  their first sale keeps being shown the first-sale card for the rest of the TTL, off a
  key that says nothing changed. `has_ever_sold` and `free_until_first_sale` are **passed
  in** from the shared payload, never re-resolved: `hasEverMadeSale` is a ledger query.
- ⚠️ **NOTHING IS DISMISSIBLE, deliberately.** The two banners this replaced hid
  themselves for 14 and 20 days via localStorage, and there is **no nav entry anywhere in
  the app** for `/refer-and-earn` or the founder page — so closing one removed the only
  route to that feature for a fortnight. A permanent slot costing one swipe is the trade.
  The old localStorage keys are simply ignored.
- ⚠️ **`exclude` is a PAGE decision, not an eligibility rule.** `Dashboard.jsx` passes
  `founder_bonus` while the creator's own `FounderProgressTracker` is on screen — that
  card carries their real figures, so it wins, and showing both told one creator the same
  thing twice in two tones four inches apart.
- 🚨 **`border-[#000]` DOES NOT COMPILE IN THIS PROJECT, and it fails SILENTLY.**
  Verified against the built stylesheet: `.border-\[#000\]` appears **zero** times while
  every other arbitrary class on the same component (`h-[250px]`, `w-[250px]`,
  `leading-[0.86]`) is present. An element built on it renders with a **transparent
  border and no frame at all** — which is how the first pass of these cards shipped, and
  it is invisible in review because the markup says `border-2 border-[#000]`. Tailwind is
  3.4.19, so this is not a version limitation; do not "fix" it by adding the class back.
  **Use `border-black` alone, with NO width class** — `resources/css/index.css` defines it
  as the full `border: 2px solid var(--black)` shorthand, which is exactly the house
  frame. Where only one side needs a rule, set it **inline** (`borderLeft: "2px solid
  #000"`); an inline border cannot be dropped by the compiler.
- 🚨 **In a fixed-height flex column, every child needs `shrink-0`.** The card's body copy
  is `line-clamp-2`, and without `shrink-0` the flex parent compressed it below its own
  two lines — `line-clamp` hides the overflow, so nothing looked broken, the sentence just
  ended mid-word. Only visible at desktop widths, where the copy is shortest.
- 🚨 **EVERY PROMO IS ITS OWN COMPONENT FILE — THERE IS NO SHARED CARD BODY.**
  `resources/js/Components/Promo/cards/` holds one file per promo (`FounderCard`,
  `FastStartCard`, `ReceiptCard`, `VerifiedCard`, `ReferralCard`, `LeaderboardCard`,
  `BioLinkCard`, `InstallAppCard`, `SuggestCard`, `StatementCard`); `PromoCard.jsx` is a
  registry that picks one by the config's `layout` key and gets out of the way. **Four**
  earlier passes drew every promo from one template and recoloured it, and each was
  rejected — however good the palette got, the deck read as one card shown ten times,
  because the eye reads layout before colour. If a new promo looks like it could reuse an
  existing card's body, that is a reason to design it differently, not to extract a
  component.
- **What they share lives in `promoKit.jsx` and must stay small**: `CARD_FRAME` (fixed
  height + `border-black` + `rounded-box`), `GROUNDS`/`ACCENTS`, `display()`, `Chip` and
  `Cta`. That is the deck's vocabulary; anything that varies per promo belongs in that
  promo's own file. Each card composes around the one thing its promo is about — a figure
  and a meter, a receipt with a torn foot and a stamp, a solid badge at size, a split
  ground with two figures and an arrow, a three-row ranking, browser chrome with link
  rows, an app tile dropping into a dock, ruled paper with an empty field.
- 🚨 **A FIGURE ON A CARD COMES FROM `promo.facts`, NEVER FROM THE JSX.** An earlier pass
  typed **"£6.99"** into the receipt card while the real default is **£8.99**, so the one
  card whose entire subject is billing quoted a price the platform does not charge.
  `PromoBannerService::facts()` reads every number from the thing that enforces it:

  | Card | Figures | Source of truth |
  |---|---|---|
  | Founder | £2,500 · 30 days · 150 seats · **10% bonus, min £250** | `config/founder_bonus.php` — what `CheckFounderQualifications` qualifies AND pays on |
  | Fast Start | **5%** · 30-day window · paid 7 days after | `config/fast_start_bonus.php` |
  | Free until first sale | **£8.99/mo** | `SubscriptionPlan` |
  | Refer & earn | **£50** per creator · **£1,000** threshold | `config/referral.php` (`reward_amount` + `qualifying_gmv`) |

  ⚠️ **Fast Start's rate is OMITTED when `enable_tiered` is on** — there is no single rate
  then (3/5/7% by bracket) and the card drops the figure rather than quoting one bracket.
  🚨 **The referral reward is never shown without its threshold.** `ReferAndEarnController`
  only counts a referral once the referred creator passes £1,000 lifetime GMV, so "£50" on
  its own sets a creator up to share their link, watch someone sign up, and get nothing.
  ✅ **CLOSED (23 Aug 2026): `config('referral.qualifying_gmv')` is now the ONE
  definition.** The number was written out by hand in FIVE places — the qualification
  short-cut in `Helpers`, `CreatorReferral::progressPercentage()`'s denominator, both
  counting queries in `ReferAndEarnController`, and the figure the promo deck prints to
  every creator. Four of those are read by the person being paid and one is what actually
  pays them, so a drift did not fail: it promised a creator money at a number the payout
  query disagreed with. ⚠️ A zero threshold reports 100% rather than dividing by zero on
  a page a creator loads. Pinned by `ReferralThresholdTest` (4) — whose real assertion
  MOVES the config and checks the bar and the promo move with it, since a test against
  today's 1,000 would pass just as happily with five hardcoded copies.
  🚨 **The founder card must state the BONUS, not only the threshold.** The first
  informative pass showed £2,500 and never said what the creator receives, so it read as a
  target with no prize. Pinned by four tests in `PromoDeckTest`.
- 🚨 **`link_in_bio` resolves its destination AND its label per viewer**
  (`hrefFor()` / `ctaFor()`): a signed-in creator goes to their own `bio.show` page
  ("See my page"), a visitor to `creators.link-in-bio` ("How it works"). Both used to go
  to the editor, which put a visitor at a login wall and a creator two clicks from their
  own link. ⚠️ One label across two destinations is how a button starts lying — they are
  decided in the same place so they cannot drift.
- 🚨 **`npm run build` DOES NOT CATCH AN UNDEFINED IDENTIFIER — ONLY THE BROWSER DOES.**
  esbuild transforms per file and never resolves free variables, so a component missing
  `import { useState } from "react"` builds clean, passes all four `npm run check`
  scanners, and then throws `ReferenceError: useState is not defined` the moment it
  renders. `InstallAppCard` shipped exactly that: a string replace that was supposed to
  add the import silently no-opped because the anchor text did not match, and nothing
  downstream noticed. **After any scripted edit to an import line, grep the file for the
  identifiers it now uses.** The `check-unbound-identifiers` scanner is scoped to pricing
  helpers and will not see this.
- **`resources/js/lib/pwaInstall.js` is the ONE definition of "can this browser install
  us, and if not, what does the reader tap"** — `isInstalled()`, `detectPlatform()`,
  `STEPS`, `PLATFORM_LABEL`. Extracted from `PwaInstallPrompt.jsx` (which now imports it)
  when the promo deck grew an install card; a second copy of those strings would drift the
  day a browser renames a menu item, and a step that mis-describes the button it points at
  is worse than no step.
  🚨 **The install promo is REMOVED INSIDE THE INSTALLED APP** — `PromoSlider` filters any
  card with `action === "pwa_install"` when `isInstalled()`. Offering to install the app to
  someone reading this FROM that app is untrue about their own device, and there is no
  prompt left to fire. ⚠️ Decided **client-side after mount**: standalone is a display-mode
  media query the server cannot see, so `PromoBannerService` has no way to filter it.
  🚨 **Chrome/Edge install in one tap via `beforeinstallprompt`; iOS Safari cannot and
  never will** — there is no API, only a menu. So the card shows a working "Install the
  app" button only when it has captured the event, and otherwise switches to "How to
  install" and expands the platform's real steps. A button that does nothing on an iPhone
  is worse than no button.
- - ⚠️ **`InstallAppCard` draws an iPhone LOCK SCREEN, not an app icon.** Two earlier
  versions showed an "SP" tile beside empty dock squares, which says the app exists and
  nothing about why anyone would want it. What installing buys a creator is being told
  the second they sell, so the card draws that: dynamic island, status bar, clock, and a
  **stack of two notifications** — a dimmed one behind, the live one filled in the accent.
  One notification alone reads as a screenshot; two read as a phone that keeps telling you
  things. The highlight is fill plus the black frame, never a shadow or a scale.
  ⚠️ **The device carries its OWN radii (`rounded-t-[28px]` etc.), not the house tokens** —
  a 30px corner on a 150px drawing of a phone is not a phone. Same deliberate exception the
  landing page's product mocks take. Do not "fix" these to `rounded-box`.
  ⚠️ **The screen is `#0B0B10`, not black**, precisely so the dynamic island reads as a
  cutout; on a pure-black screen it is invisible and the phone looks like a rectangle.
  ⚠️ Everything above the stack must stay on the card — only the empty screen below it is
  allowed to bleed off the bottom edge. On a phone the device narrows and the bullet list
  is dropped: the reader is already holding a phone, and at 390px the drawing was what the
  button lost to.
- ⚠️ **No invented figure in a MOCK either.** That notification reads "You made a sale"
  with **no amount** — a number made up for a screenshot is still a number on a promo card.
- ⚠️ **The card height was raised to 292/310/344 (from 250/268/300) on 21 Aug 2026** to fit
  an explainer on every card. The first informative pass had room for a headline and a
  control and nothing else, so a creator could not tell from the card what the offer was.
- - 🚨 **`StatementCard` is the fallback and the ONLY card that reads `headline`/`body` from
  config** — which is what every timed announcement uses. Every other card writes its own
  copy, because its composition is built around specific words: a receipt says "£0.00",
  not a sentence. **Editing a bespoke promo's config copy therefore changes nothing on
  screen.**
- ⚠️ **`display()` sets `leading-[0.85]`, which is right for a two-line headline and wrong
  for a single huge figure.** gulfs' ascenders overflow a line box shorter than the
  glyphs, so the receipt card's `£0.00` climbed into the dashed rule above it at 250px.
  A one-line display figure wants `leading-[1]`.
- 🚨 **THE LEADERBOARD CARD SHOWS RANK AND NOTHING ELSE — no amounts, no names.** The real
  supporter wall ranks by purchase COUNT and never by money (Stripe content-first rule),
  so a mock carrying a figure would advertise a screen that does not exist.
- ⚠️ **Verified in a browser against the COMPILED stylesheet** (`public/build/css/app-*.css`
  served with `public/` as web root — a harness with its own CSS lies). At a true 390px
  viewport: card 362×250, radius 24px, border 2px solid black, **0 shadows**, no horizontal
  overflow. ⚠️ **Headless Chrome clamps its viewport to a 500px minimum on macOS**, so a
  `--window-size=390` run silently measures 500 and every mobile number it reports is
  wrong; render the page inside a 390px `<iframe>` instead — media queries inside an iframe
  key off the iframe's width.
- ⚠️ **`leading-[0.92]` as a RATIO on the headline.** A numeric `leading-N` is a PIXEL
  value in this project's Tailwind config, so `leading-5` on 38px display type renders
  the lines on top of each other.
- ⚠️ **Autoplay is off entirely under `prefers-reduced-motion`**, and the timeline's fill
  animation with it. `pauseOnMouseEnter` + `disableOnInteraction: false` means the deck
  stops while someone reads and resumes after a swipe, rather than freezing for the rest
  of the session. The timeline uses `slideToLoop`, not `slideTo` — with loop on, Swiper's
  indexes are offset by its duplicated slides.
- **No routes and no migration.** Every card points at a route that already existed.
  ⚠️ The Fast Start route is **`financial.fast-start-bonus`**, not `fast-start-bonus`
  (that name belongs to the terms page).
- Tests: `tests/Feature/PromoDeckTest.php` (8).

## 🚨 Public creator profile — polish pass (21 Aug 2026, spennypiggy.co)

`/{username}/{page?}` → `AuthenticatedSessionController::getUserProfile` → `Pages/Dashboard.jsx`.
Design review scored it **20/40** on Nielsen and **11/20** on the technical audit; the findings
below are the ones that changed behaviour or set a rule. Everything else was contrast, spacing
and copy.

- 🚨 **`?page=x` IS NOT THE PROFILE'S PAGE PARAMETER, AND IT FAILS SILENTLY.** The route is
  `/{username}/{page?}` — a PATH segment — so `/{username}?page=memberships` renders **About**,
  200, no error. Verified live. Every locked post's unlock CTA carried that form, so the
  highest-intent tap on the page (a supporter looking at content they want) landed on the wrong
  screen. Fixed in `feed/Post.jsx`, `feed/PostDetail.jsx` ×3 and `Creator/ActivityStatus.jsx`.
  ⚠️ `/account?page=autotweet` is a DIFFERENT route (single segment) where the query IS read —
  do not "fix" that one.
- 🚨 **A VISITOR ONLY SEES A TAB THE CREATOR SELLS IN.** `InstantTabSystem` filtered its
  seven-item array against `profile_overview`'s live counts, which were already computed and
  already read by `ProfileRightRail`. **The owner still sees all seven** — hiding an empty tab
  from the creator removes the only route to the screen where they would add the first item.
  `about` and the currently-active tab are never filtered out. Each tab renders its count.
- 🚨 **Tabs are `<a href>`, not bare `<button>`.** They change the URL, so they are navigation:
  cmd/middle-click, "open in new tab" and AT link semantics now work. `handleTabClick` returns
  early on a modified click so the browser's own behaviour survives; the plain left-click still
  takes the partial-reload path. The 100ms cross-tab click-swallow was removed — it dropped a
  click on a different tab with no feedback at all.
- ⚠️ **The tab strip's scroll arrows sit AFTER the strip, as a pair.** Laid out before it, the
  first tab began 56px right of the panel it controls. The anti-loop reasoning in that file is
  unchanged — the arrows' space is still reserved unconditionally, only the side changed.
- **`UserProfileService::getProfileOverview()` gained `bills`, and its cache key is now
  `profile_overview_v2_`.** A cached v1 array has no `bills` key, which the tab filter would read
  as zero and hide a tab the creator does sell. `ProfileController` forgets the v2 key.
- 🚨 **`TOTAL EARNED` IS SUPPRESSED BELOW A FLOOR FOR THE PUBLIC** —
  `EarningsMilestone.PUBLIC_EARNED_FLOOR` (50, in the goal's own currency). `£0.00` at 38px was
  the first content a cold supporter met on most profiles. ⚠️ It is a SEPARATE flag from the
  creator's own `goal.hidden`: that one also switches `pct` onto the server's `goal.percent`,
  which is only populated for a genuinely hidden goal, so reusing it would flatten the bar to 0%.
  ⚠️ The owner always sees their own figure, gated on a real owner check — `IsloggedIn` means
  "somebody is signed in", not "this is your profile". The derived `"{remaining} to {target}"`
  line is suppressed with it, or the same number is published by subtraction.
- 🚨 **"MORE CREATORS TO SUPPORT" IS NOT SHOWN TO A VISITOR THE CREATOR BROUGHT.** It closes
  every profile, and a supporter who arrived from the creator's own bio link is that creator's
  audience — ending their money page with four competitors monetises it against them. New
  `DiscoverySources::isCreatorGeneratedVisit()`; ⚠️ deliberately **not** `! isSpGenerated()`,
  because `classFor()` answers CLASS_CREATOR for an unknown key (right for under-claiming a
  published figure, wrong for deciding whether to draw something) — direct and organic traffic
  carries no source and still sees the row.
- **An empty tab names what the creator DOES sell** (`Dashboard.jsx`'s `emptyTabProps`) instead of
  linking away to Discover. Discover survives only for a creator with nothing listed anywhere.
  `Nocontent` gained an `action` slot; its hardcoded `" !!"` suffix and an `!text-xl` that killed
  its own `size` prop are gone.
- ⚠️ **`Report` is not a Quick Action.** It sat at tile parity with "Send a wish" — the control
  for reporting the seller drawn as heavily as the one for buying from them. It survives as the
  small pill under the action stack, which is the one place it belongs.
- 🚨 **More black-on-pink violations, all on money controls:** `TipJar/SendTip.jsx`'s
  **`Support Me`** (the primary monetisation control on every profile), `PiggyPotWidget`'s
  `primaryOn`, `CreatorActivityWidget`'s CTA, and the `+` add button — all were `text-white` on
  `#FF007F` at **3.78:1**. Header nav was `#E6EA7B` on pink at **2.95:1** (the active link had
  been fixed for this reason; these three had not).
- 🚨 **A MID-LUMINANCE GROUND HAS NO HEADROOM FOR AN ALPHA.** `Promo/PromoCard.jsx`'s `GROUNDS`
  set `body` to `rgba(0,0,0,.74)` on pink and `.76` on violet for the usual quieter-body effect;
  black CAPS at 5.56:1 on `#FF007F` and 4.78:1 on `#8C52FF`, so those measured **4.43** and
  **3.87** — under AA. Both are full `#000000` now, and hierarchy comes from size and weight.
  The light grounds keep their alpha. Same rule as the `Chip` one: raw accent on its own tint,
  and alpha ink on a saturated ground, must both be measured rather than assumed.
- ⚠️ **A disabled primary CTA must say why, and must stay focusable.** The Piggy Pot button
  shipped greyed reading "Unlock Content" before the visitor had done anything, and being
  `disabled` it was not in the tab order — a keyboard user never met the buy button. It now reads
  "Choose an amount first" with `aria-disabled`; `validateAmount()` already guarded the click.
- ⚠️ **An empty component wrapper still eats a flex gap.** `<div><SupporterWall /></div>` renders
  nothing for a creator with no supporters but remains a flex item, taking 16px on each side and
  producing the one 32px seam in a uniform 16px stack. `empty:hidden` — the same fix already used
  on the `ReturningSupporter` wrapper four children above.
- **Banned vocabulary found live on this path** and rewritten: "Add Surprise Gift" / "1000's of
  Gifts in the Oink Gift Zone" (the surface is **Oink Store**, never "Gift Store"), "No Active
  Gifts", "Create physical gifts for your fans to buy for you", "won't be able to receive gifts",
  "Gifts, thank-yous and milestones", plus 🎁 emoji and gift-box glyphs on two monetisation
  controls. ⚠️ **An icon carries the same meaning as the word on a payment-adjacent surface.**
- ⚠️ **~45 bare `hover:translate-*` were removed across the profile's chrome.** The house rule
  says a lift survives only when paired with a hard offset-shadow change — and since the shadow
  sweep there are none, so every one of them was the banned pattern. `active:translate-y-[2px]`
  paired with `brightness` stays; the Piggy Pot amount tiles' 4px DIAGONAL press was normalised
  to it.

## 🚨 The app-icon badge could not be cleared by anything (16 Aug 2026, spennypiggy.co)

Reported from a phone: bell emptied, installed-app icon still reading **3**. Nothing
was intermittent about it — no action available to a user could ever clear that number.

**THREE stores mean "read" and only one was ever written:**

| Store | Written by | Read by |
|---|---|---|
| `notifications` table (`is_read`) | `NotificationDispatcher`, always `0` | **the badge** |
| MagicBell | the bell the user actually presses | the bell only |
| OS notification tray | delivered pushes | iOS, for its own icon mark |

`utils/appBadge.js` counts unread rows in **our** table via `get-notification`, and that
count IS the number on the icon. The bell is **MagicBell**, whose read state lives at
MagicBell and never touches our column. So "Mark all as read" cleared MagicBell, left
`is_read = 0`, and the badge re-read the same number on every foreground.

- 🚨 **`mark-as-read` and `delete-all-notifications` had NO caller anywhere in
  `resources/js`** — dead routes for precisely the job nothing was doing. `appBadge.js`
  was also the ONLY consumer of `get-notification` in the entire frontend.
- **`clearAllNotificationState()` is now the one call that means "read"** — our table,
  then the OS tray, then the icon. Wired into MagicBell's *Mark all as read* AND its
  *Delete all*.
  - ⚠️ It runs in `finally`: MagicBell and our API are independent services, and one
    being down must not strand the badge.
  - ⚠️ **Order is load-bearing.** The server write goes first, or a foreground
    `syncAppBadge()` racing it re-reads the old unread count and puts the number
    straight back.
- ⚠️ **`closeDeliveredNotifications()` is needed IN ADDITION to `clearAppBadge()`.** On
  iOS a web-push notification left sitting in Notification Centre marks the icon on its
  own, outside the Badging API, so clearing the count alone leaves the dot behind.
- ⚠️ **`syncAppBadge()` only runs on load and on foreground** (`visibilitychange`), so
  anything that clears notifications must clear the badge itself rather than waiting for
  a sync that may be minutes away.
- ✅ **CLOSED (23 Aug 2026):** `get-notification` paginates at 30, so the badge could only
  count unread inside the first page — it undercounted, which is why nobody reported it.
  `ProfileController::getNotifications` now also returns **`unread_count`**, a COUNT over
  every row, and `appBadge.js` reads it (falling back to the page filter only for an older
  cached response). ⚠️ Deliberately **on the existing endpoint, not a new route**: a new
  named route does not reach the frontend until `ziggy:generate` runs and the bundle is
  rebuilt, and `route()` THROWS for a name the generated snapshot does not carry.
  Tests: `tests/Feature/NotificationUnreadCountTest.php` (4). ⚠️ The fixture deliberately
  sits ABOVE one page (41 rows) — a test with five notifications passes just as happily
  against the bug it exists to catch.
- ⚠️ Not live until the app is deployed; a phone still showing the old badge is the
  deployed build, not this code.

## Landing + profile pass (22 Aug 2026, spennypiggy.co)

**About me moved into the identity rail** (`Pages/Dashboard.jsx` → `wishlist/Userprofile.jsx`).
The bio, its approval notices and the category tags are built in Dashboard as `aboutMeCard`
and passed to `<Userprofile aboutBlock>` — built in ONE place, rendered in the rail, so the
approval gates are not duplicated. `profileSummaryBand` is now the earnings card alone and
renders only when `UserStripeConnected == 1` (it used to draw an empty white box otherwise).
The bio is drawn as a SPEECH BUBBLE with its tail pointing up at the avatar, which sits
directly above it at every breakpoint; that replaced the "ABOUT ME" eyebrow. The one label
kept is **"Makes"** on the tag row, and it renders only when the creator actually has tags.
⚠️ An empty bio no longer prints "Hy, I am a creator on SpennyPiggy" — that put words in the
creator's mouth on their own page. Owner sees a prompt to write one; a visitor sees a fact.

**The logged-out mobile bottom bar is data-driven** (`Pages/home/Hero.jsx`). Stops are
`NAV_STOPS` = Home · Bonuses (`#act-earn`) · Features (`#act-setup`) · FAQ's (`#faq`), and the
same array feeds the scroll-spy. Three faults it fixed:
- 🚨 The spy watched `features`, **an id that exists nowhere in the app**, and never watched
  `reviews` at all — so no tab but Home ever lit up.
- 🚨 `scrollIntoView` landed in the wrong place. Every chapter below the fold is a lazy
  `<Suspense>` whose placeholder is only ROUGHLY its content's height, so chunks resolving
  mid-scroll move the target underneath it. It now measures, scrolls with an 88px header
  allowance, then re-measures after 500ms and corrects only on a drift over 24px.
- ⚠️ The stops do not tile the page (`LiveBarSection`/`PaymentSlider` sit between them), so
  an "is the scroll inside this section" test blanked the bar in every gap. It takes the last
  stop passed, measured with `getBoundingClientRect` — **not `offsetTop`**, which is measured
  from the nearest positioned ancestor rather than the document.

**`AppShowcase` — the PWA sold as a notification** (`Pages/home/AppShowcase.jsx`, mounted in
`Welcome.jsx` as `#act-app`, after the bonus chapter and before the setup chapter). A drawn
iPhone (HTML/CSS, no image asset) showing a lock screen mid-alert, beside the three beats:
add it → someone buys → your phone tells you.
- 🚨 **No amounts in the mock notifications.** A figure invented for a mock is still a figure
  on a marketing surface. The alerts name the CONTENT that sold (`New purchase — Studio
  Setup`, `New member joined`), which is also the content-first line the platform must hold.
- ⚠️ It renders **nothing** inside the installed app (`isInstalled()` guard) — the standalone
  PWA must not advertise itself.
- ⚠️ Two phone drawings now exist and that is deliberate: `Promo/cards/InstallAppCard.jsx` is
  a lock-screen crop at ~⅓ life size inside a 150px card; this is a whole device at ~290px.
  Both carry their own radii, NOT the `rounded-box` tokens — the documented mock-up exception.
- The copy states that alerts need notification permission; installing alone does not start them.

**`usePwaInstall()` (`lib/pwaInstall.js`) — the install event, held for whoever asks.**
🚨 `beforeinstallprompt` fires ONCE, EARLY, and is never replayed, so a component mounting
below the fold can add a listener and wait forever. The capture now lives at MODULE scope and
runs on import (`GuestLayout` → `PwaInstallPrompt` imports it eagerly); late mounters read the
stored event. ⚠️ `PwaInstallPrompt` keeps its own listener — both receive the same event, and
whichever surface prompts first wins while the other's `prompt()` rejects into its existing
"show the steps" fallback. Do not delete either listener without re-testing that the bar still
installs.

## 🚨 The homepage is SEVEN chapters, and the order is the argument (22 Aug 2026, spennypiggy.co)

`Pages/Welcome.jsx` ran to fifteen sections. It named the products **four separate times** and
put bonus percentages in front of a visitor who had not yet been told what the platform is.
The chapters now answer a stranger's questions in the order they ask them, and each has a real
id: `act-discover` → `act-sell` → `act-setup` → `act-paid` → `act-earn` → `act-app` →
`act-join`. `CHAPTERS` (the right-edge `ChapterNav` rail) and `Hero`'s `NAV_STOPS` (the
logged-out mobile bar) are both derived from that order — **a bar whose tabs run in a different
order than the page highlights them out of sequence while scrolling.**

What merged. Do not re-split these without reading why:
- 🚨 **`FeatureShowcase` IS NO LONGER ON THIS PAGE.** Its own docblock already said it restated
  `WaysToGetPaid` and that its only unique asset was the three mock-ups. `WaysToGetPaid` keeps
  the range (8 tiles grouped by when the money arrives); `LiveBarSection` keeps the page's ONE
  picture of a creator page. The file and its route-free component are untouched — it is simply
  not imported by `Welcome.jsx` any more.
- **`CreatorShowcase` renders with `compact`** under the Discovery headline, which drops its
  own eyebrow/headline/lead and keeps the category tabs. Two browse surfaces with two headlines
  back to back asked the same question twice before the page had made any argument. ⚠️ Leave
  `compact` OFF anywhere the section stands alone. It also zeroes its own top padding in that
  mode — it is a continuation of the block above, not a fresh section.
- **`CustomPricingNote` moved off the top of the page** to directly under `PricingSection`. It
  sold bespoke rates to high earners before the standard price had been named.
- **`PaymentSlider`** (the card marks) now sits with `PayByBankAnnouncement` — one chapter about
  how money arrives — instead of drifting mid-page.
- **`PaidTasksAnnouncement`** sits inside `act-earn` with the bonuses.
- **`act-love` survives as an id only.** The testimonials open the closing chapter now, so proof
  reads as the reason to sign up rather than as a section of its own. Old deep links still land.
- 🚨 **The closing marquee no longer says "Keep 100%".** The marquee at the TOP of the page
  repeats that sentence fourteen times, and it is also in `SetupSteps`, `WaysToGetPaid`, the
  testimonials and the FAQ. Said seven ways in one scroll it stops being a promise and becomes
  wallpaper. The closing marquee carries the ask ("Your page takes **minutes** to build").

⚠️ **`act-proof` and `act-discover` are declared INSIDE their components** (`CreatorShowcase`,
`DiscoverySection`), not in `Welcome.jsx`. Grep both places before assuming an anchor is dead —
and note this page has form: the mobile bar spent months pointing at `#features`, an id that
exists nowhere in the app.

## GA4 funnel events — the server emits them, not the components (22 Aug 2026)

GA4 was recording **page views only**, so "44 active users" could be seen and *where they
stop* could not. The two funnels in the admin app already answer that from our own database
(`site_visit_stats` + `FunnelAnalyticsService`, route `admin.funnels.index`) — this adds the
same five milestones to GA4 so the session-level reports, Google Ads conversions and the
audience tools can use them too. **The admin funnel stays the source of truth for money
questions; GA4 is for traffic and ad questions.**

**Why the server emits them.** Every milestone on this site finishes with a *redirect* —
signup, the emailed verification link, the Stripe `return_url`, every checkout `success_url`.
There is no moment in a page component at which a `gtag()` call could honestly say "this just
happened". `App\Support\AnalyticsEvent::push()` flashes the event,
`HandleInertiaRequests::share` pulls it into `props.analytics` on the next render (a plain
closure, exactly like `flash`), and `resources/js/lib/analytics.js` forwards it to gtag and
drops it. Adding a milestone is one `AnalyticsEvent::push()` line in the controller.

| Event | Emitted from | Fired |
|---|---|---|
| `sign_up` | `RegisteredUserController::store` | once, with `method` (google/email) + `role` |
| `email_verified` | `VerifyEmailController` (both paths) | **inside the transition only**, with `source` |
| `stripe_connected` | `Auth\StripeController::connectReturn` | inside the `! $user->stripe_connected_at` guard |
| `content_published` | `CreatorContentObserver::notify` | same definition of "live" as the follower alert |
| `purchase` | `DeliverableObserver::created` | value + currency + `product_type` + `guest` |

- 🚨 **`purchase` hangs off `Deliverable::created`, which is the ONE choke point covering all
  eight paid modules** (every paid feature creates exactly one Deliverable per payment). Do
  not add per-module gtag calls beside it — eight call sites would drift.
- ⚠️ **Redirect-vs-webhook: whichever wins the race creates the Deliverable.** A
  webhook-first purchase has no browser, so `AnalyticsEvent` drops it. That is
  **under-counting, never double-counting** — the right way round for a funnel denominator,
  and the reason GA4 revenue will read low against the ledger. Use the admin funnel for money.
- 🚨 **`AnalyticsEvent::scrub()` is load-bearing privacy, not tidiness.** Event parameters go
  to Google. A key whose NAME contains `email`/`name`/`user_id`/`token`/`card`/… is dropped
  whole, and non-scalars are dropped too (a nested payload is how a whole model gets
  serialised into an analytics call by accident). Never send a creator's item title.
- ⚠️ **The "no browser" guard is `hasSession()`, NOT `runningInConsole()`** — the latter is
  also true under PHPUnit, which would make every test of this class pass by doing nothing.
  Requests matching `webhook*` / `api*` are skipped explicitly.
- ⚠️ **Nothing on this path may throw** — same house rule as `VisitTracker`: every entry point
  sits inside a signup, a verification or a purchase. Catch `\Throwable`, log, carry on.
- **`page_group` fixes the other GA4 blindness.** `/{username}` means every creator profile is
  its own URL, so GA4 reported thousands of one-view pages and could not answer "how many
  people looked at a profile". `resources/js/lib/analytics.js` buckets each path (`home`,
  `ad_landing`, `auth`, `app`, `money`, `checkout`, `listing`, `content`, `leaderboard`,
  `creator_profile`) and sends it on every `page_view` and every event. 🚨 **The bucket list is
  ORDERED and `creator_profile` is LAST** — the catch-all route means almost any single-segment
  path could be a profile, so every real route must be recognised first or `/login` buckets as
  a creator. **Register `page_group` in GA4 Admin → Custom definitions** or the parameter is
  collected and never reportable.
- 🚨 **Two GA4 faults were found by driving a real browser, not by reading code**, and both
  were corrupting the numbers already on the dashboard:
  1. **Every full page load was counted TWICE.** `gtag('config', …)` sends its own page view
     and Inertia fires `navigate` for that same first page, so both fired. The GA4 config in
     `app.blade.php` now carries **`send_page_view: false`** — `trackPageView()` is the ONLY
     sender, for every page, with the same parameters. ⚠️ **The Ads config keeps its page
     view** (`AW-11395921981`): remarketing is not funnel analytics and nothing re-sends it.
  2. **`page_title` reported the page the visitor just LEFT.** Reading `document.title` on
     `navigate` is too early — Inertia's `<Head>` writes the title from an effect that lands
     after paint, and **two `requestAnimationFrame`s were not enough either**. Measured live:
     navigating to a creator profile sent `page_title: "Leaderboard …"`. `whenTitleSettles()`
     watches `<head>` and fires on the first mutation that moves the title, with a **600ms
     cap** so two identically-titled pages still report. This is what was filling GA4's "Views
     by Page title" card with the wrong page, and nothing about it looked broken.

### The drop-off pack — server-sent events, Ads conversions, wizard steps (22 Aug 2026)

Four gaps that made the funnel unreadable even after the events above. Config for all of it
is `config/analytics.php`.

- 🚨 **`begin_checkout` and `stripe_connect_started` CANNOT be reported by the browser.** Both
  redirect OUT of the app via `Inertia::location`, so there is no next render for a flashed
  event — and the visitor who ABANDONS never comes back at all. Abandonment is the number
  being measured, so the browser path could not answer it even in principle. Both go through
  **`App\Services\Analytics\MeasurementProtocol`** → queued `SendMeasurementProtocolEvent`
  → GA4's Measurement Protocol.
  - ⚠️ **The client id comes from the `_ga` cookie** (`GA1.1.<id>.<ts>` → the last two
    segments), read **raw off the request, never through Laravel's cookie helper** — Google's
    JavaScript writes it, so it is unencrypted and `EncryptCookies` hands back null.
    **No cookie ⇒ no send**: GA4 would happily accept an invented id and file the checkout as
    a session with no page view, which is worse than the gap.
  - ⚠️ **Queued, because it runs on the checkout path.** A slow Google must never add latency
    to a payment — and like every queued feature here it does nothing without `queue:work`.
  - ⚠️ Needs **`GA4_API_SECRET`** (GA4 Admin → Data Streams → Measurement Protocol API
    secrets). Unset ⇒ disabled, one log line, never an exception. `GA4_MP_DEBUG=true` swaps in
    Google's `/debug/mp/collect`, which is the only way to learn a payload was rejected — the
    live endpoint answers 204 to anything.
- **`begin_checkout` hangs off `AbandonedCheckoutService::record()`**, which all nine checkout
  paths already call right after creating their Stripe session. `purchase` alone gave a funnel
  reading "visited → bought" with nothing between, hiding the largest drop in the business.
  The amount and currency are resolved into `$minor`/`$iso` **once**, so the recovery row and
  the event can never disagree about what the checkout was worth.
- **`stripe_connect_started` fires at all three `account_onboarding` redirects** in
  `Auth\StripeController` (`flow` = resume/recreate/onboard). `stripe_connected` counts the
  creators who FINISHED; the ones who open Stripe's form and never return were the drop-off,
  and were invisible.
- 🚨 **Google Ads was receiving NO conversions.** The `AW-` tag loads on every page and nothing
  had ever sent it one, so the campaigns behind the six `/creators` pages were bidding with no
  idea which click produced anything. Confirmed in the account (22 Aug 2026): **every**
  conversion action reads 0.00, and the website-sourced `Sign-up` action had been marked
  **Inactive** for want of a single conversion.
  - **Driven by a MAP keyed on the GA4 event name** — `config('analytics.ads.labels')`,
    published to the page by `app.blade.php` as `window.__spAdsConversions`. Adding a
    conversion is a label in config and no code; an event with no entry can never be reported
    by accident. Wired today: `sign_up` (`GOOGLE_ADS_SIGNUP_LABEL`) and `purchase`
    (`GOOGLE_ADS_PURCHASE_LABEL`).
  - ⚠️ **`sign_up` matters more than `purchase` for these campaigns** — the ads point at the six
    `/creators` landing pages, whose entire purpose is a creator signup.
  - ⚠️ **Only a revenue event carries `value`.** Sending `value: 0` on a signup teaches smart
    bidding that a signup is worth nothing.
  - 🚨 **A GA4-IMPORTED conversion action has no label and cannot be used here.** Only actions
    whose source reads "Website" carry one. The account's two GA4-imported actions
    (`ads_conversion_signu…`, `close_convert_lead`) are that slower, lossier path and are not
    what this tags.
  - ⚠️ **An unset label sends nothing for that event, deliberately** — a wrong label files the
    conversion against the wrong action, which is worse than filing none and is invisible once
    it starts.
- **`sign_up_step` covers the registration wizard** (`Pages/Auth/Register.jsx`). It is
  one-question-per-screen in React state, so a visitor can abandon at step three having made a
  single request — the server cannot see any of it. Fired from `setStepKey` plus a mount
  effect for the entry screen (which never passes through `setStepKey`, so without it the step
  every visitor sees would be the one step with no data). `direction` marks a back-step so it
  is not counted as progress.
- **`App\Support\AnalyticsParams::scrub()`** is now the single privacy filter, shared by the
  browser path and the Measurement Protocol path. Two copies of a privacy rule is one copy
  that gets a rule added and one that does not.
- 🚨 **`config('analytics.enabled')` is a MASTER SWITCH, and it is OFF outside production.**
  Local and dev traffic is not traffic: a developer clicking through a checkout twenty times is
  not twenty checkouts, and **GA4 cannot delete an event it has recorded** — so this is a
  one-way mistake and the default is closed. The deployed `development` environment is closed
  too.
  - When false, `app.blade.php` **does not load gtag.js at all** rather than loading it and
    silencing it — a loaded tag is one stray call away from writing a developer's checkout into
    the live property. `AnalyticsEvent` queues nothing and `MeasurementProtocol` sends nothing.
  - ⚠️ **The job re-checks it too.** A job can be queued in one environment and run in another,
    and the job is the last gate before a real HTTP call to Google.
  - ⚠️ **`phpunit.xml` sets `ANALYTICS_ENABLED=true`**, or every analytics test would pass by
    doing nothing — the same silent-pass failure the `runningInConsole` guard was removed to
    avoid. Tests of the OFF behaviour set the config themselves
    (`AnalyticsDisabledOutsideProductionTest`, 5).
  - ⚠️ **It does NOT cover the team browsing the LIVE site** — those are real requests to a
    production server. Filter those in GA4: Admin → Data streams → Configure tag settings →
    Define internal traffic, then Admin → Data filters → activate "Internal Traffic".
- 🚨 **Five faults found in a review pass of this same change (23 Aug 2026), all of them silent:**
  1. **`AnalyticsParams` matched banned words as SUBSTRINGS**, so `ip` inside `descr*ip*tion`
     and `card` inside `dis*card*_reason` dropped an innocent parameter with no error and no
     log — a dimension permanently empty for a reason nobody could find. Now matched as whole
     `_`-delimited SEGMENTS, which still catches `guest_email`, `customer_name`,
     `payment_intent_id` and `client_ip`.
  2. **Every ENTRY page view waited 600ms.** `whenTitleSettles` only resolves early when the
     title CHANGES, and on the first page it never does — so the first view always sat out the
     full timeout and a visitor who bounced inside it was never counted. Entry pages are where
     bounces happen and where the ad landing pages live. The first view is now sent
     immediately: its title came from the server in the document's own `<title>`.
  3. **`purchase` fired on a £0 Deliverable.** A complimentary or administrative row is not a
     sale; a zero drags reported AOV down and teaches Ads that some purchases are worth
     nothing. The platform minimum is £4.99, so the observer now returns early on `<= 0`.
  4. **`sign_up_step` carried no `page_group`**, because `Register.jsx` called `gtag` directly.
     It now goes through `trackClientEvent()`, so every event in the system carries the
     dimension the reports are split by.
  5. **`SendMeasurementProtocolEvent` declared `$tries = 2` and then swallowed every error**, so
     the retry could never happen. It still never rethrows (a GA4 outage must not fill
     `failed_jobs`), but now calls `release($backoff)` while attempts remain — `release()` is a
     no-op without a queue job, so sync dispatches and tests are unaffected.
- Tests: `tests/Feature/AnalyticsServerSideEventsTest.php` (8),
  `tests/Feature/AnalyticsAdsConversionTest.php` (3, on the published map),
  `tests/javascript/analytics.test.js` (31). Verified in a browser: `sign_up_step` fires
  `role` on arrival and `identity` on advance, and the Ads map is correctly absent while no
  label is set.

- Tests: `tests/Feature/AnalyticsEventTest.php` (9), `tests/Feature/AnalyticsFunnelEventsTest.php`
  (6, end-to-end through the redirect — a push with no delivery is the whole failure mode),
  `tests/javascript/analytics.test.js` (31, shared with the sections below). Verified in a
  browser against the local app:
  one `page_view` per navigation with the settled title and the right `page_group`, and
  `email_verified` arriving in `dataLayer` after the emailed link's redirect.

### Same page, one card design · testimonials without a slider (22 Aug 2026)

🚨 **`DiscoverySection` WAS RENDERED TWICE** after the chapter rebuild — once under the hero
(the original placement) and once inside the new `act-discover` block — so "More than somewhere
to earn." appeared twice on one scroll. `Welcome.jsx` now renders it once. **`grep -c` the
component before trusting a re-order.**

🚨 **`CollectionRow`'s cards take the `tone` now, not just its heading.** That file used to
state the cards stay white on every surface; on the homepage the row sat directly under
`CreatorShowcase`'s dark, accent-framed creator cards as small white ones — two ideas of a
creator card, one under the other, in a single screenshot. The old rule's REASON still holds
(one component, one place to change), so the fix is the existing `TONE` map extended to cover
surface, frame, hover and every ink colour — never a per-caller className. `dark` reuses
`CreatorShowcase`'s own values (`#0d0a16`, `border-white/10`, hover `#17102a`); `light` is
unchanged, and cream/white surfaces (profiles, checkout) still get exactly what they had.

**`HappyCreators` is a grid, not a Swiper.** Three quotes behind a slider showed two on desktop
and one on a phone — the page's whole body of social proof, a third visible at a time — and
pulled Swiper's JS plus two stylesheets onto the heaviest page on the site to lay out three
cards. The section now costs **no JavaScript**.
- 🚨 **The outcome label is OURS; the quote is THEIRS.** Each card is titled with what the money
  did ("Bought new decks"), set as a small caps label above a short accent rule, **never inside
  the quotation marks**. A testimonial is a quotation — the same rule that got the fourth quote
  removed rather than rewritten (that note is still in the file).
- ⚠️ The decorative hand image went with the slider: it lived in a wrapper carrying
  `lg:!mb-[-140px]`, and now that this section OPENS the closing chapter rather than standing
  alone, that negative margin pulled the FAQ up into it.
- ⚠️ `FadeIn` needs `className="h-full"` inside a grid cell, or the wrapper it renders breaks
  the equal-height chain and the cards stop matching.

## 🚨 Discovery Phase 5 + 6 — the collections (21 Aug 2026, spennypiggy.co)

`App\Services\Discovery\CollectionService` is the ONE definition of the ten
collections the brief names (§C): New to Spenny Piggy · Hidden Gems · Trending ·
Almost Funded · New Wishes · Creator Spotlight · Popular Right Now · Memberships
to Discover · Similar Creators · Recommended for You. A surface asks for a
collection by key and gets cards; **a page that writes its own selection is a
page where "Trending" means something different from every other page**.

- 🚨 **NO COLLECTION IS RANKED BY MONEY AND NO CARD CARRIES AN EARNING.**
  "Popular"/"Trending" are COUNTS OF DISTINCT SUPPORTERS; "Hidden Gems" ranks on
  how little a creator has been SHOWN (`discovery_events`), never on how little
  they have made — that would publish a poverty list and put the creators least
  able to convert in front of the most people. `card()` whitelists six keys.
  ⚠️ A wish card's `price` is the creator's LISTED price, which is public on
  every item card; what may never appear is what they EARNED.
- 🚨 **`supporter_id`, NEVER `source_id`.** `source` is a nullable MORPH to the
  payment row, so counting distinct `source_id` counts PAYMENTS and collides ids
  across the seven payment tables. Written wrong first; "Popular" ranked by
  transaction volume while claiming to rank by people.
- 🚨 **`App\Support\DiscoveryEligibility` IS THE ONE ELIGIBILITY RULE.** Phase 3
  and Phase 4 each held a copy and `BirthdayDiscoveryTest` carried a test whose
  only job was catching them drift; these ten would have been a third. Both
  services now call it. ⚠️ It deliberately does NOT decide "has something to
  sell" — that is per surface, and folding it in would impose one surface's
  product rule on all of them.
- **`CollectionRow.jsx` is the reusable component** (Discover, homepage,
  profiles, emails, landing pages). ⚠️ It takes a `tone` — the homepage is a
  DARK field and a black heading is simply not there — but the CARDS stay white
  everywhere: they are the product, and a card that restyles per page is how two
  surfaces end up disagreeing about what a creator looks like.
- 🚨 **THE ATTRIBUTION SOURCE BELONGS TO THE SURFACE, NOT THE COLLECTION.** The
  same "Similar Creators" row runs beside search, on a profile and after a
  checkout. `get(..., $source)` overrides the collection's default, passed
  through `DiscoverySources::normalise()` so a surface cannot invent a key.
  Without this, every checkout sale would have reported as coming from search —
  and attribution has no backfill, so it would be wrong for ever.
- 🚨 **THE COLLECTION CACHE IS VERSIONED PER COLLECTION, because its keys cannot
  be enumerated.** A selection is cached per LIMIT, per VIEWER, per CONTEXT
  creator and per rotation BUCKET, so "clear this collection" is a FAMILY of
  keys. `forget()`'s first version deleted one hardcoded key built from
  `DEFAULT_LIMIT` (12) — **a limit no surface asks for**: the checkout row uses
  4, the homepage and Discover use 8. The admin screen's "Re-run" therefore
  cleared a key nothing reads and **did nothing while appearing to work**. Found
  by a browser pass, not by a test. `discovery_collection_gen_{key}` is read into
  every cache key; bumping it invalidates every variant in one write. ⚠️ Cache
  TAGS would do the same but the file and database drivers do not support them.
  ⚠️ `forever`, never a TTL — an expired generation would resurrect every
  pre-bump selection. ⚠️ The admin app bumps the SAME key, which only works
  because both apps share one Redis; splitting the cache silently turns that
  control back into a no-op.
- **`firstNonEmpty([...])`** — a chain, not one collection. "Similar Creators"
  needs categories and only about half the creators have any (measured: 62
  creators, 30 accounts with one), so a single-collection row would have shown
  NOTHING on roughly half of all checkouts.
- **Three new reserved keys** — `spotlight`, `popular`, `memberships` — added to
  BOTH `DiscoverySources::KEYS` and `resources/js/lib/discoveryLink.js`; a test
  asserts the two lists match.
- **Phase 6 surfaces so far:** payment-success "Discover someone else"
  (`ThankYouController`) and two homepage collections inside `CreatorShowcase`.
  ⚠️ The homepage takes ONLY `hidden_gems` and `almost_funded` — Trending and New
  are already its own tabs, and adding the collection versions would draw the
  same creators twice under two headings. 🚨 The discovery row sits BELOW the
  membership upsell: somebody who just paid this creator is likeliest to pay
  THIS creator again, so deepen before widening.
- **Creators can see WHERE their supporters came from.** `breakdownFor()` +
  `DiscoverySources::label()`. The per-source figures had been computed since
  Phase 1 and nothing rendered them. ⚠️ A creator is never shown a raw key, and
  their own `bio-link` traffic is listed BESIDE ours and marked as theirs —
  folding it in would be the platform taking credit for their audience.
  ⚠️ The panel guards `Array.isArray(stats?.by_source)`: marketing hands it
  `config('discovery.mock_stats')`, which has no such key, and a bare `.map`
  would take the landing page down.

## 🚨 Creator-controlled push (21 Aug 2026, spennypiggy.co)

`App\Services\CreatorPushService` — §E, "creator-controlled push with rate
limits, settings, unsubscribe, moderation, admin controls".

🚨 **THIS IS THE ONLY FEATURE WHERE ONE USER'S TEXT LANDS ON ANOTHER USER'S LOCK
SCREEN.** The guards are the feature; the reach is the easy part.

- **1/day, 4/month**, computed from `creator_push_messages`, **never from a
  cache** — a cache flush must not hand every creator a fresh allowance. The
  limit protects the CHANNEL: somebody who turns notifications off is lost to
  every creator they support, not just the one who annoyed them.
- 🚨 **NO LINKS, @HANDLES, EMAIL ADDRESSES OR PHONE NUMBERS.** A push is trusted
  because it carries a creator's name on a lock screen; a link in one moves a
  paying audience somewhere with no refunds, no chargeback protection and no
  moderation, and is how a creator gets impersonated. ⚠️ E-mail is checked
  BEFORE the URL rule, or `jane@example.com` is refused as "a link" and the
  creator looks for the wrong thing.
- **The record is written BEFORE dispatch**, refusals included with their reason
  — "this creator keeps trying to send a phone number" is the signal a moderator
  needs. ⚠️ A refusal does NOT spend the creator's daily slot.
- 🚨 **THE FAN-OUT IS QUEUED (`NotificationDispatcher::queue`), NEVER `send()` IN
  A LOOP.** `send()` makes a synchronous HTTP call per recipient and its own
  docblock says not to; production is Lambda with a **60-second request
  timeout** and the fan-out is capped at 5,000, so inline sending timed out
  part-way with the row already marked `sent`. **Needs `queue:work`.**
- ⚠️ **Channels are referenced as CONSTANTS.** `send()` matches with `in_array`
  and returns void, so a literal that stopped matching would mean every push
  reached nobody, with no error anywhere.
- **A supporter is somebody who PAID this creator**, not a follower, and a
  suspended account is never messaged.
- Admin moderation lives in admin.spennypiggy.co (`/creator-push`).

## 🚨 The Discovery switches are in the DATABASE — and one is one-way (21 Aug 2026)

§F asks that flipping a "Coming soon" label be **a config change with no
deploy**. On Vapor a config edit IS a deploy and so is an env change, so that
rule was never actually satisfied — only made cheaper. Two tables close it
(both owned here, mirrored as guarded declarations in the admin app):

- **`discovery_collection_settings`** — a collection on/off, platform-wide.
- **`discovery_label_overrides`** — forces a marketing label to COMING SOON.

🚨 **A MISSING ROW MEANS ENABLED / "use the config".** Both tables ship EMPTY and
everything works; switching something off is what writes a row. Seeding "enabled"
rows would switch a feature off on any database a seeder never reached — and
**Vapor runs migrations on deploy but never seeders**.

🚨 **THE LABEL SWITCH CAN ONLY TURN A LABEL OFF, AND THAT IS THE DESIGN.**
Marking something LIVE NOW is a public claim on three marketing pages, and
`DiscoveryMarketingTest` requires recorded evidence for every live key **by
reading the config** — a database switch able to write `live` would walk straight
past the one guard between a marketing page and a false claim. The table has no
`state` column and must never gain one; a test asserts that. Off can only
under-claim, and it is the urgent direction ("this is showing something it should
not") — on has never been urgent.

⚠️ **Disabling requires a written reason.** A collection switched off with no
note is one nobody dares switch back on six months later.

## 🚨 A session flash is now a toast, once, for the whole app (21 Aug 2026)

`BrandToaster` bridges `flash.error` / `flash.success` to a toast. **No layout
had ever read `flash`**: only fifteen pages looked at it and five turned it into
a toast, so every `->with('error', …)` a controller wrote outside those five was
**stored and thrown away**. Found chasing "I tap Unlock and nothing happens" — a
guest sent to sign in to buy a Bill or a Membership arrived with a written
explanation the login page never rendered.

- ⚠️ **The five pages that did it themselves have had their copies removed**, or
  every message would appear twice — and two identical toasts dismissing
  independently reads as a rendering bug.
- ⚠️ Keyed on the message text, so an Inertia re-render does not re-fire it.
- ⚠️ The login page renders **both** `?message=` and the flash: a redirect can
  carry either, and preferring one silently loses the other.

### The bio page's buy path

- 🚨 **A WISH CARD GOES TO THE BASKET** (`/cart?add={uuid}`), not to the wish
  checkout page. Every refusal in `wishItemSubscribe` answers with
  `redirect()->back()`, and a visitor arriving from `/bio/buy/…` has no
  meaningful "back" — they landed on the HOMEPAGE. Three of those refusals now
  have real destinations (a suspended item sends them to the CREATOR, whose
  other items are still on sale).
- ⚠️ **The add happens in the BROWSER.** A guest's basket row is keyed on a
  device id derived from user agent, platform and screen — the server cannot
  compute it, so a server-side write creates a row no guest can ever see.
  `?add=` is stripped with `replaceState` once used, or a refresh adds it again.
- 🚨 **The guest gate is asked BEFORE the redirect, with the item's real price
  and its own currency.** `wishItemSubscribe` asked it with a hardcoded
  `('GBP', 0)`, so the high-value half could never fire there — a £450 wish
  opened for a guest exactly as a £5 one did.
- ⚠️ **Guest checkout has no toggle of its own** — it follows the PLATFORM RISK
  STATE (`THROTTLE` and `FREEZE` refuse guests), plus the value threshold.
  ⚠️ The threshold is NEVER named to a supporter (`RiskMessages` rule 1).

### 🚨 `redirect()->back()` IS A DEAD END ON EVERY GET HANDLER (23 Aug 2026)

`back()` reads the Referer, and half this app's links carry none — a bio card, a
shared link, an e-mail, a bookmark, a return from Stripe-hosted checkout. So it
drops the supporter on the **HOMEPAGE**, and before the flash-to-toast bridge the
explanation was written and thrown away. From their side they tapped a real link
and nothing happened: exactly how the bio page's "Unlock does nothing" was
reported from production.

A sweep of **every GET route** found seven handlers doing it. Four supporter-facing
ones are fixed; `Auth\StripeController`'s other fifteen are all POST (a clean
negative, not an oversight):

| Handler | Now goes to |
|---|---|
| `ShopsController@successPayment` | `gifter.hub` — **the worst one**: the buyer is returning from Stripe having just paid |
| `TaskController@download` | `gifter.hub` — the link arrives in an e-mail, so there is never a Referer |
| `BillsController@buyBill` ×4 | the CREATOR's profile, via a shared private `awayFrom()` |
| `MembershipController@buyLevel` ×4 | the CREATOR's profile, same helper |

- 🚨 **Back to the CREATOR, not to the homepage.** The supporter came to buy from
  this person, and one unavailable item says nothing about the rest. `awayFrom()`
  falls back to `home` only when the item has no resolvable creator.
- ⚠️ **`back()` INSIDE THE POST BRANCH IS CORRECT AND MUST STAY.** `buyBill` and
  `buyLevel` answer both verbs from one method: below `isMethod('POST')` the
  supporter is submitting our own checkout form, and `back()` is what returns them
  to it **with what they typed still in it**. `NoDeadEndRedirectsTest` slices each
  method at that line for exactly this reason — a scan of the whole method would
  demand a "fix" that makes the form worse.
- Tests: `tests/Feature/NoDeadEndRedirectsTest.php` (5). ⚠️ The source scan blanks
  comments first: each of these methods now carries a note explaining why `back()`
  was wrong, and the note contains the string being searched for.

## 🚨 The test suite does not call Stripe (22 Aug 2026)

Measured on one full run: **over 2,000 live Stripe requests**, logged as "Failed
to ensure manual payout schedule: The provided key 'sk_test_…'". It made the
suite non-deterministic — `StripeOnboardingFlowTest` returned 500 in a full run
and passed in isolation, 9s against 3s — and **a suite that fails at random makes
the "green regression" §F gates every release on meaningless**.

`App\Support\Testing\OfflineStripeHttpClient` is bound in `testing` via
`ApiRequestor::setHttpClient` (the same seam the local IPv4 fix uses).

- 🚨 **It answers with a real Stripe ERROR, not a fake success.** Every caller
  already handles a Stripe failure — that is what those 2,000 log lines were. A
  fake success would send code down paths it never takes in a test and quietly
  change what the suite proves.
- ⚠️ **The `testing` check comes BEFORE the `local` one** — a developer machine's
  test environment is also `local`, and the curl client would otherwise win and
  put the network back.
- ⚠️ **The signature must match the INSTALLED SDK's `ClientInterface`** (it
  carries `$apiMode` on this version). PHP raises a FATAL on a mismatch, which
  takes the whole suite down rather than one test. Re-check after an SDK bump.
- **Escape hatch `STRIPE_ALLOW_LIVE_CALLS_IN_TESTS=true`**, never in CI.
- Same remedy this repository already applied to HaveIBeenPwned, for the same
  reason.

🚨 **THE SUITE IS STILL NOT FULLY DETERMINISTIC — MEASURED 23–24 Aug 2026.** Three
consecutive full runs on the SAME code gave **1 failed / 1590 passed**, then
**4 failed / 1590 passed** (`/discover` answering 500), then **1608 passed / 0
failed**. Two causes were found and fixed (the Stripe calls above; `SeoMeta`'s
static tags, see the CSP section) and a residue remains — the 500s were not
reproducible in isolation, in a targeted `Discovery|Seo|Promo|Csp` run (147
passed), or in the next full run.

- ⚠️ **`backupStaticProperties` is OFF** — nothing in `phpunit.xml` sets it, so a
  class static carrying state between tests is PHPUnit's default behaviour here,
  not an accident. `SeoMeta` was one; assume there are others.
- ⚠️ **`CACHE_DRIVER=array`, `SESSION_DRIVER=array`, sqlite `:memory:`** — those
  are per-test and are already ruled out as the carrier.
- 🚨 **DO NOT READ ONE RED RUN AS A BROKEN BUILD, AND DO NOT READ ONE GREEN RUN AS
  A CLEAN ONE.** Reproduce a failure before acting on it — and note that the
  §F release gate assumes a green run MEANS something, which is exactly what
  intermittency takes away. ⚠️ And `php artisan test` **exits 0 with failing
  tests**, so the `Tests:` summary line is the only thing worth reading.

## ⚠️ The no-shadow scanner could not see a JS style object (22 Aug 2026)

`npm run check` reported "no element casts a shadow" while **33 inline
`boxShadow` declarations were live** across nine files — the Purchase Hub alone
carried twenty. The CSS check only ever ran on `.css`, `.blade.php` and `.html`,
so `style={{ boxShadow: … }}` was neither a class token nor a CSS declaration and
passed every sweep. This is the fourth place a style hides, which the root
`CLAUDE.md` already warns a className sweep cannot reach.

`check-no-shadows.mjs` now scans JS style objects. ⚠️ **A ring is allowed** —
`0 0 0 1px` and `inset 0 0 0 1px` have no offset and no blur, so they render as a
line, exactly as `ring-*` does.

## 🚨 CSP round two — the two faults a nonce does NOT fix (22 Aug 2026, spennypiggy.co)

The first sweep added the missing hosts and nonced the inline blocks in `app.blade.php`.
The reports that survived were the interesting ones, because **neither is fixable by adding
a nonce** and both looked completely normal in a browser (the policy is report-only, so
nothing was actually blocked yet).

- 🚨 **AN INLINE `on*=` ATTRIBUTE CAN NEVER CARRY A NONCE — an attribute has nowhere to put
  one.** It is governed by `script-src-attr`, which falls back to `script-src`, and that
  directive deliberately has no `'unsafe-inline'` (a nonce makes a browser ignore
  `'unsafe-inline'` anyway, so adding both is theatre). The classic async-CSS swap
  `<link rel=preload as=style onload="this.rel='stylesheet'">` in `app.blade.php` was
  therefore refused — **405 violations across 144 users, the largest report on the
  platform**, and enforcing would have dropped the whole site to system fonts. ⚠️ The
  `<noscript>` fallback beside it does NOT cover this: that only runs with JavaScript
  *disabled*, and here JavaScript is enabled and merely blocked.
  **The attribute-free replacement is `media="print"` plus a nonced script that swaps it to
  `all`.** ⚠️ The swap must check `link.sheet` as well as listening for `load` — the
  stylesheet can finish loading before the script runs, and a bare listener then waits for
  an event that has already fired, leaving the site permanently on `media="print"`.
  `CriticalCssService::defer()` (the `@deferCss` Blade directive, currently unused) carried
  the identical pattern and was fixed with it.
- 🚨 **`script-src` GOVERNS JSON-LD.** The browser does not treat `application/ld+json` as
  exempt, so `SeoMeta::addJsonLd()`'s output was refused on every page carrying a
  BreadcrumbList. The nonce is stamped in **`SeoMeta::render()`**, not in `addJsonLd()` —
  so it covers every script tag anything ever adds, and so the value is read at RENDER time
  (SecurityHeaders shares a fresh nonce per request; one captured earlier can belong to a
  different one). ⚠️ `SeoMeta::cspNonce()` returns `''` rather than throwing when there is
  no view container — the class is reachable from console commands and the sitemap.
- ⚠️ **A `javascript:` URL is script too.** `resources/proxy/offline.html`'s "Go back"
  button was `href="javascript:history.back()"` — dead under the CSP, on the one screen a
  user reaches when everything else has already failed. It is a `<button>` with a listener
  now.
- ⚠️ **`resources/proxy/offline.html` is plain HTML with no Blade, so it takes the nonce
  through a `__CSP_NONCE__` placeholder** substituted by the `offline.page` route. The
  service worker caches the RESPONSE, so a cached copy keeps the nonce it was served with.
  `resources/views/maintenance.blade.php`'s countdown was un-nonced for the same reason
  (both files sit outside the app shell) and now uses `$cspNonce`.
- 🚨 **`SeoMeta` KEEPS ITS TAGS IN A STATIC, AND A PHPUNIT RUN IS ONE PROCESS** (23 Aug
  2026). `addTag()` APPENDS for everything except the title, so every meta, link and
  JSON-LD block one test sets is still there for every test after it. `CspInlineScriptTest`
  renders `view('app')` directly — no HTTP request, therefore no shared `cspNonce` — so a
  JSON-LD block left behind by an earlier test arrived **un-nonced** and failed the
  assertion. **It passed in isolation and failed in the full run**: the result depended on
  test ORDER, which is precisely what makes a green-regression gate meaningless (same
  reasoning that took the Stripe HTTP client offline in `testing`). `Tests\TestCase::setUp`
  now calls `SeoMeta::clear()`.
  ⚠️ **Production was NOT affected and this needed no production change** — Vapor serves
  HTTP through PHP-FPM, where each request is a fresh script execution and statics do not
  survive between requests. **An Octane deployment WOULD leak them across requests in one
  worker**, accumulating one visitor's JSON-LD onto the next visitor's page; if this app
  ever moves to Octane, reset `SeoMeta` per request rather than relying on FPM.
- 🚨 **`tests/Feature/CspInlineScriptTest.php` (6) is the enforcement.** `npm run check`'s
  scanners read `resources/js`, never Blade, and a report-only violation fails no build —
  so without a test this returns one screen at a time. It asserts, against **rendered**
  markup, that no served page carries an `on*=` handler and that every inline `<script>`
  has a nonce. ⚠️ Write comments carefully around these assertions: the first version
  failed because a comment in `offline.html` quoted the literal string the test forbids.
  It now also scans **every blade's source** (comments stripped) rather than only the three
  it can render, with **no allowlist** — an exemption list is where a rule like this rots.
  Two more blades were found by that scan and nonced: `intercom-test.blade.php` (local-only,
  but its four `onclick=` buttons are the pattern the next person copies — now a delegated
  `data-action` listener) and `vendor/laravelpwa/meta.blade.php` (dead while `@laravelPWA`
  stays commented out, which is exactly why it would have shipped un-nonced the day someone
  re-enabled it).
- 🚨 **THE ADMIN APP HAD THE SAME FAULT AND ITS REPORTS HID IN THIS PROJECT.** Both apps
  send CSP reports to `spenny-piggy/javascript-react`, so `admin.spennypiggy.co/dashboard`
  and `/login` rows sat inside a group full of website URLs and read as ours. **Group a CSP
  issue by document URI before deciding which repo it belongs to.** Fixed there in the same
  pass — see `../admin.spennypiggy.co/CLAUDE.md`.

**Third-party noise that must NOT be allowlisted** (23 Aug 2026). Every one of these is a
browser, an in-app webview or an extension injecting into our page, identified by the
`browser.name` tag on the report:

| Report | Actually |
|---|---|
| `script` from `connect.facebook.net` (`/en_US/pcm.js`) on `/cart` | **Instagram's in-app browser.** 🚨 Allowlisting it would let Meta run arbitrary script on our checkout pages. Leave blocked. |
| `style` from `www.gstatic.com` (`.../translate_http/...el_main_css`) | **Google Translate**, injected by Chrome. Same third party as the `removeChild` React crash. |
| `script` from `eval:` | **Android WebView** (an in-app browser) only. Our own bundle would fire it in every browser. |
| `connect` from `data:` | **Opera GX** only, one event. |
| `font` from `use.typekit.net` (12 files, one visitor, one page) | **Adobe Fonts, injected by an extension.** Zero occurrences of `typekit` in this repo, in the built bundle, or in the live page's HTML. |
| `frame-src` from `toolytics.pa.clients6.google.com` on `/creators` | Google ad/tag tooling loaded by an extension (Tag Assistant and similar). Same test: it appears in no page source and no bundle. |

🚨 **The test that settles every one of these: grep the repo, the BUILT BUNDLE and the
LIVE PAGE'S HTML for the blocked host.** Three misses means the browser put it there, and
widening the policy would authorise a third party we never chose on the pages that take
money. The `browser.name` tag on the report usually names the culprit outright.

⚠️ **These arrive by `report-uri`, straight from the browser to Sentry — `app.jsx`'s
`beforeSend` and `ignoreErrors` never see them.** They can only be silenced in the Sentry
project's inbound filters, not in this codebase. Do not "fix" them by widening the policy.

**Sentry entries deliberately not "fixed":**
- 🚨 **`Error invoking <method>: Java …` IS THE ANDROID WEBVIEW JS BRIDGE, NOT OUR CODE.**
  An in-app browser (Facebook, Instagram, Twitter) injects `@JavascriptInterface` objects
  into every page it opens, and a throw inside one of those native methods is surfaced by
  the WebView as a page error attributed to us. **The METHOD NAME varies**, so filtering
  `enableDidUserTypeOnKeyboardLogging` by name meant `postMessage` arrived later as a fresh
  issue and paged us again (JAVASCRIPT-REACT-9K). `beforeSend` now matches the two stable
  SUFFIXES instead — `Java object is gone` and
  `Java exception was raised during method invocation`. ⚠️ Verified first that our own
  `postMessage` calls are web-worker-only (`hooks/useWebWorker.js`), so a real fault of ours
  could not produce that wording — never widen this to a bare method name.
- `Unable to preload CSS for …/swiper-react-*.css` — the file was **verified present on
  CloudFront (HTTP 200)**, so these are transient network failures, and `app.jsx`'s
  `vite:preloadError` handler already reloads once for exactly this.
- `NotFoundError: Failed to execute 'removeChild' on 'Node'` — the other half of the
  `insertBefore` error already on `app.jsx`'s `ignoreErrors` list: React holding a
  reference to a node Google Translate / Safari Reader / an extension has re-parented.
  Nothing in this codebase can prevent it and the page recovers on the next render.
  **Ignoring only `insertBefore` meant half of one known issue was filtered and half was
  still paging us** — both the string list and the `beforeSend` regex now cover both.

### 🚨 The creator e-mail warning moved to where the e-mail is typed (22 Aug 2026)

A creator's address is published to every supporter they sell to — Spenny Piggy is **merchant
of record**, so it rides the transaction record and every refund and dispute. That fact used to
be **one grey subtitle line** on the sign-in step, and the acknowledgement was **five screens
later** on the review step, at the point nobody re-reads anything. A creator who used their
personal address found out from a stranger's reply, and an address cannot be un-sent.

`Pages/Auth/register/CredentialsStep.jsx` now carries the warning where the decision is made:
a black-framed yellow callout (`⚠️ … ⚠️`, gulfs caps) stating what the address is used FOR
(receipts, refunds, disputes), the fix ("use an address you are happy to hand out — most
creators set up one just for this"), and the tick. **Continue is disabled for a creator until
it is ticked** (`credentialsComplete`).

- 🚨 **ONE acknowledgement, not two.** It writes the same `creator_email_receipt_ack` the review
  step's consent writes, so the box is simply already ticked there. `RegisteredUserController`
  validates it as **`accepted`** and stamps `users.creator_email_receipt_acknowledged_at`
  (`StripeController` stamps the same column at Connect onboarding for accounts predating it).
  Never add a second column or a second consent for this.
- ⚠️ **Fixed while here: `chooseRole()` cleared the posted value but not the consent STATE**, so
  after a change of mind the review step redrew its box ticked while `data` said false — the
  tick the reader sees and the tick the server validates disagreeing.
- ⚠️ A Google creator never reaches this screen (no password to choose), so their
  acknowledgement is still collected on the review step, unchanged.

## 🚨 The leaderboard sells now, and it closes (24 Aug 2026, spennypiggy.co)

`/leaderboard` → `LeaderBoardController::wishtenderWishers` → `Pages/leaderboard/Board.jsx`.
Two product gaps and one whole-page design drift, fixed together.

- 🚨 **THE BOARD REACHED NO CHECKOUT.** The highest-intent discovery surface on the
  platform carried exactly one action per row — Follow. Every row that can now carries a
  **buy route**: `row.content` is resolved server-side by
  `LeaderBoardController::contentTargetFor()` to `wishes` → `piggy-pots` → `shop` →
  `memberships`, using the **public visitor's** filters copied from `UserProfileService`,
  so a button can never land on a tab that renders empty. A creator with nothing live gets
  **no button**, never a dead end.
  - ⚠️ **Wishes and Piggy Pots lead the order because they are the two surfaces that allow
    GUEST checkout** — most of this page's readers are not signed in.
  - ⚠️ Labels name the SURFACE (Wishlist · Piggy Pot · Shop · Membership). Gift/tip/donate
    vocabulary is banned on every user-facing surface.
  - 🚨 **`BOARD_CACHE_KEY` bumped `v2` → `v3`.** The cached row shape gained a key; without
    the bump the board serves rows with no `content` for up to two hours and the button
    silently never appears. (It bit locally anyway — a stale entry had to be flushed by
    hand. The bump is what protects production.)
  - The four `withExists` subqueries stop at the first matching row, so they are cheap
    beside the seven aggregates already in `calc()`. ⚠️ **`shops.status` is guarded with
    `Schema::hasColumn`** — it is absent from a database built purely from this repo's
    migrations.
- 🚨 **A BOARD THAT NEVER CLOSES IS A TABLE, NOT A RACE.** Every period but lifetime is
  calendar bounded (`periodWindow` → `startOfWeek`…`endOfWeek`), so the close time is a
  fact: `period_ends_at` ships on both the Inertia props and the board JSON, and
  `Countdown.jsx` renders it in the hero. ⚠️ It renders **nothing** for All time —
  inventing a deadline for a ranking that has none would be the page lying.
- 🚨 **PAST WINNERS ARE RECOMPUTED FROM THE CLOSED WINDOW, NOT READ FROM
  `leaderboard_snapshots`.** `leaderboard:snapshot` runs at **03:15**, so the last capture
  of a week is taken on Sunday MORNING and would name a winner chosen with a day still to
  play. `previousPeriodWindow()` + `calc($type, $window)` give the standing at the moment
  the period actually ended, and a closed window never changes — cached 6h under
  `leaderboard_past_winners_v1_{period}_{from}`. ⚠️ An empty result is **never cached**,
  same rule as the board. 🚨 **Rank and supporter count only — no amounts, ever.**
- **`calc()` takes an optional explicit `$window`.** That is the only change to the query;
  every existing caller is unaffected.

### The design drift, and four traps in fixing it

The page was ink + a gold accent + **36 hairline `ring-black/[0.06]` frames** and almost no
brand colour — a legitimate look, and not this brand's. It is now the house language:
podium places are **solid brand blocks** (pink · mint · yellow) with black type and the
2px frame, and every panel on the page carries `border-black`.

- ⚠️ **Gold `#C9A227` is gone.** It was invented for this page and used nowhere else; the
  Top 1% band is **brand yellow** now.
- 🚨 **A CHIP MUST NOT BE THE COLOUR OF THE GROUND IT SITS ON.** `MovementChip`'s pink
  "New" on the pink first-place card, and its mint "up" on the mint second-place card, were
  separated from their own background by nothing but the frame. `onColor` drops the chip to
  white with black type; Podium passes it.
- 🚨 **`FollowButton` APPENDS ITS OWN `bg-*`/`text-*` TO WHATEVER `classes` YOU PASS**
  (`bg-black text-white` / `bg-white text-black`). Passing `bg-white text-black` in produced
  **white type on a white pill — an empty button**, because the winner between two utilities
  setting one property is decided by STYLESHEET order, not source order. **Never pass a
  colour utility to `classes`.** ⚠️ `npm run check`'s conflicting-class scanner cannot see
  it: the pair is only formed at runtime by string concatenation.
- ⚠️ **A row rule belongs to the LIST, not the row.** An inline `border-bottom` on every
  row cannot be switched off for the last one — an inline style beats any `last:` variant —
  and the result is a doubled line above the list's foot. The section carries `divide-y-2`.
- ⚠️ **`{/* … */}` inside a parenthesised `return (` is an OBJECT LITERAL**, not a comment,
  and it fails the whole Vite build. Hit again while annotating `VipSupporters.jsx`.
- ⚠️ `VipSupporters`' 4px coloured left edge is set **inline** — `border-black` is a full
  `border` shorthand here, so a `border-l-4` class beside it is discarded silently.

### Two smaller decisions

- **`discoveryLink()` takes a 4th argument, `page`**, appended as a **PATH SEGMENT**
  (`/jane/wishes?sp_d=trending`). The profile route is `/{username}/{page?}`, so
  `?page=wishes` renders About with a 200 and no error — the documented silent failure.
  Additive; no existing caller changes.
- 🚨 **On a PHONE, a row with a buy route hides Follow.** Rank + avatar + name + two
  buttons do not fit at 390px (the name column is already down to 87px), so one has to
  lose, and it is not the one that reaches a checkout. Follow is on the creator's own
  profile, which is where the row already leads.

### 🚩 Open, NOT fixed here — the board does not rank by what it says it ranks by

`calc()` sorts on `combined_score`, which is `engagement_score` (supporters × 2, +20% for
verified) **falling back to `total_amount` when a creator has no supporters**. So a creator
with 0 supporters and £300 of revenue scores 300 and outranks a creator with 100 supporters,
who scores 200. The page's own eyebrow says **"Ranked by supporters"** and the row payload
sets `'amount' => 0, // Privacy: the public board ranks reach, never revenue` — both are
untrue of the sort that actually runs. Changing the order of every creator on a public board
is a business decision, not a tidy-up, so it was left alone and is recorded here. The likely
fix is supporters DESC with `total_amount` as a hidden **tiebreak** that can never overtake.

## 🚨 Leaderboard round two — the money it was publishing, and the news it was not (24 Aug 2026)

### The board hid every amount and its own sidebar printed them

`'amount' => 0, // Privacy: the public board ranks reach, never revenue` has been in the
row payload the whole time. Three panels on the same page ignored it.

- 🚨 **`LeaderboardStars` was headed "Top Supporters — fans who have shown the most support"
  and rendered a MONEY FIGURE beside a named account.** Its endpoint
  (`topGiftersAllTime`) does not return supporters at all: it builds each row from the
  **CREATOR** behind one of the largest recent payments (`$value->wish->user`), with that
  payment's `amount`. So the panel published a creator's earnings, under a heading naming
  the wrong people, on a public page. **It is unmounted.** `TopSupporters` — real
  supporters, ranked by purchase COUNT, no money — is in the sidebar in its place, and now
  reads the shared bundle instead of firing its own request.
- 🚨 **`CategoryLeaders` fell back to `total_amount`** (a creator's revenue) whenever
  `engagement_score` was falsy. It shows `total_count` purchases, which the payload already
  carried.
- ⚠️ **`GrowthTrends` fell back to `current_amount`, which the controller hardcodes to 0** —
  so it published a creator's earnings AND published them wrong, as "£0.00". Supporters
  count now. Its two platform tiles also `||`-fell back to `monthly_revenue` / `avg_support`;
  both gone, and `PriceFormat` is no longer imported anywhere on this page.
- ⚠️ **Banned vocabulary and a lying label:** `VipSupporters` labelled
  `creators_supported_count` **"Supporters"** — the opposite of what the number means (it is
  how many creators that person backs); it reads "Creators backed". `CategoryLeaders`' empty
  state drew a **gift box** — an icon carries the same meaning as the word on a
  payment-adjacent surface.
- ⚠️ **`RecentSupporters` carried `text-bls`** — not a class, compiled to nothing, invisible
  for as long as it has existed. Grep for stray class names after any copy edit.
- **Verified in a browser: the rendered page contains ZERO currency figures** and no
  gift/tip/donate wording outside a test account's own username.

### One bar, three readers

`YouBar` was creator-only, so a fan and a logged-out visitor read the whole board and were
told nothing about themselves. It now branches, in priority order: creator standing →
**supporter standing** → **guest CTA**.

- **`viewerSupporterStanding()`** resolves the signed-in fan's place from the FULL supporter
  ranking. ⚠️ It reads a cache (`SUPPORTER_STANDINGS_KEY`) written by
  `topSupportersByFrequency()` and **never recomputes** — that method scans five payment
  tables, and doing it again on every board render costs more than the feature is worth. A
  cold cache means no bar this once; the bundle request the page fires on load fills it.
  🚨 **`BUNDLE_CACHE_KEY` bumped `v2` → `v3`** with it: the bundle caches that response, so
  a v2 entry would keep being served while the standings key stayed empty and the bar
  silently never appeared.
- ⚠️ The supporter gap is stated in **purchases**, the creator gap in **supporters**. No
  amount appears on this bar.

### Three analytics panels became one panel with three tabs

`AnalyticsTabs` mounts only the selected child and passes `hideHeading` — the tab already
names it, and a tab reading "Categories" above a heading reading "🏆 Category Leaders
Creators" says the same thing twice and disagrees about the wording. Sidebar headings moved
onto the board's own eyebrow style (12px uppercase, no emoji) and off `text-xs`/`text-sm`
onto the project's pixel scale.

### Seven faults a review of the above found, all fixed (24 Aug 2026)

- 🚨 **THE WINNERS PANEL CROWNED THREE PEOPLE WHO WON NOTHING.** `calc()` returns EVERY
  eligible creator with windowed counts — **it never comes back empty** — so a period in
  which nobody transacted still produced a full collection with every score at zero, and
  the first three rows of arbitrary database order were published under *"Final standing
  when the board closed"*. Verified live: it named the same three creators the monthly
  board shows with 0 supporters and a "New" chip. `pastWinners()` now requires real
  activity in that window (`total_supporters > 0 || total_amount > 0`) and renders no
  panel when nobody qualifies. ⚠️ **An empty result IS cached here**, unlike the board:
  "nobody transacted last week" is a legitimate, stable answer, and not caching it re-ran a
  full board query on every page load.
- 🚨 **`leaderboard:notify-movement` matched its comparison capture by EXACT date**, so a
  single missed 03:15 run made it report "nobody climbed" and send nothing, with no error
  anywhere — the identical fault `LeaderboardMovementService::previousRanks()` already
  works around for the page's own arrows. It now takes the newest capture **at or before**
  the cutoff, and `substr(…, 0, 10)`s both dates (MAX() returns the stored value verbatim
  and a legacy row can carry a time component). Pinned by two tests.
- 🚨 **`toggleOptOut()` did not evict the past-winners cache**, which names a creator on a
  public page for six hours under keys that cannot be enumerated (one per period per date).
  Its own docblock promises removal *"now, not when the cache expires"*.
  **`PAST_WINNERS_GENERATION_KEY` is read into every key and bumped on opt-out** — stored
  `forever`, never with a TTL, or an expired generation resurrects every pre-bump entry.
  Same device as `discovery_collection_gen_*`.
- ⚠️ **The measure bar scaled against the top SEARCH RESULT while searching** — `rows[0]` is
  then whoever matched first, so every bar compared creators to an arbitrary one and
  presented it as a scale. Suppressed on search, same reasoning the podium already is.
- ⚠️ **`User::find()` inside the mover loop** — up to 500 round trips a run. One `whereIn`
  keyed by id.
- ⚠️ **`Countdown` ticked every second regardless of remaining time**, re-rendering 3,600
  times an hour to change nothing above the one-hour mark. A self-rescheduling `setTimeout`
  ticks at 1s under an hour and 20s above it. ⚠️ **20s, not 60s** — a 60s interval can land
  just after a minute boundary and leave the figure a whole minute stale, which is visible
  on a countdown.
- **No PHP test covered any of the new server behaviour.** `tests/Feature/LeaderboardBoardExtrasTest.php`
  (11) now covers the buy route (present, absent, and suppressed by a moderation hold), the
  close time being null only for the lifetime board, the quiet-period winners case, the
  opt-out cache bump, and the supporter standing resolving outside the top five.

### It has to read as a RACE, not a list (24 Aug 2026, client direction)

A rank gives the ORDER and says nothing about the DISTANCE. #4 and #47 rendered
identically, so nothing on screen showed that one was within reach of the podium and the
other was not — the page was a list of cards that happened to be numbered.

- 🚨 **Every row carries a MEASURE** — a bar drawn against the leader's supporter count.
  `resources/js/Pages/leaderboard/measure.js` is the one definition (`measureFor()`), kept
  out of the component so it can be tested without mounting Inertia, ziggy and the
  analytics helpers.
  - ⚠️ **Reach, never revenue.** It measures SUPPORTERS — the figure the row already
    prints — so it publishes no new fact. This must not become the thing that walks around
    `'amount' => 0`.
  - 🚨 **`MEASURE_FLOOR = 4`, not `> 0`.** With a leader on ONE supporter every bar is
    either full or empty: no information, and a column of blank tracks that reads as a
    loading skeleton. Verified on the dev board, where the whole top ten sits at 0 or 1 and
    the correct outcome is **no bars at all**.
  - ⚠️ **`MIN_VISIBLE_WIDTH = 3`** — 1 in 4000 is 0.025%, and "invisible" must not look the
    same as "zero". A zero keeps its track (the track is the scale) so the list does not go
    jagged by 8px a row.
  - ⚠️ The scale is the leader of the **board on screen**, not of the loaded page — else
    "Show more" would rescale the list on every fetch and the bars would mean different
    things above and below the join.
- 🚨 **THE BAR WILL VISIBLY DISAGREE WITH THE RANK ORDER, AND THAT IS THE RANKING BUG
  SHOWING, NOT A BUG IN THE BAR.** The board sorts on `combined_score`, which falls back to
  revenue for a creator with no supporters (see the open item above), so a row further down
  can legally carry a longer bar. `measureFor` clamps at 100% rather than overflowing its
  track, and a test pins that case with the reason. When someone reports "the bars are
  wrong", the sort is what needs the fix.
- **The top ten are heavier than the tail** — the rank numeral steps 22/20/18 (32/28/24 at
  `sm`) across top-3, top-10 and the rest, and the tail's numeral is `black/70` where the
  top ten is full black. A board where #4 and #47 are set identically is a table.
- **The podium states the gap in words** — "12 ahead of second" / "3 behind first" / "Level
  with second". A podium that only says first, second, third is a rosette, not a standing.
  ⚠️ Set as a small caps label, **NOT `font-gulfs`** — as display type it outshouted the
  creator's own name, which is Poppins on that card and is the card's subject. Suppressed
  entirely when the figures are 0, or it reads "0 ahead of second".
- Tests: `tests/javascript/leaderboardMeasure.test.js` (7).

### The category panel — Supports leads, and an empty tab says so

- **`CATEGORIES` is module scope and `Supports` is first**, and the panel's default is
  `CATEGORIES[0].key` — never a hardcoded `'wishes'`. A hardcoded default is a second copy
  of the key that stops matching the day the row is reordered, and the panel then opens on
  a tab that renders nothing. (Client direction, 24 Aug 2026: Supports is the primary tab —
  it is the one category every creator can appear in, so it is the only one that reads as a
  leaderboard of the platform rather than of one product.)
- 🚨 **EVERY TAB CARRIES ITS COUNT.** Without one, a category with nothing in it is
  indistinguishable from a full one until you have clicked it and been shown an empty
  panel — which is exactly how this was found. The count is a `length`, never an amount.
  ⚠️ On the current dev database **all six categories return 0**: `categoryLeaders()` is
  scoped to a rolling three-month window, so an empty panel there is data, not a fault.
- ⚠️ **The empty state names the product and offers a route.** It read *"Be the first to
  make it to the Supports leaderboard!"*, which tells a creator nothing about what would
  put them on it and is not addressed to the visitor reading it. Each category carries a
  `product` (Piggy Bank · Wishlist · Memberships · Recurring content · Shop) and the copy
  uses it verbatim — **no `.toLowerCase()`**, these are product names.
- Headings across all three analytics panels moved onto the board's eyebrow style; the page
  now renders **no emoji at all** (the footer's Pride campaign is a different surface).
- ⚠️ `RiGiftLine` and `RiGroupLine` are no longer imported in `CategoryLeaders` — the
  commented-out `subscriptions` row says so beside itself.

### `leaderboard:notify-movement` — the captures finally get read

🚨 **`leaderboard:snapshot` has written a rank per creator per period per day since the
movement arrows were built, and the arrows were the only thing that ever read it** — a
creator had to open the page to learn they had climbed. Weekly, Monday **09:15** (after the
03:15 capture it compares against, and clear of 09:00/09:30/09:45).

- 🚨 **UPWARD MOVES ONLY.** A creator who slipped has not done anything wrong, and a push
  saying so is a telling-off from the platform they sell on — the same reasoning that keeps
  the board's "down" chip grey rather than red. Pinned by test.
- 🚨 **Ships OFF** (`LEADERBOARD_MOVEMENT_NOTIFICATIONS`, default false). A flag-off run
  reports and **claims nothing**, so switching it on later cannot silently swallow the first
  week.
- **Snapshots, never a live recompute** — so the command cannot disagree with the arrows the
  page draws, and it does not run the seven-aggregate board query.
- ⚠️ **The aliases are `cur`/`prv`.** `now` and `then` are SQL keywords and appear unquoted
  inside the raw comparison; SQLite answers `near "then": syntax error` and the command dies.
- ⚠️ **A lower rank number is a better position**, so the climb is `prv.rank - cur.rank`.
  Backwards, it congratulates everyone who slipped.
- ⚠️ **Queued per creator** (`NotificationDispatcher::queue`), never `send()` in a loop —
  push is a synchronous HTTP call and production is a 60-second Lambda. **Needs
  `queue:work`.** Claimed via `NotificationDispatcher::claim` BEFORE the queue push, so a
  re-run on the same capture cannot double-send.
- ⚠️ **A capped run says so.** `movement_max_per_run` (500) exists so a first run against a
  full history cannot fan out to the platform at once; silent truncation reads as "that is
  everyone".
- Config `config/leaderboard.php`. Env: `LEADERBOARD_MOVEMENT_NOTIFICATIONS`,
  `LEADERBOARD_MOVEMENT_MIN_PLACES` (3 — one place is noise, the board re-ranks daily),
  `LEADERBOARD_MOVEMENT_PERIOD` (weekly), `LEADERBOARD_MOVEMENT_MAX_PER_RUN`.
- Tests: `tests/Feature/LeaderboardMovementNotificationTest.php` (9).

### X (Twitter) Ads conversions (23 Aug 2026, spennypiggy.co)

Same two-route shape as Google, deliberately — the constraint is identical, so the solution is.
Config lives beside GA4's in `config/analytics.php` under `x`.

| Route | Events | Why |
|---|---|---|
| **Pixel** (`twq`, id `ozu4h`) | `sign_up`, `purchase` | already reach the browser through `AnalyticsEvent` |
| **Conversions API** (`XConversionsApi` → `SendXConversion`) | `begin_checkout`, `stripe_connect_started` | both redirect OUT to Stripe; the pixel can never fire |

- 🚨 **ONE EVENT, ONE ROUTE.** X deduplicates a pixel event against an API event **only** when
  both carry the same `conversion_id`. Rather than depend on that, the two sets are kept
  **disjoint** — `app.blade.php` publishes `->only(['sign_up', 'purchase'])` to the pixel, so an
  event the server owns cannot also be reported by the browser. A `conversion_id` is still sent
  (`checkout-{session}`, `connect-{user}-{Ymd}`) so that changing the split later cannot silently
  double-count.
- 🚨 **`twclid` is the ONLY identifier sent.** X also accepts `hashed_email`,
  `hashed_phone_number`, or an `ip_address`+`user_agent` pair — all of which are **personal data
  going to a third party**, and hashing does not stop an email being personal data. That is a
  decision for the client and their legal advice (and this site still has **no privacy policy**),
  not a default. **No click id ⇒ no conversion**: it could not have been attributed to an advert
  anyway.
- **The click id is captured first-touch** by `TrackSiteVisit` into `VisitTracker::TWCLID_COOKIE`
  (`sp_twclid`, 30 days = X's click-through window). ⚠️ **Never overwritten** — the last click
  before a checkout is almost never the advert that started the journey. It is
  **length-capped and character-checked**, because it is attacker-supplied text going into a
  cookie and then into a request body sent to X.
- ⚠️ **X answers HTTP 200 with per-conversion errors in the body**, so a status check alone
  reports success on a rejected payload. `SendXConversion` checks `errors` too.
- 🚨 **`X_ADS_API_TOKEN` is a credential** — anyone holding it can inject conversions into the ad
  account and corrupt its bidding. It arrived from the client in plaintext, so **it should be
  rotated** once live.
- ⚠️ **CSP hosts were added BEFORE the pixel shipped** (`$xAds` in `SecurityHeaders`:
  `static.ads-twitter.com`, `analytics.twitter.com`, `*.ads-twitter.com`, `t.co`). The policy is
  report-only today, so a missing host costs nothing visible right up until
  `SECURITY_CSP_ENFORCE=true`, at which point the pixel stops loading silently and the ad account
  simply reports no conversions.
- **Env:** `X_PIXEL_ID`, `X_ADS_API_TOKEN`, `X_ADS_API_VERSION` (pinned at 12), and one id per
  event — `X_EVENT_SIGN_UP`, `X_EVENT_PURCHASE`, `X_EVENT_BEGIN_CHECKOUT`,
  `X_EVENT_CONNECT_STARTED`, taken from X Ads → Events Manager. Unset ⇒ that event is never
  reported.
- Tests: `tests/Feature/AnalyticsXAdsTest.php` (10), plus the pixel fan-out cases in
  `tests/javascript/analytics.test.js` (36 total).

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
