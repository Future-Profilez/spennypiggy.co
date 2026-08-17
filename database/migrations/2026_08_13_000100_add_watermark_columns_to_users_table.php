<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-creator watermark image, used by App\Support\MediaUrl to stamp the
     * creator's profile URL onto public preview images.
     *
     * `watermark_for_username` records the handle the PNG was rendered with —
     * the watermark prints the profile URL, so a rename makes the stored image
     * wrong rather than merely stale, and comparing the two is how we detect it.
     *
     * Both nullable: NULL means "no watermark", which every read path treats as
     * "serve the image unchanged".
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // No ->after(): the anchor column is itself added by a guarded
            // migration, so naming it here would make this one fail on a
            // database that does not have it yet. Column order is cosmetic.
            if (! Schema::hasColumn('users', 'watermark_uuid')) {
                $table->string('watermark_uuid', 64)->nullable();
            }

            if (! Schema::hasColumn('users', 'watermark_for_username')) {
                $table->string('watermark_for_username', 191)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['watermark_for_username', 'watermark_uuid'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
