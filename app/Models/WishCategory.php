<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\InvalidatesUserCache;
use Illuminate\Support\Facades\Log;

class WishCategory extends Model
{
    use HasFactory, SoftDeletes, InvalidatesUserCache;

    protected $dates = ['deleted_at'];
    protected $fillable = [
        "wish_item_id",
        "user_category_id",
        'deleted_at',
    ];

    protected $hidden   =   [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function wish()
    {
        return $this->belongsTo(WishItem::class, 'wish_item_id');
    }

    public function category()
    {
        return $this->belongsTo(UserCategory::class, 'user_category_id');
    }

    /**
     * Override invalidateUserCache to handle relationships
     */
    public function invalidateUserCache()
    {
        $userId = null;

        // Try to get user from wish or category (checking relations first to avoid queries if loaded)
        if ($this->relationLoaded('wish') && $this->wish) {
            $userId = $this->wish->user_id;
        } elseif ($this->relationLoaded('category') && $this->category) {
            $userId = $this->category->user_id;
        } else {
            // Fallback to query
            $wish = $this->wish()->withTrashed()->first();
            if ($wish) {
                $userId = $wish->user_id;
            } elseif ($cat = $this->category()->withTrashed()->first()) {
                $userId = $cat->user_id;
            }
        }

        if ($userId) {
            try {
                $service = app(\App\Services\UserProfileService::class);
                if (method_exists($service, 'incrementUserCacheVersion')) {
                    $service->incrementUserCacheVersion($userId);
                }
            } catch (\Exception $e) {
                Log::error("Failed to invalidate user cache for WishCategory ID {$this->id}: " . $e->getMessage());
            }
        }
    }
}
