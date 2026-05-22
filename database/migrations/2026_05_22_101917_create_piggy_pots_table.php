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
        Schema::create('piggy_pots', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('target_amount', 10, 2);
            $table->string('currency')->default('GBP');
            $table->string('cover_media')->nullable(); // Image or video path
            $table->string('content_file')->nullable(); // Digital reward access
            $table->timestamp('deadline')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('enable_leaderboard')->default(true);
            $table->boolean('allow_anonymous')->default(true);
            $table->enum('status', ['active', 'completed', 'expired', 'archived', 'moderation_hold'])->default('active');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('piggy_pots');
    }
};
