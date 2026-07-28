<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostSlugHistory extends Model
{
    protected $table = 'post_slug_history';

    protected $fillable = ['post_id', 'slug'];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
