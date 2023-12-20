<?php

use App\Models\User;
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
        Schema::table('user_carts', function (Blueprint $table) {
            $table->renameColumn('wish_id', 'wish_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_carts', function (Blueprint $table) {
            //
        });
    }
};
