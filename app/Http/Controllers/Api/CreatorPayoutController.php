<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Risk\PayoutService;
use Illuminate\Http\Request;

class CreatorPayoutController extends Controller
{
    protected $payoutService;

    public function __construct(PayoutService $payoutService)
    {
        $this->payoutService = $payoutService;
    }

    public function getReserves(Request $request)
    {
        $uuid = $request->user()->uuid;
        // Match the page's display currency (passed by the UI) so the modal doesn't flip
        // back to the creator's default currency after the live refresh.
        $currency = $request->query('currency') ?: ($request->user()->default_currency ?? 'GBP');
        $data = $this->payoutService->getHeldReserves($uuid, $currency);
        $released = $this->payoutService->getReleasedReserves($uuid, 100, $currency);
        $data['released_breakdown'] = $released['breakdown'] ?? [];
        $data['total_released'] = $released['total_released'] ?? 0;
        return response()->json($data);
    }
}
