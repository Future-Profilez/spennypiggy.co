<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class Post extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'type',
        'for_module',
        'title',
        'content',
        'image',
    ];

    protected $appends = [
        'image_url'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }

    public function getImageUrlAttribute()
    {
        $url = false;
        if (!empty($this->image)) {
            $url = "https://ucarecdn.com/" . $this->image . '/';            
        }
        return $url;
    }
}
