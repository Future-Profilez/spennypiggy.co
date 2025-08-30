<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutTweet;
use App\Jobs\CheckoutUser;
use App\Jobs\CrowdfundTweet;
use App\Jobs\SurpriseTweet;
use App\Mail\CommandFailed;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserPayment;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;

class CheckoutController extends Controller
{
    /* create checkout */
    public function createCheckout($creator_id, $user_id_or_device = null) {
        Log::info('Checkout createCheckout called', [
            'creator_id' => $creator_id,
            'user_id_or_device' => $user_id_or_device,
            'auth_user_id' => Auth::id(),
            'request_method' => request()->method(),
            'request_url' => request()->url(),
            'query_params' => request()->query()
        ]);

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        Log::info('Gifter card verification status', ['status' => $checkGifterStatus]);
        if ($checkGifterStatus == true) {
            $user = Auth::user();
            Log::info('Redirecting for card verification', ['user_id' => $user->id]);
            return to_route('user.show', ['username' => $user->username])->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }

        $user = Auth::user();  
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }
            
            // Get cart data filtered by specific creator
            if (Auth::check()) {
                // For authenticated users, filter by user_id AND owner_id (creator_id)
                $getdata = UserCart::where('user_id', Auth::id())
                    ->where('owner_id', $creator_id)  // Filter by specific creator
                    ->where('status', 1)
                    ->with(['wish', 'owner'])
                    ->get();
            } else {
                // For guests, filter by device_id AND owner_id (creator_id)
                $device_id = $user_id_or_device ?? request()->get('device_id');
                Log::info('Guest checkout - device ID check', [
                    'user_id_or_device' => $user_id_or_device,
                    'request_device_id' => request()->get('device_id'),
                    'final_device_id' => $device_id,
                    'all_request_data' => request()->all()
                ]);
                if (!$device_id) {
                    Log::error('Device ID is missing for guest checkout', [
                        'creator_id' => $creator_id,
                        'user_id_or_device' => $user_id_or_device,
                        'request_params' => request()->all()
                    ]);
                    return redirect()->back()->with('error', 'Device ID is required for guest checkout.');
                }
                
                $getdata = UserCart::where('device_id', $device_id)
                    ->where('owner_id', $creator_id)  // Filter by specific creator
                    ->where('status', 1)
                    ->with(['wish', 'owner'])
                    ->get();
            }
            
            if ($getdata->isEmpty()) {
                return redirect()->back()->with('error', 'No items in cart to checkout for this creator.');
            }
            
            // Get creator by ID
            $owner = User::find($creator_id);
            if (!$owner) {
                return redirect()->back()->with('error', 'Creator not found.');
            }
            
            // if (!empty($owner) && !in_array($owner->subscription_status, [1, 2])) {
            //     return redirect()->back()->with("error", "Currently creator has paused gift payments. Please try again later when gift payments are active.");
            // }

            // if ($getdata->isNotEmpty() && !in_array($getdata->first()->owner->subscription_status, [1, 2])) {
            //     return redirect()->back()->with('error', 'Currently creator has paused gift payments. Please try again later when gift payments are active.');
            // }

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;
            
            $lineItems = [];
            $subtotal = 0;
            $transfer_amount = 0;
            $totalShowTaxWithQuantity = 0;
            $totalStoreTax = 0; // Add this to accumulate store tax
            foreach ($getdata as $dd) {
                if (!$user) {
                    $email = request()->query('email');
                    $user = User::where('email', $email)->first();
                    if (!$user) {
                        $user = null;
                    }
                }
                $subtotals = 0;
                $totalAmount = $dd->amount;
                $ConvertedToGBpAmount = Helpers::priceFormat($dd->owner->default_currency, $totalAmount, 'gbp');
                $subtotals += $ConvertedToGBpAmount * $dd->quantity;
                if (!Auth::check() && $subtotals > 50) {
                    return to_route('login', ['message' => 'Larger payments more than £50 need to login']);
                }

                $adminFee = config('app.administration_fee');
                $showAdminsFees = Helpers::priceFormat('GBP', $adminFee, $currency);
                $StoreAdminsFees = Helpers::priceFormat('GBP', $adminFee, $dd->owner->default_currency);
                $taxPercentage = config('app.single_tax');

                $connectedAccountId = $getdata[0]->owner->account_id;

                // Step 1: Check if customer already exists in connected account
                $storeCustomer = ConnectedAccountCustomer::where('user_id', Auth::id())
                    ->where('creator_id', $dd->owner->id)
                    ->where('connected_account_id', $connectedAccountId)
                    ->where('product_type', 'wish item')
                    ->first();

                // Step 3: Create customer in connected account if not exists
                $customer = null;
                if (!$storeCustomer) {
                    $customer = StripeControl::createCustomer([
                        'email' => $user->email ?? $dd->email,
                        'name' => $user->name ?? $dd->name,
                    ], $connectedAccountId);
                }

                $customer_id = $storeCustomer->stripe_customer_id ?? $customer->id;

                // Step 5: Store customer & price if not already stored
                if (!$storeCustomer && $user) {
                    ConnectedAccountCustomer::create([
                        'user_id' => Auth::id() ?? $user->id,
                        'creator_id' => $dd->owner->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id,
                        'product_type' => 'wish item',
                        'product_id' => $dd->wish->stripe_product_id,
                        // 'price_id' => $priceId,
                    ]);
                }

                $ConvertedAmount = Helpers::priceFormat($dd->owner->default_currency, $totalAmount, $currency);
                $platformFeeAmount = $ConvertedAmount * $taxPercentage / 100;
                $showTax = $platformFeeAmount + $showAdminsFees;
                $showTaxWithQuantity = $showTax * $dd->quantity;
                $storeTax = $platformFeeAmount + $StoreAdminsFees * $dd->quantity;
                $storeTaxWithQuantity = $storeTax * $dd->quantity;

                // Create product data dynamically for platform account (products exist in connected accounts)
                $productName = $dd->wish->wishname ?? 'Wish Item';
                $lineItems[] = [
                    'quantity' => $dd->quantity,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => $productName,
                            'description' => 'Content from ' . ($dd->owner->name ?? 'Creator'),
                        ],
                        'unit_amount_decimal' => round($totalAmount * $multiplier),
                    ]
                ];
                
                // Add platform fee as separate line item for each product
                $lineItems[] = [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => 'Platform Fee - ' . ($dd->wish->wishname ?? 'Content'),
                        ],
                        'unit_amount' => round($showTaxWithQuantity * $multiplier),
                        'tax_behavior' => 'exclusive',
                    ],
                ];

                // this amount will be transfer to the creators account
                $transfer_amount += $ConvertedAmount * $dd->quantity;
                $subtotal += $ConvertedAmount * $dd->quantity; // Add this line to properly calculate subtotal
                $showTaxWithQuantity = $showTax * $dd->quantity;
                $totalShowTaxWithQuantity += $showTaxWithQuantity;
                $totalStoreTax += $storeTaxWithQuantity; // Accumulate store tax properly
            }

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

            // Calculate transfer amount (what creator receives = item amount only, no platform fees)
            // Total charge = item amount + platform fees
            // Transfer amount = item amount (what creator gets)
            // Platform keeps = platform fees
            $creatorVatAmount = 0;
            if (isset($owner->vat_amount_percentage) && $owner->vat_amount_percentage > 0) {
                $creatorVatAmount = round(($subtotal * $owner->vat_amount_percentage / 100) * $multiplier);
            }
            
            // Transfer amount = only the item amount (subtotal) + creator's VAT
            $transferAmount = round($subtotal * $multiplier) + $creatorVatAmount;
            
            // Total charged to customer = item amount + platform fees
            $totalChargeAmount = round($subtotal * $multiplier) + $creatorVatAmount + round($totalShowTaxWithQuantity * $multiplier);
            
            if ($transferAmount > $totalChargeAmount) {
                $transferAmount = $totalChargeAmount - round($totalShowTaxWithQuantity * $multiplier);
            }

            $payload = [
                'success_url' => route('checkout.success', [$creator_id]),
                'cancel_url' => route('checkout.cancel', [$creator_id]),
                "mode"  =>  "payment",
                'line_items' => $lineItems, // This determines the total amount automatically
                'payment_intent_data' => [
                    'on_behalf_of' => $connectedAccountId, // Shows creator as seller-of-record
                    'transfer_data' => [
                        'destination' => $connectedAccountId, // Creator's connected account
                        'amount' => $transferAmount, // What creator receives (item + VAT)
                    ],
                    'description' => "Spenny Piggy - Content purchase with platform fee",
                    "metadata" => \App\Helpers::buildStripeMetadata('wishlist', (object) [
                        'user_id' => Auth::id(),
                        'owner_id' => $owner->id,
                        'owner' => $owner,
                        'uuid' => 'checkout-session-' . time(),
                        // 'item_amount' => round($subtotal * $multiplier),
                        // 'creator_vat_amount' => $creatorVatAmount,
                        // 'transfer_amount' => $transferAmount,
                        // 'platform_fee_amount' => round($totalShowTaxWithQuantity * $multiplier),
                        'total_charge_amount' => $totalChargeAmount,
                    ], [
                        // "anonymous" => request()->query('anonymous') ?? '0',
                        "quantity" => (string) array_sum(array_column($getdata->toArray(), 'quantity')),
                        "payment_type" => "Destination Charges with transfers",
                    ]),
                ],
                'customer_email' =>  $getdata[0]->user->email ?? request()->query('email'),
            ];

            try {
                $sessionCreate = StripeControl::createCheckoutSession($payload); // Removed $connectedAccount parameter
            } catch (\Stripe\Exception\InvalidRequestException $e) {
                Log::error("Stripe Checkout Error: " . $e->getMessage());
                Log::error("Stripe Error Details: ", ['error' => $e->getJsonBody()]);
                return redirect()->back()->with('error', 'Payment failed: ' . $e->getMessage());
            } catch (\Exception $e) {
                Log::error("General Checkout Error: " . $e->getMessage());
                Log::error("Error trace: " . $e->getTraceAsString());
                return redirect()->back()->with('error', 'Checkout failed: ' . $e->getMessage());
            }

            session()->forget('session_id');
            session(['session_id' => $sessionCreate->id]);
            $stripePaymentDetail = StripePaymentDetail::create([
                'session_id' => $sessionCreate->id,
                'amount_subtotal' => $subtotal,
                'amount_total' => $sessionCreate->amount_total / $multiplier,
                'tax' => $totalStoreTax, // Use the accumulated store tax
                'currency' => $getdata[0]->owner->default_currency,
                'payment_method_config_detail_id' => optional($sessionCreate->payment_method_configuration_details)->id,
                'payment_method_type' => optional($sessionCreate->payment_method_types)[0],
                'user_id' => Auth::id() ?? null,
                'owner_id' => $getdata[0]->owner->id,
                'name' => request()->query('from') ?? '',
                'message' => $message ?? '',
                'anonymous' => request()->query('anonymous') ?? 0,
                'session_created' => $sessionCreate->created,
                'session_expires_at' => $sessionCreate->expires_at,
                'created_at' => now(),
                'updated_at' => now(),
             
            ]);

            $stripePaymentDetail->refresh();

            return Inertia::location($sessionCreate->url);
        } catch (\Throwable $th) {
            Log::error("Error in createCheckout: " . $th->getMessage());
            throw $th;
        }
    }

 
    public function successCheckout($id)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        if (Auth::check()) {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $id)->where('status', 1)->get();
        } else {
            $getdata = UserCart::where('device_id', $id)->where('status', 1)->get();
        }
        try {

            foreach ($getdata as $dd) {

                /**************************WISH**PWA**START****************************************************/
                // below is wish pwa for fans

                if (isset($dd->user) && $dd->user->email) {
                    $CreatorName = !empty($dd->owner->name) ? ucfirst($dd->owner->name) : 'A Creator';
                    $titles = "✨ Wish Sent Successfully!";
                    $contents = "You've sent a wish to $CreatorName. They'll be notified right away!.";
                    $emails = $dd->user->email ?? null;
                    Helpers::sendNotification($titles, $contents, $emails);
                }

                // below is wish pwa for creator
                $FanName = $dd->user ? ucfirst($dd->user->name) : 'A Fan';
                $title = "🎁 New Wish Received!";
                $content = "$FanName has sent you a paid wish.";
                $email = $dd->owner->email;

                Helpers::sendNotification($title, $content, $email);

                /****************************WISH**PWA**ENDS****************************************************/

                if (!empty($dd->wish->subscription)) {

                    if ($dd->wish->subscription == 1 && $dd->is_subscribed == 1) {
                        if (Auth::check()) {
                            if ($dd->wish->subscription_period == 'daily') {
                                $end = Carbon::now()->addDay(1);
                            } elseif ($dd->wish->subscription_period == 'weekly') {
                                $end = Carbon::now()->addWeek(1);
                            } elseif ($dd->wish->subscription_period == 'monthly') {
                                $end = Carbon::now()->addMonth(1);
                            }

                            $subscription = new Subscription();
                            $subscription->user_id = $dd->user_id ?? null;
                            $subscription->owner_id = $dd->owner_id;
                            $subscription->wish_id = $dd->wish_item_id;
                            $subscription->start_at = Carbon::now();
                            $subscription->end_at = $end;
                            $subscription->status = 1;
                            $subscription->save();
                        }
                    } elseif ($dd->wish->subscription == 2) {
                        $dd->wish->fullfill_amount += $dd->amount * $dd->quantity;
                        $dd->wish->save();
                    }
                }
            }

            $sessionId = session('session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();
            foreach ($getdata as $dd) {
                $payment_data = StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_item_id ?? Null,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                    'message_media' => $dd->wish->reward ?? null,
                    'media_type' => !empty($dd->wish->reward) ? 'image' : null,
                    'thank_you_approved' => !empty($dd->wish->reward) ? 1 : 0,
                    'tax' => $dd->tax,
                    'quantity' => $dd->quantity
                ]);
                $payment_data->refresh();

                $symbol = Currency::where('iso', strtoupper($payment_data->payment->currency))->first();
                if (!$symbol) {
                    Log::error("Currency not found for ISO: " . strtoupper($payment_data->payment->currency));
                    return redirect(route('user.show', [$stripeid->owner->username ?? $getdata[0]->owner->username]))->with('error', 'Currency configuration error. Please contact support.');
                }
                $vat_percentage = $dd->owner ? $dd->owner->vat_amount_percentage : 0; // Default to 0 if not set

                $tax = $stripeid->amount_subtotal * config('app.single_tax') / 100;

                // // Calculate VAT if the user has set a percentage
                $vat_amount = ($stripeid->amount_subtotal + $tax) * $vat_percentage / 100;
                $amountWithVat = $stripeid->amount_subtotal + $vat_amount;

                $message = $stripeid->message;

                if (Auth::check()) {
                    if ($dd->wish_item_id == NULL) {
                        CheckoutUser::dispatch($payment_data, false, $dd, $message, null, $symbol->symbol, $vat_amount);
                    } else {
                        CheckoutUser::dispatch($payment_data, false, false, $message, null, $symbol->symbol, $vat_amount);
                    }
                } else {
                    CheckoutUser::dispatch($payment_data, true, false, false, $stripeid->name, $symbol->symbol, $vat_amount);
                }


                if ($dd->owner->auto_tweet == 1) {
                    if (empty($dd->wish_item_id)) {
                        SurpriseTweet::dispatch($payment_data);
                    } elseif ($dd->wish->subscription == 2) {
                        CrowdfundTweet::dispatch($payment_data);
                    } else {
                        CheckoutTweet::dispatch($payment_data);
                    }
                }

                if ($dd->user_id && !empty($dd->user->email)) {
                    $total_amount = $dd->amount * $dd->quantity;
                    $userPayment = new UserPayment();
                    $userPayment->from_user_id = $dd->user_id ?? null;
                    $userPayment->to_user_id = $dd->owner_id;
                    $userPayment->product_type = 'wish item';
                    $userPayment->amount = $total_amount;
                    $userPayment->currency = $dd->wish->currency;
                    $userPayment->payment_method = 'stripe';
                    $userPayment->payment_details = json_encode($sessionId, true);
                    $userPayment->paid_at = Carbon::now();
                    $userPayment->status = $stripeid->payment_status;
                    $userPayment->save();
                }

                $dd->status = 0;
                $dd->quantity = 0;
                $dd->save();
            }


            if (Auth::check()) {
                $curr = Currency::where('iso', strtoupper($currency))->first();
                if ($curr) {
                    CheckoutMailToUser::dispatch($stripeid, $curr->symbol);
                } else {
                    Log::warning("Currency not found for checkout email: " . strtoupper($currency));
                    CheckoutMailToUser::dispatch($stripeid, '£'); // Default fallback
                }
            }

            return redirect(route('thank-you', [$stripeid->owner->username]))->with('success', 'Payment Successfull.');
        } catch (\Throwable $th) {
            Log::info("Error in successCheckout: " . $th->getMessage());
            return redirect(route('user.show', [$stripeid->owner->username ?? $getdata[0]->owner->username]))->with('error', 'Something went wrong!');
        }
    }

    public function cancelCheckout($id)
    {
        Log::info('Cancel checkout called', [
            'creator_id' => $id,
            'is_authenticated' => Auth::check(),
            'auth_user_id' => Auth::id()
        ]);
        
        if (Auth::check()) {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $id)->where('status', 1)->with(['wish'])->get();
        } else {
            $getdata = UserCart::where('device_id', $id)->where('status', 1)->with(['wish'])->get();
        }
        
        Log::info('Cart data found for cancellation', [
            'cart_items_count' => $getdata->count(),
            'creator_id' => $id
        ]);
        
        $sessionId = session('session_id');
        if ($sessionId) {
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'unpaid',
                'updated_at' => Carbon::now(),
            ]);
            Log::info('Payment status updated to unpaid', ['session_id' => $sessionId]);
        }
        
        // Handle case where no cart data is found
        if ($getdata->isEmpty()) {
            Log::warning('No cart data found for cancel checkout', [
                'creator_id' => $id,
                'is_authenticated' => Auth::check()
            ]);
            
            // Try to find the creator by ID to get their username
            $creator = User::find($id);
            if ($creator) {
                return redirect(route('user.show', [$creator->username]))->with('error', 'Payment cancelled - no active cart items found.');
            } else {
                // If creator not found, redirect to home or cart
                return redirect(route('cart'))->with('error', 'Payment cancelled.');
            }
        }
        
        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('error', 'Payment cancelled.');
    }

    /**
     * Debug Checkout - Simple test endpoint
     *
     * @return mixed
     */
    public function debugCheckout($id) {
        try {
            Log::info('Debug checkout called with ID: ' . $id);
            
            $user = Auth::user();
            Log::info('User authenticated: ' . ($user ? 'Yes - ID: ' . $user->id : 'No'));
            
            $owner = User::find($id);
            Log::info('Owner found: ' . ($owner ? 'Yes - Name: ' . $owner->name : 'No'));
            
            return response()->json([
                'status' => 'success',
                'message' => 'Checkout controller is working',
                'user_id' => $user ? $user->id : null,
                'owner_id' => $owner ? $owner->id : null,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('Debug checkout error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Test Checkout
     *
     * @return mixed
     */
    public function testCheckout()
    {
        $carts = UserCart::whereOwnerId(1)->get();
        $owner = User::findOrFail(1);

        $items = [];
        $tax = 0;
        foreach ($carts as $c) {
            $items[] = [
                'price'     => $c->priceid ?? $c->wish->price_id,
                'quantity'  => $c->quantity
            ];
            $tax += ($c->tax * $c->quantity);
        }

        // Get currency metadata to handle zero-decimal currencies properly
        $currency = 'gbp'; // Test method uses GBP by default
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;
        
        $payload = [
            "mode"  => "payment",
            "line_items"    => $items,
            "payment_intent_data"   =>  [
                'application_fee_amount'    => $tax * $multiplier,
                'transfer_data' => [
                    'destination'   => $owner->account_id
                ],
                'on_behalf_of'  => $owner->account_id
            ],
            'success_url'   => route("test.stripe.callback"),
            'cancel_url'    => route("test.stripe.callback", ["status" => "cancel"])
        ];

        $session = StripeControl::createCheckoutSession($payload);
        Session::put("checkout_session", $session->id);
        return response()->json($session);
    }

    /**
     * Handle Test Checkout
     *
     * @param string $session Checkout Session Id
     * @param string $status Checkout Status
     */
    public function testCallback($status = "success")
    {
        $sessionId = Session::get("checkout_session");

        $session = StripeControl::getCheckoutSession($sessionId);
        return response()->json([
            'status'    => $status,
            'session'   => $session
        ]);
    }
}
