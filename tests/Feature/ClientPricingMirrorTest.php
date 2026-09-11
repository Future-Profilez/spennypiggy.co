<?php

namespace Tests\Feature;

use App\Helpers;
use App\Services\Pricing\FeeModel;
use Tests\TestCase;

/**
 * 🚨 THE PAGE QUOTES A PRICE AND STRIPE CHARGES ONE. NOTHING ELSE CAN SEE THEM
 * DISAGREE.
 *
 * Every buy surface on this app computes the supporter's total in JavaScript so
 * the figure moves as the buyer changes quantity or currency, and the server
 * recomputes it for real at checkout. When the two formulas drift, the button
 * says one number and the card is debited another — no exception, no log line,
 * a passing build and a passing PHP suite. It has happened twice: the Stripe
 * estimate moving 2.9% → 3.4% on 11 Aug 2026, and the whole model moving to an
 * all-in supporter fee on 11 Sep 2026, when EIGHT components were still carrying
 * their own copy of the legacy gross-up.
 *
 * ⚠️ This is a SOURCE SCAN, and it has to be: PHPUnit cannot mount an Inertia
 * page, and a route test renders props rather than the arithmetic a browser then
 * performs on them. What it guards is structural — that there is exactly ONE
 * client-side copy of the formula — which is the only property that makes the
 * drift impossible rather than merely unlikely.
 */
class ClientPricingMirrorTest extends TestCase
{
    /**
     * The two files that are ALLOWED to implement the arithmetic.
     *
     * `utils/pricing.js` is the definition; `includes/PriceFormat.jsx` is the
     * hook that gives it the page's currency table and returns the itemised
     * breakdown. Nothing else may reach for the pieces.
     */
    private const FORMULA_OWNERS = [
        'resources/js/utils/pricing.js',
        'resources/js/includes/PriceFormat.jsx',
    ];

    /**
     * 🚨 A NINTH LOCAL COPY OF THE GROSS-UP IS THE FAULT THIS EXISTS FOR.
     *
     * The legacy formula divides by `1 - totalDeductionRate`. A component that
     * writes that itself is a component that keeps charging the old model after
     * `config/payments.php` moves, because a literal in JSX cannot follow a
     * config change — which is exactly what every listing card did on 11 Sep
     * 2026 until they were moved onto `supporterTotal()`.
     */
    public function test_only_the_pricing_helper_implements_the_gross_up(): void
    {
        $offenders = $this->filesMatching('/totalDeductionRate/');

        $this->assertSame(
            [],
            $offenders,
            'These files implement the supporter gross-up themselves instead of calling '
            ."supporterTotal() from resources/js/utils/pricing.js:\n  - "
            .implode("\n  - ", $offenders)
            ."\n\nA local copy cannot follow a fee-model change, so it will quote a price "
            .'the checkout does not charge.'
        );
    }

    /**
     * ⚠️ The Stripe estimate is a component of the formula, not a display value.
     * A surface reading it is a surface about to do arithmetic with it — and
     * under the all-in model it does not move the supporter's total at all, so
     * anything computing with it out here is wrong twice over.
     */
    public function test_only_the_pricing_helper_reads_the_stripe_estimate(): void
    {
        $offenders = $this->filesMatching('/STRIPE_FEE_RATE|STRIPE_FIXED_FEE/');

        $this->assertSame(
            [],
            $offenders,
            "These files read the Stripe estimate directly:\n  - ".implode("\n  - ", $offenders)
            ."\n\nOnly resources/js/utils/pricing.js and includes/PriceFormat.jsx may. "
            ."Under the all-in model the estimate no longer moves the supporter's total."
        );
    }

    /**
     * 🚨 THE £1 ADMINISTRATION FEE IS GONE (client §2, 11 Sep 2026), AND THE
     * CLIENT MIRROR MUST AGREE THAT IT IS GONE.
     *
     * `PriceFormat::adminFeeInCurrency` is the one place it was ever built, and
     * it now answers 0 under all-in. A surface that reconstructs it from the
     * `rates` table — which is all the old helper did — puts a pound back onto a
     * total the checkout does not charge.
     */
    public function test_no_surface_rebuilds_the_administration_fee(): void
    {
        $offenders = [];

        foreach ($this->jsFiles() as $path => $source) {
            if (in_array($path, self::FORMULA_OWNERS, true)) {
                continue;
            }

            // The helper may be CALLED (it answers 0 under all-in and the legacy
            // model still needs it); what may not happen is a second copy of the
            // "£1 converted through the rates table" arithmetic.
            if (preg_match('/const\s+adminFeeInCurrency\s*=/', $source)) {
                $offenders[] = $path;
            }
        }

        sort($offenders);

        $this->assertSame(
            [],
            $offenders,
            "These files build their own administration fee:\n  - ".implode("\n  - ", $offenders)
            ."\n\nIt is zero under the all-in model. Call PriceFormat()'s helper, never rebuild it."
        );
    }

    /**
     * 🚨 THE ONE FIGURE BOTH LANGUAGES PIN, AND THE PENNY IS NOT A TYPO.
     *
     * `tests/javascript/pricing.test.js` asserts `supporterTotal(100, {allIn:
     * true, supporterRate: 12})` is **112.01**. This asserts the server agrees —
     * so a change to `config/payments.php` that is not carried into the JS pin
     * fails here, naming the file to update.
     *
     * ⚠️ 112.01 rather than 112.00 because `100 * 1.12` is 112.00000000000001 in
     * both PHP and JavaScript, and both ceil to the penny. Rounding it
     * "sensibly" on either side reintroduces the drift.
     */
    public function test_the_server_and_the_javascript_pin_agree_on_the_all_in_figure(): void
    {
        $rate = FeeModel::supporterRate('card');

        $jsTest = file_get_contents(base_path('tests/javascript/pricing.test.js'));

        $this->assertStringContainsString(
            "supporterRate: {$rate}",
            $jsTest,
            "tests/javascript/pricing.test.js does not pin the shipped card rate ({$rate}%). "
            .'The client mirror and the server are free to disagree until it does.'
        );

        $total = Helpers::calculateStripeDirectChargeFlow(100, 'GBP')['total_supporter_pays'];

        $this->assertStringContainsString(
            "supporterRate: {$rate} })).toBe({$total})",
            $jsTest,
            "The server charges {$total} for a £100 listing at {$rate}%, and "
            .'tests/javascript/pricing.test.js pins a different number. One of the two '
            .'formulas has moved without the other — fix the mirror, not this test.'
        );
    }

    /**
     * ⚠️ A control. The creator is made whole under both models, and that is the
     * sentence every surface is allowed to print — so if this ever fails, the
     * copy across the whole app has become untrue and no amount of mirroring
     * helps.
     */
    public function test_the_creator_still_receives_their_whole_listed_price(): void
    {
        $flow = Helpers::calculateStripeDirectChargeFlow(100, 'GBP');

        $this->assertEqualsWithDelta(100, $flow['net_to_creator'], 0.01);
    }

    /**
     * Every `.js`/`.jsx` under `resources/js`, keyed by repo-relative path.
     *
     * ⚠️ Comments are blanked first. Several of the files this scans now carry a
     * note EXPLAINING the fault by naming the very expression being searched
     * for, so a raw scan reports the explanation as the offence — the documented
     * trap, hit again while writing this.
     */
    private function jsFiles(): array
    {
        $root = base_path('resources/js');
        $files = [];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (! $file->isFile() || ! in_array($file->getExtension(), ['js', 'jsx'], true)) {
                continue;
            }

            $path = 'resources/js'.substr($file->getPathname(), strlen($root));
            $files[$path] = $this->blankComments(file_get_contents($file->getPathname()));
        }

        ksort($files);

        return $files;
    }

    private function filesMatching(string $pattern): array
    {
        $offenders = [];

        foreach ($this->jsFiles() as $path => $source) {
            if (in_array($path, self::FORMULA_OWNERS, true)) {
                continue;
            }

            if (preg_match($pattern, $source)) {
                $offenders[] = $path;
            }
        }

        sort($offenders);

        return $offenders;
    }

    /** Block and line comments replaced with whitespace, so line numbers survive. */
    private function blankComments(string $source): string
    {
        $source = preg_replace_callback(
            '#/\*.*?\*/#s',
            fn ($m) => preg_replace('/[^\n]/', ' ', $m[0]),
            $source
        );

        return preg_replace('#(^|[^:"\'`\\\\])//[^\n]*#m', '$1', $source);
    }
}
