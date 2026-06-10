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
        if (!$user) {
            return;
        }

        if ($user->crm_creator_id) {
            return;
        }

        $matched = null;
        $triggerSource = null;

        if ($user->email) {
            $matched = CrmCreator::query()
                ->whereNull('user_id')
                ->whereNotNull('email')
                ->where('email', $user->email)
                ->first();

            if ($matched) {
                $triggerSource = 'email_match';
            }
        }

        if (!$matched && $this->inviteToken) {
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
        $crmCreator->crm_stage = 'signed_up';
        if ($triggerSource === 'invite_token') {
            $crmCreator->invite_token_used_at = Carbon::now();
        }
        $crmCreator->save();

        $user->crm_creator_id = $crmCreator->id;
        $user->save();

        CrmCreatorStageHistory::create([
            'crm_creator_id' => $crmCreator->id,
            'from_stage' => $fromStage,
            'to_stage' => 'signed_up',
            'trigger_source' => $triggerSource,
            'triggered_by' => null,
        ]);
    }

    private function createSocialMatchSuggestion(User $user): void
    {
        $social = $user->social_links;
        if (!$social) {
            return;
        }

        $candidates = [
            'twitter'   => $social->twitter,
            'instagram' => $social->instagram,
            'youtube'   => $social->youtube,
            'twitch'    => $social->twitch,
        ];

        $normalized = [];
        foreach ($candidates as $key => $value) {
            if ($value) {
                $handle = $this->normalizeHandle($value);
                $urlish = $this->normalizeUrlOrHandle($value);
                $normalized[$key] = $handle ?: $urlish;
            }
        }

        if (count($normalized) === 0) {
            return;
        }

        $query = CrmCreator::query()
            ->whereNull('user_id')
            ->whereNull('social_match_suggested_at');

        $query->where(function ($q) use ($normalized, $user) {
            foreach ($normalized as $col => $value) {
                $q->orWhereRaw('LOWER(COALESCE(' . $col . ",'')) LIKE ?", ['%' . $value . '%']);
            }
            // Also match by username
            if ($user->username) {
                $q->orWhereRaw("LOWER(COALESCE(username,'')) = ?", [strtolower((string) $user->username)]);
            }
        });

        $match = $query->first();
        if (!$match) {
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
        if (!str_contains($urlish, '://') && (str_contains($urlish, '.') && str_contains($urlish, '/'))) {
            $urlish = 'https://' . $urlish;
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
