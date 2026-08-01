<?php

/*
|--------------------------------------------------------------------------
| Internal alert recipients — EDIT THE LISTS BELOW
|--------------------------------------------------------------------------
|
| This is the control panel. Who receives the platform's own operational mail:
| infrastructure alerts, the fraud digest, pending-approval summaries. NOT
| customer-facing mail.
|
| No .env entry is needed — change an address here and it takes effect. Setting
| the matching variable in .env overrides the list for that environment, which is
| there for the cases where an address must differ per server without a deploy.
|
| ⚠️ Why two lists rather than one. The support inbox must never receive a [LOCAL]
| or [DEV] alert — it did, and three environments mailing the same inbox is how
| people learn to ignore the one that mattered. Splitting them means that
| forgetting to configure anything still fails safe: an unconfigured local machine
| mails the developer, never support.
|
| Mirrored in spennypiggy.co/config/alerts.php with the same shape and the same
| variable names. The two apps share a database but no code, and both send alerts.
|
*/

$addresses = [

    /*
     * PRODUCTION — the shared support inbox as well as the developer, because on
     * production somebody other than the developer has to be able to act.
     * Override with ALERT_EMAILS_PRODUCTION.
     */
    'production' => [
        'support@spennypiggy.co',
        'naveen@internetbusinesssolutionsindia.com',
    ],

    /*
     * LOCAL AND DEV — the developer only. Override with ALERT_EMAILS_NONPROD.
     */
    'non_production' => [
        'naveen@internetbusinesssolutionsindia.com',
    ],

];

/*
|--------------------------------------------------------------------------
| Machinery — nothing to change past this point
|--------------------------------------------------------------------------
|
| ⚠️ An EMPTY variable counts as unset and falls back to the list above. Alerting
| must not be switchable off by a stray `ALERT_EMAILS_NONPROD=` with nothing after
| it: the previous form (`config(...) ?? [defaults]`) had exactly that hole —
| `??` only catches null, config always returns an array, so a blank value sent to
| nobody and reported no error.
|
*/

$override = function (string $variable, array $default): array {
    $parsed = array_values(array_filter(array_map('trim', explode(',', (string) env($variable)))));

    return $parsed ?: $default;
};

return [
    'production' => $override('ALERT_EMAILS_PRODUCTION', $addresses['production']),
    'non_production' => $override('ALERT_EMAILS_NONPROD', $addresses['non_production']),
];
