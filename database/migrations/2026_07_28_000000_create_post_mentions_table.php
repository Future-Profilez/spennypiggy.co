<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('post_mentions')) {
            return;
        }

        Schema::create('post_mentions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id');
            // The mentioned user is stored by id, never by the username that was
            // typed — a creator who changes their handle keeps working links and
            // keeps getting their notifications.
            $table->unsignedBigInteger('user_id');
            // Null until the post is approved and the mention has been delivered;
            // this is what stops an edit re-notifying people who already heard.
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
            $table->index(['notified_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_mentions');
    }
};
