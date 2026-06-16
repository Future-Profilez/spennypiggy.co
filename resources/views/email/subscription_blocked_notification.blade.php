@extends('email.default-2')

@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🚫
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    Payment Alert — Subscription Required
                </td>
            </tr>

            {{-- Body --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 8px 0;text-align:center;">
                    Hi <strong style="color:#1A1A1A;">{{ ucwords($creator->name) }}</strong>! 👋
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    Someone just tried to pay you @if($paymentAmount)<strong style="color:#8C52FF;">£{{ number_format($paymentAmount, 2) }}</strong>@endif, but the payment couldn't be completed because your creator subscription is not active.
                </td>
            </tr>

            {{-- Requirement card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#c53030;font-weight:700;padding:0 0 4px 0;">
                                            ⚠️ Active Subscription Required
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;line-height:20px;">
                                            You need an <strong style="color:#1A1A1A;">active creator subscription</strong> to receive payments from supporters.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Quick way heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:17px;color:#1A1A1A;
                           line-height:24px;padding:0 0 14px 0;text-align:center;">
                    🚀 Get Back Online in Minutes
                </td>
            </tr>

            @if($subscriptionData['status'] === 'trial_active' && isset($subscriptionData['action_required']))
            {{-- Action: Update Payment Method --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:14px;-webkit-border-radius:14px;">
                        <tr>
                            <td style="padding:14px 18px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td valign="middle">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;color:#1A1A1A;font-size:15px;">⏰ Update Payment Method</div>
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8C52FF;font-weight:600;">Trial ending soon</div>
                                        </td>
                                        <td align="right" valign="middle">
                                            <a href="{{ env('APP_URL') . '/subscription/manage' }}"
                                                style="display:inline-block;font-family:'Outfit',Arial,sans-serif;background:#FF007F;color:#ffffff;padding:8px 18px;border-radius:50px;text-decoration:none;font-size:13px;font-weight:700;">Update Now →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @else
            {{-- Action: Reactivate Subscription --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:14px;-webkit-border-radius:14px;">
                        <tr>
                            <td style="padding:14px 18px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td valign="middle">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;color:#1A1A1A;font-size:15px;">🔄 Reactivate Subscription</div>
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8C52FF;font-weight:600;">3 minutes</div>
                                        </td>
                                        <td align="right" valign="middle">
                                            <a href="{{ env('APP_URL') . '/subscription/manage' }}"
                                                style="display:inline-block;font-family:'Outfit',Arial,sans-serif;background:#FF007F;color:#ffffff;padding:8px 18px;border-radius:50px;text-decoration:none;font-size:13px;font-weight:700;">Reactivate →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Good news note --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 18px 0;text-align:center;">
                    💡 <strong style="color:#1A1A1A;">Good news:</strong> Once your subscription is active, payments will automatically resume and you won't miss any future opportunities!
                </td>
            </tr>

            {{-- Closing --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:16px;color:#1A1A1A;
                           line-height:22px;padding:0 0 6px 0;text-align:center;">
                    Don't let your supporters down!
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 16px 0;text-align:center;">
                    Your fans are eager to support your amazing work 💖
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:13px;color:#999999;
                           line-height:20px;padding:0 0 14px 0;text-align:center;">
                    Need help? Reply to this email or contact our support team.<br>
                    We're here to help you succeed! ✨
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;
                           line-height:20px;padding:0 0 12px 0;text-align:center;">
                    Keep creating! 🎨<br>
                    <span style="color:#8C52FF;">The Spenny Piggy Team</span>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
