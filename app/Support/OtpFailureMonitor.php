<?php

namespace App\Support;

use App\Models\SecurityEvent;
use Illuminate\Support\Facades\Log;

/**
 * OTP failures — Security Checklist §3.
 *
 * The audit found both halves logged and neither alerted: the admin panel wrote
 * a `login_logs` row for every wrong 2FA code, and the website's step-up flow
 * kept a cache counter it threw away. Nobody was told either way.
 *
 * 🚨 TWO POPULATIONS, TWO THRESHOLDS, and conflating them would have produced
 * either silence or noise:
 *
 *  - AN ADMIN'S 2FA CODE is a six-digit number from an authenticator app the
 *    admin is holding. Three wrong inside ten minutes is a broken authenticator
 *    or somebody guessing, and both are worth a look — per admin.
 *  - THE WEBSITE'S STEP-UP CODE is emailed to ordinary supporters mid-checkout,
 *    and a handful mistype it every single day. Alerting per person would mail
 *    constantly and mean nothing. What IS meaningful is a SPIKE, so the website
 *    side thresholds on the platform-wide count in the same window.
 *
 * 🚨 THE CODE ITSELF IS NEVER RECORDED. Not the attempted value, not the
 * expected one — a security alert that quotes an OTP is worse than no alert.
 * Only the fact of a failure, who it was for, and from where.
 *
 * 🚨 NEVER THROWS.
 */
class OtpFailureMonitor
{
    /**
     * A wrong 2FA code on an admin sign-in.
     */
    public static function recordAdminFailure(?int $adminId, ?string $email, ?string $ip, ?string $reason = null): void
    {
        try {
            $ip = SecurityRedactor::ip($ip);

            SecurityEventLog::record(SecurityEvent::OTP_FAILED, [
                'severity' => 'info',
                'admin_id' => $adminId,
                'email' => $email,
                'ip_address' => $ip,
                'description' => 'Wrong 2FA code on an admin sign-in: '.SecurityRedactor::scrub($reason ?: 'invalid OTP'),
                'context' => ['scope' => 'admin'],
            ]);

            if (! $adminId) {
                return;
            }

            $threshold = (int) config('security_alerts.otp_failure.threshold', 3);
            $window = (int) config('security_alerts.otp_failure.window_minutes', 10);

            $count = SecurityEventLog::countRecent(SecurityEvent::OTP_FAILED, $window, ['admin_id' => $adminId]);

            if ($count < $threshold) {
                return;
            }

            $burst = SecurityEventLog::record(SecurityEvent::OTP_FAILED_BURST, [
                'severity' => 'critical',
                'admin_id' => $adminId,
                'email' => $email,
                'ip_address' => $ip,
                'description' => "{$count} wrong 2FA codes for this admin in {$window} minutes.",
                'context' => [
                    'scope' => 'admin',
                    'failures' => $count,
                    'window_minutes' => $window,
                    'threshold' => $threshold,
                ],
            ]);

            SecurityAlert::raise(
                'Repeated 2FA failures on an admin account',
                "{$count} wrong 2FA codes were entered for one admin account in the last {$window} minutes. Whoever is at the keyboard has the password and not the second factor.",
                [[
                    'heading' => 'Admin 2FA',
                    'rows' => [
                        'Admin — '.SecurityRedactor::maskEmail($email),
                        'IP — '.$ip,
                        'Wrong codes — '.$count.' in '.$window.' minutes (threshold '.$threshold.')',
                    ],
                ]],
                [
                    'event' => $burst,
                    'emoji' => '🚨',
                    'cooldown_key' => 'otp_admin:'.$adminId,
                    'cooldown_minutes' => (int) config('security_alerts.otp_failure.cooldown_minutes', 60),
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('OtpFailureMonitor::recordAdminFailure failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * A wrong step-up code on the public platform. Thresholded platform-wide —
     * see the class docblock for why per-person would be useless here.
     */
    public static function recordPlatformFailure(?int $userId, ?string $email, ?string $ip, ?string $subjectId = null): void
    {
        try {
            $ip = SecurityRedactor::ip($ip);

            SecurityEventLog::record(SecurityEvent::OTP_FAILED, [
                'severity' => 'info',
                'user_id' => $userId,
                'email' => $email,
                'ip_address' => $ip,
                'subject_type' => 'risk_identity',
                'subject_id' => $subjectId,
                'description' => 'Wrong step-up verification code at checkout.',
                'context' => ['scope' => 'platform'],
            ]);

            $burstThreshold = (int) config('security_alerts.otp_failure.platform_burst_threshold', 20);
            $window = (int) config('security_alerts.otp_failure.window_minutes', 10);

            $count = SecurityEventLog::countRecent(SecurityEvent::OTP_FAILED, $window, ['app' => SecurityEventLog::app()]);

            if ($count < $burstThreshold) {
                return;
            }

            $burst = SecurityEventLog::record(SecurityEvent::OTP_FAILED_BURST, [
                'severity' => 'warning',
                'description' => "{$count} step-up verification codes failed platform-wide in {$window} minutes.",
                'context' => [
                    'scope' => 'platform',
                    'failures' => $count,
                    'window_minutes' => $window,
                    'threshold' => $burstThreshold,
                ],
            ]);

            SecurityAlert::raise(
                'Step-up verification failing across the platform',
                "{$count} step-up codes failed in the last {$window} minutes. One supporter mistyping a code is normal; this many at once is either an attack on the step-up flow or the delivery of those codes is broken.",
                [[
                    'heading' => 'Step-up verification',
                    'rows' => [
                        'Failures — '.$count.' in '.$window.' minutes (threshold '.$burstThreshold.')',
                        'Most recent IP — '.$ip,
                    ],
                ]],
                [
                    'event' => $burst,
                    'emoji' => '⚠️',
                    'cooldown_key' => 'otp_platform',
                    'cooldown_minutes' => (int) config('security_alerts.otp_failure.cooldown_minutes', 60),
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('OtpFailureMonitor::recordPlatformFailure failed', ['error' => $e->getMessage()]);
        }
    }
}
