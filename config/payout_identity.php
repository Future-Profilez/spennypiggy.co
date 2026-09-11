<?php

/*
|--------------------------------------------------------------------------
| Identity as a payout gate
|--------------------------------------------------------------------------
|
| 🚨 IDENTITY IS NOT AN ONBOARDING STEP (10 Sep 2026, client direction). A creator
| signs up, builds, publishes and sells with no ID check at all. The check is asked
| for at the PAYOUT gate: they cannot be PAID until it passes and an admin signs it
| off. Nothing about listing, selling or the journey reads this file.
|
| 🚨 MIRRORED IN THE ADMIN APP, AND THE EARLIER NOTE HERE SAYING NOT TO WAS WRONG.
| This file used to claim "the admin app has no payout runner". It has FIVE: its own
| copy of Risk\PayoutService (two buttons — finance and risk dashboards), the Founder
| bonus trigger, manual reserve release, and a Fast Start command. Found by audit on
| 11 Sep 2026 — every one of them paid an identity-blocked creator in full, including
| one an admin had explicitly refused. `enabled` and `grandfather_verified_before` are
| read by both apps' `App\Support\PayoutEligibility`; keep the two files identical
| (the `fee_profiles` rule). The reminder keys are inert in the admin app and travel
| with the file so a diff is a diff.
|
*/

return [

    /*
     | Master switch. Off = identity never blocks a payout and every state the payout
     | page can render collapses to "complete".
     |
     | 🚨 OFF IS NOT A SAFE DEFAULT AND IS NOT A LAUNCH POSITION. It exists so a
     | production incident (a Stripe Identity outage, a sign-off queue nobody can
     | reach) can be answered in one config change rather than by paying everybody
     | through a code deploy. ⚠️ Config is cached on deploy, so a change lands on the
     | next deploy — this is not a runtime kill switch.
     */
    'enabled' => env('PAYOUT_IDENTITY_GATE', true),

    /*
     | 🚨 THE GRANDFATHER WINDOW, AND WHY IT HAS TO EXIST.
     |
     | Until 4 Sep 2026 a Stripe pass auto-wrote `identity_admin_status = 1`, so every
     | creator verified before then already carries a sign-off. On 4 Sep that stopped
     | (a person has to look, because Stripe checks the DOCUMENT and not the PERSON) —
     | which means every creator verified BETWEEN then and this change shipping is
     | sitting at admin-pending through no fault of their own.
     |
     | Turning identity into a money gate without this date would stop those creators
     | being paid on the next Friday run, for a queue they were never told about.
     |
     | A creator verified before this timestamp passes on `identity_status` alone.
     |
     | 🚨 THIS IS A BOUNDED, SHRINKING SET AND IT IS MEANT TO GO. Run
     | `php artisan identity:signoff-backlog` to list exactly who is relying on it;
     | once an admin has worked that queue, set this to null and the gate is whole.
     | Leaving it set for ever means a window of creators nobody ever checked.
     |
     | null = no grandfathering, everybody needs a real sign-off.
     */
    'grandfather_verified_before' => env('PAYOUT_IDENTITY_GRANDFATHER_BEFORE', '2026-09-11 00:00:00'),

    /*
     | Reminder ladder for a creator holding money they cannot receive, in days since
     | their first settled earning. Bell + email, transactional.
     |
     | ⚠️ Deliberately slow. The payout page already tells them every time they open it;
     | this is for the creator who is not looking. First one is a week in, not day one —
     | a sale on Monday and a "verify your identity" mail on Tuesday reads as a demand
     | rather than a prompt.
     */
    'reminder_days' => [7, 30, 60, 90],

    /*
     | Master switch for those reminders only. Off = the payout page still tells them,
     | nothing is sent. The gate itself is unaffected.
     */
    'reminders_enabled' => env('PAYOUT_IDENTITY_REMINDERS', true),

];
