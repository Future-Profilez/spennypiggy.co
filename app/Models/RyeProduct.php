<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\InvalidatesUserCache;

class RyeProduct extends Model
{
    use HasFactory, SoftDeletes, HasUuids, InvalidatesUserCache;

    public function uniqueIds()
    {
        return ['uuid'];
    }

    protected $fillable = [
        'stripe_product_id',
        'creator_id',
        'user_id',
        'product_id',
        'details',
        'deleted_at',
    ];

    /**
     * Override invalidateUserCache to handle user_id or creator_id
     */
    public function invalidateUserCache()
    {
        $userId = $this->user_id ?? $this->creator_id;
        
        if ($userId) {
            try {
                $service = app(\App\Services\UserProfileService::class);
                if (method_exists($service, 'incrementUserCacheVersion')) {
                    $service->incrementUserCacheVersion($userId);
                }
            } catch (\Exception $e) {
                // Fail silently to not block the main process
            }
        }
    }
}
