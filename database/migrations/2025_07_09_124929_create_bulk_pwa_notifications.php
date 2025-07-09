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
        Schema::create('bulk_pwa_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('creator_id');
            $table->unsignedBigInteger('creator_id');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->bigInteger('users_count')->comment('how many users the notification sent');
            $table->longText('user_ids')->nullable()->comment('all users id to pwa sent to that users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bulk_pwa_notifications');
    }
};
