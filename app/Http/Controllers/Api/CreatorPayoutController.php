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
        $data = $this->payoutService->getHeldReserves($request->user()->uuid);
        return response()->json($data);
    }
}
