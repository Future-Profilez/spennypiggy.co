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
        'status'
    ];

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
