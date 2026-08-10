<?php

return [
    /*
     * Master switch. Off means nothing is recorded — the sends themselves are
     * completely unaffected either way.
     */
    'enabled' => env('NOTIFICATION_LOGS_ENABLED', true),

    /*
     * How long a delivery record is kept. This table gains a row for every
     * email, push and bell entry the platform produces, so it grows faster than
     * any payment table and is unbounded without the prune command.
     */
    'retention_days' => (int) env('NOTIFICATION_LOGS_RETENTION_DAYS', 90),

    /*
     * Bulk campaign sends are far higher volume than transactional traffic and
     * are far less interesting after the fact, so they are kept for less time.
     */
    'campaign_retention_days' => (int) env('NOTIFICATION_LOGS_CAMPAIGN_RETENTION_DAYS', 60),

    /*
     * A row is written before the transport is called and flipped to `sent`
     * once it accepts the message. A row still `queued` after this many minutes
     * never got that confirmation — the transport threw, or the process died
     * mid-send — so the prune command settles it as `failed` rather than
     * leaving it looking like it is still on its way.
     */
    'stale_after_minutes' => (int) env('NOTIFICATION_LOGS_STALE_MINUTES', 60),

    /*
     * Log bulk campaign email as well as transactional. Turning this off keeps
     * the table small at the cost of being unable to prove a campaign was sent
     * to a given address.
     */
    'log_campaigns' => env('NOTIFICATION_LOGS_INCLUDE_CAMPAIGNS', true),

    /*
     * Store a plain-text preview of what the message said, so an admin can
     * answer "what did we send them?" without asking the recipient to forward
     * it.
     *
     * ⚠️ A PREVIEW, never the full message. Receipt emails carry `reward_body` —
     * the paid deliverable — so storing whole HTML bodies would put every
     * purchased message and link in a second table. Plain text only, truncated,
     * attachments never captured.
     */
    'store_body' => env('NOTIFICATION_LOGS_STORE_BODY', true),

    'body_limit' => (int) env('NOTIFICATION_LOGS_BODY_LIMIT', 2000),

    /*
     * Campaign bodies are identical for every recipient and already stored once
     * on the campaign row, so repeating one across tens of thousands of log rows
     * is pure waste. Off by default.
     */
    'store_campaign_body' => env('NOTIFICATION_LOGS_STORE_CAMPAIGN_BODY', false),
];
