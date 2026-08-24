<?php

namespace App\Support;

use App\Models\SecurityEvent;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * "Where does this creator's money go, and who changed it?" — Security
 * Checklist §3.
 *
 * The audit found this row completely open: `users.account_id` — the Stripe
 * connected account every payout is sent to — is rewritten by bare `$user->save()`
 * calls in four places in `Auth\StripeController`, with no audit row and no
 * alert, and the `account.updated` webhook had no `external_account` branch at
 * all. Changing where the money lands is the single highest-value thing an
 * account takeover does, and nothing on the platform noticed it happening.
 *
 * 🚨 DETECTION ONLY. This records and alerts. It does NOT re-authenticate, does
 * NOT block the change, and does NOT touch any user-facing auth flow — whether
 * to add friction to a payout-destination change is a separate decision the
 * client has not made, and quietly adding a step-up here would make it for them.
 *
 * 🚨 NO THRESHOLD, NO COOLDOWN. A payout destination changes a handful of times
 * a year across the whole platform, so there is no volume to protect an inbox
 * from — and suppressing a repeat would suppress exactly the case that matters
 * (destination changed, then changed back an hour later).
 *
 * 🚨 THE ALERT CARRIES MASKED IDS ONLY. `SecurityRedactor::maskId()` keeps the
 * prefix (which says whether the value is even the right KIND of object — a
 * `cus_` sitting in `account_id` is a real bug this platform has hit) and the
 * last four, which is what an admin needs to match it in the Stripe dashboard.
 * A bank account number or sort code is never read here at all.
 *
 * 🚨 NEVER THROWS. Callers are mid-onboarding or mid-webhook.
 */
class PayoutDestinationAudit
{
    /**
     * The Stripe connected account a creator is paid into has been replaced.
     *
     * @param  string  $source  where the change came from — the controller method or 'webhook'
     */
    public static function recordAccountChange(?User $user, ?string $oldAccountId, ?string $newAccountId, string $source): void
    {
        try {
            if (! $user || (string) $oldAccountId === (string) $newAccountId) {
                return;
            }

            $old = SecurityRedactor::maskId($oldAccountId);
            $new = SecurityRedactor::maskId($newAccountId);

            // A first-time connection is not a "change" in the sense that
            // matters — there was nothing to redirect money away from. It is
            // still recorded, but at info, and it does not raise an alert.
            $isFirstConnection = empty($oldAccountId);

            $event = SecurityEventLog::record(SecurityEvent::PAYOUT_DESTINATION_CHANGE, [
                'severity' => $isFirstConnection ? 'info' : 'critical',
                'user_id' => $user->id,
                'email' => $user->email,
                'ip_address' => request()?->ip(),
                'subject_type' => 'stripe_account',
                'subject_id' => $new,
                'description' => $isFirstConnection
                    ? "Stripe payout account connected for the first time ({$new}) via {$source}."
                    : "Stripe payout account changed from {$old} to {$new} via {$source}.",
                'context' => [
                    'source' => $source,
                    'old_account' => $old,
                    'new_account' => $new,
                    'first_connection' => $isFirstConnection,
                ],
            ]);

            if ($isFirstConnection || ! config('security_alerts.payout_destination.enabled', true)) {
                return;
            }

            SecurityAlert::raise(
                'Payout destination changed',
                'The Stripe connected account a creator is paid into has been replaced. Nothing has been blocked — this is a notification, not a gate.',
                [[
                    'heading' => 'Payout destination',
                    'rows' => [
                        'Creator — '.SecurityRedactor::maskEmail($user->email).' (user #'.$user->id.')',
                        'Was — '.$old,
                        'Now — '.$new,
                        'Changed via — '.SecurityRedactor::scrub($source),
                        'Request IP — '.SecurityRedactor::ip(request()?->ip()),
                    ],
                ]],
                ['event' => $event, 'emoji' => '💸'],
            );
        } catch (\Throwable $e) {
            Log::warning('PayoutDestinationAudit::recordAccountChange failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * The BANK ACCOUNT attached to a connected account has been swapped —
     * Stripe's `account.updated` with `external_account` among its changed
     * fields. Same money, one level further down; the connected account id does
     * not move, so `recordAccountChange` can never see this one.
     *
     * ⚠️ Only the last four digits and the bank name are read, because that is
     * all Stripe puts on the object and all anybody needs. The full number is
     * not available to this platform and must never be made so.
     *
     * ⚠️ The comparison is against OUR OWN LAST RECORDED VALUE, not against
     * Stripe's `previous_attributes`. The webhook router hands the handler the
     * account object alone, and more importantly `previous_attributes` is only
     * populated for the fields that changed in THAT event — so an account.updated
     * fired for an unrelated field would read as "bank account unchanged" when
     * we have never actually looked at it. Our own last sighting is the only
     * baseline that is always available.
     *
     * @param  array<string,mixed>  $descriptor  ['last4' => .., 'bank' => .., 'country' => ..]
     */
    public static function recordExternalAccountChange(?User $user, string $stripeAccountId, array $descriptor): void
    {
        try {
            $account = SecurityRedactor::maskId($stripeAccountId);

            $now = self::describe($descriptor);
            $was = self::lastKnownExternal($account);

            if ($was !== null && $was === $now) {
                return;
            }

            $event = SecurityEventLog::record(SecurityEvent::PAYOUT_DESTINATION_CHANGE, [
                'severity' => $was === null ? 'info' : 'critical',
                'user_id' => $user?->id,
                'email' => $user?->email,
                'subject_type' => 'stripe_external_account',
                'subject_id' => $account,
                'description' => $was === null
                    ? "Bank account recorded for connected account {$account}: {$now}."
                    : "Bank account on connected account {$account} changed from {$was} to {$now}.",
                'context' => [
                    'source' => 'stripe_webhook:account.updated',
                    'stripe_account' => $account,
                    'was' => $was,
                    'now' => $now,
                ],
            ]);

            // The first sighting is a baseline, not a change. Without this every
            // connected account on the platform would alert once on the first
            // webhook after deploy — a hundred mails saying nothing happened,
            // which is how an alert channel dies on day one.
            if ($was === null || ! config('security_alerts.payout_destination.enabled', true)) {
                return;
            }

            SecurityAlert::raise(
                'Creator bank account changed',
                'Stripe reports that the bank account attached to a creator\'s connected account has been replaced. Money paid out from now on lands somewhere new.',
                [[
                    'heading' => 'Bank destination',
                    'rows' => array_values(array_filter([
                        $user ? 'Creator — '.SecurityRedactor::maskEmail($user->email).' (user #'.$user->id.')' : 'Creator — not matched to a local user',
                        'Connected account — '.$account,
                        'Was — '.$was,
                        'Now — '.$now,
                    ])),
                ]],
                ['event' => $event, 'emoji' => '🏦'],
            );
        } catch (\Throwable $e) {
            Log::warning('PayoutDestinationAudit::recordExternalAccountChange failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * The last bank account we recorded for this connected account, or null if
     * we have never seen one.
     *
     * ⚠️ Reads the MASKED string back out of `security_events.context`, which is
     * the only form we store. Comparing masked-to-masked is enough: a different
     * bank or a different last four produces a different string, and two
     * accounts that agree on both are not a change anybody could act on.
     */
    private static function lastKnownExternal(string $maskedAccountId): ?string
    {
        try {
            if (! Schema::hasTable('security_events')) {
                return null;
            }

            $row = SecurityEvent::query()
                ->where('event_type', SecurityEvent::PAYOUT_DESTINATION_CHANGE)
                ->where('subject_type', 'stripe_external_account')
                ->where('subject_id', $maskedAccountId)
                ->latest('id')
                ->first();

            $value = $row?->context['now'] ?? null;

            return is_string($value) && $value !== '' ? $value : null;
        } catch (\Throwable $e) {
            Log::warning('PayoutDestinationAudit::lastKnownExternal failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * A bank account as a short, safe, comparable string.
     *
     * ⚠️ Last four ONLY. Stripe never exposes the full number and this platform
     * must never store one; the fingerprint is deliberately not used either —
     * it is stable across accounts and is itself a correlatable identifier.
     *
     * @param  array<string,mixed>  $descriptor
     */
    private static function describe(array $descriptor): string
    {
        $bank = SecurityRedactor::scrub((string) ($descriptor['bank'] ?? ''));
        $last4 = preg_replace('/\D/', '', (string) ($descriptor['last4'] ?? '')) ?: '????';
        $country = strtoupper(substr((string) ($descriptor['country'] ?? ''), 0, 2));

        return trim(($bank !== '' ? $bank.' ' : '')."••••{$last4}".($country !== '' ? " ({$country})" : ''));
    }
}
