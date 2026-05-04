```markdown



SOLO Coder

Locate "Risk Classification Thresholds" in `Configuration.jsx` or the Risk Engine Service. & Analyze the specific parameters involved (e.g., dispute_rate, refund_rate, concentration_percent).

0/3 done

Locate "Risk Classification Thresholds" in `Configuration.jsx` or the Risk Engine Service.

Analyze the specific parameters involved (e.g., dispute_rate, refund_rate, concentration_percent).

Explain the purpose and mechanics of these thresholds to the user in Hindi.

admin.spennypiggy.co/resources/js/Pages/Admin/Risk/Configuration.jsx

admin.spennypiggy.co/resources/js/Pages/Admin/Risk/Configuration.jsx

2/3 done

Locate "Risk Classification Thresholds" in `Configuration.jsx` or the Risk Engine Service.

Analyze the specific parameters involved (e.g., dispute_rate, refund_rate, concentration_percent).

Explain the purpose and mechanics of these thresholds to the user in Hindi.

Explain the purpose and mechanics of these thresholds to the user in Hindi.

3/3 done

Locate "Risk Classification Thresholds" in `Configuration.jsx` or the Risk Engine Service.

Analyze the specific parameters involved (e.g., dispute_rate, refund_rate, concentration_percent).

Explain the purpose and mechanics of these thresholds to the user in Hindi.

Admin Panel mein Risk Classification Thresholds ka section basically aapke platform ka "Brain" (dimag) hai jo har creator ko automatically "High Risk", "Medium Risk", ya "Low Risk" mein dalta hai.

Yeh setting tay karti hai ki ek creator ko kab khatarnaak (risky) mana jayega. Isme 3 main cheezein check hoti hain:

### 1. Dispute Rate & Refund Rate (Chargebacks & Refunds)
Yeh check karta hai ki pichle 30 dino mein creator ki total sales mein se kitne percent transactions par chargeback ya refund aaya hai.

- High Dispute Rate (> X): (Maan lijiye aapne 0.01 yani 1% set kiya). Agar creator ki 1% se zyada payments dispute ho jati hain, toh system usko seedha High Risk mark kar dega. Uske baad us par "High Risk Consequences" (jaise 20% Reserve aur 14 din ka payout delay) lag jayenge.
- Medium Dispute Rate (> X): (Maan lijiye 0.005 yani 0.5%). Agar dispute rate iske upar hai lekin High wale se kam hai, toh wo Medium Risk mein aayega (jaise 10% Reserve aur 10 din delay).
- High Refund Rate (> X): Agar koi creator chargeback toh nahi kha raha, lekin uske customers baar-baar aapse refund maang rahe hain (e.g. 5% se zyada refunds), tab bhi system usko risky mark kar dega.
### 2. Min Transactions for Review
- Min Transactions: Yeh isliye hai taaki system naye creators ko galat tarike se punish na kare. Agar aapne isko 10 set kiya hai, toh jab tak creator ke account par kam se kam 10 transactions nahi aati, tab tak system uski dispute rate check nahi karega. (Kyunki agar pehli hi payment dispute ho gayi, toh rate 100% ho jayega, jo ki unfair hoga).
### 3. Concentration Risk (Fraud Ring Detection)
Yeh sabse advanced feature hai. "Concentration" ka matlab hai ki kya ek creator ki saari kamai sirf ek hi aadmi (supporter) se toh nahi aa rahi? Aksar fraudsters naye accounts banate hain aur apne hi dusre fake card se khud ko ₹1 Lakh pay kar dete hain.

- Concentration GMV Threshold: Yeh wo amount hai jiske baad system yeh check karna shuru karta hai. (e.g. Agar kamai £500 se upar jati hai tabhi yeh rule apply hoga).
- Concentration % Trigger: Agar aapne isko 75% set kiya, iska matlab hai ki agar ek creator ki total income ka 75% hissa sirf ek hi bande se aaya hai, toh system alert ho jayega ki yeh fraud ho sakta hai.
- Concentration Reserve Increase: Agar system pakad leta hai ki ek hi banda saara paisa de raha hai, toh wo automatically creator par ek heavy Reserve (jaise 30%) thop dega taaki aap (platform) safe rahein.
Short mein: Aap is section mein numbers set karke system ko batate hain ki "Bhai, agar itne % se zyada fraud/refund ho, ya ek hi aadmi saara paisa de raha ho, toh us creator ka Risk Level badha kar uska paisa rok lena/payout rok lo taaki platform ka nuksaan na ho."
```

# Spenny Piggy – Risk, Payments & Admin Controls (Implementation Doc)

This document explains what has been implemented across the two repos, why each feature exists, who uses it, and how the full flow works end‑to‑end.

## Repositories

- Main site (user/creator/gifter flows): `spennypiggy.co`
- Admin site (founder/admin operations): `admin.spennypiggy.co`

Both apps read/write the same underlying tables for the risk engine (payments ledger, identities, rollups, platform state, disputes, etc.).

## Primary Goals

- Block fraud and chargeback patterns before Stripe is hit when possible
- Reduce Stripe risk signals (excessive failures, card testing patterns)
- Give admins full control over thresholds/limits from the admin dashboard
- Keep creators safe: reserves + review holds + payout delays based on risk
- Provide auditability: logs, exports, and traceable decisions

## Roles (Who Uses What)

- Supporter/Gifter: pays creators (cart checkout, tip jar, etc.)
- Creator: receives support; may be restricted based on subscription/activity/risk
- Admin/Founder: tunes risk settings, monitors action queue, runs payouts, exports audit pack

## Key Concepts

### 1) Risk Identity

Purpose: link payment attempts to a stable “person/device” so limits cannot be bypassed by changing email.

Resolution order:

1. Card fingerprint (when available)
2. Device ID (frontend generated)
3. Email
4. IP

Main code: `spennypiggy.co/app/Services/Risk/RiskIdentityService.php`

### 2) Payments Ledger (Risk Engine “payments” table)

Purpose: a platform-side ledger used for limits, velocity rules, review holds, payout selection, and reporting.

Key statuses used:

- `initiated`: checkout created / attempt started
- `step_up`: STEP\_UP triggered (OTP required)
- `succeeded`: successful payment
- `review_hold`: captured but held for payout safety
- `refunded`, `disputed`: negative adjustments

This ledger is what the Risk Engine uses to compute “how much was spent in the last hour/day/week”.

### 3) Identity Rollups

Purpose: fast counters for spend and attempt frequency.

Examples:

- `spend_1h`, `spend_24h`, `spend_7d`
- `payment_count_10m`
- `creators_paid_24h`, `creators_paid_48h`

Main code: `spennypiggy.co/app/Services/Risk/IdentityRollupService.php`

Important behavior:

- Spend windows include `initiated` to prevent “open multiple checkouts then exceed cap” bypass.

### 4) Platform Risk State

Purpose: automatic “brakes” on the whole platform when risk spikes.

States:

- NORMAL
- CAUTION
- THROTTLE
- FREEZE

The platform state influences effective limits and creator onboarding.

Main code:

- State monitor command: `spennypiggy.co/app/Console/Commands/MonitorPlatformRiskState.php`
- Effective limits service: `spennypiggy.co/app/Services/Risk/EffectiveLimitsService.php`

## Admin Configurable Settings (Risk Configuration)

Admin page: `admin.spennypiggy.co` → `/risk/configuration`

All values are stored in `risk_settings` as JSON and applied at runtime.

### Global Limits (Hard Cap)

Purpose: platform “maximum” caps that apply across all states.

Keys:

- `max_spend_1h`, `max_spend_24h`, `max_spend_7d`
- `max_creators_per_day`
- `guest_allowed`

### State Limits (NORMAL/CAUTION/THROTTLE/FREEZE)

Purpose: per-state limits; effective limits are the min(state limit, global limit).

Keys per state:

- spend caps (1h/24h/7d)
- guest allowed
- cooldown minutes
- step-up threshold
- review-hold threshold
- max new creators (24h)

### Supporter Rules

Purpose: velocity rules + high-value triggers.

- Velocity window (currently rollup window is fixed 10 minutes)
- STEP\_UP count threshold
- COOLDOWN count threshold
- Single transaction STEP\_UP threshold

### Creator Rules

Purpose: protect very new creators.

- New creator age in days
- New creator daily volume cap

### High Velocity Spend Rules

Purpose: 2-hour high-spend patterns.

- 2h STEP\_UP threshold
- 2h REVIEW\_HOLD threshold
- force 3DS toggle

### Cross Creator Rules

Purpose: prevent “whale hopping”.

- 48h spend trigger
- min creators paid in 48h
- restriction duration hours

### Platform State Triggers

Purpose: automatic CAUTION/THROTTLE/FREEZE rules.

- daily GMV multipliers
- weekly GMV multiplier
- platform dispute rate freeze threshold
- creator dispute cluster threshold + count

## Payment Entry Points (Where Risk Engine Is Applied)

### Cart Checkout (supporter checkout)

- Controller: `spennypiggy.co/app/Http/Controllers/Auth/CheckoutController.php`
- Risk evaluation happens before creating Stripe Checkout Session.
- Ledger entry is recorded with `stripe_session_id`.

### Tip Jar Support

- Controller: `spennypiggy.co/app/Http/Controllers/Auth/StripeController.php` (`tipToJar`)
- Risk evaluation is performed before Stripe.
- STEP\_UP (OTP + CONFIRM) is supported.
- Ledger entry recorded with `stripe_session_id`.

### Webhook mapping (Checkout Session → ledger)

- Controller: `spennypiggy.co/app/Http/Controllers/StripeWebhookController.php`
- On `checkout.session.completed`, it maps the Stripe session id to the ledger payment and sets status (keeps `review_hold` if flagged).

## Friendly Payment Block Messages

Problem solved: generic “creator temporarily unavailable” made it hard to debug and confused users.

Now the user sees a friendly, specific reason for common blocks:

- Creator subscription inactive (“Wishlist plan not active”)
- Creator needs to update content (“temporarily unavailable while updating page”)
- Account status issue (“account status issue”)

Mapper service: `spennypiggy.co/app/Services/CreatorAvailabilityMessageService.php`

## Stripe Webhooks: Idempotency + Processing Safety

Webhook table: `stripe_webhook_status`

Behavior:

- If event already processed → ignore
- If processing recently → ignore
- If failed/stale → retry allowed
- After successful handling → mark processed with timestamp

Main code: `spennypiggy.co/app/Http/Controllers/StripeWebhookController.php`

## Early Fraud Warnings (EFW)

When Stripe sends `early_fraud_warning.created`:

- Record `early_fraud_warnings` row
- Link to ledger payment (if possible)
- Add audit log entry
- Notify creator with refund recommendation

Main code: `spennypiggy.co/app/Http/Controllers/StripeWebhookController.php` (`handleEarlyFraudWarningCreated`)

## Payout Engine (Friday Payouts)

Purpose:

- Pay creators safely after applying reserve % and payout delays
- Exclude review holds
- Subtract refunds/disputes
- Carry negative balances forward

Key tables:

- `payout_runs` (preview + executed)
- `creator_metrics` includes: `reserve_percent`, `payout_delay_days`, `negative_balance_minor`
- `payments` ledger uses `payout_run_id` to mark accounted entries

Main service:

- `spennypiggy.co/app/Services/Risk/PayoutService.php`

Admin controls:

- Admin dashboard buttons under `/risk` (Preview / Execute)
- Admin endpoints in `admin.spennypiggy.co/app/Http/Controllers/Admin/RiskController.php`

## Audit Pack Export (ZIP)

Purpose: one click generates a ZIP containing CSVs for audits (Stripe review / compliance).

Admin endpoint:

- `admin.spennypiggy.co` → `/risk/export/audit-pack`

Includes CSVs:

- disputes, refunds, platform states
- confirmation logs
- creator metrics
- top identities by spend
- webhook logs (if table exists)
- platform summary

## Spend Visibility for Gifter

On `/history` (support history), gifters can see:

- last 1 hour spend
- last 24 hours spend
- last 7 days spend
- their current limits

Display currency behavior:

- uses selected currency cookie when available
- conversion uses Currency rates and ISOdigits rounding (same approach as finance)

## Currency & Earnings Correctness

Fixes applied:

- Finance dashboard summary now uses correct columns:
  - gross income = `gross_amount`
  - net income = `net_amount`
- Summary conversion uses Currency ISOdigits rounding (consistent with finance/tax conversion style).
- Finance uses the selected display currency cookie when set.

Main code:

- `spennypiggy.co/app/Services/FinancialService.php`
- `spennypiggy.co/app/Http/Controllers/CreatorFinancialController.php`

## Operational Commands

- Risk go-live checks:
  - `php artisan risk:go-live-check`
- Simulate repeated risk decisions (no Stripe calls):
  - `php artisan risk:simulate-payments --creator=<uuid> --amount=1000 --count=5 --device=device-1 --email=a@b.com`

## Admin Dashboard Enhancements

Risk dashboard (`admin.spennypiggy.co` → `/risk`) now includes:

- Summary cards (GMV, dispute rate, review-hold, exposure estimate, cooldown identities)
- Action Queue (disputes + EFWs)
- Payout preview/execute controls
- Audit pack download

## Known Constraints / Notes

- Velocity “window minutes” is displayed in admin settings, but current rollup window uses a fixed 10 minutes field (`payment_count_10m`). Making the window fully dynamic requires rollup schema changes.
- Currency conversion uses GBP as a base currency using stored `conversion_rate` fields.

