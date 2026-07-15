@component('mail::message')
# Dispute Opened

Hi {{ $user->name }},

A dispute has been opened against one of your payments. The amount has been reserved while the dispute is being reviewed.

**Dispute Details:**
- **ID:** {{ $dispute->stripe_dispute_id }}
- **Amount:** {{ $dispute->currency }} {{ number_format($dispute->amount / 100, 2) }}
- **Reason:** {{ ucfirst($dispute->reason) }}
- **Status:** {{ ucfirst($dispute->status) }}
- **Evidence Due By:** {{ $dispute->evidence_due_by ? $dispute->evidence_due_by->format('Y-m-d H:i:s') : 'N/A' }}

### What happens next?

We are automatically submitting evidence on your behalf. No action is required from you at this time.

**Important:** If the dispute is lost, the funds will be deducted from your account. If won, the funds will be released.

@component('mail::button', ['url' => config('app.url') . '/dashboard'])
View Dashboard
@endcomponent

If you have any questions about this dispute, please contact our support team.

Thanks,
{{ config('app.name') }} Team
@endcomponent