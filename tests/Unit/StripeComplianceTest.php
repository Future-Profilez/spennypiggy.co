<?php

namespace Tests\Unit;

use App\Rules\NoExpenseOrBrandName;
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

    /**
     * ⚠️ These used to call `Helpers::validateItemField()`, which had ZERO production
     * callers — so they passed for a year while enforcing nothing. They target the
     * live rule now, which is the only thing any listing field actually runs.
     */
    private function reject(string $value): ?string
    {
        $message = null;

        (new NoExpenseOrBrandName)->validate('title', $value, function ($m) use (&$message) {
            $message = $m;
        });

        return $message;
    }

    public function test_item_field_allows_content_wording(): void
    {
        $this->assertNull($this->reject('Exclusive content'));
        $this->assertNull($this->reject('Content membership'));
        $this->assertNull($this->reject('The full behind-the-scenes set'));
    }

    public function test_item_field_blocks_expense_and_brand_wording(): void
    {
        $this->assertNotNull($this->reject('Phone Bill'));
        $this->assertNotNull($this->reject('Netflix for a month'));
    }

    /**
     * 🚨 The category that was enforced NOWHERE until 14 Aug 2026 — found live on a
     * wish's reward title. Every one of these reached the card, checkout, the receipt
     * and the payment partner's own record of the sale.
     */
    public function test_item_field_blocks_wording_that_names_the_payment(): void
    {
        $this->assertNotNull($this->reject('Buy me a coffee'));
        $this->assertNotNull($this->reject('A gift for you'));
        $this->assertNotNull($this->reject('Contribute to my pot'));
        $this->assertNotNull($this->reject('Spoil me'));
        $this->assertNotNull($this->reject('Tip jar'));
        $this->assertNotNull($this->reject('Donations welcome'));
        $this->assertNotNull($this->reject('Help me fundraise'));
    }

    /**
     * 🚨 The words this rule must NOT block. `wish` and `bill` are product names and
     * `tip`/`gift` are ordinary content words — blocking them refuses real listings,
     * which is why the transfer list is phrases rather than bare tokens.
     */
    public function test_product_names_and_ordinary_content_words_still_pass(): void
    {
        $this->assertNull($this->reject('new shoes wish'));
        $this->assertNull($this->reject('Bill Murray impressions'));
        $this->assertNull($this->reject('One styling tip a week'));
        $this->assertNull($this->reject('My gift guide: this year picks'));
        $this->assertNull($this->reject('Behind the scenes of the funding round'));
    }
}
