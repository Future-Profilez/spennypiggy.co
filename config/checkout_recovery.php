<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Reminder schedule
    |--------------------------------------------------------------------------
    |
    | Minutes after a checkout was abandoned at which each reminder is sent.
    | Comma-separated; the number of entries IS the maximum number of reminders
    | an account holder receives.
    |
    | Production default is 60,1200 — one hour (when the intent is still fresh)
    | and twenty hours (before the ~24h Stripe Checkout session expires and the
    | resume link dies). Do not push the last entry past 24h: the reminder would
    | link to an expired session, and `isStillRecoverable()` would close the row
    | instead of sending.
    |
    | Locally, set CHECKOUT_RECOVERY_SCHEDULE_MINUTES=1,2 so the flow can be
    | tested in a couple of minutes rather than a couple of hours.
    |
    */

    'schedule_minutes' => array_values(array_filter(array_map(
        'intval',
        explode(',', (string) env('CHECKOUT_RECOVERY_SCHEDULE_MINUTES', '60,1200'))
    ), fn ($minutes) => $minutes > 0)),

    /*
    |--------------------------------------------------------------------------
    | Guest reminder cap
    |--------------------------------------------------------------------------
    |
    | A guest has no account and no consent record, so they receive fewer
    | reminders than an account holder however long the schedule is.
    |
    */

    'guest_max_reminders' => (int) env('CHECKOUT_RECOVERY_GUEST_MAX', 1),

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Days a CLOSED row is kept before `prune()` deletes it. One row is written
    | per checkout attempt, so this table grows faster than any payment table.
    | Open rows are live work and are never pruned.
    |
    */

    'retention_days' => (int) env('CHECKOUT_RECOVERY_RETENTION_DAYS', 180),

    /*
    |--------------------------------------------------------------------------
    | Candidate window
    |--------------------------------------------------------------------------
    |
    | How far back the command looks for rows to remind. Past the Stripe session
    | lifetime plus slack — the link is dead, and re-examining ancient rows every
    | hour forever is noise.
    |
    */

    'lookback_days' => (int) env('CHECKOUT_RECOVERY_LOOKBACK_DAYS', 3),

];
