<?php

namespace App\Console\Commands;

use App\Models\RiskSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class RiskGoLiveCheck extends Command
{
    protected $signature = 'risk:go-live-check';

    protected $description = 'Validate key risk and payment safety prerequisites before go-live';

    public function handle(): int
    {
        $checks = [];

        $checks[] = [
            'name' => 'Stripe webhook secret configured',
            'ok' => (bool) config('services.stripe.webhook_secret'),
        ];

        foreach (['global_limits', 'state_limits', 'supporter_rules', 'creator_rules', 'high_velocity_rules', 'cross_creator_rules', 'platform_state_triggers'] as $key) {
            $checks[] = [
                'name' => "RiskSetting exists: {$key}",
                'ok' => RiskSetting::where('key', $key)->exists(),
            ];
        }

        $checks[] = [
            'name' => 'payments.stripe_session_id exists',
            'ok' => Schema::hasColumn('payments', 'stripe_session_id'),
        ];

        $checks[] = [
            'name' => 'creator_metrics.negative_balance_minor exists',
            'ok' => Schema::hasColumn('creator_metrics', 'negative_balance_minor'),
        ];

        $checks[] = [
            'name' => 'stripe_webhook_status.status exists',
            'ok' => Schema::hasColumn('stripe_webhook_status', 'status'),
        ];

        $checks[] = [
            'name' => 'stripe_webhook_status.processed_at exists',
            'ok' => Schema::hasColumn('stripe_webhook_status', 'processed_at'),
        ];

        $fail = false;
        foreach ($checks as $c) {
            if (!$c['ok']) {
                $fail = true;
            }
            $this->line(($c['ok'] ? 'PASS' : 'FAIL') . ' - ' . $c['name']);
        }

        return $fail ? 1 : 0;
    }
}

