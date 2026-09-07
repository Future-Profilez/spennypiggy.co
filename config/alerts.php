<?php

/*
|--------------------------------------------------------------------------
| Internal alerts — THE ONE PLACE
|--------------------------------------------------------------------------
|
| Every email this platform sends to its OWN TEAM (never to a creator or a
| supporter) is controlled from here and from one admin screen:
|
|   1. WHO gets each alert  → admin panel, System -> Alert Routing (the
|      `alert_routes` table, shared by both apps). Edited live, no deploy.
|   2. Master switch        → ALERTS_ENABLED in .env (per host).
|   3. Emergency fallback   → ALERT_FALLBACK_EMAILS in .env (per host). Used
|      whenever the database cannot answer: no row for a channel yet, the
|      table missing, a DB fault, an unknown channel key.
|   4. The catalogue        → `channels` below. What alerts exist.
|
| Nothing else decides a recipient. If you find a `Mail::to('someone@…')` in
| app code for an internal alert, it is a bug — route it through
| App\Support\AlertRouter::recipients('<channel>').
|
| 🚨 MIRRORED IN BOTH APPS. The admin panel aims mail the WEBSITE sends, so the
| `channels` list must be identical on both sides (a test pins it).
|
*/

/*
 * ALERT_FALLBACK_EMAILS — comma separated. Each host has its own .env, so
 * production, dev and a laptop each name their own emergency list.
 *
 * ⚠️ An EMPTY value counts as unset and uses the default below. Alerting must
 * not be switchable off by a stray `ALERT_FALLBACK_EMAILS=` with nothing after
 * it. The default splits by environment on purpose: an unconfigured laptop
 * mails the developer, never the support inbox.
 */
$fallback = array_values(array_filter(array_map('trim', explode(',', (string) env('ALERT_FALLBACK_EMAILS')))))
    ?: (env('APP_ENV') === 'production'
        ? ['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com']
        : ['naveen@internetbusinesssolutionsindia.com']);

return [

    /*
     * Master switch for every channel on THIS host. Off = no internal alert
     * mail at all (still logged). Default is on everywhere except local — a
     * developer running `schedule:work` must not page the real team, and a
     * default that has to be remembered is one that will not be.
     */
    'enabled' => (bool) env('ALERTS_ENABLED', env('APP_ENV') !== 'local'),

    'fallback' => $fallback,

    /*
    |--------------------------------------------------------------------------
    | Channel catalogue
    |--------------------------------------------------------------------------
    |
    | `critical` — the platform is worse off if nobody reads it (money,
    | security, the site being down). A critical channel cannot be saved with
    | nobody on it while it is on.
    |
    | `roles` — default admin role ids (1 Super Admin, 3 Finance, 4 Support,
    | 5 CSM, 6 Read Only), expanded to live addresses at send time. Shown on the
    | screen until a row is saved; after that the row wins.
    |
    | 🚨 A channel not declared here cannot be routed — it falls back for ever.
    | Add the row in the same commit as the sender.
    |
    */
    'channels' => [

        /*
        |--------------------------------------------------------------------------
        | admin.spennypiggy.co
        |--------------------------------------------------------------------------
        */

        'pending_approval_digest' => [
            'label' => 'Pending-approval digest',
            'description' => 'What is waiting for an admin decision, plus new signups since the last report.',
            'app' => 'admin',
            'critical' => true,
            'roles' => [1, 4],
            'emails' => [],
            'note' => 'Also gated by ALERTS_ENABLED in .env (the master switch for every channel on this host).',
        ],

        /*
         * 🚨 A CREATOR WE REFUSED HAS COME BACK, AND THEY ARE LOCKED OUT UNTIL
         * SOMEBODY LOOKS. A refusal suspends the account, so this person cannot
         * sell anything at all while they wait — which is why the client asked
         * to hear about it immediately rather than in the half-hourly digest
         * ("taaki jaldi se jaldi wo wapas aa sake site par"). The digest still
         * carries the row; this is the one that arrives the moment it happens.
         */
        'identity_reverified' => [
            'label' => 'Refused ID check re-verified',
            'description' => 'A creator we refused has passed Stripe again and is waiting on a second sign-off. They cannot sell until it is done.',
            'app' => 'website',
            'critical' => false,
            'roles' => [1, 4],
            'emails' => [],
        ],

        'fraud_digest' => [
            'label' => 'Fraud digest',
            'description' => 'Daily summary of blocked payments, risk states and chargeback activity.',
            'app' => 'admin',
            'critical' => true,
            'roles' => [1, 3],
            'emails' => [],
        ],

        'infrastructure_health' => [
            'label' => 'Infrastructure health',
            'description' => 'Queue, database, storage and integration checks. Fires when something is down.',
            'app' => 'admin',
            'critical' => true,
            'roles' => [1],
            'emails' => [],
        ],

        /*
         * 🚨 The daily posture check (`infra:dr-check`) found the safety net
         * missing, not the site down. Separate from `infrastructure_health`
         * because that channel is "something is broken NOW" and this one is
         * "the thing that saves us has quietly stopped existing" — a standing
         * condition nobody is paged for, which is precisely why it needs its
         * own route rather than sharing an inbox with live outages.
         *
         * ⚠️ MIRRORED IN BOTH APPS. A test compares the channel key lists.
         */
        'disaster_recovery' => [
            'label' => 'Disaster recovery posture',
            'description' => 'Backups, retention, the offsite copy. Fires when the safety net has drifted, not when the site is down.',
            'app' => 'website',
            'critical' => true,
            'roles' => [1],
            'emails' => [],
        ],

        'notification_delivery' => [
            'label' => 'Notification delivery alert',
            'description' => 'Push and email delivery failures crossing their threshold.',
            'app' => 'admin',
            'critical' => false,
            'roles' => [1],
            'emails' => [],
        ],

        /*
        |--------------------------------------------------------------------------
        | Both apps
        |--------------------------------------------------------------------------
        */

        'security_events' => [
            'label' => 'Security alerts',
            'description' => 'Admin logins from new IPs, failed-login bursts, lockouts, payout-destination changes.',
            'app' => 'both',
            'critical' => true,
            'roles' => [1],
            'emails' => [],
        ],

        /*
        |--------------------------------------------------------------------------
        | spennypiggy.co
        |--------------------------------------------------------------------------
        */

        'dispute_alerts' => [
            'label' => 'Disputes and chargebacks',
            'description' => 'A supporter has disputed a payment. Evidence is due by Stripe\'s deadline.',
            'app' => 'website',
            'critical' => true,
            'roles' => [1, 3, 4],
            'emails' => [],
        ],

        'fraud_alerts' => [
            'label' => 'Early fraud warnings',
            'description' => 'Stripe Radar early fraud warnings and high-risk payment activity.',
            'app' => 'website',
            'critical' => true,
            'roles' => [1, 3],
            'emails' => [],
        ],

        'platform_risk_state' => [
            'label' => 'Platform risk state',
            'description' => 'The risk engine has changed the platform state, or refund volume is abnormal.',
            'app' => 'website',
            'critical' => true,
            'roles' => [1, 3],
            'emails' => [],
        ],

        'diagnostics' => [
            'label' => 'System diagnostics',
            'description' => 'Failures found by the diagnostics sweep (routes, migrations, integrations).',
            'app' => 'website',
            'critical' => false,
            'roles' => [1],
            'emails' => [],
        ],

        'feature_suggestions' => [
            'label' => 'Feature suggestions',
            'description' => 'A creator or supporter has submitted an idea through the site.',
            'app' => 'website',
            'critical' => false,
            'roles' => [1],
            'emails' => [],
        ],

        'whale_retention' => [
            'label' => 'Top supporter retention',
            'description' => 'A high-value supporter has gone quiet and is worth contacting.',
            'app' => 'website',
            'critical' => false,
            'roles' => [1, 5],
            'emails' => [],
        ],

        'creator_intro_submitted' => [
            'label' => 'Creator intro video submitted',
            'description' => 'A creator has uploaded an introduction video for review.',
            'app' => 'website',
            'critical' => false,
            'roles' => [1, 4],
            'emails' => [],
        ],

    ],

];
