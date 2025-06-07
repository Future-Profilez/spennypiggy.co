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
        Schema::create('product_order_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->char('uuid', 36)->unique();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('creater_id')->nullable();
            $table->string('cart_id')->nullable();
            $table->unsignedBigInteger('product_id');
            $table->string('order_id');
            $table->json('details')->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->string('session_id')->nullable();
            $table->string('transaction_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
        // Schema::create('product_order_details', function (Blueprint $table) {
        //     $table->id();
        //     $table->uuid('uuid')->unique();
        //     $table->bigInteger('user_id')->nullable();
        //     $table->bigInteger('creater_id')->nullable();
        //     $table->string('cart_id')->nullable();
        //     $table->text('order_id')->nullable();
        //     $table->longText('details')->nullable();
        //     $table->string('payment_status')->nullable();
        //     $table->text('session_id')->nullable();
        //     $table->timestamps();
        //     $table->softDeletes();
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_order_details');
    }
};
