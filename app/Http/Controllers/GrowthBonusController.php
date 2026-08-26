<?php

namespace App\Http\Controllers;

use App\Models\GrowthBonusProfile;
use App\Models\GrowthBonusReward;
use App\Services\GrowthBonusService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

/**
 * The public Creator Growth Bonus page — the ladder, the rules, and (for a
 * signed-in creator) their own position on it.
 *
 * 🚨 EVERY FIGURE COMES FROM `config/growth_bonus.php`, which is what
 * `GrowthBonusService` enforces. A ladder printed in JSX is a ladder that can
 * disagree with the one that pays — the same rule the promo deck follows.
 *
 * ⚠️ Progress is labelled "Qualifying earnings", the terms' own defined term.
 * Since 26 Aug 2026 the base is the creator's listed sale value, so a £100
 * listing counts as £100 — the figure and what the creator takes home are the
 * same thing now, and it matches the Founder tracker beside it.
 */
class GrowthBonusController extends Controller
{
    public function __construct(private GrowthBonusService $service) {}

    public function index()
    {
        abort_unless($this->service->enabled(), 404);

        $user = Auth::user();
        $profile = null;

        if ($user && (int) $user->role === 1) {
            $profile = GrowthBonusProfile::with(['rewards' => fn ($q) => $q->orderBy('milestone_gmv')])
                ->where('creator_id', $user->id)
                ->first();
        }

        return Inertia::render('GrowthBonus/Index', [
            'programme' => $this->programme(),
            'progress' => $profile ? $this->progressFor($profile) : null,
            'isCreator' => $user ? (int) $user->role === 1 : false,
        ]);
    }

    /**
     * The scheme's own numbers — cached, since none of it is per-viewer and the
     * seat count is a COUNT over a table that changes at most 150 times ever.
     */
    private function programme(): array
    {
        $ladder = collect($this->service->ladder())
            ->map(function ($rung, $i) {
                static $cumulative = 0;
                $cumulative += (float) $rung['amount'];

                return [
                    'gmv' => (float) $rung['gmv'],
                    'amount' => (float) $rung['amount'],
                    'cumulative' => $cumulative,
                ];
            })
            ->values()
            ->all();

        $seatsClaimed = Cache::remember(
            'growth_bonus_seats_claimed_v1',
            300,
            fn () => GrowthBonusProfile::seatsClaimed(),
        );

        return [
            'ladder' => $ladder,
            'max_total' => collect($ladder)->last()['cumulative'] ?? 0,
            'max_seats' => $this->service->maxSeats(),
            'seats_claimed' => $seatsClaimed,
            'seats_remaining' => max(0, $this->service->maxSeats() - $seatsClaimed),
            'activation_gmv' => $this->service->activationThreshold(),
            'activation_window_days' => (int) config('growth_bonus.activation.window_days', 30),
            'expiry_months' => (int) config('growth_bonus.expiry_months', 12),
            'currency_symbol' => config('growth_bonus.display.currency_symbol', '£'),
        ];
    }

    private function progressFor(GrowthBonusProfile $profile): array
    {
        $gmv = (float) $profile->qualifying_gmv + (float) $profile->gmv_adjustment;

        $earned = $profile->rewards
            ->whereNotIn('status', [GrowthBonusReward::STATUS_REVERSED])
            ->sum('amount');

        $paid = $profile->rewards
            ->where('status', GrowthBonusReward::STATUS_PAID)
            ->sum('amount');

        // The next rung the creator has not yet reached.
        $next = collect($this->service->ladder())
            ->first(fn ($rung) => $gmv < (float) $rung['gmv']);

        return [
            'status' => $profile->status,
            'missed_reason' => $profile->missed_reason,
            'qualifying_gmv' => round($gmv, 2),
            'activation_deadline' => $profile->activation_deadline?->toDateString(),
            'activated_at' => $profile->activated_at?->toDateString(),
            'expires_at' => $profile->expires_at?->toDateString(),
            'earned_total' => (float) $earned,
            'paid_total' => (float) $paid,
            'next_milestone' => $next ? (float) $next['gmv'] : null,
            'next_reward' => $next ? (float) $next['amount'] : null,
            'remaining_to_next' => $next ? max(0, round((float) $next['gmv'] - $gmv, 2)) : null,
            'milestones' => $profile->rewards->map(fn ($r) => [
                'gmv' => (float) $r->milestone_gmv,
                'amount' => (float) $r->amount,
                'status' => $r->status,
            ])->values()->all(),
        ];
    }
}
