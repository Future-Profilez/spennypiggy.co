<?php

namespace Tests\Unit;

use App\Services\PostMentionService;
use PHPUnit\Framework\TestCase;

class PostMentionServiceTest extends TestCase
{
    public function test_it_extracts_handles_in_order_and_dedupes(): void
    {
        $found = PostMentionService::parse('hey @thor and @Nova, thanks again @thor');

        $this->assertSame(['thor', 'nova'], $found);
    }

    public function test_it_ignores_email_addresses(): void
    {
        $this->assertSame([], PostMentionService::parse('write to me at hello@spennypiggy.co'));
    }

    public function test_it_reads_both_title_and_content(): void
    {
        $this->assertSame(['nova', 'thor'], PostMentionService::parse('collab with @nova', 'thanks @thor'));
    }

    public function test_a_trailing_full_stop_is_not_part_of_the_handle(): void
    {
        $this->assertSame(['thor'], PostMentionService::parse('thanks @thor.'));
    }
}
