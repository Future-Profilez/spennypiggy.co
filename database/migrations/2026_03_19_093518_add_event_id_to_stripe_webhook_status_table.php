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
        Schema::table('stripe_webhook_status', function (Blueprint $table) {
            $table->string('event_id')->nullable()->unique()->after('id');
            $table->string('event_type')->nullable()->after('event_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_webhook_status', function (Blueprint $table) {
            $table->dropColumn(['event_id', 'event_type']);
        });
    }
};
