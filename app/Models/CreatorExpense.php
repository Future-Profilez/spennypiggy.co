<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CreatorExpense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category',
        'description',
        'amount',
        'currency',
        'expense_date',
        'receipt_url',
        'status',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
