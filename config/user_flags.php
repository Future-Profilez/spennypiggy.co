<?php

/*
 * Admin flags — "somebody should look at this account".
 *
 * 🚨 A FLAG BLOCKS NOTHING. It does not stop a payout, a login, a purchase or a
 * listing. It is a visibility device: the platform noticed something and an
 * admin decides what, if anything, to do about it. Suspension stays a human
 * action taken from the user's own page. Anything here that starts gating
 * behaviour has become a risk control wearing a flag's name, and belongs in
 * app/Services/Risk instead.
 *
 * ⚠️ MIRROR THIS FILE IN admin.spennypiggy.co. The two apps share one database:
 * the website raises flags and the admin app reads and resolves them, so a type
 * or severity present in one and not the other renders as an unlabelled row in
 * the back office.
 *
 * ⚠️ Config is cached on deploy. A change here lands on the next deploy.
 */

return [

    /*
     * Master switch. Off = nothing is raised and nothing new appears in the back
     * office. Existing rows are NOT deleted and the admin screens keep working,
     * so switching back on resumes rather than restarts.
     */
    'enabled' => true,

    /*
     * Which security_events rows become a flag.
     *
     * 🚨 SEVERITY IS THE FILTER, NOT THE TYPE ALONE. `content_download` is
     * written on EVERY paid download and `login_failed` on every wrong password —
     * both at `info`. Only the burst rows carry `warning`/`critical`, and
     * PayoutDestinationAudit deliberately records a creator's FIRST bank
     * connection at `info` because there was nothing to redirect money away
     * from. So `UserFlagger::fromSecurityEvent` ignores `info` outright, and this
     * map never has to list the noisy half of a pair.
     */
    'security_event_types' => [
        'payout_destination_change' => 'payout_destination_change',
        'account_email_change' => 'account_email_change',
        'login_failed_burst' => 'login_failed_burst',
        'login_lockout' => 'login_lockout',
        'otp_failed_burst' => 'otp_failed_burst',
        'content_download_burst' => 'content_download_burst',
    ],

    /*
     * Every flag type the platform can raise, with the severity it raises at.
     *
     * `critical` is reserved for things that move money or change where money
     * goes. A creator's bank details changing is critical; five failed logins is
     * not, however annoying. If everything is critical the colour stops meaning
     * anything and the list stops being read — which is the actual failure mode
     * of a system like this.
     */
    'types' => [
        'payout_schedule_reverted' => [
            'severity' => 'critical',
            'label' => 'Payout schedule left manual',
            'description' => 'Stripe was paying this creator automatically. Their whole available balance, held reserves included, can be swept to their bank before our own payout run sees it.',
        ],
        'payout_destination_change' => [
            'severity' => 'critical',
            'label' => 'Payout destination changed',
            'description' => 'The Stripe account or bank account money is paid into was changed.',
        ],
        'refund_volume' => [
            'severity' => 'critical',
            'label' => 'Unusual refund volume',
            'description' => 'Refunds on this account are above the risk engine threshold.',
        ],
        'account_email_change' => [
            'severity' => 'warning',
            'label' => 'Account email changed',
            'description' => 'The address that receives receipts and password resets was changed.',
        ],
        'login_failed_burst' => [
            'severity' => 'warning',
            'label' => 'Repeated failed logins',
            'description' => 'Several sign-in attempts failed in a short window.',
        ],
        'login_lockout' => [
            'severity' => 'warning',
            'label' => 'Account locked out',
            'description' => 'The rate limiter locked this account out after repeated failures.',
        ],
        'otp_failed_burst' => [
            'severity' => 'warning',
            'label' => 'Repeated OTP failures',
            'description' => 'Several one-time codes were entered incorrectly.',
        ],
        'content_download_burst' => [
            'severity' => 'warning',
            'label' => 'Bulk content downloads',
            'description' => 'This account downloaded an unusual number of paid files in one window.',
        ],
        'risk_level_high' => [
            'severity' => 'warning',
            // ⚠️ The risk engine has NO numeric score — `creator_metrics.risk_level`
            // is a word (low/medium/high). Do not write a threshold against a
            // number that does not exist.
            'label' => 'Risk level raised',
            'description' => 'The risk engine moved this creator to a high risk level and applied a rolling reserve.',
        ],
        'moderation_repeat' => [
            'severity' => 'warning',
            'label' => 'Repeated moderation holds',
            'description' => 'Several listings from this creator were held by the media scan.',
        ],
        'blocked_payment_repeat' => [
            'severity' => 'warning',
            'label' => 'Repeated blocked payments',
            // ⚠️ THIS IS ABOUT THE SELLER, NOT THE BUYER. `blocked_payment_attempts`
            // stores no payer at all — `creator_id` is the person being bought FROM.
            // Getting this sentence the wrong way round is exactly the fault that
            // sent an investigation at a supporter who had done nothing (29 Aug 2026).
            'description' => 'Supporters tried to buy from this creator and were turned away repeatedly — they currently cannot sell.',
        ],
        'manual' => [
            'severity' => 'warning',
            'label' => 'Flagged by an admin',
            'description' => 'Raised by hand from the back office.',
        ],
    ],

    /*
     * Thresholds for the flags the platform counts for itself rather than
     * reading off an existing alert. Deliberately mean: a flag that fires on the
     * first occurrence of an ordinary thing trains admins to ignore the list.
     */
    'thresholds' => [
        // Held listings (pot / shop / task) from one creator inside the window.
        'moderation_repeat_count' => 3,
        'moderation_repeat_days' => 30,

        // Refused purchase attempts from one account inside the window.
        'blocked_payment_repeat_count' => 5,
        'blocked_payment_repeat_hours' => 24,

        // Which risk_level values raise a flag. `medium` is deliberately absent:
        // it is a routine reserve adjustment, and flagging it would put most of
        // the creator base on the list.
        'risk_levels_flagged' => ['high'],
    ],

    /*
     * How long an open flag of the same type absorbs repeats instead of opening
     * a second row. Inside the window the existing row's `occurrences` and
     * `last_seen_at` move; outside it, a new row opens.
     *
     * ⚠️ This is NOT a cooldown on noticing — every occurrence still increments
     * the count. It only decides whether the admin sees one row saying "12 times"
     * or twelve rows.
     */
    'dedupe_days' => 30,
];
