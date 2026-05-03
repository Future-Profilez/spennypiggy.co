<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class Membership extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'product_id',
        'price_id',
        'level',
        'price',
        'currency',
        'tax_amount',
        'thumbnail',
        'rewards',
        'status',
        'approved',
        'edited_reason',
        'edited_status',
        // New social engagement fields
        'supporter_count',
        'gift_frequency',
        'creator_growth_rate',
        'rising_score',
        'engagement_level',
        'trending_status'
    ];


    protected $appends = [
        'perma_link'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }

    public function payments(){
        return $this->hasMany(MembershipPayment::class);
    }

    public function getPermaLinkAttribute()
    {
        $url = false;
        if (!empty($this->thumbnail)) {
            $url = "https://ucarecdn.com/" . $this->thumbnail . "/-/format/jpeg/";
        } else {
            if($this->level == 'bronze'){
                $url = "https://ucarecdn.com/70d610ae-b6b0-4f5a-a144-2d49765c4140/";
            }
            elseif($this->level == 'silver'){
                $url = "https://ucarecdn.com/be570b7f-9a2f-49ef-9228-aa88c457c215/";
            }
            elseif($this->level == 'gold'){
                $url = "https://ucarecdn.com/efb9fec0-ee98-499a-a82b-e90137357f8b/";
            }
            elseif($this->level == 'platinum'){
                $url = "https://ucarecdn.com/e44e62d6-295f-4c6c-a907-537998f54192/";
            }
            elseif($this->level == 'lifetime'){
                $url = "https://ucarecdn.com/58a3bd82-a089-423c-b3f8-f9da5ece4e90/";
            }
        }

        return $url;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
