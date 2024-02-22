<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Bills extends Model
{
    use HasFactory;

    protected $table = 'bills';

    protected $fillable = [
        'uuid',
        'user_id',
        'product_id',
        'price_id',
        'name',
        'price',
        'currency',
        'thumbnail',
        'tax_amount',
        'status'
    ];

    protected $appends = [
        'perma_link'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (!empty($this->thumbnail)) {
            $url = "https://ucarecdn.com/" . $this->thumbnail . "/";
        } else {
            $url = "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/";
        }

        return $url;
    }
}
