<?php

namespace App\Http\Controllers;

use App\Models\CreatorReferral;
use App\Models\CreatorReferralPayout;
use App\Models\FinancialTransaction;
use App\Models\ReferralCode;
use App\Services\CreatorReferralService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ReferAndEarnController extends Controller
{
    public function checkCreatorReferral($code)
    {
        try {
            if (! $code) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Referral code is required.',
                ]);
            }

            $referral = ReferralCode::with('creator:id,name')
                ->where('code', $code)
                ->where('is_active', 1)
                ->first();

            if (! $referral) {
                return response()->json([
                    'status' => false,
                    'msg' => 'Invalid or inactive referral code.',
                ]);
            }

            $creatorName = $referral->creator?->name ?? 'Creator';

            return response()->json([
                'status' => true,
                'msg' => "🎉 {$creatorName}'s referral code has been applied successfully.",
                'creator' => [
                    'id' => $referral->creator?->id,
                    'name' => $creatorName,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking referral code: '.$e->getMessage());

            return response()->json([
                'status' => false,
                'msg' => 'Something went wrong while validating the referral code.',
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

        $referralLink = $referralCode ? url('/register?ref='.$referralCode) : null;

        /* =====================================================| All Referrals===================================================== */
        $referralQuery = CreatorReferral::with(['referred:id,name,username,created_at'])->where('referrer_creator_id', $user->id);

        $totalReferrals = $referralQuery->count();

        /*
         * ⚠️ ONE QUERY, NOT ONE PER ROW. The rejected-payout lookup sat inside
         * the map and does not depend on the referral at all, so a creator
         * with twenty referrals paid for twenty identical queries.
         */
        $rejectedPayout = CreatorReferralPayout::where('creator_id', $user->id)
            ->where('status', 'REJECTED')
            ->latest()
            ->first();

        $service = app(CreatorReferralService::class);

        $referrals = $referralQuery
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($ref) use ($rejectedPayout, $service) {
                $threshold = $ref->qualifyingThreshold();

                return [
                    'id' => $ref->id,
                    'name' => $ref->referred->name ?? '-',
                    'username' => $ref->referred->username ?? '-',
                    'joined_at' => optional($ref->referred->created_at)->format('d M Y'),
                    'lifetime_gmv' => (float) $ref->lifetime_gmv,
                    'status' => $ref->status,
                    /*
                     * 🚨 PER-ROW, NEVER THE CONFIG VALUE. A referral made
                     * before 11 Sep 2026 qualifies at £1,000 while a new one
                     * needs £2,000, and the creator must see the bar their own
                     * referral is actually judged against.
                     */
                    'threshold' => $threshold,
                    'reward' => $ref->rewardAmount(),
                    'progress_pct' => round($ref->progressPercentage(), 1),
                    // Signed up → Active → Earning → Qualified → Paid.
                    'stage' => $service->stageFor($ref),
                    'rejection_reason' => $rejectedPayout?->rejection_reason,
                ];
            });

        /* =====================================================| Qualified Referrals===================================================== */
        /*
         * 🚨 `qualified_at` IS THE FACT, AND THE THRESHOLD COMPARISON IS GONE.
         * These two queries used to re-test `lifetime_gmv >= config(...)` — so
         * the day the threshold moved from £1,000 to £2,000 every referral
         * qualified under the old terms silently stopped counting, and a
         * creator with money owed read zero. `CreatorReferralService` applies
         * the row's OWN threshold when it stamps `qualified_at`; nothing
         * downstream may second-guess it against a different number.
         */
        $qualifiedCount = CreatorReferral::where('referrer_creator_id', $user->id)
            ->whereNotNull('qualified_at')
            ->count();

        /* =====================================================| Earnings (LIFETIME)===================================================== */
        // ⚠️ SUMMED PER ROW, not count × today's reward: each referral carries
        // the reward it was made under.
        $totalEarned = (float) CreatorReferral::where('referrer_creator_id', $user->id)
            ->whereNotNull('qualified_at')
            ->get(['reward_amount'])
            ->sum(fn ($r) => $r->rewardAmount());

        /* =====================================================| Payout State===================================================== */
        $hasActivePayout = CreatorReferralPayout::where('creator_id', $user->id)
            ->whereIn('status', ['PENDING'])
            ->exists();

        /* =====================================================| Available Balance===================================================== */
        $payableReferrals = CreatorReferral::where('referrer_creator_id', $user->id)
            ->whereNotNull('qualified_at')
            ->where('status', 'QUALIFIED')
            ->get(['reward_amount']);

        $rewardAmount = (float) config('referral.reward_amount', 50);
        $availableForPayout = (float) $payableReferrals->sum(fn ($r) => $r->rewardAmount());

        /* =====================================================| Paid Out Amount===================================================== */
        $paidOutAmount = CreatorReferralPayout::where('creator_id', $user->id)
            ->where('status', 'PAID')
            ->sum('amount');

        /*
         * ⚠️ ANY payable referral, not "at least one reward's worth at today's
         * price". A creator holding a single £50 referral made under the old
         * terms would be refused by a `>= config(...)` test the day that
         * figure was raised.
         */
        $canRedeem = $payableReferrals->isNotEmpty() && ! $hasActivePayout;

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
                'total_referrals' => $totalReferrals,
                'qualified_referrals' => $qualifiedCount,
                'total_earned' => $totalEarned,
                'available_for_payout' => $availableForPayout,
                'paid_out_amount' => (float) $paidOutAmount,
                // 🚨 The figures a NEW referral is made under. The per-row
                // `threshold` above is what an EXISTING one is judged at, and
                // for a pre-11-Sep-2026 referral the two differ.
                'reward_amount' => $rewardAmount,
                'qualifying_threshold' => (float) config('referral.qualifying_gmv', 2000),
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
                'link' => url('/register?ref='.$existing->code),
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
            'code' => $code,
            'is_active' => 1,
        ]);

        return response()->json([
            'code' => $referral->code,
            'link' => url('/register?ref='.$referral->code),
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

        /*
         * 🚨 IDENTITY IS A PAYOUT GATE (10 Sep 2026) — see
         * `App\Support\PayoutEligibility`, which every path that moves money
         * off this platform reads. A referral reward IS money leaving, and
         * this request is what puts it into a payout batch.
         *
         * 🚨 THE IDENTITY CHECK THAT USED TO SIT HERE IS GONE (11 Sep 2026, client
         * D5/Q20: "Remove the SP-specific ID-document and human identity-sign-off
         * process entirely. Do not move it to payout."). Stripe Connect's own KYC
         * decides whether the connected account may receive the transfer; Spenny
         * Piggy does not run a second check on top of it.
         */

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
            // ⚠️ SUMMED PER REFERRAL, not count × today's reward. A referral
            // carries the reward it was made under, and after 11 Sep 2026 a
            // creator can legitimately hold referrals at two different values.
            $amount = (float) $qualifiedReferrals->sum(fn ($r) => $r->rewardAmount());

            // 4️⃣ Check for last rejected payout
            $rejectedPayout = CreatorReferralPayout::where('creator_id', $creator->id)
                ->where('status', 'REJECTED')
                ->latest()
                ->lockForUpdate()
                ->first();

            if ($rejectedPayout) {
                // 🔁 Reuse rejected payout
                $rejectedPayout->update([
                    'status' => 'PENDING',
                    'amount' => $amount,
                    'requested_at' => now(),
                    // ❗ DO NOT clear rejection_reason
                    'approved_at' => null,
                    'approved_by_admin_id' => null,
                ]);

                $payout = $rejectedPayout;
            } else {
                // ➕ Create fresh payout
                $payout = CreatorReferralPayout::create([
                    'creator_id' => $creator->id,
                    'amount' => $amount,
                    'status' => 'PENDING',
                    'requested_at' => now(),
                ]);
            }

            // 5️⃣ Lock referrals into payout state, stamped with THIS payout's id so the admin
            // approve/reject can act on exactly this batch and not a later unpaid one.
            CreatorReferral::whereIn('id', $qualifiedReferrals->pluck('id'))
                ->update([
                    'status' => 'PAYOUT_REQUESTED',
                    'payout_id' => $payout->id,
                ]);

            // 6️⃣ Create FinancialTransaction record for audit trail
            FinancialTransaction::updateOrCreate(
                [
                    'source_type' => CreatorReferralPayout::class,
                    'source_id' => $payout->id,
                ],
                [
                    'user_id' => $creator->id,
                    /*
                     * 🚨 `referral_payout`, NEVER `income`. Every qualifying
                     * earnings definition on this platform filters on
                     * `type = 'income'`, so a reward recorded as income would
                     * count towards the referrer's own membership credits and
                     * towards any future scheme measured the same way — a
                     * bonus feeding its own qualifying total. Fast Start, the
                     * Growth Bonus and the membership credit all avoid the
                     * identical loop.
                     */
                    'type' => 'referral_payout',
                    'gross_amount' => $amount,
                    'platform_fee' => 0,
                    'stripe_fee' => 0,
                    'vat_amount' => 0,
                    'net_amount' => $amount,
                    'reserve_amount' => 0,
                    'reserve_status' => 'none',
                    'currency' => config('referral.currency', 'gbp'),
                    'status' => 'pending',
                    'description' => "Referral payout request for {$qualifiedReferrals->count()} referral(s)",
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
