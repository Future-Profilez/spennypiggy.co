<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutUser;
use App\Jobs\NotificationSave;
use App\Jobs\ShopBuyed;
use App\Jobs\ShopBuyedUser;
use App\Models\Currency;
use App\Models\Logs;
use App\Models\MembershipPayment;
use App\Models\Shop;
use App\Models\ShopCategory;
use App\Models\ShopPayment;
use App\Models\User;
use App\Models\UserShopCategories;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\StripeClient;

use function Termwind\render;

class ShopsController extends Controller
{

    public function addShopItems(Request $request){
        $request->validate(
            [
                "type" => [
                    'required'
                ],
                "name" => [
                    "required",
                    "string",
                ],
                "description" => [
                    "required",
                ],
                "price" => [
                    "required",
                    'numeric'
                ],
                'image' => [
                    'required',
                    'string'
                ],
                'success_page_type' => [
                    'required'
                ],
                "success_page_value" => [
                    "required",
                    "string"
                ],
                "ask_question" => [
                    "nullable",
                    "string",
                ],
                "slot_limitation" => [
                    "nullable",
                    'numeric'
                ],
                "special_member_price" => [
                    "sometimes",
                    "nullable",
                    'numeric'
                ],
                "quantity_allow" => [
                    "required",
                    "numeric",
                    Rule::in([0, 1])
                ],
                "category" => [
                    "sometimes",
                    "nullable"
                ]
            ]
        );

        $user = User::find(Auth::id());

        if (Helpers::checkBlockData($request) == 1) {
            return response()->json([
                'status' => false,
                'msg' => "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,
                😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦"
            ]);
        }

        $file = [];
        if(!empty($request->reward_file)){
            $file = $request->reward_file;
            // $file = json_decode($request->reward_file);
        }

        $shop = Shop::create([
            "user_id" => $user->id,
            'type' => $request->type,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'currency' => $user->default_currency,
            'image' => $request->image ?? null,
            'success_page_type' => $request->success_page_type,
            'success_page_value' => $request->success_page_value ?? null,
            'reward_file_type' => !empty($file) ? $file['contentInfo']['mime']['type'] : null,
            'reward_file' => !empty($file) ? $file['uuid'] : null,
            'ask_question' => $request->ask_question ?? null,
            'slot_limitation' => $request->slot_limitation ?? null,
            'special_member_price' => $request->special_member_price ?? null,
            'quantity_allow' => $request->quantity_allow ?? null,
        ]);

        $shop->refresh();

        if (!empty($request->category)) {
            $categories = json_decode($request->category);
            $cat = UserShopCategories::whereIn('uuid',$categories)->get();
            foreach ($cat as $key => $value) {
                $shop_cat = new ShopCategory();
                $shop_cat->uuid = Uuid::uuid4();
                $shop_cat->shop_id = $shop->id;
                $shop_cat->user_shop_categories_id = $value->id;
                $shop_cat->save();
            }
        }

        $taxamount = round(($request->price * env('shop_tax',20) / 100), 2, PHP_ROUND_HALF_UP);
        $createpriceid = $request->price + $taxamount;

        $slug = strtolower(str_replace(" ","-",$shop->name));
        $productPayload = [
            "name"  =>  $shop->name,
            "images" => [$shop->perma_link],
            "default_price_data"    =>  [
                "currency"  =>  $user->default_currency,
                "unit_amount_decimal"   => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100,
            ],
            "url"   => env('APP_URL') . "/shop/$slug/$shop->uuid"
        ];

        try {
            $product = StripeControl::createProduct($productPayload);
            $shop->stripe_product_id = $product->id;
            $shop->price_id = $product->default_price;
            $shop->save();

            return response()->json([
                'status' => true,
                'msg' => "Shop Item has been added, your upload will be approved shortly."
            ]);

        } catch (Exception $e) {
            $shop->delete();
            return response()->json([
                'status' => false,
                'msg' => "Stripe Error: " . $e->getMessage()
            ]);
            // return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
        }
    }


    public function updateShopItems(Request $request,$uuid){
        $user = User::find(Auth::id());

        $shop = Shop::where('uuid',$uuid)->first();

        $old_price = $shop->price;

        if (Helpers::checkBlockData($request) == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        }

        $file = [];
        if(!empty($request->reward_file)){
            $file = $request->reward_file;
            // $file = json_decode($request->reward_file);
        }

        if(!empty($shop)){
            Shop::where('uuid',$uuid)->update([
                'type' => $request->type,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price ?? 0,
                'currency' => $user->default_currency,
                'image' => !empty($request->image) ? $request->image : $shop->image,
                'success_page_type' => $request->success_page_type,
                'success_page_value' => $request->success_page_value ?? null,
                'reward_file_type' => !empty($file) ? $file['contentInfo']['mime']['type'] : $shop->reward_file_type,
                'reward_file' => !empty($file) ? $file['uuid'] : $shop->reward_file,
                'ask_question' => $request->ask_question ?? null,
                'slot_limitation' => $request->slot_limitation ?? null,
                'special_member_price' => $request->special_member_price ?? null,
                'quantity_allow' => $request->quantity_allow ?? 0,
            ]);

            $shop->refresh();

            if (!empty($request->category)) {
                ShopCategory::where('shop_id',$shop->id)->delete();

                $categories = json_decode($request->category);
                $cat = UserShopCategories::whereIn('uuid',$categories)->get();
                foreach ($cat as $key => $value) {
                    $shop_cat = new ShopCategory();
                    $shop_cat->uuid = Uuid::uuid4();
                    $shop_cat->shop_id = $shop->id;
                    $shop_cat->user_shop_categories_id = $value->id;
                    $shop_cat->save();
                }
            }

            $taxamount = round(($request->price * env('shop_tax',20) / 100), 2, PHP_ROUND_HALF_UP);
            $createpriceid = $request->price + $taxamount;

            $slug = strtolower(str_replace(" ","_",$shop->name));
            $productPayload = [
                "name"  =>  $shop->name,
                "images" => [$shop->perma_link],
                "default_price_data"    =>  [
                    "currency"  =>  $user->default_currency,
                    "unit_amount_decimal"   => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100,
                ],
                "url"   => env('APP_URL') . "/shop/$slug/$shop->uuid"
            ];

            try {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

                if($old_price == $shop->price){
                    $stripe_client = $stripe->products->update($shop->stripe_product_id,[
                        'name' => $request->name ?? $shop->name,
                        'images' => [$shop->perma_link],
                        "default_price" => $shop->price_id,
                        // "url" => $request->item_url ?? null
                    ]);
                }else{
                    $stripe_client = StripeControl::createProduct($productPayload);
                    $shop->price_id = $stripe_client->default_price;
                }

                $shop->stripe_product_id = $stripe_client->id;
                $shop->approved = 0;
                $shop->save();

                $logs = Logs::where('edited_shop_id',$shop->id)->where('status','pending')->first();
                if(!empty($logs)){
                    $logs->status = 'updated';
                    $logs->save();
                }

                return response()->json([
                    'status' => true,
                    'msg' => "Shop Item has been updated, your upload will be approved shortly."
                ]);
                // return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Shop Item has been added, your upload will be approved shortly.");

            } catch (Exception $e) {
                $shop->delete();
                return response()->json([
                    'status' => false,
                    'msg' => "Stripe Error: " . $e->getMessage()
                ]);
                // return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
            }
        }
    }

    public function deleteShop($uuid){
        $shop = Shop::where('uuid',$uuid)->first();

        if(!$shop){
            return response()->json([
                'status' => false,
                'msg' => "Shop item not found."
            ]);
        }

        ShopCategory::where('shop_id', $shop->id)->delete();

        ShopPayment::where('shop_id', $shop->id)->get();

        $shop->delete();

        return response()->json([
            'status' => true,
            'msg' => "Shop item removed successfully."
        ]);
    }


    public function shopList($username){
        $user = User::where('username',$username)->first();

        $shops = [];
        if(!empty($user)){
            $query = Shop::where('user_id',$user->id)->orderBy('created_at','desc');

            if(Auth::check()){
                if(Auth::id() != $user->id){
                    $query->where('approved',1);
                }
            }else{
                $query->where('approved',1);
            }

            $shops = $query->get();
            // $shops = Shop::where('user_id',$user->id)->orderBy('created_at','desc')->get();

        }

        return response()->json([
            'status' => true,
            'shops' => $shops
        ]);
    }


    public function singleShopList($slug,$uuid,$session_id = null){

        $shop = Shop::where('uuid',$uuid)->with('user')->first();

        $opened = null;
        if(!empty($session_id)){
            $payments = ShopPayment::where('session_id',$session_id)->first();
            $opened = $payments->opened;
            $payments->opened = 1;
            $payments->save();
        }

        if(Auth::check()){
            $user = User::find(Auth::id());
            $member = MembershipPayment::where(function($que)use($user){
                $que->where('user_id',$user->id)->orWhere('guest_email',$user->email);
            })->whereHas('membership',function($q)use($shop){
                $q->where('user_id',$shop->user_id);
            })->where('status','paid')->where('upcoming_payment','>=',Carbon::now())->count();
            if($member >= 1){
                $shop->is_member = 1;
            }
            else{
                $shop->is_member = 0;
            }
        }else{
            $shop->is_member = 0;
        }


        return Inertia::render('shop/Item',[
            'shop' => $shop,
            'payment_id' => $session_id,
            'opened' => $opened
        ]);
    }


    public function saveUserShopCategory(Request $request)
    {
        $request->validate([
            "category" => [
                "required",
                "string",
                "min:3",
                "max:30",
                "alpha_dash"
            ],
        ]);

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return response()->json([
                'status' => false,
                'msg' => "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,
                😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦",
            ]);
        }

        $categories = UserShopCategories::where('user_id', Auth::id())->get();
        foreach ($categories as $key => $value) {
            if (strtolower($request->category) == strtolower($value->category)) {
                return response()->json([
                    'status' => false,
                    'msg' => "Category is already exists."
                ]);
            }
        }

        UserShopCategories::create([
            "user_id" => Auth::id(),
            'category' => $request->category ?? null,
        ]);

        return response()->json([
            'status' => true,
            'msg' => "Category Saved."
        ]);
    }


    public function buyShopItem($shop_id)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }

            $shop = Shop::where('uuid',$shop_id)->first();

            if(!empty($shop->slot_limitation)){
                $pay = ShopPayment::where('shop_id',$shop->id)->where('payment_status','paid')->count();

                if($pay >= $shop->slot_limitation){
                    return redirect()->back()->with("error", "Slots are full for this shop.");
                }
            }

            $amount = round(request()->query('amount'), 2, PHP_ROUND_HALF_UP);

            $tax = round(($amount * env('shop_tax',20) / 100), 2, PHP_ROUND_HALF_UP);

            $total = $amount + $tax;


            if(!Auth::check()){
                $logged_out_user = User::where('email', request()->query('email'))->first();
            }

            $shopPaymentDetail = ShopPayment::create([
                'amount' => $amount,
                'tax_amount' => $tax,
                'currency' => $shop->user->default_currency,
                'shop_id' => $shop->id,
                'user_id' => (Auth::check()) ? Auth::id() : (!empty($logged_out_user) ? $logged_out_user->id : null),
                'name' => request()->query('from') ?? null,
                'email' => request()->query('email'),
                'message' => $message ?? null,
                'anonymous' => request()->query('anonymous') ?? 0,
                'quantity' => request()->query('quantity'),
            ]);

            $shopPaymentDetail->refresh();

            if($shop->price > 0){

                $lineItems[] = [
                    // 'price' => $dd->stripe_product_id ?? '',
                    'quantity' => $shopPaymentDetail->quantity,
                    'price_data' => [
                        'currency' => $currency,
                        'product' => $shop->stripe_product_id,
                        'unit_amount_decimal' => Helpers::priceFormat($shop->user->default_currency, $total, $currency) * 100
                    ]
                ];

                $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

                $sessionCreate = $stripe->checkout->sessions->create([
                    'success_url' => route('shop.success-payment', [$shopPaymentDetail->uuid]),
                    'cancel_url' => route('shop.cancel-payment', [$shopPaymentDetail->uuid]),
                    'line_items' => $lineItems,
                    'mode' => 'payment',
                    'payment_intent_data' => [
                        'transfer_data' => [
                            'destination' => $shop->user->account_id, // Creator's connected account ID
                            'amount' => Helpers::priceFormat($shop->user->default_currency, $amount, $currency) * 100,
                        ],
                        // 'application_fee_amount' => $taxNew * 100,
                        'on_behalf_of'  => $shop->user->account_id,
                    ],
                    'customer_email' =>  request()->query('email'),
                    // 'currency' => 'usd',
                ]);

                $shopPaymentDetail->session_id =  $sessionCreate->id;
                $shopPaymentDetail->save();

                return response()->json([
                    'status' => true,
                    'url' => $sessionCreate->url
                ]);
            }

            $shopPaymentDetail->session_id = mt_rand(1000000000, 9999999999);
            $shopPaymentDetail->payment_status = 'paid';
            $shopPaymentDetail->save();

            if($shopPaymentDetail->anonymous == 1){
                $username = "Anonymous user";
            }
            else{
                $username = $shopPaymentDetail->name ?? "Anonymous user";
            }

            $message = $username . " just buyed your shop item " . $shopPaymentDetail->shop->name;
            NotificationSave::dispatch($message,$shop->user,$shopPaymentDetail->user,'Shop');

            $symbol = Currency::where('iso',strtoupper($shopPaymentDetail->currency))->first();

            $message = $shopPaymentDetail->message;
            if ($shopPaymentDetail->anonymous == 0) {
                ShopBuyed::dispatch($shopPaymentDetail, false,$symbol->symbol);
            } else {
                ShopBuyed::dispatch($shopPaymentDetail, true,$symbol->symbol);
            }

            $curr = Currency::where('iso',strtoupper($currency))->first();
            ShopBuyedUser::dispatch($shopPaymentDetail,$shop->reward_file_url,$curr->symbol);

            $slug = strtolower(str_replace(" ","-",$shop->name));

            return response()->json([
                'status' => true,
                'msg' => "Payment Successfull",
                'url' => route('single-shop-list', [$slug,$shop->uuid,$shopPaymentDetail->session_id])
            ]);
        } catch (\Throwable $th) {
            // Log::error("Error in createCheckout: " . $th->getMessage());
            throw $th;
        }
    }

    public function successPayment($id)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            $stripeid = ShopPayment::where('uuid', $id)->first();

            if($stripeid->anonymous == 1){
                $username = "Anonymous user";
            }
            else{
                $username = $stripeid->name ?? "Anonymous user";
            }

            $message = $username . " just buyed your shop item " . $stripeid->shop->name;
            NotificationSave::dispatch($message,$stripeid->shop->user,$stripeid->user,'Shop');

            ShopPayment::where('uuid', $id)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);

            $symbol = Currency::where('iso',strtoupper($stripeid->currency))->first();

            $message = $stripeid->message;
            if ($stripeid->anonymous == 0) {
                ShopBuyed::dispatch($stripeid, false,$symbol->symbol);
            } else {
                ShopBuyed::dispatch($stripeid, true,$symbol->symbol);
            }

            $curr = Currency::where('iso',strtoupper($currency))->first();
            ShopBuyedUser::dispatch($stripeid,$stripeid->shop->reward_file_url,$curr->symbol);

            $slug = strtolower(str_replace(" ","-",$stripeid->shop->name));

            return redirect(route('single-shop-list', [$slug,$stripeid->shop->uuid,$stripeid->session_id]))->with('success', 'Payment Successful.');
        } catch (Exception $e) {
            return redirect(route('user.show', [$stripeid->shop->user->username]))->with('error',$e->getMessage());
        }
    }

    public function cancelPayment($id)
    {
        $payment = ShopPayment::where('uuid', $id)->first();

        $payment->payment_status = "unpaid";
        $payment->save();
        return redirect(route('user.show', [$payment->shop->user->username]))->with('error', 'Payment Cancel.');
        // return view('cancel');
    }


    public function deactivateShop($uuid){
        $shop = Shop::where('uuid',$uuid)->first();
        if(!empty($shop)){
            if($shop->status == 1){
                $shop->status = 0;
                $shop->save();
                return redirect()->back()->with('success','Shop Deactivated successfully.');
            }
            else{
                $shop->status = 1;
                $shop->save();
                return redirect()->back()->with('success','Shop Activated successfully.');
            }
        }
        else{
            return redirect()->back()->with('error','Shop not found.');
        }
    }


    public function answerPayment(Request $request,$payment_id){
        $payment = ShopPayment::where('session_id',$payment_id)->first();

        $payment->answer = $request->answer;
        $payment->save();

        return response()->json([
            'status' => true,
            'msg' => "Answer saved successfully."
        ]);
    }


    public function ordersList(){
        $payments = ShopPayment::whereHas('shop',function($q){
            $q->where('user_id',Auth::id());
        })->with(['shop','shop.user'])->where('payment_status','paid')->latest()->get();

        $payments->map(function($q){
            $q->avatar_url = $q->user->avatar_url;
            $q->username = $q->user->username;
            return $q;
        });

        $total_claims = $payments->count();
        $all_time = $payments->sum('amount');
        $day30 = ShopPayment::whereHas('shop',function($q){
            $q->where('user_id',Auth::id());
        })->with(['shop','shop.user'])->where('payment_status','paid')->where('created_at','<=',Carbon::now())->where('created_at','>=',Carbon::now()->subDays(30))->sum('amount');

        return response()->json([
            'status' => true,
            'orders' => $payments,
            'total_claims' => $total_claims,
            'all_time' => $all_time,
            'thirtydays' => $day30
        ]);
    }
}
