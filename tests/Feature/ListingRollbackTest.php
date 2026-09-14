<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Support\ListingRollback;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * 🚨 A LISTING THAT FAILED AT STRIPE WAS KNOWN ONLY TO THE CREATOR.
 *
 * Four create paths (shop, wish, bill, membership) write their row, call Stripe,
 * and on failure soft-delete the row and answer with the raw Stripe message.
 * None of them reported the exception, and `StripeControl::createProduct` logged
 * its only logged branch at INFO — which the `sentry` channel (error and above)
 * drops. So the row was gone, Sentry was clean, and the only record left was the
 * phantom `listing_created` row the activity projector had already swept.
 */
class ListingRollbackTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 🚨 THE SOURCE SCAN IS THE POINT.
     *
     * Reaching each controller's catch needs a live Stripe refusal, and what has
     * to be pinned is that a fifth create path copied from one of these four
     * still tells somebody. A per-route test could never see that.
     */
    public function test_every_stripe_rollback_goes_through_the_helper(): void
    {
        $paths = [
            'app/Http/Controllers/Auth/ShopsController.php',
            'app/Http/Controllers/Auth/WishitemController.php',
            'app/Http/Controllers/Auth/BillsController.php',
            'app/Http/Controllers/Auth/MembershipController.php',
        ];

        foreach ($paths as $path) {
            $source = file_get_contents(base_path($path));

            $this->assertStringContainsString(
                'ListingRollback::stripeFailed(',
                $source,
                "{$path} rolls a listing back without ListingRollback, so the failure reaches nobody but the creator."
            );

            /*
             * ⚠️ The raw Stripe message is written for an integrator and told the
             * creator nothing they could act on. Comments are blanked first — the
             * helper's own docblock quotes the old string.
             */
            $code = preg_replace('#/\*.*?\*/#s', '', $source);
            $code = preg_replace('#//[^\n]*#', '', (string) $code);

            $this->assertStringNotContainsString(
                "'Stripe Error: '.\$e->getMessage()",
                (string) $code,
                "{$path} still prints Stripe's own error text at a creator."
            );
        }
    }

    public function test_it_rolls_the_listing_back_and_reports(): void
    {
        Log::spy();

        $shop = $this->makeShop();

        $message = ListingRollback::stripeFailed($shop, new \Exception('No such price'), ['module' => 'shop']);

        $this->assertSoftDeleted('shops', ['id' => $shop->id]);
        Log::shouldHaveReceived('error')->atLeast()->once();
        $this->assertMatchesRegularExpression('/quote [A-Z0-9]{8}\./', $message);
    }

    /** An EDIT must not destroy a listing that already has orders against it. */
    public function test_an_update_failure_keeps_the_listing(): void
    {
        Log::spy();

        $shop = $this->makeShop();

        ListingRollback::stripeFailed($shop, new \Exception('boom'), [], rollback: false);

        $this->assertNotSoftDeleted('shops', ['id' => $shop->id]);
        Log::shouldHaveReceived('error')->atLeast()->once();
    }

    /** Stripe's own words never reach the creator, whichever branch runs. */
    public function test_the_stripe_message_is_never_in_the_creator_facing_text(): void
    {
        Log::spy();

        $secret = 'parameter_invalid_empty: images[0]';

        $message = ListingRollback::stripeFailed($this->makeShop(), new \Exception($secret));

        $this->assertStringNotContainsString($secret, $message);
    }

    private function makeShop(): Shop
    {
        $shop = new Shop;
        $shop->uuid = (string) Str::uuid();
        $shop->user_id = 1;
        $shop->name = 'Test item';
        $shop->description = 'x';
        $shop->price = 10;
        $shop->currency = 'gbp';
        $shop->save();

        return $shop;
    }
}
