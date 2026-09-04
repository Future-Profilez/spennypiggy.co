<?php

namespace App\Support;

use Illuminate\Support\Facades\Route;

/**
 * The three earning shapes, resolved for the front end.
 *
 * ⚠️ ONE PAYLOAD, THREE SURFACES — the home page, `/creators`, and
 * `/creators/memberships`. The list itself lives in `config/monetisation.php`;
 * this class only turns a route NAME into a URL, so a card can never link to a
 * route that has not been registered.
 *
 * 🚨 `route()` THROWS for an unknown name, and this payload is built on the
 * home page. A typo in the config would 500 the site's front door to render a
 * link, so an unresolvable name is nulled rather than raised — the card then
 * renders without a link, which is the documented behaviour for a pillar whose
 * page has not shipped. Same reasoning as `SuspendedAccount::actionFor()`.
 */
class MonetisationPillars
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function forInertia(): array
    {
        return array_map(static function (array $pillar): array {
            $name = $pillar['route'] ?? null;

            $pillar['href'] = ($name !== null && Route::has($name))
                ? route($name, absolute: false)
                : null;

            unset($pillar['route']);

            return $pillar;
        }, config('monetisation.pillars', []));
    }
}
