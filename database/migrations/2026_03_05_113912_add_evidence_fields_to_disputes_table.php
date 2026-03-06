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
        Schema::table('disputes', function (Blueprint $table) {
            $table->timestamp('evidence_due_by')->nullable();
            $table->string('evidence_status')->default('missing'); // missing, submitted, under_review, closed
            $table->json('evidence_details')->nullable(); // store uploaded file IDs or paths
            $table->string('customer_email')->nullable();
            $table->boolean('has_response')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('disputes', function (Blueprint $table) {
            $table->dropColumn(['evidence_due_by', 'evidence_status', 'evidence_details', 'customer_email', 'has_response']);
        });
    }
};
