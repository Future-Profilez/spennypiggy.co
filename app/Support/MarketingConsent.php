<?php

namespace App\Support;

use App\Models\MarketingSuppression;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * The one place that composes a marketing consent record.
 *
 * UK direct-marketing brief, 23 Aug 2026. Under PECR/GDPR the burden of proof is
 * on us: it is not enough to hold a boolean saying we may send, we have to be
 * able to show WHEN the person agreed, on WHICH screen, and to WHAT WORDING.
 * Five columns have to move together for that to be true, so they are written
 * here and nowhere else — a caller that sets `marketing_emails_enabled` on its
 * own produces a send permission with no evidence behind it.
 *
 * 🚨 WITHDRAWAL DOES NOT ERASE THE CONSENT COLUMNS. Opting out clears the send
 * permission and stamps `marketing_unsubscribed_at`; the timestamp/source/version
 * of the original opt-in stay exactly where they are. "Never agreed" and "agreed
 * in March, withdrew in August" are different facts, and wiping the provenance
 * on withdrawal collapses them into one — which loses the audit trail at the
 * precise moment it is most likely to be asked for.
 */
class MarketingConsent
{
    /**
     * Attributes for an account that is being CREATED.
     *
     * Returned rather than written, because registration composes one array and
     * hands it to `User::create()` — there is no model to update yet.
     *
     * ⚠️ `marketing_emails_enabled` is set EXPLICITLY here even though the column
     * default is now false. The default is defence in depth; a value the
     * application states outright is what makes the behaviour testable and
     * driver-independent (the test suite runs on SQLite, where the default
     * migration is a no-op).
     *
     * @return array<string, mixed>
     */
    public static function attributesForSignup(bool $granted, string $source): array
    {
        if (! $granted) {
            // Not "opted out" — never asked for. No unsubscribe timestamp,
            // because nothing was ever withdrawn.
            return [
                'marketing_emails_enabled' => false,
                'marketing_email_consent' => false,
                'marketing_consent_timestamp' => null,
                'marketing_consent_source' => null,
                'marketing_consent_version' => null,
                'marketing_unsubscribed_at' => null,
            ];
        }

        return [
            'marketing_emails_enabled' => true,
            'marketing_email_consent' => true,
            'marketing_consent_timestamp' => now(),
            'marketing_consent_source' => $source,
            'marketing_consent_version' => self::currentVersion(),
            'marketing_unsubscribed_at' => null,
        ];
    }

    /**
     * Attributes for a consent GRANTED by an existing account.
     *
     * Every fresh opt-in re-stamps the timestamp, source and version: somebody
     * who unsubscribed last year and opts back in today has consented today, to
     * today's wording. Keeping the old stamp would evidence the wrong thing.
     *
     * @return array<string, mixed>
     */
    public static function attributesForGrant(string $source): array
    {
        return self::attributesForSignup(true, $source);
    }

    /**
     * Attributes for a consent WITHDRAWN.
     *
     * Only the two live columns move. See the class note: the provenance of the
     * original opt-in is deliberately left intact.
     *
     * @return array<string, mixed>
     */
    public static function attributesForWithdrawal(): array
    {
        return [
            'marketing_emails_enabled' => false,
            'marketing_email_consent' => false,
            'marketing_unsubscribed_at' => now(),
        ];
    }

    /** The wording version any consent captured right now is agreeing to. */
    public static function currentVersion(): string
    {
        return (string) config('marketing_consent.current', 'v1');
    }

    /**
     * The label to render beside the checkbox, for the current version.
     *
     * 🚨 AN EMPTY LABEL REMOVES THE ONLY WAY CONSENT IS EVER CAPTURED, SO IT
     * MUST BE LOUD. `ReviewStep.jsx` guards the checkbox on this string, so a
     * `current` key pointing at a version that does not exist — a typo while
     * bumping the wording — makes the box silently vanish from signup. Nothing
     * errors, the build passes, the tests pass, and consent quietly stops being
     * collected for as long as nobody notices. That is the one failure mode of
     * this feature that can survive for months.
     *
     * It logs rather than throws: a misconfigured label must not take
     * registration down with it. The `??` fallback keeps the box on screen with
     * the last-known-good wording so signups still capture SOMETHING, and the
     * version recorded alongside it still names the version that was intended
     * — which is what the log is for.
     */
    public static function currentLabel(): string
    {
        $version = self::currentVersion();
        $label = (string) config("marketing_consent.versions.{$version}.label", '');

        if ($label === '') {
            Log::error('MarketingConsent: no wording configured for the current consent version — the signup checkbox will not render.', [
                'current_version' => $version,
                'configured_versions' => array_keys((array) config('marketing_consent.versions', [])),
            ]);

            return self::fallbackLabel();
        }

        return $label;
    }

    /**
     * Any wording we have, when the configured one is missing.
     *
     * A checkbox with slightly stale wording is a far smaller problem than no
     * checkbox at all: the first captures a consent whose recorded version is
     * checkable against this log, the second captures nothing and says nothing.
     */
    private static function fallbackLabel(): string
    {
        $versions = (array) config('marketing_consent.versions', []);

        foreach ($versions as $version) {
            $label = (string) ($version['label'] ?? '');

            if ($label !== '') {
                return $label;
            }
        }

        return '';
    }

    /**
     * Record that this address must not receive marketing again.
     *
     * 🚨 NEVER THROWS. Every caller is inside an unsubscribe click or a
     * preference save, and the opt-out itself has already been written to the
     * user row by the time we get here. Failing loudly would turn a suppression
     * bookkeeping problem into "your unsubscribe did not work" — the worst
     * possible error on this path. Same house pattern as VisitTracker and the
     * security-event writers: catch, warn, carry on.
     */
    public static function suppress(?string $email, string $source, ?int $userId = null): void
    {
        try {
            $normalised = MarketingSuppression::normalise($email);

            if ($normalised === '' || ! str_contains($normalised, '@')) {
                return;
            }

            if (! Schema::hasTable('marketing_suppressions')) {
                return;
            }

            MarketingSuppression::updateOrCreate(
                ['email' => $normalised],
                ['suppressed_at' => now(), 'source' => $source, 'user_id' => $userId],
            );
        } catch (\Throwable $e) {
            Log::warning('MarketingConsent::suppress failed', [
                'source' => $source,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Lift a suppression because the person has affirmatively opted back in.
     *
     * ⚠️ ONLY ever call this from a path where the PERSON acted — a ticked box,
     * a preference save they submitted. Never from a purchase, a return visit or
     * a time interval: under PECR an opt-out is withdrawn consent, and inferring
     * a new one from behaviour is the thing the client's Developer Master Plan
     * (19 Aug 2026, §E) flags as needing legal sign-off before implementation.
     */
    public static function unsuppress(?string $email): void
    {
        try {
            $normalised = MarketingSuppression::normalise($email);

            if ($normalised === '' || ! Schema::hasTable('marketing_suppressions')) {
                return;
            }

            MarketingSuppression::where('email', $normalised)->delete();
        } catch (\Throwable $e) {
            Log::warning('MarketingConsent::unsuppress failed', ['error' => $e->getMessage()]);
        }
    }

    /** Is this address suppressed? Checked before any marketing send. */
    public static function isSuppressed(?string $email): bool
    {
        try {
            $normalised = MarketingSuppression::normalise($email);

            if ($normalised === '' || ! Schema::hasTable('marketing_suppressions')) {
                return false;
            }

            return MarketingSuppression::where('email', $normalised)->exists();
        } catch (\Throwable $e) {
            Log::warning('MarketingConsent::isSuppressed failed', ['error' => $e->getMessage()]);

            // ⚠️ Fails OPEN, and that is the lesser evil here rather than a
            // preference. A DB fault would otherwise silence all marketing mail
            // platform-wide and look like a delivery bug for days. The user-row
            // consent gate in EmailService still runs and is unaffected — this
            // is the second of two checks, not the only one.
            return false;
        }
    }
}
