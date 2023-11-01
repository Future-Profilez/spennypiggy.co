<?php

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
        Schema::dropIfExists("wishitems");
        Schema::create('wish_items', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->foreignIdFor(User::class)->default(NULL)->nullable();
            $table->string('wishname');
            $table->double('price', 10, 2)->default(0.00);
            $table->text('item_url')->nullable();
            $table->text('thumbnail')->nullable();
            $table->tinyInteger('subscription')->comment("0-single, 1-subs, 2-crowdfund"); // single, subcription, crowdfund
            $table->string('subscription_period')->nullable();
            $table->tinyInteger('repeat_purchase')->default(0);
            $table->text('category')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wish_items');
    }
};
