# Payout Control & Risk System — Issues & Fixes Report

**Date:** 2026-04-28  
**Reviewed Against:** `PAYOUT_CONTROL_AND_RISK_IMPLEMENTATION.md`

---

## ISSUE #1 — CRITICAL: CheckSuspendedUser Middleware Not Registered

**Severity:** 🔴 CRITICAL  
**Status:** ✅ FIXED

### Problem
`CheckSuspendedUser` middleware exist karta tha lekin `app/Http/Kernel.php` mein register nahi tha aur kisi bhi route par apply nahi tha.

**Impact:**
- Suspended creators platform access kar sakte the
- `StripeWebhookController` `suspended_account = 1` set karta tha but middleware kabhi execute nahi hota tha
- Poora suspension/lock system logically broken tha — detection kaam karta tha, blocking nahi karta tha

### Fix Applied

**File 1: `app/Http/Kernel.php`**

1. `middlewareAliases` mein alias register kiya:
```php
'check.suspended' => \App\Http\Middleware\CheckSuspendedUser::class,
```

2. `web` middleware group mein globally add kiya (safe hai kyunki middleware internally `Auth::check()` guard use karta hai — unauthenticated users unaffected):
```php
'web' => [
    // ... existing middleware
    \App\Http\Middleware\IpTracker::class,
    \App\Http\Middleware\CheckSuspendedUser::class,  // ← ADDED
],
```

**Why web group:** Har `auth`-guarded route mein alag-alag add karne ke bajaye, web group mein ek baar add kiya. Middleware already `Auth::check()` se guard hai toh guest users pe koi effect nahi.

---

## ISSUE #2 — MEDIUM: Unauthorized Payout & Schedule Manipulation — HIGH RISK Label Update Nahi Hota

**Severity:** 🟡 MEDIUM  
**Status:** ✅ FIXED

### Problem
Jab bhi koi unauthorized payout detect hota ya payout schedule manipulate hota, code sirf `suspended_account = 1` set karta tha. `creator_metrics` table mein `risk_level` aur `reserve_percent` update nahi hota tha.

**Impact:**
- Admin dashboard par creator HIGH RISK bucket mein nahi dikhta tha
- Reserve percentage automatically nahi badhta tha
- Risk-based logic correctly trigger nahi hota tha

### Fix Applied

**File: `app/Http/Controllers/StripeWebhookController.php`**

Fix dono jagah apply kiya — `handleAccountUpdated()` aur `handlePayoutEvent()` dono mein:

```php
// Mark as HIGH RISK with minimum 20% reserve
$metrics = $creator->creatorMetric;
if ($metrics) {
    $metrics->risk_level = 'high';
    $metrics->reserve_percent = max((int) $metrics->reserve_percent, 20);
    $metrics->save();
}
```

**Logic:** `max()` ensure karta hai ki agar creator pehle se 25% reserve par hai toh woh kam nahi hoga — sirf 20% se neeche nahi jayega.

---

## ISSUE #3 — LOW: Doc vs Code Mismatch (HIGH RISK Label)

**Severity:** 🟢 LOW  
**Status:** ✅ RESOLVED (Issue #2 Fix se automatically resolve)

### Problem
`PAYOUT_CONTROL_AND_RISK_IMPLEMENTATION.md` Section 4 mein likha tha:
> *"The creator is marked as HIGH RISK and the account is locked immediately."*

Lekin code sirf `suspended_account = 1` set karta tha — HIGH RISK marking missing thi.

### Resolution
Issue #2 fix karne ke baad yeh mismatch resolve ho gaya. Doc aur code ab dono consistent hain.

---

## Summary Table

| # | Issue | Severity | File(s) | Status |
|---|-------|----------|---------|--------|
| 1 | `CheckSuspendedUser` middleware registered nahi tha | 🔴 CRITICAL | `app/Http/Kernel.php` | ✅ Fixed |
| 2 | Unauthorized payout par `risk_level` update nahi hota tha | 🟡 MEDIUM | `StripeWebhookController.php` | ✅ Fixed |
| 3 | Doc vs Code mismatch — HIGH RISK label | 🟢 LOW | Doc only | ✅ Resolved via #2 |

---

## Files Changed

| File | Change |
|------|--------|
| `app/Http/Kernel.php` | `check.suspended` alias added + middleware added to `web` group |
| `app/Http/Controllers/StripeWebhookController.php` | `handleAccountUpdated()` + `handlePayoutEvent()` mein HIGH RISK + reserve update logic added |
