<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\CreatorReferral;
use App\Models\CreatorReferralPayout;

class ReferAndEarnController extends Controller
{
    // public function index(Request $request)
    // {
    //     $user = $request->user();

    //     // 🔒 Only creators
    //     if ($user->role != 1) {
    //         abort(403);
    //     }

    //     // Referral link
    //     $referralLink = url('/register?ref=' . $user->referral_code);

    //     // Fetch referrals made by this creator
    //     $referrals = CreatorReferral::with('referred:id,name,username,created_at')
    //         ->where('referrer_creator_id', $user->id)
    //         ->orderByDesc('created_at')
    //         ->get()
    //         ->map(function ($ref) {
    //             return [
    //                 'id' => $ref->id,
    //                 'name' => $ref->referred->name,
    //                 'username' => $ref->referred->username,
    //                 'joined_at' => $ref->referred->created_at->format('d M Y'),
    //                 'lifetime_gmv' => (float) $ref->lifetime_gmv,
    //                 'status' => $ref->status,
    //             ];
    //         });

    //     // Stats
    //     $totalReferrals = $referrals->count();
    //     $qualifiedReferrals = $referrals->where('status', 'QUALIFIED')->count();

    //     $totalEarned = CreatorReferralPayout::where('creator_id', $user->id)
    //         ->whereNotNull('paid_at')
    //         ->sum('amount');

    //     $availableForPayout = CreatorReferralPayout::where('creator_id', $user->id)
    //         ->where('approval_status', 'APPROVED')
    //         ->whereNull('paid_at')
    //         ->sum('amount');

    //     return Inertia::render('Refer/ReferAndEarn', [
    //         'auth' => [
    //             'user' => $user,
    //         ],
    //         'referral' => [
    //             'code' => $user->referral_code,
    //             'link' => $referralLink,
    //         ],
    //         'stats' => [
    //             'total_referrals' => $totalReferrals,
    //             'qualified_referrals' => $qualifiedReferrals,
    //             'total_earned' => (float) $totalEarned,
    //             'available_for_payout' => (float) $availableForPayout,
    //         ],
    //         'referrals' => $referrals,
    //     ]);
    // }
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role != 1) {
            abort(403);
        }

        $referralLink = url('/register?ref=' . $user->referral_code);

        $referrals = CreatorReferral::with('referred:id,name,username,created_at')
            ->where('referrer_creator_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($ref) {
                return [
                    'id' => $ref->id,
                    'name' => $ref->referred->name,
                    'username' => $ref->referred->username,
                    'joined_at' => optional($ref->referred->created_at)->format('d M Y'),
                    'lifetime_gmv' => (float) $ref->lifetime_gmv,
                    'status' => $ref->status,
                ];
            });

        $totalReferrals = CreatorReferral::where('referrer_creator_id', $user->id)->count();

        $qualifiedReferrals = CreatorReferral::where('referrer_creator_id', $user->id)
            ->whereIn('status', ['QUALIFIED', 'PAYOUT_REQUESTED', 'PAID'])
            ->count();

        $totalEarned = CreatorReferralPayout::where('creator_id', $user->id)
            ->whereNotNull('paid_at')
            ->sum('amount');

        $availableForPayout = CreatorReferralPayout::where('creator_id', $user->id)
            ->where('approval_status', 'APPROVED')
            ->whereNull('paid_at')
            ->sum('amount');

        $hasPendingPayout = CreatorReferralPayout::where('creator_id', $user->id)
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->exists();

        $canRedeem = CreatorReferral::where('referrer_creator_id', $user->id)
            ->where('status', 'QUALIFIED')
            ->whereNotNull('qualified_at')
            ->where('lifetime_gmv', '>=', 1000)
            ->exists() && !$hasPendingPayout;

        return Inertia::render('Refer/ReferAndEarn', [
            'auth' => ['user' => $user],
            'referral' => [
                'code' => $user->referral_code,
                'link' => $referralLink,
            ],
            'stats' => [
                'total_referrals' => $totalReferrals,
                'qualified_referrals' => $qualifiedReferrals,
                'total_earned' => (float) $totalEarned,
                'available_for_payout' => (float) $availableForPayout,
            ],
            'referrals' => $referrals,
            'canRedeem' => $canRedeem,
        ]);
    }


    public function createReferralLink(Request $request)
    {
        $user = $request->user();

        if ($user->role != 1) {
            abort(403);
        }

        // ❌ Already generated — block regeneration
        if ($user->referral_code) {
            return response()->json([
                'message' => 'You have already generated your referral link.',
                'code' => $user->referral_code,
                'link' => url('/register?ref=' . $user->referral_code),
            ], 409); // Conflict
        }

        // ✅ Generate unique referral code
        do {
            $code = strtoupper(Str::random(6));
        } while (
            \App\Models\User::where('referral_code', $code)->exists()
        );

        $user->update([
            'referral_code' => $code,
        ]);

        return response()->json([
            'code' => $code,
            'link' => url('/register?ref=' . $code),
        ]);
    }

    public function requestRedeem()
    {
        $creator = auth()->user();

        // Get eligible referral
        $referral = \App\Models\CreatorReferral::where('referrer_creator_id', $creator->id)
            ->where('status', 'QUALIFIED')
            ->whereNotNull('qualified_at')
            ->where('lifetime_gmv', '>=', 1000)
            ->first();

        if (!$referral) {
            return back()->with('error', 'You are not eligible to redeem yet.');
        }

        // Prevent duplicate payout requests
        $alreadyRequested = \App\Models\CreatorReferralPayout::where(
            'creator_referral_id',
            $referral->id
        )->whereIn('status', ['PENDING', 'APPROVED', 'PAID'])->exists();

        if ($alreadyRequested) {
            return back()->with('error', 'Payout already requested.');
        }

        // Create payout request
        \App\Models\CreatorReferralPayout::create([
            'creator_referral_id' => $referral->id,
            'creator_id' => $creator->id,
            'amount' => 50,
            'status' => 'PENDING',
            'requested_at' => now(),
        ]);

        // Update referral status
        $referral->update([
            'status' => 'PAYOUT_REQUESTED',
        ]);

        return back()->with(
            'success',
            'Your referral payout request has been sent for admin review.'
        );
    }
}
