<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            $table->double('vat_amount', 10, 2)->default(0.00)->after('tax');
        });

        DB::table('stripe_payment_items')->update([
            'vat_amount' => DB::raw('COALESCE(tax, 0)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            $table->dropColumn('vat_amount');
        });
    }
};
