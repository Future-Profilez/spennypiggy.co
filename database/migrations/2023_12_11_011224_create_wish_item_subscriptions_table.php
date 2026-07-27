<?php

use App\Models\WishItem;
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
        Schema::create('wish_item_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->string('stripe_id')->nullable();
            $table->foreignIdFor(WishItem::class);
            $table->foreignId('user_id')->nullable();
            $table->string('guest_name', 100)->nullable();
            $table->string('guest_email', 150)->nullable();
            $table->string('currency')->nullable()->default('GBP');
            $table->float('amount');
            $table->float('tax');
            $table->string('recurring_for')->nullable()->comment('onetime,continue');
            $table->string('recurring_type')->nullable()->comment('daily,weekly,monthly,yearly');
            $table->timestamp('end')->nullable();
            $table->timestamp('upcoming_payment')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wish_item_subscriptions');
    }
};
