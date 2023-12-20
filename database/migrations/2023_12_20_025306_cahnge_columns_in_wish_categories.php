<?php

use App\Models\UserCategory;
use App\Models\WishItem;
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
        Schema::table('wish_categories', function (Blueprint $table) {
            $table->foreignIdFor(WishItem::class)->nullable()->change();
            $table->foreignIdFor(UserCategory::class)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_categories', function (Blueprint $table) {
            //
        });
    }
};
