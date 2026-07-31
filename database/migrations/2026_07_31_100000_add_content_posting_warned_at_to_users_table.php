<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When a creator was first told their subscriber posts had fallen below the threshold.
 *
 * Until now there was no gap between "below the threshold" and "collection paused": the
 * enforcement run that noticed also paused, so the first a creator heard of it was that
 * their recurring income had already stopped. A warning was added, but it could only sit in
 * the grace-period branch — which reaches creators inside their first window and nobody
 * else, i.e. exactly the people with the least at stake.
 *
 * This column is the gap. It is set when the warning goes out and cleared the moment the
 * creator is back at the threshold, so it always answers "how long have they been below,
 * having been told?" rather than "how long have they been below?".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'content_posting_warned_at')) {
                $table->timestamp('content_posting_warned_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'content_posting_warned_at')) {
                $table->dropColumn('content_posting_warned_at');
            }
        });
    }
};
