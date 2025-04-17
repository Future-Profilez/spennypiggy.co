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
            $table->string('stripe_user_id')->nullable()->after('stripe_id'); // Store Stripe user ID
            $table->tinyInteger('identity_status')->default(0)->comment('1 = user identity verified, 0 = user identity not verified')->after('stripe_id'); // Store identity verification status (unverified, pending, verified)
            $table->timestamp('identity_verified_at')->nullable()->after('stripe_id'); // Timestamp of verification (if applicable)
            $table->text('identity_verification_error')->nullable()->after('stripe_id'); // To store errors if verification fails
            $table->json('identity_verification_details')->nullable()->after('stripe_id'); // Store any additional verification details (e.g., documents submitted)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
