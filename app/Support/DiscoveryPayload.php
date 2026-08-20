<?php

namespace App\Support;

use App\Services\Discovery\DiscoveryReportService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * The Discovery config, in the shape the frontend reads it.
 *
 * 🚨 THREE SURFACES SHARE THIS PAYLOAD — the homepage Discovery section (A1),
 * `/creators/discovery` (A2) and, as it is built, `/creators/link-in-bio` (A3).
 * It exists so they cannot drift: a page assembling its own version of this
 * array is a page that can be given a different label map from the others,
 * which is exactly the failure `config/discovery.php` was centralised to
 * prevent. From Discovery Phase 2 the creator dashboard will send the same
 * shape with real numbers in place of the mock ones.
 *
 * ⚠️ Passed per-route rather than shared in `HandleInertiaRequests` — the shared
 * payload rides on every request in the app, and only these few pages need it.
 */
class DiscoveryPayload
{
    /**
     * @return array{analyticsLive: bool, mockStats: array, labels: array}
     */
    public static function forInertia(): array
    {
        return [
            'analyticsLive' => (bool) config('discovery.analytics_live'),
            'mockStats' => config('discovery.mock_stats'),
            'labels' => config('discovery.labels'),
        ];
    }

    /**
     * Discovery Phase 2 — the creator dashboard's own three figures, month to
     * date, for the panel at the top of their profile/dashboard.
     *
     * 🚨 THE SHAPE IS THE SAME AS `config('discovery.mock_stats')` ON PURPOSE.
     * `DiscoveryStatsPanel` is one component across marketing and product, so
     * the dashboard has to hand it the key names the mock figures already use —
     * `introduced` / `new_supporters` / `attributed_earnings`. The numbers come
     * from `DiscoveryReportService::panelStatsFor()`, which is the single source
     * of every published Discovery figure; nothing here recomputes them.
     *
     * ⚠️ `analytics_live` is deliberately NOT consulted. That flag governs the
     * MARKETING surfaces, where the figures are invented and must carry the
     * coming-soon badge. The dashboard has real data for one real creator, so it
     * passes `live` directly and the flag stays false until the client flips it.
     *
     * ⚠️ CACHED, BECAUSE THIS RIDES ON A PAGE LOAD. `/dashboard` lands the
     * creator on their own profile and every tab re-renders it, so an uncached
     * grouped aggregate over `discovery_events` would run on each one. 300s: the
     * figures are month-to-date totals that move when a supporter arrives, not
     * numbers anyone reads to the second, and five minutes still lets a creator
     * watching a promotion see it land. The calendar month is IN THE KEY, so the
     * panel can never serve last month's totals into this month.
     *
     * @return array{introduced: int, new_supporters: int, attributed_earnings: float}
     */
    public static function dashboardStatsFor(int $creatorId): array
    {
        $month = Carbon::now();

        return Cache::remember(
            'discovery_panel_stats_'.$creatorId.'_'.$month->format('Y_m').'_v1',
            300,
            fn () => app(DiscoveryReportService::class)->panelStatsFor($creatorId, $month),
        );
    }
}
