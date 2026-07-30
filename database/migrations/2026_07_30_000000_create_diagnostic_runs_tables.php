<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Diagnostics used to be a snapshot with no memory: every run showed "4 failed jobs" with no way
 * to know whether that was 0 yesterday or 40. Storing each run is what makes the delta possible,
 * and the delta is the part worth reading.
 *
 * Deliberately small: no personal data, no log bodies beyond the already-redacted message, and a
 * retention prune in the command so this cannot grow without bound.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('diagnostic_runs')) {
            Schema::create('diagnostic_runs', function (Blueprint $table) {
                $table->id();
                $table->string('status', 20)->index();          // passed | warning | failed
                $table->string('environment', 30)->nullable();
                $table->string('trigger', 20)->default('manual'); // manual | scheduled
                $table->boolean('deep')->default(false);
                $table->unsignedSmallInteger('passed_count')->default(0);
                $table->unsignedSmallInteger('warning_count')->default(0);
                $table->unsignedSmallInteger('failed_count')->default(0);
                $table->unsignedSmallInteger('skipped_count')->default(0);
                $table->unsignedInteger('duration_ms')->default(0);
                $table->timestamps();

                // The runner's "previous run" lookup is ordered on this pair.
                $table->index(['deep', 'created_at']);
            });
        }

        if (! Schema::hasTable('diagnostic_results')) {
            Schema::create('diagnostic_results', function (Blueprint $table) {
                $table->id();
                $table->foreignId('diagnostic_run_id')->constrained()->cascadeOnDelete();
                $table->string('check_key', 60);
                $table->string('status', 20);
                $table->string('severity', 20);
                $table->text('message')->nullable();
                $table->json('meta')->nullable();
                $table->unsignedInteger('duration_ms')->default(0);
                $table->timestamps();

                // How the diff finds the same check in the previous run.
                $table->index(['diagnostic_run_id', 'check_key']);
                $table->index(['check_key', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_results');
        Schema::dropIfExists('diagnostic_runs');
    }
};
