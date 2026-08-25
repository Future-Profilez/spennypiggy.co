<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PromoBannerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * The promo deck.
 *
 * The rules worth pinning are the ones that decide what a person is TOLD:
 * audience, eligibility, and that nothing on this path can take a page down.
 */
class PromoDeckTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function deck(?User $user, array $context = []): array
    {
        Cache::flush();

        return app(PromoBannerService::class)->for($user, $context)['banners'];
    }

    private function keys(array $deck): array
    {
        return array_column($deck, 'key');
    }

    public function test_a_logged_out_visitor_is_shown_the_whole_deck(): void
    {
        $keys = $this->keys($this->deck(null));

        $this->assertContains('founder_bonus', $keys);
        $this->assertContains('supporter_wall', $keys);
        $this->assertContains('suggest_feature', $keys);
    }

    public function test_a_gifter_is_never_shown_a_creator_promo(): void
    {
        $gifter = User::factory()->create(['role' => 0]);

        $keys = $this->keys($this->deck($gifter));

        $this->assertNotContains('refer_and_earn', $keys);
        $this->assertNotContains('founder_bonus', $keys);
        $this->assertNotContains('link_in_bio', $keys);
        $this->assertContains('supporter_wall', $keys);
    }

    public function test_a_creator_is_never_shown_the_gifter_promo(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $keys = $this->keys($this->deck($creator));

        $this->assertNotContains('supporter_wall', $keys);
        $this->assertContains('refer_and_earn', $keys);
    }

    /**
     * 🚨 Eligibility outranks priority. A creator who has already sold must not be
     * told their subscription is free until their first sale — that is the slider
     * describing a state they have left.
     */
    public function test_free_until_first_sale_disappears_once_the_creator_has_sold(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $before = $this->keys($this->deck($creator, [
            'free_until_first_sale' => true,
            'has_ever_sold' => false,
        ]));
        $after = $this->keys($this->deck($creator, [
            'free_until_first_sale' => true,
            'has_ever_sold' => true,
        ]));

        $this->assertContains('free_until_first_sale', $before);
        $this->assertNotContains('free_until_first_sale', $after);
    }

    public function test_a_founder_is_not_pitched_the_founder_bonus(): void
    {
        $creator = User::factory()->create([
            'role' => 1,
            'is_founder' => 1,
            'stripe_connected_at' => now()->subDays(3),
        ]);

        $this->assertNotContains('founder_bonus', $this->keys($this->deck($creator)));
    }

    public function test_the_founder_card_closes_with_the_window(): void
    {
        $inside = User::factory()->create([
            'role' => 1,
            'is_founder' => 0,
            'stripe_connected_at' => now()->subDays(3),
        ]);
        $outside = User::factory()->create([
            'role' => 1,
            'is_founder' => 0,
            'stripe_connected_at' => now()->subDays(90),
        ]);

        $this->assertContains('founder_bonus', $this->keys($this->deck($inside)));
        $this->assertNotContains('founder_bonus', $this->keys($this->deck($outside)));
    }

    /**
     * Every card must resolve to somewhere to go, or the deck is advertising a
     * feature with no door. A promo naming an unknown route is dropped by the
     * service rather than being allowed to throw.
     */
    public function test_every_card_carries_a_destination(): void
    {
        foreach ($this->deck(null) as $card) {
            $this->assertTrue(
                filled($card['href']) || filled($card['action']),
                "Promo {$card['key']} has no href and no action",
            );
            $this->assertNotSame('', $card['headline']);
            $this->assertNotSame('', $card['cta']);
        }
    }

    /**
     * 🚨 A FIGURE ON A PROMO CARD MUST COME FROM THE THING THAT ENFORCES IT.
     *
     * An earlier pass typed the creator subscription price straight into the JSX and
     * got it wrong, so the one card whose subject is billing quoted a price the
     * platform does not charge. These assert the card reads the same config the
     * qualification job and the billing plan do.
     */
    public function test_the_founder_figures_come_from_the_founder_config(): void
    {
        config([
            'founder_bonus.qualification.min_first_30d_earnings' => 3000,
            'founder_bonus.qualification.qualification_period_days' => 45,
            'founder_bonus.limits.max_founder_seats' => 12,
        ]);

        $card = collect($this->deck(null))->firstWhere('key', 'founder_bonus');

        $this->assertSame('£3,000', $card['facts']['amount']);
        $this->assertSame('45 days', $card['facts']['window']);
        $this->assertSame('12', $card['facts']['seats']);
    }

    public function test_the_subscription_price_comes_from_the_plan(): void
    {
        config(['creator_subscription.price' => 12.50, 'creator_subscription.currency' => 'GBP']);

        $card = collect($this->deck(null))->firstWhere('key', 'free_until_first_sale');

        $this->assertSame('£12.50', $card['facts']['price']);
    }

    /**
     * 🚨 The link-in-bio promo points at a DIFFERENT PLACE depending on who is looking,
     * and its label must match. A signed-in creator wants their own page; a visitor has
     * no page yet and wants the one that explains it.
     */
    public function test_the_bio_promo_sends_a_creator_to_their_own_page(): void
    {
        $creator = User::factory()->create(['role' => 1, 'username' => 'janedoe']);

        $card = collect($this->deck($creator))->firstWhere('key', 'link_in_bio');

        $this->assertStringContainsString('/janedoe/bio', $card['href']);
        $this->assertSame('See my page', $card['cta']);
    }

    public function test_the_bio_promo_sends_a_visitor_to_the_explainer(): void
    {
        $card = collect($this->deck(null))->firstWhere('key', 'link_in_bio');

        $this->assertStringContainsString('/creators/link-in-bio', $card['href']);
        $this->assertSame('How it works', $card['cta']);
    }

    /**
     * 🚨 The referral reward is meaningless without the threshold attached to it: the
     * payout query only counts a referral once the referred creator passes £1,000 in
     * lifetime sales.
     */
    public function test_the_referral_card_carries_both_the_reward_and_the_threshold(): void
    {
        config(['referral.reward_amount' => 75]);

        $card = collect($this->deck(null))->firstWhere('key', 'refer_and_earn');

        $this->assertSame('£75', $card['facts']['reward']);
        $this->assertSame('£1,000', $card['facts']['threshold']);
    }

    /**
     * ⚠️ With tiered rates on there is no single Fast Start rate to quote, so the card
     * must be given nothing rather than one bracket's number.
     */
    public function test_fast_start_quotes_no_rate_when_tiered_pricing_is_on(): void
    {
        config(['fast_start_bonus.bonus.enable_tiered' => true]);

        $card = collect($this->deck(null))->firstWhere('key', 'fast_start');

        $this->assertArrayNotHasKey('rate', $card['facts']);
        $this->assertSame('30 days', $card['facts']['window']);
    }

    /**
     * 🚨 THE VERIFY CARD WAITS FOR ADMIN APPROVAL.
     *
     * The identity check sits behind profile approval, so pitching it to an unapproved
     * creator asks for a passport from someone whose profile photo has not been looked
     * at yet. The original rule was `tierFor() === NONE` — the state of an UNAPPROVED
     * account — so the card appeared for exactly the people who could not act on it and
     * was hidden from everyone who could.
     */
    public function test_the_verify_card_is_hidden_until_the_profile_is_approved(): void
    {
        $pending = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 1,   // awaiting admin review
            'identity_status' => 0,
        ]);
        $approved = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 2,   // admin approved
            'identity_status' => 0,
        ]);

        $this->assertNotContains('verified_badge', $this->keys($this->deck($pending)));
        $this->assertContains('verified_badge', $this->keys($this->deck($approved)));
    }

    public function test_the_verify_card_is_hidden_once_the_id_check_has_passed(): void
    {
        $verified = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 2,
            'identity_status' => 1,
        ]);

        $this->assertNotContains('verified_badge', $this->keys($this->deck($verified)));
    }

    /**
     * ⚠️ An admin rejection outranks Stripe. Sending that creator back to run the same
     * check would not change the answer, and implying it would is worse than silence.
     */
    public function test_the_verify_card_is_hidden_after_an_admin_rejection(): void
    {
        $rejected = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 2,
            'identity_status' => 0,
            'identity_admin_status' => 2,
        ]);

        $this->assertNotContains('verified_badge', $this->keys($this->deck($rejected)));
    }

    public function test_a_suspended_creator_is_never_pitched_the_badge(): void
    {
        $suspended = User::factory()->create([
            'role' => 1,
            'profile_status_lock' => 2,
            'identity_status' => 0,
            'suspended_account' => 1,
        ]);

        $this->assertNotContains('verified_badge', $this->keys($this->deck($suspended)));
    }

    /**
     * 🚨 The deck is built inside HandleInertiaRequests::share(), so it runs on
     * every Inertia response. A failure here must cost the promos, never the page.
     */
    public function test_a_broken_deck_never_throws(): void
    {
        config(['promos.banners' => ['broken' => ['route' => 'a-route-that-does-not-exist']]]);
        config(['promos.announcements' => []]);

        $this->assertSame([], $this->deck(null));
    }
}
