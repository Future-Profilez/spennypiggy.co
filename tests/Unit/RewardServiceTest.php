<?php

namespace Tests\Unit;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\WishItem;
use App\Services\RewardService;
use Tests\TestCase;

/**
 * RewardService is the single answer to "what does the supporter get?", so the
 * cases that matter are the legacy ones: every listing created before the
 * reward_* columns existed must still describe itself correctly, or the
 * thank-you page silently shows an empty reward block for the entire back
 * catalogue.
 *
 * Models are built with forceFill rather than saved — the contract is pure
 * attribute reading, and the test DB has no shops.reward_file column (it was
 * added to production outside a migration).
 */
class RewardServiceTest extends TestCase
{
    public function test_a_listing_with_no_reward_title_still_has_a_headline(): void
    {
        $reward = RewardService::for(new WishItem);

        $this->assertSame(config('rewards.default_title'), $reward['title']);
    }

    public function test_legacy_wish_content_file_is_read_as_a_file_reward(): void
    {
        $wish = (new WishItem)->forceFill([
            'content_file' => 'abc-123',
            'content_file_type' => 'video/mp4',
            'content_file_name' => 'behind-the-scenes.mp4',
            'content_file_size' => 2048,
        ]);

        $reward = RewardService::for($wish);

        $this->assertSame('file', $reward['type']);
        $this->assertSame('video', $reward['media']['kind']);
        $this->assertSame('https://ucarecdn.com/abc-123/', $reward['media']['url']);
        $this->assertSame(2048, $reward['media']['size']);
        $this->assertTrue($reward['is_instant']);
    }

    public function test_legacy_shop_success_page_types_map_to_link_and_message(): void
    {
        $link = (new Shop)->forceFill([
            'success_page_type' => 'url',
            'success_page_value' => 'https://example.com/unlock',
        ]);

        $this->assertSame('link', RewardService::for($link)['type']);
        $this->assertSame('https://example.com/unlock', RewardService::for($link)['link']);

        $message = (new Shop)->forceFill([
            'success_page_type' => 'text',
            'success_page_value' => 'Here is your download code.',
        ]);

        $this->assertSame('message', RewardService::for($message)['type']);
        $this->assertSame('Here is your download code.', RewardService::for($message)['text']);
    }

    public function test_a_task_voice_deliverable_is_recognised_as_audio(): void
    {
        // Uploadcare UUIDs carry no MIME or extension, so the module's own
        // declared type is the only signal that this is playable audio.
        $task = (new Task)->forceFill([
            'deliverable_content_type' => 'voice',
            'deliverable_content' => 'def-456',
            'deliverable_note' => 'Recorded within 24 hours.',
        ]);

        $reward = RewardService::for($task);

        $this->assertSame('file', $reward['type']);
        $this->assertSame('audio', $reward['media']['kind']);
        $this->assertSame('Recorded within 24 hours.', $reward['description']);
    }

    public function test_the_unified_columns_win_over_the_legacy_ones(): void
    {
        $pot = (new PiggyPot)->forceFill([
            'content_file' => 'old-file',
            'reward_type' => 'message',
            'reward_body' => 'Your track link arrives here.',
            'reward_title' => 'Unreleased demo',
        ]);

        $reward = RewardService::for($pot);

        $this->assertSame('message', $reward['type']);
        $this->assertSame('Unreleased demo', $reward['title']);
        $this->assertNull($reward['media']);
    }

    public function test_recurring_items_carry_perks_and_post_access(): void
    {
        $membership = (new Membership)->forceFill([
            'rewards' => 'monthly_content_bundle,weekly_DM_chat,not_a_real_perk',
            'reward_type' => 'message',
            'reward_body' => 'Welcome aboard.',
        ]);

        $reward = RewardService::for($membership);

        $this->assertTrue($reward['is_recurring']);
        $this->assertTrue($reward['post_access']);
        $this->assertSame('message', $reward['type']);
        // The unknown perk is dropped rather than rendered as a raw key.
        $this->assertCount(2, $reward['perks']);
        $this->assertTrue($reward['perks'][0]['is_on_platform']);

        $bill = (new Bills)->forceFill(['content_file' => 'welcome-file']);
        $billReward = RewardService::for($bill);

        $this->assertTrue($billReward['is_recurring']);
        $this->assertSame('file', $billReward['type']);
    }

    public function test_one_off_items_are_not_marked_recurring(): void
    {
        $reward = RewardService::for(new Shop);

        $this->assertFalse($reward['is_recurring']);
        $this->assertFalse($reward['post_access']);
        $this->assertSame([], $reward['perks']);
    }

    public function test_shortened_and_insecure_links_are_rejected(): void
    {
        $this->assertNull(RewardService::linkError('https://example.com/file'));
        $this->assertNotNull(RewardService::linkError('http://example.com/file'));
        $this->assertNotNull(RewardService::linkError('https://bit.ly/abc'));
        // Subdomains of a shortener are covered too.
        $this->assertNotNull(RewardService::linkError('https://www.t.co/abc'));
        $this->assertNotNull(RewardService::linkError('nonsense'));
        $this->assertNotNull(RewardService::linkError(null));
    }

    public function test_columns_from_normalises_a_link_and_clears_a_stale_body(): void
    {
        $link = RewardService::columnsFrom([
            'reward_title' => '  Backstage pass  ',
            'reward_type' => 'link',
            'reward_body' => 'example.com/pass',
        ]);

        $this->assertSame('Backstage pass', $link['reward_title']);
        $this->assertSame('https://example.com/pass', $link['reward_body']);

        // A file reward keeps its file in the module's own column — leaving a
        // previously typed message behind would render both.
        $file = RewardService::columnsFrom([
            'reward_title' => 'Studio pack',
            'reward_type' => 'file',
            'reward_body' => 'leftover message',
        ]);

        $this->assertNull($file['reward_body']);

        $blank = RewardService::columnsFrom(['reward_title' => '   ']);

        $this->assertSame(config('rewards.default_title'), $blank['reward_title']);
    }

    public function test_file_kind_falls_back_from_mime_to_extension_to_download(): void
    {
        $this->assertSame('video', RewardService::kind(null, 'https://ucarecdn.com/x/clip.mp4'));
        $this->assertSame('audio', RewardService::kind('audio/mpeg'));
        $this->assertSame('document', RewardService::kind(null, 'notes.docx'));
        $this->assertSame('archive', RewardService::kind(null, 'pack.zip'));
        $this->assertSame('pdf', RewardService::kind('application/pdf'));
        // A bare Uploadcare UUID has neither signal — a download tile is right.
        $this->assertSame('file', RewardService::kind(null, 'https://ucarecdn.com/x/'));
    }
}
