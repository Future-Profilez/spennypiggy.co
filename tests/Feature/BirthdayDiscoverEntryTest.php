<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WishItem;
use App\Services\Discovery\BirthdayDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * 🚨 THE ONE ROUTE INTO BIRTHDAYS THIS WEEK — AND IT MUST NEVER BE A DEAD END.
 *
 * The collection page has worked since Phase 4 and nothing linked to it: the only
 * way in was the CTA in the Monday e-mail, which ships behind a flag, so a
 * working page was reachable only by typing the URL. Discover now carries a tile.
 *
 * ⚠️ The tile is gated on the collection being READY. The page greys itself below
 * its minimum number of creators, and a link from Discover into a greyed page is
 * exactly the dead end the e-mail's CTA is already protected from. That gate is
 * the whole reason this test exists — the tile itself is four lines of markup.
 */
class BirthdayDiscoverEntryTest extends TestCase
{
    use RefreshDatabase;

    private function optedInCreator(int $dayOffset): User
    {
        $day = BirthdayDiscoveryService::weekStart(now())->addDays($dayOffset);

        $creator = User::factory()->create([
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => (string) Str::uuid(),
            'avatar_approved' => 1,
        ]);

        $creator->forceFill([
            'birthday_day' => (int) $day->format('j'),
            'birthday_month' => (int) $day->format('n'),
            'birthday_discovery_opt_in' => true,
        ])->save();

        return $creator;
    }

    public function test_discover_does_not_link_to_a_collection_that_is_not_ready(): void
    {
        Cache::flush();

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('birthdays.ready', false)->etc());
    }

    /**
     * ⚠️ Asserted through the PROP the page reads, not by searching the HTML.
     * There is no Inertia SSR here, so the markup arrives client-side and a
     * body-text assertion would pass or fail for the wrong reason.
     */
    public function test_the_flag_is_never_true_below_the_minimum(): void
    {
        $service = app(BirthdayDiscoveryService::class);
        $minimum = $service->collectionMinCreators();

        // One short of the minimum, so the page would still grey itself.
        foreach (range(1, max(1, $minimum - 1)) as $i) {
            $this->optedInCreator($i);
        }

        Cache::flush();

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('birthdays.ready', false)->etc());
    }

    /**
     * 🚨 THE POSITIVE CASE, AND IT IS THE ONE THAT MAKES THE OTHERS MEAN ANYTHING.
     * Every other test here asserts `false`, so all three would still pass if the
     * flag were hardcoded off and the tile never rendered at all. This is the test
     * that fails if the entry point stops working.
     */
    public function test_the_tile_appears_once_the_collection_is_ready(): void
    {
        $service = app(BirthdayDiscoveryService::class);

        foreach (range(1, $service->collectionMinCreators()) as $i) {
            $creator = $this->optedInCreator($i);

            // The collection requires "good standing", which includes at least one
            // live thing to buy — a creator with nothing listed is never featured.
            WishItem::create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $creator->id,
                'wishname' => 'A photo set',
                'price' => 12,
                'currency' => 'GBP',
                'is_approved' => 1,
                'is_suspended' => 0,
                'subscription' => 0,
            ]);
        }

        Cache::flush();

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('birthdays.ready', true)
                ->where('birthdays.count', $service->collectionMinCreators())
                // ⚠️ The tile shows faces, so an empty avatar list would render a
                // ready row with nothing in it — worth asserting, not assuming.
                ->has('birthdays.avatars', $service->collectionMinCreators())
                ->etc());
    }

    /** 🚨 Discover must never fail because of a link to another page. */
    public function test_discover_still_renders_if_the_birthday_service_throws(): void
    {
        $this->mock(BirthdayDiscoveryService::class, function ($mock) {
            $mock->shouldReceive('featuredForWeek')->andThrow(new \RuntimeException('boom'));
            $mock->shouldReceive('collectionMinCreators')->andReturn(3);
        });

        Cache::flush();

        $this->get('/discover')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('birthdays.ready', false)->etc());
    }
}
