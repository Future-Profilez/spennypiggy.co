<?php

namespace App\Http\Controllers;

use App\CurrencyExchange;
use App\Helpers;
use App\IpTracker;
use App\Jobs\DeleteStripeProductJob;
use App\Jobs\FetchSelfTwitterData;
use App\Mail\Welcome;
use App\Models\Currency;
use App\Models\TwitterToken;
use App\Models\User;
use App\SeoMeta;
use App\StripeControl;
use App\TwitterAuth1;
use App\TwitterAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Jobs\SendIdentityVerificationEmail;
use App\Jobs\SendRenewMail;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\MonthlyCharge;
use App\Models\Shop;
use App\Models\StripePaymentDetail;
use App\Models\UserCart;
use App\Models\UserVerificationStatus;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Stripe\Stripe;
use Stripe\Webhook;

class TestController extends Controller
{
    public function __construct()
    {
        // dd('ok');
        // Middleware can be applied here if needed
    }
    /**
     * Search Stripe Customer
     *
     * @return mixed
     */
    public function stripeSearch()
    {
        $query = "email:'pradeep@fpdemo.com'";
        $search = StripeControl::searchCustomer($query);
        return response()->json($search);
    }

    public function testEmail()
    {
        $user = User::find(1);
        $resp = Mail::to($user)->send(new Welcome([
            "name" => $user->name,
            "uuid" => $user->uuid
        ]));
        // $resp = $user->update(["password" => Hash::make("Mega-000")]);
        return response()->json([
            "success" => true,
            "resp" => $resp
        ]);
    }

    /**
     * Get Exchange Rates
     *
     * @param string $c base Currency
     * @return mixed
     */
    public function getRates($c = 'GBP')
    {
        /** For iniserting records */
        $resp = Storage::disk('public')->get('currencies.json');
        $currs = json_decode($resp, true);
        foreach ($currs as $iso => $c) {
            Currency::firstOrCreate([
                'ISO'           => $iso,
                'name'          => $c['name'],
                'demonym'       => $c['demonym'],
                'majorSingle'   => $c['majorSingle'],
                'majorPlural'   => $c['majorPlural'],
                'ISOnum'        => $c['ISOnum'],
                'symbol'        => $c['symbol'],
                'symbolNative' => $c['symbolNative'],
                'minorSingle'   => $c['minorSingle'],
                'minorPlural'   => $c['minorPlural'],
                'ISOdigits'     => $c['ISOdigits'] ?? 2,
                'numToBasic'    => $c['numToBasic'] ?? 100,
            ]);
        }

        /** For updating Currency Exchange rates */
        // $resp = CurrencyExchange::getRates($c);
        // if($resp["success"] && !empty($resp['data']['conversion_rates']))
        // {
        //     foreach($resp['data']['conversion_rates'] as $iso => $rate) {
        //         // $rate = str_replace(',', '', (string)$rate);
        //         // $rate = number_format((float)$rate, 4);
        //         Currency::where('ISO', $iso)->update(['conversion_rate' => $rate]);
        //     }
        // }

        $all = Currency::all();
        return response()->json($all);
    }

    /**
     * Get Currency Data
     *
     * @return mixed
     */
    public function testCurrencyData()
    {
        return response()->json([
            'success'   =>  true,
            'rate'      =>  Currency::rates(),
            'symbol'    => Currency::symbols()
        ]);
    }

    /**
     * Test Meta Tags
     *
     * @return mixed
     */
    public function testMeta()
    {
        SeoMeta::addTag('title', 'This is test SEO');
        SeoMeta::addTag('link', [
            'rel'   =>  'canonical',
            'href'  =>  'https://spennypiggy.co'
        ]);
        SeoMeta::addTag('meta', [
            'viewport'  =>  'width=device-width,initial-scale=1'
        ]);

        SeoMeta::addTag('meta', 'name="msapplication-TileColor" content="#05EFB8"');

        SeoMeta::addTag('meta', 'name="msapplication-TileColor" content="#05EFB8"');
        $str = SeoMeta::render();
        die($str);
    }

    /**
     * Test Twitter OAuth1.1
     */
    public function testX()
    {
        // $resp = TwitterAuth1::getInitOuthToken();
        $api = new TwitterAuth1;
        // $resp = $api->getOauthVerifier();
        // if($resp['status'])
        // {
        //     Session::put('x-secret', $resp['secret']);
        // }
        $token = TwitterToken::find(2);
        // FetchSelfTwitterData::dispatch($token);
        // $resp = TwitterAuthService::getSelf($token);
        $tweet = "Auto Tweet using OAuth1.1 for Spennypiggy.co";
        $resp = TwitterAuthService::postTweet($token, $tweet);
        return response()->json($resp);
    }

    /**
     * Test WishItems Optimization
     *
     * @param int $c Category Id
     * @return mixed
     */
    public function testItems($c = null)
    {
        $user   =   User::find(1);
        $query  = $user->wishItems();
        $query->when($c, function ($query) use ($c) {
            // If $categoryID is specified, filter by the specific category
            $query->whereHas('wishCategories', function ($query) use ($c) {
                $query->where('user_category_id', $c);
            });
        });
        $items = $query->orderBy('is_pin', 'DESC')->latest()->get();

        return response()->json([
            'items' =>  $items
        ]);
    }


    public function testAdultContent()
    {
        $uuid = '20dc8837-38ec-4ae1-a3b2-343c924a9cc1';

        // $response = Http::withHeaders([
        //     'Content-Type' => 'application/json',
        //     'Accept' => 'application/vnd.uploadcare-v0.7+json',
        //     'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        // ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
        //     'target' => $uuid,
        // ]);


        $response = Http::withHeaders([
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->get("https://api.uploadcare.com/files/$uuid/?include=appdata");

        $data = $response->json();
        return $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];
    }

    /**
     * Test Ip Address
     *
     * @return mixed
     */
    public function testIp()
    {

        IpTracker::getIpInfo();
        return response()->json([
            'success'   =>  true,
            'ip_indo'   =>  IpTracker::$ipInfo
        ]);
    }

    public function sendFailedVerificationEmails()
    {
        try {
            // Fetch users with non-null identity_verification_error
            $users = User::whereNotNull('identity_verification_error')->where('is_uk', 0)->get();

            if ($users->isEmpty()) {
                return response()->json(['status' => 'error', 'message' => 'No users found with identity verification errors.']);
            }

            // Dispatch email jobs for each user
            foreach ($users as $user) {
                dispatch(new SendIdentityVerificationEmail($user, 'failed'));
            }

            return response()->json(['status' => 'success', 'message' => 'Emails sent to users with identity verification errors.']);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error("Error in sending identity verification emails", [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json(['status' => 'error', 'message' => 'An error occurred while sending emails.']);
        }
    }

    public function seedUserVerificationStatus()
    {
        $now = Carbon::now();

        // Process CREATORS
        $creators = User::whereHas('creatorMonthlySubscription', function ($q) {
            $q->where('status', 'paid');
        })->where('role', 1)->where('is_uk', 0)->get();

        foreach ($creators as $user) {
            $hasAvatar = !empty($user->avatar) && $user->avatar_approved == 1;
            $hasBio = !empty($user->bio);

            $bioStatus = ($hasAvatar && $hasBio) ? 1 : 0; // Approved only if all conditions are met

            UserVerificationStatus::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'role' => 1,
                    'bio_status' => $bioStatus,
                    'social_status' => 0,
                    'address_status' => 0,
                    'user_profile_status' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // Process GIFTERS
        $gifters = User::where('role', 0)->where('is_uk', 0)
            ->whereHas('gifterCardVerification', function ($q) {
                $q->where('status', 'success');
            })
            ->get();

        foreach ($gifters as $user) {
            UserVerificationStatus::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'role' => 0,
                    'bio_status' => !empty($user->bio) ? 1 : 0,
                    'social_status' => 0,
                    'address_status' => 0,
                    'user_profile_status' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        return "User verification entries seeded successfully.";
    }

    /**
     * Delete all products for users with at least one product
     *
     * @return JsonResponse
     */
    public function deleteAllProducts()
    {
        $users = User::whereIn('id', [1, 4, 11, 26, 32, 33, 34, 35, 36, 37, 44, 45])
            ->where([
                ['is_uk', '=', 0],
                ['suspended_account', '=', 0],
            ])
            ->whereNull('deleted_at')
            ->get();


        $productsGroupedByUser = [];

        foreach ($users as $user) {
            $productIds = [];

            $productIds = array_merge(
                $productIds,
                Bills::whereNull('deleted_at')->where('user_id', $user->id)->pluck('product_id')->filter()->unique()->toArray(),
                WishItem::whereNull('deleted_at')->where('user_id', $user->id)->pluck('stripe_product_id')->filter()->unique()->toArray(),
                Membership::whereNull('deleted_at')->where('user_id', $user->id)->pluck('product_id')->filter()->unique()->toArray(),
                Shop::whereNull('deleted_at')->where('user_id', $user->id)->pluck('stripe_product_id')->filter()->unique()->toArray()
            );

            $uniqueProductIds = array_unique($productIds);

            if (count($uniqueProductIds) === 0) {
                continue;
            }

            $productsGroupedByUser[$user->id] = $uniqueProductIds;

            // Dispatch job for the user with all products
            DeleteStripeProductJob::dispatch($user->id, $productIds);
            UserCart::truncate();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Jobs dispatched for deleting products and notifying users.',
            'products_grouped_by_user' => $productsGroupedByUser,
        ]);
    }

    public function handle(Request $request)
    {
        $endpoint_secret = 'whsec_xRYw7XUOjpI2icZQ7c8YwG3y4NtiXOMG';
        $payload = @file_get_contents('php://input');
        $sig_header = $request->header('Stripe-Signature');
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

        if (!$event || !isset($event->type)) {
            Log::warning('Stripe webhook: invalid payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $type = $event->type;
        $data = $event->data->object;

        $metadata = $event->data->object->metadata ?? null;

        switch ($type) {
            case 'customer.subscription.updated':
                $productType = $metadata->type ?? null;

                switch ($productType) {
                    case 'bill':
                        Log::info("Handling Bill Subscription Update");
                        $this->handleBillSubscriptionUpdate($data, $metadata);
                        break;

                    case 'membership':
                        Log::info("Handling Membership Subscription Update");
                        $this->handleMembershipSubscriptionUpdate($data, $metadata);
                        break;

                    case 'wish':
                        Log::info("Handling Wish Subscription Update");
                        $this->handleWishSubscriptionUpdate($data, $metadata);
                        break;

                    default:
                        Log::warning("Unknown product type in metadata: " . json_encode($metadata));
                        break;
                }
                break;

            case 'customer.subscription.deleted':
                $this->customerSubscriptionDeleted($data);
                Log::info("Subscription canceled: " . $data->id);
                break;

            case 'customer.subscription.trial_will_end':
                $subscriptionId = data_get($event, 'data.object.id');
                $customerEmail = data_get($event, 'data.object.customer_email');
                $customerName = data_get($event, 'data.object.customer_name');
                $invoicePdf = data_get($event, 'data.object.invoice_pdf');

                $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->first();

                $array = [
                    'email' => $customerEmail,
                    'name' => $customerName,
                    'invoice_pdf' => $invoicePdf,
                    'uuid' => $subs->uuid,
                    'notification' => $subs->user->notification_send ?? 0,
                ];

                SendRenewMail::dispatch($array, 'trial_ending', 'site');
                Log::info("Trial will end soon for subscription: " . $data->id);
                break;
            // $this->customerSubscriptionTrialWillEnd($data);
            default:
                Log::info("Unhandled event type: " . $type);
        }

        return response()->json(['status' => 'success']);
    }

    public function handleBillSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        $status = $data->status;
        $currentPeriodEnd = Carbon::createFromTimestamp($data->current_period_end);

        $user = User::find($metadata->creator_id ?? 0);

        $subs = BillPayment::where('stripe_id', $subscriptionId)->where('user_id', $metadata->user_id)->latest()->first();

        $ret = StripeControl::getSubscription($subscriptionId, $user->account_id);

        $array = [
            'email' => $data->customer_email,
            'name' => $data->customer_name,
            'invoice_pdf' => $data->invoice_pdf,
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

        Log::info("Bill subscription updated: {$subscriptionId}, Status: {$status}");
    }

    public function handleMembershipSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        $status = $data->status;
        $currentPeriodEnd = Carbon::createFromTimestamp($data->current_period_end);

        $user = User::find($metadata->creator_id ?? 0);

        $subs = MembershipPayment::where('stripe_id', $subscriptionId)->where('user_id', $metadata->user_id)->latest()->first();

        if(!$subs) {
            Log::warning("No active membership subscription found for stripe_id: {$subscriptionId}");
            return response()->json([
                'status' => 'error',
                'message' => 'No active membership subscription found.'
            ], 404);
        }
        $ret = StripeControl::getSubscription($subscriptionId, $user->account_id);

        $array = [
            'email' => $subs->guest_email ?? $data->customer_email,
            'name' => $subs->guest_name ?? $data->customer_name,
            'invoice_pdf' => $data->invoice_pdf ?? null,
            'uuid' => $subs->uuid,
            'notification' => $subs->user->notification_send ?? 0
        ];

        Log::info(json_encode($array));
        Log::info("Handling membership subscription update for user: {$subs->user_id}, subscription ID: {$subscriptionId}");


        $subs->status = "ended";
        $subs->save();

        $newSubs = new MembershipPayment();
        $newSubs->stripe_id = $subs->stripe_id;
        $newSubs->session_id = $subs->session_id;
        $newSubs->membership_id = $subs->membership_id;
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

        SendRenewMail::dispatch($array, 'renew', 'membership');

        Log::info("Membership subscription updated: {$subscriptionId}, Status: {$status}");
    }

    public function handleWishSubscriptionUpdate($data, $metadata)
    {
        $subscriptionId = $data->id;
        // $status = $data->status;
        $currentPeriodEnd = Carbon::createFromTimestamp($data->current_period_end);

        $subs = StripePaymentDetail::where('user_id', $metadata->user_id)->whereIn('payment_status', ['paid', 'pending'])->latest()->first();
        $wish_subscription = WishItemSubscription::where('stripe_id', $subscriptionId)->where('status', 'paid')->latest()->first();
        if (!$wish_subscription) {
            Log::warning("No active wish subscription found for stripe_id: {$subscriptionId}");
            return response()->json([
                'status' => 'error',
                'message' => 'No active wish subscription found.'
            ], 404);
        }

        $ret = StripeControl::getSubscription($data->id, $subs->owner->account_id);

        $array = [
            'email' => $data->customer_email,
            'name' => $data->customer_name,
            'invoice_pdf' => $data->invoice_pdf,
            'uuid' => $subs->uuid,
            'notification' => $subs->user->notification_send ?? 0
        ];

        $wish_subscription->status = "ended";
        $wish_subscription->save();

        $newSubs = new WishItemSubscription();
        $newSubs->stripe_id = $wish_subscription->stripe_id;
        $newSubs->session_id = $wish_subscription->session_id;
        $newSubs->wish_item_id = $wish_subscription->wish_item_id;
        $newSubs->user_id = $wish_subscription->user_id;
        $newSubs->guest_name = $wish_subscription->guest_name;
        $newSubs->guest_email = $wish_subscription->guest_email;
        $newSubs->currency = $wish_subscription->currency;
        $newSubs->amount = $wish_subscription->amount;
        $newSubs->tax = $wish_subscription->tax;
        $newSubs->recurring_for = $wish_subscription->recurring_for;
        $newSubs->recurring_type = $wish_subscription->recurring_type;
        $newSubs->payment_method = 'stripe';
        $newSubs->surprise_message = $wish_subscription->surprise_message;
        $newSubs->anonymous = $wish_subscription->anonymous;
        $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
        $newSubs->status = "paid";
        $newSubs->created_at = $wish_subscription->created_at;
        $newSubs->updated_at = Carbon::now();
        $newSubs->save();

        SendRenewMail::dispatch($array, 'renew', 'main');
    }

    public function customerSubscriptionDeleted($data)
    {
        $subscriptionId = $data->id;

        // Delete the subscription from your database
        // Example: Subscription::where('stripe_id', $subscriptionId)->delete();

        Log::info("Subscription deleted: {$subscriptionId}");
    }

    public function customerSubscriptionTrialWillEnd($data)
    {
        $subscriptionId = $data->id;
        $currentPeriodEnd = Carbon::createFromTimestamp($data->current_period_end);



        // Notify the user about the trial ending
        // Example: Notification::send(User::find($data->customer), new TrialEndingNotification($subscriptionId, $currentPeriodEnd));

        Log::info("Trial will end soon for subscription: {$subscriptionId}, Current Period End: {$currentPeriodEnd}");
    }
}
