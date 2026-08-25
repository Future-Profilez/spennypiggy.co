<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * 🚨 LARAVEL KEYS THE ROUTE TABLE ON METHOD+URI, SO THE LAST DECLARATION WINS
 * AND THE EARLIER ONE VANISHES — INCLUDING ITS MIDDLEWARE.
 *
 * This is not theoretical here. `bill/checkout/{uuid}` and
 * `membership/checkout/{uuid}` are each declared twice, once inside the `auth`
 * group and again near the bottom of `routes/auth.php`, and the LIVE route
 * therefore carries no `Authenticate` at all — the login requirement comes only
 * from the `! Auth::check()` redirect inside the controller.
 *
 * 🚨 **`php artisan route:list` CANNOT SHOW YOU THIS.** It lists the collapsed
 * table, so the shadowed declaration is already gone by the time you look —
 * which is exactly what makes the fault invisible in review. The only way to see
 * it is to parse the SOURCE and compare against the registered table, which is
 * what this test does.
 */
class NoShadowedRoutesTest extends TestCase
{
    /**
     * Collisions that are known, understood and deliberately left alone.
     * ⚠️ Add to this ONLY with the reason written down. A new entry here is a
     * route somebody silently deleted by re-declaring it.
     */
    private const ACCEPTED = [
        /*
         * `SubscriptionsController@index` (routes/web.php, name
         * `subscriptions.index`) is shadowed by `WishitemController@creatorSubscriptions`
         * (routes/auth.php, name `subscriptions`), which is declared later and
         * wins. The name `subscriptions.index` is therefore NOT REGISTERED and
         * that controller method is unreachable. Nothing links to it, so nothing
         * throws — but deciding which of the two pages is the intended one is a
         * product question, not a tidy-up, so it is recorded rather than changed.
         */
        'GET subscriptions',

        /*
         * `remove-from-cart` is declared in BOTH `routes/api.php` and inside the
         * authenticated group in `routes/auth.php`. The api.php one wins, so the
         * live route carries `web` only. That is required: a guest basket is keyed
         * on a device id and has no session to authenticate, so the public
         * declaration is the one the feature needs.
         */
        'GET remove-from-cart/{uuid}/{device_id?}',

        /*
         * 🚨 THE BILL AND MEMBERSHIP CHECKOUTS — the pair this test exists for.
         * Each is declared inside the `auth` + `mustHaveToVerify` group (named
         * `*.checkout.auth`, throttle 30/min) and AGAIN at the bottom of
         * auth.php, and the later pair wins: the live routes carry `web` +
         * `CheckGifterCardVerification` only, with NO `Authenticate`. The login
         * requirement is enforced by `buyBill`/`buyLevel` redirecting a guest,
         * not by middleware.
         *
         * ⚠️ ACCEPTED, NOT UNNOTICED. This is documented at length in
         * routes/auth.php beside the live declarations and in CLAUDE.md, which
         * warns explicitly against "fixing" it — the surviving pair also carries
         * a deliberately different throttle (60/min, because an unauthenticated
         * request is keyed on IP and one NAT is shared by a whole office). Undoing
         * the shadow would change middleware AND rate limits on a live payment
         * path, which is a decision, not a tidy-up.
         */
        'GET bill/checkout/{uuid}/{reccure?}',
        'POST bill/checkout/{uuid}/{reccure?}',
        'GET membership/checkout/{uuid}/{reccure?}',
        'POST membership/checkout/{uuid}/{reccure?}',
    ];

    /** Every method+URI actually registered, so a parser slip cannot invent a finding. */
    private function registered(): array
    {
        $set = [];

        foreach (Route::getRoutes() as $route) {
            foreach ($route->methods() as $method) {
                if ($method === 'HEAD') {
                    continue;
                }

                $set[$method.' '.trim($route->uri(), '/')] = true;
            }
        }

        return $set;
    }

    /**
     * Parse the route files, resolving `prefix()` groups by brace depth so a URI
     * is compared as the router sees it, not as it is typed.
     */
    private function declarations(): array
    {
        $verb = '/Route::(get|post|put|patch|delete|any)\s*\(\s*[\'"]([^\'"]*)[\'"]/i';

        /*
         * 🚨 `Route::match([...], 'uri', …)` MUST BE PARSED TOO — and it is the
         * form the documented live instance uses. The first version of this test
         * matched only the single-verb helpers, so it reported a clean sweep while
         * `bill/checkout/{uuid}/{reccure?}` and `membership/checkout/{uuid}/{reccure?}`
         * — the two routes this whole test exists because of — sat there declared
         * twice apiece. A guard that cannot see the case it was written for is
         * worse than none, because it certifies the thing it missed.
         */
        $matchVerb = '/Route::match\s*\(\s*\[([^\]]*)\]\s*,\s*[\'"]([^\'"]*)[\'"]/i';
        $prefix = '/(?:Route::|->)prefix\s*\(\s*[\'"]([^\'"]*)[\'"]/';
        $arrayPrefix = '/[\'"]prefix[\'"]\s*=>\s*[\'"]([^\'"]*)[\'"]/';

        $seen = [];

        foreach (glob(base_path('routes/*.php')) as $file) {
            $stack = [];
            $depth = 0;

            foreach (file($file) as $i => $line) {
                $trimmed = ltrim($line);
                $isComment = str_starts_with($trimmed, '//')
                    || str_starts_with($trimmed, '*')
                    || str_starts_with($trimmed, '/*');

                $groupPrefix = null;

                if (! $isComment && (preg_match($prefix, $line, $m) || preg_match($arrayPrefix, $line, $m))) {
                    $groupPrefix = trim($m[1], '/');
                }

                $opens = substr_count($line, '{') - substr_count($line, '}');

                $verbs = [];
                $path = null;

                if (! $isComment && preg_match($verb, $line, $m)) {
                    $verbs = [strtoupper($m[1])];
                    $path = $m[2];
                } elseif (! $isComment && preg_match($matchVerb, $line, $m)) {
                    preg_match_all('/[\'"]([a-z]+)[\'"]/i', $m[1], $vm);
                    $verbs = array_map('strtoupper', $vm[1]);
                    $path = $m[2];
                }

                if ($path !== null) {
                    $parts = array_filter(array_column($stack, 1));
                    $parts[] = trim($path, '/');

                    $uri = trim(implode('/', array_filter($parts, fn ($p) => $p !== '')), '/');

                    foreach ($verbs as $v) {
                        $seen[$v.' '.$uri][] = basename($file).':'.($i + 1);
                    }
                }

                if ($groupPrefix !== null && $opens > 0) {
                    $stack[] = [$depth, $groupPrefix];
                }

                $depth += $opens;

                while ($stack !== [] && $depth <= $stack[count($stack) - 1][0]) {
                    array_pop($stack);
                }
            }
        }

        return $seen;
    }

    public function test_no_route_is_silently_shadowed_by_a_later_declaration(): void
    {
        $registered = $this->registered();
        $shadowed = [];

        foreach ($this->declarations() as $key => $locations) {
            // ⚠️ Only count a collision when the computed URI matches a route that
            // really exists. A prefix this parser failed to resolve produces a URI
            // the router never saw, and reporting that would be a phantom finding.
            if (count($locations) > 1 && isset($registered[$key])) {
                $shadowed[$key] = $locations;
            }
        }

        foreach (self::ACCEPTED as $accepted) {
            unset($shadowed[$accepted]);
        }

        $this->assertSame(
            [],
            $shadowed,
            'These URIs are declared more than once. Laravel keeps only the LAST one, so the '
            ."earlier declaration — and any middleware it carried — is silently discarded:\n"
            .collect($shadowed)->map(fn ($l, $k) => "  $k  <-  ".implode(', ', $l))->implode("\n")
        );
    }
}
