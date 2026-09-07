<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route as RouteFacade;
use ReflectionMethod;
use Tests\TestCase;

/**
 * 🚨 A ROUTE THAT WRITES MUST NOT BE A `GET` — SOMETHING WILL FETCH IT.
 *
 * Written 7 Sep 2026, after `update-profile-lock-status` — the only thing that puts a
 * creator into the admin review queue — turned out to be a `Route::get`. **Nothing has
 * to click a GET for it to fire**: a browser link-preload, a hover prerender, an
 * extension link scanner, a back/forward restore, or an inbox scanning a link on the
 * recipient's behalf (Outlook Safe Links, a spam filter, a link preview). Measured live:
 * krystal555 entered the review queue at 12:36:34 with `"method": "GET"` on the audit
 * row, from an admin emulation session that clicked nothing.
 *
 * ⚠️ THE ROUTE FILE CANNOT SHOW YOU THIS and neither can `route:list` — a GET route that
 * writes looks exactly like a GET route that reads. Only the handler's body says so,
 * which is why this is a source scan rather than a route test.
 *
 * The two assertions are different questions and neither subsumes the other:
 *
 *  1. **Is it linked?** A write-GET route rendered as an `href` in our own markup is the
 *     reported bug exactly — a URL sitting in the DOM for any prefetcher to fetch. Small,
 *     reasoned allowlist; a new one is a real fault.
 *     ⚠️ IT SEES A LITERAL `href="/path"` AND `href={route("name")}`, NOT
 *     `href={someVariable}` — `OnboardingNudge` computes its href, and that is exactly
 *     where the reported bug did the most damage. Assertion 2 is the backstop for that
 *     blind spot, and it is the one that catches the fault at its source.
 *  2. **Did the set grow?** A write-GET route called from `axios.get()` in a click handler
 *     is NOT prefetchable (there is no href in the DOM), so it is bad practice rather than
 *     a live hole — but it is one `<a href>` away from becoming one. The list is pinned so
 *     the next one is a deliberate decision instead of an accident.
 */
class NoWritingGetRoutesTest extends TestCase
{
    /**
     * What counts as a write.
     *
     * ⚠️ A bare `DB::table(` is deliberately NOT here — it is the query builder's entry
     * point for SELECTs too, and including it flagged four read-only analytics and health
     * endpoints. `DB::table(...)->update(...)` is still caught, by `->update(`.
     */
    private const WRITE_CALLS = '/(->save\(|->saveQuietly\(|->update\(|->updateOrCreate\(|->firstOrCreate\(|->create\(|->delete\(|->forceDelete\(|->increment\(|->decrement\(|->forceFill\(|::create\(|::updateOrCreate\(|::insert\()/';

    /**
     * Every GET-only route whose handler writes, as of 7 Sep 2026.
     *
     * 🚨 THIS LIST MAY SHRINK, NEVER GROW. A new entry means somebody has just written the
     * bug this file exists for. The fix is a POST — not an addition here.
     *
     * They fall into four groups, and only the first two are legitimate:
     *
     *  - **A third party redirects the browser back to us**, so the verb is not ours to
     *    choose: `stripe/response`, `stripe/authorize`, `auth/google/callback`,
     *    `twitter/authorize`, the `card-verification-*` returns, and every
     *    `handle/{uuid}/{status}`, `-success-payment`, `-cancel-payment`,
     *    `success-checkout`, `cancel-checkout` and `task/{uuid}/success`.
     *  - **A one-click link in an email or an SMS**, where a GET is the whole point:
     *    `unsubscribe/{user}`, `user/{uuid}` (email verification), `verify-token/{token}`,
     *    `waitlist/stop/{waitlist}`.
     *  - **Called from `axios.get()` in a click handler** — every `delete-`, `remove-`,
     *    `remove`, cart and `pin-item` route. Not prefetchable (no href in the DOM),
     *    so not a live hole; still the wrong verb, and one markup change from being one.
     *    (⚠️ Never write a glob with a star immediately before a slash inside a docblock —
     *    it closes the comment, and the parse error names a word out of the prose.)
     *  - **Local/testing-only scaffolding** (`create-applicant`,
     *    `seed-user-verification-status`, `create-product-for-creator-and-gifter`,
     *    `api/admin/export/audit-pack`), which never registers in production.
     */
    private const ACCEPTED = [
        'add-to-cart/{uuid}/{device_id}/{sub}/{amount?}',
        'api/admin/export/audit-pack',
        'api/remove-from-cart/{uuid}/{device_id?}',
        'auth/google/callback',
        'authenticated-cart',
        'auto-tweet-setting',
        'bill/handle/{uuid}/{status?}',
        'bill/handle/{uuid}/{status}',
        'bill/remove/{uuid}',
        'cancel-checkout/{id}',
        'cancel-subs/{uuid}',
        'cancel-subscription/{subscription_id}',
        'card-verification-failed/{id}',
        'card-verification-success/{uuid}',
        'cart-update-quantity/{uuid}/{quantity}',
        'clear-cart/{device_id}/{ownerid}',
        'create-applicant',
        'create-checkout-session/{creator_id}/{user_id_or_device?}',
        'delete-all-notifications',
        'delete-category/{id}',
        'delete-creator-products/{uuid}',
        'delete-wish-item/{uuid}',
        'deliverable/access/{uuid}',
        'earnings/graph-data',
        'generate-backup-code',
        'gifter-card-verification',
        'handle/{uuid}/{status}',
        'intro/remove',
        'mark-as-read',
        'mark-complete-goal/{uuid}',
        'membership/handle/{uuid}/{status?}',
        'membership/handle/{uuid}/{status}',
        'membership/remove/{uuid}',
        'piggy-pot/handle/{uuid}/{status?}',
        'pin-item/{wish_id}',
        'read-status/{payment_id}/{type}',
        'remove-cart/{cart_id}',
        'remove-from-cart/{uuid}/{device_id?}',
        'rye-cancel-payment/{uuid}',
        'rye-success-payment/{uuid}',
        'shop/cancel-payment/{uuid}',
        'shop/item/{slug}/{uuid}/{session_id?}',
        'shop/success-payment/{uuid}',
        'show-2fa-qr',
        'stripe/authorize',
        'stripe/enable_card_payments',
        'stripe/response',
        'stripe/upgrade-express-account',
        'success-checkout/{id}',
        'task/{uuid}/success',
        'tip-jar/handle/{uuid}/{status?}',
        'twitter/authorize',
        'unlink-twitter',
        'unsubscribe/{user}',
        'update-vat/{percent}',
        'user/{uuid}',
        'verify-token/{token}',
        'waitlist/stop/{waitlist}',
        'wish/handle/{uuid}/{status}',
    ];

    /**
     * Write-GET routes our own markup renders as an `href` — the reported bug's shape.
     *
     * 🚨 Each of these three is a LIVE prefetch exposure and is accepted only because the
     * cheap fix does not work on them: the handler answers with a 302 to `stripe.com`, and
     * an Inertia `<Link method="post">` cannot follow a cross-origin redirect (the same
     * trap the admin sidebar's `external: true` flag exists for). Closing them means a
     * native `<form method="POST">` with a CSRF token, or moving the write onto Stripe's
     * return leg. Tracked, not forgotten.
     *
     * ⚠️ A NEW entry here is not a judgement call — it is the bug. Make the route a POST.
     */
    private const ACCEPTED_LINKED = [
        'stripe/authorize' => 'Connect onboarding entry — redirects to stripe.com, so an Inertia POST cannot follow it.',
        'stripe/enable_card_payments' => 'Re-requests the card_payments capability, then redirects to stripe.com.',
        'stripe/upgrade-express-account' => 'Express account upgrade — redirects to stripe.com.',
    ];

    /**
     * @return array<string, string> route uri => "Controller@method (file:line)"
     */
    private function writingGetRoutes(): array
    {
        $found = [];

        foreach (RouteFacade::getRoutes() as $route) {
            $methods = $route->methods();

            // GET-only. A route that also accepts POST/PUT/PATCH/DELETE has a safe verb
            // available, and its GET leg is a different question from this one.
            if (! in_array('GET', $methods, true)) {
                continue;
            }

            if (array_intersect(['POST', 'PUT', 'PATCH', 'DELETE'], $methods)) {
                continue;
            }

            $action = $route->getActionName();

            // Closures are checked too — measured 7 Sep 2026: zero of them write, so a
            // controller-only scan happens to be complete today and would not stay so.
            if (! str_contains($action, '@')) {
                continue;
            }

            [$class, $method] = explode('@', $action);

            if (! class_exists($class)) {
                continue;
            }

            try {
                $reflection = new ReflectionMethod($class, $method);
            } catch (\Throwable) {
                continue;
            }

            $file = $reflection->getFileName();

            if (! $file || ! is_file($file)) {
                continue;
            }

            $body = implode('', array_slice(
                file($file),
                $reflection->getStartLine() - 1,
                $reflection->getEndLine() - $reflection->getStartLine() + 1
            ));

            // ⚠️ Comments first. Half the write calls in this codebase are NAMED in a
            // docblock explaining why they are safe, and a scan that reads prose reports
            // the explanation as the fault.
            $body = preg_replace('!/\*.*?\*/!s', '', $body);
            $body = preg_replace('!//.*!', '', (string) $body);

            if (! preg_match(self::WRITE_CALLS, (string) $body)) {
                continue;
            }

            $found[$route->uri()] = sprintf(
                '%s@%s (%s:%d)',
                str_replace('App\\Http\\Controllers\\', '', $class),
                $method,
                str_replace(base_path().'/', '', $file),
                $reflection->getStartLine()
            );
        }

        return $found;
    }

    public function test_no_new_get_route_writes(): void
    {
        $new = array_diff_key($this->writingGetRoutes(), array_flip(self::ACCEPTED));

        $message = "These GET routes write, and nothing has to click a GET for it to fire.\n"
            .'Make the route a POST and give its CTA `method="post"`:'."\n\n";

        foreach ($new as $uri => $where) {
            $message .= sprintf("  GET %s\n      %s\n", $uri, $where);
        }

        $this->assertSame([], $new, $message);
    }

    public function test_no_write_get_route_is_linked_with_an_href(): void
    {
        $writing = $this->writingGetRoutes();

        /*
         * ⚠️ MATCH THE WHOLE URI, NOT ITS STATIC HEAD. The first version cut each uri at
         * its first `{` and matched on that prefix, so `task/{uuid}/success` was reduced
         * to `task` and reported six ordinary links to a task's own page. A route's
         * static SUFFIX is what distinguishes the action from the page it sits on.
         *
         * Each parameter becomes one path segment; an optional one may be absent.
         */
        $patterns = [];

        foreach (array_keys($writing) as $uri) {
            $pattern = '';

            foreach (explode('/', $uri) as $i => $segment) {
                $isParam = str_starts_with($segment, '{');
                $optional = (bool) preg_match('/^\{.*\?\}$/', $segment);
                $piece = $isParam ? '[^/]+' : preg_quote($segment, '#');

                $pattern .= $i === 0
                    ? $piece
                    : ($optional ? '(?:/'.$piece.')?' : '/'.$piece);
            }

            $patterns[$uri] = '#^'.$pattern.'$#';
        }

        $names = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if ($route->getName() && isset($writing[$route->uri()])) {
                $names[$route->getName()] = $route->uri();
            }
        }

        $offenders = [];

        foreach ($this->markupFiles() as $path => $source) {
            // ⚠️ Commented-out markup is not shipped markup — a `{{-- … --}}` block in
            // `email/subs-failed.blade.php` holds a dead `/cancel-subs/` link and reported
            // as a live one on the first run.
            $source = preg_replace('!\{\{--.*?--\}\}!s', '', $source);
            $source = preg_replace('!/\*.*?\*/!s', '', (string) $source);
            $source = preg_replace('#(?<!:)//[^\n]*#', '', (string) $source);

            $lines = explode("\n", (string) $source);

            foreach ($lines as $i => $line) {
                if (! preg_match_all('/href\s*=\s*\{?\s*[\'"`]([^\'"`]+)[\'"`]/', $line, $literal)) {
                    $literal = [1 => []];
                }

                foreach ($literal[1] as $href) {
                    // Only our own paths. An absolute URL to another host is not our route.
                    $path_ = ltrim((string) parse_url($href, PHP_URL_PATH), '/');

                    if ($path_ === '' || str_contains($href, '://')) {
                        continue;
                    }

                    foreach ($patterns as $uri => $pattern) {
                        if (preg_match($pattern, rtrim($path_, '/'))) {
                            $offenders[$uri][] = $path.':'.($i + 1);
                        }
                    }
                }

                // `href={route("name")}` — the same thing said with Ziggy.
                if (preg_match_all('/href\s*=\s*\{\s*route\(\s*[\'"]([^\'"]+)[\'"]/', $line, $named)) {
                    foreach ($named[1] as $name) {
                        if (isset($names[$name])) {
                            $offenders[$names[$name]][] = $path.':'.($i + 1);
                        }
                    }
                }
            }
        }

        $unexpected = array_diff_key($offenders, self::ACCEPTED_LINKED);

        $message = "A write-GET route is sitting in our markup as an href, where any\n"
            ."prefetcher, link scanner or inbox can fetch it. Make the route a POST:\n\n";

        foreach ($unexpected as $uri => $where) {
            $message .= sprintf("  GET %s\n      %s\n      %s\n", $uri, $writing[$uri] ?? '?', implode(' · ', array_unique($where)));
        }

        $this->assertSame([], $unexpected, $message);
    }

    /**
     * @return array<string, string> relative path => source
     */
    private function markupFiles(): array
    {
        $files = [];

        foreach (['resources/js', 'resources/views'] as $dir) {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator(base_path($dir), \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                if (! $file->isFile() || ! preg_match('/\.(jsx?|tsx?|php)$/', $file->getFilename())) {
                    continue;
                }

                // A generated snapshot of every route, not markup.
                if ($file->getFilename() === 'ziggy.js') {
                    continue;
                }

                $relative = str_replace(base_path().'/', '', $file->getPathname());
                $files[$relative] = (string) file_get_contents($file->getPathname());
            }
        }

        return $files;
    }
}
