<?php

namespace App\Http\Controllers;

use App\CurrencyExchange;
use App\Mail\Welcome;
use App\Models\Currency;
use App\Models\User;
use App\StripeControl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class TestController extends Controller
{

    /**
     * Search Stripe Customer
     *
     * @return mixed
     */
    public function stripeSearch(){
        $query = "email:'pradeep@fpdemo.com'";
        $search = StripeControl::searchCustomer($query);
        return response()->json($search);
    }

    public function testEmail(){
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
        $resp = CurrencyExchange::getRates($c);
        // $resp = Storage::disk('public')->get('currencies.json');
        // $currs = json_decode($resp, true);
        // foreach($currs as $iso => $c) {
        //     Currency::firstOrCreate([
        //         'ISO'           => $iso,
        //         'name'          => $c['name'],
        //         'demonym'       => $c['demonym'],
        //         'majorSingle'   => $c['majorSingle'],
        //         'majorPlural'   => $c['majorPlural'],
        //         'ISOnum'        => $c['ISOnum'],
        //         'symbol'        => $c['symbol'],
        //         'symbolNative' => $c['symbolNative'],
        //         'minorSingle'   => $c['minorSingle'],
        //         'minorPlural'   => $c['minorPlural'],
        //         'ISOdigits'     => $c['ISOdigits'] ?? 2,
        //         'numToBasic'    => $c['numToBasic'] ?? 100,
        //     ]);
        // }
        if($resp["success"] && !empty($resp['data']['conversion_rates']))
        {
            foreach($resp['data']['conversion_rates'] as $iso => $rate) {
                Currency::where('ISO', $iso)->update(['conversion_rate' => number_format($rate, 4)]);
            }
        }
        $all = Currency::all();
        return response()->json($all);
    }
}
