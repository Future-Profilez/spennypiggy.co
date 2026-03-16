<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tip_goals_payments', function (Blueprint $table) {
            $table->double('vat_amount', 10, 2)->default(0.00)->after('tax');
            $table->double('total_paid', 10, 2)->default(0.00)->after('vat_amount');
        });
    }

    public function down(): void
    {
        Schema::table('tip_goals_payments', function (Blueprint $table) {
            $table->dropColumn(['vat_amount', 'total_paid']);
        });
    }
};

