<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `user_documents` exists on every live database but was in NO migration in this
 * repo — schema drift that predates the migration history here. The admin app
 * carries a guarded create for it (`2026_04_28_000006_create_testing_core_tables`);
 * this app did not, so a fresh or test database had no such table and nothing
 * that reads identity documents could be tested at all.
 *
 * Guarded, so it is a no-op against any database that already has the table.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_documents')) {
            return;
        }

        Schema::create('user_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid');
            $table->unsignedBigInteger('user_id')->index();
            $table->string('doc_type')->nullable();
            $table->string('front')->nullable();
            $table->string('back')->nullable();
            $table->timestamps();
        });
    }

    /**
     * 🚨 Deliberately a no-op. This migration only ever CREATES the table on a
     * database that was missing it; the table it describes already existed in
     * production long before this file, holding identity records. A rollback
     * dropping it would destroy data this migration never created.
     */
    public function down(): void {}
};
