<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\CreatorReferral;
use App\Models\CreatorReferralPayout;
use App\Models\FinancialTransaction;
use App\Models\ReferralCode;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReferAndEarnController extends Controller
{
    public function checkCreatorReferral($code)
    {
        try {
            if (!$code) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Referral code is required.'
                ]);
            }

            $referral = ReferralCode::with('creator:id,name')
                ->where('code', $code)
                ->where('is_active', 1)
                ->first();

            if (!$referral) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Invalid or inactive referral code.'
                ]);
            }

            $creatorName = $referral->creator?->name ?? 'Creator';

            return response()->json([
                'status' => true,
                'msg' => "🎉 {$creatorName}'s referral code has been applied successfully.",
                'creator' => [
                    'id'   => $referral->creator?->id,
                    'name' => $creatorName,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking referral code: ' . $e->getMessage());

            return response()->json([
                'status' => false,
                'msg' => 'Something went wrong while validating the referral code.'
            ], 500);
        }
    }


    public function index(Request $request)
    {
        $user = $request->user();

        // Only creators
        if ($user->role != 1) {
            abort(403);
        }

        /* =====================================================
     | Referral Code
     ===================================================== */
        $referralCode = ReferralCode::where('creator_id', $user->id)
            ->where('is_active', 1)
            ->value('code');

        $referralLink = $referralCode ? url('/register?ref=' . $referralCode) : null;

        /* =====================================================| All Referrals===================================================== */
        $referralQuery = CreatorReferral::with(['referred:id,name,username,created_at'])->where('referrer_creator_id', $user->id);

        $totalReferrals = $referralQuery->count();

        $referrals = $referralQuery->orderByDesc('created_at')->get()->map(function ($ref) use ($user) {
            // Get latest rejected payout (if any)
            $rejectedPayout = CreatorReferralPayout::where('creator_id', $user->id)
                ->where('status', 'REJECTED')
                ->latest()
                ->first();

            return [
                'id'               => $ref->id,
                'name'             => $ref->referred->name ?? '-',
                'username'         => $ref->referred->username ?? '-',
                'joined_at'        => optional($ref->referred->created_at)->format('d M Y'),
                'lifetime_gmv'     => (float) $ref->lifetime_gmv,
                'status'           => $ref->status,
                'rejection_reason' => $rejectedPayout?->rejection_reason,
            ];
        });


        /* =====================================================| Qualified Referrals (LIFETIME)===================================================== */
        $qualifiedCount = CreatorReferral::where('referrer_creator_id', $user->id)
            ->whereNotNull('qualified_at')
            ->where('lifetime_gmv', '>=', 1000)
            ->count();

        /* =====================================================| Earnings (LIFETIME)===================================================== */
        $rewardAmount = config('referral.reward_amount', 50);
        $totalEarned = $qualifiedCount * $rewardAmount;

        /* =====================================================| Payout State===================================================== */
        $hasActivePayout = CreatorReferralPayout::where('creator_id', $user->id)
            ->whereIn('status', ['PENDING'])
            ->exists();

        /* =====================================================| Available Balance===================================================== */
        $availableForPayouts = CreatorReferral::where('referrer_creator_id', $user->id)
            ->whereNotNull('qualified_at')
            ->where('lifetime_gmv', '>=', 1000)
            ->where('status', 'QUALIFIED')
            ->count();

        $totalEarn = $availableForPayouts * $rewardAmount;

        $availableForPayout = $availableForPayouts ? $totalEarn : 0;

        /* =====================================================| Paid Out Amount===================================================== */
        $paidOutAmount = CreatorReferralPayout::where('creator_id', $user->id)
            ->where('status', 'PAID')
            ->sum('amount');

        $canRedeem = $availableForPayout >= $rewardAmount && !$hasActivePayout;

        /* =====================================================| Response===================================================== */
        // dd($referrals, $qualifiedCount, $totalEarned, $hasActivePayout, $availableForPayout, $canRedeem);
        return Inertia::render('Refer/ReferAndEarn', [
            'auth' => [
                'user' => $user,
            ],

            'referral' => [
                'code' => $referralCode,
                'link' => $referralLink,
            ],

            'stats' => [
                'total_referrals'      => $totalReferrals,
                'qualified_referrals'  => $qualifiedCount,
                'total_earned'         => $totalEarned,
                'available_for_payout' => $availableForPayout,
                'paid_out_amount'      => (float) $paidOutAmount,
            ],

            'referrals' => $referrals,
            'canRedeem' => $canRedeem,
        ]);
    }

    public function createReferralLink(Request $request)
    {
        $user = $request->user();

        // Only creators allowed
        if ($user->role != 1) {
            abort(403);
        }

        // ❌ Block if already generated
        $existing = ReferralCode::where('creator_id', $user->id)
            ->where('is_active', 1)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already generated your referral link.',
                'code' => $existing->code,
                'link' => url('/register?ref=' . $existing->code),
            ], 409);
        }

        // ✅ Generate unique referral code
        do {
            $code = strtoupper(Str::random(6));
        } while (
            ReferralCode::where('code', $code)->exists()
        );

        // ✅ Store in referral_codes table
        $referral = ReferralCode::create([
            'creator_id' => $user->id,
            'code'       => $code,
            'is_active'  => 1,
        ]);

        return response()->json([
            'code' => $referral->code,
            'link' => url('/register?ref=' . $referral->code),
        ]);
    }

    public function requestRedeem()
    {
        $creator = auth()->user();

        // 0️⃣ Check Stripe connection
        if (empty($creator->account_id)) {
            return back()->with('error', 'Please connect your Stripe account before requesting a payout.');
        }

        // 0️⃣ Check if payouts are blocked by admin (suspended account)
        if ($creator->suspended_account) {
            return back()->with('error', 'Your payouts are currently disabled. Please contact support.');
        }

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

            // 2️⃣ Block if payout already under review
            $hasActivePayout = CreatorReferralPayout::where('creator_id', $creator->id)
                ->whereIn('status', ['PENDING', 'APPROVED'])
                ->exists();

            if ($hasActivePayout) {
                DB::rollBack();
                return back()->with('error', 'You already have a payout under review.');
            }

            // 3️⃣ Calculate payout amount
            $rewardAmount = config('referral.reward_amount', 50);
            $amount = $qualifiedReferrals->count() * $rewardAmount;

            // 4️⃣ Check for last rejected payout
            $rejectedPayout = CreatorReferralPayout::where('creator_id', $creator->id)
                ->where('status', 'REJECTED')
                ->latest()
                ->lockForUpdate()
                ->first();

            if ($rejectedPayout) {
                // 🔁 Reuse rejected payout
                $rejectedPayout->update([
                    'status'       => 'PENDING',
                    'amount'       => $amount,
                    'requested_at' => now(),
                    // ❗ DO NOT clear rejection_reason
                    'approved_at'  => null,
                    'approved_by_admin_id' => null,
                ]);

                $payout = $rejectedPayout;
            } else {
                // ➕ Create fresh payout
                $payout = CreatorReferralPayout::create([
                    'creator_id'   => $creator->id,
                    'amount'       => $amount,
                    'status'       => 'PENDING',
                    'requested_at' => now(),
                ]);
            }

            // 5️⃣ Lock referrals into payout state
            CreatorReferral::whereIn('id', $qualifiedReferrals->pluck('id'))
                ->update([
                    'status' => 'PAYOUT_REQUESTED',
                ]);

            // 6️⃣ Create FinancialTransaction record for audit trail
            FinancialTransaction::updateOrCreate(
                [
                    'source_type' => CreatorReferralPayout::class,
                    'source_id'   => $payout->id,
                ],
                [
                    'user_id'          => $creator->id,
                    'type'             => 'referral_payout',
                    'gross_amount'     => $amount,
                    'platform_fee'     => 0,
                    'stripe_fee'       => 0,
                    'vat_amount'       => 0,
                    'net_amount'       => $amount,
                    'reserve_amount'   => 0,
                    'reserve_status'   => 'none',
                    'currency'         => config('referral.currency', 'gbp'),
                    'status'           => 'pending',
                    'description'      => "Referral payout request for {$qualifiedReferrals->count()} referral(s)",
                    'transaction_date' => now(),
                ]
            );

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
