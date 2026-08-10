<?php

namespace App\Mail;

use App\Helpers;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class CheckoutToUser extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public $curr;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data, $curr)
    {
        $this->data = $data;
        $this->curr = $curr;
    }

    /**
     * What the buyer was actually charged, and the currency it was charged in.
     *
     * 🚨 A RECEIPT STATES THE CHARGED AMOUNT IN THE CHARGED CURRENCY. This used to
     * be worked out inside the Blade template from a fallback chain
     * (`total_paid → amount_subtotal → amount → amount_total`) and got it wrong
     * for every shape it was handed:
     *
     *  - `stripe_payment_details` HAS NO `total_paid` COLUMN, so the chain always
     *    landed on `amount_subtotal` — which is the LISTED price, i.e. the
     *    creator's net. A buyer charged 130.15 was emailed 100.
     *  - `stripe_payment_items.total_paid` is written by nothing (0 on every row),
     *    and `is_numeric(0)` is true, so an item hit branch one and the receipt
     *    read 0.00.
     *
     * `amount_subtotal` is the creator's net and `amount_total` is the buyer's
     * charge — the buyer and creator emails had them the wrong way round.
     *
     * @return array{amount: float, iso: string}
     */
    private function buyerCharge(): array
    {
        $fallbackIso = strtoupper((string) ($this->data->currency ?? 'GBP'));

        try {
            // An item's own charge is its share of the payment it belongs to.
            if (class_basename($this->data) === 'StripePaymentItems') {
                $payment = $this->data->payment;

                if (! $payment) {
                    return ['amount' => (float) ($this->data->amount ?? 0), 'iso' => $fallbackIso];
                }

                $iso = strtoupper((string) ($payment->currency ?? $fallbackIso));
                $total = (float) ($payment->amount_total ?? 0);
                $subtotal = (float) ($payment->amount_subtotal ?? 0);
                $mine = (float) ($this->data->amount ?? 0);

                // Split by listed price, so a multi-item basket does not report the
                // whole basket's charge against one line.
                if ($subtotal > 0 && $mine > 0 && $mine < $subtotal) {
                    return ['amount' => round($total * ($mine / $subtotal), 2), 'iso' => $iso];
                }

                return ['amount' => $total > 0 ? $total : $mine, 'iso' => $iso];
            }

            return [
                'amount' => (float) ($this->data->amount_total ?? $this->data->amount_subtotal ?? 0),
                'iso' => $fallbackIso,
            ];
        } catch (\Throwable $e) {
            Log::warning('CheckoutToUser: could not resolve the buyer charge', [
                'payment_id' => $this->data->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return ['amount' => (float) ($this->data->amount_total ?? 0), 'iso' => $fallbackIso];
        }
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        try {
            Log::info('CheckoutToUser::build() - Starting email build process', [
                'payment_id' => $this->data->id ?? 'null',
                'currency' => $this->curr ?? 'null',
                'has_user' => isset($this->data->user) ? 'yes' : 'no',
                'has_owner' => isset($this->data->owner) ? 'yes' : 'no',
                'owner_id' => $this->data->owner_id ?? 'null',
            ]);

            $subject = 'Your content is ready on Spenny Piggy!';

            // For guest checkouts, create a mock owner from the payment data if needed
            if (! isset($this->data->owner) && ! isset($this->data->user)) {
                // Try to get owner from StripePaymentDetail relationship
                if (method_exists($this->data, 'owner') && $this->data->owner) {
                    // Owner relationship exists, no need to do anything
                    Log::info('CheckoutToUser: Owner relationship exists');
                } else {
                    Log::info('CheckoutToUser: Attempting to load owner from owner_id', [
                        'payment_id' => $this->data->id ?? 'null',
                        'owner_id' => $this->data->owner_id ?? 'null',
                    ]);
                    // Create a basic owner object if we have owner_id
                    if (isset($this->data->owner_id)) {
                        $owner = User::find($this->data->owner_id);
                        if ($owner) {
                            $this->data->owner = $owner;
                            Log::info('CheckoutToUser: Owner loaded successfully', [
                                'owner_name' => $owner->name ?? 'null',
                                'owner_email' => $owner->email ?? 'null',
                            ]);
                        } else {
                            Log::error('CheckoutToUser: Owner not found in database', [
                                'owner_id' => $this->data->owner_id,
                            ]);
                        }
                    }
                }
            } elseif (! isset($this->data->owner) && isset($this->data->user)) {
                $this->data->owner = $this->data->user;
                Log::info('CheckoutToUser: Using user as owner');
            }

            // Make sure amount_subtotal exists
            if (! isset($this->data->amount_subtotal) && isset($this->data->amount)) {
                $this->data->amount_subtotal = $this->data->amount;
                Log::info('CheckoutToUser: Set amount_subtotal from amount', [
                    'amount_subtotal' => $this->data->amount_subtotal,
                ]);
            }

            // Make sure currency exists
            if (! isset($this->data->currency)) {
                $this->data->currency = 'gbp';
                Log::info('CheckoutToUser: Set default currency to gbp');
            }

            Log::info('CheckoutToUser: About to build email with template', [
                'template' => 'email.checkout-user',
                'subject' => $subject,
                'from_address' => env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'),
                'from_name' => env('MAIL_FROM_NAME', 'Spenny Piggy'),
                'final_data' => [
                    'has_owner' => isset($this->data->owner) ? 'yes' : 'no',
                    'owner_name' => $this->data->owner->name ?? 'null',
                    'amount_subtotal' => $this->data->amount_subtotal ?? 'null',
                    'currency' => $this->data->currency ?? 'null',
                ],
            ]);

            $supportUrl = url('/history');
            $contactUrl = url('/history');
            $refundUrl = url('/history');

            $creatorUsername = $this->data->owner->username ?? null;
            $source = null;
            $sourceId = null;
            $baseModel = class_basename($this->data);

            if ($baseModel === 'StripePaymentItems') {
                $source = 'stripe_payment_items';
                $sourceId = (string) ($this->data->id ?? '');
            } elseif ($baseModel === 'StripePaymentDetail') {
                try {
                    if (method_exists($this->data, 'items')) {
                        $this->data->loadMissing(['items']);
                        $firstItem = $this->data->items?->first();
                        if ($firstItem && isset($firstItem->id)) {
                            $source = 'stripe_payment_items';
                            $sourceId = (string) $firstItem->id;
                        }
                    }
                } catch (\Throwable $e) {
                }
            }

            if ($creatorUsername && ! empty($source) && ! empty($sourceId)) {
                $base = url('/history');
                $common = http_build_query([
                    'support_open' => '1',
                    'creator_username' => $creatorUsername,
                    'event_type' => 'gift_wish',
                    'source' => $source,
                    'source_id' => $sourceId,
                ]);

                $contactUrl = $base.'?'.$common.'&support_type=contact';
                $refundUrl = $base.'?'.$common.'&support_type=refund';
            }

            $guestPaymentId = null;
            if ($baseModel === 'StripePaymentDetail') {
                $guestPaymentId = $this->data->id ?? null;
            } elseif ($baseModel === 'StripePaymentItems') {
                $guestPaymentId = $this->data->stripe_payment_detail_id ?? ($this->data->payment?->id ?? null);
            }

            if (! isset($this->data->user_id) && ! empty($this->data->guest_email) && ! empty($guestPaymentId)) {
                $supportUrl = URL::signedRoute('support.guest.create', [
                    'paymentId' => $guestPaymentId,
                    'email' => $this->data->guest_email,
                ]);

                $contactUrl = URL::signedRoute('support.guest.create', [
                    'paymentId' => $guestPaymentId,
                    'email' => $this->data->guest_email,
                    'type' => 'contact',
                ]);

                $refundUrl = URL::signedRoute('support.guest.create', [
                    'paymentId' => $guestPaymentId,
                    'email' => $this->data->guest_email,
                    'type' => 'refund',
                ]);
            }

            $charge = $this->buyerCharge();

            /*
             * ⚠️ Digits are resolved by ISO, never by SYMBOL. `$` is shared by 8
             * currencies in the `currencies` table, so a `where('symbol', $curr)`
             * lookup returned BMD for a USD payment — and the template then ran a
             * spurious USD→BMD conversion on the receipt figure.
             */
            $digits = 2;
            try {
                $row = Currency::where('ISO', $charge['iso'])->first();
                if ($row && is_numeric($row->ISOdigits)) {
                    $digits = (int) $row->ISOdigits;
                }
            } catch (\Throwable $e) {
                // A receipt must still send if the currency table is unreachable.
            }

            $builtEmail = $this->view('email.checkout-user')
                ->from(config('mail.from.address'), config('mail.from.name'))
                ->subject($subject)
                ->with([
                    'supportUrl' => $supportUrl,
                    'contactUrl' => $contactUrl,
                    'refundUrl' => $refundUrl,
                    'buyerPaid' => $charge['amount'],
                    'buyerCurrencySymbol' => Helpers::getCurrency($charge['iso']),
                    'buyerCurrencyDigits' => $digits,
                ]);

            Log::info('CheckoutToUser: Email built successfully');

            return $builtEmail;

        } catch (\Exception $e) {
            Log::error('CheckoutToUser email build error', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'payment_id' => $this->data->id ?? 'null',
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e; // Re-throw to ensure error is properly handled
        }
    }
}
