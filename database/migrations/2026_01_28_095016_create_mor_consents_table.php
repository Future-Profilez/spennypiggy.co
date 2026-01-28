<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('mor_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('consent_given')->default(false);
            $table->timestamp('consent_given_at')->nullable();
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->string('device_type')->nullable()->comment('mobile, desktop, tablet');
            $table->string('browser')->nullable();
            $table->string('platform')->nullable()->comment('Windows, macOS, Linux, iOS, Android');
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes for faster queries
            $table->index('user_id');
            $table->index('consent_given_at');
            $table->index('ip_address');
        });
    }

    public function down()
    {
        Schema::dropIfExists('mor_consents');
    }
};
