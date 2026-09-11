<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Does this creator's identity check let money leave the platform?
 *
 * 🚨 IDENTITY IS A PAYOUT GATE, NOT AN ONBOARDING STEP (10 Sep 2026, client direction).
 * A creator signs up, builds, publishes and sells with no ID check. They cannot be PAID
 * until Stripe passes the document AND an admin signs it off. `identityBeforeListing`
 * used to sit on the seven listing-create routes and is gone.
 *
 * ⚠️ THE TRADE THIS MAKES, STATED PLAINLY: the fraud window moved from "cannot list" to
 * "cannot withdraw". An unverified creator can now take supporter money and fail at the
 * payout — so the money is already ours to refund. That is the accepted cost of removing
 * the onboarding gate, not an oversight.
 *
 * 🚨 THIS IS THE ONE DEFINITION AND EVERY PAYOUT PATH READS IT. There are six ways money
 * leaves this platform — the weekly run, reserve release, Founder payouts, Founder
 * monthly bonuses, Fast Start payouts and the Growth Bonus manual release. A gate on one
 * of them is decorative. Same reasoning as `users.payout_paused_at` being one column
 * every path already reads.
 *
 * ⚠️ It deliberately does NOT reuse `payout_paused_at`. That column is an admin hold with
 * its own reason, and `SuspensionService::lift()` already has to check
 * `payout_pause_reason` so a suspension does not release a hold somebody else placed.
 * Writing a second meaning into it would make that check unresolvable.
 *
 * ⚠️ NOTHING HERE BLOCKS A SALE. Supporters can buy from an unverified creator; the
 * ledger, the badges and the payout badges are all unaffected. Only the outbound payment
 * stops, and the money keeps accruing until they verify.
 */
class PayoutEligibility
{
    /** `users.identity_status`: Stripe passed the document. */
    public const IDENTITY_VERIFIED = 1;

    /**
     * `users.identity_status`: a Stripe Identity session is OPEN.
     *
     * 🚨 NOT "submitted" — it is written when the session is CREATED, so it also covers a
     * creator who opened the check and closed the tab, which Stripe reports nothing for.
     * `IdentityCheckState` reads the session's own status to tell the two apart.
     */
    public const IDENTITY_SESSION_OPEN = 2;

    /** `users.identity_status`: flagged by Stripe's fraud signals. A person must look. */
    public const IDENTITY_FLAGGED = 3;

    /** `users.identity_admin_status`: a person has signed the check off. */
    public const ADMIN_APPROVED = 1;

    /** `users.identity_admin_status`: a person refused it. */
    public const ADMIN_REJECTED = 2;

    /* -----------------------------------------------------------------
     | States
     | ----------------------------------------------------------------- */

    /** Never opened a check. */
    public const STATE_NONE = 'none';

    /** Opened a Stripe session and did not finish it. Their move. */
    public const STATE_UNFINISHED = 'unfinished';

    /** A document is with Stripe. Nobody's move. */
    public const STATE_PROCESSING = 'processing';

    /** Stripe passed it; a person has not looked yet. Our move. */
    public const STATE_ADMIN_PENDING = 'admin_pending';

    /** A person refused it. Their move, with a reason. */
    public const STATE_REJECTED = 'rejected';

    /** Stripe's fraud signals flagged it. Support conversation, not a retry. */
    public const STATE_FLAGGED = 'flagged';

    /** Done. Money can leave. */
    public const STATE_COMPLETE = 'complete';

    /**
     * May money be paid out to this creator, as far as identity is concerned?
     *
     * ⚠️ Answers only the identity question. Suspension, payout pauses, Stripe account
     * health and the run's own eligibility rules are separate and all still apply.
     */
    public static function identityComplete(?User $creator): bool
    {
        if (! $creator) {
            return false;
        }

        if (! config('payout_identity.enabled', true)) {
            return true;
        }

        if ((int) ($creator->identity_status ?? 0) !== self::IDENTITY_VERIFIED) {
            return false;
        }

        if ((int) ($creator->identity_admin_status ?? 0) === self::ADMIN_APPROVED) {
            return true;
        }

        return self::isGrandfathered($creator);
    }

    /** The inverse, for readability at the six call sites that ask it that way. */
    public static function blocksPayout(?User $creator): bool
    {
        return ! self::identityComplete($creator);
    }

    /**
     * Verified before the admin sign-off split, so they carry no sign-off through no
     * fault of their own.
     *
     * 🚨 See `config/payout_identity.php` for why this window exists and why it is
     * meant to be removed. `identity:signoff-backlog` lists everybody relying on it.
     */
    public static function isGrandfathered(User $creator): bool
    {
        $cutoff = config('payout_identity.grandfather_verified_before');

        if (blank($cutoff)) {
            return false;
        }

        // A rejection is never grandfathered. A person looked and said no; a date
        // cannot overrule that.
        if ((int) ($creator->identity_admin_status ?? 0) === self::ADMIN_REJECTED) {
            return false;
        }

        $verifiedAt = $creator->identity_verified_at;

        if (blank($verifiedAt)) {
            return false;
        }

        try {
            return Carbon::parse($verifiedAt)->lt(Carbon::parse($cutoff));
        } catch (\Throwable) {
            // An unparseable date is not a licence to pay. Same direction as every
            // other guard here: unknown means not verified.
            return false;
        }
    }

    /**
     * Which of the seven states the creator is in.
     *
     * Order matters: the later a branch sits, the more it assumes about what came
     * before it.
     */
    public static function stateFor(?User $creator): string
    {
        if (self::identityComplete($creator)) {
            return self::STATE_COMPLETE;
        }

        if (! $creator) {
            return self::STATE_NONE;
        }

        $status = (int) ($creator->identity_status ?? 0);

        if ($status === self::IDENTITY_FLAGGED) {
            return self::STATE_FLAGGED;
        }

        if ((int) ($creator->identity_admin_status ?? 0) === self::ADMIN_REJECTED) {
            return self::STATE_REJECTED;
        }

        // Stripe passed it and we are the ones holding it up. Said differently from
        // every other state on purpose — see `copyFor()`.
        if ($status === self::IDENTITY_VERIFIED) {
            return self::STATE_ADMIN_PENDING;
        }

        if (IdentityCheckState::isProcessing($creator)) {
            return self::STATE_PROCESSING;
        }

        if (IdentityCheckState::isUnfinished($creator)) {
            return self::STATE_UNFINISHED;
        }

        return self::STATE_NONE;
    }

    /**
     * What the creator is told, per state.
     *
     * 🚨 THREE OF THESE MOVED HERE FROM `CreatorJourneyService` (10 Sep 2026) — its
     * `UNFINISHED_COPY`, `REVIEW_COPY['identity']` and `BLOCKED_COPY`. The states they
     * describe are real and unchanged; they are read on the payout page now, where the
     * money they hold up is visible beside them.
     *
     * ⚠️ `cta` is null wherever the creator cannot act. A button on a state they cannot
     * move is how somebody ends up clicking "verify" three times against a check that is
     * already with Stripe.
     *
     * ⚠️ NO STATE NAMES AN AMOUNT. The caller supplies the held figure and the date —
     * they are the same numbers the payout page already renders, and a second source for
     * them is a second answer.
     *
     * @return array{title: string, body: string, cta: ?string, route: ?string}
     */
    public static function copyFor(string $state): array
    {
        return match ($state) {
            self::STATE_NONE => [
                'title' => 'Verify your identity to get paid',
                'body' => 'Before we can send money to your bank we need to check who you are. It is a passport photo and a selfie, and it takes about two minutes. Nothing about your page changes — you can keep selling while you do it.',
                'cta' => 'Verify my identity',
                'route' => 'stripe.identity.verification',
            ],

            self::STATE_UNFINISHED => [
                'title' => 'Finish your ID check to get paid',
                'body' => 'You opened the check but did not finish it, so nothing has reached our verification provider yet. Picking it up again takes about two minutes.',
                'cta' => 'Finish my ID check',
                'route' => 'stripe.identity.verification',
            ],

            self::STATE_PROCESSING => [
                'title' => 'Your ID check is being processed',
                'body' => 'Your document is with our verification provider. They usually answer within minutes and we will tell you either way — there is nothing else for you to do.',
                'cta' => null,
                'route' => null,
            ],

            /*
             * 🚨 THE ONLY STATE WHERE THE DELAY IS OURS, AND THE COPY SAYS SO.
             *
             * The creator did everything asked. Telling them "your check is being
             * processed" here would be false — it passed — and telling them to verify
             * again would send them to pay for a second check with the same answer.
             */
            self::STATE_ADMIN_PENDING => [
                'title' => 'Your ID check passed — final check with our team',
                'body' => 'Your document cleared. One of our team gives every check a final look before the first payment goes out, and we will email you the moment it is done. You do not need to do anything.',
                'cta' => null,
                'route' => null,
            ],

            /*
             * ⚠️ The reason is supplied by the caller from `identity_verification_error`,
             * because it is written per creator. Never guessed here.
             */
            self::STATE_REJECTED => [
                'title' => 'We could not confirm your identity',
                'body' => 'Our team could not match the document to your page. Message support from the chat bubble and we will tell you exactly what to send.',
                'cta' => null,
                'route' => null,
            ],

            self::STATE_FLAGGED => [
                'title' => 'We could not verify your ID',
                'body' => 'Your identity check did not pass the security review. Message support from the chat bubble and we will sort it out with you.',
                'cta' => null,
                'route' => null,
            ],

            default => [
                'title' => '',
                'body' => '',
                'cta' => null,
                'route' => null,
            ],
        };
    }

    /**
     * A short reason for a log line or an admin screen. Never shown to the creator —
     * `copyFor()` is what they read.
     */
    public static function reasonFor(?User $creator): ?string
    {
        $state = self::stateFor($creator);

        return $state === self::STATE_COMPLETE
            ? null
            : 'identity_'.$state;
    }
}
