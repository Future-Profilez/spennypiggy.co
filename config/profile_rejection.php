<?php

/**
 * 🚨 MIRRORED IN BOTH APPS — spennypiggy.co/config/profile_rejection.php and
 * admin.spennypiggy.co/config/profile_rejection.php MUST STAY IDENTICAL (the
 * `fee_profiles` rule). The admin app WRITES the collapsed reason using these
 * labels; the website READS it back to the creator and mails it. A label that
 * differs between the two is a reason the creator reads under a heading the
 * reviewer never wrote.
 *
 * What this is (client decision, 7 Sep 2026): a creator is REJECTED AS A WHOLE
 * PROFILE, never one asset at a time. `avatar_approved = 2`, `bio_approved = 2`
 * and `social_links.status = 2` used to be three separate rejections that each
 * surfaced differently — and 280 creators sat at `profile_status_lock = 0` with
 * only 21 carrying a reason, so nothing could tell a rejected creator from a
 * draft. Every per-asset rejection now collapses to ONE fact: lock 0, a labelled
 * reason in `users.profile_reject_reason`, and a row in `profile_rejections`
 * (the history — the live column is overwritten on the next decision and cleared
 * on resubmit).
 */
return [

    /**
     * Asset key => the label prefixed to the reviewer's reason.
     *
     * "Profile photo: does not show your face" reads; the bare reason does not
     * say WHICH thing it is about once three assets share one column.
     */
    'labels' => [
        'avatar' => 'Profile photo',
        'bio' => 'Bio',
        'socials' => 'Social handle',
        'cover' => 'Cover image',
        'profile' => 'Profile',
    ],

    /**
     * 🚨 Written ONLY where no reviewer ever typed a reason — the May 2026 handle
     * sweep left 40 of 47 rejected assets with none. Neutral on purpose: it names
     * the standard, never guesses at a cause nobody recorded.
     */
    'generic_reason' => 'Your profile assets did not match our guidelines. Please update them and submit again.',

    /**
     * The re-engagement ladder for a rejected creator (`profiles:nudge-rejected`,
     * website). Read as "after this many sends, wait this many days".
     *
     * ⚠️ Ordered ascending, first match wins, the null entry runs for ever.
     * Two-monthly ×3 then yearly — a rejected creator was told no once already,
     * and a platform that keeps asking is the one whose receipts get filtered.
     */
    'nudge_ladder' => [
        ['after_sends' => 3, 'wait_days' => 60],
        ['after_sends' => null, 'wait_days' => 365],
    ],

    /** Days a rejection must be old before the FIRST re-engagement mail. */
    'nudge_first_after_days' => 60,

    'nudge_enabled' => (bool) env('REJECTED_NUDGE_ENABLED', true),
    'nudge_max_per_run' => (int) env('REJECTED_NUDGE_MAX_PER_RUN', 50),
    'nudge_stagger_seconds' => (int) env('REJECTED_NUDGE_STAGGER', 2),
];
