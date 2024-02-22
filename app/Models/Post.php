<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
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
        'image_url',
        'likes_count',
        'liked'
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


    public function getLikesCountAttribute(){
        return $this->likes()->where('status',1)->count();
    }

    public function comments(){
        return $this->hasMany(PostComment::class,'post_id');
    }

    public function getLikedAttribute(){
        $like = null;
        $like = null;
        if (Auth::check()) {
            $like = PostLike::where('post_id',$this->id)->where('user_id',Auth::check())->where('status',1)->first();
        }

        if(!empty($like)){
            return true;
        }

        return false;
    }
}
