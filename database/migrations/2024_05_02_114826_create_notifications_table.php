<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            $looksLikeLaravelNotifications =
                Schema::hasColumn('notifications', 'type') &&
                Schema::hasColumn('notifications', 'data') &&
                Schema::hasColumn('notifications', 'read_at') &&
                ! Schema::hasColumn('notifications', 'notification');

            if ($looksLikeLaravelNotifications) {
                if (! Schema::hasTable('notifications_laravel_backup')) {
                    Schema::rename('notifications', 'notifications_laravel_backup');
                } else {
                    Schema::drop('notifications');
                }
            }
        }

        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->uuid();
                $table->foreignId('user_id')->nullable();
                $table->foreignId('notifiable_id');
                $table->string('notifiable_type');
                $table->longText('notification');
                $table->tinyInteger('is_read')->default(0);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('notifications_laravel_backup')) {
            DB::table('notifications_laravel_backup')
                ->orderBy('created_at')
                ->chunk(200, function ($rows) {
                    $payload = [];
                    foreach ($rows as $row) {
                        $payload[] = [
                            'uuid' => Uuid::uuid4()->toString(),
                            'user_id' => null,
                            'notifiable_id' => $row->notifiable_id,
                            'notifiable_type' => $row->type,
                            'notification' => $row->data,
                            'is_read' => empty($row->read_at) ? 0 : 1,
                            'created_at' => $row->created_at,
                            'updated_at' => $row->updated_at,
                            'deleted_at' => null,
                        ];
                    }

                    if (! empty($payload)) {
                        DB::table('notifications')->insert($payload);
                    }
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');

        if (Schema::hasTable('notifications_laravel_backup')) {
            Schema::rename('notifications_laravel_backup', 'notifications');
        }
    }
};
