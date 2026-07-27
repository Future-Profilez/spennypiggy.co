<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_creator_activities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('crm_creator_id')->index();

            $table->string('activity_type')->index();
            $table->text('description');
            $table->dateTime('activity_date')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->timestamps();

            $table->foreign('crm_creator_id')->references('id')->on('crm_creators')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('admins')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_creator_activities');
    }
};
