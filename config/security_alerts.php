<?php

/*
|--------------------------------------------------------------------------
| Security observation — thresholds and cooldowns
|--------------------------------------------------------------------------
|
| Security Checklist §3 "See what's happening". Every number an alert depends
| on lives here, in ONE file, mirrored byte-for-byte in the other app.
|
| 🚨 ALERT FATIGUE IS THE FAILURE MODE THIS FILE EXISTS TO PREVENT. An alert
| that fires a hundred times an hour is an inbox rule within a week, and then
| the one that mattered is filtered too. Every event below therefore has BOTH a
| threshold (how much is worth mentioning) and a cooldown (how often we are
| willing to mention it), and the reasoning for each number is written beside
| it rather than in a commit message.
|
| Recipients are NOT here — they come from config/alerts.php, which both apps
| already use for operational mail.
|
*/

return [

    /*
     * Which side of the shared database wrote a row. The two apps have separate
     * code and one database, and `security_events.app` is the only thing that
     * says whether an observation came from the public platform or the back
     * office. This is the ONE line of this file that differs between them.
     */
    'app' => 'website',

    // Master switch. Detection still records to `security_events` when this is
    // false; only the email is suppressed. Off is for a load test or a data
    // backfill, never for production.
    'enabled' => env('SECURITY_ALERTS_ENABLED', true),

    'admin_login' => [
        /*
         * The client asks to be told about ANY admin login. A row is written for
         * every one; the EMAIL is what needs rationing, because a working day is
         * a handful of admins re-authenticating after each session timeout.
         *
         * A login from an IP that admin has never successfully used before is
         * always mailed, with no cooldown — that is the event worth waking up
         * for. A login from an IP they have used before is mailed at most once
         * per 12 hours per (admin, IP), which turns "Priya signed in" from nine
         * mails a day into one.
         */
        'known_ip_cooldown_minutes' => env('SECURITY_ADMIN_LOGIN_COOLDOWN', 720),

        // How far back "have they used this IP before?" looks. A year: an admin
        // who signs in from the office monthly should not be flagged as new.
        'known_ip_lookback_days' => 365,
    ],

    'failed_login' => [
        /*
         * "5+ failed logins from one IP." Keyed on the IP ALONE — the existing
         * lockout is keyed `email|ip`, which is why one IP spraying five
         * different addresses never tripped anything.
         */
        'threshold' => env('SECURITY_FAILED_LOGIN_THRESHOLD', 5),

        // 15 minutes. Long enough that a slow script still accumulates, short
        // enough that a person who mistyped their password twice this morning
        // and three times this afternoon is not reported as an attack.
        'window_minutes' => env('SECURITY_FAILED_LOGIN_WINDOW', 15),

        // One mail per IP per hour. A brute-force run lasts hours; being told
        // once an hour that it is still going is enough to act on, and 60 mails
        // is not more information than 1.
        'cooldown_minutes' => env('SECURITY_FAILED_LOGIN_COOLDOWN', 60),

        // Spraying many accounts from one IP is a different, worse signal than
        // one account being guessed at. Reported separately in the alert body.
        'spray_distinct_accounts' => 3,
    ],

    'lockout' => [
        // Laravel's Lockout event already means "this key hit its limit", so
        // there is no threshold to add — the framework applied one. Only a
        // cooldown, per IP, so a locked-out script does not mail on every retry.
        'cooldown_minutes' => env('SECURITY_LOCKOUT_COOLDOWN', 30),
    ],

    'otp_failure' => [
        /*
         * An OTP is a six-digit code the holder has in their hand. Two wrong in
         * a row is a clock-skew or a fat finger; three inside ten minutes is
         * either a broken authenticator or somebody guessing, and both are worth
         * a look.
         */
        'threshold' => env('SECURITY_OTP_FAILURE_THRESHOLD', 3),
        'window_minutes' => env('SECURITY_OTP_FAILURE_WINDOW', 10),
        'cooldown_minutes' => env('SECURITY_OTP_FAILURE_COOLDOWN', 60),

        /*
         * The website's step-up OTP is a different population: it is sent to
         * ordinary supporters mid-checkout, and a handful mistype it every day.
         * One person failing is not news — a spike across the platform is. This
         * is the platform-wide count inside the same window.
         */
        'platform_burst_threshold' => env('SECURITY_OTP_BURST_THRESHOLD', 20),
    ],

    'payout_destination' => [
        /*
         * NO THRESHOLD AND NO COOLDOWN, deliberately. A creator's payout
         * destination changes a handful of times a year across the whole
         * platform, and the change is the single highest-value thing an account
         * takeover does. There is no volume here to protect an inbox from, and
         * suppressing the second one of a pair would suppress exactly the case
         * that matters (destination changed, then changed back).
         */
        'enabled' => env('SECURITY_PAYOUT_DESTINATION_ALERTS', true),
    ],

    'content_download' => [
        /*
         * A buyer downloads what they bought — one file, occasionally a few if
         * they change device. Twenty in an hour from one account is a script
         * walking the catalogue, which is the "bulk content download" the
         * checklist is about.
         */
        'threshold' => env('SECURITY_DOWNLOAD_THRESHOLD', 20),
        'window_minutes' => env('SECURITY_DOWNLOAD_WINDOW', 60),

        // Six hours. A scraper that is still running six hours later is worth a
        // second mail; one every hour is not.
        'cooldown_minutes' => env('SECURITY_DOWNLOAD_COOLDOWN', 360),
    ],

    'refund_volume' => [
        /*
         * The rate itself is NOT redefined here — it is read from the risk
         * engine's own `risk_thresholds.high_refund_rate` (0.05), so the number
         * the admin is alerted on and the number the creator is scored on can
         * never drift apart.
         *
         * What IS here is the floor and the cadence. A 100% refund rate over
         * three transactions is a creator having a bad week, not a platform
         * incident, and alerting on it teaches the reader to ignore the mail.
         */
        'min_transactions' => env('SECURITY_REFUND_MIN_TX', 50),

        // Or: this many individual creators over the per-creator threshold.
        // Mirrors the risk engine's existing `creators_over_trigger_count`.
        'creators_over_threshold' => env('SECURITY_REFUND_CREATOR_COUNT', 5),

        /*
         * 24 hours. The metric is a 30-day rolling window, so it moves by
         * fractions of a percent between scheduler ticks — mailing on every run
         * would send the same number dozens of times a day.
         */
        'cooldown_minutes' => env('SECURITY_REFUND_COOLDOWN', 1440),
    ],

    'account_email' => [
        // Same reasoning as payout_destination: rare, and it is how a takeover
        // locks the real owner out. Every one is mailed.
        'enabled' => env('SECURITY_ACCOUNT_EMAIL_ALERTS', true),
    ],

];
