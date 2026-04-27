<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class PostComment extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
      'uuid',
      'post_id',
      'user_id',
      'comment',
      'is_approved',
    ];

    protected $hidden = [
        'id',
        'user_id',
        'post_id',
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function post(){
        return $this->belongsTo(Post::class,'post_id');
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id')->where('is_uk', 0);
    }

    public function replies(){
        return $this->hasMany(PostCommentReplies::class,'post_comment_id');
    }
}
