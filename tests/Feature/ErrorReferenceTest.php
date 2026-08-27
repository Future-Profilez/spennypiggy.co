<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * The support reference is only worth showing if support can look it up.
 *
 * These pin the two facts that make it real: it comes from the SERVER, and the
 * value on the page is the value in the log. A browser-generated reference
 * looks identical on screen and is unsearchable, which is the failure this
 * closes — so a test that only checked "a reference is displayed" would pass
 * against the broken version.
 */
class ErrorReferenceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::get('/__test_boom', function () {
            abort(500);
        })->middleware('web');
    }

    public function test_the_error_page_receives_a_server_generated_reference(): void
    {
        $this->get('/__test_boom')
            ->assertStatus(500)
            ->assertInertia(
                fn (AssertableInertia $page) => $page
                    ->component('ErrorPage')
                    ->where('status', 500)
                    ->has('reference')
            );
    }

    public function test_the_reference_on_the_page_is_the_one_written_to_the_log(): void
    {
        $logged = null;

        Log::listen(function ($message) use (&$logged) {
            if ($message->message === 'Unhandled exception') {
                $logged = $message->context['reference'] ?? null;
            }
        });

        $this->get('/__test_boom')
            ->assertInertia(
                fn (AssertableInertia $page) => $page->where('reference', fn ($ref) => $ref === $logged)
            );

        $this->assertNotNull($logged, 'The unhandled-exception log line carried no reference.');
    }

    public function test_two_faults_do_not_share_a_reference(): void
    {
        $first = $this->referenceFrom($this->get('/__test_boom'));
        $second = $this->referenceFrom($this->get('/__test_boom'));

        $this->assertNotSame($first, $second);
        $this->assertMatchesRegularExpression('/^SP-\d{6}-\d{4}-[0-9A-F]{4}$/', $first);
    }

    private function referenceFrom($response): string
    {
        $reference = null;

        $response->assertInertia(function (AssertableInertia $page) use (&$reference) {
            $reference = $page->toArray()['props']['reference'];
        });

        return $reference;
    }

    /**
     * A 4xx is the caller's fault. With the `sentry` log channel in the stack, an
     * error-level line becomes an issue in the stream - and bots POST to `/` all day.
     * The line must still exist, with its reference, at warning level.
     */
    public function test_a_client_error_is_logged_at_warning_not_error(): void
    {
        Log::spy();

        // POST to a GET-only route -> MethodNotAllowedHttpException -> 405.
        $this->post('/')->assertStatus(405);

        Log::shouldNotHaveReceived('error');
        Log::shouldHaveReceived('warning')->atLeast()->once();
    }

    public function test_a_server_error_is_still_logged_at_error(): void
    {
        Log::spy();

        Route::get('/__boom', function () {
            throw new \RuntimeException('boom');
        });

        $this->get('/__boom')->assertStatus(500);

        Log::shouldHaveReceived('error')->atLeast()->once();
    }
}
