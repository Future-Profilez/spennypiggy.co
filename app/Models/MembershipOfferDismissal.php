<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A buyer's refusal of one creator's membership offer.
 *
 * Per creator, never global: turning down one creator's membership says nothing about
 * another's. See the migration for why this is server-side rather than localStorage.
 */
class MembershipOfferDismissal extends Model
{
    protected $fillable = ['user_id', 'email', 'creator_id', 'dismissed_at'];

    protected $casts = ['dismissed_at' => 'datetime'];
}
