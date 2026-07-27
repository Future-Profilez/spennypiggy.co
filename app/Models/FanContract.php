<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class FanContract extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'sign',
        'document',
        'comment',
        'status',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($model) => $model->uuid = Uuid::uuid4());
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute()
    {
        return 'https://ucarecdn.com/'.$this->document.'/';
    }
}
