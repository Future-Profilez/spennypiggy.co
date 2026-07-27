<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('early_fraud_warnings', function (Blueprint $table) {
            // Add missing fields
            $table->string('fraud_type')->nullable()->after('stripe_charge_id');
            $table->string('risk_level')->nullable()->after('fraud_type');
            $table->string('action')->nullable()->after('risk_level');
            $table->text('reason_codes')->nullable()->after('action');
            $table->integer('score')->nullable()->after('reason_codes');
            $table->string('stripe_payment_intent')->nullable()->after('score');
            $table->timestamp('closed_at')->nullable()->after('created_at');

            // Add indexes
            $table->index('fraud_type');
            $table->index('risk_level');
            $table->index('stripe_payment_intent');
        });
    }

    public function down()
    {
        Schema::table('early_fraud_warnings', function (Blueprint $table) {
            $table->dropColumn([
                'fraud_type',
                'risk_level',
                'action',
                'reason_codes',
                'score',
                'stripe_payment_intent',
                'closed_at',
            ]);
        });
    }
};
