# Stripe Connect Payout Control & Risk Mitigation - Implementation Document

## 1. Objective & Core Architecture
The system is designed to maintain **Direct Charges** (where the creator is the Merchant of Record and funds land directly in their Stripe Connected Account balance) while strictly enforcing **platform-controlled payouts and rolling reserves**. 
We do not hold funds on the platform's main Stripe account. Instead, reserves are enforced at the **payout level**.

## 2. Payment Flow
1. **Supporter Pays:** Funds are transferred directly to the Creator's Stripe Connected Account (Express).
2. **Stripe Balance:** The money sits in the creator's Stripe balance.
3. **No Auto-Payouts:** Stripe is prevented from automatically sending these funds to the creator's bank.

## 3. Payout Schedule Enforcement (The Lock)
Since Stripe Express creators might access their dashboard and attempt to change their payout schedule to "automatic":
- **Programmatic Enforcement:** A scheduled cron job (`app:enforce-manual-payouts`) runs every **10 minutes**.
- **Action:** It iterates through active connected accounts and uses the Stripe API to force `settings[payouts][schedule][interval] = 'manual'`.
- **Code Reference:** `App\Console\Commands\EnforceManualPayouts`, `App\StripeControl::ensureManualPayoutSchedule()`.

## 4. Real-Time Webhook Monitoring (Risk Detection & Auto-Lock)
If a creator manages to change their payout schedule or manually triggers a payout from their Stripe dashboard, the platform reacts instantly via webhooks:
- **`account.updated`:** If the webhook detects the payout schedule is no longer `manual`, the system:
  1. Immediately locks the creator's SpennyPiggy account (`suspended_account = 1`).
  2. Reverts the Stripe setting back to `manual`.
- **`payout.created` / `payout.paid`:** The system checks if the payout was initiated by the SpennyPiggy backend (via metadata). If an unexpected payout is detected:
  1. The creator is marked as HIGH RISK and the account is locked immediately.
- **Code Reference:** `App\Http\Controllers\StripeWebhookController` (`handleAccountUpdated`, `handlePayoutEvent`).

## 5. Creator Restrictions (When Suspended)
Once a creator is auto-locked due to payout manipulation or risk policies:
- **Login/Access Blocked:** Middleware (`CheckSuspendedUser`) and Auth controllers block access.
- **New Payments Blocked:** Their profile and checkout links are disabled.
- **Message Shown:** *"Your account has been suspended due to a policy violation or payout configuration issue. Please contact support."*

## 6. The Payout Engine (Friday Runs)
Every Friday, the platform executes the payout run for all eligible creators:
- **Calculation:** 
  `Available Balance = Total Stripe Balance - Reserved Funds (e.g., 10%) - Review Holds`
- **Execution:** The backend triggers a manual Stripe Payout (`StripeControl::createPayout`) for **only** the `Available Balance`.
- **Reserve Handling:** The 10% reserve remains safely in the creator's Stripe balance.
- **Auto-Release:** After the configured period (e.g., 30 days), the reserved funds are marked as released and are automatically included in the next Friday's `Available Balance`.
- **Code Reference:** `App\Services\Risk\PayoutService`.

## 7. Dashboards & Transparency
### Creator Dashboard (`/financial/dashboard`)
- Creators see their **Gross Earnings**, **Net Earnings**, and exactly how much is in **Held Reserves** or **Review Holds**.
- They see a breakdown: *"Held from [Date] - Releases on [Date] (X days remaining)"*.
- Messaging explains: *"A small portion of your earnings is temporarily reserved for 30 days to ensure payment security. These funds are automatically released to your available balance."*

### Admin Dashboard (`/admin/risk`)
- Admins can view all creators sorted by Risk Level (High, Medium, Low).
- Admins can monitor Dispute Rates, Refund Rates, and current Reserve Percentages.
- Action queues alert admins if a creator's risk level changes or if an account was auto-locked.
- Admins can manually override risk levels (e.g., set to Low and 0% reserve) with a single click.

## Summary
By combining **10-minute Cron Enforcements**, **Real-time Webhook Auto-Locks**, and **Friday Payout Calculations**, the platform successfully simulates a strict rolling reserve system on top of a Direct Charge / Stripe Express architecture without taking on the compliance burden of holding funds on the platform.