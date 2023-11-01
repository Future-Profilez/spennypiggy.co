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
    public function saveWishItem(Request $request): RedirectResponse {
        $regex = '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/';
        $request->validate([
            'wishname' => ['required', 'string', 'max:255' ],
            'price' => ['required','number'],
            'item_url' => ['sometimes', 'regex:'.$regex],
            'subcription' => ['required','in:0,1,2'],
            'subcription_period' => ['string'],
            'repeat_purchase' => ['in:0,1'],
        ]);

        $item = Wishitem::create([
            'uuid' => Uuid::uuid4(),
            'wishname' => $request->wishname,
            'price' => $request->price,
            'item_url' => $request->item_url ?? null,
            'thumbnail' => $request->thumbnail ?? null,
            'subcription' => $request->subcription,
            'subcription_period' => $request->subcription_period ?? null,
            'repeat_purchase' => $request->repeat_purchase ?? null,
            'category' => $request->category ?? null,
        ]);
        return back()->with('item', $item);
    }

}
