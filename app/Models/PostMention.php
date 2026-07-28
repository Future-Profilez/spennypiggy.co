<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostMention extends Model
{
    protected $fillable = ['post_id', 'user_id', 'notified_at'];

    protected $casts = ['notified_at' => 'datetime'];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
