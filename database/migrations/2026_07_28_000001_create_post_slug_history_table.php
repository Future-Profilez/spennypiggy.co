<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('post_slug_history')) {
            return;
        }

        // Retitling a post changes its URL. Without a record of the old slug,
        // every link already shared — and everything Google has indexed — 404s.
        // One row per retired slug lets the post page answer with a 301 instead.
        Schema::create('post_slug_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id');
            $table->string('slug')->unique();
            $table->timestamps();

            $table->index('post_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_slug_history');
    }
};
