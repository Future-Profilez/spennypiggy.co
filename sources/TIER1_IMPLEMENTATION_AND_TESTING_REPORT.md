# SpennyPiggy — Tier‑1 Implementation + Flows + Testing Report

Date: 2026-04-28

This document summarizes exactly what has been implemented for Tier‑1 (as discussed: payments safety, risk controls, webhooks, reserves/payouts, admin operations) and how the end‑to‑end flows work across both applications.

Repos:
- Main site (user/creator/gifter): `spennypiggy.co`
- Admin site (operations/admin): `admin.spennypiggy.co`

If you need the deeper risk-engine explanation and config keys, reference: [RISK_SYSTEM_IMPLEMENTATION.md](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/RISK_SYSTEM_IMPLEMENTATION.md)

## Tier‑1 Scope (Client Requirements Covered)

- Mandatory platform subscription (Stripe Checkout subscription mode, trial once per user)
- Payments risk engine (BLOCK / COOLDOWN / STEP_UP / REVIEW_HOLD)
- Stripe webhook ingestion (signature verify + idempotency + retries safe)
- Disputes + refunds lifecycle handling (keep internal ledger in sync)
- Duplicate payment protection (webhook-level and business-object level)
- Payout runs (net payout calculation) + rolling reserves (hold + release)
- Admin risk dashboard + configuration + operational actions (review-hold release/block, reserve release)
- Tier‑1 test stabilization (admin + main app suites runnable/green)

## High-Level Architecture (Hinglish)

- Main app payment flow mein pehle Risk Decision hota hai, phir Stripe Checkout/Payment attempt create hota hai.
- Stripe webhooks main app mein land hote hain, aur same event ko multiple times aane par bhi safe rehta hai (idempotent).
- Admin app ka use ops ke liye hai: risk settings change, review-hold queue manage, payouts/reserve release trigger, dashboards.

## Core Flows (End‑to‑End)

### Flow A — Mandatory Platform Subscription (MonthlyCharge)

Entry point:
- [StripeController::payMonthlyCharge](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/Auth/StripeController.php#L3454-L3574)

Flow:
- User ke Stripe Customer ko ensure karta hai (create if missing).
- Duplicate subscription prevention: Stripe se current status sync karke already active ho to short‑circuit.
- `MonthlyCharge` record create hota hai (amount + VAT), then Stripe Checkout Session create hoti hai in `subscription` mode with inline `price_data`.
- Trial logic: 3 days trial sirf ek baar per user (previous trial dates exist to trial 0 days).
- Success/cancel par mandatory handle route call hota hai.

Checkout completion handler:
- [StripeController::handleMandatorySubscription](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/Auth/StripeController.php#L3582-L3650)

Notes:
- Platform access deliverable entry bhi create hota hai for tracking/consistency.

### Flow B — Risk Decision Before Payment

Core components:
- [RiskEngineService](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Services/Risk/RiskEngineService.php)
- [RiskService wrapper](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Services/Risk/RiskService.php#L31-L73)
- Enforcement helper: [RiskEnforcement trait](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Traits/RiskEnforcement.php#L46-L170)
- API controller behavior: [Api/RiskController decision mapping](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/Api/RiskController.php#L307-L341)

Flow:
- Request context (amount/currency/creator/supporter identity, device/email/ip) se risk evaluate hota hai.
- Decisions:
  - `ALLOW`: proceed.
  - `STEP_UP`: OTP/verification required before continuing.
  - `COOLDOWN`: block for configured minutes.
  - `BLOCK`: hard stop.
  - `REVIEW_HOLD`: payment allowed but later payout holds apply (ops can approve/release).

### Flow C — Stripe Webhook Ingestion (Idempotent)

Entry point:
- [StripeWebhookController](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/StripeWebhookController.php#L80-L238)

Flow:
- Stripe signature verify multiple secrets (UK/US) and set correct Stripe API key accordingly.
- Idempotency:
  - `stripe_webhook_status` table stores `event_id`.
  - If status already `processed` (or processed_at set) → returns success without reprocessing.
  - If status `processing` and updated recently → returns success (prevents double work).
  - New event creates row; race condition safe (create → catch unique error → re-fetch).
- Then event type routing happens (checkout, invoices, disputes, refunds, payment_intent, etc.).

### Flow D — Disputes / Refunds → Internal Ledger Sync

Webhook routes include:
- `charge.dispute.created`
- `charge.dispute.updated` / `charge.dispute.funds_withdrawn` / `charge.dispute.funds_reinstated`
- `charge.dispute.closed`
- `charge.refunded`

Reference switch routing:
- [StripeWebhookController dispute/refund routing](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/StripeWebhookController.php#L220-L236)

Outcome:
- Internal `Payment` statuses stay in sync (e.g., mark as `disputed`, handle updates/closed, handle refunds).

### Flow E — Duplicate Payment Protection

Mechanisms:
- Webhook event idempotency (event-level exactly-once processing): [StripeWebhookController](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/StripeWebhookController.php#L110-L166)
- Business-object idempotency checks: avoid re-creating records for same `checkout.session.id` etc.
- Some handlers wrap processing in DB transactions + row locks to avoid concurrency duplication.

### Flow F — Payout Runs + Rolling Reserve (Hold + Release)

Main service:
- [PayoutService (main app)](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Services/Risk/PayoutService.php#L15-L228)

Payout calculation flow:
- Select eligible creators from `payments` ledger (where `payout_run_id` is null).
- Per creator:
  - Pull metrics (prefer recalculated metrics via `RiskService::recalculateMetrics()`).
  - Apply platform risk state (THROTTLE/FREEZE) payout delay days.
  - Sum `succeeded` payments; subtract `refunded/disputed` adjustments.
  - Compute reserve hold `%` from metrics and hold it.
  - Track negative balance carry-forward so creators cannot cash out while net negative.

Reserve release flow:
- Old executed payout runs (90+ days) scanned.
- For each creator, `reserve_amount` released once and marked in the stored JSON.
- Transfers to Stripe connected account happen via `StripeControl::transferToConnectedAccount()` with minor→major conversion for non-zero-decimal currencies.

Admin-side reserve release logic exists too:
- [PayoutService (admin)](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Services/Risk/PayoutService.php)

## Admin Operations (Tier‑1)

### Admin Risk Dashboard + Controls

Relevant areas:
- Routes: [admin routes (risk)](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/routes/web.php)
- Controller: [Admin RiskController](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Http/Controllers/Admin/RiskController.php)

Ops actions include:
- Review-hold list: release vs block (refund) actions with auditability.
- Reserve release actions from admin UI.
- Risk configuration thresholds and limits (stored in risk settings).

### Admin User List Performance (supporting Tier‑1 ops)

Reason: admin list pages and risk ops screens should not degrade from N+1 query patterns, especially in ops workflows.

Changes:
- `listPage()` uses `withCount()` so `total_wishes` / `total_tos` don’t trigger per-user COUNT queries:
  - [UserController listPage](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Http/Controllers/Admin/UserController.php#L612-L728)
  - [User model accessors](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Models/User.php#L200-L254)
- Added the missing internal endpoints expected by N+1 tests:
  - Routes: [web.php additions](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/routes/web.php#L159-L160)
  - Controller handlers: [apiCreatorsAll/apiGiftersAll](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Http/Controllers/Admin/UserController.php#L564-L604)

### Admin Auth Stability (supporting Tier‑1 ops)

Fix: admin login should not 500 in environments where UA parsing package is missing.
- Implemented safe fallback in login logging (device/browser parsing):
  - [LoginLogService](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Services/LoginLogService.php#L109-L202)

## Testing Report (Latest)

Environment:
- PHP: 8.2.28
- OS: macOS

### Admin App (`admin.spennypiggy.co`)

Command:
- `php artisan test`

Result:
- 104 passed
- 10 skipped
- 0 failed

Notes:
- Some tests are skipped due to sqlite DB configuration constraints in the testing environment.

### Main App (`spennypiggy.co`)

Command:
- `php artisan test`

Result:
- 14 passed
- 0 failed

## Quick “Where To Look” (File Index)

Main app:
- Webhooks + idempotency: [StripeWebhookController](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/StripeWebhookController.php)
- Risk engine: [RiskEngineService](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Services/Risk/RiskEngineService.php)
- Payouts + reserves: [PayoutService](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Services/Risk/PayoutService.php)
- Mandatory subscription: [StripeController (payMonthlyCharge)](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/spennypiggy.co/app/Http/Controllers/Auth/StripeController.php#L3454-L3650)

Admin app:
- Risk dashboard: [RiskController](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Http/Controllers/Admin/RiskController.php)
- Ops user list + counts optimizations: [UserController listPage](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Http/Controllers/Admin/UserController.php#L612-L728)
- Login logging fallback: [LoginLogService](file:///Users/naveentehrpariya/Office/SPENNYPIGGY/admin.spennypiggy.co/app/Services/LoginLogService.php)

