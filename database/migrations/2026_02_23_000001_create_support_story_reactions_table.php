<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('support_story_reactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('creator_id');
            $table->unsignedBigInteger('gifter_id');
            $table->unsignedBigInteger('user_id');
            $table->string('event_type', 50);
            $table->string('source', 64);
            $table->string('source_id', 64);
            $table->string('emoji', 12);
            $table->timestamps();
            $table->index(['creator_id', 'gifter_id']);
            $table->index(['event_type', 'source', 'source_id']);
            $table->unique(['creator_id', 'gifter_id', 'event_type', 'source', 'source_id', 'user_id', 'emoji'], 'uniq_story_react');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_story_reactions');
    }
};
