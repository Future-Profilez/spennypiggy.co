<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserIntro;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The verification-video card moved out of the About tab into the sticky identity
 * rail (31 July 2026) and now renders on EVERY page of the profile. Its data loader
 * did not move — the `intro` prop was still built inside `if ($page == 'about')`.
 *
 * Publishing a post navigates to `?page=feed`, so a creator's own verification video
 * silently turned back into an empty "Add Verification Video" card the moment they
 * posted. Nothing was deleted; the row was never sent to the page.
 *
 * These tests exist because that failure is invisible: no exception, no console
 * error, and the empty state is legitimate UI rather than something that looks broken.
 */
class ProfileIntroPropTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // ⚠️ RefreshDatabase resets the database; it does not touch the cache, and
        // the profile page payload is cached as `profile_page_data_{userId}_…` while
        // its version token is itself cached for ~30s under a key carrying the same
        // id. Every test here starts from an empty table, so its creator is id 1 —
        // meaning one test could be served the previous test's payload for a user
        // that no longer exists, and the whole file would fail with a bare 500.
        // Intermittent, and entirely an artefact of ids repeating, which cannot
        // happen in production.
        Cache::flush();

        // The appended `poster_url` accessor makes a real Uploadcare call. Nothing
        // here should reach it — that is half of what these tests assert — so any
        // outbound request is a failure rather than something to stub politely.
        Http::preventStrayRequests();
    }

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
        ], $attributes));
    }

    private function introProp($response)
    {
        return $response->viewData('page')['props']['intro'] ?? null;
    }

    /**
     * The regression itself: the creator's own video must survive a tab change.
     *
     * @dataProvider profileTabs
     */
    public function test_owner_sees_their_intro_on_every_tab(string $tab): void
    {
        $creator = $this->creator();
        $intro = UserIntro::factory()->create(['user_id' => $creator->id]);

        $response = $this->actingAs($creator)
            ->get("/{$creator->username}/{$tab}");

        $response->assertOk();

        $prop = $this->introProp($response);

        $this->assertNotNull(
            $prop,
            "The intro prop was missing on the '{$tab}' tab. The card renders in the ".
            'identity rail on every tab, so a null prop shows the creator an empty '.
            '"Add Verification Video" card as though their video had been deleted.'
        );
        $this->assertSame($intro->uuid, $prop['uuid'] ?? null);
    }

    public static function profileTabs(): array
    {
        // 'feed' is the one that broke in the wild: AddPost navigates straight to it
        // after publishing, which is why the bug read as "posting deleted my video".
        return [
            'about' => ['about'],
            'feed' => ['feed'],
            'wishes' => ['wishes'],
            'shop' => ['shop'],
        ];
    }

    /**
     * The card and the gate that decides whether to render it must read ONE source.
     * Dashboard.jsx gated on `user.intro`, a relation eager-loaded in a single rare
     * Stripe-resync branch — so it was undefined on virtually every load and an
     * approved intro was invisible to every visitor, including on the About tab.
     */
    public function test_the_gate_and_the_card_read_the_same_prop(): void
    {
        $creator = $this->creator();
        UserIntro::factory()->create(['user_id' => $creator->id]);

        $response = $this->actingAs($creator)->get("/{$creator->username}/feed");
        $props = $response->viewData('page')['props'];

        $this->assertNotNull($props['intro'] ?? null);
        $this->assertArrayHasKey(
            'approved',
            $props['intro'],
            'The render gate reads `intro.approved`. Without the key a visitor can '.
            'never be shown an approved intro.'
        );
    }

    /**
     * A creator with no intro still gets a well-formed page — the card falls through
     * to its upload state, which is correct here and only wrong when a row exists.
     */
    public function test_a_creator_with_no_intro_sends_null(): void
    {
        $creator = $this->creator();

        $response = $this->actingAs($creator)->get("/{$creator->username}/feed");

        $response->assertOk();
        $this->assertNull($this->introProp($response));
    }

    /**
     * `UserIntro::$appends` carries `poster_url`, whose accessor is a synchronous
     * Uploadcare request (3s timeout, plus a generateThumb + save when no poster
     * exists yet). That was survivable while this ran on one tab; on every tab it
     * would be a blocking round trip on every profile page load.
     */
    public function test_the_payload_never_makes_a_blocking_uploadcare_call(): void
    {
        $creator = $this->creator();
        UserIntro::factory()->create([
            'user_id' => $creator->id,
            'poster' => 'a1b2c3d4-0000-0000-0000-000000000000',
        ]);

        // preventStrayRequests() in setUp turns any outbound call into a failure.
        $response = $this->actingAs($creator)->get("/{$creator->username}/feed");

        $response->assertOk();

        $prop = $this->introProp($response);

        $this->assertStringContainsString(
            'a1b2c3d4-0000-0000-0000-000000000000/nth/0/',
            (string) ($prop['poster_url'] ?? ''),
            'The stored poster should be served straight from the CDN path rather '.
            'than by asking Uploadcare to confirm what we already have.'
        );
    }

    /**
     * The value is serialised with toArray() deliberately: writing poster_url back
     * onto the MODEL lands it in $attributes, where Laravel re-applies the accessor
     * on toArray() and the blocking call happens anyway.
     */
    public function test_the_intro_prop_is_a_plain_array(): void
    {
        $creator = $this->creator();
        UserIntro::factory()->create(['user_id' => $creator->id]);

        $response = $this->actingAs($creator)->get("/{$creator->username}/feed");

        $this->assertIsArray($this->introProp($response));
    }
}
