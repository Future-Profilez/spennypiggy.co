<?php

namespace Tests\Feature;

use App\Http\Controllers\GifterHubController;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Second-pass regression pins (25 Aug 2026): the buyer could PAY and then not
 * REACH what they bought.
 *
 * - an unlocked purchase carried no reward fields, so the "What you unlocked"
 *   block in PurchasesHub.jsx could never render for a shop item, a piggy pot
 *   or a tip — the markup was there, the payload was not;
 * - a membership's content existed in exactly one place on the platform, the
 *   confirmation email;
 * - every "open" link on the hub used `?page=`, which the profile route
 *   (`/{username}/{page?}`) ignores — so they all landed on About.
 */
class PurchaseHubReachabilityTest extends TestCase
{
    use RefreshDatabase;

    private function buyerWithShopPurchase(): array
    {
        $creator = User::factory()->create(['role' => 1]);
        $buyer = User::factory()->create(['role' => 0]);

        $shop = Shop::factory()->create([
            'user_id' => $creator->id,
            'type' => 'digital',
            'reward_file' => (string) Str::uuid(),
        ]);

        $payment = new ShopPayment;
        $payment->forceFill([
            'uuid' => (string) Str::uuid(),
            'shop_id' => $shop->id,
            'user_id' => $buyer->id,
            'session_id' => 'cs_hubreach_'.Str::random(8),
            'payment_status' => 'paid',
            'amount' => 20,
            'currency' => 'GBP',
        ])->save();

        return [$buyer, $creator, $shop, $payment];
    }

    public function test_an_unlocked_shop_purchase_carries_its_reward_so_the_buyer_can_reach_it(): void
    {
        [$buyer, , $shop] = $this->buyerWithShopPurchase();

        $data = $this->actingAs($buyer)->getJson(route('gifter.hub.data'))->assertOk()->json();

        $item = collect($data['unlocked'])->firstWhere('source_type', 'shop');

        $this->assertNotNull($item, 'The shop purchase must appear as an unlocked entitlement.');
        $this->assertSame('file', $item['reward_type']);
        $this->assertNotEmpty($item['reward_url'], 'Without this the "What you unlocked" block cannot render.');
        $this->assertStringContainsString($shop->reward_file, $item['reward_url']);
    }

    public function test_every_hub_open_link_is_a_path_segment_not_a_query_parameter(): void
    {
        [$buyer] = $this->buyerWithShopPurchase();

        $data = $this->actingAs($buyer)->getJson(route('gifter.hub.data'))->assertOk()->json();

        $links = collect($data)
            ->flatten(1)
            ->filter(fn ($row) => is_array($row) && array_key_exists('open_link', $row))
            ->pluck('open_link')
            ->filter()
            ->values();

        $this->assertNotEmpty($links, 'The fixture must produce at least one linked card.');

        foreach ($links as $link) {
            $this->assertStringNotContainsString('?page=', $link,
                "`/{username}?page=x` renders About with a 200 — the page is a PATH segment. Got: {$link}");
        }
    }

    /** @dataProvider profilePages */
    public function test_the_hub_only_links_to_pages_the_profile_route_answers(string $page, string $expected): void
    {
        $controller = new \ReflectionMethod(GifterHubController::class, 'openLink');
        $controller->setAccessible(true);

        $link = $controller->invoke(app(GifterHubController::class), (object) ['username' => 'jane'], $page);

        $this->assertSame("/jane/{$expected}", $link);
    }

    public static function profilePages(): array
    {
        return [
            'a real page is kept' => ['shop', 'shop'],
            'piggy pots keep their hyphen' => ['piggy-pots', 'piggy-pots'],
            // `tips` has no case in getPageSpecificData(); Piggy Bank renders on About.
            'tips falls back to about' => ['tips', 'about'],
            'anything unroutable falls back to about' => ['not-a-page', 'about'],
        ];
    }

    public function test_an_active_membership_exposes_its_content_to_the_member(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        $member = User::factory()->create(['role' => 0]);

        $membership = Membership::factory()->create([
            'user_id' => $creator->id,
            'content_file' => (string) Str::uuid(),
        ]);

        $payment = new MembershipPayment;
        $payment->forceFill([
            'uuid' => (string) Str::uuid(),
            'membership_id' => $membership->id,
            'user_id' => $member->id,
            'session_id' => 'cs_memreach_'.Str::random(8),
            'stripe_id' => 'sub_'.Str::random(12),
            'status' => 'paid',
            'amount' => 10,
            'currency' => 'GBP',
            'recurring_type' => 'monthly',
            'recurring_for' => 'continue',
            'upcoming_payment' => now()->addMonth(),
        ])->save();

        $data = $this->actingAs($member)->getJson(route('gifter.hub.data'))->assertOk()->json();

        $sub = collect($data['subscriptions'])->firstWhere('source_type', 'membership');

        $this->assertNotNull($sub);
        $this->assertTrue($sub['is_active']);
        $this->assertSame('file', $sub['reward_type'],
            "A member's content was reachable only from the confirmation email before this.");
        $this->assertStringContainsString($membership->content_file, $sub['reward_url']);
    }

    /**
     * ⚠️ A tier's `content_file` is one mutable column the creator swaps each
     * cycle, so today's file is not the one a lapsed member paid for.
     */
    public function test_an_ended_membership_does_not_keep_serving_todays_content(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        $member = User::factory()->create(['role' => 0]);

        $membership = Membership::factory()->create([
            'user_id' => $creator->id,
            'content_file' => (string) Str::uuid(),
        ]);

        $payment = new MembershipPayment;
        $payment->forceFill([
            'uuid' => (string) Str::uuid(),
            'membership_id' => $membership->id,
            'user_id' => $member->id,
            'session_id' => 'cs_memended_'.Str::random(8),
            'status' => 'ended',
            'amount' => 10,
            'currency' => 'GBP',
            'recurring_type' => 'monthly',
            'upcoming_payment' => now()->subMonth(),
        ])->save();

        $data = $this->actingAs($member)->getJson(route('gifter.hub.data'))->assertOk()->json();

        $sub = collect($data['subscriptions'])->firstWhere('source_type', 'membership');

        $this->assertNotNull($sub, 'An ended subscription stays listed so the buyer can see what they had.');
        $this->assertFalse($sub['is_active']);
        $this->assertNull($sub['reward_url']);
    }
}
