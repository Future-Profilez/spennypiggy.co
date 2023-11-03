<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserCategory;
use App\Models\WishItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
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
            'category' => $request->category ?? null,
        ]);


        $wish->refresh();
        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));
        $stripe_client = $stripe->products->create([
            'name' => $request->name ?? null,
            'images' => [$wish->perma_link],
            "default_price" => $request->price,
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
}
