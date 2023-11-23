<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\SaveWishlist;
use App\Jobs\WelcomeUser;
use App\Models\StripePaymentItems;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\WishCategory;
use App\Models\WishItem;
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

            $taxamount = $request->price * env('TAX_PERCENTAGE') / 100;
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

            foreach ($request->category as $key => $value) {
                $wish_cat = new WishCategory();
                $wish_cat->uuid = Uuid::uuid4();
                $wish_cat->wish_id = $wish->id;
                $wish_cat->category_id = $value;
                $wish_cat->save();
            }


            if ($request->subscription != 2) {
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $request->wishname ?? null,
                    'images' => [$wish->perma_link],
                    "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => $createpriceid * 100],
                    "url" => !empty($request->item_url) ? $request->item_url : env('APP_URL') . '/' . Auth::user()->username . "?item=$wish->uuid/"
                ]);

                $wish->refresh();

                foreach ($request->category as $key => $value) {
                    $wish_cat = new WishCategory();
                    $wish_cat->uuid = Uuid::uuid4();
                    $wish_cat->wish_id = $wish->id;
                    $wish_cat->category_id = $value;
                    $wish_cat->save();
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
                }

                $wish->save();

                // $user = User::whereId(Auth::id())->first();

                //send email
                // SaveWishlist::dispatch($user);

                return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been added.");
            }
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


    public function addToCart($uuid, $amount = null)
    {
        $wishitem = WishItem::where('uuid', $uuid)->first();


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

        $cart = UserCart::where('wish_id', $wishitem->id)->where("user_id", Auth::id())->first();
        if ($cart) {

            if ($cart->status == 0) {
                $cart->status = 1;
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
                $cart->status = 0;
                $cart->save();

                return response()->json([
                    "success" => true,
                    'added' => false,
                    'msg' => "Item removed from cart",
                    "uuid" => $cart->uuid,
                ]);
            }
        } else {
            if ($wishitem->subscription == 2) {
                $fullfillamount = $amount;
                $tax =  $amount * env('TAX_PERCENTAGE') / 100;
                $createpriceid = $amount + $amount * env('TAX_PERCENTAGE') / 100;
                $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
                $stripe_client = $stripe->products->create([
                    'name' => $wishitem->wishname,
                    'images' => [$wishitem->perma_link],
                    "default_price_data" => ["currency" => "gbp", "unit_amount_decimal" => $createpriceid],
                ]);
                $priceid = $stripe_client->default_price;
            } else {
                $fullfillamount = $wishitem->price;
                $tax = $wishitem->tax_amount;
                $priceid = null;
            }

            $cart = UserCart::create([
                "user_id" => Auth::id(),
                "owner_id" => $wishitem->user_id,
                'wish_id' => $wishitem->id,
                'status' => 1,
                'amount' => $fullfillamount,
                'tax' => $tax,
                'priceid' => $priceid,
            ]);

            return response()->json([
                "success" => true,
                'added' => true,
                "msg" => "Item added to cart.",
            ]);
        }
    }

    public function cartItems()
    {
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
                'wish' => $wish->wish->toArray(),
                'owner' => $wish->owner->toArray(),
                'url' => $wish->wish->perma_link,
                'amount' => $wish->amount,
                'priceid' => $wish->priceid,
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

            foreach ($value as $k => $v) {
                if ($v['wish']['subscription'] == 2) {
                    $price = $v['amount'];
                    $priceid = $v['priceid'];
                } else {
                    $price = $v['wish']['price'];
                    $priceid = $v['wish']['price_id'];
                }

                $cart[$key]['items'][$k] = [
                    'id' => $v['wish']['id'],
                    'uuid' => $v['wish']['uuid'],
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
                ];

                if ($v['wish']['subscription'] == 2) {
                    $total += $v['amount'];
                } else {
                    $total += $v['wish']['price'];
                }
            }
            $cart[$key]['total'] = $total;
            $cart[$key]['fee'] = ceil($total * env('TAX_PERCENTAGE') / 100);

            $key++;
        }

        return Inertia::render('cart/Cart', [
            "carts" => $cart,
        ]);
    }
}
