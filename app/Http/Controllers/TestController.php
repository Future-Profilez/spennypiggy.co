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
use App\Models\Bills;
use App\Models\Membership;
use App\Models\Shop;
use App\Models\UserCart;
use App\Models\UserVerificationStatus;
use App\Models\WishItem;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Stripe\Stripe;

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
        Log::info("webhook run: " . json_encode($request->all()));
        // Example of handling a request
        $a = $request->all();
        return response()->json(['status' => 'done', 'message' => $a], 200);
    }

    // public function handleRyeProductPayment(Request $request)
    // {
    //     $orderDetails = RyeCart::with('creator')->where(['cart_id' => $request->cart_id, 'creator_id' => $request->creator_id])->first();
    //     if ($orderDetails) {
    //         $amount = $orderDetails->cart['stores'][0]['cartLines'][0]['variant']['price'] ?? 0;
    //         $currency = 'usd';
    //         if (isset($orderDetails->cart)) {

    //             $lineItems[] = [
    //                 // 'price' => $dd->stripe_product_id ?? '',
    //                 'quantity' => $orderDetails->cart['stores'][0]['cartLines'][0]['quantity'] ?? 1,
    //                 'price_data' => [
    //                     'currency' => 'usd',
    //                     'product' => $orderDetails->cart['stores'][0]['cartLines'][0]['variant']['id'] ?? '',
    //                     'unit_amount' => $orderDetails->cart['stores'][0]['cartLines'][0]['variant']['price'] ?? 0,
    //                 ]
    //             ];

    //             //     'price_data' => [
    //             //         'currency' => $currency,
    //             //         'product' => $shop->stripe_product_id,
    //             //         'unit_amount_decimal' => Helpers::priceFormat($shop->user->default_currency, $total, $currency) * 100
    //             //     ]
    //             // ];

    //             $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
    //             $sessionCreate = $stripe->checkout->sessions->create([
    //                 'success_url' => route('rye.success.payment', [$orderDetails->uuid]),
    //                 'cancel_url' => route('rye.cancel.payment', [$orderDetails->uuid]),
    //                 'line_items' => $lineItems,
    //                 'mode' => 'payment',
    //                 'payment_method_types' => ['card'], // Add this line
    //                 'payment_intent_data' => [
    //                     'transfer_data' => [
    //                         'destination' => $orderDetails->creator->account_id,
    //                         'amount' => Helpers::priceFormat($orderDetails->user->default_currency, $amount, $currency) * 100,
    //                     ],
    //                     'on_behalf_of'  => $orderDetails->creator->account_id,
    //                 ],
    //                 'customer_email' => request()->query('email'),
    //             ]);

    //             // $sessionCreate = $stripe->checkout->sessions->create([
    //             //     'success_url' => route('shop.success-payment', [$shopPaymentDetail->uuid]),
    //             //     'cancel_url' => route('shop.cancel-payment', [$shopPaymentDetail->uuid]),
    //             //     'line_items' => $lineItems,
    //             //     'mode' => 'payment',
    //             //     'payment_intent_data' => [
    //             //         'transfer_data' => [
    //             //             'destination' => $shop->user->account_id, // Creator's connected account ID
    //             //             'amount' => Helpers::priceFormat($shop->user->default_currency, $amount, $currency) * 100,
    //             //         ],
    //             //         // 'application_fee_amount' => $taxNew * 100,
    //             //         'on_behalf_of'  => $shop->user->account_id,
    //             //     ],
    //             //     'customer_email' =>  request()->query('email'),
    //             //     // 'currency' => 'usd',
    //             // ]);

    //             $orderDetails->session_id =  $sessionCreate->id;
    //             $orderDetails->save();

    //             return response()->json([
    //                 'status' => true,
    //                 'url' => $sessionCreate->url
    //             ]);
    //         }
    //     }
    // }




    // public function createCart(Request $request)
    // {
    //     try {
    //         $user_id = Auth::id();
    //         RyeCart::create([
    //             'user_id' => $user_id,
    //             'creator_id' => $request->creator_id,
    //             'cart_id' => $request->cart_id,
    //             'cart_details' => json_encode($request->data, true)
    //         ]);

    //         return response()->json(['status' => 'success', 'message' => 'Added To Cart']);
    //     } catch (Exception $e) {
    //         return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
    //     }
    // }
}
