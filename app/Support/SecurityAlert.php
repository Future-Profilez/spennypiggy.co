<?php

namespace App\Support;

use App\Mail\SecurityEventAlert;
use App\Models\SecurityEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Sends the security alerts for Security Checklist §3, and decides how often it
 * is willing to.
 *
 * 🚨 NEVER THROWS. Every caller is on a path that must succeed on its own terms
 * — a sign-in, a Stripe webhook, a scheduled refund calculation. The house rule
 * (VisitTracker, AttributionService, BlockedPaymentAlert) is catch-everything,
 * log, carry on, and it is the rule here.
 *
 * 🚨 TRANSACTIONAL, NOT MARKETING. This goes through `Mail::to()` directly and
 * must never be routed through `EmailService::sendMarketingEmail` or any other
 * consent-checking helper. It is operational mail to the platform's own staff;
 * there is no opt-out and there must never be one.
 *
 * 🚨 EVERY ALERT HAS A COOLDOWN and most have a threshold in front of them (see
 * config/security_alerts.php). An alert that arrives a hundred times an hour is
 * an inbox rule within a week, and then the one that mattered is filtered too.
 */
class SecurityAlert
{
    /**
     * Send one alert.
     *
     * @param  array<int,array{heading:string,rows:array<int,string>}>  $sections
     *                                                                             Already-safe display strings. Anything that came from a request must
     *                                                                             have been through SecurityRedactor first.
     * @param  array{cooldown_key?:string,cooldown_minutes?:int,event?:SecurityEvent|null,emoji?:string}  $options
     * @return bool true if mail was actually sent
     */
    public static function raise(string $title, string $intro, array $sections, array $options = []): bool
    {
        try {
            if (! config('security_alerts.enabled', true)) {
                return false;
            }

            $cooldownKey = $options['cooldown_key'] ?? null;
            $cooldownMinutes = (int) ($options['cooldown_minutes'] ?? 0);

            // ⚠️ Cache::add, not has()+put(). Two concurrent failed logins from
            // the same IP would both pass a has() check and both send.
            if ($cooldownKey !== null && $cooldownMinutes > 0) {
                if (! Cache::add('security_alert:'.md5($cooldownKey), true, now()->addMinutes($cooldownMinutes))) {
                    Log::info('Security alert suppressed by cooldown', [
                        'title' => $title,
                        'cooldown_minutes' => $cooldownMinutes,
                    ]);

                    return false;
                }
            }

            $recipients = self::recipients();

            if (empty($recipients)) {
                Log::warning('Security alert has no recipient configured', ['title' => $title]);

                return false;
            }

            $badge = self::badge();
            $emoji = $options['emoji'] ?? '🔐';
            $subject = '['.$badge['label'].'] '.$emoji.' '.$title;

            foreach ($recipients as $recipient) {
                Mail::to($recipient)->send(new SecurityEventAlert(
                    $subject,
                    $title,
                    $intro,
                    $sections,
                    $badge
                ));
            }

            SecurityEventLog::markAlerted($options['event'] ?? null);

            return true;
        } catch (\Throwable $e) {
            // 🚨 The observed action has already happened and must be allowed to
            // finish. A failed alert costs a missing email, not a broken login
            // or a retried webhook.
            Log::error('SecurityAlert failed to send', [
                'title' => $title,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Who hears about it. Reuses config/alerts.php — the same two lists every
     * other operational alert in this app already uses, so there is one place to
     * change an address rather than two.
     *
     * @return array<int,string>
     */
    public static function recipients(): array
    {
        return AlertRouter::recipients('security_events');
    }

    /**
     * Which system the alert is about.
     *
     * ⚠️ Local, dev and production all run this detection against different
     * databases. An alert that does not say which one it came from cannot be
     * acted on, and a production alert sitting under two identical dev ones gets
     * ignored. Mirrors admin.spennypiggy.co's App\Support\AlertEnvironment.
     *
     * @return array{label:string,colour:string,background:string,ink:string,host:string}
     */
    public static function badge(): array
    {
        $env = strtolower((string) app()->environment());

        $map = [
            'production' => ['label' => 'PRODUCTION', 'colour' => '#F26D6D', 'background' => '#FDE8E6', 'ink' => '#B4261B'],
            'staging' => ['label' => 'STAGING', 'colour' => '#E0A64D', 'background' => '#FCF1DD', 'ink' => '#8A5A00'],
            'development' => ['label' => 'DEV', 'colour' => '#00D9FF', 'background' => '#DFF6FB', 'ink' => '#00697D'],
            'local' => ['label' => 'LOCAL', 'colour' => '#8A9099', 'background' => '#EFEFF1', 'ink' => '#4F555C'],
        ];

        $picked = $map[$env] ?? [
            'label' => strtoupper($env ?: 'UNKNOWN'),
            'colour' => '#8A9099',
            'background' => '#EFEFF1',
            'ink' => '#4F555C',
        ];

        $picked['host'] = (string) parse_url((string) config('app.url'), PHP_URL_HOST) ?: (string) config('app.url');

        return $picked;
    }
}
