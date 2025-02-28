<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Helpers\JwtHelper;
use App\Http\Controllers\Controller;
use App\Jobs\CheckAdultContent;
use App\Jobs\AutoTweetWishAdd;
use App\Jobs\CheckoutTweet;
use App\Jobs\CrowdfundTweet;
use App\Jobs\MakeAutoTweets;
use App\Jobs\SaveWishlist;
use App\Jobs\SendThankYouMailAdmin;
use App\Jobs\SendUserGiftMail;
use App\Jobs\SubscribeAutoTweet;
use App\Jobs\SurpriseTweet;
use App\Jobs\ThankyouMailToUser;
use App\Jobs\TipJarTweet;
use App\Jobs\WelcomeUser;
use App\Mail\CheckError;
use App\Models\BillPayment;
use App\Models\CreatorShippingAddress;
use App\Models\Logs;
use App\Models\MembershipPayment;
use App\Models\ProductOrderDetail;
use App\Models\RyeCart;
use App\Models\RyeProduct;
use App\Models\RyeProductPayment;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\Subscription;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\TwitterToken;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserCategory;
use App\Models\UserIntro;
use App\Models\WishCategory;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Rules\ValidSubscriptionPeriod;
use App\StripeControl;
use App\TwitterAuthService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
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
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {

            $user = User::find(Auth::id());
            $taxamount = $request->price * config('app.single_tax') / 100;
            $adminFee = config('app.administration_fee');
            $adminFees = Helpers::priceFormat('GBP', $adminFee, $user->default_currency);
            // $taxamount = $request->price * env('TAX_PERCENTAGE', 20) / 100; // commented old code which written by saurav sir
            $createpriceid = ceil($request->price) + ceil($taxamount) + ceil($adminFees);
            $totalTax = ceil($taxamount) + ceil($adminFees);
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
                'tax_amount' => $totalTax,
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
                'reward_file' => [
                    'required'
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
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        }

        // if (Helpers::checkUnsafeContent($request->thumbnail)) {
        //     return redirect()->back()->with("error", "NSFW Detected in the media content. Try alternative.");
        // }

        $user = User::find(Auth::id());
        $price = $request->price;

        // $price = round($request->price, 2, PHP_ROUND_HALF_UP);
        if ($request->subscription == 0) {
            $tax_percent = config('app.single_tax');
        } elseif ($request->subscription == 1) {
            $tax_percent = config('app.subs_tax');
        } elseif ($request->subscription == 2) {
            $tax_percent = config('app.crowd_tax');
        }

        $taxamount = round(($price * $tax_percent / 100), 2, PHP_ROUND_HALF_UP);
        $createpriceid = $price + $taxamount;

        $wish = WishItem::create([
            "user_id" => Auth::id(),
            'wishname' => $request->wishname,
            'price' => $price,
            'currency' => $user->default_currency,
            'item_url' => $request->item_url != "" ? $request->item_url : null,
            'thumbnail' => $request->thumbnail ?? null,
            'reward' => $request->reward_file ?? null,
            "ai_generated" => $request->ai_generated,
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
                "name"  =>  $wish->wishname . "(Custom Content Purchase)",
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
                    // MakeAutoTweets::dispatch($wish->user);
                    AutoTweetWishAdd::dispatch($wish);
                }
            } catch (Exception $e) {
                $wish->delete();
                return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
            }
        }

        return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been added, your upload will be approved shortly.");
    }

    public function updateWishItem(Request $request, $uuid = null)
    {
        $wish = WishItem::where('uuid', $uuid)->first();
        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        }

        $old_price = $wish->price;
        if (!empty($request->price)) {
            if ($request->subscription == 0) {
                $tax_percent = config('app.single_tax');
            } elseif ($request->subscription == 1) {
                $tax_percent = config('app.subs_tax');
            } elseif ($request->subscription == 2) {
                $tax_percent = config('app.crowd_tax');
            }
            $taxamount = $request->price * $tax_percent / 100;
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
                'reward' => $request->reward_file ?? $wish->reward,
                "ai_generated" => $request->ai_generated ?? $wish->ai_generated,
                'subscription' => $request->subscription ?? $wish->subscription,
                'subscription_period' => $request->subscription_period ?? $wish->subscription_period,
                'repeat_purchase' => $request->repeat_purchase ??
                    $wish->repeat_purchase,
                'fullfill_amount' => $request->fullfill_amount ??
                    $wish->fullfill_amount,
                'tax_amount' => $taxamount,
            ]);


            $wish->refresh();
            if (!empty($request->category)) {

                WishCategory::where('wish_item_id', $wish->id)->delete();
                foreach ($request->category as $key => $value) {


                    $wish_cat = new WishCategory();
                    $wish_cat->uuid = Uuid::uuid4();
                    $wish_cat->wish_item_id = $wish->id;
                    $wish_cat->user_category_id = $value;
                    $wish_cat->save();
                }
            }

            $user = User::whereId(Auth::id())->first();
            if (in_array($request->subscription, [0, 1])) {

                $productPayload = [
                    "name"  =>  $wish->wishname . "(Custom Content Purchase)",
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
                    $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

                    if ($old_price == $wish->price) {
                        $stripe_client = $stripe->products->update($wish->stripe_product_id, [
                            'name' => !empty($request->wishname) ? $request->wishname . "(Custom Content Purchase)" : $wish->wishname . "(Custom Content Purchase)",
                            'images' => [$wish->perma_link],
                            "default_price" => $wish->price_id,
                            // "url" => $request->item_url ?? null
                        ]);
                    } else {
                        $stripe_client = StripeControl::createProduct($productPayload);
                        $wish->price_id = $stripe_client->default_price;
                    }

                    $wish->stripe_product_id = $stripe_client->id;
                    $wish->is_approved = 0;
                    $wish->save();

                    $logs = Logs::where('edited_wish_id', $wish->id)->where('status', 'pending')->first();
                    if (!empty($logs)) {
                        $logs->status = 'updated';
                        $logs->save();
                    }
                } catch (Exception $e) {
                    $wish->delete();
                    return redirect(route("user.show", ["username" => Auth::user()->username]))->with('error', "Stripe Error: " . $e->getMessage());
                }
            }
            //send email
            // SaveWishlist::dispatch($user);
            return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been updated.");
        }
    }

    public function deleteWishItem($uuid)
    {
        $wishitem = WishItem::where('uuid', $uuid)->first();

        if (!$wishitem) {
            return response()->json([
                'status' => false,
                'msg' => "Wishitem not found."
            ]);
        }

        WishCategory::where('wish_item_id', $wishitem->id)->delete();

        UserCart::where('wish_item_id', $wishitem->id)->delete();

        $si = StripePaymentItems::where('wish_item_id', $wishitem->id)->get();

        foreach ($si as $key => $value) {
            StripePaymentDetail::where('id', $value->stripe_payment_detail_id)->delete();
            $value->delete();
        }

        WishItemSubscription::where('wish_item_id', $wishitem->id)->delete();

        $wishitem->delete();

        return response()->json([
            'status' => true,
            'msg' => "Wishitem removed successfully."
        ]);
    }

    public function saveUserCategory(Request $request)
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

        $categories = UserCategory::where('user_id', Auth::id())->get();
        foreach ($categories as $key => $value) {
            if (strtolower($request->category) == strtolower($value->category)) {
                return back()->with('error', 'Category is already exists.');
            }
        }

        UserCategory::create([
            "user_id" => Auth::id(),
            'category' => $request->category ?? null,
        ]);

        return response()->json([
            'status' => true,
            'msg' => "Category Saved."
        ]);
    }

    public function discover_all_wishes($order, $type, $price)
    {
        $tag = request()->query('tag') ? str_replace('-', ' ', request()->query('tag')) : false;

        $query = WishItem::query()
            ->whereNull('deleted_at')
            ->where('is_approved', 1)
            ->with(['user'])
            ->whereHas('user', function ($q) use ($tag) {
                $q->where(function ($s) {
                    $s->whereNot('country', 'GB')
                        ->whereNotNull('account_id')
                        ->orWhereNull('country');
                });

                if ($tag) {
                    $q->whereJsonContains('creator_category', $tag);
                }
            });

        // Order by condition
        if ($order === 'new') {
            $query->latest();
        }

        // Price range filter
        $priceRanges = [
            '5to10' => [4.99, 9.99],
            '10to30' => [9.99, 29.99],
            '30to50' => [29.99, 49.99],
            '50to100' => [49.99, 99.99],
        ];

        if (isset($priceRanges[$price])) {
            $query->whereBetween('price', $priceRanges[$price]);
        } elseif ($price === '100plus') {
            $query->where('price', '>', 99.99);
        }

        // Subscription type filter
        $subscriptionTypes = [
            'subscription' => 1,
            'crowdfund' => 2,
            'single' => 0,
        ];

        if (isset($subscriptionTypes[$type])) {
            $query->where('subscription', $subscriptionTypes[$type]);
        }

        // Pagination and response
        $wishes = $query->paginate(30);

        return response()->json([
            'success' => true,
            'wishes' => $wishes,
            'last_page' => $wishes->lastPage(),
            'current_page' => $wishes->currentPage(),
            'total' => $wishes->total(),
            'per_page' => $wishes->perPage(),
        ]);
    }

    public function discover_all_creators($order, $gender)
    {

        $query = UserIntro::where('deleted_at', null)
            ->with(['user'])
            ->whereHas('user', function ($q) use ($gender) {
                $q->where(function ($s) {
                    $s->whereNot('country', 'GB')->orWhereNull('country');
                });

                if ($gender != 'all') {
                    $q->where('gender', $gender);
                }
            });

        if ($order == 'new') {
            $query->latest();
        }

        $intros = $query->paginate(30);
        return response()->json([
            'success'   => true,
            'intro' => $intros,
            "last_page" => $intros->lastPage() ?? null,
            "current_page" => $intros->currentPage() ?? null,
            "total" => $intros->total() ?? null,
            "per_page" => $intros->perPage() ?? null,
        ]);
    }

    public function all_creators_categories()
    {
        $categories = User::whereNotNull('creator_category')
            ->where('suspended_account', 0)
            ->pluck('creator_category')
            ->map(function ($item) {
                return json_decode($item, true);
            })
            ->flatten()
            ->unique()
            ->values();
        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
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
        $user = User::where('id', $user_id)->where('suspended_account', 0)->where(function ($q) {
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
                    "success" => false,
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
                $tax =  round(($price * config('app.crowd_tax', 10) / 100), 2, PHP_ROUND_HALF_UP);
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
            $cart->country = 'global';
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
                $tax = round(($price * config('app.crowd_tax', 10) / 100), 2, PHP_ROUND_HALF_UP);
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
                'country' => 'global',
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

    /**
     * rye product functionality starts
     *
     * create cart product for rye into our site
     *
     * @return Response
     *
     */
    public function createCart(Request $request)
    {
        try {
            $userId = Auth::id();

            // Prevent user from adding their own gift item
            if ($userId === (int) $request->creator_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User cannot add their own gift item'
                ], 403);
            }

            // Prepare data
            $cartData = [
                'user_id' => $userId,
                'creator_id' => $request->creator_id,
                'cart_id' => $request->cart_id,
            ];

            // Use firstOrNew to find or create a new instance
            $cart = RyeCart::firstOrNew($cartData);

            // Update cart details only if it's different to avoid unnecessary writes
            $newCartDetails = json_encode($request->data, true);
            if ($cart->exists && $cart->cart_details === $newCartDetails) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Cart item is already added'
                ]);
            }

            // Update or create the cart item
            $cart->cart_details = $newCartDetails;
            $cart->save();

            return response()->json([
                'status' => 'success',
                'message' => $cart->wasRecentlyCreated ? 'Added to Cart' : 'Updated Cart Item'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * check rye cart exist or not
     *
     * @return Response
     */
    public function checkCartExist($creator_id): JsonResponse
    {
        $userId = Auth::id();

        // Fetch only necessary fields using `pluck()` (more efficient than `select()->first()`)
        $cartId = RyeCart::where([
            'user_id' => $userId,
            'creator_id' => $creator_id
        ])->value('cart_id');

        return response()->json([
            'status' => (bool) $cartId,
            'message' => $cartId ? 'Cart data found' : 'Cart not found',
            'cart_id' => $cartId,
        ]);
    }

    /**
     * get all carts products details of rye
     *
     * @return Response
     */
    public function getCartDetails(): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => false,
                'message' => 'User not authenticated',
                'data' => []
            ], 401);
        }

        $cartDetails = RyeCart::with('creator')->where('user_id', Auth::id())
            ->select(['cart_id', 'creator_id', 'cart_details'])
            ->get()
            ->map(function ($cart) {
                // Decode the JSON data in cart_details
                $cartData = json_decode($cart->cart_details, true);

                // Check if cart_details is null or 'stores' is empty/missing
                if (is_null($cart->cart_details) || empty($cartData['cart']['stores'])) {
                    return null; // Skip this entry
                }

                return $cart;
            })
            ->filter() // Remove null entries from the collection
            ->values() // Reset array keys
            ->toArray(); // Convert to array for optimized response

        return response()->json([
            'status' => !empty($cartDetails), // Returns true if data exists, false otherwise
            'message' => !empty($cartDetails) ? 'Cart data retrieved successfully' : 'No cart data found',
            'data' => !empty($cartDetails) ? $cartDetails : null
        ]);
    }

    /**
     * remove cart from rye cart
     *
     * @return Response
     */
    public function removeCart($cart_id)
    {
        $userId = Auth::id();
        $deleted = RyeCart::where('user_id', $userId)
            ->where('cart_id', $cart_id)
            ->delete(); // Returns the number of deleted rows

        // return Inertia::render('feed/AddGift');
        return response()->json([
            'status' => 'success',
            'message' => $deleted ? 'Cart item deleted successfully' : 'Cart item not found'
        ]);
    }

    /**
     * create store address for creator on rye
     *
     * @return Response
     */
    public function creatorStoreAddress(Request $request)
    {
        try {
            // Validate incoming request based on database schema
            $validatedData = $request->validate([
                'first_name'     => 'nullable|string|max:255',
                'last_name'      => 'nullable|string|max:255',
                'phone'          => 'nullable|digits_between:8,15', // Ensures phone is numeric & valid length
                'address_1'      => 'nullable',
                'address_2'      => 'nullable',
                'city'           => 'nullable|string|max:255',
                'province_code'  => 'nullable|size:3',  // Exactly 3 characters
                'country_code'   => 'nullable|size:2',  // Exactly 2 characters (ISO country codes)
                'postal_code'    => 'nullable|digits_between:4,10', // Ensures postal code is numeric & valid length
            ]);

            // Create the address entry
            $creatorAddress = CreatorShippingAddress::create([
                'creator_id'    => Auth::id(),
                'first_name'    => $validatedData['first_name'],
                'last_name'     => $validatedData['last_name'],
                'phone'         => $validatedData['phone'],
                'address_1'     => $validatedData['address_1'],
                'address_2'     => $validatedData['address_2'] ?? null,
                'city'          => $validatedData['city'],
                'province_code' => $validatedData['province_code'] ?? null,
                'country_code'  => $validatedData['country_code'],
                'postal_code'   => $validatedData['postal_code'],
            ]);

            // Return success response
            return response()->json([
                'status'  => 'success',
                'message' => 'Address stored successfully',
                'data'    => $creatorAddress,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Something went wrong',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * handle rye product payment and return the payment url
     *
     * @return Response
     */
    public function handleRyeProductPayment(Request $request)
    {
        try {
            // Fetch order details with creator relation
            $orderDetails = RyeCart::with('creator', 'user')->where(['cart_id' => $request->cart_id, 'creator_id' => $request->creator_id])->first();

            if (!$orderDetails) {
                return response()->json([
                    'status' => false,
                    'message' => 'Order details not found.',
                ], 404);
            }

            $currency = 'usd'; // Assuming USD as currency
            $totalAmount = 0;
            $lineItems = [];

            // Decode cart data if stored as JSON
            $cartData = is_string($orderDetails->cart_details) ? json_decode($orderDetails->cart_details, true) : $orderDetails->cart_details;
            $cartLines = data_get($cartData, 'cart.stores.0.cartLines', []);
            // dd($cartLines);
            // Check if cartLines is not empty
            if (empty($cartLines)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Cart is empty.',
                ], 422);
            }

            // Loop through each cart line and build the Stripe line items
            foreach ($cartLines as $cartLine) {
                $quantity = data_get($cartLine, 'quantity', 1);
                $unitPrice = data_get($cartLine, 'product.price.value', 0); // Convert to cents
                $productId = data_get($cartLine, 'product.id', '');

                if (!$productId || $unitPrice <= 0) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Invalid product details in cart.',
                    ], 422);
                }

                // Add to total amount
                $totalAmount += ($unitPrice * $quantity);

                // Prepare Stripe line items
                $lineItems[] = [
                    'quantity' => $quantity,
                    'price_data' => [
                        'currency' => $currency,
                        'unit_amount' => $unitPrice,
                        'product_data' => [
                            'name' => data_get($cartLine, 'product.title', 'Product'),
                        ],
                    ],
                ];
            }

            // Ensure creator has a Stripe account
            if (empty($orderDetails->creator->account_id)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Stripe account details are missing.',
                ], 422);
            }

            // Initialize Stripe

            $ryeProductPayment = new RyeProductPayment();
            $ryeProductPayment->user_id = Auth::id();
            $ryeProductPayment->currency = $currency;
            $ryeProductPayment->amount = $totalAmount / 100;
            $ryeProductPayment->payment_method = 'card';
            $ryeProductPayment->customer_email = $orderDetails->user->email;
            $ryeProductPayment->save();

            Session::put('cartData', $orderDetails);


            $stripe = new \Stripe\StripeClient(env('TEST_STRIPE_SECRET_KEY'));
            // Create Stripe checkout session
            $sessionCreate = $stripe->checkout->sessions->create([
                'success_url' => route('rye.success.payment', [$ryeProductPayment->uuid]),
                'cancel_url' => route('rye.cancel.payment', [$ryeProductPayment->uuid]),
                'line_items' => $lineItems,
                'mode' => 'payment',
                'payment_method_types' => ['card'],
                'payment_intent_data' => [
                    'transfer_data' => [
                        'destination' => $orderDetails->creator->account_id,
                        'amount' => $totalAmount,
                    ],
                    'on_behalf_of' => $orderDetails->creator->account_id,
                ],
                'customer_email' => $orderDetails->user->email,
            ]);
            Log::info('Stripe session create', ['session' => $sessionCreate]);

            $ryeProductPayments = RyeProductPayment::whereUuid($ryeProductPayment->uuid)->update(['payment_metadata' => json_encode($sessionCreate)]);

            return response()->json([
                'status' => true,
                'url' => $sessionCreate->url,
            ]);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Stripe API error: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Something went wrong: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * handle rye product payment success
     *
     * @return Response
     */
    public function ryeSuccessPayment($uuid)
    {
        $orderDetails = RyeProductPayment::with('user')->where('uuid', $uuid)->first();

        if (!$orderDetails) {
            return response()->json([
                'status' => false,
                'message' => 'Payment details not found.',
            ], 404);
        }

        // Update order status
        $orderDetails->status = 'succeeded';
        $orderDetails->save();

        $value = Session::get('cartData');

        return Inertia::render('rye/ThankYouRye', [
            'cartData' => $value,
        ]);
    }

    /**
     * hit submitCart api and store the response in the database
     *
     * @return Response
     */
    public function storeProductOrderDetails(Request $request)
    {
        try {
            $creatorShipping = CreatorShippingAddress::firstOrFail('creator_id', $request->creator_id);
            $response = (object) []; // Empty object
            if ($creatorShipping) {
                $cart_id = $request->cart_id;
                $response = Http::withHeaders([
                    'Authorization' => 'Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6',
                    'Rye-Shopper-IP' => '122.180.247.198',
                    'Content-Type' => 'application/json',
                ])->post('https://staging.graphql.api.rye.com/v1/query', [
                    'query' => "mutation SubmitCart(\$input: CartSubmitInput!) { submitCart(input: \$input) { cart { id stores { status orderId store { ... on ShopifyStore { store cartLines { quantity variant { id } } } } errors { code message } } } errors { code message } } }",
                    'variables' => [
                        'input' => [
                            'id' => $cart_id,
                            'token' => env('PAYMENT_TOKEN'),
                            'selectedShippingOptions' => [
                                [
                                    'store' => 'amazon',
                                    'shippingId' => '0-Default shipping method',
                                ]
                            ],
                            // 'billingAddress' => [
                            //     'firstName' => 'John',
                            //     'lastName' => 'Doe',
                            //     'phone' => '+12345678901',
                            //     'address1' => '123 Main Street',
                            //     'address2' => 'Apt 4B',
                            //     'city' => 'New York',
                            //     'provinceCode' => 'NY',
                            //     'countryCode' => 'US',
                            //     'postalCode' => '10001',
                            // ],
                            'billingAddress' => [
                                'firstName' => $creatorShipping->first_name ?? 'John',
                                'lastName' => $creatorShipping->last_name ?? 'Doe',
                                'phone' => $creatorShipping->phone ?? '+1 234-567-8901',
                                'address1' => $creatorShipping->address_1 ?? '123 Main Street',
                                'address2' => $creatorShipping->address_2 ?? 'Apt 4B',
                                'city' => $creatorShipping->city ?? 'New York',
                                'provinceCode' => $creatorShipping->province_code ?? 'NY',
                                'countryCode' => $creatorShipping->country_code ?? 'US',
                                'postalCode' => $creatorShipping->postal_code ?? '00000', // Set a default postal code
                            ],

                            'cartSettings' => [
                                'amazonSettings' => [
                                    'hidePriceOnPackage' => true,
                                ]
                            ]
                        ]
                    ]
                ]);
            }

            // Convert response to array
            $data = $response->json();
            Log::info('SubmitCart API Response:', $data);

            // Extract necessary details
            $user_id = Auth::id();
            $creator_id = $request->creator_id;
            $order_id = $data['data']['submitCart']['cart']['stores'][0]['orderId'] ?? null;
            $payment_status = $data['data']['submitCart']['cart']['stores'][0]['status'] ?? 'pending';
            $details = json_encode($data, true);

            // Store the response data in the database
            ProductOrderDetail::create([
                'user_id' => $user_id,
                'creater_id' => $creator_id,
                'cart_id' => $cart_id,
                'order_id' => $order_id,
                'details' => $details,
                'payment_status' => $payment_status,
            ]);

            // RyeCart::where('cart_id', $cart_id)->delete();

            return response()->json(['status' => 'success', 'message' => 'Order details stored', 'data' => $data]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * rye integrations starts from here
     *
     * create rye product and store in the database
     *
     * @return Response
     */
    public function createRyeProduct(Request $request)
    {
        $request->validate([
            'url' => 'required',
        ]);
        // Extract the URL from the request (assuming it's passed as a query parameter)
        $url = $request->input('url');  // You can change this as per your need
        $checkProductId = RyeProduct::where('creator_id', Auth::id())->where('product_id', $url['id'])->exists();
        // dd($url);
        if ($checkProductId) {
            return response()->json(['status' => 'error', 'message' => 'Product Already Added.']);
        }

        // Create a new product on Stripe
        $productPayload = [
            "name"  =>  $url['title'],
            "images" => [$url['images'][0]['url']],
            "default_price_data"    =>  [
                "currency"  =>  $url['price']['currency'],
                "unit_amount_decimal"   => $url['price']['value'],
            ],
            "url"   => env('APP_URL') . "/gift-item/$url[id]",
        ];

        $product = StripeControl::createProduct($productPayload);
        $ryeProducts = new RyeProduct();
        $ryeProducts->creator_id = Auth::id();
        $ryeProducts->product_id = $url['id'];
        $ryeProducts->stripe_product_id = $product->id;
        $ryeProducts->details = json_encode($url, true);
        if ($ryeProducts->save()) {
            return response()->json(['status' => 'success', 'message' => 'Product Added Successfully.']);
        }
    }
    /**
     * rye product functionality ends
     *
     */


    public function clearCart($deviceid, $ownerid)
    {
        $query = UserCart::where('country', 'global')->where('owner_id', $ownerid)->where('status', 1);
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
        $cart = UserCart::where('country', 'global')->whereUuid($uuid)->first();
        $cart->status = 0;
        $cart->save();
        return back()->with('success', 'Item removed from cart');
    }

    public function cartItems()
    {
        if (!empty(Auth::id())) {
            $groupedWishes = [];
            $user = User::where('id', Auth::id())
                ->where(function ($query) {
                    $query->where('country', '!=', 'GB')
                        ->orWhereNull('country');
                })
                ->first();

            $cart = [];
            if ($user) {
                $carts = UserCart::where('user_id', $user->id)->where('country', 'global')->where('status', 1)->get();

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
                        'url' => $wish->wish ? $wish->wish->perma_link : 'https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/',
                        'amount' => $wish->amount,
                        'priceid' => $wish->priceid,
                        'uuiddata' => $wish->uuid,
                        'tax' => $wish->tax,
                        'surprisemessage' => $wish->message ?? '',
                        'quantity' => $wish->quantity ?? '',
                    ];
                }
            }
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
                    $tax = $v['tax'] ? $v['tax'] : $v['wish']['tax_amount'];
                    $priceid = $v['priceid'] ? $v['priceid'] : $v['wish']['price_id'];

                    if (!empty($v['wish'])) {
                        $cart[$key]['items'][$k] = [
                            'id' => $v['wish']['id'],
                            'uuid' => $v['uuiddata'],
                            'user_id' => $v['wish']['user_id'],
                            'wishname' => $v['wish']['wishname'],
                            'stripe_product_id' => $v['wish']['stripe_product_id'],
                            'price' => $price,
                            'tax' => $tax,
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
                            'tax' => $tax,
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
                    $fee += !empty($v['priceid']) ? $v['tax'] * $v['quantity'] : ($v['wish']['tax_amount'] * $v['quantity'] ?? 0);
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
        $carts = UserCart::where('device_id', $deviceId)->where('country', 'global')->where('status', 1)->get();
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
                'url' => $wish->wish ? $wish->wish->perma_link : 'https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/',
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
                $tax = $v['tax'] ? $v['tax'] : $v['wish']['tax_amount'];
                $priceid = $v['priceid'] ? $v['priceid'] : ($v['wish']['price_id'] ?? null);

                if (!empty($v['wish'])) {
                    $cart[$key]['items'][$k] = [
                        'id' => $v['wish']['id'] ?? null,
                        'uuid' => $v['uuiddata'] ?? null,
                        'user_id' => $v['wish']['user_id'] ?? null,
                        'wishname' => $v['wish']['wishname'] ?? null,
                        'stripe_product_id' => $v['wish']['stripe_product_id'] ?? null,
                        'price' => $price,
                        'tax' => $tax,
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
                        'tax' => $tax,
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
                $fee += !empty($v['priceid']) ? $v['tax'] * $v['quantity'] : ($v['wish']['tax_amount'] * $v['quantity'] ?? 0);
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

        $currency = strtolower($request->cookie("currency", "GBP"));

        $owner = User::where('id', $request->owner_id)->first();
        $price = Helpers::priceFormat($currency, $request->amount, $owner->default_currency);
        $min_amount = $owner->min_surprise_amount < 5 ? 5 : $owner->min_surprise_amount;
        $user_amount = Helpers::priceFormat($owner->default_currency, $min_amount, $currency);
        if ($price < $min_amount) {
            return redirect()->back()->with("error", "Enter minimum $user_amount amount.");
        }

        $wordLimit = 100;


        $message = $request->message;
        if (str_word_count($message) > $wordLimit) {
            return redirect()->back()->with("error", "Max limit for message is 100 words");
        }

        // $price = round($request->amount, 2, PHP_ROUND_HALF_UP);
        $tax = round(($price * config('app.suprise_tax', 10) / 100), 2, PHP_ROUND_HALF_UP);

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
        $stripe_client = $stripe->products->create([
            'name' => 'Surprise Gift',
            'images' => ['https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/'],
            "default_price_data" => ["currency" => $owner->default_currency, "unit_amount_decimal" => round(($price + $tax), 2, PHP_ROUND_HALF_UP) * 100],
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
        $items = UserCart::where('user_id', Auth::id())->where('country', 'global')->where('status', 1)->count();
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
            $items = UserCart::where('device_id', $deviceid ?? null)->where('country', 'global')->where('status', 1)->count();
            return response()->json([
                "success" => true,
                "counter" => $items,
            ]);
        } else {
            $user = Auth::user();
            $items = UserCart::where('user_id', $user->id ?? null)->where('country', 'global')->where('status', 1)->count();
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

        $creator_subs = WishItemSubscription::where('recurring_for', 'continue')->where('created_at', '<=', Carbon::now())->where('upcoming_payment', '>=', Carbon::now())->whereHas('wish_item', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with(['user', 'wish_item'])->whereIn('status', ['paid', 'cancelled'])->orderBy('updated_at', 'DESC')->get();

        $user_subs = WishItemSubscription::where('recurring_for', 'continue')->where('user_id', Auth::id())->where('created_at', '<=', Carbon::now())->where('upcoming_payment', '>=', Carbon::now())->with(['wish_item', 'wish_item.user'])->whereIn('status', ['paid', 'cancelled'])->get();

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
        $payment->thank_you_at = Carbon::now();
        $payment->save();
        // ThankyouMailToUser::dispatch($payment);

        SendThankYouMailAdmin::dispatch($payment);
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

        $target = $request->target;
        $price = $request->default_price;

        $goal = TipGoal::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'target' => $target,
            // 'default_price' => ceil($price),
            'description' => $request->description ?? null,
            'currency' => $user->default_currency,
        ]);

        $goal->refresh();

        if ($goal->status == 1) {
            $goal->completed_at = Carbon::now()->addDays($goal->days);
            $goal->save();
        }

        // $productPayload = [
        //     "name"  =>  $goal->name,
        //     "images" => ["https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/"],
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
        $user = User::where('uuid', $uuid)->first();
        // TipGoal::where('status', 1)->where('completed', 0)->where('completed_at', '<', Carbon::now())->update(['completed' => 1]);

        // $goal = TipGoal::whereHas('user', function ($q) use ($uuid) {
        //     $q->where('uuid', $uuid);
        // })->where('completed', 0)->first();
        $arr = [];
        $bill_payment = BillPayment::whereHas('bill', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->sum('amount');

        $mem_payment = MembershipPayment::whereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->sum('amount');

        $wish_payment = StripePaymentItems::whereHas('wish', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->sum('amount');

        $sub_payment = WishItemSubscription::whereHas('wish_item', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->sum('amount');

        $total_earnings = $bill_payment + $mem_payment + $wish_payment + $sub_payment;

        if ($total_earnings < 100) {
            $target = 100;
        } elseif ($total_earnings < 1000) {
            $target = 1000;
        } elseif ($total_earnings < 10000) {
            $target = 10000;
        } elseif ($total_earnings < 100000) {
            $target = 100000;
        } elseif ($total_earnings < 1000000) {
            $target = 1000000;
        } else {
            $target = 10000000;
        }

        $arr['fullfilled'] = $total_earnings;
        $arr['target'] = $target;
        $arr['currency'] = $user->default_currency;
        return response()->json([
            'status' => true,
            'goal' => $arr,
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
     * User tips payment show data
     *
     * @return Response
     */
    public function userTips()
    {
        $userId = Auth::id(); // Use the user ID directly

        // Retrieve TipGoalsPayment records where either the payment's user_id matches or related tipGoal's user_id matches
        $userTips = TipGoalsPayment::with('tipGoal.user') // Eager load the user relationship in tipGoal
            ->where('user_id', $userId)
            ->whereIn('status', ['paid', 'cancelled'])
            ->orWhereHas('tipGoal', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })->latest()
            ->get();

        // Map each tip and add owner property dynamically
        $tips = $userTips->map(function ($tip) {
            $tip->setAttribute('owner', $tip->creator ?? null); // Dynamically set the 'owner' attribute
            return $tip;
        });

        return response()->json([
            'status' => true,
            'tips' => $tips,
        ]);
    }

    /**
     * Enable disable the auto tweet
     *
     * @return mixed
     */
    public function enableAutoTweet()
    {

        $user = User::where('id', Auth::id())->first();

        if ($user->auto_tweet == 1) {
            $user->auto_tweet = 0;
        } else {
            $user->auto_tweet = 1;
        }

        $user->save();

        if ($user->auto_tweet == 1) {
            return back()->with('success', "Auto tweet for gift is Enabled.");
        } else {
            return back()->with('success', "Auto tweet for gift is Disabled.");
        }
    }

    /**
     * Share the purchasing on twitter
     *
     * @return mixed
     */
    public function shareOnTwitter($uuid, $type)
    {
        $user = Auth::user();
        if ($user->auto_tweet == 0) {
            return response()->json([
                'status' => false,
                'msg' => "Please first enable the auto tweets."
            ]);
        }

        if ($type == 'wish-add') {
            $pay = StripePaymentItems::whereUuid($uuid)->first();
            if (empty($pay->wish_item_id)) {
                SurpriseTweet::dispatch($pay);
            } elseif ($pay->wish->subscription == 2) {
                CrowdfundTweet::dispatch($pay);
            } else {
                CheckoutTweet::dispatch($pay);
            }
        } elseif ($type == 'subscription') {
            $pay = WishItemSubscription::whereUuid($uuid)->first();
            SubscribeAutoTweet::dispatch($pay);
        } elseif ($type == 'tip-jar') {
            $pay = TipGoalsPayment::whereUuid($uuid)->first();
            TipJarTweet::dispatch($pay);
        }
        return response()->json([
            'status' => true,
            'msg' => "Wish payment shared on twitter."
        ]);
    }

    public function editWishCategory(Request $request, $id)
    {
        $category = UserCategory::where('id', $id)->first();

        $category->category = $request->name;
        $category->save();

        return response()->json([
            'status' => true,
            'msg' => "Category Updated"
        ]);
    }

    public function deleteCategory($id)
    {
        $wish_cat = WishCategory::where('user_category_id', $id)->get();

        foreach ($wish_cat as $key => $value) {
            $value->user_category_id = NULL;
            $value->save();
        }

        UserCategory::where('id', $id)->delete();

        return response()->json([
            'status' => true,
            'msg' => "Category Deleted."
        ]);
    }

    /**
     * Bill Payment Data Show
     *
     * @return Response
     */
    public function billTracker()
    {
        $user = Auth::user();

        // Fetch bill payments with conditional user data
        $bill_payments = BillPayment::whereHas('bill', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)
            ->whereIn('status', ['paid', 'cancelled'])
            ->with('bill', 'user') // Load bill and user relationships
            ->latest()
            ->get();

        // Map the results to include user data or fallback to guest email
        $bill_payments->map(function ($payment) {
            $payment->user_data = $payment->user
                ? [
                    'name' => $payment->user->name,
                    'avatar' => $payment->user->avatar_url,
                    'uuid' => $payment->user->uuid,
                ]
                : [
                    'name' => $payment->guest_name ?? 'Anonymous',
                    'avatar' => null, // Set default avatar or null for guests
                    'email' => $payment->guest_email ?? 'N/A',
                ];
            return $payment;
        });

        return response()->json([
            'status' => true,
            'bill_payments' => $bill_payments
        ]);
    }

    /**
     * Membership Payment Data Show
     *
     * @return Response
     */
    public function membershipTracker()
    {
        $user = Auth::user();
        $membership_payments = MembershipPayment::whereHas('membership', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)
            ->whereIn('status', ['paid', 'cancelled'])
            ->with('membership')
            ->latest()
            ->get();

        $membership_payments->map(function ($q) {
            $q->user_data = [
                'name' => $q->user->name,
                'avatar' => $q->user->avatar_url,
                'uuid' => $q->user->uuid
            ];
            return $q;
        });

        return response()->json([
            'status' => true,
            'membership_payments' => $membership_payments
        ]);
    }

    /**
     * Shop Payment Data Show
     *
     * @return Response
     */
    public function shopTracker()
    {
        $user = Auth::user();
        $shopPayments = ShopPayment::whereHas('shop', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->orWhere('user_id', $user->id)
            ->with('shop')
            ->whereIn('payment_status', ['paid', 'cancelled'])
            ->orderBy('id', 'desc')
            ->get();

        $shopPayments->map(function ($q) {
            $q->user_data = [
                'name' => $q->user->name,
                'avatar' => $q->user->avatar_url,
                'uuid' => $q->user->uuid
            ];
            return $q;
        });

        return response()->json([
            'status' => true,
            'shop_payments' => $shopPayments
        ]);
    }
}
