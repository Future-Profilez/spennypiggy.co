<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_creator_stage_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('crm_creator_id')->index();

            $table->string('from_stage')->nullable();
            $table->string('to_stage');
            $table->string('trigger_source')->index();
            $table->unsignedBigInteger('triggered_by')->nullable()->index();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('crm_creator_id')->references('id')->on('crm_creators')->cascadeOnDelete();
            $table->foreign('triggered_by')->references('id')->on('admins')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_creator_stage_histories');
    }
};
