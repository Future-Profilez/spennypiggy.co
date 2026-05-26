<?php

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
        Schema::create('piggy_pot_contributions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('piggy_pot_id')->constrained('piggy_pots')->onDelete('cascade');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            
            $table->integer('amount'); // Minor units e.g., 500 = £5.00
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('vat_amount', 10, 2)->default(0);
            $table->integer('total_paid')->default(0); // Minor units
            $table->string('currency');
            
            $table->text('message')->nullable();
            $table->boolean('is_anonymous')->default(false);
            
            $table->string('session_id')->nullable();
            $table->string('payment_intent_id')->nullable();
            $table->enum('status', ['pending', 'paid', 'refunded', 'disputed'])->default('pending');
            
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('piggy_pot_contributions');
    }
};
