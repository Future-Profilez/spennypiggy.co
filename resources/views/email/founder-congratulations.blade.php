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
                                🏆
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
                    Congratulations, <span style="color:#8C52FF;">{{ ucwords($creator->name) }}</span>! 🐷
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 20px 0;text-align:center;">
                    You're now officially a <strong style="color:#8C52FF;">SpennyPiggy Founder!</strong> Your exceptional performance has earned you a place among our most successful creators.
                </td>
            </tr>

            {{-- Achievement image --}}
            <tr>
                <td align="center" style="padding:0 0 24px 0;text-align:center;">
                    <img style="max-width:180px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="Founder Achievement">
                </td>
            </tr>

            {{-- Achievement card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">

                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 4px 0;">
                                            🚀 First 30-day achievement
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 4px 0;">
                                            Founder
                                        </td>
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
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;font-weight:600;padding:12px 0 0 0;">
                                            💰 Earned in 30 days
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:24px;color:#FF007F;font-weight:800;padding:12px 0 0 0;">
                                            £{{ number_format($first30DayEarnings, 2) }}
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Welcome text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    We're thrilled to welcome you to our exclusive Founder Program. 🌟
                </td>
            </tr>

            {{-- Benefits card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:15px;color:#8C52FF;text-align:center;padding:0 0 14px 0;">
                                            🌟 Your Founder Benefits
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;line-height:20px;color:#666666;padding:6px 0;text-align:left;">
                                            💰 <strong style="color:#1A1A1A;">Monthly Bonus:</strong> Earn 10% extra when you earn £2,500+ in a month (capped monthly)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;line-height:20px;color:#666666;padding:6px 0;text-align:left;">
                                            👑 <strong style="color:#1A1A1A;">Founder Badge:</strong> Special recognition on your profile
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;line-height:20px;color:#666666;padding:6px 0;text-align:left;">
                                            🎯 <strong style="color:#1A1A1A;">Priority Support:</strong> Direct access to our team
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;line-height:20px;color:#666666;padding:6px 0;text-align:left;">
                                            📊 <strong style="color:#1A1A1A;">Advanced Analytics:</strong> Detailed insights into your performance
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Gradient CTA button --}}
            <tr>
                <td align="center" style="padding:0 0 24px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ config('app.url') }}/founder/bonus"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    View Your Founder Dashboard →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- What happens next --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:16px;color:#1A1A1A;
                           line-height:22px;padding:0 0 10px 0;text-align:center;">
                    What happens next?
                </td>
            </tr>
            <tr>
                <td align="left"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#666666;
                           line-height:22px;padding:0 0 22px 0;text-align:left;">
                    • Your founder badge will appear on your profile within 24 hours<br>
                    • Monthly bonuses will be calculated automatically on the 7th of each month<br>
                    • Payouts are processed via Stripe to your connected account<br>
                    • You'll receive detailed monthly reports of your bonus earnings
                </td>
            </tr>

            {{-- Closing --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    Keep up the amazing work! We're excited to see what you'll achieve as a SpennyPiggy Founder. ✨
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
