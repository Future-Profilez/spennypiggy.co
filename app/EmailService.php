<?php

namespace App;

use App\Mail\Checkout;
use App\Mail\CheckoutToUser;
use App\Mail\ForgotPassEmail;
use App\Mail\MemberMail;
use App\Mail\MonthlySubscriptionSuccessMail;
use App\Mail\MonthlySubscriptionFailedMail;
use App\Jobs\MonthlySubscriptionFailedJobs;
use App\Mail\BillMail;
use App\Mail\BillMailToUser;
use App\Mail\MemberMailToUser;
use App\Mail\RenewMail;
use App\Mail\SendAdminIntroMail;
use App\Mail\SendAvatarRestrictionMail;
use App\Mail\SendCoverRestrictionMail;
use App\Mail\SendRestrictionMail;
use App\Mail\SendTipJarMailToUser;
use App\Mail\ShopBuyedMail;
use App\Mail\ShopBuyedMailUser;
use App\Mail\SubscriptionFailedMail;
use App\Mail\SubscriptionMail;
use App\Mail\SubsMail;
use App\Mail\SupportPaymentToUser;
use App\Mail\ThankYouMailAdmin;
use App\Mail\ThankyouUser;
use App\Mail\TipJarMail;
use App\Mail\VerifyEmail;
use App\Mail\Welcome;
use App\Mail\Wishlist;
use App\Mail\WishSubscriptionMailToUsers;
use App\Mail\FeatureSuggestionMail;
use App\Models\AppService;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Symfony\Component\Mailer\Exception\TransportException;

class EmailService
{


    /**
     * Send welcome email to new users
     * @param array $data Email Dynamic Data
     * @return void
     */
    public static function welcome($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new Welcome($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function saveWishlist($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new Wishlist($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function checkOutUser($data, $anon, $surprise, $message, $anonname, $symbol, $vat_amount)
    {
        try {
            $emailData = [
                'to' => $data->payment->owner->email,
                'name' => $data->payment->owner->name,
                'username' => $data->payment->owner->username,
                'phone' => $data->payment->owner->phone,
                'email' => $data->payment->owner->email,
                'uuid' => $data->payment->owner->uuid,
            ];

            Mail::to($emailData['to'])
                ->send(new Checkout($data, $anon, $surprise, $message, $anonname, $symbol, $vat_amount));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function shopBuyed($data, $anon, $amountUserPay, $symbol = '£')
    {
        try {
            // Force reload shop and user with trashed items to ensure we find the creator
            $data->load(['shop' => function ($q) {
                $q->withTrashed();
            }, 'shop.user']);

            $creator = $data->shop?->user;

            // Manual fallback if relationship loading failed
            if (!$creator && $data->shop_id) {
                $shop = \App\Models\Shop::withTrashed()->find($data->shop_id);
                $creator = $shop?->user;
                if (!$creator && $shop?->user_id) {
                    $creator = \App\Models\User::find($shop->user_id);
                }
            }

            $toEmail = $creator?->email;

            Log::info('EmailService::shopBuyed - Attempting to send to creator', [
                'shop_payment_id' => $data->id ?? null,
                'email' => $toEmail ?? 'NOT_FOUND',
                'shop_id' => $data->shop_id ?? 'NOT_FOUND',
                'amount' => $amountUserPay
            ]);

            if (!$toEmail) {
                Log::warning('EmailService::shopBuyed - Creator email not found. Skipping email.', [
                    'shop_payment_id' => $data->id ?? null
                ]);
                return;
            }

            $cleanAmount = (float) preg_replace('/[^\d.]/', '', $amountUserPay);

            $amountWithSymbol = $symbol . number_format($cleanAmount, 2);
            Mail::to($toEmail)->send(new ShopBuyedMail($data, $anon, $amountWithSymbol));

            Log::info('EmailService::shopBuyed - Creator email sent successfully', ['email' => $toEmail]);
        } catch (\Throwable $e) {
            Log::error('EmailService::shopBuyed - Failed to send creator email', [
                'error' => $e->getMessage(),
                'shop_payment_id' => $data->id ?? null,
            ]);
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function shopBuyedUser($data, $url, $curr, $deliverable = null)
    {
        Log::info('EmailService::shopBuyedUser called', [
            'shop_payment_id' => $data->id ?? null,
            'currency' => $curr
        ]);

        try {
            $data->load(['user', 'shop' => function ($q) {
                $q->withTrashed();
            }, 'shop.user']);

            $toEmail = $data->user?->email ?? $data->email;

            if (!$toEmail) {
                Log::warning('EmailService::shopBuyedUser skipped: missing buyer email', [
                    'shop_payment_id' => $data->id ?? null,
                ]);
                return;
            }

            if (!$deliverable) {
                Log::info('EmailService::shopBuyedUser: deliverable missing, attempting to resolve by session_id', ['session_id' => $data->session_id]);
                $deliverable = \App\Models\Deliverable::where('session_id', $data->session_id)
                    ->where('product_type', 'shop_item')
                    ->first();
            }

            Log::info('EmailService::shopBuyedUser sending to buyer', ['email' => $toEmail]);
            Mail::to($toEmail)->send(new ShopBuyedMailUser($data, $url, $curr, $deliverable));
            Log::info('EmailService::shopBuyedUser sent successfully');
        } catch (\Throwable $e) {
            Log::error('EmailService::shopBuyedUser failed', [
                'error' => $e->getMessage(),
                'shop_payment_id' => $data->id ?? null,
            ]);
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function checkOutToUser($data, $curr)
    {
        Log::info('EmailService::checkOutToUser started', [
            'payment_id' => $data->id ?? 'null',
            'session_id' => $data->session_id ?? 'null',
            'currency' => $curr,
            'user_exists' => isset($data->user) ? 'yes' : 'no',
            'guest_email' => $data->guest_email ?? 'null'
        ]);

        // Determine recipient (logged-in user or guest email)
        $recipientEmail = null;
        $recipientName = null;
        $recipientUsername = null;
        $recipientPhone = null;
        $recipientUuid = null;

        if (isset($data->user)) {
            Log::info('EmailService::checkOutToUser - Using authenticated user for recipient', [
                'user_id' => $data->user->id ?? 'null',
                'user_email' => $data->user->email ?? 'null'
            ]);
            $recipientEmail = $data->user->email ?? null;
            $recipientName = $data->user->name ?? null;
            $recipientUsername = $data->user->username ?? null;
            $recipientPhone = $data->user->phone ?? null;
            $recipientUuid = $data->user->uuid ?? null;
        } else {
            Log::info('EmailService::checkOutToUser - Falling back to guest email', [
                'guest_email' => $data->guest_email ?? 'null'
            ]);
            $recipientEmail = $data->guest_email ?? null;
            // Attempt to populate optional fields from stored name if available
            $recipientName = $data->name ?? null;
        }

        if (empty($recipientEmail)) {
            Log::error('EmailService::checkOutToUser - No recipient email available');
            return; // Cannot proceed without a recipient
        }

        try {
            $emailData = [
                'to' => $recipientEmail,
                'name' => $recipientName,
                'username' => $recipientUsername,
                'phone' => $recipientPhone,
                'email' => $recipientEmail,
                'uuid' => $recipientUuid,
            ];

            Log::info('EmailService::checkOutToUser - About to send email', [
                'to' => $emailData['to'],
                'payment_id' => $data->id,
                'mail_config' => [
                    'driver' => config('mail.default'),
                    'host' => config('mail.mailers.smtp.host'),
                    'from_address' => config('mail.from.address'),
                    'from_name' => config('mail.from.name')
                ]
            ]);

            // Test email configuration first
            try {
                $testMail = Mail::to($emailData['to']);
                Log::info('EmailService::checkOutToUser - Mail facade initialized successfully');
            } catch (\Exception $e) {
                Log::error('EmailService::checkOutToUser - Mail facade initialization failed', [
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }

            // Create and send the email
            try {
                $checkoutEmail = new CheckoutToUser($data, $curr);

                Mail::to($emailData['to'])->send($checkoutEmail);
                Log::info('EmailService::checkOutToUser - Mail::send() completed without exceptions');
            } catch (\Throwable $e) {
                Log::error('EmailService::checkOutToUser - Mail send failed', [
                    'error' => $e->getMessage(),
                    'to' => $emailData['to']
                ]);
                throw $e;
            }

            Log::info('EmailService::checkOutToUser - Email process completed successfully', [
                'to' => $emailData['to'],
                'payment_id' => $data->id
            ]);
        } catch (TransportException $e) {
            Log::error('EmailService::checkOutToUser - TransportException', [
                'error' => $e->getMessage(),
                'payment_id' => $data->id ?? 'null',
                'to' => $emailData['to'] ?? 'null',
                'trace' => $e->getTraceAsString()
            ]);
            AppService::setStatus('email', 0, $e->getMessage());
            throw $e; // Re-throw to ensure job fails if email fails
        } catch (\Exception $e) {
            Log::error('EmailService::checkOutToUser - General Exception', [
                'error' => $e->getMessage(),
                'payment_id' => $data->id ?? 'null',
                'to' => $emailData['to'] ?? 'null',
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e; // Re-throw to ensure job fails if email fails
        }
    }

    public static function sendSubscriptionMail($value)
    {
        try {

            $data = [
                'to' => $value->user->email,
                'name' => $value->user->name,
                'username' => $value->user->username,
                'phone' => $value->user->phone,
                'email' => $value->user->email,
                'uuid' => $value->user->uuid,
            ];

            Mail::to($data['to'])
                ->send(new SubscriptionMail($value));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    // monthly subscribed send mail
    public static function sendMonthlySubscribedMail($email, $sub)
    {
        try {
            Mail::to($email)->send(new MonthlySubscriptionSuccessMail($sub));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }



    // monthly subscribed failed mail
    public static function monthlySubscribedFailedMail($email, $sub)
    {
        try {
            Mail::to($email)->send(new MonthlySubscriptionFailedMail($sub));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }


    public static function verifyUserEmail($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new VerifyEmail($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function ForgotPassword($data)
    {
        try {
            Mail::to($data['to'])
                ->send(new ForgotPassEmail($data));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function thankyouUser($payment)
    {
        try {
            Log::info('EmailService::thankyouUser - Starting to send thank you email', [
                'payment_id' => $payment->id ?? 'null',
                'user_id' => $payment->payment->user->id ?? 'null'
            ]);

            $emailData = [
                'to' => $payment->payment->user->email,
                'name' => $payment->payment->user->name,
                'username' => $payment->payment->user->username,
                'phone' => $payment->payment->user->phone,
                'email' => $payment->payment->user->email,
                'uuid' => $payment->payment->user->uuid,
            ];

            Log::info('EmailService::thankyouUser - Email data prepared', [
                'to' => $emailData['to'],
                'name' => $emailData['name']
            ]);

            Mail::to($emailData['to'])->send(new ThankyouUser($payment));

            Log::info('EmailService::thankyouUser - Email sent successfully', [
                'to' => $emailData['to'],
                'payment_id' => $payment->id ?? 'null'
            ]);

            // Create deliverable record for email tracking
            try {
                \App\Models\Deliverable::create([
                    'uuid' => Str::uuid(),
                    'product_id' => $payment->payment->stripe_product_id ?? 'thank_you_email',
                    'price_id' => $payment->payment->stripe_price_id ?? null,
                    'creator_id' => $payment->payment->owner->id ?? null,
                    'gifter_id' => $payment->payment->user->id ?? null,
                    'payment_intent_id' => $payment->payment->stripe_payment_intent_id ?? null,
                    'session_id' => $payment->payment->stripe_session_id ?? null,
                    'deliverable_type' => 'email',
                    'product_type' => 'thank_you',
                    'transaction_amount' => ($payment->payment->amount ?? 0) / 100,
                    'deliverable_url' => null,
                    'metadata' => json_encode([
                        'email_type' => 'thank_you',
                        'payment_id' => $payment->payment->id ?? null
                    ]),
                    'status' => 'delivered',
                    'delivered_at' => now()
                ]);

                Log::info('EmailService::thankyouUser - Deliverable record created');
            } catch (\Exception $e) {
                Log::error('EmailService::thankyouUser - Failed to create deliverable record', [
                    'error' => $e->getMessage()
                ]);
            }
        } catch (TransportException $e) {
            Log::error('EmailService::thankyouUser - Transport Exception', [
                'error' => $e->getMessage(),
                'to' => $emailData['to'] ?? 'null'
            ]);
            AppService::setStatus('email', 0, $e->getMessage());
        } catch (\Exception $e) {
            Log::error('EmailService::thankyouUser - General Exception', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);
        }
    }



    public static function sendRenewMail($array, $type, $module)
    {
        try {
            if (empty($array['email'])) {
                throw new \InvalidArgumentException("Email address is missing.");
            }
            Mail::to($array['email'])->send(new \App\Mail\RenewMail($array, $type, $module));
        } catch (\InvalidArgumentException $e) {
            Log::error('🚫 InvalidArgumentException: ' . $e->getMessage());
        } catch (\Symfony\Component\Mailer\Exception\TransportException $e) {
            Log::error('🚨 TransportException: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('🔥 Unexpected error in sendRenewMail: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
        }
    }




    public static function sendSubscribedMail($sub, $creatorFinalAmount)
    {
        try {
            $toEmail = $sub->wish_item?->user?->email;
            if (empty($toEmail)) {
                Log::warning('EmailService::sendSubscribedMail skipped: missing creator email');
                return;
            }
            Mail::to($toEmail)->send(new SubsMail($sub, $creatorFinalAmount));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }


    // public static function sendMembershipMail($data, $amountWithCurr)
    // {
    //     try {
    //         Mail::to($data->membership->user->email)->send(new MemberMail($data, $amountWithCurr));
    //     } catch (TransportException $e) {
    //         AppService::setStatus('email', 0, $e->getMessage());
    //     }
    // }

    public static function sendMembershipMail($mem, $amountWithCurr)
    {
        try {
            $toEmail = $mem->membership?->user?->email;
            if (empty($toEmail)) {
                Log::warning('EmailService::sendMembershipMail skipped: missing creator email');
                return;
            }
            Mail::to($toEmail)->send(new MemberMail($mem, $amountWithCurr));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendMembershipMailToUser($mem, $amountWithcurrency, $deliverable = null)
    {
        try {
            Mail::to($mem->guest_email)->send(new MemberMailToUser($mem, $amountWithcurrency, $deliverable));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendBillMail($bill_pay, $amountWithVat)
    {
        try {
            Mail::to($bill_pay->bill->user->email)->send(new BillMail($bill_pay, $amountWithVat));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    // public static function sendBillMailToUser($bill_pay, $amountWithCurr, $user_name)
    // {
    //     try {
    //         Mail::to($bill_pay->bill->user)->send(new BillMailToUser($bill_pay, $amountWithCurr, $user_name));
    //     } catch (TransportException $e) {
    //         AppService::setStatus('email', 0, $e->getMessage());
    //     }
    // }
    // public static function sendBillMail($data, $amountWithVat)
    // {
    //     try {
    //         Mail::to($data->bill->user->email)->send(new BillMail($data, $amountWithVat));
    //     } catch (TransportException $e) {
    //         AppService::setStatus('email', 0, $e->getMessage());
    //     }
    // }

    public static function sendTipJarSubscribedMail($data, $symbol, $net_amount = null)
    {
        try {
            Mail::to($data->creator->email)->send(new TipJarMail($data, $symbol, $net_amount));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendTipJarToUser($pay, $symbol, $amount)
    {
        try {
            Mail::to($pay->guest_email ?? $pay->user->email)->send(new SendTipJarMailToUser($pay, $symbol, $amount));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    /**
     * Send support payment notification email to supporter
     */
    public static function sendSupportPaymentToUser($paymentData, $currency)
    {
        try {
            // Determine recipient email
            $recipientEmail = null;
            if (isset($paymentData->user) && $paymentData->user) {
                $recipientEmail = $paymentData->user->email;
            } else {
                $recipientEmail = $paymentData->guest_email;
            }

            if (empty($recipientEmail)) {
                Log::error('EmailService::sendSupportPaymentToUser - No recipient email available');
                return;
            }

            Log::info('EmailService::sendSupportPaymentToUser - Sending email', [
                'payment_id' => $paymentData->id,
                'to' => $recipientEmail,
                'amount' => $paymentData->amount_subtotal,
                'currency' => $currency
            ]);

            // Create currency symbol from currency code
            $currencySymbols = [
                'USD' => '$',
                'GBP' => '£',
                'EUR' => '€',
            ];
            $symbol = $currencySymbols[strtoupper($currency)] ?? strtoupper($currency) . ' ';

            Mail::to($recipientEmail)->send(new \App\Mail\SupportPaymentToUser($paymentData, $symbol));

            Log::info('EmailService::sendSupportPaymentToUser - Email sent successfully', [
                'to' => $recipientEmail,
                'payment_id' => $paymentData->id
            ]);
        } catch (TransportException $e) {
            Log::error('EmailService::sendSupportPaymentToUser - TransportException', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentData->id ?? 'null'
            ]);
            AppService::setStatus('email', 0, $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            Log::error('EmailService::sendSupportPaymentToUser - General Exception', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentData->id ?? 'null'
            ]);
            throw $e;
        }
    }

    public static function subscriptionFailed($sub)
    {
        try {
            Mail::to($sub->guest_email)->send(new SubscriptionFailedMail($sub));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendRestrictionMail($wish)
    {
        try {
            Mail::to($wish->user->email)->send(new SendRestrictionMail($wish));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }


    public static function sendAvatarRestrictionMail($email)
    {
        try {
            Mail::to($email)->send(new SendAvatarRestrictionMail());
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendCoverRestrictionMail($email)
    {
        try {
            Mail::to($email)->send(new SendCoverRestrictionMail());
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendIntroApprovingMailAdmin($intro)
    {
        try {
            $appUrl = config('app.url'); // e.g. https://dev.spennypiggy.co
            if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
                Mail::to('prem@futureprofilez.com')->send(new SendAdminIntroMail($intro));
            } elseif ($appUrl == 'https://spennypiggy.co') {
                Mail::to("jack@spennypiggy.co")->send(new SendAdminIntroMail($intro));
            }
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function sendThankyouAdmin($pay)
    {
        try {
            $appUrl = config('app.url'); // e.g. https://dev.spennypiggy.co
            if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
                Mail::to('prem@futureprofilez.com')->send(new ThankYouMailAdmin($pay));
            } elseif ($appUrl == 'https://spennypiggy.co') {
                Mail::to("jack@spennypiggy.co")->send(new ThankYouMailAdmin($pay));
            }
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function wishSubscriptionMailToUser($sub, $mailToSend, $amountTotal, $creator_name, $is_renewal = false)
    {
        try {
            Mail::to($mailToSend)->send(new WishSubscriptionMailToUsers($sub, $amountTotal, $creator_name, $is_renewal));
        } catch (TransportException $e) {
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function billContentDelivery($data, $curr)
    {
        Log::info('EmailService::billContentDelivery started', [
            'bill_payment_id' => $data->id ?? 'null',
            'bill_id' => $data->bill->id ?? 'null',
            'currency' => $curr,
            'recipient_email' => $data->guest_email ?? 'null'
        ]);

        try {
            // Use CheckoutToUser mail class for consistency with existing system
            Mail::to($data->guest_email)->send(new CheckoutToUser($data, $curr));

            Log::info('EmailService::billContentDelivery sent successfully', [
                'bill_payment_id' => $data->id,
                'recipient_email' => $data->guest_email
            ]);
        } catch (TransportException $e) {
            Log::error('EmailService::billContentDelivery failed', [
                'bill_payment_id' => $data->id ?? 'null',
                'error' => $e->getMessage()
            ]);
            AppService::setStatus('email', 0, $e->getMessage());
        }
    }

    public static function featureSuggestion($data)
    {
        try {
            $emails = ['naveen@internetbusinesssolutionsindia.com', 'support@spennypiggy.co'];
            Mail::to($emails)->send(new FeatureSuggestionMail($data));

            Log::info('EmailService::featureSuggestion - Email sent successfully', [
                'emails' => $emails
            ]);
        } catch (\Exception $e) {
            Log::error('EmailService::featureSuggestion - Failed to send email', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send marketing email - respects user's marketing email preferences
     * @param User $user The user to send email to
     * @param Mailable $mailable The email to send
     * @return void
     */
    public static function sendMarketingEmail(User $user, Mailable $mailable)
    {
        try {
            // Check if user has marketing emails enabled
            if (!$user->marketing_emails_enabled) {
                Log::info('EmailService::sendMarketingEmail - Skipping marketing email for user '.$user->id.' (marketing emails disabled)', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
                return;
            }

            if ($mailable instanceof \Illuminate\Mail\Mailable) {
                $mailable->with(['user' => $user]);
            }

            // Send the marketing email
            Mail::to($user->email)->send($mailable);

            Log::info('EmailService::sendMarketingEmail - Marketing email sent successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
        } catch (TransportException $e) {
            Log::error('EmailService::sendMarketingEmail - TransportException', [
                'user_id' => $user->id ?? 'null',
                'email' => $user->email ?? 'null',
                'error' => $e->getMessage()
            ]);
            AppService::setStatus('email', 0, $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            Log::error('EmailService::sendMarketingEmail - General Exception', [
                'user_id' => $user->id ?? 'null',
                'email' => $user->email ?? 'null',
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
