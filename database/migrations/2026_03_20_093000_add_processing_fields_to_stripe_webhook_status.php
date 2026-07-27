<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stripe_webhook_status', function (Blueprint $table) {
            if (! Schema::hasColumn('stripe_webhook_status', 'status')) {
                $table->string('status')->nullable()->after('event_type');
            }
            if (! Schema::hasColumn('stripe_webhook_status', 'processed_at')) {
                $table->timestamp('processed_at')->nullable()->after('status');
            }
            if (! Schema::hasColumn('stripe_webhook_status', 'last_error')) {
                $table->text('last_error')->nullable()->after('processed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stripe_webhook_status', function (Blueprint $table) {
            $cols = [];
            foreach (['status', 'processed_at', 'last_error'] as $c) {
                if (Schema::hasColumn('stripe_webhook_status', $c)) {
                    $cols[] = $c;
                }
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
