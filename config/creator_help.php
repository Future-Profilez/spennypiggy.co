<?php

/**
 * 🚨 MIRRORED IN BOTH APPS — keep spennypiggy.co/config/creator_help.php and
 * admin.spennypiggy.co/config/creator_help.php IDENTICAL (the `fee_profiles`
 * rule). Both apps OPEN tickets from this list (the website from webhooks and
 * creator buttons, the admin app from refusals and suspensions), and both
 * render the code's title back to the creator and the reviewer.
 *
 * WHAT THIS IS (client decision, 7 Sep 2026). Every "contact support" on the
 * platform was a `mailto:` — a dead end for a creator inside the installed app,
 * and a conversation the back office could not see. A help ticket is the SAME
 * `support_tickets` row the supporter↔creator flow uses, with `type = help`,
 * `supporter_id = NULL`, the first message from SUPPORT, and two statuses of
 * its own: `open` (the creator may reply) and `awaiting_admin` (they did).
 *
 * Three tiers:
 *   1 — opened AUTOMATICALLY when the platform takes a decision the creator
 *       cannot fix alone and will object to: a declined consent screen, a
 *       fraud-flagged ID check, an identity refusal (the admin's own written
 *       reason IS the first message), a policy suspension.
 *   2 — opened BY THE CREATOR from a "Get help with this" button on every
 *       former dead end, with the item attached (`source`/`source_id`).
 *   3 — an AUTOMATIC first reply on the money questions the Help Centre can
 *       answer (reserve, payout dates). Clearly marked automatic; never closes
 *       the ticket; a person still reads it.
 */
return [

    /** Master switch. Off = `openFor()` returns null and writes nothing. */
    'enabled' => (bool) env('CREATOR_HELP_TICKETS_ENABLED', true),

    /** `support_tickets.type` for a help conversation. */
    'type' => 'help',

    /** Statuses. `open` = creator may reply; `awaiting_admin` = they did. */
    'status_open' => 'open',
    'status_awaiting_admin' => 'awaiting_admin',

    /**
     * 🚨 AUTO-OPENED TICKETS PER DAY, PLATFORM-WIDE. A webhook loop or a bad
     * deploy must not open a thousand conversations overnight. Past the cap the
     * opener logs at ERROR (Sentry) and opens nothing. Creator-opened (tier 2)
     * tickets are NOT capped — a person pressed a button.
     */
    'daily_cap' => (int) env('CREATOR_HELP_DAILY_CAP', 10),

    /**
     * code => [tier, title (the ticket's `reason`), opening (first message from
     * SUPPORT — a tier-1 opener may pass its own, e.g. the admin's refusal note)]
     *
     * ⚠️ Content-first copy: no gift/tip/donation/bill wording. Every opening
     * says what happened and what happens next; none promises a turnaround.
     */
    'codes' => [
        'consent_declined' => [
            'tier' => 1,
            'title' => 'Your ID check — the consent screen',
            'opening' => 'You stopped at the screen where Stripe asks permission to check your ID. That is a fair place to pause, so we opened this conversation to answer any question you have about it. Your passport photo and selfie go to Stripe and are never stored by Spenny Piggy; the consent covers Stripe matching the two. Reply here and a person will pick it up.',
        ],
        'fraud_suspected' => [
            'tier' => 1,
            'title' => 'Your ID check needs a person to look at it',
            'opening' => 'Your identity check did not pass our security review, and that is not something trying again can change. A member of our team will look at it with you here. If you believe this is a mistake, tell us in a reply — anything that helps us understand what happened is useful.',
        ],
        'identity_mismatch' => [
            'tier' => 1,
            'title' => 'Your ID check was not approved',
            // The admin's own written reason is passed in as the opening.
            'opening' => 'Our team reviewed your identity check and could not approve it. The reason is above. Reply here with anything you would like us to know, or once you have made the change it asks for.',
        ],
        'policy_suspension' => [
            'tier' => 1,
            'title' => 'Your account has been suspended',
            'opening' => 'Your account has been suspended following a review by our team. We opened this conversation so you can ask about it or tell us anything we should know. A person will read your reply.',
        ],

        'identity_help' => [
            'tier' => 2,
            'title' => 'Help with my identity check',
            'opening' => 'You asked for help with your identity check. Tell us what you are seeing and a person will pick it up here.',
        ],
        'moderation_hold' => [
            'tier' => 2,
            'title' => 'Help with a listing under review',
            'opening' => 'You asked about a listing that is under review. It is attached to this conversation. Tell us what you would like checked and a person will pick it up.',
        ],
        'rejected_assets' => [
            'tier' => 2,
            'title' => 'Help with my rejected profile',
            'opening' => 'You asked about your profile review. Tell us what you would like clarified about the reason you were given, and a person will pick it up here.',
        ],
        'blocked_payment' => [
            'tier' => 2,
            'title' => 'Help with a blocked payment',
            'opening' => 'You asked about a payment that was turned away. Tell us what you know about it and a person will look into it here.',
        ],
        'cadence_pause' => [
            'tier' => 2,
            'title' => 'Help with paused subscriptions',
            'opening' => 'You asked about your paused recurring subscriptions. They resume automatically once the posting threshold is met — if something about that does not add up, tell us here.',
        ],
        'high_value_listing' => [
            'tier' => 2,
            'title' => 'Help with a high-value listing review',
            'opening' => 'You asked about a listing that is held for an enhanced review because of its price. It is attached to this conversation. Tell us anything that helps and a person will pick it up.',
        ],
        'suspension' => [
            'tier' => 2,
            'title' => 'Help with my limited or suspended account',
            'opening' => 'You asked for help with your account state. Tell us what you would like reviewed and a person will pick it up here.',
        ],
        'general' => [
            'tier' => 2,
            'title' => 'Help from the Spenny Piggy team',
            'opening' => 'You asked for help. Tell us what is happening and a person will pick it up here.',
        ],
    ],

    /**
     * Tier 3 — an AUTOMATIC first reply on a creator's message, keyed on words
     * the Help Centre already answers. Appended as a SUPPORT message prefixed
     * with `auto_reply_prefix`; the ticket still moves to `awaiting_admin`.
     *
     * Each entry: `match` (any of these words, case-insensitive) => `reply`.
     * `{payout_wait}` and `{reserve_days}` are substituted by the opener.
     */
    'auto_reply_prefix' => 'Automatic reply — a person will still read your message. ',
    'auto_replies' => [
        'reserve' => [
            'match' => ['reserve', 'held', 'on hold', 'holding my money', 'withheld'],
            'reply' => 'A reserve is a small part of each sale held back for {reserve_days} days from the date of that sale, then paid out on its own. It is taken from your net amount, never from what the supporter paid, and it is released automatically — nothing to request.',
        ],
        'payout_timing' => [
            'match' => ['payout', 'when will i get paid', 'when do i get paid', 'not been paid', 'paid out', 'payment date'],
            'reply' => 'Payouts cover a fixed Friday-to-Thursday week and go out on the Friday after the following week, so a sale waits {payout_wait} before it is sent. Your earnings dashboard shows the exact week each payout covers.',
        ],
    ],
];
