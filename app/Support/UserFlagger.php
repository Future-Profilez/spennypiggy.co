<?php

namespace App\Support;

use App\Models\SecurityEvent;
use App\Models\User;
use App\Models\UserFlag;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Raises admin flags. The ONLY way a flag is created.
 *
 * 🚨 NOTHING HERE MAY THROW. Every entry point sits inside something that must
 * not fail because of an observation: the ten-minute payout sweep, a sign-in, a
 * Stripe webhook, a checkout refusal. Same house pattern as `SecurityEventLog`,
 * `BlockedPaymentAlert` and `VisitTracker` — catch everything, warn, carry on. A
 * missing flag is an acceptable cost; a failed payout enforcement is not.
 *
 * 🚨 A FLAG BLOCKS NOTHING. This class only writes rows a person reads.
 *
 * ⚠️ MIRROR IN admin.spennypiggy.co. The admin app raises manual flags through
 * the same class, so both copies must agree on dedupe and severity — if they
 * disagree, the same situation produces a different number of rows depending on
 * which app noticed it.
 */
class UserFlagger
{
    /**
     * Raise a flag, or absorb it into the open one of the same type.
     *
     * Returns the row, or null if it was not written — callers must treat null
     * as "carry on", never as an error.
     *
     * @param  array<string,mixed>  $context
     */
    public static function raise(
        User|int|null $user,
        string $flagType,
        ?string $reason = null,
        array $context = [],
        string $source = 'security_event',
        ?string $severity = null,
        ?int $raisedByAdminId = null,
    ): ?UserFlag {
        try {
            if (! config('user_flags.enabled', true)) {
                return null;
            }

            if (! Schema::hasTable('user_flags')) {
                return null;
            }

            $userId = $user instanceof User ? (int) $user->id : (is_int($user) ? $user : null);

            // A flag with no account is not a flag — it is a log line, and
            // security_events already holds those.
            if (! $userId) {
                return null;
            }

            $severity ??= (string) config("user_flags.types.{$flagType}.severity", UserFlag::SEVERITY_WARNING);

            /*
             * Redacted on the way IN, not on the way out. The reason string is
             * rendered in the back office to admins who are NOT behind
             * `can:view-pii`, and a value that reaches the table raw is one
             * template change away from being on a screen.
             */
            $reason = SecurityRedactor::scrub($reason) ?: null;
            $context = self::scrubContext($context);

            $existing = self::openFlagWithinWindow($userId, $flagType);

            if ($existing) {
                /*
                 * ⚠️ `increment` on the column rather than a read-modify-write:
                 * the ten-minute sweep and a webhook can hit this at the same
                 * moment, and `$flag->occurrences + 1` loses one of them.
                 */
                $existing->increment('occurrences');

                $existing->forceFill([
                    'last_seen_at' => now(),
                    // The newest reason wins — an admin looking at a flag wants
                    // the most recent occurrence, not the first one from a month ago.
                    'reason' => $reason ?: $existing->reason,
                    'context' => $context ?: $existing->context,
                ])->save();

                return $existing->refresh();
            }

            return UserFlag::create([
                'user_id' => $userId,
                'user_role' => self::roleOf($user, $userId),
                'flag_type' => $flagType,
                'severity' => $severity,
                'status' => UserFlag::STATUS_OPEN,
                'source' => $source,
                'reason' => $reason,
                'context' => $context ?: null,
                'occurrences' => 1,
                'first_seen_at' => now(),
                'last_seen_at' => now(),
                'raised_by_admin_id' => $raisedByAdminId,
            ]);
        } catch (\Throwable $e) {
            Log::warning('UserFlagger::raise failed', [
                'flag_type' => $flagType,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Turn a security_events row into a flag, where that type warrants one.
     *
     * 🚨 SEVERITY IS THE FILTER. `content_download` is written on EVERY paid
     * download and `login_failed` on every wrong password, both at `info`; only
     * the burst rows carry `warning`/`critical`. PayoutDestinationAudit records a
     * creator's FIRST bank connection at `info` on purpose, because there was
     * nothing to redirect money away from — flagging it would raise one flag for
     * every creator who ever onboards. So `info` is ignored outright and the
     * config map never has to list the noisy half of a pair.
     */
    public static function fromSecurityEvent(?SecurityEvent $event): ?UserFlag
    {
        try {
            if (! $event || ! $event->user_id) {
                return null;
            }

            if (($event->severity ?? 'info') === UserFlag::SEVERITY_INFO) {
                return null;
            }

            $map = (array) config('user_flags.security_event_types', []);
            $flagType = $map[$event->event_type] ?? null;

            if (! $flagType) {
                return null;
            }

            return self::raise(
                user: (int) $event->user_id,
                flagType: $flagType,
                // Already scrubbed by SecurityEventLog on the way into that table.
                reason: $event->description,
                context: array_filter([
                    'security_event_id' => $event->id,
                    'ip_address' => $event->ip_address,
                ], fn ($value) => $value !== null),
                source: 'security_event',
                severity: $event->severity,
            );
        } catch (\Throwable $e) {
            Log::warning('UserFlagger::fromSecurityEvent failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * The open flag of this type that a repeat should be absorbed into.
     *
     * ⚠️ A RESOLVED FLAG IS NEVER REOPENED. Once an admin has said "looked at
     * this", the same thing happening again is a NEW incident and gets its own
     * row — otherwise the resolution silently swallows a recurrence, which is
     * the one case where a recurrence matters most.
     */
    private static function openFlagWithinWindow(int $userId, string $flagType): ?UserFlag
    {
        $days = (int) config('user_flags.dedupe_days', 30);

        return UserFlag::query()
            ->where('user_id', $userId)
            ->where('flag_type', $flagType)
            ->where('status', UserFlag::STATUS_OPEN)
            ->where('last_seen_at', '>=', now()->subDays($days))
            ->orderByDesc('id')
            ->first();
    }

    /**
     * Snapshot the role. Once the user row is deleted nothing else can say
     * whether the flag was about a creator or a gifter.
     */
    private static function roleOf(User|int|null $user, int $userId): ?int
    {
        if ($user instanceof User) {
            return $user->role !== null ? (int) $user->role : null;
        }

        $role = User::query()->whereKey($userId)->value('role');

        return $role !== null ? (int) $role : null;
    }

    /**
     * Same rule as SecurityEventLog: a key whose NAME says the value is a secret
     * is dropped whole rather than pattern-matched. A pattern only catches the
     * shapes it already knows.
     *
     * @param  array<string,mixed>  $context
     * @return array<string,mixed>
     */
    private static function scrubContext(array $context): array
    {
        $banned = ['password', 'secret', 'token', 'otp', 'code', 'card', 'cvc', 'iban', 'sort_code', 'account_number', 'document', 'id_number'];

        $clean = [];

        foreach ($context as $key => $value) {
            $lowerKey = strtolower((string) $key);

            foreach ($banned as $word) {
                if (str_contains($lowerKey, $word)) {
                    continue 2;
                }
            }

            if (is_string($value)) {
                $clean[$key] = SecurityRedactor::scrub($value);
            } elseif (is_scalar($value) || $value === null) {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }
}
