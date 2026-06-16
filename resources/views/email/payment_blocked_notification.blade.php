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
                    Payment Alert
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
                    Someone just tried to pay you @if($paymentAmount)<strong style="color:#8C52FF;">£{{ number_format($paymentAmount, 2) }}</strong>@endif, but the payment couldn't be completed because your account needs more recent content.
                </td>
            </tr>

            {{-- Requirement + status card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">

                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td colspan="2" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#c53030;font-weight:700;padding:0 0 4px 0;">
                                            ⚠️ Content Activity Required
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;line-height:20px;padding:0 0 14px 0;">
                                            You need at least <strong style="color:#1A1A1A;">3 content items</strong> from the last 28 days to receive payments.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 4px 0;">
                                            📊 Current Status
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 4px 0;">
                                            {{ $activityData['content_count'] ?? 0 }}/3 items
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            ➕ Still Needed
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $activityData['needed'] ?? 3 }} more item{{ ($activityData['needed'] ?? 3) > 1 ? 's' : '' }}
                                        </td>
                                    </tr>
                                </table>

                                {{-- Divider --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td height="1" bgcolor="#FFD6E8" style="height:1px;line-height:1px;font-size:1px;background-color:#FFD6E8;padding:0;">&nbsp;</td>
                                    </tr>
                                </table>

                                {{-- Activity breakdown --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:12px 0 4px 0;">
                                            📝 Posts
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:12px 0 4px 0;">
                                            {{ $activityData['posts'] ?? 0 }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            ⭐ Wishes
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $activityData['wishes'] ?? 0 }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            🔁 Memberships
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $activityData['memberships'] ?? 0 }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 0 0;">
                                            🛍️ Shops
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:8px 0 0 0;">
                                            {{ $activityData['shops'] ?? 0 }}
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Quick ways heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:17px;color:#1A1A1A;
                           line-height:24px;padding:0 0 14px 0;text-align:center;">
                    🚀 Quick Ways to Get Back Online
                </td>
            </tr>

            {{-- Action: Add a Post --}}
            <tr>
                <td style="padding:0 0 10px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:14px;-webkit-border-radius:14px;">
                        <tr>
                            <td style="padding:14px 18px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td valign="middle">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;color:#1A1A1A;font-size:15px;">Add a Post</div>
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8C52FF;font-weight:600;">2 minutes</div>
                                        </td>
                                        <td align="right" valign="middle">
                                            <a href="{{ env('APP_URL') . '/' . $creator->username }}"
                                                style="display:inline-block;font-family:'Outfit',Arial,sans-serif;background:#FF007F;color:#ffffff;padding:8px 18px;border-radius:50px;text-decoration:none;font-size:13px;font-weight:700;">Start Now →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Action: Set Up Membership --}}
            <tr>
                <td style="padding:0 0 10px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:14px;-webkit-border-radius:14px;">
                        <tr>
                            <td style="padding:14px 18px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td valign="middle">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;color:#1A1A1A;font-size:15px;">Set Up Membership</div>
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8C52FF;font-weight:600;">10 minutes</div>
                                        </td>
                                        <td align="right" valign="middle">
                                            <a href="{{ env('APP_URL') . '/' . $creator->username }}"
                                                style="display:inline-block;font-family:'Outfit',Arial,sans-serif;background:#FF007F;color:#ffffff;padding:8px 18px;border-radius:50px;text-decoration:none;font-size:13px;font-weight:700;">Start Now →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Action: Add Shop Item --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:14px;-webkit-border-radius:14px;">
                        <tr>
                            <td style="padding:14px 18px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td valign="middle">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;color:#1A1A1A;font-size:15px;">Add Shop Item</div>
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8C52FF;font-weight:600;">7 minutes</div>
                                        </td>
                                        <td align="right" valign="middle">
                                            <a href="{{ env('APP_URL') . '/' . $creator->username }}"
                                                style="display:inline-block;font-family:'Outfit',Arial,sans-serif;background:#FF007F;color:#ffffff;padding:8px 18px;border-radius:50px;text-decoration:none;font-size:13px;font-weight:700;">Start Now →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Primary CTA --}}
            <tr>
                <td align="center" style="padding:0 0 10px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ env('APP_URL') . '/creator/activity' }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Check Activity →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Secondary CTA --}}
            <tr>
                <td align="center" style="padding:0 0 22px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#4a5568"
                                style="background-color:#4a5568;border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ env('APP_URL') . '/' . $creator->username }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    View My Profile →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Good news note --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 18px 0;text-align:center;">
                    💡 <strong style="color:#1A1A1A;">Good news:</strong> Once your content is approved (usually takes 1–2 hours), payments will automatically resume and you won't miss any future opportunities!
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
                    <span style="color:#8C52FF;">The SpennyPiggy Team</span>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
