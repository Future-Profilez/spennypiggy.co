<?php

namespace App\Support;

use App\Models\DiscoveryLabelOverride;
use App\Services\Discovery\DiscoveryReportService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

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
            'labels' => self::labels(),
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
    /**
     * The label map, with any admin kill switch applied.
     *
     * 🚨 AN OVERRIDE CAN ONLY FORCE A LABEL TO COMING SOON. See the migration:
     * marking something LIVE NOW is a public claim, and the test that requires
     * recorded evidence for every live key reads the CONFIG — a database switch
     * able to set `live` would walk past it. Off is the safe direction and the
     * urgent one; on has never been urgent.
     *
     * ⚠️ A MISSING ROW MEANS "USE THE CONFIG", so an empty table behaves exactly
     * as the file always has.
     *
     * ⚠️ Cached for a minute, and NOT for the panel's five. An admin hiding a
     * label is usually doing it because it is claiming something it should not,
     * and waiting five minutes for that is not a control.
     *
     * ⚠️ Guarded on the table: the admin app's test database has no copy, and a
     * missing table must fail to the CONFIG rather than to an error — a
     * marketing page must not go down because a migration has not run.
     */
    public static function labels(): array
    {
        $labels = config('discovery.labels', []);

        $forced = Cache::remember('discovery_label_overrides_v1', 60, function () {
            if (! Schema::hasTable('discovery_label_overrides')) {
                return [];
            }

            return DiscoveryLabelOverride::query()->pluck('label_key')->all();
        });

        foreach ($forced as $key) {
            if (array_key_exists($key, $labels)) {
                $labels[$key] = 'coming_soon';
            }
        }

        return $labels;
    }

    public static function dashboardStatsFor(int $creatorId): array
    {
        $month = Carbon::now();

        return Cache::remember(
            'discovery_panel_stats_'.$creatorId.'_'.$month->format('Y_m').'_v1',
            300,
            fn () => app(DiscoveryReportService::class)->panelStatsFor($creatorId, $month)
                + ['by_source' => app(DiscoveryReportService::class)->breakdownFor($creatorId, $month)],
        );
    }
}
