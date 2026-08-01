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
        'text' => 'Subscription Starting Soon',
        'desc' => 'Your subscription is about to start ⏳',
        'body' => 'Your subscription is about to start. If you don’t cancel, it will begin automatically and you will be charged.',
    ],
    'start' => [
        'text' => 'Started',
        'desc' => '🎉 You’ve successfully started your subscription!',
        'body' => 'Get ready to access all premium features 🚀 — no limits, no restrictions! Enjoy exclusive access, priority support, and the full Spenny Piggy experience 🐷💎. We’re thrilled to have you on board. Let the fun begin!',
    ]
];

$status = $messages[$type] ?? ['text' => 'Status', 'desc' => 'was updated', 'body' => 'Your subscription status has changed.'];

$badgeEmoji = [
    'renew' => '🔄',
    'failed' => '⚠️',
    'cancelled' => '🛑',
    'trial' => '⏳',
    'start' => '🎉',
][$type] ?? '🔄';
@endphp

<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Status emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                {{ $badgeEmoji }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 6px 0;text-align:center;">
                    Hello {{ ucwords($array['name'] ?? 'there') }}!
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    <strong style="color:#8C52FF;">{{ $status['desc'] }}</strong>
                </td>
            </tr>

            @if($type == 'renew' && isset($array['trial_end']))
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 4px 0;">📅 Renewed On</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 4px 0;">{{ \Carbon\Carbon::parse($array['renew_on'])->format('F j, Y') }}</td>
                                    </tr>
                                </table>

                                {{-- Divider --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td height="1" bgcolor="#FFD6E8" style="height:1px;line-height:1px;font-size:1px;background-color:#FFD6E8;padding:0;">&nbsp;</td>
                                    </tr>
                                </table>

                                {{-- Amount --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;font-weight:600;padding:12px 0 0 0;">💰 Amount Charged</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:24px;color:#FF007F;font-weight:800;padding:12px 0 0 0;">{{ number_format($array['amount'], 2) }} {{ strtoupper($array['currency']) }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 18px 0;text-align:center;">
                    Thank you for continuing your journey with Spenny Piggy! 🐷 Your subscription keeps all your premium features active without interruption.
                </td>
            </tr>
            @if(!empty($rewardItem))
            <tr>
                <td style="padding:0 0 22px 0;">
                    {{-- The renewal charge buys the same reward as the first purchase —
                         the receipt must say what the supporter is paying for. --}}
                    @include('email.reward-block', ['rewardItem' => $rewardItem, 'rewardShowFile' => true])
                </td>
            </tr>
            @endif
            <tr>
                <td style="padding:0 0 22px 0;">
                    @include('email.digital-content-notice')
                </td>
            </tr>
            @endif

            @if($type == 'trial' && isset($array['trial_end']))
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 4px 0;">⏳ Starts</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 4px 0;">{{ \Carbon\Carbon::parse($array['trial_end'])->format('F j, Y') }}</td>
                                    </tr>
                                </table>

                                {{-- Divider --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td height="1" bgcolor="#FFD6E8" style="height:1px;line-height:1px;font-size:1px;background-color:#FFD6E8;padding:0;">&nbsp;</td>
                                    </tr>
                                </table>

                                {{-- Amount --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;font-weight:600;padding:12px 0 0 0;">💰 Then Charged</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:24px;color:#FF007F;font-weight:800;padding:12px 0 0 0;">{{ number_format($array['amount'], 2) }} {{ strtoupper($array['currency']) }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    To avoid charges, cancel your subscription before the trial ends.
                </td>
            </tr>
            @endif

            @if(!in_array($type, ['renew', 'trial']))
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    {{ $status['body'] }}
                </td>
            </tr>
            @endif

            {{-- Gradient CTA button --}}
            <tr>
                <td align="center" style="padding:0 0 12px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ env('APP_URL') }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Manage My Subscription →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
