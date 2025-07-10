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
            $table->string('title');
            $table->longText('body');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('users_count')->default(0)->comment('Number of users the notification was sent to');
            $table->json('user_ids')->nullable()->comment('List of user IDs to whom the PWA was sent');
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
