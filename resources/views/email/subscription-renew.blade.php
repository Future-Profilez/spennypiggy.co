@extends('email.default-2')

@section('content')
@php
$messages = [
'renew' => ['text' => 'Renewed', 'desc' => 'renewed successfully'],
'failed' => ['text' => 'Failed', 'desc' => 'failed'],
'cancel' => ['text' => 'Cancelled', 'desc' => 'cancelled'],
'trial' => ['text' => 'Trial Ending Soon', 'desc' => 'ending soon'],
];

$status = $messages[$type] ?? ['text' => 'Status', 'desc' => 'updated'];
@endphp

<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') }}/">
            <img alt="image" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>

<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; width: 100%; text-align: center;">
            <tr>
                <td style="font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                    <span style="color: #8C52FF">
                        Subscription {{ in_array($module, ['bill', 'membership', 'site']) ? "for $module " : "" }}
                    </span>{{ $status['text'] }} on <br> Spenny Piggy 🎁
                </td>
            </tr>

            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style="padding: 0 0 25px 0; text-align: center;">
                    <img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img">
                </td>
            </tr>
            @if($type != 'renew')
            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                    Hello {{ $array['name'] }}! <br><br>
                    Please note your subscription is {{ $status['desc'] }} on Spenny Piggy. 🎁
                </td>
            </tr>
            @endif

            @if($type == 'renew' && isset($array['trial_end']))
            <tr>
                <td style="padding: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    🎉 Good news! Your subscription has been <strong>renewed successfully</strong> on <strong>{{ \Carbon\Carbon::parse($array['trial_end'])->format('F j, Y') }}</strong>. <br>
                    We've charged <strong>{{ number_format($array['amount'], 2) }} {{ strtoupper($array['currency']) }}</strong> using your saved payment method.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-size: 14px; line-height: 22px; scolor: #4D4D4D; text-align: center;">
                    Thank you for continuing your journey with Spenny Piggy! 🐷 Your subscription keeps all your premium features active without interruption.
                </td>
            </tr>
            @endif


            @if($type == 'trial' && isset($array['trial_end']))
            <tr>
                <td style="padding: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Your trial will end on <strong>{{ \Carbon\Carbon::parse($array['trial_end'])->format('F j, Y') }}</strong>. <br>
                    After this date, you will be automatically charged <strong>{{ number_format($array['amount'], 2) }} {{ strtoupper($array['currency']) }}</strong> using your default payment method.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    To avoid this charge, make sure to cancel your subscription before the trial ends.
                </td>
            </tr>
            @endif
        </table>
    </td>
</tr>
@endsection
