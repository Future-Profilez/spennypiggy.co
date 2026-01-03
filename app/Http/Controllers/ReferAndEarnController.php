<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\CreatorReferral;
use App\Models\CreatorReferralPayout;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

        // =========================
        // Referral List
        // =========================
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

        // =========================
        // Stats
        // =========================
        $totalReferrals = CreatorReferral::where('referrer_creator_id', $user->id)->count();

        $qualifiedReferralsCount = CreatorReferral::where('referrer_creator_id', $user->id)
            ->whereIn('status', ['QUALIFIED', 'PAYOUT_REQUESTED', 'PAID'])
            ->count();

        // Total actually PAID to creator
        $totalEarned = CreatorReferralPayout::where('creator_id', $user->id)
            ->whereNotNull('paid_at')
            ->sum('amount');

        // =========================
        // ✅ AVAILABLE FOR PAYOUT (CORRECT)
        // =========================
        $availableReferralCount = CreatorReferral::where('referrer_creator_id', $user->id)
            ->where('status', 'QUALIFIED')
            ->whereNotNull('qualified_at')
            ->count();

        $availableForPayout = $availableReferralCount * 50;

        // Prevent multiple active payout requests
        $hasPendingPayout = CreatorReferralPayout::where('creator_id', $user->id)
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->exists();

        $canRedeem = $availableForPayout > 0 && !$hasPendingPayout;

        return Inertia::render('Refer/ReferAndEarn', [
            'auth' => ['user' => $user],
            'referral' => [
                'code' => $user->referral_code,
                'link' => $referralLink,
            ],
            'stats' => [
                'total_referrals' => $totalReferrals,
                'qualified_referrals' => $qualifiedReferralsCount,
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

        try {
            DB::beginTransaction();

            // 1️⃣ Get all qualified referrals
            $qualifiedReferrals = CreatorReferral::where('referrer_creator_id', $creator->id)
                ->where('status', 'QUALIFIED')
                ->whereNotNull('qualified_at')
                ->lockForUpdate()
                ->get();

            if ($qualifiedReferrals->isEmpty()) {
                DB::rollBack();
                return back()->with('error', 'No qualified referrals available for payout.');
            }

            // 2️⃣ Prevent multiple pending payouts
            $hasPending = CreatorReferralPayout::where('creator_id', $creator->id)
                ->whereIn('status', ['PENDING', 'APPROVED'])
                ->exists();

            if ($hasPending) {
                DB::rollBack();
                return back()->with('error', 'You already have a payout under review.');
            }

            // 3️⃣ Calculate payout amount
            $amount = $qualifiedReferrals->count() * 50;

            // 4️⃣ Create payout request (NO creator_referral_id)
            $payout = CreatorReferralPayout::create([
                'creator_id'  => $creator->id,
                'amount'      => $amount,
                'status'      => 'PENDING',
                'requested_at' => now(),
            ]);

            // 5️⃣ Lock all referrals into payout state
            CreatorReferral::whereIn('id', $qualifiedReferrals->pluck('id'))
                ->update([
                    'status' => 'PAYOUT_REQUESTED',
                ]);

            DB::commit();

            return back()->with(
                'success',
                'Your referral payout request has been sent for admin review.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('Referral payout request failed', [
                'creator_id' => $creator->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with(
                'error',
                'Something went wrong while requesting payout. Please try again.'
            );
        }
    }
}
