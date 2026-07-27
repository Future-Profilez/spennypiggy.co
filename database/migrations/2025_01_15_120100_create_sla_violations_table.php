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
        Schema::create('sla_violations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('deliverable_id')->index();
            $table->unsignedBigInteger('creator_id')->index();
            $table->enum('violation_type', ['late', 'escalated']);
            $table->enum('penalty_applied', [
                'warning',
                'restriction_1d',
                'restriction_3d',
                'restriction_7d',
                'restriction_10d',
            ])->nullable();
            $table->timestamp('penalty_start_date')->nullable();
            $table->timestamp('penalty_end_date')->nullable();
            $table->boolean('admin_override')->default(false);
            $table->text('violation_reason')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('deliverable_id')->references('id')->on('deliverables')->onDelete('cascade');
            $table->foreign('creator_id')->references('id')->on('users')->onDelete('cascade');

            // Indexes for common queries
            $table->index(['creator_id', 'violation_type']);
            $table->index(['penalty_start_date', 'penalty_end_date']);
            $table->index('admin_override');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sla_violations');
    }
};
