<?php

namespace App\Services;

use App\Jobs\SendReferralQualifiedEmailJob;
use App\Models\CreatorReferral;
use App\Models\User;
use App\Support\QualifyingEarnings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * The creator referral: bring a creator who goes on to sell, get paid once.
 *
 * 🚨 NEW NUMBERS FROM 11 Sep 2026 — £2,000 in qualifying settled earnings by
 * the REFERRED creator releases £50 to the referrer. The scheme continues; only
 * the figures moved (simplification programme §5, W10). The machinery is the
 * existing `CreatorReferral` / `ReferralCode` / `CreatorReferralPayout` — this
 * class replaces the qualification LOGIC that used to sit in
 * `Helpers::recalculateGmv`, and nothing parallel was built.
 *
 * 🚨 THE THRESHOLD IS READ FROM THE ROW, NEVER FROM CONFIG. Every referral
 * carries its own `qualifying_threshold`, stamped when it was created. A
 * creator who referred somebody under the old £1,000 is still judged at
 * £1,000 — the retirement plan calls in-flight referrals the trap here, and
 * moving the goalposts on somebody part-way to qualifying is exactly what it
 * warns against. `config('referral.qualifying_gmv')` decides what a NEW
 * referral is stamped with and nothing else.
 *
 * 🚨 PROGRESS IS `App\Support\QualifyingEarnings` AND NOTHING ELSE — the lifted
 * `GrowthBonusService::computeGmv()`. It was `Payment::sum('amount')`, i.e. the
 * supporter's GROSS charge including fees, which on this platform is ~30% above
 * the listed price: a creator crossed the old £1,000 at roughly £766 of listed
 * sales, and a refund never came back off it at all. The specification is
 * "settled earnings only; refunds and chargebacks reduce progress", and this is
 * the one definition that does that.
 *
 * ⚠️ IT IS NOT "WHAT THE CREATOR KEEPS": where VAT applies, part of the figure
 * goes to HMRC. Copy says "settled earnings", never "take-home".
 *
 * 🚨 THE REWARD IS NEVER AN INCOME `FinancialTransaction`. The payout request
 * writes a `referral_payout` row, which is deliberately not `type = income` —
 * a reward counted as income would feed the referred creator's own qualifying
 * total. Fast Start, the Growth Bonus and the membership credit all avoid the
 * same loop.
 */
class CreatorReferralService
{
    /* ---- statuses already on the table (never renamed: historic rows) ---- */
    public const STATUS_IN_PROGRESS = 'IN_PROGRESS';

    public const STATUS_QUALIFIED = 'QUALIFIED';

    public const STATUS_PAYOUT_REQUESTED = 'PAYOUT_REQUESTED';

    public const STATUS_PAID = 'PAID';

    public const STATUS_REVOKED = 'REVOKED';

    /* ---- fraud block codes -------------------------------------------- */
    public const BLOCK_SELF_REFERRAL = 'self_referral';

    public const BLOCK_ACCOUNT_TOO_NEW = 'account_too_new';

    public const BLOCK_SHARED_SIGNUP_IP = 'shared_signup_ip';

    public const BLOCK_NOT_NEW = 'not_a_new_creator';

    public const BLOCK_REFERRER_INELIGIBLE = 'referrer_not_eligible';

    /**
     * The threshold THIS referral is judged at.
     *
     * ⚠️ Falls back to config only for a row written before the column existed
     * and somehow missed by the backfill — never as the normal path.
     */
    public function thresholdFor(CreatorReferral $referral): float
    {
        $stamped = (float) ($referral->qualifying_threshold ?? 0);

        return $stamped > 0
            ? $stamped
            : (float) config('referral.qualifying_gmv', 2000);
    }

    /** The reward THIS referral pays, snapshot the same way. */
    public function rewardFor(CreatorReferral $referral): float
    {
        $stamped = (float) ($referral->reward_amount ?? 0);

        return $stamped > 0
            ? $stamped
            : (float) config('referral.reward_amount', 50);
    }

    /**
     * The five stages the client asked to be tracked:
     * Signed up → Active → Earning → Qualified → Paid.
     *
     * 🚨 DERIVED, NOT A SECOND COLUMN. The table's own `status` enum is what
     * the payout queries act on and it predates this list; adding a parallel
     * column would be two answers to "where is this referral", and an
     * ALTER on the enum would rewrite historic rows' meaning. Everything
     * below is readable from facts already recorded.
     */
    public function stageFor(CreatorReferral $referral): string
    {
        if ($referral->status === self::STATUS_PAID) {
            return 'paid';
        }

        if (in_array($referral->status, [self::STATUS_QUALIFIED, self::STATUS_PAYOUT_REQUESTED], true)
            || $referral->qualified_at !== null) {
            return 'qualified';
        }

        if ((float) $referral->lifetime_gmv > 0 || $referral->first_earned_at !== null) {
            return 'earning';
        }

        // "Active" is a creator who CAN sell — payouts connected. Before that
        // they are only signed up, and telling a referrer their referral is
        // "active" when nothing can be bought from them is untrue.
        if ($referral->referred?->stripe_connected_at !== null) {
            return 'active';
        }

        return 'signed_up';
    }

    /**
     * Is there a reason this referral must not qualify automatically? A code,
     * or null.
     *
     * 🚨 IT BLOCKS THE AUTOMATIC QUALIFICATION AND DELETES NOTHING. A shared
     * signup IP is a SIGNAL, not proof — a household, an office and a mobile
     * carrier's NAT all produce one — so the row is left for a person with the
     * reason recorded against it. Deleting it would destroy the only evidence
     * of what we saw.
     *
     * ⚠️ Self-referral is refused structurally at capture too (the referrer may
     * not be the referred user, in both the signup controller and
     * `GifterToCreator`). It is repeated here because a row created before
     * that check, or by hand, must still not pay.
     */
    public function blockReasonFor(CreatorReferral $referral): ?string
    {
        $referrer = $referral->referrer;
        $referred = $referral->referred;

        if (! $referrer || ! $referred) {
            return self::BLOCK_REFERRER_INELIGIBLE;
        }

        if ((int) $referrer->id === (int) $referred->id) {
            return self::BLOCK_SELF_REFERRAL;
        }

        /*
         * The REFERRER is the one being paid, so it is their bonus eligibility
         * that decides this — not the referred creator's. Checked at
         * qualification rather than at payout so nobody is told they have
         * earned something that will not be paid.
         */
        if (! $referrer->isBonusEligible()) {
            return self::BLOCK_REFERRER_INELIGIBLE;
        }

        $minAge = (int) config('referral.fraud.min_referred_account_age_days', 0);

        if ($minAge > 0
            && $referred->created_at
            && $referred->created_at->gt(now()->subDays($minAge))) {
            return self::BLOCK_ACCOUNT_TOO_NEW;
        }

        /*
         * "Genuinely new": the referred creator's account must have been
         * created no earlier than the referral itself. A referral row attached
         * to an account that already existed is somebody claiming a creator who
         * was already here.
         */
        if ($referred->created_at
            && $referral->created_at
            && $referred->created_at->lt($referral->created_at->copy()->subDay())) {
            return self::BLOCK_NOT_NEW;
        }

        if ((bool) config('referral.fraud.block_shared_signup_ip', true)
            && filled($referrer->ip_address)
            && filled($referred->ip_address)
            && $referrer->ip_address === $referred->ip_address) {
            return self::BLOCK_SHARED_SIGNUP_IP;
        }

        return null;
    }

    /**
     * Recompute one referred creator's progress and qualify the referral if it
     * has reached its own threshold.
     *
     * 🚨 NEVER THROWS. Every caller is inside a checkout, a webhook or a
     * scheduled sweep — the `VisitTracker` house pattern. A referral failing to
     * update must not fail the payment that triggered it.
     */
    public function recalculate(int|string $referredCreatorId): void
    {
        try {
            $referred = User::query()
                ->where('id', $referredCreatorId)
                ->orWhere('uuid', $referredCreatorId)
                ->first();

            if (! $referred) {
                return;
            }

            $referral = CreatorReferral::with(['referrer', 'referred'])
                ->where('referred_creator_id', $referred->id)
                ->first();

            if (! $referral) {
                return;
            }

            /*
             * 🚨 A PAID OR REQUESTED REFERRAL IS LEFT ALONE. One reward per
             * referred creator, ever — recomputing a referral whose money is
             * already in a payout batch could move it back out of it.
             */
            if (in_array($referral->status, [
                self::STATUS_PAID,
                self::STATUS_PAYOUT_REQUESTED,
                self::STATUS_REVOKED,
            ], true)) {
                return;
            }

            // One writer per referral. Two payments landing in the same second
            // would otherwise both read IN_PROGRESS and both queue the mail.
            $lock = Cache::lock('creator-referral:'.$referral->id, 20);

            if (! $lock->get()) {
                return;
            }

            try {
                $earnings = QualifyingEarnings::totalFor($referred);
                $threshold = $this->thresholdFor($referral);

                $referral->lifetime_gmv = round($earnings, 2);

                if ($earnings > 0 && $referral->first_earned_at === null) {
                    $referral->first_earned_at = now();
                }

                /*
                 * 🚨 A REFUND CAN TAKE A REFERRAL BACK BELOW ITS THRESHOLD, and
                 * an UNPAID qualification is withdrawn when it does. The old
                 * code returned early the moment a referral qualified, so a
                 * fully refunded referred creator stayed QUALIFIED for ever and
                 * the £50 was still payable.
                 *
                 * ⚠️ Only from QUALIFIED. A referral whose payout has been
                 * requested or paid is untouched above — the platform does not
                 * claw back money it has already promised or sent.
                 */
                if ($referral->status === self::STATUS_QUALIFIED && $earnings + 0.001 < $threshold) {
                    $referral->status = self::STATUS_IN_PROGRESS;
                    $referral->qualified_at = null;
                    $referral->save();

                    Log::info('Creator referral fell back below its threshold', [
                        'referral_id' => $referral->id,
                        'earnings' => $referral->lifetime_gmv,
                        'threshold' => $threshold,
                    ]);

                    return;
                }

                if ($referral->status !== self::STATUS_IN_PROGRESS || $earnings + 0.001 < $threshold) {
                    $referral->save();

                    return;
                }

                $block = $this->blockReasonFor($referral);

                if ($block !== null) {
                    /*
                     * Recorded and left for a person: the referral has reached
                     * the money but something about it needs judging. It is not
                     * revoked — an admin may well decide it is genuine.
                     */
                    $referral->blocked_reason = $block;
                    $referral->blocked_at = $referral->blocked_at ?? now();
                    $referral->save();

                    Log::warning('Creator referral reached its threshold and was held', [
                        'referral_id' => $referral->id,
                        'reason' => $block,
                    ]);

                    return;
                }

                $referral->status = self::STATUS_QUALIFIED;
                $referral->qualified_at = now();
                $referral->blocked_reason = null;
                $referral->blocked_at = null;
                $referral->save();

                $this->notifyQualified($referral);
            } finally {
                $lock->release();
            }
        } catch (\Throwable $e) {
            Log::error('CreatorReferralService::recalculate failed', [
                'referred_creator_id' => $referredCreatorId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * ⚠️ Never throws, and never blocks the qualification. The referral is
     * already saved by the time this runs; a failed message must not undo it.
     */
    private function notifyQualified(CreatorReferral $referral): void
    {
        try {
            SendReferralQualifiedEmailJob::dispatch($referral);

            $referrer = $referral->referrer;
            $name = $referral->referred?->name ?: 'A creator you referred';
            $reward = $this->rewardFor($referral);
            $threshold = $this->thresholdFor($referral);

            if ($referrer?->email) {
                /*
                 * ⚠️ FIGURES FROM THE ROW, NOT FROM LITERALS. This message used
                 * to read "has reached £1,000 GMV. £50 has been unlocked" with
                 * both numbers typed in — so the moment the threshold moved it
                 * told the creator a figure the payout query did not agree
                 * with, in writing.
                 */
                \App\Helpers::sendNotification(
                    '🎉 Referral goal reached',
                    sprintf(
                        '%s has reached %s in settled earnings. %s has been unlocked for you.',
                        $name,
                        '£'.number_format($threshold, 0),
                        '£'.number_format($reward, 0),
                    ),
                    $referrer->email,
                );
            }
        } catch (\Throwable $e) {
            Log::warning('CreatorReferralService: failed to announce a qualified referral', [
                'referral_id' => $referral->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
