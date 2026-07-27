<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CacheService
{
    /**
     * Cache duration constants
     */
    const SHORT_CACHE = 300; // 5 minutes

    const MEDIUM_CACHE = 3600; // 1 hour

    const LONG_CACHE = 86400; // 24 hours

    const VERY_LONG_CACHE = 604800; // 7 days

    /**
     * Cache a database query result (DISABLED - NO CACHING)
     */
    public static function remember(string $key, $ttl, callable $callback, array $tags = [])
    {
        // CACHING DISABLED - just execute callback directly
        return $callback();
    }

    /**
     * Cache user-specific data
     */
    public static function rememberUser(int $userId, string $key, $ttl, callable $callback)
    {
        $cacheKey = "user:{$userId}:{$key}";
        $tags = ['user', "user:{$userId}"];

        return self::remember($cacheKey, $ttl, $callback, $tags);
    }

    /**
     * Cache model data with automatic invalidation
     */
    public static function rememberModel(Model $model, string $key, $ttl, callable $callback)
    {
        $modelClass = get_class($model);
        $modelKey = $model->getKey();
        $cacheKey = "model:{$modelClass}:{$modelKey}:{$key}";
        $tags = ['models', strtolower(class_basename($modelClass)), "model:{$modelClass}:{$modelKey}"];

        return self::remember($cacheKey, $ttl, $callback, $tags);
    }

    /**
     * Cache expensive aggregations
     */
    public static function rememberStats(string $key, $ttl, callable $callback)
    {
        $cacheKey = "stats:{$key}";
        $tags = ['stats'];

        return self::remember($cacheKey, $ttl, $callback, $tags);
    }

    /**
     * Cache API responses
     */
    public static function rememberApi(string $endpoint, array $params, $ttl, callable $callback)
    {
        $paramHash = md5(serialize($params));
        $cacheKey = "api:{$endpoint}:{$paramHash}";
        $tags = ['api', "api:{$endpoint}"];

        return self::remember($cacheKey, $ttl, $callback, $tags);
    }

    /**
     * Invalidate cache by tags
     */
    public static function invalidateTags(array $tags)
    {
        // CACHING DISABLED - Nothing to invalidate
    }

    /**
     * Invalidate user-specific cache
     */
    public static function invalidateUser(int $userId)
    {
        self::invalidateTags(["user:{$userId}"]);
    }

    /**
     * Invalidate model cache
     */
    public static function invalidateModel(Model $model)
    {
        $modelClass = get_class($model);
        $modelKey = $model->getKey();
        self::invalidateTags(["model:{$modelClass}:{$modelKey}"]);
    }

    /**
     * Cache paginated results
     */
    public static function rememberPaginated(string $key, array $params, $ttl, callable $callback)
    {
        $paramHash = md5(serialize($params));
        $cacheKey = "paginated:{$key}:{$paramHash}";

        // CACHING DISABLED - just execute callback directly
        return $callback();
    }

    /**
     * Warm up cache with common queries
     */
    public static function warmUp()
    {
        // Warm up frequently accessed data
        self::rememberStats('daily_users', self::LONG_CACHE, function () {
            return DB::table('users')
                ->whereDate('created_at', today())
                ->count();
        });

        self::rememberStats('popular_categories', self::LONG_CACHE, function () {
            return DB::table('user_categories')
                ->select('category_name', DB::raw('count(*) as count'))
                ->groupBy('category_name')
                ->orderByDesc('count')
                ->limit(10)
                ->get();
        });
    }

    /**
     * Get cache key for Eloquent query
     */
    public static function getQueryKey(Builder $query): string
    {
        return md5($query->toSql().serialize($query->getBindings()));
    }

    /**
     * Memoize expensive computations
     */
    private static array $memoized = [];

    public static function memoize(string $key, callable $callback)
    {
        if (! isset(self::$memoized[$key])) {
            self::$memoized[$key] = $callback();
        }

        return self::$memoized[$key];
    }

    /**
     * Clear memoized cache
     */
    public static function clearMemoized()
    {
        self::$memoized = [];
    }
}
