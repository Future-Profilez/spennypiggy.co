<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'creator_id',
        'title',
        'description',
        'price',
        'category',
        'type',
        'status',
        'media_url',
        'deliverable_content_type',
        'deliverable_content',
        'deliverable_note',
        'sla_hours',
        'stripe_product_id',
        'stripe_price_id',
        'is_approved',
    ];

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function creator()
{
        return $this->belongsTo(User::class, 'creator_id');
    }
}
