<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check which columns already exist
        $table = 'audit_logs';
        $columns = DB::select("SHOW COLUMNS FROM {$table}");
        $existingColumns = array_column($columns, 'Field');

        // Only add columns that don't exist
        Schema::table('audit_logs', function (Blueprint $table) use ($existingColumns) {
            if (!in_array('entity_type', $existingColumns)) {
                $table->string('entity_type')->nullable()->after('action_type');
            }
            if (!in_array('entity_id', $existingColumns)) {
                $table->uuid('entity_id')->nullable()->after('entity_type');
            }
            if (!in_array('case_id', $existingColumns)) {
                $table->string('case_id')->nullable()->after('reference_id');
            }
            if (!in_array('correlation_id', $existingColumns)) {
                $table->string('correlation_id')->nullable()->after('case_id');
            }
            if (!in_array('reason_code', $existingColumns)) {
                $table->string('reason_code')->nullable()->after('correlation_id');
            }
            if (!in_array('old_values', $existingColumns)) {
                $table->json('old_values')->nullable()->after('metadata_json');
            }
            if (!in_array('new_values', $existingColumns)) {
                $table->json('new_values')->nullable()->after('old_values');
            }
            if (!in_array('evidence_refs', $existingColumns)) {
                $table->json('evidence_refs')->nullable()->after('new_values');
            }
            if (!in_array('payment_refs', $existingColumns)) {
                $table->json('payment_refs')->nullable()->after('evidence_refs');
            }

            // Add indexes if they don't exist
            if (!$this->indexExists($table->getTable(), 'audit_logs_entity_type_index')) {
                $table->index('entity_type');
            }
            if (!$this->indexExists($table->getTable(), 'audit_logs_entity_id_index')) {
                $table->index('entity_id');
            }
            if (!$this->indexExists($table->getTable(), 'audit_logs_case_id_index')) {
                $table->index('case_id');
            }
            if (!$this->indexExists($table->getTable(), 'audit_logs_correlation_id_index')) {
                $table->index('correlation_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Only drop if they exist
            $columns = DB::select("SHOW COLUMNS FROM audit_logs");
            $existingColumns = array_column($columns, 'Field');

            if (in_array('entity_type', $existingColumns)) {
                $table->dropColumn('entity_type');
            }
            if (in_array('entity_id', $existingColumns)) {
                $table->dropColumn('entity_id');
            }
            if (in_array('case_id', $existingColumns)) {
                $table->dropColumn('case_id');
            }
            if (in_array('correlation_id', $existingColumns)) {
                $table->dropColumn('correlation_id');
            }
            if (in_array('reason_code', $existingColumns)) {
                $table->dropColumn('reason_code');
            }
            if (in_array('old_values', $existingColumns)) {
                $table->dropColumn('old_values');
            }
            if (in_array('new_values', $existingColumns)) {
                $table->dropColumn('new_values');
            }
            if (in_array('evidence_refs', $existingColumns)) {
                $table->dropColumn('evidence_refs');
            }
            if (in_array('payment_refs', $existingColumns)) {
                $table->dropColumn('payment_refs');
            }
        });
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists($table, $indexName)
    {
        $indexes = DB::select("SHOW INDEXES FROM {$table}");
        foreach ($indexes as $index) {
            if ($index->Key_name === $indexName) {
                return true;
            }
        }
        return false;
    }
};
