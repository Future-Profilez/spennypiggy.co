<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * 🚨 SOURCE SCAN — the assertion the behaviour tests cannot make.
 *
 * `NoBlockedSymbolsTest` proves the rule works. It would pass just as happily
 * against a rule nothing calls, which is the state `saved_items`, the creator push
 * card and the shipping profiles were all found in. This asserts the WIRING.
 *
 * The invariant: `NoExpenseOrBrandName` already marks the boundary of "creator text
 * a supporter reads before they pay" — item names, titles, goal labels,
 * `reward_title`, the bio, bio-link labels. Every one of those fields is a symbol
 * field too, so the two counts must match, per file. A new payment-facing field
 * guarded by one rule and not the other fails here with the file named.
 *
 * ⚠️ Counting per FILE rather than per field is deliberate: a per-field parse would
 * have to understand three different array shapes (bare, inline, and a constructor
 * with arguments spread over three lines), and a guard that cannot see its own case
 * certifies what it missed.
 */
class BlockedSymbolWiringTest extends TestCase
{
    /**
     * Read the app, not a list — a new controller is covered the day it is written.
     *
     * @return array<string, string> relative path => source
     */
    private function sourcesUsingTheNamingRule(): array
    {
        $found = [];
        $root = app_path();

        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root));

        foreach ($files as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $source = (string) file_get_contents($file->getPathname());

            // ⚠️ Comments are blanked first. Several of these files NAME the rule in
            // a docblock explaining why a field is or is not covered, and a raw
            // substring count reads those as call sites.
            $code = self::withoutComments($source);

            if (! str_contains($code, 'new NoExpenseOrBrandName')) {
                continue;
            }

            $found[str_replace($root.'/', '', $file->getPathname())] = $code;
        }

        return $found;
    }

    private static function withoutComments(string $source): string
    {
        $out = '';

        foreach (token_get_all($source) as $token) {
            if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }

            $out .= is_array($token) ? $token[1] : $token;
        }

        return $out;
    }

    public function test_every_field_guarded_by_the_naming_rule_is_guarded_by_the_symbol_rule(): void
    {
        $sources = $this->sourcesUsingTheNamingRule();

        $this->assertNotEmpty($sources, 'Found no callers of NoExpenseOrBrandName — the scan is looking in the wrong place.');

        foreach ($sources as $path => $code) {
            $naming = substr_count($code, 'new NoExpenseOrBrandName');
            $symbols = substr_count($code, 'new NoBlockedSymbols');

            $this->assertSame(
                $naming,
                $symbols,
                "{$path} applies NoExpenseOrBrandName {$naming} time(s) and NoBlockedSymbols {$symbols}. "
                .'A payment-facing field guarded by the word rule and not the symbol rule accepts 🍆, 💸 and a '
                .'zero-width space that hides a banned word from every list we have.'
            );
        }
    }

    /**
     * The rule is on the shared reward contract, so a module that adds a
     * `reward_title` gets it without anyone remembering.
     */
    public function test_the_shared_reward_title_carries_it(): void
    {
        $code = self::withoutComments((string) file_get_contents(app_path('Services/RewardService.php')));

        $this->assertStringContainsString('new NoBlockedSymbols', $code);
    }
}
