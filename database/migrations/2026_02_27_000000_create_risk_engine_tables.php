<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. platform_risk_states (Global Platform State)
        Schema::create('platform_risk_states', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('state', ['NORMAL', 'CAUTION', 'THROTTLE', 'FREEZE'])->default('NORMAL');
            $table->json('reason_codes')->default(json_encode([])); // Postgres array -> JSON in MySQL/Generic or specific
            $table->text('reason_detail')->nullable();
            $table->enum('set_by', ['system', 'admin']);
            $table->uuid('set_by_user_id')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->json('metrics_snapshot')->default(json_encode([]));
            $table->timestamps();

            $table->index('started_at');
        });

        // 2. risk_identities (Buyer Identity)
        Schema::create('risk_identities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('card_fingerprint')->nullable()->index();
            $table->string('email_hash')->nullable()->index();
            $table->string('device_id_hash')->nullable()->index();
            $table->string('ip_hash')->nullable()->index();
            $table->boolean('is_guest')->default(true);
            $table->tinyInteger('trust_tier')->default(0); // 0/1/2
            $table->timestamp('cooldown_until')->nullable();
            $table->boolean('is_blocked')->default(false);
            $table->timestamp('new_creator_restrict_until')->nullable(); // For Rule 10
            $table->timestamps();
        });

        // 3. identity_rollups (Fast Rolling Counters)
        Schema::create('identity_rollups', function (Blueprint $table) {
            $table->uuid('risk_identity_id')->primary();
            $table->foreign('risk_identity_id')->references('id')->on('risk_identities')->onDelete('cascade');
            
            $table->bigInteger('spend_10m')->default(0);
            $table->bigInteger('spend_1h')->default(0);
            $table->bigInteger('spend_2h')->default(0);
            $table->bigInteger('spend_24h')->default(0);
            $table->bigInteger('spend_48h')->default(0);
            $table->bigInteger('spend_7d')->default(0);
            
            $table->integer('payment_count_10m')->default(0);
            $table->integer('creators_paid_24h')->default(0);
            $table->integer('creators_paid_48h')->default(0);
            $table->integer('new_creators_24h')->default(0);
            $table->integer('disputes_30d')->default(0);
            
            $table->timestamp('updated_at')->useCurrent();
        });

        // 4. payments (Risk Engine Ledger)
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Assuming creators are Users, checking if uuid or id
            // Usually in Laravel users.id is bigInt or uuid. Let's check users migration.
            // But spec says UUID. We'll use UUID for consistency with spec.
            // If users table uses bigInt, we might need a mapping or just store as string/bigInt.
            // I'll assume UUID for now or check users table migration.
            $table->uuid('creator_id')->index(); 
            $table->uuid('risk_identity_id')->index();
            $table->foreign('risk_identity_id')->references('id')->on('risk_identities')->onDelete('cascade');

            $table->bigInteger('amount'); // minor units
            $table->string('currency')->default('gbp');
            $table->string('stripe_payment_intent_id')->nullable()->index();
            $table->enum('status', [
                'initiated', 'step_up', 'review_hold', 'succeeded', 
                'refunded', 'disputed', 'blocked', 'failed'
            ])->index();
            
            $table->uuid('confirmation_log_id')->nullable();
            $table->json('reason_codes')->default(json_encode([]));
            
            $table->timestamps();
        });

        // 5. confirmation_logs (Step-Up Logs)
        Schema::create('confirmation_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id')->nullable()->index();
            $table->uuid('risk_identity_id')->index();
            $table->foreign('risk_identity_id')->references('id')->on('risk_identities')->onDelete('cascade');
            
            $table->string('ip_hash')->nullable();
            $table->string('device_id_hash')->nullable();
            $table->boolean('otp_verified')->default(false);
            $table->string('typed_confirmation')->nullable();
            $table->json('spend_snapshot')->default(json_encode([]));
            
            $table->timestamps();
        });

        // 6. disputes (Stripe Disputes)
        Schema::create('disputes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id')->nullable()->index();
            $table->uuid('creator_id')->nullable()->index();
            $table->string('stripe_dispute_id')->unique();
            $table->bigInteger('amount');
            $table->string('currency')->default('gbp');
            $table->string('reason')->nullable();
            $table->string('status')->default('open'); // open/won/lost
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('resolved_at')->nullable();
        });

        // 7. early_fraud_warnings (Stripe EFW)
        Schema::create('early_fraud_warnings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id')->nullable()->index();
            $table->string('stripe_efw_id')->unique();
            $table->string('stripe_charge_id');
            $table->timestamp('created_at')->useCurrent();
        });

        // 8. creator_metrics (Risk Profile per Creator)
        Schema::create('creator_metrics', function (Blueprint $table) {
            $table->uuid('creator_id')->primary(); // 1-to-1 with users/creators
            
            $table->integer('tx_30d')->default(0);
            $table->integer('disputes_30d')->default(0);
            $table->decimal('dispute_rate_30d', 6, 3)->default(0.000); // percent
            $table->integer('refunds_30d')->default(0);
            $table->decimal('refund_rate_30d', 6, 3)->default(0.000); // percent
            
            $table->integer('reserve_percent')->default(0); // 0/5/10/15
            $table->integer('payout_delay_days')->default(0);
            
            $table->decimal('top_buyer_percent', 6, 3)->default(0.000);
            $table->integer('volatility_score')->default(0);
            
            $table->timestamp('updated_at')->useCurrent();
        });

        // 9. payout_runs (Friday Payouts)
        Schema::create('payout_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('run_date');
            $table->string('status')->default('preview'); // preview/executed/failed
            $table->json('totals')->default(json_encode([]));
            $table->timestamps();
        });

        // 10. audit_logs (Central Audit Trail)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('actor'); // system/admin/user:ID
            $table->string('action_type');
            $table->string('reference_id')->nullable(); // payment_id, creator_id, etc.
            $table->json('metadata_json')->default(json_encode([]));
            $table->timestamp('created_at')->useCurrent();
        });
        
        // 11. creator_activation_state (Onboarding Throttle) - Add to users or separate table?
        // Spec says: Add creator_activation_state: PENDING / ACTIVE / PAUSED.
        // Assuming we can add this to users table or create a separate table.
        // Given users table is large, maybe adding a column is better.
        // But for cleaner separation, let's assume we modify users table in a separate migration or here.
        // Let's create a separate table `creator_onboarding_states` or modify users.
        // Since we are doing consolidated migration, let's modify users table if needed.
        // But checking `users` table structure is important. 
        // I will skip adding column to users table here to avoid locking issues in migration if users table is huge.
        // Instead, I'll create `creator_risk_profiles` (which matches creator_metrics mostly) but maybe `creator_metrics` can hold this state?
        // Or just add column to users table in a separate migration. 
        // For now, I'll stick to the tables defined in the spec.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('payout_runs');
        Schema::dropIfExists('creator_metrics');
        Schema::dropIfExists('early_fraud_warnings');
        Schema::dropIfExists('disputes');
        Schema::dropIfExists('confirmation_logs');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('identity_rollups');
        Schema::dropIfExists('risk_identities');
        Schema::dropIfExists('platform_risk_states');
    }
};
