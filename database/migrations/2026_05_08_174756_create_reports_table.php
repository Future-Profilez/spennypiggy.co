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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('reporter_name');
            $table->string('reporter_email');
            $table->string('reported_url')->nullable();
            $table->unsignedBigInteger('reported_user_id')->nullable()->comment('The creator being reported');
            $table->text('reason');
            $table->string('status')->default('pending')->comment('pending, reviewed, resolved, dismissed');
            $table->boolean('good_faith_confirmed')->default(true);
            $table->timestamps();

            $table->foreign('reported_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
