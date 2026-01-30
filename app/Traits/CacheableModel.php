<?php

namespace App\Traits;

use App\Services\CacheService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

trait CacheableModel
{
    /**
     * Boot the cacheable trait
     */
    protected static function bootCacheableModel()
    {
        // Clear cache on model events
        static::saved(function ($model) {
            $model->clearModelCache();
        });

        static::deleted(function ($model) {
            $model->clearModelCache();
        });

        static::updated(function ($model) {
            $model->clearModelCache();
        });
    }

    /**
     * Cache a query result
     */
    public function scopeCached(Builder $query, int $minutes = null)
    {
        return $query->get();
    }

    /**
     * Cache a single model
     */
    public function scopeCachedFind(Builder $query, $id, int $minutes = null)
    {
        return $query->find($id);
    }

    /**
     * Cache paginated results
     */
    public function scopeCachedPaginate(Builder $query, int $perPage = 15, array $columns = ['*'], string $pageName = 'page', int $page = null)
    {
        return $query->paginate($perPage, $columns, $pageName, $page);
    }

    /**
     * Eager load relationships with caching
     */
    public function scopeWithCached(Builder $query, array $relations)
    {
        return $query->with($relations);
    }

    /**
     * Get commonly used relationships
     */
    public function scopeWithCommon(Builder $query)
    {
        $commonRelations = $this->getCommonRelations();
        
        if (!empty($commonRelations)) {
            return $query->with($commonRelations);
        }
        
        return $query;
    }

    /**
     * Count with caching
     */
    public function scopeCachedCount(Builder $query, int $minutes = null)
    {
        $minutes = $minutes ?? config('cache.ttl', 60);
        $key = $this->getCacheKeyForCount($query);
        
        return CacheService::remember(
            $key,
            $minutes * 60,
            function () use ($query) {
                return $query->count();
            },
            $this->getCacheTags()
        );
    }

    /**
     * Get cache key for query
     */
    protected function getCacheKey(Builder $query): string
    {
        $model = get_class($this);
        $sql = $query->toSql();
        $bindings = $query->getBindings();
        
        return "model_cache:{$model}:" . md5($sql . serialize($bindings));
    }

    /**
     * Get cache key for find operation
     */
    protected function getCacheKeyForFind($id): string
    {
        $model = get_class($this);
        return "model_find:{$model}:{$id}";
    }

    /**
     * Get cache key for pagination
     */
    protected function getCacheKeyForPagination(Builder $query, int $perPage, int $page): string
    {
        $model = get_class($this);
        $sql = $query->toSql();
        $bindings = $query->getBindings();
        
        return "model_paginate:{$model}:" . md5($sql . serialize($bindings) . $perPage . $page);
    }

    /**
     * Get cache key for count
     */
    protected function getCacheKeyForCount(Builder $query): string
    {
        $model = get_class($this);
        $sql = $query->toSql();
        $bindings = $query->getBindings();
        
        return "model_count:{$model}:" . md5($sql . serialize($bindings));
    }

    /**
     * Get cache tags for this model
     */
    protected function getCacheTags(): array
    {
        return [
            'models',
            strtolower(class_basename($this)),
            get_class($this)
        ];
    }

    /**
     * Clear model cache
     */
    public function clearModelCache() {
        CacheService::invalidateTags($this->getCacheTags());
        CacheService::invalidateModel($this);
    }

    /**
     * Define common relationships for eager loading
     * Override this method in your models
     */
    protected function getCommonRelations(): array
    {
        return [];
    }

    /**
     * Optimize query by selecting only needed columns
     */
    public function scopeOptimized(Builder $query, array $columns = null)
    {
        if ($columns) {
            return $query->select($columns);
        }

        // Select optimized columns based on model
        $optimizedColumns = $this->getOptimizedColumns();
        
        if (!empty($optimizedColumns)) {
            return $query->select($optimizedColumns);
        }
        
        return $query;
    }

    /**
     * Define optimized columns for queries
     * Override this method in your models
     */
    protected function getOptimizedColumns(): array
    {
        return ['*'];
    }

    /**
     * Batch process models to avoid N+1 queries
     */
    public static function batchProcess(Collection $models, string $relation, callable $callback = null)
    {
        if ($models->isEmpty()) {
            return;
        }

        // Load the relation for all models at once
        $models->load($relation);

        // Apply callback if provided
        if ($callback) {
            $models->each($callback);
        }

        return $models;
    }

    /**
     * Remember expensive model computations
     */
    public function rememberComputation(string $key, callable $callback, int $ttl = null)
    {
        $ttl = $ttl ?? CacheService::MEDIUM_CACHE;
        $cacheKey = $this->getComputationCacheKey($key);
        
        return CacheService::rememberModel($this, $key, $ttl, $callback);
    }

    /**
     * Get computation cache key
     */
    protected function getComputationCacheKey(string $key): string
    {
        return "computation:{$key}:{$this->getKey()}";
    }

    /**
     * Scope for active records (commonly used filter)
     */
    public function scopeActive(Builder $query)
    {
        if (in_array('is_active', $this->fillable) || isset($this->attributes['is_active'])) {
            return $query->where('is_active', true);
        }
        
        if (in_array('status', $this->fillable) || isset($this->attributes['status'])) {
            return $query->where('status', 'active');
        }
        
        return $query;
    }

    /**
     * Scope for recent records
     */
    public function scopeRecent(Builder $query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
