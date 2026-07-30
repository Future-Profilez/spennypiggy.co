<?php

namespace Tests\Unit;

use App\Http\Controllers\Auth\CheckoutController;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Covers CheckoutController::checkoutRedirect.
 *
 * The bug it exists for: successCheckout resolved the creator with
 * $stripeid->owner->username ?? $getdata[0]->owner->username, and $getdata is
 * legitimately an EMPTY collection on several paths (a guest whose device id no
 * longer matches, a session already processed). Indexing [0] then threw
 * "Undefined array key 0" mid-checkout — the buyer had paid and got a 500.
 */
class CheckoutRedirectTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::get('/{username}', fn () => '')->name('user.show');
        Route::get('/', fn () => '')->name('home');
    }

    private function redirect($owner, $getdata): RedirectResponse
    {
        $method = new ReflectionMethod(CheckoutController::class, 'checkoutRedirect');
        $method->setAccessible(true);

        return $method->invoke(
            $this->app->make(CheckoutController::class),
            $owner,
            $getdata,
            'error',
            'Something went wrong!'
        );
    }

    private function cartRowFor(string $username): object
    {
        return (object) ['owner' => (object) ['username' => $username]];
    }

    public function test_it_uses_the_payment_owner_when_there_is_one(): void
    {
        $response = $this->redirect((object) ['username' => 'creatorA'], collect());

        $this->assertStringEndsWith('/creatorA', $response->getTargetUrl());
    }

    public function test_it_falls_back_to_the_first_cart_row_when_the_payment_has_no_owner(): void
    {
        $response = $this->redirect(null, collect([$this->cartRowFor('creatorB')]));

        $this->assertStringEndsWith('/creatorB', $response->getTargetUrl());
    }

    public function test_an_empty_cart_collection_redirects_home_instead_of_throwing(): void
    {
        // This is the exact production failure: no owner on the payment AND nothing
        // in the cart.
        $response = $this->redirect(null, collect());

        $this->assertSame(url('/'), $response->getTargetUrl());
    }

    public function test_a_null_cart_redirects_home_instead_of_throwing(): void
    {
        $response = $this->redirect(null, null);

        $this->assertSame(url('/'), $response->getTargetUrl());
    }

    public function test_a_cart_row_with_no_owner_relation_redirects_home(): void
    {
        $response = $this->redirect(null, collect([(object) ['owner' => null]]));

        $this->assertSame(url('/'), $response->getTargetUrl());
    }

    public function test_the_flash_message_is_carried_through(): void
    {
        $response = $this->redirect(null, collect());

        $this->assertSame('Something went wrong!', session('error'));
        $this->assertNotNull($response);
    }
}
