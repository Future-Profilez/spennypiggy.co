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
        Schema::create('auth_redirects', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->foreignIdFor(User::class);
            $table->string("country",30)->nullable();
            $table->string('origin')->nullable();
            $table->string('target')->nullable();
            $table->string('query_string')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('uuid');
            $table->index(['uuid', 'target']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auth_redirects');
    }
};
