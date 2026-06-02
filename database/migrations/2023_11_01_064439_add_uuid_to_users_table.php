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
            if (!Schema::hasColumn('users', 'uuid')) {
                $table->uuid()->after('id')->nullable();
            }
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable()->after('username');
            }
            if (!Schema::hasColumn('users', 'cover')) {
                $table->string('cover')->nullable()->after('avatar');
            }
            if (!Schema::hasColumn('users', 'currency')) {
                $table->string('currency')->nullable()->after('cover');
            }
            if (!Schema::hasColumn('users', 'bio')) {
                $table->string('bio')->nullable()->after('currency');
            }
            if (!Schema::hasColumn('users', 'tags')) {
                $table->longText('tags')->nullable()->after('bio');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'uuid')) {
                $table->dropColumn('uuid');
            }
            if (Schema::hasColumn('users', 'avatar')) {
                $table->dropColumn('avatar');
            }
            if (Schema::hasColumn('users', 'cover')) {
                $table->dropColumn('cover');
            }
            if (Schema::hasColumn('users', 'currency')) {
                $table->dropColumn('currency');
            }
            if (Schema::hasColumn('users', 'bio')) {
                $table->dropColumn('bio');
            }
            if (Schema::hasColumn('users', 'tags')) {
                $table->dropColumn('tags');
            }
        });
    }
};
