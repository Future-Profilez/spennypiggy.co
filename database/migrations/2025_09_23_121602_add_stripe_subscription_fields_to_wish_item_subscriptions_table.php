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
        Schema::table('wish_item_subscriptions', function (Blueprint $table) {
            // Stripe subscription status tracking
            $table->string('stripe_status', 50)->nullable()->after('status')->comment('active, canceled, incomplete, incomplete_expired, past_due, trialing, unpaid');
            $table->boolean('cancel_at_period_end')->default(false)->after('stripe_status')->comment('Whether the subscription will cancel at the end of the current period');
            $table->timestamp('current_period_start')->nullable()->after('cancel_at_period_end')->comment('Start of current billing period (Unix timestamp converted)');
            $table->timestamp('current_period_end')->nullable()->after('current_period_start')->comment('End of current billing period (Unix timestamp converted)');
            $table->timestamp('canceled_at')->nullable()->after('current_period_end')->comment('When the subscription was canceled');
            $table->timestamp('ended_at')->nullable()->after('canceled_at')->comment('When the subscription ended');
            $table->json('stripe_metadata')->nullable()->after('ended_at')->comment('Additional Stripe metadata');
            $table->string('payment_method_id')->nullable()->after('stripe_metadata')->comment('Stripe payment method ID');
            $table->timestamp('trial_start')->nullable()->after('payment_method_id')->comment('Trial start date');
            $table->timestamp('trial_end')->nullable()->after('trial_start')->comment('Trial end date');
            
            // Indexes for common queries
            $table->index(['stripe_status', 'current_period_end'], 'idx_subscription_status_period');
            $table->index(['user_id', 'stripe_status'], 'idx_user_subscription_status');
            $table->index(['wish_item_id', 'stripe_status'], 'idx_item_subscription_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_item_subscriptions', function (Blueprint $table) {
            $table->dropIndex('idx_subscription_status_period');
            $table->dropIndex('idx_user_subscription_status');
            $table->dropIndex('idx_item_subscription_status');
            
            $table->dropColumn([
                'stripe_status',
                'cancel_at_period_end',
                'current_period_start',
                'current_period_end',
                'canceled_at',
                'ended_at',
                'stripe_metadata',
                'payment_method_id',
                'trial_start',
                'trial_end'
            ]);
        });
    }
};
