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
        Schema::table('users', function (Blueprint $table) {
            $table->uuid()->after('id')->nullable();
            $table->string('avatar')->nullable()->after('username');
            $table->string('cover')->nullable()->after('avatar');
            $table->string('currency')->nullable()->after('cover');
            $table->string('bio')->nullable()->after('currency');
            $table->longText('tags')->nullable()->after('bio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn("uuid");
            $table->dropColumn("avatar");
            $table->dropColumn("cover");
            $table->dropColumn("currency");
            $table->dropColumn("bio");
            $table->dropColumn("tags");
        });
    }
};
