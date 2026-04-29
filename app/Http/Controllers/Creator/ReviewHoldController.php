<?php

namespace App\Http\Controllers\Creator;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Payment;

class ReviewHoldController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $holds = Payment::where('creator_id', $user->uuid)
            ->whereIn('status', ['review_hold', 'disputed'])
            ->orderBy('created_at', 'desc')
            ->get();

        $holds->each(function ($hold) {
            $hold->user = $hold->getGifter();
        });

        return Inertia::render('Creator/Finance/ReviewHolds', [
            'holds' => $holds
        ]);
    }
}
