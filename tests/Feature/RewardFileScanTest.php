<?php

namespace Tests\Feature;

use App\Jobs\CheckMediaModeration;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\WishItem;
use App\Support\RewardFileScan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

/**
 * The paid file is scanned, on every module — not just the shop front.
 *
 * 🚨 The failure this pins: five of the six sellable modules scanned their
 * thumbnail and shipped the reward file to the buyer unscanned. Shop alone had a
 * reward-file check, written on 27 July 2026 with the reason on it ("scanning only
 * the shop-front thumbnail let unscanned media ship to buyers"); wish, bill,
 * membership, piggy pot and task never got one. Nothing errored, no queue reported
 * it, and the listing looked fully moderated from every screen.
 */
class RewardFileScanTest extends TestCase
{
    private const UUID = 'a1b2c3d4-1111-2222-3333-444455556666';

    /** Build an unsaved row — the helper reads attributes and a key, never the database. */
    private function item(string $class, array $attributes): Model
    {
        $item = new $class;
        $item->forceFill(array_merge(['id' => 7], $attributes));

        return $item;
    }

    /** @dataProvider modules */
    public function test_every_sellable_module_scans_its_own_paid_file(string $class, array $attributes, array $held): void
    {
        Bus::fake();

        RewardFileScan::dispatch($this->item($class, $attributes), $held);

        Bus::assertDispatched(
            CheckMediaModeration::class,
            fn (CheckMediaModeration $job) => $job->modelClass === $class
                && $job->mediaAsset === RewardFileScan::ASSET
                && $job->flagOnViolation === $held
                // 🚨 The reference is passed through untouched. Task stores a full CDN
                // URL and the rest a bare UUID; concatenating either onto a host is
                // what made the job 404 every poll and hold innocent content.
                && str_contains((string) $job->mediaUuid, self::UUID)
        );
    }

    public static function modules(): array
    {
        return [
            'wish' => [WishItem::class, ['content_file' => self::UUID, 'content_file_type' => 'image/jpeg'], ['is_approved' => 0]],
            'bill' => [Bills::class, ['content_file' => self::UUID, 'content_file_type' => 'image/png'], ['approved' => 0]],
            'membership' => [Membership::class, ['content_file' => self::UUID, 'content_file_type' => 'image/png'], ['approved' => 0]],
            'piggy pot' => [PiggyPot::class, ['content_file' => self::UUID, 'content_file_type' => 'image/webp'], ['status' => 'moderation_hold']],
            'shop' => [Shop::class, ['reward_file' => self::UUID, 'reward_file_type' => 'image/jpeg'], ['approved' => 0]],
            'task' => [Task::class, ['deliverable_content' => 'https://ucarecdn.com/'.self::UUID.'/', 'deliverable_content_type' => 'video/mp4'], ['is_approved' => false]],
        ];
    }

    public function test_a_held_reward_file_holds_its_own_listing_and_nothing_else(): void
    {
        Bus::fake();

        RewardFileScan::dispatch(
            $this->item(WishItem::class, ['content_file' => self::UUID, 'user_id' => 99]),
            ['is_approved' => 0]
        );

        Bus::assertDispatched(CheckMediaModeration::class, function (CheckMediaModeration $job) {
            // Nothing about the creator, the account, or any other listing.
            $this->assertSame(['is_approved' => 0], $job->flagOnViolation);
            $this->assertSame(WishItem::class, $job->modelClass);
            $this->assertSame(7, $job->modelId);

            return true;
        });
    }

    public function test_an_unchanged_file_is_not_re_scanned(): void
    {
        Bus::fake();

        // Rekognition is deterministic, so a re-scan re-produces a false positive
        // and un-approves a listing an admin has already cleared — on the creator's
        // next unrelated price edit, with no way out of the loop.
        RewardFileScan::dispatch(
            $this->item(WishItem::class, ['content_file' => self::UUID]),
            ['is_approved' => 0],
            self::UUID
        );

        Bus::assertNotDispatched(CheckMediaModeration::class);
    }

    public function test_a_replaced_file_is_re_scanned(): void
    {
        Bus::fake();

        RewardFileScan::dispatch(
            $this->item(WishItem::class, ['content_file' => self::UUID]),
            ['is_approved' => 0],
            'ffffffff-0000-0000-0000-000000000000'
        );

        Bus::assertDispatched(CheckMediaModeration::class);
    }

    public function test_a_non_visual_file_is_not_sent_to_a_scan_that_cannot_read_it(): void
    {
        Bus::fake();

        // A PDF produces no Rekognition verdict, and the job's fail-closed branch
        // would hold it for ever waiting for an answer that cannot arrive. These
        // listings are still created unapproved and read by a human.
        RewardFileScan::dispatch(
            $this->item(WishItem::class, ['content_file' => self::UUID, 'content_file_type' => 'application/pdf']),
            ['is_approved' => 0]
        );

        Bus::assertNotDispatched(CheckMediaModeration::class);
    }

    public function test_an_unknown_mime_is_still_scanned(): void
    {
        Bus::fake();

        // 🚨 Null means "we were not told", which is not evidence of anything —
        // and the live rows proved it: a broken mime reader left every shop reward
        // file reading `image` or nothing at all for months (24 Aug 2026).
        RewardFileScan::dispatch(
            $this->item(WishItem::class, ['content_file' => self::UUID, 'content_file_type' => null]),
            ['is_approved' => 0]
        );

        Bus::assertDispatched(CheckMediaModeration::class);
    }

    public function test_an_external_link_is_not_scanned_and_an_unreadable_reference_still_is(): void
    {
        Bus::fake();

        // Not a file we host — there is nothing to fetch.
        RewardFileScan::dispatch(
            $this->item(Shop::class, ['reward_file' => 'https://example.test/thing']),
            ['approved' => 0]
        );
        Bus::assertNotDispatched(CheckMediaModeration::class);

        // 🚨 But a non-URL reference we cannot read IS dispatched, so the job's
        // fail-closed branch holds it. "We could not check it" is never a pass.
        RewardFileScan::dispatch(
            $this->item(Shop::class, ['reward_file' => 'not-a-uuid-at-all']),
            ['approved' => 0]
        );
        Bus::assertDispatched(CheckMediaModeration::class);
    }

    public function test_no_file_means_no_scan(): void
    {
        Bus::fake();

        RewardFileScan::dispatch($this->item(WishItem::class, ['content_file' => '']), ['is_approved' => 0]);
        RewardFileScan::dispatch(null, ['is_approved' => 0]);

        Bus::assertNotDispatched(CheckMediaModeration::class);
    }

    /**
     * 🚨 SOURCE SCAN, and it is the assertion that matters most.
     *
     * The behaviour tests above all pass against a helper nobody calls — which is
     * exactly the state five of these six modules were in for seven weeks. A new
     * save path written by copying an existing one is how the next module gets
     * forgotten, so this reads the controllers themselves.
     */
    public function test_every_module_that_scans_an_image_also_scans_its_paid_file(): void
    {
        $controllers = [
            'app/Http/Controllers/Auth/WishitemController.php',
            'app/Http/Controllers/Auth/BillsController.php',
            'app/Http/Controllers/Auth/MembershipController.php',
            'app/Http/Controllers/Auth/ShopsController.php',
            'app/Http/Controllers/PiggyPotController.php',
            'app/Http/Controllers/TaskController.php',
        ];

        foreach ($controllers as $relative) {
            $source = (string) file_get_contents(base_path($relative));

            $this->assertStringContainsString(
                'RewardFileScan',
                $source,
                "{$relative} dispatches an image scan but never scans the reward file the supporter pays for."
            );
        }
    }

    /**
     * A seventh sellable module is a row in `RewardFileScan::COLUMNS`, or its paid
     * file has no scan and nothing anywhere says so.
     */
    public function test_the_column_map_covers_every_sellable_module_with_a_file(): void
    {
        // The map's own shape: every entry names a file column and a mime column.
        foreach (RewardFileScan::COLUMNS as $class => $columns) {
            $this->assertTrue(class_exists($class), "{$class} is not a model.");
            $this->assertCount(2, $columns, "{$class} needs a file column and a mime column.");
            $this->assertNotSame('', trim($columns[0]));
            $this->assertNotSame('', trim($columns[1]));
        }

        // ⚠️ Every module RewardService can price is either here, or is the tip
        // goal — which carries no file at all (see WishitemController::addTipGoal).
        $sellable = [WishItem::class, Shop::class, Task::class, PiggyPot::class, Bills::class, Membership::class];

        foreach ($sellable as $class) {
            $this->assertArrayHasKey(
                $class,
                RewardFileScan::COLUMNS,
                class_basename($class).' can be sold but its paid file is never scanned.'
            );
        }
    }
}
