<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * 🚨 A HELP CENTRE THAT MACHINES CANNOT READ IS HALF A HELP CENTRE.
 *
 * Reported 4 Sep 2026 by a client fetching the live site: `/help` came back
 * complete and every page below it — every category, every article — came back
 * as the meta tags and the header and then an empty `<div id="app">`. Only the
 * index carried the `ssr` middleware; the other two were left off it while
 * nobody had checked whether the pages were SSR-safe.
 *
 * Nothing errors, and it is invisible from a browser: a human's React hydrates
 * over the shell and the page is perfect. The readers who get the shell are
 * Bing and every AI assistant people now ask questions of — i.e. the audience a
 * help centre exists for. Roughly 70 answers were live and machine-unreadable
 * with the index above them fine.
 *
 * ⚠️ This asserts the MIDDLEWARE, not the rendered HTML. `EnableSsr::willRender`
 * needs a configured render host and a built SSR bundle, neither of which exists
 * in the suite — so a rendering assertion would pass against the bug. The
 * regression this guards is somebody dropping `->middleware('ssr')` from a
 * route, which is exactly what this reads.
 */
class HelpCentreSsrTest extends TestCase
{
    public static function pageRoutes(): array
    {
        return [
            'index' => ['help.index'],
            'category' => ['help.category'],
            'article' => ['help.article'],
        ];
    }

    /**
     * @dataProvider pageRoutes
     */
    public function test_every_help_page_route_is_server_rendered(string $name): void
    {
        $route = Route::getRoutes()->getByName($name);

        $this->assertNotNull($route, "Route [{$name}] is not registered.");
        $this->assertContains(
            'ssr',
            $route->gatherMiddleware(),
            "Route [{$name}] is not server-rendered, so its content does not exist in view-source."
        );
    }

    /**
     * ⚠️ The JSON endpoints must NOT be in the group — SSR on a route returning
     * JSON is a render host round trip for nothing on every call, and
     * `/help/search` runs on a keystroke.
     */
    public function test_the_json_endpoints_are_not_server_rendered(): void
    {
        foreach (['help.search', 'help.inline'] as $name) {
            $route = Route::getRoutes()->getByName($name);

            $this->assertNotNull($route, "Route [{$name}] is not registered.");
            $this->assertNotContains('ssr', $route->gatherMiddleware(), "Route [{$name}] should not be server-rendered.");
        }
    }
}
