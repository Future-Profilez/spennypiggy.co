<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\Payment;
use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Checks the promise the whole pricing model rests on: the creator receives
 * exactly the listed price.
 *
 * The supporter's price is grossed up from an ESTIMATE of Stripe's fee
 * (config/payments.php → fee_profiles.*.stripe_rate / stripe_fixed_fee). The
 * platform's own cut is taken as a fixed application fee, so if Stripe's real
 * fee turns out higher than the estimate, the difference does not come out of
 * the platform's cut — it comes out of the creator's net. Quietly.
 *
 * That has already happened once: a £15 listing charged £19.05, Stripe took a
 * flat £0.30 where 1% (£0.19) had been assumed, and the creator received £14.89
 * instead of £15.00. Nothing in the product noticed, because nothing had ever
 * compared the estimate with the real figure — `stripe_fee_actual` and
 * `stripe_fee_expected` columns exist on the payment models and are never
 * written.
 *
 * The exposure is card payments taken on non-domestic cards: the card profile
 * estimates 2.9% + fixed, and Stripe charges more than that for international
 * cards. Bank methods estimate above their real cost, so they are safe.
 *
 * Read-only. It reports and logs; it does not move money.
 */
class VerifyCreatorNet extends Command
{
    protected $signature = 'payments:verify-creator-net
                            {--days=7 : How far back to check}
                            {--limit=200 : Most payments to check}
                            {--all : Include payments whose fee matched, not just shortfalls}';

    protected $description = "Compare Stripe's actual fee against the estimate the supporter price was built from";

    public function handle(): int
    {
        $since = now()->subDays((int) $this->option('days'));

        $payments = Payment::whereIn('status', ['succeeded', 'processing'])
            ->whereNotNull('stripe_payment_intent_id')
            ->whereNotNull('creator_id')
            ->where('created_at', '>=', $since)
            ->latest()
            ->limit((int) $this->option('limit'))
            ->get();

        if ($payments->isEmpty()) {
            $this->info('No payments in that window.');

            return self::SUCCESS;
        }

        $this->info("Checking {$payments->count()} payment(s) since {$since->toDateString()}…");

        $rows = [];
        $shortfalls = 0;
        $totalShortMinor = 0;
        $unchecked = 0;

        foreach ($payments as $payment) {
            $creator = User::where('uuid', $payment->creator_id)->first();

            if (! $creator || empty($creator->account_id)) {
                $unchecked++;

                continue;
            }

            $facts = StripeControl::getChargeFactsForPaymentIntent(
                $payment->stripe_payment_intent_id,
                $creator->account_id
            );

            // null means the charge could not be read (no charge yet, or an API
            // error) — not that Stripe took nothing. Never treat it as a match.
            if ($facts === null || $facts['fee_minor'] <= 0) {
                $unchecked++;

                continue;
            }

            $actualMinor = $facts['fee_minor'];
            $currency = $facts['currency'];
            $isZeroDecimal = Helpers::isZeroDecimalCurrency($currency);
            $multiplier = $isZeroDecimal ? 1 : 100;

            // Read the charged amount from Stripe, not from the local row: it is
            // what the fee was actually taken against.
            $totalMajor = (float) $facts['amount_minor'] / $multiplier;
            $profile = $facts['fee_profile'];

            $expectedMajor = $this->expectedStripeFee($totalMajor, $profile, $isZeroDecimal);
            $expectedMinor = (int) round($expectedMajor * $multiplier);

            $shortMinor = $actualMinor - $expectedMinor;

            if ($shortMinor > 0) {
                $shortfalls++;
                $totalShortMinor += $shortMinor;

                Log::warning('Creator net short of listed price — Stripe fee exceeded the estimate', [
                    'payment_intent' => $payment->stripe_payment_intent_id,
                    'creator_uuid' => $payment->creator_id,
                    'currency' => $currency,
                    'fee_profile' => $profile,
                    'expected_fee_minor' => $expectedMinor,
                    'actual_fee_minor' => $actualMinor,
                    'shortfall_minor' => $shortMinor,
                ]);
            }

            if ($shortMinor > 0 || $this->option('all')) {
                $rows[] = [
                    substr((string) $payment->stripe_payment_intent_id, 0, 22),
                    $profile,
                    $currency,
                    number_format($totalMajor, 2),
                    number_format($expectedMinor / $multiplier, 2),
                    number_format($actualMinor / $multiplier, 2),
                    $shortMinor > 0 ? '-'.number_format($shortMinor / $multiplier, 2) : 'ok',
                ];
            }
        }

        if ($rows) {
            $this->table(
                ['payment intent', 'profile', 'ccy', 'charged', 'fee est.', 'fee real', 'creator short'],
                $rows
            );
        }

        $this->newLine();
        $this->line("checked:   {$payments->count()}");
        $this->line("unchecked: {$unchecked}  (no connected account, or fee not readable yet)");

        if ($shortfalls === 0) {
            $this->info('shortfalls: 0 — every creator received the full listed price.');

            return self::SUCCESS;
        }

        $this->error("shortfalls: {$shortfalls}, totalling ".number_format($totalShortMinor / 100, 2).' (major units, mixed currencies)');
        $this->line('Each one means Stripe charged more than the supporter price was built to cover.');
        $this->line('Fix by raising the profile estimate in config/payments.php, or by topping the creator up.');

        return self::FAILURE;
    }

    /**
     * What the gross-up assumed Stripe would take on this charge — the same
     * rates that produced the supporter's price.
     */
    private function expectedStripeFee(float $totalMajor, string $profile, bool $isZeroDecimal): float
    {
        $rates = config("payments.fee_profiles.$profile") ?: config('payments.fee_profiles.card', []);

        $rate = (float) ($rates['stripe_rate'] ?? 2.9) / 100;
        $fixed = $isZeroDecimal ? 0.0 : (float) ($rates['stripe_fixed_fee'] ?? 0.30);

        return round(($totalMajor * $rate) + $fixed, $isZeroDecimal ? 0 : 2, PHP_ROUND_HALF_UP);
    }
}
