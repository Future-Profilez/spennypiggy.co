<?php

namespace Tests\Feature;

use App\Models\PromoCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Signup promo codes.
 *
 * An admin could create a code, a fan could type it and be told "Code applied.", and
 * **nothing happened**: `checkCouponCode` only asked whether the row existed, the
 * signup discarded the value entirely, and `users.promo_code_id` was written by
 * nobody — which also left the admin panel's "who used this code" list
 * (`Admin\PromoCodeController::getPromoCodeUser`, reading exactly that column) empty
 * for every code ever created. `limit`, `start_date` and `end_date` were columns
 * nothing consulted, so a code that expired two years ago still validated.
 *
 * 🚨 A CODE STILL GRANTS NOTHING — `promo_codes` has no discount, amount or
 * free-period column, so it cannot express a benefit. These tests cover redemption
 * being RECORDED and bounded, not a discount being applied. Do not read them as
 * evidence that something downstream consumes the code.
 */
class PromoCodeRedemptionTest extends TestCase
{
    use RefreshDatabase;

    private function code(array $attrs = []): PromoCode
    {
        return PromoCode::create(array_merge([
            'name' => 'New Signup',
            'code' => 'NEW100',
        ], $attrs));
    }

    private function registerFan(array $overrides = []): TestResponse
    {
        // Same shape as MarketingConsentTest's helper — the register endpoint
        // validates more than the obvious fields, and a payload short of them
        // fails validation rather than reaching the promo branch at all.
        return $this->post(route('register'), array_merge([
            'name' => 'Sam Fan',
            'username' => 'samfan',
            'email' => 'sam@example.com',
            'password' => 'Str0ng!Passw0rd',
            'password_confirmation' => 'Str0ng!Passw0rd',
            'role' => 0,
            'country' => 'GB',
        ], $overrides));
    }

    public function test_a_valid_code_is_recorded_against_the_new_account(): void
    {
        $promo = $this->code();

        $this->registerFan(['promo' => 'NEW100']);

        $this->assertSame(
            $promo->id,
            User::where('email', 'sam@example.com')->value('promo_code_id'),
            'The redemption is the only thing that makes `limit` countable and the admin list non-empty.'
        );
        $this->assertSame(1, $promo->fresh()->redemptions());
    }

    public function test_signing_up_without_a_code_records_nothing(): void
    {
        $this->code();

        $this->registerFan();

        $this->assertNull(User::where('email', 'sam@example.com')->value('promo_code_id'));
    }

    /**
     * 🚨 The id is resolved from the typed CODE, never accepted from the request.
     * `promo_code_id` is deliberately absent from `User::$fillable` so a posted
     * value cannot attribute somebody to a code they never typed.
     */
    public function test_a_posted_promo_code_id_is_ignored(): void
    {
        $promo = $this->code();

        $this->registerFan(['promo_code_id' => $promo->id]);

        $this->assertNull(User::where('email', 'sam@example.com')->value('promo_code_id'));
    }

    public function test_an_expired_code_is_refused(): void
    {
        $this->code(['end_date' => now()->subDay()->toDateString()]);

        $this->getJson('/check-coupon-code/NEW100')
            ->assertOk()
            ->assertJson(['status' => false, 'msg' => 'That code has expired.']);
    }

    public function test_a_code_that_has_not_started_is_refused(): void
    {
        $this->code(['start_date' => now()->addWeek()->toDateString()]);

        $this->getJson('/check-coupon-code/NEW100')
            ->assertOk()
            ->assertJson(['status' => false, 'msg' => 'That code is not active yet.']);
    }

    public function test_a_code_at_its_limit_is_refused(): void
    {
        $promo = $this->code(['limit' => 1]);
        User::factory()->create(['promo_code_id' => $promo->id]);

        $this->getJson('/check-coupon-code/NEW100')
            ->assertOk()
            ->assertJson(['status' => false, 'msg' => 'That code has been fully claimed.']);
    }

    /**
     * The form checks the code minutes before the signup posts. If only the form
     * enforced the limit, the last seat could go in between and the fan would be
     * told it applied and then registered without it.
     */
    public function test_the_limit_is_enforced_again_at_signup(): void
    {
        $promo = $this->code(['limit' => 1]);
        User::factory()->create(['promo_code_id' => $promo->id]);

        $this->registerFan(['promo' => 'NEW100']);

        $this->assertNull(User::where('email', 'sam@example.com')->value('promo_code_id'));
    }

    /** NULL limit and NULL dates mean no restriction — every existing row is in that state. */
    public function test_an_unbounded_code_stays_valid(): void
    {
        $this->code();

        $this->getJson('/check-coupon-code/NEW100')
            ->assertOk()
            ->assertJson(['status' => true, 'msg' => 'Code applied.']);
    }

    public function test_a_withdrawn_code_no_longer_validates(): void
    {
        $this->code()->delete();

        $this->getJson('/check-coupon-code/NEW100')
            ->assertOk()
            ->assertJson(['status' => false, 'msg' => "That code isn't valid."]);
    }

    /** Unauthenticated and it answers "does this code exist?" — so it is rate limited. */
    public function test_the_code_check_is_throttled(): void
    {
        $this->assertContains(
            'throttle:20,1',
            app('router')->getRoutes()->getByName('checkCouponCode')->gatherMiddleware()
        );
    }
}
