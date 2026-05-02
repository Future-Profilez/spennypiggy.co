<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('shop_payments')) {
            Schema::create('shop_payments', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->nullable();
                $table->string('session_id')->nullable();
                $table->double('amount')->default(0);
                $table->double('tax_amount')->default(0);
                $table->double('vat_tax_amount')->default(0);
                // shipping_amount added by 2026_04_27_122155
                $table->string('currency')->nullable();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('name')->nullable();
                $table->string('email')->nullable();
                $table->text('message')->nullable();
                $table->boolean('anonymous')->default(0);
                $table->text('answer')->nullable();
                $table->string('payment_status')->nullable();
                $table->text('twitter_response')->nullable();
                $table->integer('quantity')->default(1);
                // digital_waiver columns added by 2026_04_24_095408
                // shipping_amount added by 2026_04_27_122155
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('bill_payments')) {
            Schema::create('bill_payments', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->nullable();
                $table->string('stripe_id')->nullable();
                $table->string('session_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('bills_id')->nullable();
                $table->string('guest_name')->nullable();
                $table->string('guest_email')->nullable();
                $table->double('amount')->default(0);
                $table->string('currency')->nullable();
                $table->string('recurring_for')->nullable();
                $table->double('tax')->default(0);
                $table->double('vat_tax_amount')->default(0);
                $table->string('recurring_type')->nullable();
                $table->text('message')->nullable();
                $table->boolean('anonymous')->default(0);
                $table->string('status')->default('initiated');
                $table->text('twitter_response')->nullable();
                $table->timestamp('end')->nullable();
                $table->timestamp('upcoming_payment')->nullable();
                // FX + fee columns added by 2026_02_17_095716
                // digital_waiver columns added by 2026_04_24_095408
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('membership_payments')) {
            Schema::create('membership_payments', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->nullable();
                $table->string('stripe_id')->nullable();
                $table->string('session_id')->nullable();
                $table->string('iban')->nullable();
                $table->string('sort_code')->nullable();
                $table->unsignedBigInteger('membership_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('guest_email')->nullable();
                $table->string('guest_name')->nullable();
                $table->string('currency')->nullable();
                $table->double('amount')->default(0);
                $table->double('tax')->default(0);
                $table->double('vat_tax_amount')->default(0);
                $table->string('recurring_for')->nullable();
                $table->string('recurring_type')->nullable();
                $table->string('payment_method')->nullable();
                $table->text('message')->nullable();
                $table->boolean('anonymous')->default(0);
                $table->timestamp('end')->nullable();
                $table->timestamp('upcoming_payment')->nullable();
                $table->string('status')->default('initiated');
                $table->text('twitter_response')->nullable();
                $table->timestamp('payout_at')->nullable();
                // FX + fee columns added by 2026_02_17_100731
                // digital_waiver columns added by 2026_04_24_095408
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Note: memberships and tasks tables have their own CREATE migrations
        // (2024_01_02_000000 and 2025_12_31_085114) — do not recreate here.
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_payments');
        Schema::dropIfExists('bill_payments');
        Schema::dropIfExists('membership_payments');
    }
};
