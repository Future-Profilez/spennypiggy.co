# Subscription Bugs & Fixes — Creator Platform Subscription

## Overview

The creator platform subscription (`MonthlyCharge`) had multiple bugs causing:
- Creators losing access immediately on cancellation (instead of keeping access till period end)
- Creators unable to re-subscribe after cancellation
- Misleading/unhelpful error messages
- DB state going out of sync with Stripe silently

---

## Bug 1 — Status Typo: `'cancelled'` vs `'canceled'`

**File:** `app/Http/Controllers/StripeWebhookController.php` → `processMandatorySubscription()`

**Problem:**  
When `customer.subscription.deleted` fired, the handler set status to `'cancelled'` (double-L).  
But `User::getSubscriptionStatusAttribute()` checks `'canceled'` (single-L, matching Stripe's spelling).

**Effect:**  
- Status `'cancelled'` is not in the accessor's "still active" list  
- Creator loses website access **immediately** on deletion — even though they paid for the rest of the billing period  
- User.php line 205 treats `'canceled'` as ACTIVE (access until end date) but `'cancelled'` returns EXPIRED

**Fix:**  
Changed `'cancelled'` → `'canceled'` in `processMandatorySubscription()`.  
Also: `is_subscribed = 0` is now only set if the billing period has also ended (not immediately).

---

## Bug 2 — `cancel_at_period_end` Not Handled

**File:** `app/Http/Controllers/StripeWebhookController.php` → `processMandatorySubscription()`

**Problem:**  
When a subscription is cancelled "at period end" from the Stripe dashboard (most common admin action), Stripe fires `customer.subscription.updated` with `cancel_at_period_end = true` — but the local `MonthlyCharge` record was never updated to reflect the scheduled cancellation.

**Effect:**  
- `getActiveSubscriptionByCustomer()` returns the subscription (Stripe still shows status = `active`)  
- `syncUserSubscription()` keeps local status as `paid`/`active`  
- Creator tries to re-subscribe → `$stripeSub` is non-null → blocked with "You already have an active subscription"  
- Creator is confused: Stripe/website says "cancels on [date]" but can't create a new subscription

**Fix:**  
Added a block in `processMandatorySubscription()` that triggers when `cancel_at_period_end = true`:
- Sets `status = 'canceled'`, clears `upcoming_payment`, sets `cancelled_at`
- Added guard in STATUS UPDATE section to prevent overwriting `'canceled'` back to `'active'` on subsequent webhook calls when `cancel_at_period_end` is still true

---

## Bug 3 — Re-subscription Logic Too Blunt

**File:** `app/Http/Controllers/Auth/StripeController.php` → `initiateMandatorySubscription()`

**Problem:**  
The original check was:
```php
if ($user->subscription_status >= 1 && $stripeSub) {
    return redirect()->with('success', 'You already have an active subscription.');
}
```
This handled only one case and showed the same generic message for all scenarios.

**Effect:**  
Multiple sub-cases were either unhandled or gave the wrong response:
- Cancel-at-period-end: blocked with unhelpful message (no end date shown)
- Stripe has no subscription but local DB says active (webhook missed): would fall through incorrectly
- Local `'canceled'` record still in paid window: no check, creator could create a double subscription

**Fix:**  
Replaced the single check with granular case handling:

| Scenario | New Behavior |
|---|---|
| `$stripeSub` exists + `cancel_at_period_end = true` | "Your subscription is active until [date]. You can renew after that date." |
| `$stripeSub` exists + fully active | "You already have an active subscription." (unchanged) |
| `$stripeSub` is null + local `'canceled'` with future end date | "Your subscription is active until [date]. You can renew after that date." |
| `$stripeSub` is null + local `paid`/`active` with future end date (webhook missed) | Auto-mark local record as `'canceled'`, allow re-subscription |
| No active record anywhere | Allow re-subscription (normal flow) |

---

## Bug 4 — Empty `customerSubscriptionDeleted()` (Dead Code)

**File:** `app/Http/Controllers/StripeWebhookController.php` → `customerSubscriptionDeleted()`

**Problem:**  
The `customerSubscriptionDeleted()` method at line ~2294 was empty (just a log statement). The actual logic lived in `processMandatorySubscription()` which is also called for the same event. The empty method was dead code and misleading.

**Fix:**  
Added a comment clarifying that `processMandatorySubscription()` handles MonthlyCharge and that this method can be extended for other subscription types (WishItem, Bill, Membership).

---

## All Cases Covered

| Who cancels | How | Stripe event | DB result | Re-subscription |
|---|---|---|---|---|
| User | Via website (own flow) | `subscription.deleted` | `canceled` + access till period end | Allowed after period ends |
| User/Admin | Stripe dashboard → cancel immediately | `subscription.deleted` | `canceled` + access till period end | Allowed after period ends |
| User/Admin | Stripe dashboard → cancel at period end | `subscription.updated` (cancel_at_period_end=true) | `canceled` + access till period end | Allowed after period ends |
| Any | Webhook missed/failed | — | DB stale (paid/active but Stripe has nothing) | `syncUserSubscription` cleans up, allows re-sub |
| Any | DB not updated but Stripe active | — | Synced on re-sub attempt | Blocked (correctly) |
