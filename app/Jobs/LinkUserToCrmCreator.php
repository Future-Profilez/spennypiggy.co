<?php

namespace App\Jobs;

use App\Models\CrmCreator;
use App\Models\CrmCreatorStageHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Schema;

class LinkUserToCrmCreator implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $userId;

    public ?string $inviteToken;

    public function __construct(int $userId, ?string $inviteToken = null)
    {
        $this->userId = $userId;
        $this->inviteToken = $inviteToken;
    }

    public function handle(): void
    {
        $user = User::with('social_links')->find($this->userId);
        if (! $user) {
            return;
        }

        if ($user->crm_creator_id) {
            return;
        }

        $matched = null;
        $triggerSource = null;

        // Email-based linking only after the user has PROVEN ownership of the email (verified).
        // Otherwise anyone could register with a known prospect's email and hijack that CRM record
        // (consume it, steal CSM attribution, flip the stage to signed_up). The job is re-dispatched
        // from the email-verification handlers, so this match runs once the address is confirmed.
        if ($user->email && $user->email_verified_at) {
            $matched = CrmCreator::query()
                ->whereNull('user_id')
                ->whereNotNull('email')
                ->where('email', $user->email)
                ->first();

            if ($matched) {
                $triggerSource = 'email_match';
            }
        }

        if (! $matched && $this->inviteToken) {
            $matched = CrmCreator::query()
                ->whereNull('user_id')
                ->whereNotNull('invite_token')
                ->where('invite_token', $this->inviteToken)
                ->first();

            if ($matched) {
                $triggerSource = 'invite_token';
            }
        }

        if ($matched) {
            $this->link($user, $matched, $triggerSource);

            return;
        }

        $this->createSocialMatchSuggestion($user);
    }

    private function link(User $user, CrmCreator $crmCreator, string $triggerSource): void
    {
        $fromStage = $crmCreator->crm_stage;

        $crmCreator->user_id = $user->id;
        $crmCreator->crm_stage = 'verified';
        if ($triggerSource === 'invite_token') {
            $crmCreator->invite_token_used_at = Carbon::now();
        }
        $crmCreator->save();

        $user->crm_creator_id = $crmCreator->id;
        $user->save();

        CrmCreatorStageHistory::create([
            'crm_creator_id' => $crmCreator->id,
            'from_stage' => $fromStage,
            'to_stage' => 'verified',
            'trigger_source' => $triggerSource,
            'triggered_by' => null,
        ]);
    }

    private function createSocialMatchSuggestion(User $user): void
    {
        $social = $user->social_links;
        if (! $social) {
            return;
        }

        /*
         * 🚨 THESE COLUMNS EXIST ON EVERY DEPLOYED DATABASE AND IN NO MIGRATION IN THIS
         * REPO — the documented schema drift (see CLAUDE.md → SCHEMA_DRIFT_AUDIT). A
         * database built by `migrate:fresh` has a `crm_creators` table without them, and
         * an unguarded `whereRaw` against one is `no such column`, which takes down the
         * whole REQUEST: this job runs inline under the sync queue, so a throw here means
         * the account is created and the rest of `store()` never runs.
         *
         * It stayed invisible until 25 Aug 2026 because a brand-new signup had no
         * `social_links` row, so `createSocialMatchSuggestion()` returned above; the
         * moment registration started capturing a handle, every creator signup reached
         * this. Production is unaffected — the columns are there.
         *
         * ⚠️ Guarded rather than migrated deliberately: `crm_creators` is the ADMIN app's
         * table and the migration that declares it belongs there, not in a repo that only
         * reads it. Same rule the `shops.status` call sites already follow.
         */
        $candidates = array_filter([
            'twitter' => $social->twitter,
            'instagram' => $social->instagram,
            'youtube' => $social->youtube,
            'twitch' => $social->twitch,
        ], fn ($value, $column) => $value !== null
            && Schema::hasColumn((new CrmCreator)->getTable(), $column), ARRAY_FILTER_USE_BOTH);

        // Minimum handle length — a 1-2 char handle would (with substring matching) collide with countless
        // prospects. Combined with exact equality below, this stops a user spoofing a prospect's handle.
        $minHandleLength = 3;

        $normalized = [];
        foreach ($candidates as $key => $value) {
            if ($value) {
                $handle = $this->normalizeHandle($value);
                $urlish = $this->normalizeUrlOrHandle($value);
                $candidate = $handle ?: $urlish;
                if ($candidate && mb_strlen($candidate) >= $minHandleLength) {
                    // $key is a hardcoded column name (twitter/instagram/youtube/twitch) — safe to interpolate.
                    $normalized[$key] = $candidate;
                }
            }
        }

        $usernameMatch = $user->username && mb_strlen((string) $user->username) >= $minHandleLength
            ? strtolower((string) $user->username)
            : null;

        if (count($normalized) === 0 && $usernameMatch === null) {
            return;
        }

        $query = CrmCreator::query()
            ->whereNull('user_id')
            ->whereNull('social_match_suggested_at');

        $query->where(function ($q) use ($normalized, $usernameMatch) {
            foreach ($normalized as $col => $value) {
                /*
                 * Exact, normalized equality. Substring (LIKE %x%) matching previously let
                 * any user claim a prospect by setting a partial-overlapping handle.
                 *
                 * 🚨 `TRIM(BOTH '@' FROM …)` IS MySQL-ONLY AND THROWS ON SQLITE
                 * ("near \"'@'\": syntax error"), so this raw expression took the whole
                 * REQUEST down — the job is dispatched inline under the sync queue, and a
                 * 500 there means the account is created and the rest of `store()` never
                 * runs (the Google session is not cleared, the funnel event is not sent).
                 *
                 * It stayed invisible until 25 Aug 2026 because a brand-new signup had no
                 * `social_links` row, so this branch never had a handle to match on; the
                 * moment registration started capturing one, every creator signup hit it.
                 * Production is MySQL and was never affected — the test suite was.
                 *
                 * `$value` is already `@`-stripped and lower-cased by `normalizeHandle()`,
                 * so the only thing the database has to allow for is a STORED value that
                 * still carries a leading `@`. Comparing against both spellings is exact,
                 * portable, and matches the same rows the old expression did for any
                 * realistic handle. ⚠️ It deliberately does NOT strip repeated or trailing
                 * `@` — neither is a real handle, and accepting them was never the point.
                 */
                $q->orWhereRaw(
                    'LOWER(TRIM(COALESCE('.$col.", ''))) IN (?, ?)",
                    [$value, '@'.$value]
                );
            }
            if ($usernameMatch !== null) {
                $q->orWhereRaw("LOWER(COALESCE(username,'')) = ?", [$usernameMatch]);
            }

            // ⚠️ Every clause is optional, so a database missing all of them would
            // produce an empty `where(...)` group — which matches EVERY unclaimed
            // prospect and would suggest the first one to whoever signed up. The
            // caller's `count($normalized) === 0 && $usernameMatch === null` return
            // covers it; this comment is here so the guard above is never loosened
            // without noticing what an empty group means.
        });

        $match = $query->first();
        if (! $match) {
            return;
        }

        $match->social_match_suggested_at = Carbon::now();
        $match->social_match_suggested_user_id = $user->id;
        $match->save();
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
