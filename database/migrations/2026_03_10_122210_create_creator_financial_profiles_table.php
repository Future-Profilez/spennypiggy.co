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
        Schema::create('creator_financial_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('business_name')->nullable();
            $table->string('business_address_line1')->nullable();
            $table->string('business_address_line2')->nullable();
            $table->string('business_city')->nullable();
            $table->string('business_postal_code')->nullable();
            $table->string('business_country')->nullable();
            $table->boolean('vat_registered')->default(false);
            $table->string('vat_registration_number')->nullable();
            $table->decimal('tax_percentage', 5, 2)->default(20.00);
            $table->decimal('rolling_revenue', 15, 2)->default(0.00); // For VAT threshold
            $table->timestamp('last_revenue_check_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('creator_financial_profiles');
    }
};
