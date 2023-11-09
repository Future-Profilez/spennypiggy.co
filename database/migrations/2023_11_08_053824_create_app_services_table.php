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
        Schema::create('app_services', function (Blueprint $table) {
            $table->id();
            $table->string('slug');
            $table->string('name');
            $table->tinyInteger('status')->default(1)->comment('0 - Error, 1 - running, 2 - Force Stopped');
            $table->longText('last_error')->nullable();
            $table->timestamp('last_error_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_services');
    }
};
