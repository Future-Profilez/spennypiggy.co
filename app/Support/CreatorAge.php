<?php

namespace App\Support;

use Carbon\Carbon;
use Throwable;

/**
 * 🚨 A DATE OF BIRTH THIS PLATFORM ACCEPTED, STRIPE REFUSED — AND THE CREATOR
 * COULD NOT BE PAID.
 *
 * Reported 13 Sep 2026 (Sentry JAVASCRIPT-REACT-C6): `accounts->create` came back
 * *"Must be at least 13 years of age to use Stripe"* and the whole Connect account
 * creation failed. The creator tried three times in 28 seconds and stopped.
 *
 * 🚨 THE DATE CAME FROM US. `ProfileController` validated `date_of_birth` as
 * `['nullable', 'date', 'before:today']` — **yesterday was a legal value**. There
 * was no minimum age anywhere in the app, on a platform whose own Terms require
 * 18+ and whose shop form makes a creator tick a box saying so. One mistyped year
 * on a profile form became a permanent, unexplained block on being paid.
 *
 * ⚠️ TWO FLOORS, AND THEY ARE DIFFERENT QUESTIONS.
 *  - `MINIMUM_YEARS` (18) is OUR rule, from our own Terms. It governs what a
 *    creator may SAVE.
 *  - `STRIPE_MINIMUM_YEARS` (13) is the processor's, and it governs what is safe
 *    to SEND. It is lower, so a row already in the database can sit between the
 *    two — those creators predate the validation and Stripe accepts them, so
 *    their prefill is still sent.
 *
 * Keeping both here is what stops the two drifting into one number that is wrong
 * for one of the jobs.
 */
class CreatorAge
{
    /** This platform's own rule, from its Terms. */
    public const MINIMUM_YEARS = 18;

    /** Stripe's floor — below this `accounts->create` is refused outright. */
    public const STRIPE_MINIMUM_YEARS = 13;

    /**
     * Parse a stored or submitted date of birth, or null when it is not a date.
     *
     * ⚠️ NEVER lets `Carbon` throw at a caller. Both callers are a validation
     * rule and a prefill, and neither may become the reason a request fails.
     */
    public static function parse(mixed $value): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (Throwable) {
            return null;
        }
    }

    /** Is this old enough to be a creator here? Null (no date on file) is not a refusal. */
    public static function meetsPlatformMinimum(mixed $value): bool
    {
        $dob = self::parse($value);

        return $dob === null || $dob->lte(Carbon::now()->subYears(self::MINIMUM_YEARS));
    }

    /**
     * 🚨 Would sending this to Stripe make it refuse the whole account?
     *
     * This is the question the PREFILL asks, and it is deliberately the lower
     * floor: the prefill is a convenience, and a convenience must never be the
     * reason a creator cannot be paid.
     */
    public static function stripeWouldRefuse(mixed $value): bool
    {
        $dob = self::parse($value);

        if ($dob === null) {
            return false;
        }

        return $dob->gt(Carbon::now()->subYears(self::STRIPE_MINIMUM_YEARS));
    }
}
