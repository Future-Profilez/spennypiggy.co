<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Wishitem;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

class WishitemController extends Controller
{
    public function saveWishItem(Request $request): RedirectResponse
    {

        $item = Wishitem::create([
            'uuid' => Uuid::uuid4(),
            'wishname' => $request->wishname,
            'price' => $request->price,
            'item_url' => $request->item_url ?? null,
            'thumbnail' => $request->thumbnail ?? null,
            'subscription' => $request->subscription,
            'subscription_period' => $request->subscription_period ?? null,
            'repeat_purchase' => $request->repeat_purchase ?? 0,
            'category' => $request->category ?? null,
        ]);
        return back()->with('item', $item);
    }
}
