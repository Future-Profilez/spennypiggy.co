<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * EVERY `route('name')` IN PHP MUST NAME A ROUTE THIS APP ACTUALLY HAS.
 *
 * 🚨 `route()` RAISES `RouteNotFoundException` FOR A NAME IT DOES NOT CARRY — it does
 * not return null, an empty string or a fallback. So a renamed or deleted route turns
 * every caller into a 500 from wherever it was called, and a caller sitting inside a
 * `catch (\Exception)` turns it into something worse: a feature that silently stops
 * working with nothing on any screen saying so.
 *
 * ⚠️ THE SHAPE THAT REPEATS ON THIS PROJECT IS A ROUTE NAME BORROWED FROM THE OTHER
 * APP. The two share a database and no code, so a name copied across cannot resolve,
 * and nothing about reading it says which app it belongs to. Two were live in
 * admin.spennypiggy.co on 13 Sep 2026 — `route('dashboard')` (it is `admin.dashboard`
 * there) and `route('user.show')`, which is one of OURS. Reach the other app through
 * its configured URL, never through a route name.
 *
 * ⚠️ The JS mirror of this question — does the path a component POSTs to still exist —
 * is `admin.spennypiggy.co/tests/Unit/JsEndpointsResolveTest`.
 */
class RouteNamesResolveTest extends TestCase
{
    /**
     * 🚨 EVERY ENTRY NEEDS A REASON. An allowlist without one is where a guard like
     * this rots: the next person cannot tell an accepted name from a forgotten one.
     *
     * All four below were MEASURED unreachable on 13 Sep 2026 — each is dead code
     * whose throw nothing can reach. They are recorded rather than deleted because
     * removing a middleware, a vendor view and a controller method is a deliberate
     * decision of its own; what this list guarantees is that no NEW one ships.
     */
    private const ACCEPTED = [
        // `RequireActiveMembership` is aliased in Kernel.php as `membership` and is
        // applied to NO route, so this redirect is unreachable.
        'membership.show' => 'app/Http/Middleware/RequireActiveMembership.php',

        // `StripeController::showAllData()` is routed nowhere — grep returns only its
        // own declaration.
        'stripe.mor-consent' => 'app/Http/Controllers/Auth/StripeController.php',

        // `resources/views/verify-email.blade.php` is rendered by nothing.
        'verify.email' => 'resources/views/verify-email.blade.php',

        // Laravel PWA's own view. Documented dead in CLAUDE.md — `@laravelPWA` is
        // commented out, which is exactly why it would ship broken if re-enabled.
        'laravelpwa.manifest' => 'resources/views/vendor/laravelpwa/meta.blade.php',
    ];

    /** @return array<string, string> name => the file that calls it */
    private function calledNames(): array
    {
        $found = [];

        foreach (['app', 'routes', 'resources/views'] as $dir) {
            $base = base_path($dir);

            if (! is_dir($base)) {
                continue;
            }

            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($base, \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($files as $file) {
                if ($file->getExtension() !== 'php') {
                    continue;
                }

                $source = file_get_contents($file->getPathname());

                // Comments first — the notes left at each fix NAME the dead route.
                $source = preg_replace('#/\*.*?\*/#s', '', $source);
                $source = preg_replace('#//[^\n]*#', '', $source);

                preg_match_all(
                    '#route\(\s*[\'"]([a-zA-Z0-9_.\-]+)[\'"]#',
                    $source,
                    $matches,
                    PREG_OFFSET_CAPTURE
                );

                foreach ($matches[0] as $i => $hit) {
                    $name = $matches[1][$i][0];
                    $before = substr($source, max(0, $hit[1] - 40), min(40, $hit[1]));

                    /*
                     * 🚨 THE RECEIVER DECIDES WHAT THE ARGUMENT MEANS. `$request->route('username')`
                     * takes a PARAMETER name; `redirect()->route('home')` takes a ROUTE name — and
                     * both are written `->route(`. A blanket `(?<!->)` exclusion makes this guard
                     * pass against the very bug it exists for (verified by replanting one), so only
                     * a request-shaped receiver is skipped.
                     */
                    if (preg_match('#(\$[A-Za-z_]\w*|request\s*\(\s*\))\s*->\s*$#', $before)) {
                        continue;
                    }

                    $found[$name] ??= str_replace(base_path().'/', '', $file->getPathname());
                }
            }
        }

        return $found;
    }

    public function test_every_named_route_this_app_calls_is_registered(): void
    {
        $registered = [];

        foreach (Route::getRoutes() as $route) {
            if ($name = $route->getName()) {
                $registered[$name] = true;
            }
        }

        $names = $this->calledNames();

        $this->assertNotEmpty($names, 'The scan found no route() calls at all — the pattern has stopped matching.');

        $missing = [];

        foreach ($names as $name => $file) {
            if (isset($registered[$name]) || array_key_exists($name, self::ACCEPTED)) {
                continue;
            }

            $missing[] = $name.'  ('.$file.')';
        }

        $this->assertSame(
            [],
            $missing,
            "route() is called with names this app does not register. Each one THROWS:\n  "
                .implode("\n  ", $missing)
                ."\n\nIf the name belongs to admin.spennypiggy.co, build the URL from its "
                .'configured host instead — the two apps share no route table.'
        );
    }

    /**
     * 🚨 THE ALLOWLIST MUST NOT ROT. A name that has since been registered, or whose
     * caller has gone, is one nobody should still be excusing.
     */
    public function test_the_accepted_list_still_describes_something_real(): void
    {
        $registered = [];

        foreach (Route::getRoutes() as $route) {
            if ($name = $route->getName()) {
                $registered[$name] = true;
            }
        }

        $called = $this->calledNames();

        foreach (self::ACCEPTED as $name => $file) {
            $this->assertArrayNotHasKey(
                $name,
                $registered,
                "'{$name}' is a registered route now — take it off ACCEPTED."
            );

            $this->assertArrayHasKey(
                $name,
                $called,
                "Nothing calls '{$name}' any more — take it off ACCEPTED."
            );
        }
    }
}
