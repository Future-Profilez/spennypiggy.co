<?php

namespace Tests\Unit;

use App\Rules\NoBlockedSymbols;
use App\Support\ContentWording;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * The symbol rule — the hole every word list had.
 *
 * 🚨 The failure this pins: `ContentWording` and `Helpers::checkBlockText` both read
 * WORDS, so 🍆💦 in a listing title passed every check on the platform, and a
 * zero-width space inside a banned word defeated both lists at once. With nothing
 * human left in the publish path (11 Sep 2026) that is a live payment-facing surface.
 */
class NoBlockedSymbolsTest extends TestCase
{
    /** @dataProvider blockedValues */
    public function test_a_blocked_symbol_is_refused(string $value, string $expectFragment): void
    {
        $error = NoBlockedSymbols::firstMatch($value);

        $this->assertNotNull($error, "Expected [{$value}] to be refused.");
        $this->assertStringContainsString($expectFragment, $error);
    }

    public static function blockedValues(): array
    {
        return [
            'aubergine' => ['Summer set 🍆 exclusive', '🍆'],
            'peach' => ['🍑 behind the scenes', '🍑'],
            'sweat droplets' => ['New drop 💦', '💦'],
            'tongue' => ['Late night 👅 stream', '👅'],
            'chilli with variation selector' => ['Spicy 🌶️ pack', '🌶'],
            'smiling imp' => ['Naughty 😈 bundle', '😈'],
            'money mouth' => ['🤑 my new guide', '🤑'],
            'money with wings' => ['Support me 💸', '💸'],
            'money bag' => ['💰 monthly', '💰'],
            'swastika right' => ['A 卐 print', '卐'],
            'swastika left' => ['A 卍 print', '卍'],
            'zero width space' => ["Studio re\u{200B}nt fund", 'hidden character'],
            'right to left override' => ["photo\u{202E}gnp.exe", 'hidden character'],
            'soft hyphen' => ["Ex\u{00AD}clusive", 'hidden character'],
            'byte order mark' => ["\u{FEFF}Exclusive set", 'hidden character'],
        ];
    }

    /** @dataProvider allowedValues */
    public function test_ordinary_creator_text_is_untouched(string $value): void
    {
        $this->assertNull(
            NoBlockedSymbols::firstMatch($value),
            "Expected [{$value}] to pass."
        );
    }

    public static function allowedValues(): array
    {
        return [
            'plain' => ['Exclusive summer photo set'],
            'ordinary emoji' => ['New drop 🎉 out now 📸'],
            'a card is paying, not asking' => ['Card tricks 💳 masterclass'],
            'money as a subject, in words' => ['My budgeting workbook'],
            // 🚨 U+200D and U+FE0F build these. Banning either would refuse the
            // pride flag this platform ships badges for, and every family emoji.
            'pride flag' => ["Pride set \u{1F3F3}\u{FE0F}\u{200D}\u{1F308}"],
            'family emoji' => ["For the \u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F466} shoot"],
            // ZWNJ is load-bearing in Persian and Hindi; a mark is not a trick.
            'zero width non joiner' => ["\u{0645}\u{06CC}\u{200C}\u{062E}\u{0648}\u{0627}\u{0647}\u{0645}"],
            'empty' => [''],
        ];
    }

    public function test_it_reports_the_hidden_character_before_the_visible_one(): void
    {
        // A value carrying both must name the thing the creator cannot see —
        // removing the emoji would leave them looking at a still-refused field.
        $error = NoBlockedSymbols::firstMatch("Set 🍆 re\u{200B}nt");

        $this->assertStringContainsString('hidden character', (string) $error);
    }

    public function test_it_runs_as_a_validation_rule_and_names_the_field(): void
    {
        $validator = Validator::make(
            ['wishname' => 'Support me 💸'],
            ['wishname' => ['required', new NoBlockedSymbols]]
        );

        $this->assertTrue($validator->fails());
        $this->assertStringContainsString('💸', $validator->errors()->first('wishname'));
    }

    /**
     * 🚨 The two checks must agree about what a banana is.
     *
     * `Helpers::checkBlockText` holds a listing for a reviewer; this rule refuses
     * the save. If this rule's sexual group ever narrows, a creator's title stops
     * being refused and starts being silently held instead — which reads to them as
     * a listing that published and then vanished.
     */
    public function test_the_sexual_group_stays_a_subset_of_the_blocked_word_lists_emoji(): void
    {
        $held = ['😈', '💩', '💬', '👅', '🍆', '🍌', '🌽', '🌶️', '🍑', '💎', '💦'];

        foreach (NoBlockedSymbols::SEXUAL_EMOJI as $emoji) {
            $this->assertTrue(
                collect($held)->contains(fn ($h) => str_contains($h, $emoji)),
                "[{$emoji}] is refused here but not held by Helpers::checkBlockText — the two checks disagree."
            );
        }
    }

    /**
     * The word rule and the symbol rule are separate on purpose: one is about what
     * is being sold, the other about the characters it is written in. This asserts
     * the split still holds, so neither grows into the other.
     */
    public function test_the_word_rule_still_answers_for_words(): void
    {
        $this->assertNotNull(ContentWording::firstMatch('Help with my rent'));
        $this->assertNull(NoBlockedSymbols::firstMatch('Help with my rent'));
    }
}
