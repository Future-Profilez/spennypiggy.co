<?php

namespace App\Http\Controllers;

use App\Models\Deliverable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchasesController extends Controller
{
    /**
     * Display the user's purchases
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get deliverables for the authenticated user (as gifter)
        $sentDeliverables = Deliverable::where('gifter_id', $user->id)
            ->with(['creator', 'wishItem'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Get deliverables received by the user (as creator)
        $receivedDeliverables = Deliverable::where('creator_id', $user->id)
            ->with(['gifter', 'wishItem'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Purchases/Index', [
            'sentDeliverables' => $sentDeliverables,
            'receivedDeliverables' => $receivedDeliverables,
        ]);
    }
}