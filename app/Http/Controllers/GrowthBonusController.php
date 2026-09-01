<?php

namespace App\Http\Controllers;

use App\Models\GrowthBonusProfile;
use App\Services\GrowthBonusService;
use App\Support\GrowthBonusPanelPayload;
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
 * The base is the creator's LISTED SALE VALUE including any VAT, so a £100
 * listing counts as £100 whatever their VAT status.
 *
 * 🚨 IT IS NOT "WHAT YOU KEEP" AND MUST NEVER BE DESCRIBED AS SUCH (client
 * instruction, 26 Aug 2026). Where VAT applies, part of the figure is collected
 * on HMRC's behalf. Use "qualifying earnings" or "listed sale value"; never
 * "you keep", "take-home" or "your balance".
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
            'progress' => $profile ? GrowthBonusPanelPayload::forDashboard($user) : null,
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

    /*
     * 🚨 THERE IS NO `progressFor()` HERE ANY MORE, AND THERE MUST NOT BE ONE
     * AGAIN. This controller carried its own hand-rolled copy of the creator's
     * progress shape — it read `$profile->qualifying_gmv` (the evaluator's
     * SNAPSHOT) while the dashboard widget beside it computed the same figure
     * LIVE, so `/growth-bonus` simply did not move after a sale. Every key it
     * built already existed in `GrowthBonusPanelPayload::shape()`; this file's
     * own docblock claimed the page and the widget shared one shape, and they
     * did not.
     *
     * ⚠️ `forDashboard()` is display-only and writes nothing — activation, seat
     * claims and reward rows stay with the evaluator, so rendering this page can
     * never claim one of the 150 places.
     */

}
