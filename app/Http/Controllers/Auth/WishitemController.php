<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\SaveWishlist;
use App\Jobs\SendUserGiftMail;
use App\Jobs\ThankyouMailToUser;
use App\Jobs\WelcomeUser;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
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
            $wish = WishItem::create([
                "user_id" => Auth::id(),
                'wishname' => $request->wishname,
                'price' => ceil($request->price),
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
                    $wish_cat->wish_id = $wish->id;
                    $wish_cat->category_id = $value;
                    $wish_cat->save();
                }
            }


            if ($request->subscription != 2) {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $request->wishname ?? null,
                    'images' => [$wish->perma_link],
                    "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => $createpriceid * 100],
                    "url" => !empty($request->item_url) ? $request->item_url : env('APP_URL') . '/' . Auth::user()->username . "?item=$wish->uuid/"
                ]);
                $wish->stripe_product_id = $stripe_client->id;
                $wish->price_id = $stripe_client->default_price;
                $wish->save();
            }

            // $user = User::whereId(Auth::id())->first();
            //send email
            // SaveWishlist::dispatch($user);
            return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been added.");
        }
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
                    $taxamount = $request->price * env('TAX_PERCENTAGE') / 100;
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
                            WishCategory::where('wish_id', $updatedata->id)->update([
                                'category_id' => $value
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
            $query->where('category_id', $category);
        }

        $itemId = $query->whereHas('wish', function ($q) use ($user_id) {
            $q->where('user_id', $user_id);
        })->pluck('wish_id');


        $user = User::where('id', $user_id)->first();
        $items = Wishitem::whereIn('id', $itemId)->latest()->get();
        // $items = WishItem::whereUserId($user->id)->latest()->get();
        $categories = UserCategory::whereUserId($user->id)->latest()->get();

        return redirect(route('user.show', ['username', $user->username, 'filter' => true]));
        // return response()->json(["items" => $items])->header('Content-Type', 'application/json');
    }


    public function addToCart($uuid, $device_id, $sub, $amount = null)
    {
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

        $cart = UserCart::where('wish_id', $wishitem->id)->where(function ($q) use ($device_id) {
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
            $cart->is_subscribed = ($sub == 'onetime' ? 0 : 1);
            if ($wishitem->subscription == 2) {
                $fullfillamount = $amount;
                $tax =  ceil($amount * env('TAX_PERCENTAGE') / 100);
                $createpriceid = $amount + $tax;
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $wishitem->wishname,
                    'images' => [$wishitem->perma_link],
                    "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => $createpriceid * 100],
                ]);
                $priceid = $stripe_client->default_price;
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
                $fullfillamount = $amount;
                $tax = ceil($amount * env('TAX_PERCENTAGE') / 100);
                $createpriceid = $amount + $amount * env('TAX_PERCENTAGE') / 100;
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $wishitem->wishname,
                    'images' => [$wishitem->perma_link],
                    "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => $createpriceid * 100],
                ]);
                $priceid = $stripe_client->default_price;
            } else {
                $fullfillamount = $wishitem->price;
                $tax = $wishitem->tax_amount;
                $priceid = null;
            }
            $cart = UserCart::create([
                "user_id" => Auth::check() ? Auth::id() : null,
                "device_id" => !Auth::check() ? $device_id : null,
                "owner_id" => $wishitem->user_id,
                'wish_id' => $wishitem->id,
                'quantity' => 1,
                'status' => 1,
                'amount' => $fullfillamount,
                'tax' => $tax,
                'is_subscribed' => ($sub == 'onetime' ? 0 : 1),
                'priceid' => $priceid,
            ]);
            return response()->json([
                "success" => true,
                'added' => true,
                "msg" => "Item added to cart.",
            ]);
        }
    }

    public function removeSurpriseFromCart($uuid)
    {
        $cart = UserCart::whereUuid($uuid)->first();
        $cart->status = 0;
        $cart->save();
        return back()->with('success', 'Item removed from cart');
        // return response()->json([
        //     "success" => true,
        //     'added' => false,
        //     'msg' => "Item removed from cart",
        //     "uuid" => $cart->uuid,
        // ]);
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

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
        $stripe_client = $stripe->products->create([
            'name' => 'Surprise Gift',
            'images' => ['https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/'],
            "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => ((ceil($request->amount) + ceil($request->amount * env('TAX_PERCENTAGE') / 100)) * 100)],
        ]);

        if (!Auth::check()) {
            UserCart::create([
                'device_id' => $request->device_id,
                'owner_id' => $request->owner_id ?? null,
                'amount' => $request->amount ?? 0,
                'tax' => ceil($request->amount * env('TAX_PERCENTAGE') / 100),
                'priceid' => $stripe_client->default_price,
                'message' => $request->message,
                'quantity' => 1,
                'status' => 1,
            ]);
            return back()->with('success', 'Surprise Gift item has been added to the cart.');
        } else {
            UserCart::create([
                'user_id' => Auth::id(),
                'owner_id' => $request->owner_id ?? null,
                'amount' => $request->amount ?? 0,
                'tax' => ceil($request->amount * env('TAX_PERCENTAGE') / 100),
                'priceid' => $stripe_client->default_price,
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
        })->with(['wish'])->orderBy('created_at','DESC')->get();

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
        ]);
    }

    public function sayThanks(Request $request, $payment_id)
    {
        $payment = StripePaymentItems::where("id", $payment_id)->first();
        $payment->message = $request->messages;
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


    public function creatorSubscriptions(){

        $subs = Subscription::where('owner_id',Auth::id())->orderBy('updated_at','DESC')->get();

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


    public function userSubscribed(){
        
        $subs = Subscription::where('user_id',Auth::id())->get();

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
}
