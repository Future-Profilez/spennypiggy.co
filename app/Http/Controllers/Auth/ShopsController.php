<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\NotificationSave;
use App\Jobs\ShopBuyed;
use App\Jobs\ShopBuyedUser;
use App\Models\Currency;
use App\Models\Logs;
use App\Models\MembershipPayment;
use App\Models\Payment;
use App\Models\Shop;
use App\Models\ShopCategory;
use App\Models\ShopPayment;
use App\Models\ShopShippingInfo;
use App\Models\ShopVarients;
use App\Models\ShippingProfile;
use App\Models\ShippingProfileZone;
use App\Models\User;
use App\Models\UserPayment;
use App\Models\UserShopCategories;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;
use Stripe\StripeClient;
use App\Services\CreatorActivityService;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use App\Services\CreatorSubscriptionService;
use App\Services\UserProfileService;
use App\Services\Risk\RiskService;
use App\Traits\RiskEnforcement;

class ShopsController extends Controller
{
    use RiskEnforcement;

    public function shopList($username)
    {
        $user = User::where('username', $username)->first();
        if (!$user) {
            return response()->json([
                'status' => false,
                'msg' => "User not found."
            ]);
        }

        $query = Shop::where('user_id', $user->id);

        // If not the owner, only show approved and active items
        if (!Auth::check() || Auth::id() !== $user->id) {
            $query->where('approved', 1)->where('status', 1);
        }

        $shops = $query->orderBy('id', 'desc')->with(['shop_varients', 'shop_shipping_info'])->get();

        return response()->json([
            'status' => true,
            'shops' => $shops
        ]);
    }

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
                ]
            ]
        );

        Log::info('Add Shop Item Request', ['request_data' => $request->all()]);

        if ($request->type == "physical") {
            $request->validate(
                [
                    "shipping" => [
                        "required",
                        "json",
                    ],
                    'shipping_info' => [
                        'required',
                        'string',
                    ],
                    "varients" => [
                        'sometimes',
                        'nullable'
                    ]
                ]
            );
        }

        $shippingDecoded = null;
        if ($request->type == "physical" && empty($request->shipping_profile_id)) {
            $shippingDecoded = json_decode($request->shipping);
            if (!is_array($shippingDecoded) || count($shippingDecoded) < 1) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Please add at least one shipping method'
                ]);
            }
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
                'success_page_type' => null,
                'success_page_value' => null,
                'reward_file_type' => null,
                'reward_file' => null,
                'ask_question' => $request->ask_question ?? null,
                'slot_limitation' => $request->slot_limitation ?? null,
                'special_member_price' => $request->special_member_price ?? null,
                'quantity_allow' => $request->quantity_allow ?? null,
                'shipping_profile_id' => $request->shipping_profile_id ?? null,
                'shipping_information' => $request->shipping_info ?? null
            ]);

            if (empty($request->shipping_profile_id)) {
                $shipping = $shippingDecoded ?? [];

                foreach ($shipping as $value) {
                    $ship = new ShopShippingInfo();
                    $ship->uuid = Uuid::uuid4();
                    $ship->shop_id = $shop->id;
                    $ship->country = $value->country;
                    $ship->shipping_price = $value->price;
                    $ship->save();
                }
            }

            if (!empty($request->varients)) {
                $varients = json_decode($request->varients);
                foreach ($varients as $value) {
                    $var = new ShopVarients();
                    $var->uuid = Uuid::uuid4();
                    $var->shop_id = $shop->id;
                    $var->name = $value->name;
                    $var->price = (!empty($value->value) && $value->value !== "") ? $value->value : null;
                    $var->save();
                }
            }
        }

        if ($request->has('shipping_info')) {
            $shop->shipping_information = $request->shipping_info;
        }

        $shop->refresh();

        if (!empty($request->category)) {
            $categories = json_decode($request->category);
            $cat = UserShopCategories::whereIn('uuid', $categories)->get();
            foreach ($cat as $value) {
                $shop_cat = new ShopCategory();
                $shop_cat->uuid = Uuid::uuid4();
                $shop_cat->shop_id = $shop->id;
                $shop_cat->user_shop_categories_id = $value->id;
                $shop_cat->save();
            }
        }

        $currency = $user->default_currency ?? 'gbp';

        // Gross-up so gifter pays the total and creator receives exactly their listed price.
        // Platform fee (17%), compliance fee (2%), and £1 admin fee are already accounted for
        // inside calculateStripeDirectChargeFlow — do NOT add an extra shop_tax here.
        $vatPercent = $user->vat_amount_percentage ?? 0;
        $vatAmount = $request->price * $vatPercent / 100;

        $listedPriceToGrossUp = $request->price + $vatAmount;

        $metrics = app(RiskService::class)->recalculateMetrics((string) $user->uuid);
        $reserveRate = $metrics->reserve_percent ?? 0;

        $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $currency, $reserveRate);

        $createpriceid = $breakdown['total_supporter_pays'];

        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $slug = strtolower(str_replace(" ", "-", $shop->name));
        $productPayload = [
            "name"  => "Shop Item: {$shop->name} (Total value including all fees)",
            "images" => [$shop->perma_link],
            "default_price_data"    => [
                "currency"  => $currency,
                "unit_amount_decimal"   => round($createpriceid * $multiplier, 2, PHP_ROUND_HALF_UP),
            ],
            "url"   => env('APP_URL') . "/shop/$slug/$shop->uuid",
            'metadata' => [
                'shop_item_name' => $shop->name,
                'creator_id' => $user->id,
                'creator_net_amount' => (string)($breakdown['net_to_creator'] * $multiplier),
                'total_charge_amount' => (string)($createpriceid * $multiplier),
            ]
        ];

        try {
            $product = StripeControl::createProduct($productPayload, $user->account_id);
            $shop->stripe_product_id = $product->id;
            $shop->price_id = $product->default_price;
            $shop->save();

            // Clear user caches
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

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

        $shop = Shop::where('uuid', $uuid)->where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json([
                'status' => false,
                'msg' => "Shop item not found or you don't have permission."
            ]);
        }

        $old_price = $shop->price;

        if ($request->type == "physical") {
            $request->validate(
                [
                    "shipping" => [
                        "required",
                        "json",
                    ],
                    'shipping_info' => [
                        'required',
                        'string',
                    ],
                ]
            );
        }

        $shippingDecoded = null;
        if ($request->type == "physical" && empty($request->shipping_profile_id)) {
            $shippingDecoded = json_decode($request->shipping);
            if (!is_array($shippingDecoded) || count($shippingDecoded) < 1) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Please add at least one shipping method'
                ]);
            }
        }

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
                    'image' => !empty($request->image) ? $request->image : $shop->image,
                    'success_page_type' => null,
                    'success_page_value' => null,
                    'reward_file_type' => null,
                    'reward_file' => null,
                    "ai_generated" => $request->ai_generated ?? $shop->ai_generated,
                    'ask_question' => $request->ask_question ?? null,
                    'slot_limitation' => $request->slot_limitation ?? null,
                    'special_member_price' => $request->special_member_price ?? null,
                    'quantity_allow' => $request->quantity_allow ?? null,
                    'shipping_profile_id' => $request->shipping_profile_id ?? null,
                    'shipping_information' => $request->shipping_info ?? null
                ]);

                if (!empty($request->shipping_profile_id)) {
                    ShopShippingInfo::where('shop_id', $shop->id)->delete();
                } else {
                    $shipping = $shippingDecoded ?? [];
                    ShopShippingInfo::where('shop_id', $shop->id)->delete();
                    foreach ($shipping as $value) {
                        $ship = new ShopShippingInfo();
                        $ship->uuid = Uuid::uuid4();
                        $ship->shop_id = $shop->id;
                        $ship->country = $value->country;
                        $ship->shipping_price = $value->price;
                        $ship->save();
                    }
                }
            }

            $shop->refresh();

            if (!empty($request->category)) {
                ShopCategory::where('shop_id', $shop->id)->delete();

                $categories = json_decode($request->category);
                $cat = UserShopCategories::whereIn('uuid', $categories)->get();
                foreach ($cat as $value) {
                    $shop_cat = new ShopCategory();
                    $shop_cat->uuid = Uuid::uuid4();
                    $shop_cat->shop_id = $shop->id;
                    $shop_cat->user_shop_categories_id = $value->id;
                    $shop_cat->save();
                }
            }

            $currency = $user->default_currency ?? 'gbp';

            // Gross-up so gifter pays the total and creator receives exactly their listed price.
            $vatPercent = $user->vat_amount_percentage ?? 0;
            $vatAmount = $request->price * $vatPercent / 100;

            $listedPriceToGrossUp = $request->price + $vatAmount;

            // Fetch creator risk metrics for reserve calculation
            $metrics = \App\Models\CreatorMetric::firstOrCreate(['creator_id' => $user->uuid]);
            $reserveRate = $metrics->reserve_percent ?? 0;

            // Use new gross-up flow for consistent fee calculation
            $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $currency, $reserveRate);

            $createpriceid = $breakdown['total_supporter_pays'];

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

            $slug = strtolower(str_replace(" ", "_", $shop->name));
            $productPayload = [
                "name"  => "Total value of item including all fees",
                "images" => [$shop->perma_link],
                "default_price_data"    =>  [
                    "currency"  =>  $currency,
                    "unit_amount_decimal"   => round($createpriceid * $multiplier, 2, PHP_ROUND_HALF_UP),
                ],
                "url"   => env('APP_URL') . "/shop/$slug/$shop->uuid",
                'metadata' => [
                    'shop_item_name' => $shop->name,
                    'creator_id' => $user->id,
                    'creator_net_amount' => (string)($breakdown['net_to_creator'] * $multiplier),
                    'total_charge_amount' => (string)($createpriceid * $multiplier),
                ]
            ];

            try {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

                // Check if product exists in Stripe
                $stripeProduct = null;
                try {
                    $stripeProduct = $stripe->products->retrieve($shop->stripe_product_id, [], ['stripe_account' => $user->account_id]);
                } catch (Exception $e) {
                    Log::warning("Stripe Product not found for shop item {$shop->uuid}, will attempt to recreate. Error: " . $e->getMessage());
                }

                if (!$stripeProduct) {
                    // Recreate the product if it's missing from Stripe
                    $stripeProduct = StripeControl::createProduct($productPayload, $user->account_id);
                    
                    $shop->update([
                        'stripe_product_id' => $stripeProduct->id,
                        'price_id' => $stripeProduct->default_price,
                        'approved' => 0,
                    ]);

                    Log::info("Recreated Stripe Product for shop item {$shop->uuid}: " . $stripeProduct->id);
                } else if ($shop->type != 'physical') {
                    if ($old_price == $shop->price) {
                        $stripe_client = $stripe->products->update($shop->stripe_product_id, [
                            'name' => "Total value of item including all fees",
                            'images' => [$shop->perma_link],
                            "default_price" => $shop->price_id,
                            'metadata' => [
                                'shop_item_name' => $request->name ?? $shop->name,
                                'creator_id' => $user->id,
                                'creator_net_amount' => (string)($breakdown['net_to_creator'] * $multiplier),
                                'total_charge_amount' => (string)($createpriceid * $multiplier),
                            ]
                        ], [
                            'stripe_account' => $user->account_id,
                        ]);
                    } else {
                        $stripe_client = StripeControl::updateSubscription($shop->stripe_product_id, $productPayload, $user->account_id);
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

                // Clear user caches
                app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

                return response()->json([
                    'status' => true,
                    'msg' => "Shop Item has been updated, your upload will be approved shortly."
                ]);
                // return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Shop Item has been added, your upload will be approved shortly.");

            } catch (Exception $e) {
                // $shop->delete(); // Do not delete on update failure
                return response()->json([
                    'status' => false,
                    'msg' => "Stripe Error: " . $e->getMessage()
                ]);
            }
        }
    }

    public function deleteShop($uuid)
    {
        $shop = Shop::where('uuid', $uuid)->where('user_id', Auth::id())->first();

        if (!$shop) {
            return response()->json([
                'status' => false,
                'msg' => "Shop item not found or you don't have permission."
            ]);
        }

        ShopCategory::where('shop_id', $shop->id)->delete();

        ShopShippingInfo::where('shop_id', $shop->id)->delete();

        ShopVarients::where('shop_id', $shop->id)->delete();

        ShopPayment::where('shop_id', $shop->id)->delete();

        $shop->delete();

        // Clear user caches
        $user = $shop->user;
        app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

        return response()->json([
            'status' => true,
            'msg' => "Shop item removed successfully."
        ]);
    }

    public function singleShopList($_slug, $uuid, $session_id = null)
    {
        $shopQuery = Shop::where('uuid', $uuid)->with(['user', 'shop_varients', 'shop_shipping_info']);
        
        $shop = $shopQuery->first();

        if (!$shop) {
            abort(404);
        }
        
        // Hide from public if not approved or deactivated, unless owner is viewing
        if (!Auth::check() || Auth::id() !== $shop->user_id) {
            if ($shop->approved != 1 || $shop->status != 1) {
                abort(404);
            }
        }

        $opened = null;
        if (!empty($session_id)) {
            $payments = ShopPayment::where('session_id', $session_id)->first();
            if ($payments) {
                $opened = $payments->opened;
                $payments->opened = 1;
                $payments->save();
            }
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

        $vat_percentage_amount = 0;
        if (!empty($shop->user->vat_amount_percentage)) {
            $vat_percentage_amount = $amount * $shop->user->vat_amount_percentage / 100;
        }

        $card_capabilities = StripeControl::hasCardPaymentsCapability($shop->user->account_id);

        $my_purchases = null;
        if (Auth::check()) {
            $my_purchases = ShopPayment::where('shop_id', $shop->id)
                ->where('user_id', Auth::id())
                ->where('payment_status', 'paid')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($order) {
                    $deliverable = \App\Models\Deliverable::where('session_id', $order->session_id)->first();
                    $order->status = $deliverable->status ?? 'pending';
                    return $order;
                });
        }

        return Inertia::render('shop/Item', [
            'shop' => $shop,
            'payment_id' => $session_id,
            'opened' => $opened,
            'vat_percent' => $vat_percentage_amount,
            'card_capabilities' => $card_capabilities,
            'my_purchases' => $my_purchases,
        ]);
    }

    public function shippingPrice($shop_id)
    {
        $shop = Shop::where('uuid', $shop_id)->first();
        $shipping_price = 0;
        if ($shop && $shop->type == 'physical') {
            $country = request()->query('country');
            if (!empty($country)) {
                if (!empty($shop->shipping_profile_id)) {
                    $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                        ->where('country', $country)
                        ->first();
                    if (empty($shipping)) {
                        $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                            ->where(function($q) {
                                $q->where('country', 'all')->orWhere('country', 'worldwide');
                            })
                            ->first();
                    }
                } else {
                    $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', $country)->first();
                    if (empty($shipping)) {
                        $shipping = ShopShippingInfo::where('shop_id', $shop->id)
                            ->where(function($q) {
                                $q->where('country', 'all')->orWhere('country', 'worldwide');
                            })
                            ->first();
                    }
                }
            }
            if (empty($shipping) || empty($country)) {
                if (!empty($shop->shipping_profile_id)) {
                    $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                        ->where(function($q) {
                            $q->where('country', 'all')->orWhere('country', 'worldwide');
                        })
                        ->first();
                } else {
                    $shipping = ShopShippingInfo::where('shop_id', $shop->id)
                        ->where(function($q) {
                            $q->where('country', 'all')->orWhere('country', 'worldwide');
                        })
                        ->first();
                }
            }
            $shipping_price = !empty($shipping) ? (float) $shipping->shipping_price : 0;
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
        foreach ($categories as $value) {
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

        $this->ensureTurnstileVerified($request);

        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }

            $shop = Shop::where('uuid', $shop_id)->first();

            if (!$shop) {
                return response()->json([
                    'status' => false,
                    'message' => 'Shop item not found.'
                ]);
            }

            // Check stock if slot_limitation is set (only for physical products)
            $requestedQuantity = (int) request()->query('quantity', 1);
            if ($shop->type === 'physical' && $shop->slot_limitation !== null) {
                if ($shop->slot_limitation <= 0) {
                    return response()->json([
                        'status' => false,
                        'message' => 'This item is currently sold out.'
                    ]);
                }
                if ($shop->slot_limitation < $requestedQuantity) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Not enough stock available. Only ' . $shop->slot_limitation . ' left.'
                    ]);
                }
            }

            if (!$shop->user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Creator account not found or deactivated.'
                ]);
            }

            // NEW: Check creator subscription eligibility first
            $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($shop->user);

            // Check if creator has card_payments capability
            if (!StripeControl::hasCardPaymentsCapability($shop->user->account_id)) {
                return response()->json([
                    'status' => false,
                    'message' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ["eligible" => false, "status" => "stripe_disabled"])
                ]);
            }

            if (!$subscriptionCheck['eligible']) {
                // Send notification to creator about blocked payment
                $shop->user->notify(new SubscriptionBlockedNotification($subscriptionCheck, $shop->price));

                // Log the blocked payment for subscription issues
                Log::warning('Shop payment blocked due to subscription issue', [
                    'creator_id' => $shop->user->id,
                    'creator_username' => $shop->user->username,
                    'shop_id' => $shop->id,
                    'shop_price' => $shop->price,
                    'subscription_status' => $subscriptionCheck['status'],
                    'subscription_status_code' => $subscriptionCheck['subscription_status'] ?? 'unknown'
                ]);

                // Return user-friendly error to fan
                return response()->json([
                    'status' => false,
                    'message' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
                ]);
            }

            // NEW: Check creator activity eligibility
            $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($shop->user);

            if (!$activityCheck['eligible']) {
                // Send notification to creator about blocked payment
                $shop->user->notify(new PaymentBlockedNotification($activityCheck, $shop->price));

                // Log the blocked payment for analytics
                Log::info('Shop payment blocked due to insufficient creator activity', [
                    'creator_id' => $shop->user->id,
                    'creator_username' => $shop->user->username,
                    'shop_id' => $shop->id,
                    'shop_price' => $shop->price,
                    'activity_status' => $activityCheck['status'],
                    'content_count' => $activityCheck['content_count'] ?? 0
                ]);

                // Return user-friendly error to fan
                return response()->json([
                    'status' => false,
                    'message' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
                ]);
            }

            // Log successful activity check for analytics
            if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
                Log::info('Shop payment allowed - creator activity check passed', [
                    'creator_id' => $shop->user->id,
                    'creator_username' => $shop->user->username,
                    'shop_id' => $shop->id,
                    'activity_status' => $activityCheck['status'],
                    'content_count' => $activityCheck['content_count'] ?? 0
                ]);
            }

            // Calculate the base amount the creator should receive (Price + Tax + VAT)
            $amount = round($shop->price, 2, PHP_ROUND_HALF_UP);
            
            // Check membership discount
            if (Auth::check()) {
                $user = User::find(Auth::id());
                $isMember = MembershipPayment::where(function ($que) use ($user) {
                    $que->where('user_id', $user->id)->orWhere('guest_email', $user->email);
                })->whereHas('membership', function ($q) use ($shop) {
                    $q->where('user_id', $shop->user_id);
                })->where('status', 'paid')->where('upcoming_payment', '>=', Carbon::now())->exists();

                if ($isMember && !empty($shop->special_member_price)) {
                    $amount = round($shop->special_member_price, 2, PHP_ROUND_HALF_UP);
                }
            }

            if ($varient_id != "no_varient") {
                $var = ShopVarients::where('id', $varient_id)->where('shop_id', $shop->id)->first();
                if (!$var) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Selected variant not found.'
                    ]);
                }
                $amount = $var->price !== null ? round($var->price, 2, PHP_ROUND_HALF_UP) : $amount;
            }
            
            $amount = $amount * $requestedQuantity;

            // Add Shipping Price if physical item
            $shipping_price = 0;
            $shipping_info = null;
            if ($shop->type == 'physical') {
                $shipping_info = $request->shipping_info;
                $country = $request->query('country');
                if (!empty($country)) {
                    // First check if shop has a shipping profile
                    if ($shop->shipping_profile_id) {
                        $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                            ->where('country', $country)
                            ->first();
                        if (empty($shipping)) {
                            $shipping = ShippingProfileZone::where('shipping_profile_id', $shop->shipping_profile_id)
                                ->where('country', 'all')
                                ->first();
                        }
                        $shipping_price = !empty($shipping) ? $shipping->shipping_price : 0;
                    } else {
                        // Fallback to legacy shop-specific shipping info
                        $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', $country)->first();
                        if (empty($shipping)) {
                            $shipping = ShopShippingInfo::where('shop_id', $shop->id)->where('country', 'all')->first();
                        }
                        $shipping_price = !empty($shipping) ? $shipping->shipping_price : 0;
                    }
                    $shipping_price = $shipping_price * $requestedQuantity;
                }
            }

            // Platform fee (17%), compliance (2%), and £1 admin fee are all accounted for
            // inside calculateStripeDirectChargeFlow.
            // We'll store the total fees (Platform + Stripe) in tax_amount for the record.
            $taxAmount = $breakdown['total_fees'] ?? 0;

            // Add VAT if applicable
            $vatAmount = 0;
            if (!empty($shop->user->vat_amount_percentage)) {
                $vatAmount = $amount * $shop->user->vat_amount_percentage / 100;
            }

            $listedPriceToGrossUp = $amount + $vatAmount + $shipping_price;

            // Unified Risk Enforcement
            $riskData = $this->enforceRiskChecks(
                $request,
                $shop->user,
                $listedPriceToGrossUp,
                $shop->user->default_currency ?? 'GBP',
                'shop',
                true // JSON response expected
            );

            // If it's a JSON error response (blocked, step_up, login required), return it immediately
            if ($riskData instanceof \Illuminate\Http\JsonResponse) {
                return $riskData;
            }

            $chargeCurrency = $shop->user->default_currency ?? 'GBP';

            // Fetch creator risk metrics for reserve calculation
            $metrics = \App\Models\CreatorMetric::firstOrCreate(['creator_id' => $shop->user->uuid]);
            $reserveRate = $metrics->reserve_percent ?? 0;

            // Use new gross-up flow with the full price the creator expects to receive
            $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceToGrossUp, $chargeCurrency, $reserveRate);
            $applicationFeeAmount = $breakdown['application_fee'] ?? 0;
            $taxAmount = $breakdown['total_fees'] ?? 0; // Update with accurate breakdown fees

            $guestRestriction = Helpers::guestCheckoutRestriction($chargeCurrency, $breakdown['total_supporter_pays'] ?? 0);
            if ($guestRestriction) {
                return response()->json([
                    'status' => false,
                    'code' => 'AUTH_REQUIRED',
                    'reason_code' => $guestRestriction['code'],
                    'message' => 'Login required',
                    'msg' => $guestRestriction['message'],
                ]);
            }

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($chargeCurrency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;
        $precision = $multiplier === 1 ? 0 : 2;

            $unitAmount = (int) round($breakdown['total_supporter_pays'] * $multiplier);

            if (!Auth::check()) {
                $logged_out_user = User::where('email', request()->query('email'))->first();
            }

            $request->validate([
                'digital_waiver' => ['required', 'accepted'],
            ]);

            $shopPaymentDetail = ShopPayment::create([
                'amount' => $amount,
                'total_paid' => $breakdown['total_supporter_pays'] ?? 0,
                'tax_amount' => $taxAmount,
                'vat_tax_amount' => $vatAmount,
                'shipping_amount' => $shipping_price,
                'currency' => $chargeCurrency,
                'shop_id' => $shop->id,
                'user_id' => (Auth::check()) ? Auth::id() : (!empty($logged_out_user) ? $logged_out_user->id : null),
                'varient_id' => $varient_id != "no_varient" ? $varient_id : null,
                'name' => request()->query('from') ?? null,
                'email' => request()->query('email'),
                'message' => $message ?? null,
                'ask_question' => $shop->ask_question,
                'anonymous' => request()->query('anonymous') ?? 0,
                'quantity' => request()->query('quantity'),
                'shipping_info' => $shipping_info ?? null
            ]);

            // Apply digital waiver confirmation
            Helpers::applyDigitalWaiver($shopPaymentDetail, (bool) $request->digital_waiver);
            $shopPaymentDetail->save();
            $shopPaymentDetail->refresh();

            $sessionCreate = null;
            $connectedAccountId = $shop->user->account_id;

        if (!StripeControl::hasCardPaymentsCapability($connectedAccountId)) {
            return response()->json([
                'status' => false,
                'msg' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ["eligible" => false, "status" => "stripe_disabled"])
            ]);
        }

        $creatorTransferAmountMinor = (int) round(round($listedPriceToGrossUp, $precision, PHP_ROUND_HALF_UP) * $multiplier);

        // Build session payload (platform checkout + destination transfer)
            $payload = [
                'success_url' => route('shop.success-payment', [$shopPaymentDetail->uuid]),
                'cancel_url' => route('shop.cancel-payment', [$shopPaymentDetail->uuid]),
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $chargeCurrency,
                    'product_data' => [
                        'name' => "Total value of item including all fees",
                        'description' => "Shop Payment for {$shop->user->username} (Total value including all fees)",
                    ],
                    'unit_amount' => $unitAmount,
                ],
            ]],
                'mode' => 'payment',
                'payment_method_types' => ['card'],
            'customer_email' => $shopPaymentDetail->email ?? ($shopPaymentDetail->user->email ?? null),
                'payment_intent_data' => [
                    'receipt_email' => $shopPaymentDetail->email ?? ($shopPaymentDetail->user->email ?? null),
                    'description' => "Shop Payment for {$shop->user->username} (Total value including all fees)",
                    'application_fee_amount' => (int) round($applicationFeeAmount * $multiplier),
                    'metadata' => Helpers::buildStripeMetadata('shop', $shopPaymentDetail, [
                        'shop_item_id' => $shop->id,
                        'quantity' => $shopPaymentDetail->quantity,
                        'anonymous' => $shopPaymentDetail->anonymous,
                        'varient_id' => $shopPaymentDetail->varient_id,
                        'creator_net_amount' => (string) $creatorTransferAmountMinor,
                        'total_charge_amount' => (string)$unitAmount,
                    ]),
                ],
            ];

            // Check if we need to force 3DS
            if (in_array('FORCE_3DS', $riskData['reason_codes'] ?? [])) {
                $payload['payment_method_options'] = [
                    'card' => [
                        'request_three_d_secure' => 'any',
                    ],
                ];
            }

            $sessionCreate = StripeControl::createCheckoutSession($payload, $connectedAccountId, false, $shop->user->username);

            $shopPaymentDetail->session_id =  $sessionCreate->id;
            $shopPaymentDetail->save();

            try {
                Payment::firstOrCreate(
                    ['stripe_session_id' => $sessionCreate->id],
                    [
                        'creator_id' => $shop->user->uuid,
                        'risk_identity_id' => $riskData['risk_identity_id'] ?? null,
                        'amount' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor((int) $unitAmount, strtoupper($chargeCurrency)),
                        'currency' => 'gbp',
                        'stripe_payment_intent_id' => $sessionCreate->payment_intent ?? null,
                        'status' => 'initiated',
                        'reason_codes' => $riskData['reason_codes'] ?? [],
                    ]
                );
            } catch (\Exception $e) {
                Log::warning('Risk Ledger: Failed to record shop payment', [
                    'session_id' => $sessionCreate->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'status' => true,
                'url' => $sessionCreate->url
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
        return DB::transaction(function () use ($id) {
            try {
                $stripeid = ShopPayment::with(['shop', 'user'])->where('uuid', $id)->lockForUpdate()->first();
                if (!$stripeid) {
                    Log::error("No ShopPayment found for UUID: $id");
                    return redirect()->back()->with('error', 'Invalid payment ID.');
                }

                // If already paid, just redirect
                if ($stripeid->payment_status === 'paid') {
                    return redirect()->route('single-shop-list', [
                        'slug' => \Illuminate\Support\Str::slug($stripeid->shop->name),
                        'uuid' => $stripeid->shop->uuid,
                        'session_id' => $stripeid->session_id
                    ])->with('success', 'Payment Successful.');
                }

                // 1. Decrement stock if applicable (only for physical products)
                $shop = $stripeid->shop;
                if ($shop->type === 'physical' && $shop->slot_limitation !== null) {
                    $purchasedQuantity = $stripeid->quantity > 0 ? $stripeid->quantity : 1;
                    if ($shop->slot_limitation > 0) {
                        $shop->decrement('slot_limitation', $purchasedQuantity);
                    } else {
                        Log::warning('Shop item sold out during payment success', ['shop_id' => $shop->id]);
                        // We still allow the payment to succeed as money is already taken
                    }
                }

                Helpers::addGmv($stripeid->shop->user_id, (float) $stripeid->amount);

                if ($stripeid->anonymous == 1) {
                    $username = "Anonymous user";
                } else {
                    $username = $stripeid->name ?? "Anonymous user";
                }

                $message = $username . " just purchased your shop item " . $stripeid->shop->name;
                NotificationSave::dispatch($message, $stripeid->shop->user, $stripeid->user, 'Shop');

                $stripeid->update([
                    'payment_status' => 'paid',
                    'updated_at' => Carbon::now(),
                ]);

                // Immediately sync to FinancialTransaction so earnings dashboard and support history shows up-to-date
                try {
                    $creator = $stripeid->shop->user;
                    $amount = (float) $stripeid->amount;
                    $shippingAmount = (float) ($stripeid->shipping_amount ?? 0);
                    $vat = (float) ($stripeid->vat_tax_amount ?? 0);
                    
                    // Recalculate breakdown to get accurate split for FinancialTransaction
                    $priceToGrossUp = $amount + $shippingAmount + $vat;
                    $breakdown = Helpers::calculateStripeDirectChargeFlow($priceToGrossUp, $stripeid->currency);
                    
                    $platformFee = $breakdown['application_fee'];
                    $stripeFee = $breakdown['stripe_fee'];
                    $gross = $stripeid->total_paid && $stripeid->total_paid > 0 
                        ? (float) $stripeid->total_paid 
                        : $breakdown['total_supporter_pays'];
                    $creatorAmount = $amount + $shippingAmount;

                    \App\Models\FinancialTransaction::updateOrCreate(
                        [
                            'source_type' => \App\Models\ShopPayment::class,
                            'source_id' => $stripeid->id,
                        ],
                        [
                            'user_id' => $creator->id,
                            'supporter_id' => $stripeid->user_id,
                            'type' => 'income',
                            'gross_amount' => $gross,
                            'platform_fee' => $platformFee,
                            'stripe_fee' => $stripeFee,
                            'vat_amount' => $vat,
                            'net_amount' => $creatorAmount,
                            'currency' => strtoupper($stripeid->currency ?? 'GBP'),
                            'status' => 'completed',
                            'description' => 'Shop Purchase: ' . ($stripeid->shop->name ?? 'Item'),
                            'transaction_date' => $stripeid->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync ShopPayment to FinancialTransaction in successPayment: ' . $e->getMessage(), ['shop_payment_id' => $stripeid->id]);
                }

                $symbol = Currency::where('iso', strtoupper($stripeid->currency))->first();

                $message = $stripeid->message;
                // Calculate creator net amount (what they receive)
                $creatorNetAmountVal = $stripeid->amount + ($stripeid->shipping_amount ?? 0);

                $currencyModel = Currency::where('ISO', strtoupper($stripeid->currency))->first();
                $digits = $currencyModel && $currencyModel->ISOdigits == 0 ? 0 : 2;
                $creatorNetAmount = ($symbol->symbol ?? '£') . number_format($creatorNetAmountVal, $digits);

                if ($stripeid->anonymous == 0) {
                    ShopBuyed::dispatch($stripeid, false, $creatorNetAmount);
                } else {
                    ShopBuyed::dispatch($stripeid, true, $creatorNetAmount);
                }

                // Create/ensure deliverable record for shop item
                try {
                    \App\Models\Deliverable::updateOrCreate(
                        [
                            'session_id' => $stripeid->session_id,
                            'product_type' => 'shop_item',
                            'item_id' => $stripeid->shop->id,
                            'creator_id' => $stripeid->shop->user_id,
                        ],
                        [
                            'product_id' => $stripeid->shop->stripe_product_id ?? 'shop_' . $stripeid->shop->id,
                            'price_id' => $stripeid->shop->price_id,
                            'gifter_id' => $stripeid->user_id,
                            'deliverable_type' => $stripeid->shop->type == 'physical' ? 'shipping' : 'digital_file',
                            'transaction_amount' => $stripeid->amount,
                            'deliverable_url' => $stripeid->shop->reward_file_url,
                            'customer_email' => $stripeid->email ?? ($stripeid->user?->email),
                            'customer_name' => $stripeid->name ?? ($stripeid->user?->name),
                            'payment_status' => 'paid',
                            'payment_currency' => strtoupper($stripeid->currency ?? 'GBP'),
                            'anonymous' => $stripeid->anonymous ?? false,
                            'message' => $stripeid->message,
                            'status' => $stripeid->shop->type == 'physical' ? 'pending' : 'delivered',
                            'delivered_at' => $stripeid->shop->type == 'physical' ? null : now(),
                            'metadata' => [
                                'shop_item_id' => $stripeid->shop->id,
                                'shop_item_name' => $stripeid->shop->name,
                                'type' => $stripeid->shop->type,
                                'amount' => $stripeid->amount,
                                'currency' => $stripeid->currency,
                                'creator_net_amount' => $creatorNetAmount
                            ],
                        ]
                    );
                    Log::info('ShopsController: Deliverable record ensured for shop item', ['shop_id' => $stripeid->shop->id]);
                } catch (\Exception $e) {
                    Log::error('ShopsController: Failed to ensure deliverable record', ['error' => $e->getMessage(), 'shop_id' => $stripeid->shop->id ?? null, 'session_id' => $stripeid->session_id ?? null]);
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
                $FanName = ucfirst($stripeid->user->name ?? 'A Fan');
                $title = "📦 New Shop Order!";
                $content = "$FanName placed an order in your shop. Time to fulfill it!.";
                $email = $stripeid->shop->user->email;

                Helpers::sendNotification($title, $content, $email);

                /****************************SHOP**PWA**ENDS****************************************************/

                // Idempotency check for UserPayment
                $existingUserPayment = UserPayment::where('payment_details', json_encode($stripeid->session_id, true))->exists();

                if (!$existingUserPayment) {
                    $userPayment = new UserPayment();
                    $userPayment->from_user_id = $stripeid->user_id ?? null;
                    $userPayment->to_user_id = $stripeid->shop->user_id;
                    $userPayment->product_type = 'shop';
                    $userPayment->amount = $stripeid->amount;

                    // Ensure total_paid is updated in ShopPayment if missing
                    if (!$stripeid->total_paid || $stripeid->total_paid <= 0) {
                        $multiplier = Helpers::isZeroDecimalCurrency($stripeid->currency) ? 1 : 100;
                        $stripeid->total_paid = (float) ($stripeid->amount_total); // amount_total in StripePaymentDetail is already divided by multiplier
                        $stripeid->save();
                    }

                    $userPayment->total_paid = $stripeid->total_paid;
                    $userPayment->currency = $stripeid->currency;
                    $userPayment->payment_method = 'stripe';
                    $userPayment->payment_details = json_encode($stripeid->session_id, true);
                    $userPayment->paid_at = Carbon::now();
                    $userPayment->status = 'paid';
                    $userPayment->save();
                }

                // Clear user caches
                app(UserProfileService::class)->clearUserCaches($stripeid->shop->user->username, $stripeid->shop->user->id);

                return redirect()->route('single-shop-list', [
                    'slug' => \Illuminate\Support\Str::slug($stripeid->shop->name),
                    'uuid' => $stripeid->shop->uuid,
                    'session_id' => $stripeid->session_id
                ])->with('success', 'Payment Successful.');
            } catch (\Exception $e) {
                Log::error("Error in successPayment: " . $e->getMessage());
                return redirect(route('user.show', [$stripeid->shop->user->username]))->with('error', 'Something went wrong during payment processing.');
            }
        });
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
        $shop = Shop::where('uuid', $uuid)->where('user_id', Auth::id())->first();
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

    public function updateFulfillment(Request $request, $uuid)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered',
            'tracking_id' => 'nullable|string',
            'courier_name' => 'nullable|string',
            'expected_delivery_date' => 'nullable|date',
        ]);

        $shopPayment = ShopPayment::where('uuid', $uuid)->with('shop')->firstOrFail();

        if (!$shopPayment->shop || (int) $shopPayment->shop->user_id !== (int) Auth::id()) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized.'
            ], 403);
        }

        $deliverable = Deliverable::where('session_id', $shopPayment->session_id)
            ->where('product_type', 'shop_item')
            ->where('item_id', $shopPayment->shop_id)
            ->where('creator_id', Auth::id())
            ->first();

        if (!$deliverable) {
            try {
                $deliverable = Deliverable::create([
                    'product_id' => $shopPayment->shop->stripe_product_id ?? 'shop_' . $shopPayment->shop_id,
                    'price_id' => $shopPayment->shop->price_id,
                    'item_id' => $shopPayment->shop_id,
                    'creator_id' => $shopPayment->shop->user_id,
                    'gifter_id' => $shopPayment->user_id,
                    'session_id' => $shopPayment->session_id,
                    'deliverable_type' => $shopPayment->shop->type == 'physical' ? 'shipping' : 'digital_file',
                    'product_type' => 'shop_item',
                    'transaction_amount' => $shopPayment->amount,
                    'deliverable_url' => $shopPayment->shop->reward_file_url,
                    'customer_email' => $shopPayment->email ?? ($shopPayment->user?->email),
                    'customer_name' => $shopPayment->name ?? ($shopPayment->user?->name),
                    'payment_status' => $shopPayment->payment_status ?? 'paid',
                    'payment_currency' => strtoupper($shopPayment->currency ?? 'GBP'),
                    'anonymous' => $shopPayment->anonymous ?? false,
                    'message' => $shopPayment->message,
                    'status' => $shopPayment->shop->type == 'physical' ? 'pending' : 'delivered',
                    'delivered_at' => $shopPayment->shop->type == 'physical' ? null : now(),
                    'metadata' => [
                        'shop_item_id' => $shopPayment->shop_id,
                        'shop_item_name' => $shopPayment->shop->name ?? null,
                        'type' => $shopPayment->shop->type ?? null,
                        'amount' => $shopPayment->amount,
                        'currency' => $shopPayment->currency,
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Fulfillment: Failed to create missing deliverable', ['error' => $e->getMessage(), 'shop_payment_uuid' => $uuid, 'session_id' => $shopPayment->session_id]);
                return response()->json([
                    'status' => false,
                    'message' => 'Unable to update fulfillment because deliverable record is missing.'
                ], 422);
            }
        }

        $updateData = [
            'status' => $request->status,
            'tracking_id' => $request->tracking_id,
            'courier_name' => $request->courier_name,
            'expected_delivery_date' => $request->expected_delivery_date,
        ];

        if ($request->status === 'shipped' && !$deliverable->shipped_at) {
            $updateData['shipped_at'] = now();
        }

        if ($request->status === 'delivered') {
            $updateData['delivered_at'] = now();
        }

        // Clear overdue flags when action is taken (shipped or delivered)
        if (in_array($request->status, ['shipped', 'delivered'])) {
            $updateData['is_overdue'] = false;
            $updateData['needs_admin_review'] = false;
        }

        $deliverable->update($updateData);
        $shopPayment->expected_delivery_date = $request->expected_delivery_date;
        $shopPayment->save();

        // Send PWA notification to supporter about status update
        try {
            $creatorName = ucfirst(Auth::user()->name);
            $title = "🚚 Order Update!";
            
            if ($request->status === 'shipped') {
                $content = "Great news! $creatorName has shipped your order. Tracking: " . ($request->tracking_id ?? 'Available soon');
            } elseif ($request->status === 'delivered') {
                $content = "Your order from $creatorName has been delivered!";
            } else {
                $content = "Your order from $creatorName is now " . ucfirst($request->status) . ".";
            }

            if ($request->expected_delivery_date) {
                $content .= " Expected delivery: " . \Carbon\Carbon::parse($request->expected_delivery_date)->format('M d');
            }

            Helpers::sendNotification($title, $content, $deliverable->customer_email);
            Log::info('Fulfillment: Status notification (PWA) sent', ['deliverable_id' => $deliverable->id, 'status' => $request->status]);
        } catch (\Exception $e) {
            Log::error('Fulfillment: Failed to send status notification', ['error' => $e->getMessage()]);
        }

        // Send Email Notification for any status update
        try {
            \Illuminate\Support\Facades\Mail::to($deliverable->customer_email)
                ->send(new \App\Mail\ShopOrderStatusMail($deliverable, Auth::user(), $request->status));
            Log::info('Fulfillment: Status update email sent', ['deliverable_id' => $deliverable->id, 'status' => $request->status]);
        } catch (\Exception $e) {
            Log::error('Fulfillment: Failed to send status update email', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Fulfillment status updated successfully.',
            'deliverable' => $deliverable
        ]);
    }

    public function deactivateOrder(Request $request, $uuid)
    {
        $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $shopPayment = ShopPayment::where('uuid', $uuid)->with(['shop', 'user'])->firstOrFail();

        if (!$shopPayment->shop || (int) $shopPayment->shop->user_id !== (int) Auth::id()) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized.'
            ], 403);
        }

        $deliverable = Deliverable::where('session_id', $shopPayment->session_id)
            ->where('product_type', 'shop_item')
            ->where('item_id', $shopPayment->shop_id)
            ->where('creator_id', Auth::id())
            ->first();

        if (!$deliverable) {
            try {
                $deliverable = Deliverable::create([
                    'product_id' => $shopPayment->shop->stripe_product_id ?? 'shop_' . $shopPayment->shop_id,
                    'price_id' => $shopPayment->shop->price_id,
                    'item_id' => $shopPayment->shop_id,
                    'creator_id' => $shopPayment->shop->user_id,
                    'gifter_id' => $shopPayment->user_id,
                    'session_id' => $shopPayment->session_id,
                    'deliverable_type' => $shopPayment->shop->type == 'physical' ? 'shipping' : 'digital_file',
                    'product_type' => 'shop_item',
                    'transaction_amount' => $shopPayment->amount,
                    'deliverable_url' => $shopPayment->shop->reward_file_url,
                    'customer_email' => $shopPayment->email ?? ($shopPayment->user?->email),
                    'customer_name' => $shopPayment->name ?? ($shopPayment->user?->name),
                    'payment_status' => $shopPayment->payment_status ?? 'paid',
                    'payment_currency' => strtoupper($shopPayment->currency ?? 'GBP'),
                    'anonymous' => $shopPayment->anonymous ?? false,
                    'message' => $shopPayment->message,
                    'status' => $shopPayment->shop->type == 'physical' ? 'pending' : 'delivered',
                    'delivered_at' => $shopPayment->shop->type == 'physical' ? null : now(),
                    'metadata' => [
                        'shop_item_id' => $shopPayment->shop_id,
                        'shop_item_name' => $shopPayment->shop->name ?? null,
                        'type' => $shopPayment->shop->type ?? null,
                        'amount' => $shopPayment->amount,
                        'currency' => $shopPayment->currency,
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Shop order deactivation: failed to create missing deliverable', ['error' => $e->getMessage(), 'shop_payment_uuid' => $uuid, 'session_id' => $shopPayment->session_id]);
                return response()->json([
                    'status' => false,
                    'message' => 'Unable to deactivate order.'
                ], 422);
            }
        }

        $deliverable->is_deactivated = true;
        $deliverable->hidden_from_gifter = true;
        $deliverable->deactivated_at = now();
        $deliverable->deactivated_by = 'creator';
        $deliverable->deactivated_reason = $request->reason;
        $deliverable->save();

        return response()->json([
            'status' => true,
            'message' => 'Order deactivated successfully.',
            'deliverable' => $deliverable,
        ]);
    }

    /**
     * Get all shipping profiles for the authenticated creator
     */
    public function getShippingProfiles()
    {
        $profiles = ShippingProfile::where('user_id', Auth::id())
            ->with('zones')
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'profiles' => $profiles
        ]);
    }

    /**
     * Save or update a shipping profile
     */
    public function saveShippingProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'zones' => 'required|array',
            'zones.*.country' => 'required|string',
            'zones.*.shipping_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request) {
            $profile = ShippingProfile::updateOrCreate(
                ['id' => $request->id, 'user_id' => Auth::id()],
                ['name' => $request->name]
            );

            // Delete old zones if updating
            $profile->zones()->delete();

            // Create new zones
            foreach ($request->zones as $zone) {
                $profile->zones()->create([
                    'country' => $zone['country'],
                    'shipping_price' => $zone['shipping_price'],
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Shipping profile saved successfully.',
                'profile' => $profile->load('zones')
            ]);
        });
    }

    /**
     * Delete a shipping profile
     */
    public function deleteShippingProfile($id)
    {
        $profile = ShippingProfile::where('id', $id)->where('user_id', Auth::id())->firstOrFail();
        $profile->delete();

        return response()->json([
            'status' => true,
            'message' => 'Shipping profile deleted successfully.'
        ]);
    }

    public function ordersList(Request $request)
    {
        $user = Auth::user();
        $type = $request->query('type', 'sales');

        if ($type === 'purchases') {
            // Gifter's view: what they paid for
            $transactions = FinancialTransaction::where('supporter_id', $user->id)
                ->where('source_type', 'App\\Models\\ShopPayment')
                ->where('status', 'completed')
                ->orderBy('transaction_date', 'desc')
                ->get();
            
            $formattedOrders = $transactions->map(function ($tx) {
                try {
                    // Get the ShopPayment and related data
                    $shopPayment = ShopPayment::find($tx->source_id);
                    if (!$shopPayment) {
                        return null;
                    }

                    $deliverable = \App\Models\Deliverable::where('session_id', $shopPayment->session_id)
                        ->where('product_type', 'shop_item')
                        ->where('item_id', $shopPayment->shop_id)
                        ->first();

                    if (($deliverable->hidden_from_gifter ?? false) === true) {
                        return null;
                    }

                    // Determine delay status
                    $isDelayed = false;
                    if ($shopPayment->shop->type === 'physical' && ($deliverable->status ?? 'pending') !== 'delivered' && ($deliverable->is_deactivated ?? false) !== true && $tx->status !== 'refunded') {
                        if (Carbon::parse($tx->transaction_date)->addDays(7)->isPast()) {
                            $isDelayed = true;
                        }
                    }

                    return [
                        'id' => $shopPayment->id,
                        'uuid' => $shopPayment->uuid,
                        'gross_amount' => $tx->gross_amount,
                        'platform_fee' => $tx->platform_fee,
                        'stripe_fee' => $tx->stripe_fee,
                        'vat_amount' => $tx->vat_amount,
                        'currency' => $tx->currency,
                        'transaction_date' => $tx->transaction_date,
                        'created_at' => $shopPayment->created_at,
                        'name' => $shopPayment->shop->user->name ?? 'Unknown',
                        'username' => $shopPayment->shop->user->username ?? '',
                        'email' => $shopPayment->shop->user->email ?? '',
                        'avatar_url' => $shopPayment->shop->user->avatar_url ?? null,
                        'shop' => $shopPayment->shop,
                        'quantity' => $shopPayment->quantity,
                        'shipping_amount' => $shopPayment->shipping_amount ?? 0,
                        'shipping_info' => $shopPayment->shipping_info,
                        'status' => $deliverable->status ?? 'pending',
                        'payment_status' => $tx->status,
                        'is_deactivated' => $deliverable->is_deactivated ?? false,
                        'is_delayed' => $isDelayed,
                        'tracking_id' => $deliverable->tracking_id ?? null,
                        'courier_name' => $deliverable->courier_name ?? null,
                        'expected_delivery_date' => $deliverable->expected_delivery_date ?? null,
                        'shipped_at' => $deliverable->shipped_at ?? null,
                        'ask_question' => $shopPayment->ask_question,
                        'answer' => $shopPayment->answer,
                        'message' => $shopPayment->message,
                    ];
                } catch (\Exception $e) {
                    Log::error('Error processing transaction in ordersList purchases', ['error' => $e->getMessage(), 'tx_id' => $tx->id]);
                    return null;
                }
            });

            $formattedOrders = $formattedOrders->filter();

            return response()->json([
                'status' => true,
                'orders' => $formattedOrders,
                'all_time' => 0,
                'thirtydays' => 0,
                'total_claims' => $formattedOrders->count(),
                'user_currency' => $user->default_currency
            ]);
        }

        // Default to sales: creator's earnings
        $transactions = FinancialTransaction::where('user_id', $user->id)
            ->where('source_type', 'App\\Models\\ShopPayment')
            ->where('status', 'completed')
            ->orderBy('transaction_date', 'desc')
            ->get();

        // Calculate totals from net_amount (creator's earnings)
        $allTime = $transactions->sum('net_amount');
        $thirtyDays = $transactions
            ->where('transaction_date', '>=', Carbon::now()->subDays(30))
            ->sum('net_amount');

        // Map orders to format expected by frontend
        $formattedOrders = $transactions->map(function ($tx) {
            try {
                $shopPayment = ShopPayment::find($tx->source_id);
                if (!$shopPayment) {
                    return null;
                }

                $buyer = User::find($tx->supporter_id);
                $deliverable = \App\Models\Deliverable::where('session_id', $shopPayment->session_id)
                    ->where('product_type', 'shop_item')
                    ->where('item_id', $shopPayment->shop_id)
                    ->first();

                // Determine delay status
                $isDelayed = false;
                if ($shopPayment->shop->type === 'physical' && 
                    ($deliverable->status ?? 'pending') !== 'delivered' && 
                    ($deliverable->is_deactivated ?? false) !== true && 
                    $tx->status !== 'refunded') {
                    if (Carbon::parse($tx->transaction_date)->addDays(7)->isPast()) {
                        $isDelayed = true;
                    }
                }

                return [
                    'id' => $shopPayment->id,
                    'uuid' => $shopPayment->uuid,
                    'gross_amount' => $tx->gross_amount,
                    'net_amount' => $tx->net_amount,
                    'platform_fee' => $tx->platform_fee,
                    'stripe_fee' => $tx->stripe_fee,
                    'vat_amount' => $tx->vat_amount,
                    'reserve_amount' => $tx->reserve_amount,
                    'currency' => $tx->currency,
                    'transaction_date' => $tx->transaction_date,
                    'created_at' => $shopPayment->created_at,
                    'name' => $shopPayment->name ?? ($buyer->name ?? 'Anonymous'),
                    'username' => $buyer->username ?? '',
                    'email' => $shopPayment->email ?? ($buyer->email ?? ''),
                    'avatar_url' => $buyer->avatar_url ?? null,
                    'shop' => $shopPayment->shop,
                    'quantity' => $shopPayment->quantity,
                    'shipping_amount' => $shopPayment->shipping_amount ?? 0,
                    'shipping_info' => $shopPayment->shipping_info,
                    'status' => $deliverable->status ?? 'pending',
                    'payment_status' => $tx->status,
                    'is_deactivated' => $deliverable->is_deactivated ?? false,
                    'is_delayed' => $isDelayed,
                    'tracking_id' => $deliverable->tracking_id ?? null,
                    'courier_name' => $deliverable->courier_name ?? null,
                    'expected_delivery_date' => $deliverable->expected_delivery_date ?? null,
                    'shipped_at' => $deliverable->shipped_at ?? null,
                    'ask_question' => $shopPayment->ask_question,
                    'answer' => $shopPayment->answer,
                    'message' => $shopPayment->message,
                ];
            } catch (\Exception $e) {
                Log::error('Error processing transaction in ordersList sales', ['error' => $e->getMessage(), 'tx_id' => $tx->id]);
                return null;
            }
        });

        $formattedOrders = $formattedOrders->filter();

        return response()->json([
            'status' => true,
            'orders' => $formattedOrders,
            'all_time' => $allTime,
            'thirtydays' => $thirtyDays,
            'total_claims' => $formattedOrders->count(),
            'user_currency' => $user->default_currency
        ]);
    }

    public function answerPayment(Request $request, $payment_id)
    {
        // Try finding by session_id first (passed from frontend BuyShopItem)
        $payment = ShopPayment::where('session_id', $payment_id)->first();

        // Fallback to id or uuid if not found by session_id
        if (!$payment) {
            $payment = ShopPayment::where('id', $payment_id)
                ->orWhere('uuid', $payment_id)
                ->first();
        }

        if (!$payment) {
            return response()->json([
                'status' => false,
                'message' => 'Payment not found.'
            ]);
        }

        // If the payment has a user_id, ensure it matches the current user
        if ($payment->user_id && (!Auth::check() || Auth::id() !== $payment->user_id)) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized access to this payment.'
            ]);
        }

        if (!empty($payment->answer)) {
            return response()->json([
                'status' => false,
                'message' => 'You have already answered this question.'
            ]);
        }

        $request->validate([
            'answer' => 'required|string|max:1000'
        ]);

        $payment->answer = $request->answer;
        $payment->save();

        return response()->json([
            'status' => true,
            'message' => 'Answer submitted successfully.',
            'answer' => $payment->answer
        ]);
    }
}
