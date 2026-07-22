<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Anonymous visit counters, so the funnels can start at "Visit" instead of
 * "Signup".
 *
 * Deliberately AGGREGATE ONLY — one row per day, per traffic source, per page
 * type. No IP, no cookie id, no per-person row and no browsing history, which
 * keeps this out of personal-data territory entirely: there is nothing here that
 * could identify anyone, so it needs no consent banner and has nothing to erase
 * on a deletion request.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_visit_stats', function (Blueprint $table) {
            $table->id();
            $table->date('date');

            // Normalised to a known set (direct, reddit, x, google, …, other) by
            // VisitTracker — an unbounded utm_source would make the flush job
            // unable to enumerate what it has to write.
            $table->string('source', 40)->default('direct');

            // Which kind of page: landing, creator profile, or anything else.
            // The supporter funnel starts at a creator profile view, the creator
            // funnel at a landing view, so one shared counter cannot serve both.
            $table->string('page_type', 20)->default('other');

            $table->unsignedBigInteger('visits')->default(0);
            $table->unsignedBigInteger('unique_visitors')->default(0);
            $table->timestamps();

            $table->unique(['date', 'source', 'page_type'], 'site_visit_stats_unique_bucket');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_visit_stats');
    }
};
