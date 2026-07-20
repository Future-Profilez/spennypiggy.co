@component('mail::message')
# Dispute Updated

Hi {{ $user->name }},

The status of your dispute has been updated.

**Dispute Details:**
- **ID:** {{ $dispute->stripe_dispute_id }}
- **Amount:** {{ $dispute->currency }} {{ number_format($dispute->amount / 100, 2) }}
- **Reason:** {{ ucfirst($dispute->reason) }}
- **Status:** {{ ucfirst($dispute->status) }}
- **Evidence Due By:** {{ $dispute->evidence_due_by ? $dispute->evidence_due_by->format('Y-m-d H:i:s') : 'N/A' }}

**Changes:**
@foreach($changes as $field => $change)
- **{{ ucfirst(str_replace('_', ' ', $field)) }}:** {{ $change['old'] }} → {{ $change['new'] }}
@endforeach

@if($dispute->status === 'under_review')
### Action Required

The dispute is now under review. Please check your Stripe dashboard for any additional information that may be required.
@endif

@component('mail::button', ['url' => config('app.url') . '/dashboard'])
View Dashboard
@endcomponent

If you have any questions about this dispute, please contact our support team.

Thanks,
{{ config('app.name') }} Team
@endcomponent