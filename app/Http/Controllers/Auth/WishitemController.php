<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\MakeAutoTweets;
use App\Jobs\SaveWishlist;
use App\Jobs\SendUserGiftMail;
use App\Jobs\ThankyouMailToUser;
use App\Jobs\WelcomeUser;
use App\Mail\CheckError;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Subscription;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\TwitterToken;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Rules\ValidSubscriptionPeriod;
use App\StripeControl;
use App\TwitterAuthService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Ramsey\Uuid\Nonstandard\Uuid as NonstandardUuid;
use Ramsey\Uuid\Uuid;
use Stripe\StripeClient;

class WishitemController extends Controller
{

    public function saveWishItem(Request $request): RedirectResponse
    {
        $request->validate([
            "wishname" => [
                "required",
                "string",
                "min:4",
                "max:255"
            ],
            "price" => [
                "required",
                "numeric",
                "min:0"
            ],
            "item_url" => [
                "nullable"
            ],
            "fullfill_amount" => [
                "nullable"
            ],
            "thumbnail" => [
                "sometimes",
                "nullable"
            ],
            "subscription_period" => [
                "sometimes",
                "nullable",
            ],
            "subscription" => [
                "required",
                "integer",
                Rule::in([0, 1, 2])
            ],
            "repeat_purchase" => [
                "sometimes",
                "nullable"
            ],
            "category" => [
                "sometimes",
                "nullable"
            ]
        ]);

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. Paypig, Findom, Worship, Unlock, Unblock, Receive,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {

            $taxamount = $request->price * env('TAX_PERCENTAGE', 20) / 100;
            $createpriceid = ceil($request->price) + ceil($taxamount);
            $user = User::find(Auth::id());
            $wish = WishItem::create([
                "user_id" => Auth::id(),
                'wishname' => $request->wishname,
                'price' => ceil($request->price),
                'currency' => $user->default_currency,
                'item_url' => $request->item_url != "" ? $request->item_url : null,
                'thumbnail' => $request->thumbnail ?? null,
                'subscription' => $request->subscription,
                'subscription_period' => $request->subscription_period ?? null,
                'repeat_purchase' => $request->repeat_purchase ?? 0,
                'tax_amount' => ceil($taxamount),
                // 'category' => $request->category ?? null,
            ]);

            $wish->refresh();

            if (!empty($request->category)) {
                foreach ($request->category as $key => $value) {
                    $wish_cat = new WishCategory();
                    $wish_cat->uuid = Uuid::uuid4();
                    $wish_cat->wish_item_id = $wish->id;
                    $wish_cat->user_category_id = $value;
                    $wish_cat->save();
                }
            }


            if ($request->subscription != 2) {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $request->wishname ?? null,
                    'images' => [$wish->perma_link],
                    "default_price_data" => [
                        "currency" => "gbp",
                        "unit_amount_decimal" => $createpriceid * 100
                    ],
                    "url" => !empty($request->item_url) ? $request->item_url : env('APP_URL') . '/' . Auth::user()->username . "?item=$wish->uuid/"
                ]);
                $wish->stripe_product_id = $stripe_client->id;
                $wish->price_id = $stripe_client->default_price;
                $wish->save();
            }


            return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been added.");
        }
    }

    /**
     * Create A WishList Item
     *
     * @param Request $request
     * @return mixed
     */
    public function addWishItem(Request $request)
    {
        $request->validate(
            [
                "wishname" => [
                    "required",
                    "string",
                    "min:4",
                    "max:255"
                ],
                "price" => [
                    "required",
                    "numeric",
                    "min:0"
                ],
                "item_url" => [
                    "nullable"
                ],
                "fullfill_amount" => [
                    "nullable"
                ],
                "thumbnail" => [
                    "sometimes",
                    "nullable"
                ],
                "subscription" => [
                    "required",
                    "integer",
                    Rule::in([0, 1, 2])
                ],
                "subscription_period" => [
                    "required_if:subscription,1",
                    new ValidSubscriptionPeriod
                ],
                "repeat_purchase" => [
                    "sometimes",
                    "nullable"
                ],
                "category" => [
                    "sometimes",
                    "nullable"
                ]
            ],
            [
                'subscription_period.required_if'   =>  'Please select subscription period'
            ]
        );

        // return response()->json([
        //     "data" => $request->all()
        // ]);

        if (Helpers::checkBlockData($request) == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. Paypig, Findom, Worship, Unlock, Unblock, Receive,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        }

        // if (Helpers::checkUnsafeContent($request->thumbnail)) {
        //     return redirect()->back()->with("error", "NSFW Detected in the media content. Try alternative.");
        // }

        $user = User::find(Auth::id());
        $price = Helpers::priceFormat($request->cookie('currency', 'GBP'), $request->price, $user->default_currency);

        // $price = round($request->price, 2, PHP_ROUND_HALF_UP);
        $taxamount = round(($price * env('TAX_PERCENTAGE', 20) / 100), 2, PHP_ROUND_HALF_UP);
        $createpriceid = $price + $taxamount;

        $wish = WishItem::create([
            "user_id" => Auth::id(),
            'wishname' => $request->wishname,
            'price' => $price,
            'currency' => $user->default_currency,
            'item_url' => $request->item_url != "" ? $request->item_url : null,
            'thumbnail' => $request->thumbnail ?? null,
            'subscription' => $request->subscription,
            'subscription_period' => $request->subscription_period ?? null,
            'repeat_purchase' => $request->repeat_purchase ?? 0,
            'tax_amount' => $taxamount,
            // 'category' => $request->category ?? null,
        ]);

        $wish->refresh();

        if (!empty($request->category)) {
            foreach ($request->category as $key => $value) {
                $wish_cat = new WishCategory();
                $wish_cat->uuid = Uuid::uuid4();
                $wish_cat->wish_item_id = $wish->id;
                $wish_cat->user_category_id = $value;
                $wish_cat->save();
            }
        }

        if (in_array($request->subscription, [0, 1])) {

            $productPayload = [
                "name"  =>  $wish->wishname,
                "images" => [$wish->perma_link],
                "default_price_data"    =>  [
                    "currency"  =>  $user->default_currency,
                    "unit_amount_decimal"   => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100,
                ],
                "url"   =>  $request->item_url ?? env('APP_URL') . '/' . $user->username . "?item=$wish->uuid/"
            ];

            if ($request->subscription == 1) {
                $productPayload['default_price_data']['recurring']  =   [
                    'interval'  =>  StripeControl::$periods[$request->subscription_period],
                    'interval_count'    =>  1
                ];
            }

            try {
                $product = StripeControl::createProduct($productPayload);
                $wish->stripe_product_id = $product->id;
                $wish->price_id = $product->default_price;
                $wish->save();

                if ($wish->user->auto_tweet == 1) {
                    MakeAutoTweets::dispatch($wish->user);
                }
            } catch (Exception $e) {
                $wish->delete();
                return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
            }
        }

        return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been added.");
    }


    public function updateWishItem(Request $request, $uuid = null)
    {
        try {
            $wish = WishItem::where('uuid', $uuid)->first();
            $checkdata = Helpers::checkBlockData($request);
            if ($checkdata == 1) {
                return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. Paypig, Findom, Worship, Unlock, Unblock, Receive,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
            } else {
                if (!empty($request->price)) {
                    $taxamount = $request->price * env('TAX_PERCENTAGE', 20) / 100;
                    $price = $request->price;
                    $createpriceid = $taxamount + $price;
                } else {
                    $taxamount = $wish->tax_amount;
                    $price = $wish->price;
                    $createpriceid = $taxamount + $price;
                }
                if (!empty($wish)) {
                    $updatedata = WishItem::where('uuid', $uuid)->update([
                        "user_id" => Auth::id(),
                        'wishname' => $request->wishname ?? $wish->wishname,
                        'price' => $price,
                        'item_url' => $request->item_url != "" ? $request->item_url : $wish->item_url,
                        'thumbnail' => $request->thumbnail ?? $wish->thumbnail,
                        'subscription' => $request->subscription ?? $wish->subscription,
                        'subscription_period' => $request->subscription_period ?? $wish->subscription_period,
                        'repeat_purchase' => $request->repeat_purchase ??
                            $wish->repeat_purchase,
                        'fullfill_amount' => $request->fullfill_amount ??
                            $wish->fullfill_amount,
                        'tax_amount' => $taxamount,
                    ]);


                    $updatedata->refresh();
                    if (!empty($request->category)) {
                        foreach ($request->category as $key => $value) {
                            WishCategory::where('wish_item_id', $updatedata->id)->update([
                                'user_category_id' => $value
                            ]);
                            // $wish_cat = new WishCategory();
                            // $wish_cat->uuid = Uuid::uuid4();
                            // $wish_cat->wish_id = $updatedata->id;
                            // $wish_cat->category_id = $value;
                            // $wish_cat->save();
                        }
                    }

                    $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                    $stripe_client = $stripe->products->update([
                        'name' => $request->wishname ?? $wish->wishname,
                        'images' => [$updatedata->perma_link],
                        "default_price_data" => ["currency" => "usd", "unit_amount_decimal" => $createpriceid * 100],
                        // "url" => $request->item_url ?? null
                    ]);

                    $updatedata->stripe_product_id = $stripe_client->id;
                    $updatedata->price_id = $stripe_client->default_price;
                    $updatedata->save();

                    $user = User::whereId(Auth::id())->first();
                    //send email
                    SaveWishlist::dispatch($user);
                    return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been updated.");
                }
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function saveUserCategory(Request $request): RedirectResponse
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

        $categories = UserCategory::where('user_id', Auth::id())->get();
        foreach ($categories as $key => $value) {
            if ($request->category == $value->category) {
                return back()->with('error', 'Category is already exists.');
            }
        }

        UserCategory::create([
            "user_id" => Auth::id(),
            'category' => $request->category ?? null,
        ]);

        return back()->with('success', 'Category Saved.');
    }


    public function wishItems(Request $request): RedirectResponse
    {
        $categories = UserCategory::where('user_id', Auth::id())->get();
        UserCategory::create([
            "user_id" => Auth::id(),
            'category' => $request->category ?? null,
        ]);
        return back()->with('success', 'Category Saved.');
    }


    public function categoryItems($category, $user_id)
    {

        $query = WishCategory::orderBy('created_at', 'DESC');
        if ($category != 'all') {
            $query->where('user_category_id', $category);
        }
        $itemId = $query->whereHas('wish', function ($q) use ($user_id) {
            $q->where('user_id', $user_id);
        })->pluck('wish_item_id');
        $user = User::where('id', $user_id)->where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->first();
        $items = Wishitem::whereIn('id', $itemId)->latest()->get();
        // $items = WishItem::whereUserId($user->id)->latest()->get();
        $categories = UserCategory::whereUserId($user->id)->latest()->get();
        return redirect(route('user.show', ['username', $user->username, 'filter' => true]));
        // return response()->json(["items" => $items])->header('Content-Type', 'application/json');
    }


    public function addToCart($uuid, $device_id, $sub, $amount = null)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';

        $amount = round($amount, 2, PHP_ROUND_HALF_UP);
        $wishitem = WishItem::where('uuid', $uuid)->first();
        if (Auth::check()) {
            if (Auth::id() == $wishitem->user_id) {
                return response()->json([
                    "success" => true,
                    "msg" => "You are not able to add your item to your cart.",
                ]);
            }


            $payment = StripePaymentItems::where('wish_item_id', $wishitem->id)->whereHas('payment', function ($q) {
                $q->where('user_id', Auth::id());
            })->first();

            if ($wishitem->subscription == 0 && $wishitem->repeat_purchase == 0 && !empty($payment)) {
                return response()->json([
                    "success" => false,
                    "msg" => "You can pay only once for this wish.",
                ]);
            }
        }

        $cart = UserCart::where('wish_item_id', $wishitem->id)->where(function ($q) use ($device_id) {
            if (Auth::check()) {
                $q->where("user_id", Auth::id());
            } else {
                $q->where("device_id", $device_id);
            }
        })->first();
        if ($cart) {

            if ($cart->status == 1) {
                $cart->quantity = $cart->quantity + 1;
            } else {
                $cart->quantity = 1;
            }
            $cart->status = 1;
            $cart->is_subscribed = ($sub == 'onetime' || $sub == false) ? 0 : 1;
            if ($wishitem->subscription == 2) {

                $price = Helpers::priceFormat($currency, $amount, $cart->owner->default_currency);
                $fullfillamount = $price;
                $tax =  round(($price * env('TAX_PERCENTAGE') / 100), 2, PHP_ROUND_HALF_UP);
                $createpriceid = $price + $tax;
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $wishitem->wishname,
                    'images' => [$wishitem->perma_link],
                    "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100],
                ]);
                $priceid = $stripe_client->id;
            } else {
                $fullfillamount = $wishitem->price;
                $tax = $wishitem->tax_amount;
                $priceid = null;
            }
            $cart->amount = $fullfillamount;
            $cart->tax = $tax;
            $cart->priceid = $priceid;
            $cart->save();
            return response()->json([
                "success" => true,
                'added' => true,
                "uuid" => $cart->uuid,
                "msg" => "Item added to cart.",
            ]);
        } else {
            if ($wishitem->subscription == 2) {
                $price = Helpers::priceFormat($currency, $amount, $wishitem->user->default_currency);
                $fullfillamount = $price;
                $tax = round(($price * env('TAX_PERCENTAGE') / 100), 2, PHP_ROUND_HALF_UP);
                $createpriceid = $price + $tax;
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $wishitem->wishname,
                    'images' => [$wishitem->perma_link],
                    "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" =>  round($createpriceid, 2, PHP_ROUND_HALF_UP) * 100],
                ]);
                $priceid = $stripe_client->id;
            } else {
                $fullfillamount = $wishitem->price;
                $tax = $wishitem->tax_amount;
                $priceid = null;
            }
            $cart = UserCart::create([
                "user_id" => Auth::check() ? Auth::id() : null,
                "device_id" => !Auth::check() ? $device_id : null,
                "owner_id" => $wishitem->user_id,
                'wish_item_id' => $wishitem->id,
                'quantity' => 1,
                'status' => 1,
                'amount' => $fullfillamount,
                'tax' => $tax,
                'is_subscribed' => ($sub == false || $sub == 'onetime') ? 0 : 1,
                'priceid' => $priceid,
            ]);
            return response()->json([
                "success" => true,
                'added' => true,
                "msg" => "Item added to cart.",
            ]);
        }
    }

    public function clearCart($deviceid, $ownerid)
    {
        $query = UserCart::where('owner_id', $ownerid)->where('status', 1);
        if (Auth::check()) {
            $query->where('user_id', Auth::id());
        } else {
            $query->where('device_id', $deviceid);
        }
        $query->update(['status' => 0]);
        $this->cartItems();
    }

    public function removeSurpriseFromCart($uuid)
    {
        $cart = UserCart::whereUuid($uuid)->first();
        $cart->status = 0;
        $cart->save();
        return back()->with('success', 'Item removed from cart');
    }

    public function cartItems()
    {
        if (!empty(Auth::id())) {
            $user = User::where('id', Auth::id())->first();
            $carts = UserCart::where('user_id', $user->id)->where('status', 1)->get();

            $groupedWishes = [];
            foreach ($carts as $wish) {
                $owner_id = $wish->owner_id;
                if (!isset($groupedWishes[$owner_id])) {
                    $groupedWishes[$owner_id] = [];
                }

                $groupedWishes[$owner_id][] = [
                    'user' => $wish->user->toArray(),
                    'wish' => $wish->wish ? $wish->wish->toArray() : [],
                    'owner' => $wish->owner->toArray(),
                    'url' => $wish->wish ? $wish->wish->perma_link : 'https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/',
                    'amount' => $wish->amount,
                    'priceid' => $wish->priceid,
                    'uuiddata' => $wish->uuid,
                    'tax' => $wish->tax,
                    'surprisemessage' => $wish->message ?? '',
                    'quantity' => $wish->quantity ?? '',
                ];
            }

            $cart = [];
            $key = 0;
            foreach ($groupedWishes as $value) {
                $cart[$key] = [
                    'user' => [
                        'id' => $value[0]['owner']['id'],
                        'name' => $value[0]['owner']['name'],
                        'username' => $value[0]['owner']['username'],
                        'uuid' => $value[0]['owner']['uuid'],
                        'default_currency' => $value[0]['owner']['default_currency'],
                    ],

                ];

                $total = 0;
                $fee = 0;
                foreach ($value as $k => $v) {
                    // if ($v['wish']['subscription'] == 2) {
                    //     $price = $v['amount'];
                    //     $priceid = $v['priceid'];
                    // } else {
                    //     $price = $v['wish']['price'] ;
                    //     $priceid = $v['wish']['price_id'];
                    // }

                    $price = $v['amount'] ? $v['amount'] : $v['wish']['price'];
                    $priceid = $v['priceid'] ? $v['priceid'] : $v['wish']['price_id'];

                    if (!empty($v['wish'])) {
                        $cart[$key]['items'][$k] = [
                            'id' => $v['wish']['id'],
                            'uuid' => $v['uuiddata'],
                            'user_id' => $v['wish']['user_id'],
                            'wishname' => $v['wish']['wishname'],
                            'stripe_product_id' => $v['wish']['stripe_product_id'],
                            'price' => $price,
                            'price_id' => $priceid,
                            'item_url' => $v['wish']['item_url'],
                            'subscription' => $v['wish']['subscription'],
                            'subscription_period' => $v['wish']['subscription_period'],
                            'repeat_purchase' => $v['wish']['repeat_purchase'],
                            'category' => $v['wish']['category'],
                            'url' => $v['url'],
                            'quantity' => $v['quantity'],

                        ];
                    } else {
                        $cart[$key]['items'][$k] = [
                            'price' => $price,
                            'wishname' => 'Surprise Gift',
                            'uuid' => $v['uuiddata'],
                            'price_id' => $priceid,
                            'product' => 'surprise',
                            'url' => $v['url'],
                            'surprise_message' => $v['surprisemessage'],
                            'quantity' => $v['quantity'],
                        ];
                    }
                    // if ($v['wish']['subscription'] == 2) {
                    //     $total += $v['amount'];
                    // } else {
                    //     $total += $v['wish']['price'];
                    // }
                    $total += !empty($v['priceid']) ? $v['amount'] : $v['wish']['price'];
                    $fee += !empty($v['priceid']) ? $v['tax'] : $v['wish']['tax_amount'];
                }
                $cart[$key]['total'] = $total;
                $cart[$key]['fee'] = $fee;

                $key++;
            }
        } else {
            $cart = [];
        }
        return Inertia::render('cart/Cart', [
            "carts" => $cart,
        ]);
    }

    public function anonymousCartItems($deviceId)
    {
        $carts = UserCart::where('device_id', $deviceId)->where('status', 1)->get();
        $groupedWishes = [];
        foreach ($carts as $wish) {
            $owner_id = $wish->owner_id;
            if (!isset($groupedWishes[$owner_id])) {
                $groupedWishes[$owner_id] = [];
            }

            $groupedWishes[$owner_id][] = [
                'user' => $wish->user ? $wish->user->toArray() : [], // Check if user is not null
                'wish' => $wish->wish ? $wish->wish->toArray() : [],
                'owner' => $wish->owner ? $wish->owner->toArray() : [],
                'url' => $wish->wish ? $wish->wish->perma_link : 'https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/',
                'amount' => $wish->amount,
                'priceid' => $wish->priceid,
                'uuiddata' => $wish->uuid,
                'tax' => $wish->tax,
                'surprisemessage' => $wish->message ?? '',
                'quantity' => $wish->quantity ?? '',
            ];
        }
        $cart = [];
        $key = 0;
        foreach ($groupedWishes as $value) {
            $cart[$key] = [
                'user' => [
                    'id' => $value[0]['owner']['id'] ?? null,
                    'name' => $value[0]['owner']['name'] ?? null,
                    'username' => $value[0]['owner']['username'] ?? null,
                    'uuid' => $value[0]['owner']['uuid'] ?? null,
                    'default_currency' => $value[0]['owner']['default_currency']
                ],
            ];

            $total = 0;
            $fee = 0;
            foreach ($value as $k => $v) {
                $price = $v['amount'] ? $v['amount'] : ($v['wish']['price'] ?? null);
                $priceid = $v['priceid'] ? $v['priceid'] : ($v['wish']['price_id'] ?? null);

                if (!empty($v['wish'])) {
                    $cart[$key]['items'][$k] = [
                        'id' => $v['wish']['id'] ?? null,
                        'uuid' => $v['uuiddata'] ?? null,
                        'user_id' => $v['wish']['user_id'] ?? null,
                        'wishname' => $v['wish']['wishname'] ?? null,
                        'stripe_product_id' => $v['wish']['stripe_product_id'] ?? null,
                        'price' => $price,
                        'price_id' => $priceid,
                        'item_url' => $v['wish']['item_url'] ?? null,
                        'subscription' => $v['wish']['subscription'] ?? null,
                        'subscription_period' => $v['wish']['subscription_period'] ?? null,
                        'repeat_purchase' => $v['wish']['repeat_purchase'] ?? null,
                        'category' => $v['wish']['category'] ?? null,
                        'url' => $v['url'],
                        'quantity' => $v['quantity'] ?? null,
                    ];
                } else {
                    $cart[$key]['items'][$k] = [
                        'price' => $price,
                        'wishname' => 'Surprise Gift',
                        'uuid' => $v['uuiddata'] ?? null,
                        'price_id' => $priceid,
                        'product' => 'surprise',
                        'url' => $v['url'],
                        'surprise_message' => $v['surprisemessage'] ?? null,
                        'quantity' => $v['quantity'] ?? null,
                    ];
                }

                $total += !empty($v['priceid']) ? $v['amount'] : ($v['wish']['price'] ?? 0);
                $fee += !empty($v['priceid']) ? $v['tax'] : ($v['wish']['tax_amount'] ?? 0);
            }
            $cart[$key]['total'] = $total;
            $cart[$key]['fee'] = $fee;

            $key++;
        }
        return response()->json([
            "success" => true,
            "carts" => $cart,
        ]);
    }

    public function sendSurprise(Request $request)
    {
        $request->validate([
            "message" => ["required", "string"],
            "amount" => ["required"],
        ]);

        $wordLimit = 100;
        $message = $request->message;
        if (str_word_count($message) > $wordLimit) {
            return redirect()->back()->with("error", "Max limit for message is 100 words");
        }

        $owner = User::where('id', $request->owner_id)->where(function ($q) {
            $q->whereNot('country', 'GB')->orWhereNull('country');
        })->first();

        $price = Helpers::priceFormat(request()->cookie('currency'), $request->amount, $owner->default_currency);
        // $price = round($request->amount, 2, PHP_ROUND_HALF_UP);
        $tax = round(($price * env('TAX_PERCENTAGE') / 100), 2, PHP_ROUND_HALF_UP);

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
        $stripe_client = $stripe->products->create([
            'name' => 'Surprise Gift',
            'images' => ['https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/'],
            "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => round(($price + $tax), 2, PHP_ROUND_HALF_UP) * 100],
        ]);

        if (!Auth::check()) {
            UserCart::create([
                'device_id' => $request->device_id,
                'owner_id' => $request->owner_id ?? null,
                'amount' => $price,
                'tax' => $tax,
                'priceid' => $stripe_client->id,
                'message' => $request->message,
                'quantity' => 1,
                'status' => 1,
            ]);
            return back()->with('success', 'Surprise Gift item has been added to the cart.');
        } else {
            UserCart::create([
                'user_id' => Auth::id(),
                'owner_id' => $request->owner_id ?? null,
                'amount' => $price,
                'tax' => $tax,
                'priceid' => $stripe_client->id,
                'message' => $request->message,
                'quantity' => 1,
                'status' => 1,
            ]);
            return back()->with('success', 'Surprise Gift item has been added to the cart.');
        }
    }

    public function noOfCartItems()
    {
        $items = UserCart::where('user_id', Auth::id())->where('status', 1)->count();
        return response()->json([
            "success" => true,
            "counts" => $items,
        ]);
    }

    public function updateCartQuantity($uuid, $quantity)
    {
        try {
            $cart = UserCart::whereUuid($uuid)->first();
            if (!empty($cart)) {
                $cart->quantity = $quantity ?? 1;
                $cart->save();
                // return back()->with('success', 'Quantity updated successfully.');
                return response()->json([
                    "success" => true,
                    "message" => 'Quantity updated successfully',
                ]);
            } else {
                // return back()->with('error', 'Failed  to update quantity.');
                return response()->json([
                    "success" => false,
                    "message" => 'Unable to update quantity',
                ]);
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function wish_counter($deviceid)
    {
        if (!Auth::check()) {
            $items = UserCart::where('device_id', $deviceid ?? null)->where('status', 1)->count();
            return response()->json([
                "success" => true,
                "counter" => $items,
            ]);
        } else {
            $user = Auth::user();
            $items = UserCart::where('user_id', $user->id ?? null)->where('status', 1)->count();
            return response()->json([
                "success" => true,
                "counter" => $items,
            ]);
        }
    }

    public function wishtrackerItems()
    {
        $user = Auth::user();
        $tracks = StripePaymentItems::whereHas('payment', function ($query) use ($user) {
            $query->where('user_id', $user->id)->orWhere('owner_id', $user->id);
        })->with(['wish'])->orderBy('created_at', 'DESC')->get();
        $creator_subs = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with(['user', 'wish_item'])->orderBy('updated_at', 'DESC')->get();
        $user_subs = WishItemSubscription::where('user_id', Auth::id())->with(['wish_item', 'wish_item.user'])->get();

        $trackData = $tracks->map(function ($q) {

            if (Auth::id() == $q->payment->owner_id) {
                $q->user = $q->payment->user ?? false;
            } elseif (Auth::id() == $q->payment->user_id) {
                $q->user = $q->payment->owner;
            }
            $q->cart_message = $q->payment->message ?? null;
            $q->surprise_message = $q->cart->message ?? null;
            return $q;
        });

        return Inertia::render('tracker/Wishtracker', [
            "tracks" => $trackData,  
            "creator_subs" => $creator_subs,
            "user_subs" => $user_subs,
        ]);
    }

    public function sayThanks(Request $request, $payment_id)
    {
        $media = $request->message_media;
        $payment = StripePaymentItems::where("id", $payment_id)->first();
        // $payment->message = $request->messages;
        $payment->thankyou_message = $request->messages;
        $payment->is_read_user = 0;
        $payment->message_media = $media['uuid'] ?? null;
        $payment->media_type = $media['contentInfo']['mime']['type'] ?? null;
        $payment->save();
        ThankyouMailToUser::dispatch($payment);
        return response()->json([
            "success" => true,
            "message" => 'Message sent !!',
        ]);
    }


    public function readStatus($payment_id, $type)
    {
        $payment = StripePaymentItems::where("id", $payment_id)->first();
        if ($type == 'owner') {
            $payment->is_read_owner = 1;
        } elseif ($type == 'user') {
            $payment->is_read_user = 1;
        }
        $payment->save();
        return Inertia::render('tracker/Wishtracker');
    }

    public function creatorSubscriptions()
    {
        $subs = Subscription::where('owner_id', Auth::id())->orderBy('updated_at', 'DESC')->get();
        $data = [];
        foreach ($subs as $key => $value) {
            $data[] = [
                'user' => [
                    'name' => $value->user->name,
                    'username' => $value->user->username,
                    'avatar_url' => $value->user->avatar_url,
                    'cover_url' => $value->user->cover_url,
                    'email' => $value->user->email,
                ],
                'wish' => [
                    'wishname' => $value->wish->wishname,
                    'price' => $value->wish->price,
                    'tax_amount' => $value->wish->tax_amount,
                    'item_url' => $value->wish->item_url,
                    'perma_link' => $value->wish->perma_link,
                ],
                'uuid' => $value->uuid,
                'start_at' => $value->start_at,
                'end_at' => $value->end_at,
                'status' => $value->status,
            ];
        }
        return Inertia::render('tracker/Wishtracker');
    }



    public function userSubscribed()
    {
        $subs = Subscription::where('user_id', Auth::id())->get();
        $data = [];
        foreach ($subs as $key => $value) {
            $data[] = [
                'owner' => [
                    'name' => $value->owner->name,
                    'username' => $value->owner->username,
                    'avatar_url' => $value->owner->avatar_url,
                    'cover_url' => $value->owner->cover_url,
                    'email' => $value->owner->email,
                ],
                'wish' => [
                    'wishname' => $value->wish->wishname,
                    'price' => $value->wish->price,
                    'tax_amount' => $value->wish->tax_amount,
                    'item_url' => $value->wish->item_url,
                    'perma_link' => $value->wish->perma_link,
                ],
                'uuid' => $value->uuid,
                'start_at' => $value->start_at,
                'end_at' => $value->end_at,
                'status' => $value->status,
            ];
        }
        return Inertia::render('tracker/Wishtracker');
    }

    public function cancelSubscription($subscription_id)
    {
        $item = WishItemSubscription::where('id', $subscription_id)->first();
        $item->status = 0;
        $item->save();
        return Inertia::render('tracker/Wishtracker');
    }


    public function pinItem($wish_id)
    {
        $item = WishItem::where('id', $wish_id)->first();

        if ($item->user_id == Auth::id()) {
            WishItem::where('user_id', Auth::id())->update(['is_pin' => 0]);

            $item->is_pin = 1;
            $item->save();

            return response()->json([
                'status' => true,
                'msg' => 'Item is pinned'
            ]);
        } else {
            return response()->json([
                'status' => false,
                'msg' => 'You can pin only your wishlist!'
            ]);
        }
    }


    /**
     * Add a new tip jar goal
     *
     * @param Request $request
     * @return mixed
     */
    public function addTipGoal(Request $request)
    {
        $currency = !empty($request->cookie('currency')) ? $request->cookie('currency') : "gbp";
        $request->validate(
            [
                "name" => [
                    "required",
                    "string",
                ],
                "target" => [
                    "required",
                    "numeric",
                ],
                "default_price" => [
                    "nullable"
                ],
                "duration" => [
                    'required',
                    'numeric'
                ],
            ]
        );

        $user = User::where('id', Auth::id())->first();

        $target = Helpers::priceFormat($currency, $request->target, $user->default_currency);
        $price = Helpers::priceFormat($currency, $request->default_price, $user->default_currency);

        $goal = TipGoal::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'target' => $target,
            'default_price' => ceil($price),
            'description' => $request->description ?? null,
            'status' => $request->duration,
            'days' => ($request->duration == 1) ? 30 : null,
            'currency' => $user->default_currency,
        ]);

        $goal->refresh();

        if ($goal->status == 1) {
            $goal->completed_at = Carbon::now()->addDays($goal->days);
            $goal->save();
        }

        // $productPayload = [
        //     "name"  =>  $goal->name,
        //     "images" => ["https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/"],
        //     "default_price_data"    =>  [
        //         "currency"  =>  $user->default_currency,
        //         "unit_amount_decimal"   => $createpriceid * 100,
        //     ],
        //     "url"   => env('APP_URL') . '/' . $user->username . "?goal=$goal->uuid/"
        // ];
        // try {
        //     $product = StripeControl::createProduct($productPayload);
        //     $goal->product_id = $product->id;
        //     $goal->price_id = $product->default_price;
        //     $goal->save();
        // } catch (Exception $e) {
        //     $goal->delete();
        //     return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
        // }

        return back()->with('success', 'Tip Goal added successfully!');
    }

    /**
     * Change wishes listing order
     *
     * @param Request $request
     * @return mixed
     */
    public function moveWishes(Request $request)
    {
        $request->validate([
            'shuffled_items' => [
                'required',
            ]
        ]);

        foreach ($request->shuffled_items as $key => $value) {
            WishItem::where('id', $value)->update(['sort' => $key]);
        }

        return response()->json([
            'status' => true,
            'msg' => "Shuffled Successfully!"
        ]);
    }


    /**
     * List a tip jar goal
     *
     * @param $uuid uuid of user
     * @return mixed
     */
    public function listGoal($uuid)
    {

        TipGoal::where('status', 1)->where('completed', 0)->where('completed_at', '<', Carbon::now())->update(['completed' => 1]);

        $goal = TipGoal::whereHas('user', function ($q) use ($uuid) {
            $q->where('uuid', $uuid);
        })->where('completed', 0)->first();

        return response()->json([
            'status' => true,
            'goal' => $goal
        ]);
    }


    /**
     * Mark as completed the tip jar goal
     *
     * @param $uuid uuid of tip jar
     * @return mixed
     */
    public function markJarComplete($uuid)
    {

        $goal = TipGoal::where('uuid', $uuid)->where('completed', 0)->first();

        $goal->completed = 1;
        $goal->completed_at = Carbon::now();
        $goal->save();

        return back()->with('success', 'Goal marked as completed.');
    }



    /**
     * All tip jar goals of a creator
     *
     * @return mixed
     */
    public function allGoalsCreators()
    {

        $goals = TipGoal::where('user_id', Auth::id())->get();

        return response()->json([
            'status' => true,
            'goals' => $goals
        ]);
    }



     /**
     * User tips send or get
     *
     * @return mixed
     */
    public function userTips(){
        $user = Auth::user();

        $user_tips = TipGoalsPayment::whereHas('tipGoal',function($q) use($user){
            $q->where('user_id',$user->id);
        })->with('tipGoal')->orWhere('user_id',$user->id)->get();

        $tips = $user_tips->map(function($q){
            $q->owner = $q->tipGoal->user;
            return $q;
        });

        return response()->json([
            'status' => true,
            'tips' => $tips
        ]);
    }


    /**
     * Enable disable the auto tweet
     *
     * @return mixed
     */
    public function enableAutoTweet()
    {

        $user = User::where('id',Auth::id())->first();

        if($user->auto_tweet == 1){
            $user->auto_tweet = 0;
        }else{
            $user->auto_tweet = 1;
        }

        $user->save();

        return back()->with('success','Auto tweet is '. $user->auto_tweet == 1 ? 'Enabled.' : 'Disabled.');
    }
}
