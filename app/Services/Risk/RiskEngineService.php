<?php

namespace App\Services\Risk;

use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\RiskIdentity;
use App\Models\RiskSetting;
use App\Models\User;
use App\Support\RiskMessages;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RiskEngineService
{
    protected $identityService;

    protected $rollupService;

    protected $limitsService;

    public function __construct(
        RiskIdentityService $identityService,
        IdentityRollupService $rollupService,
        EffectiveLimitsService $limitsService
    ) {
        $this->identityService = $identityService;
        $this->rollupService = $rollupService;
        $this->limitsService = $limitsService;
    }

    /**
     * Evaluate risk for a payment attempt.
     *
     * @param  array  $context  [email, ip, device_id, card_fingerprint, amount, currency, creator_id]
     * @return array [decision, reason_codes, limits, ui]
     */
    public function evaluate(array $context): array
    {
        // --- KILL SWITCH CHECK ---
        // If RISK_ENGINE_ENABLED is false in .env, bypass all checks and ALLOW.
        if (config('services.risk_engine.enabled', true) === false) {
            Log::info('Risk Engine Bypassed (Kill Switch Active)');

            return $this->formatResponse(
                'ALLOW',
                ['RISK_ENGINE_DISABLED'],
                $this->limitsService->getEffectiveLimits(new RiskIdentity), // Default limits
                $context
            );
        }

        // 1. Resolve Identity
        $identity = $this->identityService->resolveIdentity($context);

        // --- HARD BLOCK: manually blocked identity ---
        // A blocked identity must never receive ALLOW, regardless of limits/rollups.
        if ($identity->is_blocked ?? false) {
            $decision = 'BLOCK';
            $reasons = ['IDENTITY_BLOCKED'];
            $this->logDecision($identity, $context, $decision, $reasons);

            return $this->formatResponse($decision, $reasons, $this->limitsService->getEffectiveLimits($identity), $context);
        }

        // 2. Refresh Rollups (to have latest counters)
        $rollup = $this->rollupService->refreshRollups($identity);

        // 3. Get Effective Limits
        $limits = $this->limitsService->getEffectiveLimits($identity);

        $supporterRules = RiskSetting::get('supporter_rules', []);
        $creatorRules = RiskSetting::get('creator_rules', []);
        $highVelocityRules = RiskSetting::get('high_velocity_rules', []);
        $crossCreatorRules = RiskSetting::get('cross_creator_rules', []);

        $amount = $context['amount'] ?? 0;
        $amountGbp = app(MoneyNormalizer::class)->toGbpMinor((int) $amount, (string) ($context['currency'] ?? 'GBP'));
        $creatorId = $context['creator_id'] ?? null;

        $decision = 'ALLOW';
        $reasons = [];

        // --- RULE 0: COOLDOWN CHECK ---
        // ⚠️ The remaining minutes are deliberately NOT surfaced. A precise
        // countdown tells a card tester exactly when to resume, so the copy in
        // RiskMessages says "in a little while" instead. Do not put the value
        // back into the payload "just for the UI" — the payload is readable.
        if ($identity->cooldown_until && $identity->cooldown_until->isFuture()) {
            $decision = 'COOLDOWN';
            $reasons[] = 'ACTIVE_COOLDOWN';
            $this->logDecision($identity, $context, $decision, $reasons);

            return $this->formatResponse($decision, $reasons, $limits, $context);
        }

        // --- RULE 1: GUEST BLOCK (THROTTLE/FREEZE) ---
        if (! $limits['guest_allowed'] && $identity->is_guest) {
            $decision = 'BLOCK';
            $reasons[] = 'GUEST_BLOCKED_IN_STATE';
            $this->logDecision($identity, $context, $decision, $reasons);

            return $this->formatResponse($decision, $reasons, $limits, $context);
        }

        // --- RULE 2: SPEND LIMITS (1H, 24H, 7D) ---
        // Check 1 Hour Limit
        if (($rollup->spend_1h + $amountGbp) > $limits['max_spend_1h']) {
            $decision = 'BLOCK';
            $reasons[] = 'LIMIT_EXCEEDED_1H';
            $this->logDecision($identity, $context, $decision, $reasons);

            return $this->formatResponse($decision, $reasons, $limits, $context);
        }

        // Check 24 Hour Limit
        if (($rollup->spend_24h + $amountGbp) > $limits['max_spend_24h']) {
            $decision = 'BLOCK';
            $reasons[] = 'LIMIT_EXCEEDED_24H';
            $this->logDecision($identity, $context, $decision, $reasons);

            return $this->formatResponse($decision, $reasons, $limits, $context);
        }

        // Check 7 Day Limit
        if (($rollup->spend_7d + $amountGbp) > $limits['max_spend_7d']) {
            $decision = 'BLOCK';
            $reasons[] = 'LIMIT_EXCEEDED_7D';
            $this->logDecision($identity, $context, $decision, $reasons);

            return $this->formatResponse($decision, $reasons, $limits, $context);
        }

        // --- RULE 3: SINGLE TRANSACTION LIMIT (> threshold -> STEP_UP) ---
        $singleTxStepUpAmount = (int) ($limits['step_up_threshold'] ?? ($supporterRules['single_tx_step_up_amount'] ?? 20000));
        $singleTxReviewHoldAmount = (int) ($limits['review_hold_threshold'] ?? 0);

        if ($singleTxStepUpAmount > 0 && $amountGbp > $singleTxStepUpAmount) {
            if ($decision !== 'BLOCK' && $decision !== 'COOLDOWN') {
                $decision = 'STEP_UP';
                $reasons[] = 'HIGH_VALUE_TX';
                $reasons[] = 'FORCE_3DS';

                if ($singleTxReviewHoldAmount > 0 && $amountGbp > $singleTxReviewHoldAmount) {
                    $reasons[] = 'MARK_REVIEW_HOLD';
                }

            }
        } elseif ($singleTxReviewHoldAmount > 0 && $amountGbp > $singleTxReviewHoldAmount) {
            if ($decision !== 'BLOCK' && $decision !== 'COOLDOWN') {
                $reasons[] = 'MARK_REVIEW_HOLD';
            }
        }

        // --- RULE 4: NEW CREATOR ACCOUNT PROTECTION (< age_days -> daily cap) ---
        $newCreatorAgeDays = (int) ($creatorRules['new_creator_age_days'] ?? 30);
        $newCreatorDailyCap = (int) ($creatorRules['new_creator_daily_cap'] ?? 50000);
        Log::info('Evaluating new creator protection', [
            'creator_id' => $creatorId,
            'new_creator_age_days' => $newCreatorAgeDays,
            'new_creator_daily_cap' => $newCreatorDailyCap,
        ]);
        if ($creatorId) {
            $creator = User::where('uuid', $creatorId)->first();
            Log::info('Creator info', [
                'creator_exists' => (bool) $creator,
                'creator_created_at' => $creator ? $creator->created_at : null,
            ]);
            // "New creator" is measured from Stripe connection (when earnings start), not account creation.
            $newCreatorAnchor = $creator ? ($creator->stripe_connected_at ?: $creator->created_at) : null;
            if ($creator && $newCreatorAgeDays > 0 && $newCreatorAnchor && $newCreatorAnchor->diffInDays(now()) < $newCreatorAgeDays) {
                // Calculate creator's total volume today (all payers)
                // This query might be heavy if not indexed on creator_id + created_at
                $dailyVolume = Payment::where('creator_id', $creatorId)
                    ->where('created_at', '>=', now()->subDay())
                    ->whereIn('status', ['succeeded', 'step_up', 'review_hold'])
                    ->sum('amount');

                Log::info('Creator daily volume', [
                    'creator_id' => $creatorId,
                    'daily_volume_gbp' => $dailyVolume,
                    'attempt_amount_gbp' => $amountGbp,
                ]);
                if ($newCreatorDailyCap > 0 && ($dailyVolume + $amountGbp) > $newCreatorDailyCap) {
                    $decision = 'BLOCK';
                    $reasons[] = 'NEW_CREATOR_VOLUME_LIMIT';
                    $this->logDecision($identity, $context, $decision, $reasons);

                    return $this->formatResponse($decision, $reasons, $limits, $context);
                }
            }
        }

        // --- RULE 6/7: VELOCITY (counts are computed on a 10m window in rollups) ---
        $velocityStepUpCount = (int) ($supporterRules['velocity_step_up_count'] ?? 3);
        $velocityCooldownCount = (int) ($supporterRules['velocity_cooldown_count'] ?? 5);

        if ($velocityCooldownCount > 0 && $rollup->payment_count_10m >= $velocityCooldownCount) {
            $decision = 'COOLDOWN';
            $reasons[] = 'VELOCITY_5_IN_10M';
            $minutes = $limits['cooldown_minutes'];
            $this->logDecision($identity, $context, $decision, $reasons);
            // Trigger cooldown on identity
            if ($minutes > 0) {
                $identity->update(['cooldown_until' => Carbon::now()->addMinutes($minutes)]);
            }

            return $this->formatResponse($decision, $reasons, $limits, $context);
        }

        if ($velocityStepUpCount > 0 && $rollup->payment_count_10m >= $velocityStepUpCount) {
            $decision = 'STEP_UP';
            $reasons[] = 'ACCELERATION_3_IN_10M';
            // Step-up doesn't block immediately, but requires action.
            // We return decision. Controller handles logic.
        }

        // --- RULE 7: CONTINUED RAPID PAYMENTS AFTER STEP_UP -> COOLDOWN ---
        // If already stepped up recently (check confirmation logs or payment status?)
        // Spec: "If identity triggered STEP_UP within last 15 minutes AND continues to attempt new payments rapidly."
        // Or "if payment_count_10m continues above threshold after step-up".
        // Simplified: If count > 5 (really fast) -> COOLDOWN.
        if ($velocityStepUpCount > 0 && $rollup->payment_count_10m >= ($velocityStepUpCount + 2)) {
            $decision = 'COOLDOWN';
            $reasons[] = 'RAPID_AFTER_STEP_UP';

            $minutes = $limits['cooldown_minutes'];
            if ($minutes > 0) {
                $identity->update(['cooldown_until' => Carbon::now()->addMinutes($minutes)]);
            }

            $this->logDecision($identity, $context, $decision, $reasons);

            return $this->formatResponse($decision, $reasons, $limits, $context);
        }

        // --- RULE 9: NEW CREATOR LIMIT (1/DAY) ---
        // Check if creator is new
        $isNewCreator = $this->isNewCreator($identity, $creatorId);

        if ($isNewCreator) {
            // Check if we already paid 1 new creator in 24h
            // rollup->new_creators_24h tracks distinct new creators paid.
            if ($rollup->new_creators_24h >= $limits['max_new_creators_24h']) {
                $decision = 'BLOCK';
                $reasons[] = 'NEW_CREATOR_LIMIT';
                $this->logDecision($identity, $context, $decision, $reasons);

                return $this->formatResponse($decision, $reasons, $limits, $context);
            }
        }

        // --- RULE 10: CROSS-CREATOR HOPPING -> RESTRICT NEW ---
        $spend48hRestrictAmount = (int) ($crossCreatorRules['spend_48h_restrict_amount'] ?? 500000);
        $creatorsPaid48hMin = (int) ($crossCreatorRules['creators_paid_48h_min'] ?? 2);
        $restrictDurationHours = (int) ($crossCreatorRules['restrict_duration_hours'] ?? 24);

        if (
            $spend48hRestrictAmount > 0 &&
            $creatorsPaid48hMin > 0 &&
            $rollup->spend_48h > $spend48hRestrictAmount &&
            $rollup->creators_paid_48h >= $creatorsPaid48hMin
        ) {
            // Trigger restriction if not already set
            if (! $identity->new_creator_restrict_until || Carbon::now()->greaterThan($identity->new_creator_restrict_until)) {
                $identity->update(['new_creator_restrict_until' => Carbon::now()->addHours(max(1, $restrictDurationHours))]);
                // Log trigger
                AuditLog::create([
                    'actor' => 'system',
                    'action_type' => 'RESTRICT_NEW_CREATORS',
                    'reference_id' => $identity->id,
                    'metadata_json' => ['reason' => 'CROSS_CREATOR_SPEND_LIMIT'],
                ]);
            }
        }

        // Enforce Restriction
        if ($identity->new_creator_restrict_until && Carbon::now()->lessThan($identity->new_creator_restrict_until)) {
            if ($isNewCreator) {
                $decision = 'BLOCK';
                $reasons[] = 'NEW_CREATOR_RESTRICTED';
                $this->logDecision($identity, $context, $decision, $reasons);

                return $this->formatResponse($decision, $reasons, $limits, $context);
            }
        }

        // --- RULE 8: HIGH VELOCITY SPEND (2H window) ---
        $spend2hStepUpAmount = (int) ($highVelocityRules['spend_2h_step_up_amount'] ?? 750000);
        $spend2hReviewHoldAmount = (int) ($highVelocityRules['spend_2h_review_hold_amount'] ?? 1500000);
        $force3dsOnHighVelocity = (bool) ($highVelocityRules['force_3ds_on_high_velocity'] ?? true);

        if ($spend2hStepUpAmount > 0 && $rollup->spend_2h >= $spend2hStepUpAmount) {
            // Force 3DS + STEP UP
            if ($decision !== 'BLOCK' && $decision !== 'COOLDOWN') {
                $decision = 'STEP_UP';
                $reasons[] = 'HIGH_VALUE_VELOCITY_2H';

                // If repeated, mark for REVIEW_HOLD but still require STEP_UP first
                if ($spend2hReviewHoldAmount > 0 && $rollup->spend_2h > $spend2hReviewHoldAmount) {
                    $reasons[] = 'MARK_REVIEW_HOLD';
                }

                // Add 3DS requirement flag
                if ($force3dsOnHighVelocity) {
                    $reasons[] = 'FORCE_3DS';
                }

            }
        }

        // Log final decision
        $this->logDecision($identity, $context, $decision, $reasons);

        return $this->formatResponse($decision, $reasons, $limits, $context);
    }

    private function isNewCreator(RiskIdentity $identity, $creatorId)
    {
        // Check if any *succeeded* payment exists for this creator prior to today?
        // Or just ever.
        // "New" usually means "never paid before".
        return ! Payment::where('risk_identity_id', $identity->id)
            ->where('creator_id', $creatorId)
            ->whereIn('status', ['succeeded', 'review_hold'])
            ->exists();
    }

    private function logDecision($identity, $context, $decision, $reasons)
    {
        AuditLog::create([
            'actor' => 'system',
            'action_type' => 'RISK_DECISION',
            'reference_id' => $identity->id,
            'metadata_json' => [
                'decision' => $decision,
                'reasons' => $reasons,
                'amount' => $context['amount'] ?? 0,
                'creator_id' => $context['creator_id'] ?? null,
            ],
        ]);
    }

    /**
     * Build the engine's response.
     *
     * The engine decides and names its reason; it does NOT write copy.
     * `App\Support\RiskMessages` is the one definition of what a person reads,
     * and it resolves the audience (guest vs logged in) itself — which is what
     * stops a guest being handed a link to /history, a page they cannot reach.
     *
     * ⚠️ Nothing here may put a threshold in the payload. The old copy
     * interpolated cooldown minutes and `max_new_creators_24h` straight into the
     * body, which told a card tester exactly where the line was and when to
     * resume. `limits` stays in the response because the API's own limits
     * endpoint and the ledger read it — it is never rendered to a supporter.
     */
    private function formatResponse($decision, $reasons, $limits, array $context = [])
    {
        $ui = [];

        // ALLOW has nothing to say to anyone. Building a message for it would
        // put a refusal string into a successful checkout's payload.
        if ($decision !== 'ALLOW') {
            $audience = RiskMessages::audienceFor($context['is_guest'] ?? null);
            $ui = RiskMessages::forReasonCodes($reasons, $audience);
        }

        return [
            'decision' => $decision,
            'reason_codes' => $reasons,
            'limits' => $limits,
            'ui' => $ui,
        ];
    }
}
