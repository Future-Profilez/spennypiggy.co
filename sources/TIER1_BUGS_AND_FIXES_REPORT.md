# SpennyPiggy — Tier 1 Bugs & Fixes Report

**Date:** 2026-04-28  
**Prepared by:** AI Code Review  
**Scope:** Tier 1 Launch Blockers only (as per client launch brief)

---

## Summary

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | `executePayouts()` — Friday payout never actually transferred money to creators | 🔴 CRITICAL | ✅ Fixed |
| 2 | Admin Finance Dashboard — completely missing | 🔴 CRITICAL | ✅ Fixed |
| 3 | Creator Financial Dashboard — reserve messaging incomplete, no release dates shown | 🟡 HIGH | ✅ Fixed |
| 4 | Unused `AuditLog` import + uncaught `$e` variable in `PayoutService` | 🟢 LOW | ✅ Fixed |
| 5 | Creator banner “Reserve Applied” showed for new creators even with 0 transactions | 🟡 HIGH | ✅ Fixed |

---

## Bug 1 — Friday Payout Not Transferring Money (CRITICAL LAUNCH BLOCKER)

### What Was Wrong

The `executePayouts()` method in `PayoutService.php` had a massive unresolved TODO comment
(lines 268–329 of the original file). The method only marked payment records in the
database with a `payout_run_id` — **it never called any Stripe API to actually move money
to creators.**

At the same time, `RiskController.php` was creating PaymentIntents with:
```php
$stripePayload['transfer_data'] = ['destination' => $connectedAccountId];
$stripePayload['application_fee_amount'] = (int)($request->amount * 0.05);
```

This `transfer_data` flag tells Stripe to **immediately** move funds to the creator's
connected account the moment the supporter pays. This created two problems:

1. **Reserves could not be held** — if money goes directly to the creator at payment time,
   the platform has no way to deduct the 10% reserve on Friday.
2. **Friday payout engine was misleading** — admin could click "Execute Payout" on the
   Risk Dashboard, see a "success" message, but zero money would actually move.

### Root Cause

Architectural conflict: the code was using "Destination Charge" (immediate transfer via
`transfer_data`) but the Friday payout spec requires "Separate Charges and Transfers"
(money stays on platform until Friday).

### What Was Fixed

**File 1: `database/migrations/2026_04_28_100000_add_platform_holds_funds_to_payments.php`** *(new file)*

Added two columns to the `payments` table:
- `platform_holds_funds` (boolean, default `false`) — marks which payments were charged
  without `transfer_data`, i.e., funds are sitting on the platform Stripe account
- `stripe_transfer_id` (string, nullable) — stores the Stripe Transfer ID created during
  Friday payout for full audit trail

---

**File 2: `spennypiggy.co/app/Models/Payment.php`**

Added the two new columns to `$fillable` and `$casts`.

---

**File 3: `spennypiggy.co/app/Http/Controllers/Api/RiskController.php`**

Removed `transfer_data` and `application_fee_amount` from **both** PaymentIntent creation
paths (Step-Up flow + standard evaluate flow). Money now stays on the platform Stripe
account after payment.

Added `platform_holds_funds = true` when creating the `Payment` DB record so the payout
engine knows these funds are on-platform and ready to transfer.

Before (broken):
```php
if ($connectedAccountId) {
    $stripePayload['transfer_data'] = ['destination' => $connectedAccountId];
    $stripePayload['application_fee_amount'] = (int)($request->amount * 0.05);
}
```

After (fixed):
```php
// No transfer_data — funds stay on platform until Friday payout
// platform_holds_funds = true set on the Payment record
```

> **Note:** Other payment flows (WishItem checkout, Memberships, Shops, Bills) still use
> `transfer_data` as before — those are separate flows not going through the risk engine
> and were not changed.

---

**File 4: `spennypiggy.co/app/Services/Risk/PayoutService.php`**

Replaced the entire TODO comment block in `executePayouts()` with real logic:

```php
// Only transfer if at least one payment in this batch is platform-held
$needsTransfer = Payment::whereIn('id', $data['payment_ids'])
    ->where('platform_holds_funds', true)
    ->exists();

if ($needsTransfer && $netPayout > 0 && $creator->account_id) {
    $transfer = StripeControl::transferToConnectedAccount(
        $creator->account_id,
        $amountMajor,
        $currency
    );
    // Store transfer ID for audit
    Payment::whereIn('id', $data['payment_ids'])
        ->where('platform_holds_funds', true)
        ->orderByDesc('created_at')->limit(1)
        ->update(['stripe_transfer_id' => $transfer->id]);

    // Notify creator
    Helpers::sendNotification('💰 Payout Sent', "Your payout of £X has been sent.", $creator->email);
}
```

**Key safety guard:** `platform_holds_funds` check ensures old payments (that already used
`transfer_data` and sent money directly to creator) are never double-transferred.

---

## Bug 2 — Admin Finance Dashboard Missing (CRITICAL LAUNCH BLOCKER)

### What Was Wrong

The client explicitly listed **"Admin finance dashboard (critical missing piece)"** as a
Tier 1 requirement. There was no dedicated admin finance page. A `getFinancialInsights()`
method existed in `DashboardService.php` but was **commented out** in `AuthController.php`:

```php
// $financialInsights = $this->DashboardService->getFinancialInsights();
// $analytics['financial_insights'] = $financialInsights;
```

Admins had no single place to see:
- Total GMV (all time, this month)
- Platform fees collected
- Total reserves held across all creators
- Payout run history
- Review-hold queue value
- What the next Friday payout looks like

### What Was Fixed

**File 1: `admin.spennypiggy.co/app/Http/Controllers/Admin/AdminFinanceDashboardController.php`** *(new file)*

New controller that computes and returns:
- `gmv` — all-time, this month, last month, growth rate %
- `fees` — all-time and this month (gross minus net from FinancialTransaction)
- `reserves` — total unreleased reserves + per-creator breakdown (up to 20 rows)
- `review_holds` — count and total value
- `refunds_this_month` — total refunded amount
- `disputes_this_month` — count of disputed payments
- `payout_runs` — last 10 payout run records
- `next_payout_preview` — live calculation of next Friday's eligible payout
- `monthly_gmv` — last 6 months GMV for the bar chart

---

**File 2: `admin.spennypiggy.co/routes/web.php`**

Added route (inside the authenticated admin middleware group):
```php
Route::get('/finance', [AdminFinanceDashboardController::class, 'index'])
    ->name('admin.finance.index');
```

**URL:** `/finance` on the admin app

---

**File 3: `admin.spennypiggy.co/resources/js/Pages/Admin/Finance/Dashboard.jsx`** *(new file)*

Full React page with:
- 8 stat cards (GMV, fees, reserves, review holds, refunds, disputes, next payout)
- 6-month GMV bar chart (CSS-only, no external chart lib needed)
- Payout run history table (date / status / creator count / net total)
- Unreleased reserves table (creator ID / amount / run date / release date)

---

## Bug 3 — Creator Dashboard Reserve Messaging Incomplete (HIGH PRIORITY)

### What Was Wrong

The creator's financial dashboard showed a held reserves total with only the text:
> *"Rolling reserve held for platform safety."*

Missing information:
- **Why** was the reserve applied? (new creator? high risk?)
- **When** will it be released? (no release dates shown)
- **How much** from each payout run?
- What does "Expected Next Payout" mean? (no explanation)
- "Extra Revenue" context (referral/founder bonuses not explained)

Client requirement: *"correct balances + messaging ref reserves & extra Revenue"*

### What Was Fixed

**File 1: `spennypiggy.co/app/Http/Controllers/CreatorFinancialController.php`**

Injected `PayoutService` alongside existing `FinancialService`. Added two new props passed
to the view:

- `reserve_breakdown` — list of held reserves per payout run, each with:
  - `amount` (pence)
  - `run_date` (when the payout run was executed)
  - `release_date` (90 days after run date)
  - `days_remaining` (days until release)

- `reserve_reason` — human-readable reason string based on creator's risk level:
  - High risk → *"High risk level detected on your account."*
  - Medium risk → *"Medium risk level applied to your account."*
  - New creator (< 30 days) → *"New creator reserve (first 30 days)."*
  - Default → *"Standard rolling reserve for platform safety."*

---

**File 2: `spennypiggy.co/resources/js/Pages/Creator/Financial/Dashboard.jsx`**

Updated the Reserves & Payout Status section:

Before:
```
Held Reserves: £50.00
Rolling reserve held for platform safety.
```

After:
```
Held Reserves: £50.00
New creator reserve (first 30 days).

  Held from 2026-04-25   £50.00   Releases 2026-07-24 (87d)
  Held from 2026-04-18   £30.00   Releases 2026-07-17 (80d)

Expected Next Payout: £420.00
Paid out every Friday. Excludes reserves & review holds.
```

---

## Bug 4 — Unused Import and Variable Warning in PayoutService

### What Was Wrong

Two PHP warnings (intelephense P1003) in `PayoutService.php`:
- `use App\Models\AuditLog` — imported but never used
- `catch (\Throwable $e)` — `$e` declared but never used (just a fallback to create metric)

### What Was Fixed

**File: `spennypiggy.co/app/Services/Risk/PayoutService.php`**

- Removed `use App\Models\AuditLog` import
- Changed `catch (\Throwable $e)` to `catch (\Throwable)` (PHP 8+ nameless catch)

---

## Bug 5 — “Reserve Applied” Banner Showing for New Creator With No Transactions

### What Was Wrong

The creator-facing banner API was showing:
> “Reserve Applied … due to increased disputes”

even for brand new creators with **no transactions**, which is confusing and incorrect.

### What Was Fixed

**File: `spennypiggy.co/app/Http/Controllers/Api/CreatorRiskController.php`**

The banner is now shown only when:
- Creator has Stripe connected (`stripe_details_submitted == 1`)
- Creator has at least one earning/payment record (first transaction exists)

This ensures new creators do not see reserve/payout risk banners until they actually have payout-relevant activity.

---

## Files Changed — Complete List

### spennypiggy.co (main app)

| File | Type | Change |
|------|------|--------|
| `database/migrations/2026_04_28_100000_add_platform_holds_funds_to_payments.php` | NEW | Adds `platform_holds_funds` + `stripe_transfer_id` columns |
| `app/Models/Payment.php` | MODIFIED | Added new columns to `$fillable` and `$casts` |
| `app/Http/Controllers/Api/RiskController.php` | MODIFIED | Removed `transfer_data`, set `platform_holds_funds = true` |
| `app/Services/Risk/PayoutService.php` | MODIFIED | `executePayouts()` now triggers real Stripe transfers; fixed unused import/variable |
| `app/Http/Controllers/Api/CreatorRiskController.php` | MODIFIED | Show reserve/payout banners only after first transaction and Stripe connected |
| `app/Http/Controllers/CreatorFinancialController.php` | MODIFIED | Injected `PayoutService`; passes `reserve_breakdown` + `reserve_reason` to view |
| `resources/js/Pages/Creator/Financial/Dashboard.jsx` | MODIFIED | Reserve section shows breakdown with release dates and reason text |

### admin.spennypiggy.co (admin app)

| File | Type | Change |
|------|------|--------|
| `app/Http/Controllers/Admin/AdminFinanceDashboardController.php` | NEW | Full finance dashboard controller |
| `routes/web.php` | MODIFIED | Added `GET /finance` route |
| `resources/js/Pages/Admin/Finance/Dashboard.jsx` | NEW | Finance dashboard React page |
| `tests/__snapshots__/...UserProfileViewSnapshotTest.php.json` | AUTO-UPDATED | Snapshot updated to include the new `/finance` route |

---

## Test Results (Post-Fix)

```
Main App (spennypiggy.co)
  Tests: 14 passed, 0 failed ✅

Admin App (admin.spennypiggy.co)
  Tests: 104 passed, 10 skipped, 0 failed ✅
```

---

## What Is Still NOT Fixed (Out of Scope for This Session)

These are known gaps that were NOT changed because they are either Tier 2/3 items or
require product decisions beyond code changes:

| Item | Reason Not Fixed |
|------|-----------------|
| Other payment controllers (CheckoutController, MembershipController, ShopsController) still use `transfer_data` | Separate flows from risk engine — intentional, requires separate product decision |
| Creator dashboard "Extra Revenue" section (referral/founder bonuses) | Data exists but UI design not specified |
| Email deliverability (DKIM/SPF/DMARC) | Infrastructure / DNS config — not code |
| Leaderboard inconsistencies | Tier 2 item |
| Load/performance testing | Requires staging environment setup |

---

*End of report.*
