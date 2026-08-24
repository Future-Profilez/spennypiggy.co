<?php

/*
 * Retention policy for locally-held identity / KYC data.
 *
 * Identity verification itself is 100% Stripe-hosted: `StripeController::
 * createVerificationSession()` mints the session, the customer uploads to
 * Stripe, and `StripeWebhookController` calls
 * `identity->verificationSessions->redact()` the moment a check passes — so the
 * images never exist on this platform. What DOES exist locally is:
 *
 *   1. `user_documents` rows — legacy SumSub-era references (`front`/`back`).
 *      admin.spennypiggy.co's `UserDocuments` model renders them as
 *      `https://ucarecdn.com/{value}/`, i.e. an ID document on a permanent
 *      public CDN with no expiry and no signature.
 *   2. Free-text / payload columns on `users` describing a person's identity
 *      check: `identity_verification_details`, `identity_verification_error`,
 *      `identity_admin_notes`, `kyc_error`.
 *
 * Nothing in this codebase ever deleted any of it — the one deletion that
 * existed is commented out in `ProfileController` — so it is kept forever.
 */
return [
    /*
     * 🚨 THE ARMING FLAG. Off means `identity:prune` REPORTS what it would take
     * and deletes nothing, ever.
     *
     * It is off by default on purpose, and the reason is not caution for its own
     * sake: this codebase has NO legal-hold marker of any kind (verified by
     * search — there is no `legal_hold` column, flag, model or table anywhere in
     * either app). Every other exclusion this command enforces is derived from a
     * marker that provably exists; "this creator is under a legal or regulatory
     * hold" is the one class of case that CANNOT be expressed, so a human turning
     * this on is standing in for the marker the schema does not have.
     *
     * Deleting identity evidence during a live dispute is worse than keeping it
     * too long. Turn this on deliberately, after reading a `--dry-run`.
     */
    'enabled' => env('IDENTITY_RETENTION_ENABLED', false),

    /*
     * How long identity evidence is kept, in days.
     *
     * ⚠️ 1825 = five years, which is the UK MLR 2017 record-keeping period, and
     * it is deliberately the STATUTORY MAXIMUM rather than a number chosen for
     * this platform. Out of the box the command will therefore find very little
     * — that is intentional: the window is a compliance decision, not an
     * engineering one. Run `identity:prune --dry-run --days=365` to see what a
     * shorter policy would remove, then set this env var once the policy is
     * agreed.
     *
     * The counter-argument for a much shorter window, which is what the audit
     * finding is really about: the KYC record of account is Stripe's, not ours.
     * A `user_documents` row is not evidence we are obliged to hold — it is a
     * pointer to a third party's public CDN.
     */
    'retention_days' => (int) env('IDENTITY_RETENTION_DAYS', 1825),

    /*
     * Rows removed per DELETE statement.
     */
    'chunk' => (int) env('IDENTITY_RETENTION_CHUNK', 500),

    /*
    |--------------------------------------------------------------------------
    | Delete the CDN object, not just the row
    |--------------------------------------------------------------------------
    |
    | 🚨 Deleting only the `user_documents` row leaves the actual photo ID on a
    | permanent, unauthenticated ucarecdn.com URL with nothing pointing at it —
    | unfindable and impossible to clean up later. Verified live 23 Aug 2026:
    | all 8 references on dev answered HTTP 200 image/jpeg.
    |
    | Forced OFF in `testing` (phpunit.xml) so the suite never calls Uploadcare.
    |
    */

    'delete_cdn_objects' => env('IDENTITY_RETENTION_DELETE_CDN', true),

];
