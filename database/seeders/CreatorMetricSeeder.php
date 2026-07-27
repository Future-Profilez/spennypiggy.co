<?php

namespace Database\Seeders;

use App\Models\CreatorMetric;
use App\Models\User;
use Illuminate\Database\Seeder;

class CreatorMetricSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all creators (role = 1) who don't have metrics yet
        $creators = User::where('role', 1)
            ->whereDoesntHave('metric')
            ->get();

        $this->command->info("Found {$creators->count()} creators without metrics. Seeding now...");

        foreach ($creators as $creator) {
            // Randomize some data for demo purposes
            $isHighRisk = rand(0, 100) < 5; // 5% chance
            $isMediumRisk = rand(0, 100) < 15; // 15% chance

            $riskLevel = 'low';
            $reservePercent = 0;
            $payoutDelay = 0;

            if ($isHighRisk) {
                $riskLevel = 'high';
                $reservePercent = 25;
                $payoutDelay = 14;
            } elseif ($isMediumRisk) {
                $riskLevel = 'medium';
                $reservePercent = 10;
                $payoutDelay = 7;
            }

            CreatorMetric::create([
                'creator_id' => $creator->uuid,
                'risk_level' => $riskLevel,
                'reserve_percent' => $reservePercent,
                'payout_delay_days' => $payoutDelay,
                'tx_30d' => rand(0, 50),
                'dispute_rate_30d' => $isHighRisk ? (rand(10, 50) / 1000) : 0,
                'refund_rate_30d' => $isMediumRisk ? (rand(50, 100) / 1000) : 0,
                'disputes_30d' => $isHighRisk ? rand(1, 3) : 0,
                'refunds_30d' => $isMediumRisk ? rand(1, 5) : 0,
                // 'last_assessed_at' => now(), // Column does not exist in fillable
            ]);
        }

        $this->command->info('Seeding completed.');
    }
}
