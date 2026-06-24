<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Generic cache of Uploadcare video -> poster thumbnails.
 *
 * Keyed by the source video UUID so a single table serves every video surface
 * (intros, gifter media, wish content, shop, etc.) without adding poster columns
 * to each parent table. Posters are generated asynchronously via the
 * Uploadcare conversion API (see App\Jobs\GenerateVideoPoster).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_posters', function (Blueprint $table) {
            $table->id();
            $table->string('source_uuid')->unique();      // Uploadcare UUID of the source video
            $table->string('poster_uuid')->nullable();     // resulting thumbnail file UUID (ready)
            $table->string('poster_token')->nullable();    // Uploadcare conversion job token (in flight)
            $table->string('status')->default('pending');  // pending | processing | ready | failed
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_posters');
    }
};
