<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        Schema::table('deliverables', function (Blueprint $table) {
            // Make fields nullable to support email deliverables
            $table->string('price_id')->nullable()->change();
            $table->unsignedBigInteger('creator_id')->nullable()->change();
            $table->string('payment_intent_id')->nullable()->change();
            $table->string('session_id')->nullable()->change();
        });

        // Add 'email' to the deliverable_type enum
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type ENUM('digital_file', 'pdf_receipt', 'badge', 'cert', 'access', 'post', 'media_bundle', 'email')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            // Revert nullable changes (note: this might fail if there are null values)
            $table->string('price_id')->nullable(false)->change();
            $table->unsignedBigInteger('creator_id')->nullable(false)->change();
            $table->string('payment_intent_id')->nullable(false)->change();
            $table->string('session_id')->nullable(false)->change();
        });

        // Remove 'email' from the deliverable_type enum
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type ENUM('digital_file', 'pdf_receipt', 'badge', 'cert', 'access', 'post', 'media_bundle')");
    }
};
