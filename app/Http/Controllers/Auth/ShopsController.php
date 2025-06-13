<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutUser;
use App\Jobs\NotificationSave;
use App\Jobs\ShopBuyed;
use App\Jobs\ShopBuyedUser;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\Logs;
use App\Models\MembershipPayment;
use App\Models\Shop;
use App\Models\ShopCategory;
use App\Models\ShopPayment;
use App\Models\ShopShippingInfo;
use App\Models\ShopVarients;
use App\Models\User;
use App\Models\UserPayment;
use App\Models\UserShopCategories;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\StripeClient;

use function Termwind\render;

class ShopsController extends Controller
{

    public function addShopItems(Request $request)
    {
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
                    "sometimes",
                    'numeric'
                ],
                'image' => [
                    'required',
                    'string'
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
                ],
                "vat_applicable" => [
                    'required'
                ]
            ]
        );

        if ($request->type == "physical") {
            $request->validate(
                [
                    "shipping" => [
                        "required",
                    ],
                    'shipping_info' => [
                        'sometimes',
                        'nullable',
                        'string'
                    ],
                    "varients" => [
                        'sometimes',
                        'nullable'
                    ]
                ]
            );
        }

        $user = User::find(Auth::id());

        if (Helpers::checkBlockData($request) == 1) {
            return response()->json([
                'status' => false,
                'msg' => "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress, 😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦"
            ]);
        }

        $file = [];
        if (!empty($request->reward_file)) {
            $file = $request->reward_file;
            // $file = json_decode($request->reward_file);
        }

        if ($request->type != 'physical') {
            $shop = Shop::create([
                "user_id" => $user->id,
                'type' => $request->type,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'currency' => $user->default_currency,
                'image' => $request->image ?? null,
                'success_page_type' => !empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                'success_page_value' => !empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                'reward_file_type' => !empty($file['contentInfo']['mime']['type']) ? $file['contentInfo']['mime']['type'] : (!empty($request->reward_file) ? "image" : null),
                'reward_file' => !empty($file['uuid']) ? $file['uuid'] : (!empty($request->reward_file) ? $request->reward_file : null),
                "ai_generated" => $request->ai_generated,
                'ask_question' => $request->ask_question ?? null,
                'slot_limitation' => $request->slot_limitation ?? null,
                'special_member_price' => $request->special_member_price ?? null,
                'quantity_allow' => $request->quantity_allow ?? null,
                'vat_applicable' => $request->vat_applicable
            ]);
        } else {
            $shop = Shop::create([
                "user_id" => $user->id,
                'type' => $request->type,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'currency' => $user->default_currency,
                'image' => $request->image ?? null,
                'success_page_type' => !empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                'success_page_value' => !empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                'reward_file_type' => !empty($file['contentInfo']['mime']['type']) ? $file['contentInfo']['mime']['type'] : (!empty($request->reward_file) ? "image" : null),
                'reward_file' => !empty($file['uuid']) ? $file['uuid'] : (!empty($request->reward_file) ? $request->reward_file : null),
                'ask_question' => $request->ask_question ?? null,
                'slot_limitation' => $request->slot_limitation ?? null,
                'special_member_price' => $request->special_member_price ?? null,
                'quantity_allow' => $request->quantity_allow ?? null,
                'vat_applicable' => $request->vat_applicable,
                'shipping_information' => $request->shipping_info ?? null
            ]);

            $shipping = json_decode($request->shipping);

            foreach ($shipping as $key => $value) {
                $ship = new ShopShippingInfo();
                $ship->uuid = Uuid::uuid4();
                $ship->shop_id = $shop->id;
                $ship->country = $value->country;
                $ship->shipping_price = $value->price;
                $ship->save();
            }

            if (!empty($request->varients)) {
                $varients = json_decode($request->varients);
                foreach ($varients as $key => $value) {
                    $var = new ShopVarients();
                    $var->uuid = Uuid::uuid4();
                    $var->shop_id = $shop->id;
                    $var->name = $value->name;
                    $var->price = $value->value;
                    $var->save();
                }
            }
        }

        $shop->refresh();

        if (!empty($request->category)) {
            $categories = json_decode($request->category);
            $cat = UserShopCategories::whereIn('uuid', $categories)->get();
            foreach ($cat as $key => $value) {
                $shop_cat = new ShopCategory();
                $shop_cat->uuid = Uuid::uuid4();
                $shop_cat->shop_id = $shop->id;
                $shop_cat->user_shop_categories_id = $value->id;
                $shop_cat->save();
            }
        }

        $taxamount = round(($request->price * config('app.shop_tax') / 100), 2, PHP_ROUND_HALF_UP);

        $createpriceid = $request->price + $taxamount;

        $slug = strtolower(str_replace(" ", "-", $shop->name));
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
            $product = StripeControl::createProduct($productPayload, $user->account_id);
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

    public function updateShopItems(Request $request, $uuid)
    {
        $user = User::find(Auth::id());

        $shop = Shop::where('uuid', $uuid)->first();

        $old_price = $shop->price;

        if (Helpers::checkBlockData($request) == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        }

        $file = [];
        if (!empty($request->reward_file)) {
            $file = $request->reward_file;
            // $file = json_decode($request->reward_file);
        }

        if (!empty($shop)) {

            if ($request->type != 'physical') {
                Shop::where('uuid', $uuid)->update([
                    'type' => $request->type,
                    'name' => $request->name,
                    'description' => $request->description,
                    'price' => $request->price,
                    'currency' => $user->default_currency,
                    'image' => !empty($request->image) ? $request->image : $shop->image,
                    'success_page_type' => !empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                    'success_page_value' => !empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                    'reward_file_type' => !empty($file['contentInfo']['mime']['type']) ? $file['contentInfo']['mime']['type'] : (!empty($request->reward_file) ? "image" : $shop->reward_file_type),
                    'reward_file' => !empty($file['uuid']) ? $file['uuid'] : (!empty($request->reward_file) ? $request->reward_file : $shop->reward_file),
                    "ai_generated" => $request->ai_generated ?? $shop->ai_generated,
                    'ask_question' => $request->ask_question ?? null,
                    'slot_limitation' => $request->slot_limitation ?? null,
                    'special_member_price' => $request->special_member_price ?? null,
                    'quantity_allow' => $request->quantity_allow ?? 0,
                ]);
            } else {
                Shop::where('uuid', $uuid)->update([
                    "user_id" => $user->id,
                    'type' => $request->type,
                    'name' => $request->name,
                    'description' => $request->description,
                    'price' => $request->price,
                    'currency' => $user->default_currency,
                    'image' => $request->image ?? null,
                    'success_page_type' => !empty($request->success_page_type) || $request->success_page_type != 0 ? $request->success_page_type : null,
                    'success_page_value' => !empty($request->success_page_value) || $request->success_page_value != 0 ? $request->success_page_value : null,
                    'reward_file_type' => !empty($file['contentInfo']['mime']['type']) ? $file['contentInfo']['mime']['type'] : (!empty($request->reward_file) ? "image" : $shop->reward_file_type),
                    'reward_file' => !empty($file['uuid']) ? $file['uuid'] : (!empty($request->reward_file) ? $request->reward_file : $shop->reward_file),
                    "ai_generated" => $request->ai_generated ?? $shop->ai_generated,
                    'ask_question' => $request->ask_question ?? null,
                    'slot_limitation' => $request->slot_limitation ?? null,
                    'special_member_price' => $request->special_member_price ?? null,
                    'quantity_allow' => $request->quantity_allow ?? null,
                    'vat_applicable' => $request->vat_applicable,
                    'shipping_information' => $request->shipping_info ?? null
                ]);

                $shipping = json_decode($request->shipping);
                ShopShippingInfo::where('shop_id', $shop->id)->delete();
                foreach ($shipping as $key => $value) {
                    $ship = new ShopShippingInfo();
                    $ship->uuid = Uuid::uuid4();
                    $ship->shop_id = $shop->id;
                    $ship->country = $value->country;
                    $ship->shipping_price = $value->price;
                    $ship->save();
                }

                if (!empty($request->varients)) {
                    $varients = json_decode($request->varients);
                    ShopVarients::where('shop_id', $shop->id)->delete();
                    foreach ($varients as $key => $value) {
                        $var = new ShopVarients();
                        $var->uuid = Uuid::uuid4();
                        $var->shop_id = $shop->id;
                        $var->name = $value->name;
                        $var->price = $value->value;
                        $var->save();
                    }
                }
            }

            $shop->refresh();

            if (!empty($request->category)) {
                ShopCategory::where('shop_id', $shop->id)->delete();

                $categories = json_decode($request->category);
                $cat = UserShopCategories::whereIn('uuid', $categories)->get();
                foreach ($cat as $key => $value) {
                    $shop_cat = new ShopCategory();
                    $shop_cat->uuid = Uuid::uuid4();
                    $shop_cat->shop_id = $shop->id;
                    $shop_cat->user_shop_categories_id = $value->id;
                    $shop_cat->save();
                }
            }

            $taxamount = round(($request->price * config('app.shop_tax', 20) / 100), 2, PHP_ROUND_HALF_UP);
            $createpriceid = $request->price + $taxamount;

            $slug = strtolower(str_replace(" ", "_", $shop->name));
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

                if ($shop->type != 'physical') {
                    if ($old_price == $shop->price) {
                        $stripe_client = $stripe->products->update($shop->stripe_product_id, [
                            'name' => $request->name ?? $shop->name,
                            'images' => [$shop->perma_link],
                            "default_price" => $shop->price_id,
                            // "url" => $request->item_url ?? null
                        ], [
                            'stripe_account' => $user->account_id,
                        ]);
                    } else {
                        $stripe_client = StripeControl::createProduct($productPayload);
                        $shop->price_id = $stripe_client->default_price;
                    }
                    $shop->stripe_product_id = $stripe_client->id;
                    $shop->approved = 0;
                    $shop->save();
                }


                $logs = Logs::where('edited_shop_id', $shop->id)->where('status', 'pending')->first();
                if (!empty($logs)) {
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

    public function deleteShop($uuid)
    {
        $shop = Shop::where('uuid', $uuid)->first();

        if (!$shop) {
            return response()->json([
                'status' => false,
                'msg' => "Shop item not found."
            ]);
        }

        ShopCategory::where('shop_id', $shop->id)->delete();

        ShopShippingInfo::where('shop_id', $shop->id)->delete();

        ShopVarients::where('shop_id', $shop->id)->delete();

        ShopPayment::where('shop_id', $shop->id)->get();

        $shop->delete();

        return response()->json([
            'status' => true,
            'msg' => "Shop item removed successfully."
        ]);
    }



    public function singleShopList($slug, $uuid, $session_id = null)
    {
        $shop = Shop::where('uuid', $uuid)->with(['user', 'shop_varients'])->first();

        $opened = null;
        if (!empty($session_id)) {
            $payments = ShopPayment::where('session_id', $session_id)->first();
            $opened = $payments->opened;
            $payments->opened = 1;
            $payments->save();
        }

        if (Auth::check()) {
            $user = User::find(Auth::id());
            $member = MembershipPayment::where(function ($que) use ($user) {
                $que->where('user_id', $user->id)->orWhere('guest_email', $user->email);
            })->whereHas('membership', function ($q) use ($shop) {
                $q->where('user_id', $shop->user_id);
            })->where('status', 'paid')->where('upcoming_payment', '>=', Carbon::now())->count();
            if ($member >= 1) {
                $shop->is_member = 1;
            } else {
                $shop->is_member = 0;
            }
        } else {
            $shop->is_member = 0;
        }

        if ($shop->is_member == 1 && !empty($shop->special_member_price)) {
            $amount = round($shop->special_member_price, 2, PHP_ROUND_HALF_UP);
        } else {
            $amount = round($shop->price, 2, PHP_ROUND_HALF_UP);
        }

        $tax = round(($amount * config('app.shop_tax', 20) / 100), 2, PHP_ROUND_HALF_UP);

        $vat_percentage_amount = 0;
        if ($shop->vat_applicable == 1) {
            $vat_percentage_amount = ($amount + $tax) * $shop->user->vat_amount_percentage / 100;
        }

        return Inertia::render('shop/Item', [
            'shop' => $shop,
            'payment_id' => $session_id,
            'opened' => $opened,
            'vat_percent' => $vat_percentage_amount,
        ]);
    }

    public function shippingPrice($shop_id)
    {
        $shop = Shop::where('uuid', $shop_id)->first();
        $shipping_price = 0;
        if ($shop->type == 'physical') {
            $country = request()->query('country');
            if (!empty($country)) {
                $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', $country)->first();
            }
            if (empty($shipping) || empty($country)) {
                $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', 'all')->first();
            }
            $shipping_price = !empty($shipping) ? $shipping->shipping_price : 0;
        }

        return response()->json([
            'status' => true,
            'shipping_price' => $shipping_price
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
                'msg' => "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
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

    public function buyShopItem(Request $request, $shop_id, $varient_id)
    {
        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus == true) {
            return response()->json([
                'status' => false,
                'message' => "⚠️ Please complete your card verification payment and wait for admin approval before making further payments."
            ]);
        }

        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }

            $shop = Shop::where('uuid', $shop_id)->first();

            $shipping_price = 0;

            if ($shop->type == 'physical') {
                $request->validate([
                    "shipping_info" => [
                        "required",
                    ],
                ]);

                $shipping_info = $request->shipping_info;
                $country = $request->query('country');
                if (!empty($country)) {
                    $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', $country)->first();
                }
                if (empty($shipping) || empty($country)) {
                    $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', 'all')->first();
                }
                $shipping_price = !empty($shipping) ? $shipping->shipping_price : 0;
            }

            if (!empty($shop->slot_limitation)) {
                $pay = ShopPayment::where('shop_id', $shop->id)->where('payment_status', 'paid')->count();

                if ($pay >= $shop->slot_limitation) {
                    return redirect()->back()->with("error", "Slots are full for this shop.");
                }
            }

            $vat_percentage_amount = 0;

            if ($varient_id != "no_varient") {
                $var = ShopVarients::where('id', $varient_id)->first();
                $amount = round($var->price, 2, PHP_ROUND_HALF_UP);
            } else {
                $amount = round(request()->query('amount'), 2, PHP_ROUND_HALF_UP);
            }

            $tax = $amount * config('app.shop_tax') / 100;

            $total = $amount + $tax;

            if ($shop->vat_applicable == 1 && !empty($shop->user->vat_amount_percentage)) {
                $vat_percentage_amount = $total * $shop->user->vat_amount_percentage / 100;
            }

            $adminFee = config('app.administration_fee');
            $ConvertedStoreAdminFees = Helpers::priceFormat($currency, $adminFee, $shop->currency);
            $ConvertedAdminFees = Helpers::priceFormat('GBP', $adminFee, $currency);
            $ConvertedTaxAmount = Helpers::priceFormat($shop->currency, $tax, $currency);
            $ConvertedAmount = Helpers::priceFormat($shop->currency, $amount, $currency);

            $convertedStoreTaxAmount = $ConvertedStoreAdminFees + $tax;
            $ConvertedTotalTaxAmount = $ConvertedAdminFees + $ConvertedTaxAmount;
            $totalAmount = $ConvertedAmount + $vat_percentage_amount + $ConvertedTotalTaxAmount;

            if (!Auth::check()) {
                $logged_out_user = User::where('email', request()->query('email'))->where('is_uk', 0)->first();
            }

            $shopPaymentDetail = ShopPayment::create([
                'amount' => $amount,
                'tax_amount' => $convertedStoreTaxAmount,
                'vat_tax_amount' => $vat_percentage_amount,
                'currency' => $shop->user->default_currency,
                'shop_id' => $shop->id,
                'user_id' => (Auth::check()) ? Auth::id() : (!empty($logged_out_user) ? $logged_out_user->id : null),
                'varient_id' => $varient_id != "no_varient" ? $varient_id : null,
                'name' => request()->query('from') ?? null,
                'email' => request()->query('email'),
                'message' => $message ?? null,
                'anonymous' => request()->query('anonymous') ?? 0,
                'quantity' => request()->query('quantity'),
                'shipping_info' => $shipping_info ?? null
            ]);

            $shopPaymentDetail->refresh();

            // $total += $vat_percentage_amount;
            // $total += $ConvertedAdminFees;
            // $total += $shipping_price;

            // $ConvertedTotalAmount = Helpers::priceFormat($shop->currency, $total, $currency);

            $sessionCreate = null;
            if ($shop->price > 0) {

                $connectedAccountId = $shop->user->account_id;

                // Step 1: Check if customer already exists in connected account
                $storeCustomer = ConnectedAccountCustomer::where('user_id', Auth::id())
                    ->where('creator_id', $shop->user->id)
                    ->where('connected_account_id', $connectedAccountId)
                    ->where('product_type', 'shop item')
                    ->where('currency', $currency)
                    ->first();

                // Step 2: Check if price already exists
                $existingPriceEntry = ConnectedAccountCustomer::where('user_id', Auth::id())
                    ->where('creator_id', $shop->user->id)
                    ->where('connected_account_id', $connectedAccountId)
                    ->where('product_id', $shop->stripe_product_id)
                    ->where('product_type', 'shop item')
                    ->where('currency', $currency)
                    ->whereNotNull('price_id')
                    ->first();

                // Step 3: Create customer in connected account if not exists
                $customer = null;
                if (!$storeCustomer) {
                    $customer = StripeControl::createCustomer([
                        'email' => $shop->user->email,
                        'name' => $shop->user->name,
                    ], $connectedAccountId);
                }

                $customer_id = $storeCustomer->stripe_customer_id ?? $customer->id;

                // Step 4: Create price if not exists
                if ($existingPriceEntry) {
                    $priceId = $existingPriceEntry->price_id;
                } else {
                    $pricePayload = [
                        'unit_amount' => round($totalAmount * 100, 2),
                        'currency' => $currency,
                        'product' => $shop->stripe_product_id,
                    ];

                    // Create the price in the connected account
                    $price = StripeControl::createPrice($pricePayload, $connectedAccountId);

                    if (empty($price->id)) {
                        throw new Exception("Failed to create Stripe price.");
                    }

                    $priceId = $price->id;
                }

                // Step 5: Store customer & price if not already stored
                if (!$storeCustomer) {
                    ConnectedAccountCustomer::create([
                        'user_id' => Auth::id(),
                        'creator_id' => $shop->user->id,
                        'connected_account_id' => $connectedAccountId,
                        'stripe_customer_id' => $customer_id,
                        'product_type' => 'shop item',
                        'product_id' => $shop->stripe_product_id,
                        'price_id' => $priceId,
                        'currency' => $currency,
                    ]);
                }

                // Step 6: Build line item
                $items = [
                    'price' => $priceId,  // Use the existing price ID
                    'quantity' => 1,
                ];

                // Step 7: Build session payload
                $payload = [
                    'success_url' => route('shop.success-payment', [$shopPaymentDetail->uuid]),
                    'cancel_url' => route('shop.cancel-payment', [$shopPaymentDetail->uuid]),
                    'line_items' => [$items],
                    'mode' => 'payment',
                    'payment_method_types' => ['card'], // Add this line
                    "customer" => $customer_id,
                    'payment_intent_data' => [
                        'application_fee_amount' => (int) round($ConvertedTotalTaxAmount * 100),
                        'description' => "Shop Payment for {$shop->user->username}",
                    ],
                ];

                $sessionCreate = StripeControl::createCheckoutSession($payload, $connectedAccountId);

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

            if ($shopPaymentDetail->anonymous == 1) {
                $username = "Anonymous user";
            } else {
                $username = $shopPaymentDetail->name ?? "Anonymous user";
            }

            $message = $username . " just purchased your shop item " . $shopPaymentDetail->shop->name;
            NotificationSave::dispatch($message, $shop->user, $shopPaymentDetail->user, 'Shop');

            $symbol = Currency::where('iso', strtoupper($shopPaymentDetail->currency))->first();

            $message = $shopPaymentDetail->message;
            if ($shopPaymentDetail->anonymous == 0) {
                ShopBuyed::dispatch($shopPaymentDetail, false, $symbol->symbol);
            } else {
                ShopBuyed::dispatch($shopPaymentDetail, true, $symbol->symbol);
            }

            $curr = Currency::where('iso', strtoupper($currency))->first();
            ShopBuyedUser::dispatch($shopPaymentDetail, $shop->reward_file_url, $curr->symbol);

            $slug = strtolower(str_replace(" ", "-", $shop->name));

            return response()->json([
                'status' => true,
                'msg' => "Payment Successfull",
                'url' => route('single-shop-list', [$slug, $shop->uuid, $shopPaymentDetail->session_id])
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ]);
            // Log::error("Error in createCheckout: " . $th->getMessage());
            // throw $e->getMessage();
        }
    }

    public function successPayment($id)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        try {
            $stripeid = ShopPayment::with('shop', 'user')->where('uuid', $id)->first();
            if (!$stripeid) {
                Log::error("No ShopPayment found for UUID: $id");
                return redirect()->back()->with('error', 'Invalid payment ID.');
            }

            if ($stripeid->anonymous == 1) {
                $username = "Anonymous user";
            } else {
                $username = $stripeid->name ?? "Anonymous user";
            }

            $message = $username . " just purchased your shop item " . $stripeid->shop->name;
            NotificationSave::dispatch($message, $stripeid->shop->user, $stripeid->user, 'Shop');

            ShopPayment::where('uuid', $id)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);

            $symbol = Currency::where('iso', strtoupper($stripeid->currency))->first();

            $message = $stripeid->message;
            $amountUserPay = $symbol->symbol . $stripeid->amount + $stripeid->vat_tax_amount;
            if ($stripeid->anonymous == 0) {
                ShopBuyed::dispatch($stripeid, false, $amountUserPay);
            } else {
                ShopBuyed::dispatch($stripeid, true, $amountUserPay);
            }

            ShopBuyedUser::dispatch($stripeid, $stripeid->shop->reward_file_url, $symbol->symbol);

            /**************************SHOP**PWA**START****************************************************/
            // below is SHOP pwa for fans

            $CreatorName = ucfirst($stripeid->shop->user->name) ?? 'A Creator';
            $title = "🛍️ Purchase Confirmed!";
            $content = "You bought something from $CreatorName ’s shop. They’ll process it soon.";
            $email = $stripeid->email ?? $stripeid->user->email;

            Helpers::sendNotification($title, $content, $email);

            // below is wish pwa for creator
            $FanName = ucfirst($stripeid->user->name) ?? 'A Fan';
            $title = "📦 New Shop Order!";
            $content = "$FanName placed an order in your shop. Time to fulfill it!.";
            $email = $stripeid->shop->user->email;

            Helpers::sendNotification($title, $content, $email);

            /****************************SHOP**PWA**ENDS****************************************************/

            $userPayment = new UserPayment();
            $userPayment->from_user_id = $stripeid->user_id ?? null;
            $userPayment->to_user_id = $stripeid->shop->user_id;
            $userPayment->product_type = 'shop';
            $userPayment->amount = $stripeid->amount;
            $userPayment->currency = $stripeid->currency;
            $userPayment->payment_method = 'stripe';
            $userPayment->payment_details = json_encode($stripeid->session_id, true);
            $userPayment->paid_at = Carbon::now();
            $userPayment->status = $stripeid->payment_status ?? 'paid';
            $userPayment->save();

            $slug = strtolower(str_replace(" ", "-", $stripeid->shop->name));

            return redirect(route('single-shop-list', [$slug, $stripeid->shop->uuid, $stripeid->session_id]))->with('success', 'Payment Successful.');
        } catch (Exception $e) {
            Log::error("Error in successPayment: " . $e->getMessage());
            return redirect(route('user.show', [$stripeid->shop->user->username]))->with('error', $e->getMessage());
        }
    }

    public function cancelPayment($id)
    {
        $payment = ShopPayment::where('uuid', $id)->first();

        $payment->payment_status = "unpaid";
        $payment->save();
        return redirect(route('user.show', [$payment->shop->user->username]))->with('error', 'Payment Cancelled.');
        // return view('cancel');
    }


    public function deactivateShop($uuid)
    {
        $shop = Shop::where('uuid', $uuid)->first();
        if (!empty($shop)) {
            if ($shop->status == 1) {
                $shop->status = 0;
                $shop->save();
                return redirect()->back()->with('success', 'Shop Deactivated successfully.');
            } else {
                $shop->status = 1;
                $shop->save();
                return redirect()->back()->with('success', 'Shop Activated successfully.');
            }
        } else {
            return redirect()->back()->with('error', 'Shop not found.');
        }
    }


    public function answerPayment(Request $request, $payment_id)
    {
        $payment = ShopPayment::where('session_id', $payment_id)->first();

        $payment->answer = $request->answer;
        $payment->save();

        return response()->json([
            'status' => true,
            'msg' => "Answer saved successfully."
        ]);
    }


    public function ordersList()
    {
        $payments = ShopPayment::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with(['shop', 'shop.user'])->where('payment_status', 'paid')->latest()->get();

        $payments->map(function ($q) {
            $q->avatar_url = $q->user->avatar_url ?? false;
            $q->username = $q->user->username ?? false;
            return $q;
        });

        $total_claims = $payments->count();
        $all_time = $payments->sum('amount');
        $day30 = ShopPayment::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with(['shop', 'shop.user'])->where('payment_status', 'paid')->where('created_at', '<=', Carbon::now())->where('created_at', '>=', Carbon::now()->subDays(30))->sum('amount');

        return response()->json([
            'status' => true,
            'orders' => $payments,
            'total_claims' => $total_claims,
            'all_time' => $all_time,
            'thirtydays' => $day30
        ]);
    }
}
