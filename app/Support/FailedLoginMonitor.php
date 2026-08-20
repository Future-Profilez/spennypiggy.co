<?php

namespace App\Support;

use App\Models\SecurityEvent;
use Illuminate\Support\Facades\Log;

/**
 * "5+ failed logins from one IP" — Security Checklist §3.
 *
 * 🚨 KEYED ON THE IP ALONE. Both apps already throttle logins on `email|ip`,
 * which means one IP working through five different addresses tripped nothing
 * at all: each address had its own counter, and none of them reached five. That
 * is precisely the shape of a credential-stuffing run, and it was invisible.
 * This counter ignores the address on purpose.
 *
 * 🚨 NEVER THROWS. It runs inside a failed sign-in. A failure here must cost a
 * missing row, never a user who cannot get in.
 *
 * ⚠️ Counted from the `security_events` table rather than a cache counter — a
 * cache flush or a worker restart must not reset a brute-force count to zero at
 * the exact moment it matters.
 *
 * ⚠️ The count is NOT scoped to one app, deliberately. Both apps write to the
 * same `security_events` table, so an IP trying the public login and the back
 * office alternately is counted once rather than twice under its own threshold —
 * which is the worse behaviour and the one worth catching. The cooldown IS
 * per-door, so each app can say its own piece.
 *
 * ⚠️ Past the threshold, every further failure inside the window writes another
 * burst row while the cooldown holds the mail. That is intended: `alerted_at`
 * null on those rows is the record that it kept happening and we chose not to
 * shout again.
 */
class FailedLoginMonitor
{
    /**
     * Record one failed sign-in and alert if this IP has crossed the threshold.
     *
     * @param  string  $guard  'website' or 'admin' — which door was tried
     */
    public static function record(
        string $email,
        ?string $ip,
        ?string $reason = null,
        ?int $userId = null,
        ?int $adminId = null,
        string $guard = 'website',
    ): void {
        try {
            $ip = SecurityRedactor::ip($ip);

            SecurityEventLog::record(SecurityEvent::LOGIN_FAILED, [
                'severity' => 'info',
                'user_id' => $userId,
                'admin_id' => $adminId,
                'email' => $email,
                'ip_address' => $ip,
                'description' => 'Failed sign-in on the '.$guard.' login: '.SecurityRedactor::scrub($reason ?: 'invalid credentials'),
                'context' => ['guard' => $guard],
            ]);

            if ($ip === '(unknown)') {
                // Nothing to threshold on. A row is still written above — the
                // event happened — but "unknown" is not an origin to count.
                return;
            }

            $threshold = (int) config('security_alerts.failed_login.threshold', 5);
            $window = (int) config('security_alerts.failed_login.window_minutes', 15);

            $count = SecurityEventLog::countRecent(SecurityEvent::LOGIN_FAILED, $window, ['ip_address' => $ip]);

            if ($count < $threshold) {
                return;
            }

            $distinctAccounts = SecurityEventLog::countRecentDistinct(
                SecurityEvent::LOGIN_FAILED,
                'email',
                $window,
                ['ip_address' => $ip]
            );

            $sprayFloor = (int) config('security_alerts.failed_login.spray_distinct_accounts', 3);
            $isSpray = $distinctAccounts >= $sprayFloor;

            $burst = SecurityEventLog::record(SecurityEvent::LOGIN_FAILED_BURST, [
                // Many accounts from one origin is a list being worked through;
                // one account is somebody who forgot their password. Different
                // severities because they need different responses.
                'severity' => $isSpray ? 'critical' : 'warning',
                'ip_address' => $ip,
                'description' => "{$count} failed sign-ins from this IP across {$distinctAccounts} account(s) in {$window} minutes.",
                'context' => [
                    'guard' => $guard,
                    'failures' => $count,
                    'distinct_accounts' => $distinctAccounts,
                    'window_minutes' => $window,
                    'threshold' => $threshold,
                ],
            ]);

            SecurityAlert::raise(
                $isSpray
                    ? 'Credential stuffing — one IP, many accounts'
                    : 'Repeated failed sign-ins from one IP',
                $isSpray
                    ? "{$count} sign-ins failed from a single IP against {$distinctAccounts} different accounts in the last {$window} minutes. The per-account lockout cannot see this pattern, because it counts each account separately."
                    : "{$count} sign-ins failed from a single IP in the last {$window} minutes.",
                [[
                    'heading' => 'Origin',
                    'rows' => [
                        'IP — '.$ip,
                        'Door — '.($guard === 'admin' ? 'admin back office' : 'public platform'),
                        'Failures — '.$count.' in '.$window.' minutes (threshold '.$threshold.')',
                        'Accounts targeted — '.$distinctAccounts,
                        'Most recent address — '.SecurityRedactor::maskEmail($email),
                    ],
                ]],
                [
                    'event' => $burst,
                    'emoji' => $isSpray ? '🚨' : '⚠️',
                    // One mail per IP per hour. A brute-force run lasts hours;
                    // being told it is still going once an hour is actionable,
                    // sixty times is not.
                    'cooldown_key' => 'failed_login:'.$guard.':'.$ip,
                    'cooldown_minutes' => (int) config('security_alerts.failed_login.cooldown_minutes', 60),
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('FailedLoginMonitor::record failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * A framework `Lockout` fired — the rate limiter has already decided this is
     * too many attempts, so there is no threshold of ours to apply on top. Only
     * a cooldown, so a script that keeps hitting a locked key does not mail on
     * every retry.
     */
    public static function lockout(?string $ip, ?string $email, string $guard = 'website'): void
    {
        try {
            $ip = SecurityRedactor::ip($ip);

            $event = SecurityEventLog::record(SecurityEvent::LOGIN_LOCKOUT, [
                'severity' => 'warning',
                'email' => $email,
                'ip_address' => $ip,
                'description' => 'Login rate limit reached — further attempts are being refused.',
                'context' => ['guard' => $guard],
            ]);

            SecurityAlert::raise(
                'Login lockout triggered',
                'A login rate limit was reached, so the platform is now refusing attempts for this key. Until now this event fired with no listener registered at all, so nobody was ever told.',
                [[
                    'heading' => 'Lockout',
                    'rows' => [
                        'IP — '.$ip,
                        'Account — '.SecurityRedactor::maskEmail($email),
                        'Door — '.($guard === 'admin' ? 'admin back office' : 'public platform'),
                    ],
                ]],
                [
                    'event' => $event,
                    'emoji' => '🔒',
                    'cooldown_key' => 'lockout:'.$guard.':'.$ip,
                    'cooldown_minutes' => (int) config('security_alerts.lockout.cooldown_minutes', 30),
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('FailedLoginMonitor::lockout failed', ['error' => $e->getMessage()]);
        }
    }
}
