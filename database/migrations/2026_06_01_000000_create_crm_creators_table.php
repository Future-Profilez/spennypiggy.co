<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_creators', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('user_id')->nullable()->index();

            $table->string('full_name')->nullable();
            $table->string('username')->nullable();
            $table->string('email')->nullable()->index();

            $table->string('x_handle')->nullable();
            $table->string('instagram_handle')->nullable();
            $table->string('tiktok_handle')->nullable();
            $table->string('youtube_handle')->nullable();
            $table->string('website')->nullable();

            $table->string('current_platform')->nullable();
            $table->string('creator_category')->nullable();

            $table->decimal('estimated_monthly_value', 12, 2)->nullable();
            $table->decimal('estimated_monthly_earnings', 12, 2)->nullable();
            $table->unsignedInteger('follower_count')->nullable();

            $table->unsignedBigInteger('assigned_team_member_id')->nullable()->index();
            $table->dateTime('last_contact_date')->nullable()->index();
            $table->dateTime('next_follow_up_date')->nullable()->index();

            $table->text('notes')->nullable();

            $table->string('crm_stage')->default('prospect')->index();

            $table->string('invite_token')->nullable()->unique();
            $table->dateTime('invite_token_used_at')->nullable();

            $table->dateTime('social_match_suggested_at')->nullable();
            $table->unsignedBigInteger('social_match_suggested_user_id')->nullable()->index();

            $table->string('status')->default('active')->index();

            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('social_match_suggested_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('assigned_team_member_id')->references('id')->on('admins')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('admins')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('admins')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_creators');
    }
};
