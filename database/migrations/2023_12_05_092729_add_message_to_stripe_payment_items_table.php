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
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            $table->text('message')->after('tax')->nullable();
            $table->string('message_media')->after('message')->nullable();
            $table->tinyInteger('is_read_user')->after('message_media')->default(0);
            $table->tinyInteger('is_read_owner')->after('is_read_user')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            //
        });
    }
};
