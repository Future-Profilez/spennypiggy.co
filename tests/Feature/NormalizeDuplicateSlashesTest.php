<?php

namespace Tests\Feature;

use App\Http\Middleware\NormalizeDuplicateSlashes;
use App\Http\Middleware\TrustProxies;
use Illuminate\Contracts\Http\Kernel as HttpKernelContract;
use Illuminate\Http\Request;
use ReflectionProperty;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Tests\TestCase;

class NormalizeDuplicateSlashesTest extends TestCase
{
    /**
     * The middleware is exercised directly rather than through $this->get('//x').
     *
     * Request::create() runs the URI through parse_url, which reads a leading "//"
     * as a protocol-relative URL and turns "//legal-center" into host=legal-center,
     * path=/ — the double slash never reaches the middleware. A real browser sends
     * "GET //legal-center HTTP/1.1" and the server puts that straight into
     * REQUEST_URI, which is what this builds.
     */
    private function requestFor(string $uri, string $method = 'GET'): Request
    {
        [, $query] = array_pad(explode('?', $uri, 2), 2, null);

        // The query half is built normally so QUERY_STRING is populated the way a
        // real server populates it; only the path is forced to keep its slashes.
        $request = Request::create('/'.($query !== null ? '?'.$query : ''), $method);
        $request->server->set('REQUEST_URI', $uri);

        return $request->duplicate();
    }

    private function handle(Request $request)
    {
        return (new NormalizeDuplicateSlashes)->handle(
            $request,
            fn () => response('passed through')
        );
    }

    public function test_the_request_builder_actually_produces_a_duplicated_slash_path(): void
    {
        // Guards the test itself: if this ever stops holding, every assertion below
        // would pass for the wrong reason.
        $this->assertSame('//legal-center', $this->requestFor('//legal-center')->getPathInfo());
    }

    public function test_a_get_with_duplicate_slashes_is_permanently_redirected_to_the_clean_path(): void
    {
        $response = $this->handle($this->requestFor('//legal-center'));

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertSame(301, $response->getStatusCode());
        $this->assertStringEndsWith('/legal-center', $response->headers->get('Location'));
    }

    public function test_repeated_and_interior_slashes_are_all_collapsed(): void
    {
        $response = $this->handle($this->requestFor('//admin//emulate-login///'));

        // Laravel's URL generator also trims the trailing slash — the point here is
        // that no duplicated slash survives anywhere in the path.
        $this->assertStringEndsWith('/admin/emulate-login', $response->headers->get('Location'));
    }

    public function test_the_query_string_survives_the_redirect(): void
    {
        $response = $this->handle($this->requestFor('//legal-center?tab=terms&page=2'));
        $location = $response->headers->get('Location');

        // Symfony's getQueryString() sorts the parameters, so assert on content
        // rather than on the original order — the two URLs are equivalent.
        $this->assertStringContainsString('/legal-center?', $location);
        $this->assertStringContainsString('tab=terms', $location);
        $this->assertStringContainsString('page=2', $location);
    }

    public function test_a_clean_path_is_passed_through_untouched(): void
    {
        $response = $this->handle($this->requestFor('/legal-center'));

        $this->assertSame('passed through', $response->getContent());
    }

    public function test_a_post_is_never_redirected_because_a_301_would_drop_its_body(): void
    {
        $response = $this->handle($this->requestFor('//login', 'POST'));

        $this->assertSame('passed through', $response->getContent());
    }

    public function test_an_options_preflight_is_never_redirected(): void
    {
        // This middleware runs before HandleCors: answering a preflight with a
        // redirect means the browser never sends the real request.
        $response = $this->handle($this->requestFor('//legal-center', 'OPTIONS'));

        $this->assertSame('passed through', $response->getContent());
    }

    public function test_a_head_request_is_redirected_like_a_get(): void
    {
        $response = $this->handle($this->requestFor('//legal-center', 'HEAD'));

        $this->assertSame(301, $response->getStatusCode());
    }

    public function test_it_is_registered_globally_and_after_trust_proxies(): void
    {
        // Ordering is load-bearing: it builds a redirect URL, and before
        // TrustProxies the forwarded proto is untrusted, so an https request behind
        // CloudFront would be redirected to http.
        $property = new ReflectionProperty($this->app->make(HttpKernelContract::class), 'middleware');
        $property->setAccessible(true);
        $middleware = $property->getValue($this->app->make(HttpKernelContract::class));

        $this->assertContains(NormalizeDuplicateSlashes::class, $middleware);
        $this->assertGreaterThan(
            array_search(TrustProxies::class, $middleware, true),
            array_search(NormalizeDuplicateSlashes::class, $middleware, true)
        );
    }
}
