<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use App\Support\ListingPublication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * A listing goes live when it is saved; the checks retract it.
 *
 * 🚨 THE SOURCE SCANS ARE THE LOAD-BEARING HALF. The fault this closes was not one
 * wrong value — it was that all six sellable modules wrote their own held literal at
 * create and nothing in the codebase could ever write the live one. A behavioural
 * test of one module would have passed while the other five stayed broken, which is
 * exactly the shape the original bug had.
 */
class ListingAutoPublishTest extends TestCase
{
    use RefreshDatabase;

    /** The six modules, and the file that creates each one. */
    private const CONTROLLERS = [
        'app/Http/Controllers/TaskController.php',
        'app/Http/Controllers/PiggyPotController.php',
        'app/Http/Controllers/Auth/WishitemController.php',
        'app/Http/Controllers/Auth/BillsController.php',
        'app/Http/Controllers/Auth/MembershipController.php',
        'app/Http/Controllers/Auth/ShopsController.php',
    ];

    private function source(string $path): string
    {
        $source = file_get_contents(base_path($path));

        // Comments explain these values by quoting them — a raw scan finds the very
        // strings it is checking have gone. Blanked, newline count preserved so a
        // reported line number still points at real code.
        return preg_replace_callback(
            '#/\*.*?\*/|//[^\n]*#s',
            fn ($m) => str_repeat("\n", substr_count($m[0], "\n")),
            $source
        );
    }

    public function test_every_module_hands_its_scanners_the_shared_held_attributes(): void
    {
        foreach (self::CONTROLLERS as $path) {
            $source = $this->source($path);

            foreach ([
                "'approved' => 0",
                "'is_approved' => 0",
                "'is_approved' => false",
                "'status' => 'moderation_hold'",
            ] as $literal) {
                $this->assertStringNotContainsString(
                    $literal,
                    $source,
                    $path.' writes a held value as a literal. Every scanner takes '
                    .'ListingPublication::heldAttributes($item) — the admin Content Review '
                    .'queue reads these values from the other app, so a module spelling its '
                    .'own is a listing held where nobody can see it.'
                );
            }
        }
    }

    public function test_no_module_creates_a_listing_already_held(): void
    {
        foreach (self::CONTROLLERS as $path) {
            $source = $this->source($path);

            $this->assertStringContainsString(
                'ListingPublication::',
                $source,
                $path.' never publishes. A listing that is created held stays held: '
                .'nothing in this codebase releases one, and the admin queue that used '
                .'to is what the simplification plan removed.'
            );
        }
    }

    /**
     * ⚠️ A SOURCE SCAN, because the first version of this test built its own Task,
     * set the flag itself and asserted the flag it had just set — it passed with the
     * bug replanted in the controller, i.e. it could not fail. The question here is
     * what TASKCONTROLLER writes, and nothing about a hand-made model can answer it.
     */
    public function test_a_task_is_created_live(): void
    {
        $source = $this->source('app/Http/Controllers/TaskController.php');

        $this->assertStringContainsString(
            '$task->is_approved = true;',
            $source,
            'A new task must be on sale the moment it is saved — this is the case that '
            .'was reported: a clean task showing PENDING REVIEW with no queue left to '
            .'clear it.'
        );

        foreach (['$task->is_approved = false', '$task->is_approved = 0'] as $held) {
            $this->assertStringNotContainsString(
                $held,
                $source,
                'Nothing in TaskController may put a task back to unapproved: only a '
                .'scan (through ListingPublication::heldAttributes) or an admin does that.'
            );
        }
    }

    public function test_publish_clears_the_reason_the_listing_was_held_for(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $shop = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'A clean listing',
            'price' => 10,
            'currency' => 'GBP',
            'approved' => 0,
            'moderation_reason' => 'Held because the description contains "gift".',
            'moderation_asset' => 'reward_text',
        ]);

        $this->assertTrue(ListingPublication::isHeld($shop));
        $this->assertTrue(ListingPublication::publish($shop));

        $shop->refresh();

        $this->assertEquals(1, $shop->approved);
        // A live listing carrying the sentence it was held for goes on telling the
        // creator it is under review while it is on sale.
        $this->assertNull($shop->moderation_reason);
        $this->assertNull($shop->moderation_asset);
    }

    public function test_an_edit_does_not_lift_a_hold_on_an_asset_the_creator_did_not_replace(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $shop = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Held on its picture',
            'price' => 10,
            'currency' => 'GBP',
            'approved' => 0,
            'moderation_reason' => 'Held after a check on the product image.',
            'moderation_asset' => 'product_image',
        ]);

        // The creator edited the price and left the flagged picture in place. The
        // media scans deliberately skip an unchanged file, so republishing here
        // would put the flagged image back on sale with nothing left to catch it.
        $this->assertFalse(ListingPublication::republish($shop, ['reward_file']));
        $this->assertEquals(0, $shop->fresh()->approved);

        // Replacing it is what lifts the hold — and the fresh scan can still re-hold.
        $this->assertTrue(ListingPublication::republish($shop, ['product_image']));
        $this->assertEquals(1, $shop->fresh()->approved);
    }

    public function test_an_edit_never_overturns_a_hold_a_person_decided(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $shop = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Held by an admin',
            'price' => 10,
            'currency' => 'GBP',
            'approved' => 0,
        ]);

        // An admin's hold records no asset key. Without that distinction a creator
        // could overturn a decision somebody took by saving the form again.
        $this->assertFalse(ListingPublication::republish($shop, ['product_image', 'reward_file']));
        $this->assertEquals(0, $shop->fresh()->approved);
    }

    public function test_republish_leaves_a_listing_that_is_not_held_alone(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $shop = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Already live',
            'price' => 10,
            'currency' => 'GBP',
            'approved' => 1,
        ]);

        // Control. A Piggy Pot can legitimately be `completed` or `expired`, and a
        // blanket publish on every edit would reopen a goal that had finished.
        $this->assertFalse(ListingPublication::republish($shop, ['product_image']));
        $this->assertEquals(1, $shop->fresh()->approved);
    }
}
