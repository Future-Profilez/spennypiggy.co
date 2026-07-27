<?php

namespace App\Http\Controllers;

use App\Models\SavedItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class SavedItemController extends Controller
{
    /**
     * Toggle an item in the supporter's save-for-later list.
     * Body: { product_type, item_id }. Returns { saved: bool }.
     */
    public function toggle(Request $request)
    {
        $data = $request->validate([
            'product_type' => ['required', Rule::in(SavedItem::TYPES)],
            'item_id' => ['required', 'integer', 'min:1'],
        ]);

        $user = Auth::user();
        $attrs = [
            'user_id' => $user->id,
            'product_type' => $data['product_type'],
            'item_id' => $data['item_id'],
        ];

        $existing = SavedItem::where($attrs)->first();
        if ($existing) {
            $existing->delete();

            return response()->json(['saved' => false]);
        }

        SavedItem::create($attrs);

        return response()->json(['saved' => true]);
    }

    /**
     * The IDs the current user has saved, grouped by product_type — lets browse
     * surfaces mark their save buttons as active in one request.
     */
    public function mine()
    {
        $rows = SavedItem::where('user_id', Auth::id())
            ->get(['product_type', 'item_id']);

        $byType = [];
        foreach ($rows as $r) {
            $byType[$r->product_type][] = $r->item_id;
        }

        return response()->json(['saved' => $byType]);
    }
}
