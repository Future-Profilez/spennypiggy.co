<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OptimizeAuditLogsTable extends Migration
{
    public function up()
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Check and add index for actor + created_at
            if (! $this->hasIndex('audit_logs', 'audit_logs_actor_created_at_index')) {
                $table->index(['actor', 'created_at']);
            }

            // Check and add index for action_type + created_at
            if (! $this->hasIndex('audit_logs', 'audit_logs_action_type_created_at_index')) {
                $table->index(['action_type', 'created_at']);
            }

            // Check and add index for reference_id + action_type
            if (! $this->hasIndex('audit_logs', 'audit_logs_reference_id_action_type_index')) {
                $table->index(['reference_id', 'action_type']);
            }

            // Note: created_at index might already exist, check before adding
            if (! $this->hasIndex('audit_logs', 'audit_logs_created_at_index')) {
                $table->index('created_at');
            }
        });
    }

    public function down()
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Drop indexes if they exist
            if ($this->hasIndex('audit_logs', 'audit_logs_actor_created_at_index')) {
                $table->dropIndex('audit_logs_actor_created_at_index');
            }

            if ($this->hasIndex('audit_logs', 'audit_logs_action_type_created_at_index')) {
                $table->dropIndex('audit_logs_action_type_created_at_index');
            }

            if ($this->hasIndex('audit_logs', 'audit_logs_reference_id_action_type_index')) {
                $table->dropIndex('audit_logs_reference_id_action_type_index');
            }

            if ($this->hasIndex('audit_logs', 'audit_logs_created_at_index')) {
                $table->dropIndex('audit_logs_created_at_index');
            }
        });
    }

    /**
     * Check if an index exists on a table
     *
     * @param  string  $table
     * @param  string  $indexName
     * @return bool
     */
    private function hasIndex($table, $indexName)
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();

        // For MySQL
        if ($connection->getDriverName() === 'mysql') {
            $result = DB::select('
                SELECT COUNT(*) as count 
                FROM information_schema.statistics 
                WHERE table_schema = ? 
                AND table_name = ? 
                AND index_name = ?
            ', [$databaseName, $table, $indexName]);

            return $result[0]->count > 0;
        }

        // For PostgreSQL
        if ($connection->getDriverName() === 'pgsql') {
            $result = DB::select("
                SELECT COUNT(*) as count 
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND tablename = ? 
                AND indexname = ?
            ", [$table, $indexName]);

            return $result[0]->count > 0;
        }

        // For SQLite — inspect the table's index list (the old code called a method on the
        // string table name and fatally errored).
        try {
            foreach (DB::select("PRAGMA index_list('{$table}')") as $index) {
                if (($index->name ?? null) === $indexName) {
                    return true;
                }
            }
        } catch (Exception $e) {
            // fall through
        }

        return false;
    }
}
