<?php

namespace App\Support;

use App\Models\SecurityEvent;
use Illuminate\Support\Facades\Log;

/**
 * "Bulk content downloads" — Security Checklist §3.
 *
 * The audit found `TaskController::download` checking the purchase and then
 * streaming the file while recording NOTHING. A buyer with one valid purchase
 * could walk the whole catalogue and the only trace would be the CDN's own
 * access log, which nobody on this platform reads.
 *
 * 🚨 THIS IS AN ACCESS LOG, NOT A GATE. It records every authorised download
 * and alerts on a burst. It does not refuse anything — a buyer who is being
 * mailed about is still a buyer, and blocking a paid download on a heuristic is
 * the worst possible false positive.
 *
 * 🚨 THE FILE IS NEVER NAMED. `deliverable_content` is either a storage path or
 * a live URL to the thing the supporter paid for; putting either in an alert
 * would turn the alert into a way of getting the file. The item is identified
 * by its own uuid, which is what an admin needs to look it up.
 *
 * Threshold: 20 downloads by one account in 60 minutes. A buyer downloads what
 * they bought — one file, occasionally a few if they switch device. Twenty in an
 * hour is a script.
 *
 * 🚨 NEVER THROWS. It runs on a paid download.
 */
class ContentDownloadMonitor
{
    public static function record(?int $userId, string $subjectType, ?string $subjectId, ?string $ownerLabel = null): void
    {
        try {
            SecurityEventLog::record(SecurityEvent::CONTENT_DOWNLOAD, [
                'severity' => 'info',
                'user_id' => $userId,
                'ip_address' => request()?->ip(),
                'subject_type' => $subjectType,
                'subject_id' => $subjectId ? substr($subjectId, 0, 64) : null,
                'description' => 'Paid content downloaded'.($ownerLabel ? ' ('.SecurityRedactor::scrub($ownerLabel).')' : '').'.',
                'context' => ['subject_type' => $subjectType],
            ]);

            if (! $userId) {
                return;
            }

            $threshold = (int) config('security_alerts.content_download.threshold', 20);
            $window = (int) config('security_alerts.content_download.window_minutes', 60);

            $count = SecurityEventLog::countRecent(SecurityEvent::CONTENT_DOWNLOAD, $window, ['user_id' => $userId]);

            if ($count < $threshold) {
                return;
            }

            $distinctItems = SecurityEventLog::countRecentDistinct(
                SecurityEvent::CONTENT_DOWNLOAD,
                'subject_id',
                $window,
                ['user_id' => $userId]
            );

            $burst = SecurityEventLog::record(SecurityEvent::CONTENT_DOWNLOAD_BURST, [
                'severity' => 'warning',
                'user_id' => $userId,
                'ip_address' => request()?->ip(),
                'description' => "{$count} paid downloads across {$distinctItems} items in {$window} minutes.",
                'context' => [
                    'downloads' => $count,
                    'distinct_items' => $distinctItems,
                    'window_minutes' => $window,
                    'threshold' => $threshold,
                ],
            ]);

            SecurityAlert::raise(
                'Bulk content download',
                "One account downloaded {$count} paid items in the last {$window} minutes. Nothing was blocked — every one of these passed its purchase check. This is a rate worth looking at, not a refusal.",
                [[
                    'heading' => 'Download burst',
                    'rows' => [
                        'Account — user #'.$userId,
                        'Downloads — '.$count.' in '.$window.' minutes (threshold '.$threshold.')',
                        'Distinct items — '.$distinctItems,
                        'IP — '.SecurityRedactor::ip(request()?->ip()),
                    ],
                ]],
                [
                    'event' => $burst,
                    'emoji' => '📦',
                    // Six hours. A scraper still running six hours later earns a
                    // second mail; one an hour does not.
                    'cooldown_key' => 'content_download:'.$userId,
                    'cooldown_minutes' => (int) config('security_alerts.content_download.cooldown_minutes', 360),
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('ContentDownloadMonitor::record failed', ['error' => $e->getMessage()]);
        }
    }
}
