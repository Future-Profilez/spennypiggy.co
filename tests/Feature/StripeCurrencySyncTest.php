<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\StripeCurrencySync;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StripeCurrencySyncTest extends TestCase
{
    use RefreshDatabase;

    private function account(?string $currency): object
    {
        return (object) ['id' => 'acct_test123', 'default_currency' => $currency];
    }

    public function test_it_stores_the_currency_stripe_reports(): void
    {
        $user = User::factory()->create(['default_currency' => 'GBP', 'account_id' => 'acct_test123']);

        $result = StripeCurrencySync::apply($user, $this->account('nzd'), 'test');

        $this->assertSame('NZD', $result);
        $this->assertSame('NZD', $user->fresh()->default_currency);
    }

    public function test_an_absent_currency_never_resets_the_creator_to_the_gbp_default(): void
    {
        // Stripe omits default_currency until the account has a country. Treating
        // that as "reset them" is exactly the fault this class exists to close.
        $user = User::factory()->create(['default_currency' => 'NZD', 'account_id' => 'acct_test123']);

        $this->assertNull(StripeCurrencySync::apply($user, $this->account(null), 'test'));
        $this->assertSame('NZD', $user->fresh()->default_currency);
    }

    public function test_a_malformed_currency_is_refused(): void
    {
        $user = User::factory()->create(['default_currency' => 'GBP', 'account_id' => 'acct_test123']);

        $this->assertNull(StripeCurrencySync::apply($user, $this->account('pounds'), 'test'));
        $this->assertSame('GBP', $user->fresh()->default_currency);
    }

    public function test_a_matching_currency_is_not_rewritten_just_to_change_its_case(): void
    {
        // Rows written by the old connectReturn line hold Stripe's lower-case
        // string. Those are correct values; a no-op UPDATE on every webhook is
        // noise in the audit trail. Asserted against the RAW column, because
        // User::getDefaultCurrencyAttribute() uppercases on read and would hide
        // a rewrite entirely.
        $user = User::factory()->create(['default_currency' => 'nzd', 'account_id' => 'acct_test123']);
        DB::table('users')->whereKey($user->id)->update(['default_currency' => 'nzd']);

        $this->assertNull(StripeCurrencySync::apply($user->fresh(), $this->account('nzd'), 'test'));
        $this->assertSame('nzd', DB::table('users')->where('id', $user->id)->value('default_currency'));
    }

    public function test_it_never_throws(): void
    {
        // Every caller sits inside a Stripe webhook or an onboarding redirect.
        $user = User::factory()->create(['default_currency' => 'GBP', 'account_id' => 'acct_test123']);

        $this->assertNull(StripeCurrencySync::apply($user, 'not-an-account-object', 'test'));
        $this->assertSame('GBP', $user->fresh()->default_currency);
    }

    public function test_it_accepts_an_array_payload(): void
    {
        // The webhook hands us a Stripe object; a replayed payload is an array.
        $user = User::factory()->create(['default_currency' => 'GBP', 'account_id' => 'acct_test123']);

        $this->assertSame('EUR', StripeCurrencySync::apply($user, ['default_currency' => 'eur'], 'test'));
    }
}
