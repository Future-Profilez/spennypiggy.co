<?php

namespace App\Traits;

use App\Services\UserProfileService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

trait InvalidatesUserCache
{
    protected static function bootInvalidatesUserCache()
    {
        static::created(function (Model $model) {
            $model->invalidateUserCache();
        });

        static::updated(function (Model $model) {
            $model->invalidateUserCache();
        });

        static::deleted(function (Model $model) {
            $model->invalidateUserCache();
        });
    }

    public function invalidateUserCache()
    {
        $userId = null;
        $shouldClearUsernameCache = false;
        $originalUsername = null;

        if ($this instanceof \App\Models\User) {
            $userId = $this->id;
            // Check if username was changed
            if ($this->wasChanged('username')) {
                $shouldClearUsernameCache = true;
                $originalUsername = $this->getOriginal('username');
            }
        } elseif (!empty($this->user_id)) {
            $userId = $this->user_id;
        } elseif (!empty($this->creator_id)) {
            $userId = $this->creator_id;
        }

        if ($userId) {
            try {
                $service = app(UserProfileService::class);
                if (method_exists($service, 'incrementUserCacheVersion')) {
                    $service->incrementUserCacheVersion($userId);
                }
                
                // If username changed, clear the username mapping cache
                if ($shouldClearUsernameCache && $originalUsername) {
                    \Illuminate\Support\Facades\Cache::forget("userid_by_username_{$originalUsername}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to invalidate user cache for User ID {$userId}: " . $e->getMessage());
            }
        }
    }
}
