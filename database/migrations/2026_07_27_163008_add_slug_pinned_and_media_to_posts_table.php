<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('title');
            $table->boolean('is_pinned')->default(false)->after('approved');
            $table->json('media')->nullable()->after('image');
        });

        // Backfill existing posts with unique slugs
        $posts = DB::table('posts')->get();
        foreach ($posts as $post) {
            $title = $post->title ?: 'post';
            $slug = Str::slug($title);
            if (empty($slug)) {
                $slug = 'post';
            }
            $originalSlug = $slug;
            
            // Loop until we find a unique slug
            $count = 1;
            while (DB::table('posts')->where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }
            
            DB::table('posts')->where('id', $post->id)->update(['slug' => $slug]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['slug', 'is_pinned', 'media']);
        });
    }
};
