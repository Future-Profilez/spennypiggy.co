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
        Schema::create('creator_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('category'); // clothing, equipment, etc.
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('GBP');
            $table->date('expense_date');
            $table->string('receipt_url')->nullable();
            $table->string('status')->default('logged'); // logged, verified
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['user_id', 'expense_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('creator_expenses');
    }
};
