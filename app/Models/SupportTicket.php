<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SupportTicket extends Model
{
    protected $fillable = [
        'uuid',
        'type',
        'status',
        'creator_id',
        'supporter_id',
        'guest_email',
        'event_type',
        'source',
        'source_id',
        'stripe_payment_intent_id',
        'stripe_session_id',
        'reason',
        'sla_deadline',
        'reminder_24h_sent_at',
        'reminder_6h_sent_at',
        'last_message_at',
        'last_creator_message_at',
        'last_supporter_message_at',
        'last_admin_message_at',
        'escalated_at',
        'escalation_reason',
        'resolved_at',
    ];

    protected $casts = [
        'sla_deadline' => 'datetime',
        'reminder_24h_sent_at' => 'datetime',
        'reminder_6h_sent_at' => 'datetime',
        'last_message_at' => 'datetime',
        'last_creator_message_at' => 'datetime',
        'last_supporter_message_at' => 'datetime',
        'last_admin_message_at' => 'datetime',
        'escalated_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $ticket) {
            if (!$ticket->uuid) {
                $ticket->uuid = (string) Str::uuid();
            }
        });
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class, 'ticket_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function supporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supporter_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'stripe_payment_intent_id', 'stripe_payment_intent_id');
    }
}
