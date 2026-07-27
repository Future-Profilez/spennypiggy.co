<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('risk_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'global_limits', 'risk_rules'
            $table->json('value'); // JSON to store structured config
            $table->string('description')->nullable();
            $table->string('last_updated_by')->nullable(); // admin id
            $table->timestamps();
        });

        // Seed default settings
        DB::table('risk_settings')->insert([
            [
                'key' => 'global_limits',
                'value' => json_encode([
                    'max_spend_1h' => 75000,   // £750.00
                    'max_spend_24h' => 150000, // £1500.00
                    'max_spend_7d' => 300000,  // £3000.00
                    'max_creators_per_day' => 1,
                    'guest_allowed' => false,
                ]),
                'description' => 'Global platform spending limits (NORMAL state)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'risk_thresholds',
                'value' => json_encode([
                    'high_dispute_rate' => 0.01,  // 1%
                    'medium_dispute_rate' => 0.005, // 0.5%
                    'high_refund_rate' => 0.05,   // 5%
                    'min_tx_count' => 10,          // Minimum transactions to evaluate
                ]),
                'description' => 'Thresholds for automated risk classification',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'risk_consequences',
                'value' => json_encode([
                    'high_reserve_percent' => 25,
                    'high_payout_delay' => 14,
                    'medium_reserve_percent' => 10,
                    'medium_payout_delay' => 7,
                    'low_reserve_percent' => 0,
                    'low_payout_delay' => 7,
                ]),
                'description' => 'Consequences applied to creators based on risk level',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_settings');
    }
};
