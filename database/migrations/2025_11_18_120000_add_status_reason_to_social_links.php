<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('social_links', function (Blueprint $table) {
            if (! Schema::hasColumn('social_links', 'status')) {
                $table->tinyInteger('status')->default(0)->after('other');
            }
            if (! Schema::hasColumn('social_links', 'reason')) {
                $table->text('reason')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_links', function (Blueprint $table) {
            if (Schema::hasColumn('social_links', 'reason')) {
                $table->dropColumn('reason');
            }
            if (Schema::hasColumn('social_links', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
