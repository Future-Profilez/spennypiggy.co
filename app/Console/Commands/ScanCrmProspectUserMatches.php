<?php

namespace App\Console\Commands;

use App\Models\CrmCreator;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ScanCrmProspectUserMatches extends Command
{
    protected $signature = 'crm:scan-prospect-user-matches {--dry-run} {--limit=500} {--force}';

    protected $description = 'Scan CRM prospects and set social match suggestions when a matching user exists.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $limit = max(1, (int) $this->option('limit'));

        // Pre-signup stages only — a prospect with an account needs no matching.
        //
        // These are the admin app's CrmStages::preSignupKeys(); the two apps
        // share this database but not their code, so the list is mirrored here
        // and must be kept in step. The legacy names are included because a row
        // migrated by hand, or written by an old deploy still in flight, would
        // otherwise drop out of matching silently.
        $preSignup = [
            'prospect', 'contacted', 'responded', 'call_booked', 'approved',
            'outreach_sent', 'in_conversation',
        ];

        $query = CrmCreator::query()
            ->whereNull('deleted_at')
            ->whereNull('user_id')
            ->whereIn('crm_stage', $preSignup);

        if (! $force) {
            $query->whereNull('social_match_suggested_at');
        }

        $creators = $query
            ->orderBy('id')
            ->limit($limit)
            ->get();

        if ($creators->count() === 0) {
            $this->info('No CRM creators to scan.');

            return self::SUCCESS;
        }

        $updated = 0;
        foreach ($creators as $creator) {
            $matchUserId = $this->findMatchingUserId($creator);

            if ($matchUserId) {
                if (! $dryRun) {
                    $creator->social_match_suggested_at = Carbon::now();
                    $creator->social_match_suggested_user_id = $matchUserId;
                    $creator->save();
                }
                $updated++;
            } elseif ($force && ! $dryRun) {
                $creator->social_match_suggested_at = null;
                $creator->social_match_suggested_user_id = null;
                $creator->save();
            }
        }

        $this->info("Scanned CRM creators: {$creators->count()}. Suggestions set: {$updated}".($dryRun ? ' (dry-run)' : ''));

        return self::SUCCESS;
    }

    private function findMatchingUserId(CrmCreator $creator): ?int
    {
        $fullName = trim((string) $creator->full_name);
        $username = $this->normalizeHandle($creator->username);
        $email = trim(strtolower((string) $creator->email));
        $bio = trim(strtolower((string) $creator->notes));

        $x = $this->normalizeHandle($creator->twitter);
        $ig = $this->normalizeHandle($creator->instagram);
        $yt = $this->normalizeHandle($creator->youtube);
        $tw = $this->normalizeHandle($creator->twitch);
        $web = $this->normalizeUrlOrHandle($creator->website);

        $query = User::query()
            ->whereNull('deleted_at')
            ->where(function ($q) use ($fullName, $username, $email, $bio, $x, $ig, $yt, $tw, $web) {
                if ($email !== '') {
                    $q->orWhereRaw("LOWER(COALESCE(email,'')) = ?", [$email]);
                }
                if ($username) {
                    $q->orWhereRaw("LOWER(COALESCE(username,'')) = ?", [$username]);
                }
                if (mb_strlen($fullName) >= 3) {
                    $q->orWhereRaw("LOWER(COALESCE(name,'')) LIKE ?", ['%'.strtolower($fullName).'%']);
                }
                if (mb_strlen($bio) >= 6) {
                    $q->orWhereRaw("LOWER(COALESCE(bio,'')) LIKE ?", ['%'.$bio.'%']);
                }

                // Social handles use exact, normalized equality (strip surrounding @). Substring (LIKE %x%)
                // matching let a user spoof a prospect by setting a partially-overlapping handle.
                if ($x && mb_strlen($x) >= 3) {
                    $q->orWhereHas('social_links', function ($sq) use ($x) {
                        $sq->whereRaw("LOWER(TRIM(BOTH '@' FROM TRIM(COALESCE(twitter,'')))) = ?", [$x]);
                    });
                }
                if ($ig && mb_strlen($ig) >= 3) {
                    $q->orWhereHas('social_links', function ($sq) use ($ig) {
                        $sq->whereRaw("LOWER(TRIM(BOTH '@' FROM TRIM(COALESCE(instagram,'')))) = ?", [$ig]);
                    });
                }
                if ($yt && mb_strlen($yt) >= 3) {
                    $q->orWhereHas('social_links', function ($sq) use ($yt) {
                        $sq->whereRaw("LOWER(TRIM(BOTH '@' FROM TRIM(COALESCE(youtube,'')))) = ?", [$yt]);
                    });
                }
                if ($tw && mb_strlen($tw) >= 3) {
                    $q->orWhereHas('social_links', function ($sq) use ($tw) {
                        $sq->whereRaw("LOWER(TRIM(BOTH '@' FROM TRIM(COALESCE(twitch,'')))) = ?", [$tw]);
                    });
                }
                if ($web) {
                    $q->orWhereHas('social_links', function ($sq) use ($web) {
                        $sq->whereRaw("LOWER(COALESCE(other,'')) LIKE ?", ['%'.$web.'%']);
                    });
                }
            })
            ->orderByDesc('id')
            ->select(['id'])
            ->limit(1);

        $match = $query->first();

        return $match ? (int) $match->id : null;
    }

    private function normalizeHandle($value): ?string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '') {
            return null;
        }

        $v = strtolower($raw);
        $v = trim($v);
        $v = ltrim($v, '@');
        $v = rtrim($v, '/');

        $urlish = $v;
        if (! str_contains($urlish, '://') && (str_contains($urlish, '.') && str_contains($urlish, '/'))) {
            $urlish = 'https://'.$urlish;
        }

        $host = null;
        $path = null;
        if (str_contains($urlish, '://')) {
            $parts = parse_url($urlish);
            $host = strtolower((string) ($parts['host'] ?? ''));
            $path = (string) ($parts['path'] ?? '');
        }

        if ($host) {
            $host = preg_replace('/^www\./', '', $host);
            $segments = array_values(array_filter(explode('/', trim($path ?? '', '/'))));

            $first = $segments[0] ?? null;
            if ($first !== null) {
                $first = ltrim($first, '@');
            }

            if (in_array($host, ['twitter.com', 'x.com'], true)) {
                return $first ?: null;
            }
            if ($host === 'instagram.com') {
                return $first ?: null;
            }
            if ($host === 'tiktok.com') {
                foreach ($segments as $seg) {
                    if (str_starts_with($seg, '@')) {
                        return ltrim($seg, '@') ?: null;
                    }
                }

                return $first ?: null;
            }
            if ($host === 'twitch.tv') {
                return $first ?: null;
            }
            if (in_array($host, ['youtube.com', 'm.youtube.com', 'www.youtube.com', 'youtu.be'], true)) {
                if (str_starts_with((string) ($segments[0] ?? ''), '@')) {
                    return ltrim((string) $segments[0], '@') ?: null;
                }
                if (($segments[0] ?? null) === 'channel' && isset($segments[1])) {
                    return trim((string) $segments[1]) ?: null;
                }
                if (($segments[0] ?? null) === 'c' && isset($segments[1])) {
                    return trim((string) $segments[1]) ?: null;
                }

                return $first ?: null;
            }
        }

        $v = preg_replace('/^https?:\/\//', '', $v);
        $v = preg_replace('/^www\./', '', $v);
        $v = trim($v, " \t\n\r\0\x0B/");
        $v = ltrim($v, '@');

        return $v === '' ? null : $v;
    }

    private function normalizeUrlOrHandle($value): ?string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '') {
            return null;
        }
        $v = strtolower($raw);
        $v = preg_replace('/^https?:\/\//', '', $v);
        $v = preg_replace('/^www\./', '', $v);
        $v = rtrim($v, '/');

        return $v === '' ? null : $v;
    }
}
