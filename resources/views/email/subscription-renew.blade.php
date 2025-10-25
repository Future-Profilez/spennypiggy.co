@extends('email.default-2')
@section('content')
@php
$messages = [
    'renew' => [
        'text' => 'Renewed',
        'desc' => 'Subscription renewed 🎉',
        'body' => '',
    ],
    'failed' => [
        'text' => 'Failed',
        'desc' => 'Subscription could not be processed ❌',
        'body' => 'There was a problem processing your payment. Please update your payment method to continue enjoying premium access.',
    ],
    'cancelled' => [
        'text' => 'Cancelled',
        'desc' => 'Subscription has been cancelled 🛑',
        'body' => 'We’re sorry to see you go. Your access will remain active until the end of the current billing period.',
    ],
    'trial' => [
        'text' => 'Trial Ending Soon',
        'desc' => 'Trial is ending soon ⏳',
        'body' => 'Your free trial is about to end. If you don’t cancel, your subscription will start automatically and you will be charged.',
    ],
    'start' => [
        'text' => 'Started',
        'desc' => '🎉 You’ve successfully started your subscription!',
        'body' => 'Get ready to unlock all premium features 🚀 — no limits, no restrictions! Enjoy exclusive access, priority support, and the full Spenny Piggy experience 🐷💎. We’re thrilled to have you on board. Let the fun begin!',
    ]
];

$status = $messages[$type] ?? ['text' => 'Status', 'desc' => 'was updated', 'body' => 'Your subscription status has changed.'];
@endphp


<tr>
    <td align="center" style="padding: 10px;">
        <a href="{{ env('APP_URL') }}/">
            <img src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" alt="Spenny Piggy" width="130" style="border: none;" />
        </a>
    </td>
</tr>

<tr>
    <td align="center" style="padding: 10px 0;">
        <p style="font-size: 18px; color: #111; margin: 5px 0;"><strong>Your Spenny Piggy Subscription Details</strong></p>
    </td>
</tr>

<tr>
    <td align="center" style="padding: 20px 0;">
        <p style="font-size: 18px; color: #000; margin: 0;"><strong>Hello {{ $array['name'] ?? 'there' }}!</strong></p>
        <p style="font-size: 16px; color: #333; margin-top: 10px;">{{ $status['desc'] }}</p>
    </td>
</tr>

@if($type == 'renew' && isset($array['trial_end']))
<tr>
    <td style="padding: 10px 20px; font-size: 14px; color: #555; text-align: center;">
        🎉 Your subscription was renewed on <strong>{{ \Carbon\Carbon::parse($array['renew_on'])->format('F j, Y') }}</strong>.<br>
        Amount charged: <strong>{{ number_format($array['amount'], 2) }} {{ strtoupper($array['currency']) }}. </strong>.
        <p style="font-size: 16px; color: #333; margin-top: 10px;">Thank you for continuing your journey with Spenny Piggy! 🐷 Your subscription keeps all your premium features active without interruption.</p>
    </td>
</tr>
@endif
 
@if($type == 'trial' && isset($array['trial_end']))
<tr>
    <td style="padding: 10px 20px; font-size: 14px; color: #555; text-align: center;">
        Your trial ends on <strong>{{ \Carbon\Carbon::parse($array['trial_end'])->format('F j, Y') }}</strong>.<br>
        After that, you’ll be charged <strong>{{ number_format($array['amount'], 2) }} {{ strtoupper($array['currency']) }}</strong> automatically using your default payment method.
    </td>
</tr>
<tr>
    <td style="padding: 10px 20px; font-size: 14px; color: #666; text-align: center;">
        To avoid charges, cancel your subscription before the trial ends.
    </td>
</tr>
@endif

@if(!in_array($type, ['renew', 'trial']))
<tr>
    <td style="padding: 10px 20px; font-size: 14px; color: #555; text-align: center;">
        {{ $status['body'] }}
    </td>
</tr>
@endif

<tr>
    <td align="center" style="padding: 25px 10px;">
        <a href="{{ env('APP_URL') }}" style="display: inline-block; background: #8C52FF; color: #fff; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none;">
            Manage My Subscription
        </a>
    </td>
</tr>
@endsection
