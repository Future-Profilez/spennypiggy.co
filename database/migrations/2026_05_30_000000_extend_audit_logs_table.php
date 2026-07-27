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
        // Use Laravel's Schema helpers (portable across MySQL + sqlite) instead of raw
        // SHOW COLUMNS / SHOW INDEXES, which are MySQL-only and broke the test DB.
        Schema::table('audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('audit_logs', 'entity_type')) {
                $table->string('entity_type')->nullable()->after('action_type')->index();
            }
            if (! Schema::hasColumn('audit_logs', 'entity_id')) {
                $table->uuid('entity_id')->nullable()->after('entity_type')->index();
            }
            if (! Schema::hasColumn('audit_logs', 'case_id')) {
                $table->string('case_id')->nullable()->after('reference_id')->index();
            }
            if (! Schema::hasColumn('audit_logs', 'correlation_id')) {
                $table->string('correlation_id')->nullable()->after('case_id')->index();
            }
            if (! Schema::hasColumn('audit_logs', 'reason_code')) {
                $table->string('reason_code')->nullable()->after('correlation_id');
            }
            if (! Schema::hasColumn('audit_logs', 'old_values')) {
                $table->json('old_values')->nullable()->after('metadata_json');
            }
            if (! Schema::hasColumn('audit_logs', 'new_values')) {
                $table->json('new_values')->nullable()->after('old_values');
            }
            if (! Schema::hasColumn('audit_logs', 'evidence_refs')) {
                $table->json('evidence_refs')->nullable()->after('new_values');
            }
            if (! Schema::hasColumn('audit_logs', 'payment_refs')) {
                $table->json('payment_refs')->nullable()->after('evidence_refs');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            foreach ([
                'entity_type', 'entity_id', 'case_id', 'correlation_id', 'reason_code',
                'old_values', 'new_values', 'evidence_refs', 'payment_refs',
            ] as $column) {
                if (Schema::hasColumn('audit_logs', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
