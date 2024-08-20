<?php

namespace App\Http\Controllers;

use App\CurrencyExchange;
use App\IpTracker;
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
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;
use Stripe\Balance;
use Stripe\Stripe;

class TestController extends Controller
{

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
     * Test Tweetter OAuth1.1
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


    public function manualPayout()
    {
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

        $balance = Balance::retrieve();

        $zar_balance = 0;
        foreach ($balance->available as $available) {
            if ($available->currency == 'zar') {
                $zar_balance = $available->amount;
                break;
            }
        }

        return $zar_balance;

        if ($zar_balance > 0) {
            // Proceed with payout
        } else {
            // Handle the case where there are no funds available in ZAR
        }
    }
}
