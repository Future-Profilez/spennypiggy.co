@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none" alt="Spenny Piggy Logo">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; width: 100%; text-align: center;">
            <tr>
                <td style="font-family: Arial, sans-serif; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 18px 0; text-align: center;">
                    Your <span style="color:#8C52FF">Piggy Pot</span> contribution is confirmed ✅
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 22px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Thank you for supporting {{ $pay->creator?->name ?? 'this creator' }}.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:3px solid #000;border-radius:20px;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);">
                        <tr>
                            <td style="padding:16px;text-align:left;">
                                <div style="font-family: Arial; font-weight: 900; font-size: 14px; color:#000; text-transform:uppercase; margin-bottom:10px;">Payment Details</div>
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family: Arial; font-size: 14px;">
                                    <tr>
                                        <td style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:700;color:#555;">Piggy Pot</td>
                                        <td align="right" style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:900;color:#000;">{{ $pay->piggyPot?->title ?? 'Piggy Pot' }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:700;color:#555;">You Paid</td>
                                        <td align="right" style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:900;color:#000;">{{ $symbol }}{{ number_format((float) ($pay->total_paid ?? 0), 2) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;font-weight:700;color:#555;">Currency</td>
                                        <td align="right" style="padding:8px 0;font-weight:900;color:#000;">{{ strtoupper($pay->currency ?? 'GBP') }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            @php
                $rewardUrl = null;
                $rewardText = null;
                if (!empty($pay->piggyPot?->content_description)) {
                    $rewardText = $pay->piggyPot->content_description;
                }
                if (!empty($pay->piggyPot?->content_file)) {
                    $rewardUrl = $pay->piggyPot->content_file;
                    if (strpos($rewardUrl, 'http://') !== 0 && strpos($rewardUrl, 'https://') !== 0) {
                        $rewardUrl = 'https://ucarecdn.com/' . trim($rewardUrl, '/') . '/';
                    }
                }
            @endphp

            @if(!empty($rewardUrl))
            <tr>
                <td style="padding: 0 0 18px 0;">
                    @include('email.digital-content-notice')
                </td>
            </tr>
            @endif

            @if(!empty($rewardUrl) || !empty($rewardText))
            <tr>
                <td style="padding: 0 0 18px 0; text-align: left;">
                    <div style="background:#fff4f8;border:2px solid #FF007F;border-radius:18px;padding:14px;text-align:left;">
                        <div style="font-family: Arial; font-weight: 900; font-size: 13px; color:#FF007F; text-transform:uppercase; margin-bottom:8px;">Exclusive Reward</div>
                        @if(!empty($rewardText))
                            <div style="font-family: Arial; font-size: 13px; color:#141414; font-weight:700; margin-bottom:10px;">{{ $rewardText }}</div>
                        @endif
                        @if(!empty($rewardUrl))
                            <a href="{{ $rewardUrl }}" style="display:inline-block;border-radius:30px;padding:12px 22px;text-decoration:none;border:3px solid #000;background-color:#FF007F;font-family: Arial;font-weight:bold;font-size: 14px;text-align:center;color:#ffffff;cursor:pointer;" target="_blank">Access Reward</a>
                        @endif
                    </div>
                </td>
            </tr>
            @endif

            @if(!empty($thankYouUrl))
            <tr>
                <td style="padding:0 0 12px 0; text-align: center;">
                    <a href="{{ $thankYouUrl }}" style="border-radius:30px;padding:13px 30px;text-decoration:none;border:3px solid #000;background-color:#ffffff;font-family: Arial;font-weight:bold;font-size: 14px;text-align:center;color:#141414;cursor:pointer;" target="_blank">Open Thank You Page</a>
                </td>
            </tr>
            @endif

            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/' . ($pay->creator?->username ?? '') }}" style="border-radius:30px;padding:13px 30px;text-decoration:none;border:3px solid #000;background-color:#FF007F;font-family: Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;cursor:pointer;">View Creator Profile</a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
