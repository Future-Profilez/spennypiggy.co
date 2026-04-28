<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix invalid datetime values in shops table before adding constraint
        DB::table('shops')->where('deleted_at', '0000-00-00 00:00:00')->update(['deleted_at' => null]);

        if (!Schema::hasTable('shipping_profiles')) {
            Schema::create('shipping_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('name');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('shipping_profile_zones')) {
            Schema::create('shipping_profile_zones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shipping_profile_id')->constrained()->onDelete('cascade');
                $table->string('country')->comment('Country ISO code or "all" for worldwide');
                $table->decimal('shipping_price', 15, 2)->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasColumn('shops', 'shipping_profile_id')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->foreignId('shipping_profile_id')->nullable()->after('type')->constrained()->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('shops', 'shipping_profile_id')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->dropConstrainedForeignId('shipping_profile_id');
            });
        }
        Schema::dropIfExists('shipping_profile_zones');
        Schema::dropIfExists('shipping_profiles');
    }
};
