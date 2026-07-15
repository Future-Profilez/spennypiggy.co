@component('mail::message')
# {{ $won ? '🎉 Dispute Won!' : 'Dispute Lost' }}

Hi {{ $user->name }},

The dispute has been closed.

**Dispute Details:**
- **ID:** {{ $dispute->stripe_dispute_id }}
- **Amount:** {{ $dispute->currency }} {{ number_format($dispute->amount / 100, 2) }}
- **Reason:** {{ ucfirst($dispute->reason) }}
- **Final Status:** {{ ucfirst($dispute->status) }}

@if($won)
### ✅ Great News!

You won the dispute! The reserved funds have been released back to your account.

**Amount Released:** {{ $dispute->currency }} {{ number_format($dispute->amount / 100, 2) }}
@else
### ❌ Dispute Lost

The dispute was decided in favor of the cardholder. The funds have been deducted from your account.

**Amount Deducted:** {{ $dispute->currency }} {{ number_format($dispute->amount / 100, 2) }}
@endif

@component('mail::button', ['url' => config('app.url') . '/dashboard'])
View Dashboard
@endcomponent

If you have any questions about this dispute resolution, please contact our support team.

Thanks,
{{ config('app.name') }} Team
@endcomponent