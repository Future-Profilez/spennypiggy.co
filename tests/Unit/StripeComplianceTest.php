<?php

namespace Tests\Unit;

use App\Helpers;
use App\StripeControl;
use PHPUnit\Framework\TestCase;

class StripeComplianceTest extends TestCase
{
    public function test_descriptor_reads_as_content_purchase(): void
    {
        $this->assertSame('JUSTJACK99 CONTENT', StripeControl::buildContentDescriptor('justjack99'));
    }

    public function test_descriptor_never_exceeds_22_chars_and_keeps_marker(): void
    {
        $d = StripeControl::buildContentDescriptor('averyveryverylongcreatorname');
        $this->assertLessThanOrEqual(22, strlen($d));
        $this->assertStringEndsWith('CONTENT', $d);
    }

    public function test_descriptor_strips_disallowed_characters(): void
    {
        $this->assertSame('ABCDE CONTENT', StripeControl::buildContentDescriptor('ab*c<d>e'));
    }

    public function test_descriptor_falls_back_when_username_empty(): void
    {
        $this->assertSame('CREATOR CONTENT', StripeControl::buildContentDescriptor('***'));
    }

    public function test_item_field_allows_content_wording(): void
    {
        $this->assertNull(Helpers::validateItemField('Exclusive content'));
        $this->assertNull(Helpers::validateItemField('Content membership'));
    }

    public function test_item_field_blocks_gift_bill_wish_wording(): void
    {
        $this->assertNotNull(Helpers::validateItemField('Phone Bill'));
        $this->assertNotNull(Helpers::validateItemField('A gift for you'));
        $this->assertNotNull(Helpers::validateItemField('Contribution to pot'));
        $this->assertNotNull(Helpers::validateItemField('new shoes wish'));
    }
}
