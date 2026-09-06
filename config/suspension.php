<?php

/**
 * What a suspended account can still do, and what it is told.
 *
 * 🚨 MIRRORED IN admin.spennypiggy.co/config/suspension.php AND MUST STAY
 * IDENTICAL for the `reasons` block — the admin picks the code, the website
 * renders the copy, and a code the website does not know renders the fallback
 * sentence instead of the reason the admin actually chose.
 *
 * ⚠️ The `note` an admin types is deliberately absent from every creator-facing
 * surface. It is a case file written for other admins; a suspended account
 * holder reading "suspected card testing, watch for re-registration" is told
 * more about our detection than about what they should do next.
 */
return [

    /**
     * Reason code => creator-facing copy.
     *
     * `title` is the banner headline, `body` the sentence under it. Neither may
     * promise an outcome ("this will be reviewed within 24h") — nothing in the
     * code enforces a turnaround, and a promise the platform breaks is worse
     * than no promise.
     *
     * 🚨 `tone` DECIDES THE WORD AND THE COLOUR, AND IT IS NOT DECORATION.
     * "Suspended" is what we say when a person judged the account — a policy
     * breach, disputed payments, suspected fraud. An unpaid subscription, an
     * unfinished ID check or a broken payout setup are **not** misconduct, and
     * calling them a suspension tells a creator they have done something wrong
     * when they have only left something undone. Those read
     * **"Account limited"**, in amber. Red on this platform means a person said
     * no (the same rule `ProfileSelfCheck` follows).
     *
     * 🚨 `action` IS THE WAY OUT, AND IT MUST BE A ROUTE THE ACCOUNT CAN ACTUALLY
     * REACH. A reason that names a fix without a route to it is the fault this
     * whole feature exists to close, twice over — see `allowed_write_routes`
     * below, which is what makes `mandatory.checkout` reachable for exactly this
     * one. Omit it and the banner falls back to Contact support, which is the
     * honest answer whenever the creator cannot fix it themselves.
     */
    'reasons' => [

        /*
         * ⚠️ THE ONLY REASON WITH A ROUTE OUT. Everything else here needs a
         * person; this one needs a card. `activate-subscription` is the page
         * that starts the platform-subscription checkout.
         */
        'subscription_unpaid' => [
            'title' => 'Your account is limited',
            'body' => 'Your Spenny Piggy subscription has not been paid, so your page is hidden and you cannot take payments. Renew it and everything comes straight back.',
            'tone' => 'limited',
            'action' => ['label' => 'Renew my subscription', 'route' => 'activate-subscription'],
            /*
             * 🚨 THE WRITE ROUTES THIS FIX ACTUALLY NEEDS, DECLARED.
             * `action` points at a PAGE (a GET), but paying happens through a
             * POST from that page — so the page being reachable proves nothing,
             * and dropping `mandatory.checkout` from `allowed_write_routes`
             * would silently restore the trap: a creator told to renew, sent to
             * a screen whose button is then refused. `suspension:doctor` fails
             * when anything named here is missing from the allowlist.
             */
            'requires' => ['mandatory.checkout'],
        ],

        'policy_violation' => [
            'title' => 'Your account is suspended',
            'body' => 'We suspended your account after a review of your content or activity against our Terms and Acceptable Use Policy. Contact support and our team will take you through it.',
            'tone' => 'suspended',
        ],

        'payment_risk' => [
            'title' => 'Your account is suspended',
            'body' => 'We suspended your account while we look into unusual payment activity. Contact support and our team will take you through it.',
            'tone' => 'suspended',
        ],

        'chargebacks' => [
            'title' => 'Your account is suspended',
            'body' => 'We suspended your account after a number of payments were disputed by supporters. Contact support and our team will take you through it.',
            'tone' => 'suspended',
        ],

        // Checks not finished is not misconduct — see the tone rule above.
        'identity' => [
            'title' => 'Your account is limited',
            'body' => 'We could not complete the identity checks we need before we can pay you, so your page is hidden and you cannot take payments. Contact support and our team will get the check finished with you.',
            'tone' => 'limited',
        ],

        /*
         * An admin looked at the ID check and did not accept it.
         *
         * 🚨 SEPARATE FROM `identity` ABOVE, AND THE DIFFERENCE IS THE ROUTE OUT.
         * That one means the check could not be completed and needs a person;
         * this one means a person HAS looked, so the creator has something
         * specific to do and can do it themselves. Collapsing the two would
         * send somebody who can fix their own account to Contact support.
         *
         * ⚠️ The admin's own words are NOT in this body — they are rendered
         * beneath it from `users.identity_verification_error`, because a stored
         * sentence cannot be reworded and a config body is the same for
         * everybody. Same split as `suspension_note` vs the reason code.
         */
        'identity_rejected' => [
            'title' => 'Your account is limited',
            'body' => 'We looked at your ID check and could not accept it, so your page is hidden and you cannot take payments. The note below says what we need. Once you have sorted it, run the check again and we will look straight away.',
            'tone' => 'limited',
            'action' => ['label' => 'Run the check again', 'route' => 'stripe.identity.verification'],
            /*
             * 🚨 `action` IS A PAGE (a GET); starting the check is a POST from
             * that page. Without this the banner tells the creator to run the
             * check and the middleware refuses the button — the "banner behind
             * a door nobody can open" fault, which this codebase has now shipped
             * three times. `suspension:doctor` fails if it is missing from
             * `allowed_write_routes`.
             */
            'requires' => ['stripe.identity.verify'],
        ],

        'payout_configuration' => [
            'title' => 'Your account is limited',
            'body' => 'There is a problem with your payout setup, so your page is hidden and you cannot take payments. Contact support and our team will get it sorted with you.',
            'tone' => 'limited',
        ],

        'terms_not_accepted' => [
            'title' => 'Your account is limited',
            'body' => 'Our updated Terms have not been accepted on this account, so your page is hidden and you cannot take payments. Contact support and our team will take you through it.',
            'tone' => 'limited',
        ],

        'admin_action' => [
            'title' => 'Your account is suspended',
            'body' => 'We suspended your account following a review by our team. Contact support and our team will take you through it.',
            'tone' => 'suspended',
        ],
    ],

    /**
     * Shown when the code is missing or unrecognised.
     *
     * 🚨 EVERY ACCOUNT SUSPENDED BEFORE THIS SHIPPED LANDS HERE — the column did
     * not exist, so there is no reason to read and none may be invented. It says
     * what is true (suspended, talk to support) and nothing more.
     */
    'default_reason' => [
        'title' => 'Your account is suspended',
        'body' => 'We suspended your account. Contact support and our team will take you through what happens next.',
        // ⚠️ The conservative tone on purpose: an unknown code might be either,
        // and softening a real suspension to "limited" understates it.
        'tone' => 'suspended',
    ],

    /**
     * State-changing route names a suspended account may still reach.
     *
     * 🚨 THIS IS AN ALLOWLIST AND THE ONLY REASON THE MIDDLEWARE IS SAFE. Reads
     * (GET/HEAD) stay open so somebody can see their own account and their own
     * history; every write is refused unless it is named here, so a route added
     * next month is closed without anyone remembering this file exists.
     *
     * ⚠️ Nothing that moves money, publishes content, or changes what the public
     * sees belongs in this list. Signing out, asking for help, and turning off
     * e-mail are the whole of it.
     */
    'allowed_write_routes' => [
        'logout',
        /*
         * 🚨 PAYING US IS ALWAYS PERMITTED, AND THAT IS NOT A LOOPHOLE.
         * `subscription_unpaid` tells the creator to renew, and without these
         * two the middleware refuses the very thing the message asks for —
         * the "banner behind a door nobody can open" fault, again.
         *
         * ⚠️ Allowed for EVERY suspended account, not just the billing one:
         * a per-reason allowlist is a second rule that will drift from the
         * first, and paying the platform unlocks nothing on its own — the
         * suspension gates are separate from subscription status, so a
         * policy-suspended creator who pays is still refused every sale. Only
         * `subscription_unpaid` INVITES them to; the others simply do not
         * trap somebody who goes looking.
         */
        'mandatory.checkout',
        'mandatory.resume',
        /*
         * 🚨 RUNNING THE ID CHECK AGAIN IS THE WAY OUT OF `identity_rejected`.
         * Same reasoning as the two above: the banner names this as the fix, so
         * refusing it would trap the one creator who can clear their own
         * restriction. It unlocks nothing on its own — Stripe still has to pass
         * and an admin still has to sign off.
         */
        'stripe.identity.verify',
        'support.tickets.store',
        'support.tickets.message',
        'support.tickets.resolve',
        'email.preferences.update',
        'email.preferences.manage.update',
        'email.unsubscribe',
        'get-notification',
        'mark-as-read',
        'delete-all-notifications',
        'accept-terms',
        /*
         * 🚨 ASKING FOR HELP IS NOT A WRITE THAT NEEDS STOPPING. Every reason
         * above says "contact support" — and the Help Centre is where a
         * restricted account goes to find out what that means. `help.ask` and
         * `help.feedback` are POSTs only because a question does not belong in
         * a URL: nothing is published, no money moves, nothing on a public page
         * changes (feedback is an aggregate counter). Refusing them put the
         * page that explains a suspension behind the suspension — a person
         * reading "contact support" got "we suspended your account" back the
         * moment they typed a question. Found live, 5 Sep 2026.
         */
        'help.ask',
        'help.feedback',
    ],

    /**
     * Sweep safety valve: most creators a single run will enforce.
     *
     * A bulk suspension (a fraud ring, a bad rule) must not turn into thousands
     * of Stripe calls in one command run. The remainder is picked up by the next
     * run five minutes later.
     */
    'enforce_batch' => 25,
];
