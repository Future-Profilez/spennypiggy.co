<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The disposable-domain blocklist.
 *
 * 🚨 This REPLACES `allowed_domains` as the gate. That table stays, but as an
 * always-allow OVERRIDE: an allowlist can only keep throwaway addresses out by
 * refusing every legitimate custom domain with them, which is why creators on
 * their own brand domain — and on Outlook, Hotmail and Proton — could not
 * register at all.
 *
 * Shaped like `allowed_domains` (uuid + name) so the admin app's existing
 * add/list/delete screen can be copied rather than reinvented.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('blocked_domains')) {
            return;
        }

        Schema::create('blocked_domains', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->nullable();
            // The domain only, lowercased — never a full address.
            $table->string('name')->unique();
            // Why it was added, so a future admin can tell a disposable service
            // from a domain blocked after an incident.
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocked_domains');
    }
};
