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
        // Skip if table already exists
        if (Schema::hasTable('web_vitals_metrics')) {
            return;
        }
        
        Schema::create('web_vitals_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('metric_name', 10)->index(); // LCP, FID, CLS, FCP, TTFB, INP
            $table->decimal('value', 10, 3); // Metric value
            $table->enum('rating', ['good', 'needs-improvement', 'poor'])->index();
            $table->decimal('delta', 10, 3)->default(0); // Change from previous value
            $table->string('metric_id')->nullable(); // Unique metric identifier
            $table->string('url', 255)->index(); // Page URL (shortened)
            $table->text('user_agent')->nullable();
            $table->string('connection_type', 20)->nullable()->index(); // Network connection type
            $table->decimal('connection_downlink', 8, 2)->nullable();
            $table->integer('connection_rtt')->nullable();
            $table->integer('viewport_width')->nullable();
            $table->integer('viewport_height')->nullable();
            $table->decimal('device_memory', 8, 2)->nullable();
            $table->integer('hardware_concurrency')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('session_id')->nullable()->index();
            $table->timestamps();

            // Indexes for performance
            $table->index(['metric_name', 'created_at']);
            $table->index(['rating', 'metric_name']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('web_vitals_metrics');
    }
};
