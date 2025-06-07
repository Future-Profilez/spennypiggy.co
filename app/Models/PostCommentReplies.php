<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class PostCommentReplies extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
        'uuid',
        'post_comment_id',
        'user_id',
        'reply',
    ];

    protected $hidden = [
        'id',
        'user_id',
        'post_comment_id',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function post_comment(){
        return $this->belongsTo(PostComment::class,'post_comment_id');
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id')->where('is_uk', 0);
    }
}
