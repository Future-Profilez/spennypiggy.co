<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the message actually SAID, so an admin can answer "what did we send
 * them?" without asking the recipient to forward it.
 *
 * ⚠️ A PREVIEW, not the message. Receipt emails carry `reward_body` — the paid
 * deliverable itself — so storing full HTML would put every purchased message
 * and link in a second table that admins can read. The listener stores plain
 * text only, truncated, with attachments never captured.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('notification_logs')) {
            return;
        }

        if (Schema::hasColumn('notification_logs', 'body_preview')) {
            return;
        }

        Schema::table('notification_logs', function (Blueprint $table) {
            $table->text('body_preview')->nullable();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('notification_logs') && Schema::hasColumn('notification_logs', 'body_preview')) {
            Schema::table('notification_logs', function (Blueprint $table) {
                $table->dropColumn('body_preview');
            });
        }
    }
};
