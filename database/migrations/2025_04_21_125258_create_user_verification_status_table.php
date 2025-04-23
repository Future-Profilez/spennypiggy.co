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
        Schema::create('user_verification_status', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id')->unsigned()->index();
            $table->tinyInteger('role')->nullable()->comment('0: gifter, 1: creator');
            $table->tinyInteger('bio_status')->nullable()->comment('0: not approved, 1: approved');
            $table->tinyInteger('social_status')->nullable()->comment('0: not approved, 1: approved');
            $table->tinyInteger('address_status')->nullable()->comment('0: pending, 1: approved, 2: rejected');
            $table->text('address_verification_error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_verification_status');
    }
};
