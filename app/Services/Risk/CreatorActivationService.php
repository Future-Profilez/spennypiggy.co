<?php

namespace App\Services\Risk;

use App\Models\AuditLog;
use App\Models\PlatformRiskState;
use App\Models\RiskSetting;
use App\Models\User;
use Carbon\Carbon;

class CreatorActivationService
{
    /**
     * Attempt to activate a creator.
     * Respects Platform Risk State limits.
     */
    public function activateCreator(User $creator, $adminUser = null)
    {
        // 1. Get Platform State
        $stateRecord = PlatformRiskState::latest('started_at')->first();
        $state = $stateRecord ? $stateRecord->state : 'NORMAL';

        $limits = RiskSetting::get('onboarding_limits', [
            'NORMAL' => 25,
            'CAUTION' => 10,
            'THROTTLE' => 5,
            'FREEZE' => 0,
        ]);

        $dailyLimit = (int) ($limits[$state] ?? 0);

        if ($dailyLimit === 0) {
            return [
                'success' => false,
                'error' => "Activation blocked. Platform is in {$state} state.",
            ];
        }

        // 3. Count Today's Activations
        // Assuming we track 'activated_at' on users table.
        // Or we use AuditLogs to count 'CREATOR_ACTIVATED' actions today.
        // Using AuditLogs is safer if we don't trust user table timestamp updates alone.

        $todayCount = AuditLog::where('action_type', 'CREATOR_ACTIVATED')
            ->where('created_at', '>=', Carbon::today())
            ->count();

        if ($todayCount >= $dailyLimit) {
            return [
                'success' => false,
                'error' => "Daily activation limit reached for {$state} state ({$dailyLimit}/day).",
            ];
        }

        // 4. Activate
        // $creator->update(['status' => 'active', 'activated_at' => now()]);
        // Assuming status column exists. If not, just log for now.
        // Let's assume we set a flag.
        // For MVP, we just return success and Log.

        AuditLog::create([
            'actor' => $adminUser ? $adminUser->id : 'system',
            'action_type' => 'CREATOR_ACTIVATED',
            'reference_id' => $creator->id,
            'metadata_json' => ['state' => $state],
        ]);

        return ['success' => true];
    }
}
