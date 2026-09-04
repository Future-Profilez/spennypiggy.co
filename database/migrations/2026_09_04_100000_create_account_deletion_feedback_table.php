<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Why people leave.
 *
 * 🚨 NO FOREIGN KEY, AND THE IDENTITY IS SNAPSHOT ON THE ROW. The whole point
 * of this table is to survive the account it is about: `users` rows are soft
 * deleted today and may be hard deleted later, and a reason that vanishes with
 * the account answers nothing. `user_id` is kept for joining while the row
 * still exists; `username`/`email`/`role` are copies taken at deletion time so
 * the record still reads after it does not.
 *
 * ⚠️ The reason CODE is stored, never the sentence — see
 * `config/account_deletion.php`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('account_deletion_feedback')) {
            return;
        }

        Schema::create('account_deletion_feedback', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('user_uuid', 64)->nullable()->index();
            $table->string('username')->nullable();
            $table->string('email')->nullable();
            $table->tinyInteger('user_role')->nullable();
            $table->string('reason_code', 64)->index();
            $table->text('comment')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('deleted_account_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_deletion_feedback');
    }
};
