<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Services\ItemShareService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A shared listing link has to unfurl as the product, and must never leak the thing
 * the buyer is paying for.
 */
class ItemShareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * ⚠️ Pre-existing `shops` schema drift — see StockWaitlistTest for the full note.
     * A freshly migrated `shops` table has no `type`/`price`/`currency`/`image` columns.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Schema::table('shops', function (Blueprint $table) {
            foreach (['type' => 'string', 'currency' => 'string', 'image' => 'string'] as $column => $kind) {
                if (! Schema::hasColumn('shops', $column)) {
                    $table->{$kind}($column)->nullable();
                }
            }
            if (! Schema::hasColumn('shops', 'price')) {
                $table->double('price')->nullable();
            }
            if (! Schema::hasColumn('shops', 'slot_limitation')) {
                $table->integer('slot_limitation')->nullable();
            }
        });
    }

    private function creator(): User
    {
        return User::factory()->create([
            'role' => 1,
            'name' => 'Test Creator',
            'username' => 'testcreator',
            'account_id' => 'acct_test',
        ]);
    }

    private function shop(User $creator, array $overrides = []): Shop
    {
        return Shop::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Studio Setup',
            'description' => 'A look behind the scenes at my studio.',
            'price' => 19.99,
            'currency' => 'gbp',
            'image' => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            'reward_title' => 'Full resolution photo set',
            'reward_body' => 'SECRET-PAID-CONTENT-LINK',
            'approved' => 1,
        ], $overrides));
    }

    public function test_the_share_link_is_canonical_and_attributable(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $url = ItemShareService::shareUrl($shop, 'shop');

        $this->assertStringContainsString('/shop/item/studio-setup/'.$shop->uuid, $url);
        // Without the tag, every share a creator sends lands in the funnels as `direct`.
        $this->assertStringContainsString('utm_source=creator_share', $url);
    }

    public function test_the_preview_never_carries_the_paid_content(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $meta = ItemShareService::metaFor($shop, 'shop', $creator);
        $encoded = json_encode($meta);

        // A link preview is the most public surface on the platform.
        $this->assertStringNotContainsString('SECRET-PAID-CONTENT-LINK', $encoded);
        // The reward HEADLINE is what sells it, and that is fine to show.
        $this->assertStringContainsString('Full resolution photo set', $meta['description']);
    }

    public function test_the_preview_copy_stays_content_first(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $meta = ItemShareService::metaFor($shop, 'shop', $creator);
        $caption = ItemShareService::captionFor($shop, 'shop', $creator);
        $text = strtolower($meta['title'].' '.$meta['description'].' '.$caption);

        // Meta is printed in search results and social cards, so the Stripe
        // content-first ban list applies to it in full.
        foreach (['gift', 'tip ', 'donation', 'donate', 'fundraise', 'fundraising'] as $banned) {
            $this->assertStringNotContainsString($banned, $text, "Share copy contains '{$banned}'.");
        }
    }

    public function test_the_card_image_uses_a_valid_uploadcare_operation(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        $image = ItemShareService::imageFor($shop, 'shop');

        // `-/quality/85/` is not a valid operation — the CDN answers 400 and the
        // preview silently breaks everywhere the link is posted.
        $this->assertStringNotContainsString('quality/85', $image);
        $this->assertStringContainsString('/-/format/jpeg/', $image);
        $this->assertStringContainsString('1200x630', $image);
        $this->assertStringStartsWith('https://ucarecdn.com/aaaaaaaa-', $image);
    }

    public function test_a_stored_cdn_url_is_not_double_prefixed(): void
    {
        $creator = $this->creator();

        $task = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'Custom voice note',
            'description' => 'A personal recording made for you.',
            'price' => 25,
            'currency' => 'gbp',
            'category' => 'audio',
            'type' => 'instant',
            'status' => 'active',
            // Task stores a FULL url where Shop stores a bare uuid. Getting that
            // backwards produces ucarecdn.com/https://ucarecdn.com/… and a dead card.
            'media_url' => 'https://ucarecdn.com/11111111-2222-3333-4444-555555555555/-/preview/',
            'is_approved' => true,
        ]);

        $image = ItemShareService::imageFor($task, 'task');

        $this->assertSame(
            'https://ucarecdn.com/11111111-2222-3333-4444-555555555555/-/scale_crop/1200x630/center/-/format/jpeg/-/quality/smart/',
            $image
        );
    }

    public function test_a_sold_out_item_is_still_shareable_but_reports_it_honestly(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator, ['slot_limitation' => 0]);

        $meta = ItemShareService::metaFor($shop, 'shop', $creator);
        $schema = ItemShareService::productSchema($shop, 'shop', $creator, $meta);

        // Still shareable — the waitlist is exactly what a sold-out visitor is there
        // for — but the structured data does not claim it is in stock.
        $this->assertNotEmpty($meta['url']);
        $this->assertSame('https://schema.org/OutOfStock', $schema['offers']['availability']);
        $this->assertStringNotContainsString('Sold out', $meta['title']);
    }

    public function test_an_unsupported_type_produces_nothing_rather_than_a_broken_link(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator);

        // Membership and bill detail pages sit behind `auth`, so they are deliberately
        // not in the map — an unfurler is redirected to login and there is nothing to tag.
        $this->assertFalse(ItemShareService::supports('membership'));
        $this->assertNull(ItemShareService::shareUrl($shop, 'membership'));
        $this->assertSame([], ItemShareService::metaFor($shop, 'membership', $creator));
    }

    public function test_an_item_with_no_image_yields_no_image_rather_than_a_broken_url(): void
    {
        $creator = $this->creator();
        $shop = $this->shop($creator, ['image' => null]);

        $this->assertNull(ItemShareService::imageFor($shop, 'shop'));
    }
}
