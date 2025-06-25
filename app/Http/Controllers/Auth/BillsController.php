<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\BillPayMail;
use App\Jobs\BillPayToUser;
use App\Jobs\MembershipMail;
use App\Jobs\NotificationSave;
use App\Jobs\SendRenewMail;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\Logs;
use App\Models\User;
use App\Models\UserPayment;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Stripe\StripeClient;
use Stripe\Webhook;

class BillsController extends Controller
{
    public function billSave(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "name" => [
                "required",
                "string",
            ],
            "price" => [
                "required",
                "numeric",
                "min:0"
            ],
            'period' => [
                'required',
                'string'
            ]
        ]);

        if ($validator->fails()) {

            return response()->json([
                "status" => false,
                "msg" => "Validation failed",
                "errors" => $validator->errors(),
            ]);
        }

        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();

        $media = $request->thumbnail;

        $price = $request->price;
        // Fetch tax and administration fee from the configuration file
        $billTax = config('app.bill_tax'); // Tax percentage
        // $adminFeeAmount = config('app.administration_fee'); // Admin fee as a amount in gbp

        // $adminFee = config('app.administration_fee');
        // $convertedCurrAmount = Helpers::priceFormat('GBP', $adminFee, strtoupper($user->default_currency));

        // Calculate tax and total amount
        $taxAmount = round(($price * $billTax / 100), 2, PHP_ROUND_HALF_UP);

        $createPriceId = $price + $taxAmount; // Total price including tax and admin fee

        // Combine tax and admin fee percentages
        // $totalTaxamount = $$taxAmount;

        $bill = new Bills();
        $bill->user_id = Auth::id();
        $bill->name = $request->name;
        $bill->currency = $user->default_currency;
        $bill->price = $price;
        $bill->tax_amount = $taxAmount;
        $bill->thumbnail = !empty($media) ? $media : null;
        $bill->period = $request->period;

        $bill->save();

        $productPayload = [
            "name"  => $bill->name,
            "images" => [$bill->perma_link],
            "default_price_data"    =>  [
                "currency"  =>  $user->default_currency,
                "unit_amount_decimal"   => round($createPriceId, 2, PHP_ROUND_HALF_UP) * 100,
                'recurring' => [
                    'interval'  =>  StripeControl::$periods[$bill->period],
                    'interval_count'    =>  1
                ]
            ],
            "url"   =>  env('APP_URL') . '/' . $user->username . '/bill',
        ];

        try {
            $product = StripeControl::createProduct($productPayload, $user->account_id);
            $bill->product_id = $product->id;
            $bill->price_id = $product->default_price;
            $bill->save();
        } catch (Exception $e) {
            $bill->delete();

            return response()->json([
                'status' => false,
                'msg' => "Stripe Error: " . $e->getMessage()
            ]);
        }

        return response()->json([
            'status' => true,
            'msg' => "Bill added successfully, your upload will be approved shortly."
        ]);
    }

    public function billEdit(Request $request, $id)
    {
        Log::info("from start request->period: $request->period");

        $validator = Validator::make($request->all(), [
            "name" => ["required", "string"],
            "price" => ["required", "numeric", "min:0"],
        ]);

        if ($validator->fails()) {
            return response()->json([
                "status" => false,
                "msg" => "Validation failed",
                "errors" => $validator->errors(),
            ]);
        }

        $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        $bill = Bills::where('uuid', $id)->first();
        $old_periods = $bill->period;

        if (!$user || !$bill) {
            return response()->json([
                'status' => false,
                'msg' => 'User or Bill not found'
            ]);
        }

        $old_price = $bill->price;
        $old_price_id = $bill->price_id;

        $media = $request->thumbnail;
        $price = $request->price;
        $taxamount = round(($price * config('app.bill_tax') / 100), 2, PHP_ROUND_HALF_UP);
        $totalAmount = round($price + $taxamount, 2);

        $bill->fill([
            'user_id' => $user->id,
            'name' => $request->name,
            'currency' => $user->default_currency,
            'price' => $price,
            'tax_amount' => $taxamount,
            'thumbnail' => $media ?? null,
            'period' => $request->period,
        ])->save();

        try {
            Log::info("starting from try request->period: $request->period");

            if (!$bill->product_id) {
                return response()->json([
                    'status' => false,
                    'msg' => "Missing product ID on bill."
                ]);
            }

            Log::info("after if condition in try request->period: $request->period");
            Log::info("old_period: $old_periods");
            $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

            if ($old_price != $price || $old_periods != $request->period) {
                Log::info("request->period: $request->period");
                $newPrice = $stripe->prices->create([
                    'unit_amount_decimal' => (string) round($totalAmount * 100),
                    'currency' => $user->default_currency,
                    'product' => $bill->product_id,
                    'recurring' => [
                        'interval' => StripeControl::$periods[$request->period],
                        'interval_count' => 1
                    ]
                ], [
                    'stripe_account' => $user->account_id
                ]);
                Log::info(json_encode($newPrice));

                $product = $stripe->products->update($bill->product_id, [
                    'name' => $bill->name,
                    'images' => [$bill->perma_link],
                    'default_price' => $newPrice->id,
                    'url' => env('APP_URL') . '/' . $user->username,
                ], [
                    'stripe_account' => $user->account_id
                ]);

                $stripe->prices->update($old_price_id, [
                    'active' => false
                ], [
                    'stripe_account' => $user->account_id
                ]);

                $bill->update([
                    'price_id' => $newPrice->id,
                    'product_id' => $product->id,
                    'approved' => 0,
                ]);
            }

            Logs::where('edited_bill_id', $bill->id)
                ->where('status', 'pending')
                ->update(['status' => 'updated']);
        } catch (Exception $e) {
            Log::error("Stripe Error during bill edit: " . $e->getMessage());

            return response()->json([
                'status' => false,
                'msg' => "Stripe Error: " . $e->getMessage()
            ]);
        }

        Log::info("to end request->period: $request->period");


        return response()->json([
            'status' => true,
            'msg' => "Bill edited successfully."
        ]);
    }

    public function removeBill($uuid)
    {

        $bill = Bills::whereUuid($uuid)->first();

        if (!empty($bill)) {
            BillPayment::where('bills_id', $bill->id)->delete();

            $stripeProduct = StripeControl::getProduct($bill->product_id, $bill->user->account_id);
            // dd($stripeProduct);
            if ($stripeProduct) {
                // Delete the product and prices from Stripe
                StripeControl::deleteProductAndPrices($stripeProduct->id, $bill->user->account_id);
            }

            $bill->delete();
            return response()->json([
                'status' => true,
                'msg' => "Bill removed successfully."
            ]);
        }
        return response()->json([
            'status' => false,
            'msg' => "Bill not found."
        ]);
    }

    /**
     * Buy creator's membership
     *
     * @param Request $request
     * @param string $uuid Membership UUID
     * @param string $reccure Subscription Reccuring - onetime or continue
     * @return mixed
     */
    public function buyBill(Request $request, $uuid, $reccure = 'continue')
    {
        new StripeClient(env('STRIPE_SECRET_KEY'));

        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }

        $user = Auth::user();
        $bill = Bills::with('user')->whereUuid($uuid)->first();

        if (!$bill) return redirect()->back()->with('error', 'Bill not found!');
        if ($bill->user_id === $user->id) return redirect()->back()->with('error', "You can't buy your own bill!");

        $currency = strtolower($request->cookie("currency", "GBP"));
        $adminFeeAmount = config('app.administration_fee');
        $billTaxPercent = config('app.bill_tax');
        $vatPercent = $bill->user->vat_amount_percentage ?? 0;

        $price = $bill->price;
        $taxAmount = $price * $billTaxPercent / 100;
        $vatAmount = ($price + $taxAmount) * $vatPercent / 100;
        $totalTax = $adminFeeAmount + $taxAmount;

        $ConvertedVatAmount = Helpers::priceFormat($bill->currency, $vatAmount, $currency);
        $convertedAdminFeeGBP = Helpers::priceFormat('GBP', $adminFeeAmount, $currency);
        $ConvertedTaxAmount = Helpers::priceFormat($bill->currency, $taxAmount, $currency);

        $totalPaymentTaxAmount = $convertedAdminFeeGBP + $ConvertedTaxAmount;
        $creatorTotal = $price + $vatAmount;
        $ConvertedCreatorAmount = Helpers::priceFormat($bill->currency, $creatorTotal, $currency);
        $finalTotalAmount = $ConvertedCreatorAmount + $totalPaymentTaxAmount;

        $applicationFeePercent = round(($totalPaymentTaxAmount / $finalTotalAmount) * 100, 2);

        if ($request->isMethod("POST")) {
            $request->validate([
                'name' => ['nullable', 'string', 'max:50'],
                'email' => ['required', 'email:dns'],
                'message' => ['nullable', 'string', 'max:800'],
            ]);

            $sub = BillPayment::create([
                'bills_id'       => $bill->id,
                'user_id'        => $user->id,
                'guest_name'     => $request->name,
                'guest_email'    => $request->email,
                'currency'       => $bill->currency,
                'amount'         => $bill->price,
                'tax'            => $totalTax,
                'vat_tax_amount' => $vatAmount,
                'recurring_for'  => $reccure ?? null,
                'recurring_type' => $bill->period,
                'message'        => $request->message ?? null,
                'anonymous'      => $request->anonymous ?? 0,
            ]);

            try {
                $connectedAccountId = $bill->user->account_id;

                $storeCustomer = ConnectedAccountCustomer::where([
                    ['user_id', $user->id],
                    ['creator_id', $bill->user->id],
                    ['connected_account_id', $connectedAccountId],
                    ['currency', $currency],
                ])->first();

                $existingPriceEntry = ConnectedAccountCustomer::where([
                    ['user_id', $user->id],
                    ['creator_id', $bill->user->id],
                    ['connected_account_id', $connectedAccountId],
                    ['product_id', $bill->product_id],
                    ['currency', $currency],
                ])->whereNotNull('price_id')->first();

                $customer_id = $storeCustomer->stripe_customer_id ?? null;
                $product_id = $storeCustomer->product_id ?? null;

                // $existingSubscription = $customer_id
                //     ? StripeControl::getSubscription($product_id, $connectedAccountId)
                //     : null;
                $existingSubscription = StripeControl::getActiveSubscriptionByCustomer(
                    $storeCustomer->stripe_customer_id,
                    $storeCustomer->connected_account_id
                );


                if ($existingSubscription && $existingSubscription->currency !== $currency) {
                    $newCustomer = StripeControl::createCustomer([
                        'email' => $user->email,
                        'name' => $user->name,
                    ], $connectedAccountId);

                    $customer_id = $newCustomer->id;

                    $storeCustomer = ConnectedAccountCustomer::create([
                        'user_id' => $user->id,
                        'creator_id' => $bill->user->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id,
                        'product_type' => 'bill',
                        'product_id' => $bill->product_id,
                        'currency' => $currency,
                    ]);
                }

                if (!$customer_id) {
                    $newCustomer = StripeControl::createCustomer([
                        'email' => $user->email,
                        'name' => $user->name,
                    ], $connectedAccountId);

                    $customer_id = $newCustomer->id;
                }

                $priceId = $existingPriceEntry->price_id ?? null;

                if (!$priceId) {
                    $priceData = [
                        'unit_amount' => round($finalTotalAmount * 100),
                        'currency' => $currency,
                        'product' => $bill->product_id,
                        'recurring' => [
                            'interval' => StripeControl::$periods[$bill->period],
                            'interval_count' => 1,
                        ],
                    ];

                    $stripePrice = StripeControl::createPrice($priceData, $connectedAccountId);
                    if (empty($stripePrice->id)) {
                        throw new \Exception("Failed to create Stripe price.");
                    }

                    $priceId = $stripePrice->id;
                }

                if (!$storeCustomer) {
                    ConnectedAccountCustomer::create([
                        'user_id' => $user->id,
                        'creator_id' => $bill->user->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id,
                        'product_type' => 'bill',
                        'product_id' => $bill->product_id,
                        'price_id' => $priceId,
                        'currency' => $currency,
                    ]);
                }

                $items = [['price' => $priceId, 'quantity' => 1]];

                $payload = [
                    'currency' => $currency,
                    'line_items' => $items,
                    'customer' => $customer_id,
                    'success_url' => route('bill.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
                    'cancel_url' => route('bill.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
                    'mode' => 'subscription',
                    'subscription_data' => [
                        'application_fee_percent' => $applicationFeePercent,
                        'description' => "Recurring Bill for {$bill->user->username}",
                        'metadata' => [
                            'user_id' => $user->id,
                            'creator_id' => $bill->user->id,
                            'bill_id' => $bill->id,
                            'bill_payment_id' => $sub->id, // or 'bill_payment_uuid' => $sub->uuid
                            'type' => 'bill'
                        ],
                    ],
                ];

                $session = StripeControl::createCheckoutSession($payload, $connectedAccountId);

                $sub->update([
                    'session_id' => $session->id,
                    'product_id' => $bill->product_id,
                    'price_id' => $priceId,
                    'customer_id' => $customer_id,
                ]);

                return Inertia::location($session->url);
            } catch (\Exception $e) {
                Log::error("Stripe checkout session failed: " . $e->getMessage());
                return back()->with('error', $e->getMessage());
            }
        }

        return Inertia::render('bills/BillCheckout', [
            'bill' => $bill,
            'vat_amount' => $vatAmount,
            'reccure' => $reccure,
        ]);
    }

    /**
     * Handle Checkout Session
     *
     * @param string $uuid Subscription UUID
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handlePayment($uuid, $status)
    {
        $bill_pay = BillPayment::whereUuid($uuid)->first();

        if (!$bill_pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }

        if ($bill_pay->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }

        try {
            $session = StripeControl::getCheckoutSession($bill_pay->session_id, $bill_pay->bill->user->account_id);
            $bill_pay->status = $session->payment_status;

            if ($session->payment_status === 'paid') {
                $bill_pay->stripe_id = $session->subscription;

                $current = Carbon::now();
                switch ($bill_pay->recurring_type) {
                    case 'monthly':
                        $current->addMonth();
                        break;
                    case 'weekly':
                        $current->addWeek();
                        break;
                    case 'yearly':
                        $current->addYear();
                        break;
                }
                $bill_pay->upcoming_payment = $current;

                $symbol = Currency::where('iso', strtoupper($bill_pay->currency))->first();

                $vatAmountPercentage = $bill_pay->vat_tax_amount ?? 0;
                $amountWithVat = $symbol->symbol . ($bill_pay->amount + $vatAmountPercentage);
                $amountWithCurr = $symbol->symbol . $bill_pay->amount;

                /**************************BILL**PWA**START****************************************************/
                // below is BILL pwa for fans
                $CreatorName = ucfirst($bill_pay->bill->user->name) ?? 'A Creator';
                $title = "🧾 Bill Paid!";
                $content = "You’ve successfully paid your bill to $CreatorName.";
                $email = $bill_pay->guest_email;

                Helpers::sendNotification($title, $content, $email);

                // below is BILL pwa for creator
                $FanName = ucfirst($bill_pay->user->name) ?? 'A Fan';
                $title = "💰 Bill Payment Received!";
                $content = "$FanName has paid their bill. Check your earnings!.";
                $email = $bill_pay->bill->user->email;

                Helpers::sendNotification($title, $content, $email);
                /**************************BILL**PWA**ENDS****************************************************/

                // Dispatch mail jobs
                BillPayMail::dispatch($bill_pay, $amountWithVat);
                BillPayToUser::dispatch($bill_pay, $amountWithCurr, $bill_pay->bill->user->name);

                // Notification setup
                $username = $bill_pay->anonymous ? "Anonymous user" : ($bill_pay->guest_name ?? "Anonymous user");
                $message = "$username just subscribed to your bill {$bill_pay->bill->name}";
                NotificationSave::dispatch($message, $bill_pay->bill->user, $bill_pay->user, 'Bill');

                $bill_pay->save();

                $userPayment = new UserPayment();
                $userPayment->from_user_id = $bill_pay->user_id;
                $userPayment->to_user_id = $bill_pay->bill->user_id;
                $userPayment->product_type = 'bill';
                $userPayment->amount = $bill_pay->amount;
                $userPayment->currency = $bill_pay->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status;
                $userPayment->save();

                return to_route('thank-you', ['username' => $bill_pay->bill->user->username])->with('success', "Payment for subscription of bill is successful.");
            }

            $bill_pay->save();

            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('warning', "Bill is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('error', $e->getMessage());
        }
    }

    // public function handlePayment($uuid, $status)
    // {
    //     $bill_pay = BillPayment::whereUuid($uuid)->first();
    //     if (!$bill_pay) {
    //         return to_route('home')->with("error", 'Insufficient data!');
    //     }
    //     if ($bill_pay->status !== 'initiated') {
    //         return to_route('home')->with("error", 'Subscription already processed!');
    //     }
    //     try {
    //         $session = StripeControl::getCheckoutSession($bill_pay->session_id);
    //         $bill_pay->status = $session->payment_status;
    //         if ($session->payment_status == 'paid') {
    //             $bill_pay->stripe_id = $session->subscription;
    //             $current = Carbon::now();
    //             if ($bill_pay->recurring_type == "monthly") {
    //                 $current->addMonth();
    //             }
    //             if ($bill_pay->recurring_type == "weekly") {
    //                 $current->addWeek();
    //             }
    //             if ($bill_pay->recurring_type == "yearly") {
    //                 $current->addYear();
    //             }
    //             $bill_pay->upcoming_payment = $current;
    //             $bill_pay->save();

    //             $vatAmountPercentage = 0;
    //             $user_name = $bill_pay->bill->user->name; // creator name
    //             $symbol = Currency::where('iso', strtoupper($bill_pay->currency))->first();
    //             $tax = $bill_pay->amount * config('app.bill_tax_plaid') / 100;
    //             $amountWithTax = $bill_pay->amount + $tax;
    //             if (!empty($bill_pay->bill->user->vat_amount_percentage) && isset($bill_pay->bill->user->vat_amount_percentage)) {
    //                 $vat_percentage = $bill_pay->bill->user->vat_amount_percentage ?? 0;
    //                 if ($vat_percentage > 0) {
    //                     $vatAmountPercentage = $amountWithTax * $vat_percentage / 100;
    //                 }
    //             }

    //             $amountWithVat = $symbol->symbol . $bill_pay->amount + $vatAmountPercentage;
    //             $amountWithCurr = $symbol->symbol . $bill_pay->amount;

    //             BillPayMail::dispatch($bill_pay, $amountWithVat);

    //             // send mail jobs for user
    //             BillPayToUser::dispatch($bill_pay, $amountWithCurr, $user_name);

    //             if ($bill_pay->anonymous == 1) {
    //                 $username = "Anonymous user";
    //             } else {
    //                 $username = $bill_pay->guest_name ?? "Anonymous user";
    //             }

    //             $message = $username . " just subscribed to your bill " . $bill_pay->bill->name;
    //             NotificationSave::dispatch($message, $bill_pay->bill->user, $bill_pay->user, 'Bill');
    //             // if ($bill_pay->wish_item->user->auto_tweet == 1) {
    //             //     // MakeAutoTweets::dispatch($user);
    //             //     SubscribeAutoTweet::dispatch($bill_pay);
    //             //     bill_paybershipAutoTweet::dispatch($bill_pay);
    //             // }

    //             return to_route('thank-you', ['username' => $bill_pay->bill->user->username])->with('success', "Payment for subscription of bill is success.");
    //         }

    //         // SubscriptionFailed::dispatch($bill_pay);

    //         $bill_pay->save();
    //         return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('warning', "Bill is in {$session->payment_status} status.");
    //     } catch (Exception $e) {
    //         return to_route('user.show', ['username' => $bill_pay->bill->user->username])->with('error', $e->getMessage());
    //     }
    //     // return response()->json([
    //     //     'success'   =>  true,
    //     //     'session'   =>  $session,
    //     //     'status'    =>  $status
    //     // ]);
    // }


    public function billStatus(Request $request)
    {
        Log::info("Bill status request received");
        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

        // This is your Stripe CLI webhook secret for testing your endpoint locally.
        // $endpoint_secret = 'whsec_tuck6Z96sSloUF7kuABTtbhvRiVaF8N8';
        $endpoint_secret = 'whsec_5dgNdG5AVVtgC95nHMDnMJ1V8MxIlXr7';

        $payload = @file_get_contents('php://input');
        $sig_header = $request->server('HTTP_STRIPE_SIGNATURE');

        // $payload = @file_get_contents('php://input');
        // $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
        $event = null;

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret
            );
        } catch (\UnexpectedValueException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ]);
            // Invalid payload
            http_response_code(400);
            exit();
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ]);
            // Invalid signature
            http_response_code(400);
            exit();
        }

        $array = [];
        if (!empty($event)) {
            $subs = BillPayment::where('stripe_id', $event->data->object->subscription)->latest()->first();

            $ret = StripeControl::getSubscription($event->data->object->subscription);

            if ($event->type == "invoice.updated" && !empty($subs)) {

                $array = [
                    'email' => $event->data->object->customer_email,
                    'name' => $event->data->object->customer_name,
                    'invoice_pdf' => $event->data->object->invoice_pdf,
                    'uuid' => $subs->uuid,
                    'notification' => $subs->user->notification_send ?? 0
                ];

                $subs->status = "ended";
                $subs->save();

                $newSubs = new BillPayment();
                $newSubs->stripe_id = $subs->stripe_id;
                $newSubs->session_id = $subs->session_id;
                $newSubs->bills_id = $subs->bills_id;
                $newSubs->user_id = $subs->user_id;
                $newSubs->guest_name = $subs->guest_name;
                $newSubs->guest_email = $subs->guest_email;
                $newSubs->currency = $subs->currency;
                $newSubs->amount = $subs->amount;
                $newSubs->tax = $subs->tax;
                $newSubs->recurring_for = $subs->recurring_for;
                $newSubs->recurring_type = $subs->recurring_type;
                $newSubs->message = $subs->message;
                $newSubs->anonymous = $subs->anonymous;
                $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
                $newSubs->status = "paid";
                $newSubs->created_at = $subs->created_at;
                $newSubs->updated_at = Carbon::now();
                $newSubs->save();

                SendRenewMail::dispatch($array, 'renew', 'bill');
            } elseif ($event->type == "customer.subscription.deleted" && !empty($subs)) {
                $subs->status = 'cancelled';
                $subs->save();

                SendRenewMail::dispatch($array, 'cancelled', 'bill');
            } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
                $subs->status = 'failed';
                $subs->save();

                SendRenewMail::dispatch($array, 'failed', 'bill');
            }
        }

        return response()->json([
            'status' => true,
            'message' => 'success',
        ]);
        // return true;
    }
}
