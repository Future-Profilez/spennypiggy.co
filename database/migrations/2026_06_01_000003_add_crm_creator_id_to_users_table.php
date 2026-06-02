<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('crm_creator_id')->nullable()->after('id')->index();
            $table->foreign('crm_creator_id')->references('id')->on('crm_creators')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['crm_creator_id']);
            $table->dropColumn('crm_creator_id');
        });
    }
};

