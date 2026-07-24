<?php

use App\Models\TipGoal;
use App\Models\User;
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
        Schema::create('tip_goals_payments', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->string('session_id')->nullable();
            $table->foreignIdFor(TipGoal::class);
            $table->foreignIdFor(User::class);
            $table->unsignedBigInteger('creator_id')->nullable();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('currency')->nullable();
            $table->double('amount', 10, 2)->default(0.00);
            $table->double('tax', 10, 2)->default(0.00);
            $table->text('message')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::table('tip_goals_payments', function (Blueprint $table) {
            $table->index('tip_goal_id');
            $table->index('user_id');
            $table->index('creator_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tip_goals_payments');
    }
};
