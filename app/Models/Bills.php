<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class Bills extends Model
{
    use HasFactory,SoftDeletes;

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
            $url = "https://ucarecdn.com/" . $this->thumbnail . "/-/format/jpeg/";
        } else {
            $url = "https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/";
        }

        return $url;
    }

    public function payments(){
        return $this->hasMany(BillPayment::class);
    }
}
