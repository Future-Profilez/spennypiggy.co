<?php

namespace Tests;

use App\SeoMeta;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * 🚨 `SeoMeta` KEEPS ITS TAGS IN A STATIC, AND A PHPUNIT RUN IS ONE PROCESS.
     *
     * `addTag()` APPENDS for everything except the title, so every meta, link and
     * JSON-LD block a test causes to be set stays there for every test that runs
     * after it. `CspInlineScriptTest` renders `view('app')` directly — no HTTP
     * request, so no `cspNonce` is shared — and a JSON-LD block left behind by an
     * earlier test therefore arrived un-nonced and failed the assertion. It passed
     * in isolation and failed in the full run, i.e. the result depended on test
     * ORDER.
     *
     * That is the thing worth fixing rather than the one assertion: a suite that
     * fails at random makes the green-regression release gate meaningless, which
     * is the same reason the Stripe HTTP client was taken offline in `testing`.
     *
     * ⚠️ **Production is NOT affected and this needed no production change.** Vapor
     * serves HTTP through PHP-FPM, where each request is a fresh script execution
     * and statics do not survive between requests. (An Octane deployment WOULD leak
     * these across requests in one worker — if this app ever moves to Octane, reset
     * `SeoMeta` per request rather than relying on that.)
     */
    protected function setUp(): void
    {
        parent::setUp();

        SeoMeta::clear();
    }
}
