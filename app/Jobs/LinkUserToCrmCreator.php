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
            'x_handle' => $social->twitter,
            'instagram_handle' => $social->instagram,
            'youtube_handle' => $social->youtube,
        ];

        $normalized = [];
        foreach ($candidates as $key => $value) {
            if ($value) {
                $normalized[$key] = mb_strtolower(trim($value));
            }
        }

        if (count($normalized) === 0) {
            return;
        }

        $query = CrmCreator::query()
            ->whereNull('user_id')
            ->where('crm_stage', 'prospect')
            ->whereNull('social_match_suggested_at');

        $query->where(function ($q) use ($normalized) {
            foreach ($normalized as $col => $value) {
                $q->orWhereRaw('LOWER(TRIM(' . $col . ')) = ?', [$value]);
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
}

