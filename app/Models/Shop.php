<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Ramsey\Uuid\Uuid;

class Shop extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'stripe_product_id',
        'name',
        'description',
        'image',
        'price',
        'currency',
        'success_page_type',
        'success_page_value',
        'success_page_type',
        'reward_file_type',
        'reward_file',
        'ask_question',
        'slot_limitation',
        'special_member_price',
        'quantity_allow',
        'shipping_information',
        'vat_applicable'
    ];

    protected $hidden   =   [
        'id',
        'user_id',
        'stripe_product_id',
        'image',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $appends = [
        'perma_link',
        'reward_file_url',
        'total_sold',
        'real_category'
    ];

    public static function boot()
    {
        parent::boot();
        static::creating(fn ($w) => $w->uuid = Uuid::uuid4());
    }


    public function user(){
        return $this->belongsTo(User::class,'user_id');
    }


    public function getPermaLinkAttribute(){
        $url = false;
        if(!empty($this->image)){
            $url = "https://ucarecdn.com/" . $this->image . "/-/format/jpeg/";
        }

        return $url;
    }


    public function getRewardFileUrlAttribute(){
        $url = false;
        if(!empty($this->reward_file)){
            $url = "https://ucarecdn.com/" . $this->reward_file . "/";
        }

        return $url;
    }


    public function getTotalSoldAttribute(){
        $payments = ShopPayment::where('shop_id',$this->id)->where('payment_status','paid')->count();

        return $payments;
    }


    public function category(){
        return $this->hasMany(ShopCategory::class,'shop_id');
    }

    public function getRealCategoryAttribute()
    {
        $arr = [];
        foreach ($this->category as $category) {
            $arr[] = $category->category;
        }

        return $arr;
    }

}
