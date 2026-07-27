<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'platform_holds_funds')) {
                $table->boolean('platform_holds_funds')->default(false)->after('reserve_amount_minor');
            }
            if (! Schema::hasColumn('payments', 'stripe_transfer_id')) {
                $table->string('stripe_transfer_id')->nullable()->after('platform_holds_funds');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'platform_holds_funds')) {
                $table->dropColumn('platform_holds_funds');
            }
            if (Schema::hasColumn('payments', 'stripe_transfer_id')) {
                $table->dropColumn('stripe_transfer_id');
            }
        });
    }
};
