<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
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
    public function __construct($data,$curr)
    {
        $this->data = $data;
        $this->curr = $curr;
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
                'owner_id' => $this->data->owner_id ?? 'null'
            ]);
            
            $subject = 'Your content is ready on Spenny Piggy!';
            
            // For guest checkouts, create a mock owner from the payment data if needed
            if (!isset($this->data->owner) && !isset($this->data->user)) {
                // Try to get owner from StripePaymentDetail relationship
                if (method_exists($this->data, 'owner') && $this->data->owner) {
                    // Owner relationship exists, no need to do anything
                    Log::info('CheckoutToUser: Owner relationship exists');
                } else {
                    Log::info('CheckoutToUser: Attempting to load owner from owner_id', [
                        'payment_id' => $this->data->id ?? 'null',
                        'owner_id' => $this->data->owner_id ?? 'null'
                    ]);
                    // Create a basic owner object if we have owner_id
                    if (isset($this->data->owner_id)) {
                        $owner = \App\Models\User::find($this->data->owner_id);
                        if ($owner) {
                            $this->data->owner = $owner;
                            Log::info('CheckoutToUser: Owner loaded successfully', [
                                'owner_name' => $owner->name ?? 'null',
                                'owner_email' => $owner->email ?? 'null'
                            ]);
                        } else {
                            Log::error('CheckoutToUser: Owner not found in database', [
                                'owner_id' => $this->data->owner_id
                            ]);
                        }
                    }
                }
            } elseif (!isset($this->data->owner) && isset($this->data->user)) {
                $this->data->owner = $this->data->user;
                Log::info('CheckoutToUser: Using user as owner');
            }
            
            // Make sure amount_subtotal exists
            if (!isset($this->data->amount_subtotal) && isset($this->data->amount)) {
                $this->data->amount_subtotal = $this->data->amount;
                Log::info('CheckoutToUser: Set amount_subtotal from amount', [
                    'amount_subtotal' => $this->data->amount_subtotal
                ]);
            }
            
            // Make sure currency exists
            if (!isset($this->data->currency)) {
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
                    'currency' => $this->data->currency ?? 'null'
                ]
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

            if ($creatorUsername && !empty($source) && !empty($sourceId)) {
                $base = url('/history');
                $common = http_build_query([
                    'support_open' => '1',
                    'creator_username' => $creatorUsername,
                    'event_type' => 'gift_wish',
                    'source' => $source,
                    'source_id' => $sourceId,
                ]);

                $contactUrl = $base . '?' . $common . '&support_type=contact';
                $refundUrl = $base . '?' . $common . '&support_type=refund';
            }

            $guestPaymentId = null;
            if ($baseModel === 'StripePaymentDetail') {
                $guestPaymentId = $this->data->id ?? null;
            } elseif ($baseModel === 'StripePaymentItems') {
                $guestPaymentId = $this->data->stripe_payment_detail_id ?? ($this->data->payment?->id ?? null);
            }

            if (!isset($this->data->user_id) && !empty($this->data->guest_email) && !empty($guestPaymentId)) {
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
            
            $builtEmail = $this->view('email.checkout-user')
                ->from(env('MAIL_FROM_ADDRESS', 'noreply@spennypiggy.co'), env('MAIL_FROM_NAME', 'Spenny Piggy'))
                ->subject($subject)
                ->with([
                    'supportUrl' => $supportUrl,
                    'contactUrl' => $contactUrl,
                    'refundUrl' => $refundUrl,
                ]);
                
            Log::info('CheckoutToUser: Email built successfully');
            
            return $builtEmail;
            
        } catch (\Exception $e) {
            Log::error('CheckoutToUser email build error', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'payment_id' => $this->data->id ?? 'null',
                'trace' => $e->getTraceAsString()
            ]);
            throw $e; // Re-throw to ensure error is properly handled
        }
    }
}
