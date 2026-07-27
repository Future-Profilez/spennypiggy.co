<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Logs extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'remove_wish_id',
        'remove_bill_id',
        'remove_post_id',
        'remove_membership_id',
        'edited_wish_id',
        'deleted_user_id',
        'suspended_user_id',
        'message',
        'status',
    ];

    public function removeWish()
    {
        return $this->belongsTo(WishItem::class, 'remove_wish_id', 'id');
    }

    public function removePost()
    {
        return $this->belongsTo(Post::class, 'remove_post_id', 'id');
    }

    public function removeShop()
    {
        return $this->belongsTo(Shop::class, 'remove_shop_id', 'id');
    }

    public function editedShop()
    {
        return $this->belongsTo(Shop::class, 'edited_shop_id', 'id');
    }

    public function editedPost()
    {
        return $this->belongsTo(Post::class, 'edited_post_id', 'id');
    }

    public function editedAboutMe()
    {
        return $this->belongsTo(User::class, 'edited_about_me_id', 'id');
    }

    // public function editedUserCategory()
    // {
    //     return $this->belongsTo(UserCategory::class, 'edited_user_category_id', 'id');
    // }

    public function removeBill()
    {
        return $this->belongsTo(Bills::class, 'remove_bill_id', 'id');
    }

    public function editedBill()
    {
        return $this->belongsTo(Bills::class, 'edited_bill_id', 'id');
    }

    public function removeMembership()
    {
        return $this->belongsTo(Membership::class, 'remove_membership_id', 'id');
    }

    public function editedMembership()
    {
        return $this->belongsTo(Membership::class, 'edited_membership_id', 'id');
    }

    public function editedWish()
    {
        return $this->belongsTo(WishItem::class, 'edited_wish_id', 'id');
    }

    public function suspendedUser()
    {
        return $this->belongsTo(User::class, 'suspended_user_id', 'id');
    }

    public function deletedUser()
    {
        return $this->belongsTo(User::class, 'deleted_user_id', 'id');
    }
}
