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
            $table->tinyInteger('identity_status')->default(0)->comment('1 = user identity verified, 0 = user identity not verified')->after('kyc_verification_status'); // Store identity verification status (unverified, pending, verified)
            $table->timestamp('identity_verified_at')->nullable()->after('kyc_verification_status'); // Timestamp of verification (if applicable)
            $table->text('identity_verification_error')->nullable()->after('kyc_error'); // To store errors if verification fails
            $table->json('identity_verification_details')->nullable()->after('edit_bio_reason'); // Store any additional verification details (e.g., documents submitted)
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
