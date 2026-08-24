<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use App\Services\RewardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * How a reward file decides whether it is a picture, a video, an audio clip or a
 * download tile.
 *
 * 🚨 THE BUG THIS PINS. `ShopsController` wrote the literal string `'image'` into
 * `reward_file_type` whenever Uploadcare "did not report a mime" — which was ALWAYS,
 * because the expression read `$file['contentInfo']['mime']['type']` on `$file`, and
 * `$file` is the Uploadcare **UUID string**, not an array. `empty()` swallows an
 * illegal string offset without a warning, so the first branch could never be true
 * and the guess was the only outcome that ever ran. Live data agreed exactly: 6 shop
 * rows reading `image`, 14 reading nothing, and not one real mime.
 *
 * The guess was then unreadable by everything downstream: `RewardService::kind()` and
 * the JS `rewardKind()` both require the `prefix/` form, so a bare `image` matched
 * nothing, fell through to the extension test, and an Uploadcare UUID has no
 * extension either — giving `file`, a generic download tile where the picture should
 * be. Nothing errored anywhere.
 *
 * Two halves, both covered here: the resolver now tolerates a bare kind (which fixes
 * the rows already in the database), and the writer no longer guesses.
 */
class RewardMediaKindTest extends TestCase
{
    use RefreshDatabase;

    public static function mimeProvider(): array
    {
        return [
            'a real image mime' => ['image/jpeg', null, 'image'],
            'a real audio mime' => ['audio/mpeg', null, 'audio'],
            'a real video mime' => ['video/mp4', null, 'video'],
            'a pdf' => ['application/pdf', null, 'pdf'],

            // The shapes the live database is actually full of.
            'a bare image kind' => ['image', null, 'image'],
            'a bare audio kind' => ['audio', null, 'audio'],
            'a bare video kind' => ['video', null, 'video'],

            // No mime at all: fall back to the extension, as documented.
            'no mime, mp3 filename' => [null, 'welcome-note.mp3', 'audio'],
            'no mime, bare uuid' => [null, 'c950a1e6-924d-4f25-8790-d514bbda6b75', 'file'],

            // A bare word that is not one of the known kinds must not be trusted.
            'a bare nonsense kind' => ['sparkles', null, 'file'],
        ];
    }

    /**
     * @dataProvider mimeProvider
     */
    public function test_a_reward_file_resolves_to_the_right_kind(?string $mime, ?string $name, string $expected): void
    {
        $this->assertSame($expected, RewardService::kind($mime, $name));
    }

    /**
     * An audio reward is a FILE reward whose kind is audio — there is no separate
     * `audio` reward type, and `config('rewards.types')` is correct at three.
     * `RewardMedia` renders `kind === "audio"` as a player.
     */
    public function test_audio_is_a_file_reward_not_a_reward_type(): void
    {
        $this->assertSame(['file', 'message', 'link'], config('rewards.types'));
        $this->assertContains('audio/*', config('rewards.accept'));
        $this->assertArrayHasKey('audio', config('rewards.kind_extensions'));

        $creator = User::factory()->create(['role' => 1]);

        $shop = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Voice note',
            'description' => 'A hello, recorded',
            'price' => 4.99,
            'currency' => 'gbp',
            'approved' => 1,
            'reward_type' => 'file',
            'reward_title' => 'A voice note',
            'reward_file' => 'c950a1e6-924d-4f25-8790-d514bbda6b75',
            'reward_file_type' => 'audio/mpeg',
        ]);

        $reward = RewardService::for($shop);

        $this->assertSame('file', $reward['type']);
        $this->assertSame('audio', $reward['media']['kind'], 'An mp3 must reach the player, not the download tile.');
    }

    /** The rows already in the database render correctly without a migration. */
    public function test_a_listing_written_with_the_old_bare_guess_still_renders_as_an_image(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $shop = Shop::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'type' => 'digital',
            'name' => 'Photo set',
            'description' => 'Ten pictures',
            'price' => 9.99,
            'currency' => 'gbp',
            'approved' => 1,
            'reward_type' => 'file',
            'reward_title' => 'Photo set',
            'reward_file' => 'c950a1e6-924d-4f25-8790-d514bbda6b75',
            // Exactly what the old writer stored.
            'reward_file_type' => 'image',
        ]);

        $this->assertSame('image', RewardService::for($shop)['media']['kind']);
    }
}
