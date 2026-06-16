<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stripe compliance: track when a creator's content memberships were paused for
 * failing the min-3-posts/month posting cadence. When set, the creator's bill/
 * membership subscriptions are paused (no new charges) until they post again.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('content_posting_paused_at')->nullable()->after('stripe_connected_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('content_posting_paused_at');
        });
    }
};
