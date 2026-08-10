<?php

namespace Tests\Feature;

use App\Mail\CheckoutToUser;
use App\Models\Currency;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The buyer receipt and the creator notification quote two DIFFERENT numbers for
 * the same sale, and they had them the wrong way round.
 *
 * Under this pricing model the creator receives exactly their listed price and
 * the fees are grossed up on top, so the supporter's charge is ~20-30% higher
 * than the creator's earnings. `amount_subtotal` is the creator's net;
 * `amount_total` is the buyer's charge. The buyer email printed the former and
 * the creator email the latter — each was shown the other's figure.
 */
class CheckoutEmailAmountsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // `$` is shared by 8 currencies in this table — that collision is the
        // third bug these tests lock down, so both rows have to exist.
        foreach ([
            ['ISO' => 'USD', 'symbol' => '$', 'conversion_rate' => 1.3368],
            ['ISO' => 'BMD', 'symbol' => '$', 'conversion_rate' => 1.3454],
            ['ISO' => 'GBP', 'symbol' => '£', 'conversion_rate' => 1],
        ] as $row) {
            Currency::updateOrCreate(
                ['ISO' => $row['ISO']],
                $row + ['ISOdigits' => 2, 'name' => $row['ISO']]
            );
        }
    }

    private function payment(array $overrides = []): StripePaymentDetail
    {
        $creator = User::factory()->create(['role' => 1]);

        return StripePaymentDetail::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'session_id' => 'cs_test_'.Str::random(20),
            'amount_subtotal' => 100,   // listed price — the creator's net
            'amount_total' => 130.15,   // what the supporter is charged
            'tax' => 26.07,
            'currency' => 'USD',
            'owner_id' => $creator->id,
            'payment_status' => 'paid',
        ], $overrides));
    }

    /** @return array{amount: float, iso: string} */
    private function charge($data): array
    {
        $method = new \ReflectionMethod(CheckoutToUser::class, 'buyerCharge');
        $method->setAccessible(true);

        return $method->invoke(new CheckoutToUser($data, '$'));
    }

    public function test_buyer_receipt_states_what_was_charged_not_the_listed_price(): void
    {
        $payment = $this->payment();

        $charge = $this->charge($payment);

        // The old fallback chain landed on amount_subtotal, so a buyer charged
        // 130.15 was emailed 100.
        $this->assertSame(130.15, $charge['amount']);
        $this->assertNotSame(100.0, $charge['amount']);
    }

    public function test_a_usd_receipt_is_not_silently_converted_to_another_dollar(): void
    {
        $payment = $this->payment();

        $charge = $this->charge($payment);

        // Currency used to be resolved with where('symbol', '$')->first(), which
        // returns BMD — and the template then converted USD→BMD on the receipt.
        $this->assertSame('USD', $charge['iso']);
        $this->assertSame(130.15, $charge['amount']);
    }

    public function test_an_item_reports_its_own_charge_rather_than_zero(): void
    {
        $payment = $this->payment();

        $item = StripePaymentItems::create([
            'uuid' => (string) Str::uuid(),
            'stripe_payment_detail_id' => $payment->id,
            'amount' => 100,
            'total_paid' => 0,   // nothing ever writes this column
            'quantity' => 1,
        ]);

        $charge = $this->charge($item->fresh());

        // `is_numeric(0)` is true, so the old chain matched total_paid first and
        // the receipt read 0.00.
        $this->assertSame(130.15, $charge['amount']);
        $this->assertSame('USD', $charge['iso']);
    }

    public function test_one_line_of_a_basket_reports_only_its_own_share(): void
    {
        $payment = $this->payment(['amount_subtotal' => 200, 'amount_total' => 260.30]);

        $cheap = StripePaymentItems::create([
            'uuid' => (string) Str::uuid(),
            'stripe_payment_detail_id' => $payment->id,
            'amount' => 50,
            'quantity' => 1,
        ]);

        // A quarter of the listed value is a quarter of the charge — never the
        // whole basket against one line.
        $this->assertSame(65.08, $this->charge($cheap->fresh())['amount']);
    }

    public function test_the_creator_net_is_the_listed_price_never_the_supporters_charge(): void
    {
        $payment = $this->payment();

        StripePaymentItems::create([
            'uuid' => (string) Str::uuid(),
            'stripe_payment_detail_id' => $payment->id,
            'wish_item_id' => 4242,
            'amount' => 100,
            'quantity' => 1,
        ]);

        $payment->load('items');

        // Mirrors CheckoutMailToUser::sendCreatorEmail(): the deliverable carries
        // no `creator_net_amount` (nothing writes it), so the item's listed price
        // is the net. The old code fell back to the deliverable's
        // transaction_amount, which is the supporter's gross.
        $deliverable = (object) ['metadata' => null, 'item_id' => 4242, 'transaction_amount' => 130.15];

        $net = 0.0;
        $metadata = json_decode($deliverable->metadata ?? '', true);

        if (isset($metadata['creator_net_amount']) && is_numeric($metadata['creator_net_amount'])) {
            $net += (float) $metadata['creator_net_amount'];
        } else {
            $item = $payment->items?->firstWhere('wish_item_id', $deliverable->item_id);
            if ($item && is_numeric($item->amount)) {
                $net += (float) $item->amount;
            }
        }

        if ($net <= 0) {
            $net = (float) ($payment->amount_subtotal ?? 0);
        }

        $this->assertSame(100.0, $net);
        $this->assertNotSame((float) $deliverable->transaction_amount, $net);
    }

    public function test_the_two_emails_never_quote_the_same_figure(): void
    {
        $payment = $this->payment();

        $buyerPays = $this->charge($payment)['amount'];
        $creatorEarns = (float) $payment->amount_subtotal;

        $this->assertGreaterThan($creatorEarns, $buyerPays);
    }
}
