<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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
                "min:10",
                "max:255"
            ],
            "price" => [
                "required",
                "numeric",
                "min:0"
            ],
            "item_url" => [
                "sometimes",
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

        $wish = WishItem::create([
            "user_id" => Auth::id(),
            'wishname' => $request->wishname,
            'price' => $request->price,
            'item_url' => $request->item_url ?? null,
            'thumbnail' => $request->thumbnail ?? null,
            'subscription' => $request->subscription,
            'subscription_period' => $request->subscription_period ?? null,
            'repeat_purchase' => $request->repeat_purchase ?? 0,
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

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
        $stripe_client = $stripe->products->create([
            'name' => $request->wishname ?? null,
            'images' => [$wish->perma_link],
            "default_price_data" => ["currency" => "usd", "unit_amount_decimal" => $request->price],
            "url" => $request->item_url ?? null
        ]);

        $wish->stripe_product_id = $stripe_client->id;
        $wish->save();
        return redirect(route("user.show", ["username" => Auth::user()->username]))->with('success', "Wish Item has been added.");
    }


    public function saveUserCategory(Request $request): RedirectResponse
    {
        $request->validate([
            "category" => [
                "required",
                "string",
                "min:3",
                "max:255",
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


    public function addToCart(Request $request)
    {
        $wishitem = WishItem::where('uuid', $request->uuid)->first();

        // if (Auth::id() == $wishitem->user_id) {
        // }

        $cart = UserCart::where('wish_id', $wishitem->id)->where("user_id", Auth::user())->first();

        if ($cart) {
            $cart->status = 1;
            $cart->save();
        } else {
            UserCart::create([
                "user_id" => Auth::id(),
                "owner_id" => $wishitem->user_id,
                'wish_id' => $wishitem->id,
                'status' => 1,
            ]);
        }
        return back()->with('success', 'Item added to cart.');
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
                'wish' => $wish->wish->toArray()
            ];
        }

        $cart = [];
        $key = 0;
        foreach ($groupedWishes as $value) {

            $cart[$key] = [
                'user' => [
                    'id' => $value[0]['user']['id'],
                    'name' => $value[0]['user']['name'],
                    'username' => $value[0]['user']['username'],
                    'uuid' => $value[0]['user']['uuid'],
                ],
            ];

            $total = 0;

            foreach ($value as $k => $v) {
                $cart[$key]['items'][$k] = [
                    'id' => $v['wish']['id'],
                    'uuid' => $v['wish']['uuid'],
                    'user_id' => $v['wish']['user_id'],
                    'wishname' => $v['wish']['wishname'],
                    'stripe_product_id' => $v['wish']['stripe_product_id'],
                    'price' => $v['wish']['price'],
                    'item_url' => $v['wish']['item_url'],
                    'subscription' => $v['wish']['subscription'],
                    'subscription_period' => $v['wish']['subscription_period'],
                    'repeat_purchase' => $v['wish']['repeat_purchase'],
                    'category' => $v['wish']['category'],
                ];
                $total += $v['wish']['price'];
            }
            $cart[$key]['total'] = $total;
            $cart[$key]['fee'] = ($total * 20) / 100;

            $key++;
        }

        echo "<pre>";
        print_r($cart);
        die;

        return Inertia::render('cart/Cart', [
            "carts" => $cart,
        ]);
    }
}
