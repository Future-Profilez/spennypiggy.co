@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt=""
                width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0"
            style="max-width: 400px; width: 100%; text-align: center;">
            <tr>
                <td style="font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                    🎉 Congratulations, <span style="color: #8C52FF">{{ ucwords($creator->name) }}</span>! 🐷
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; text-align: center;">
                    <img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="Founder Achievement">
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                    You're now officially a <strong style="color:#8C52FF;">SpennyPiggy Founder!</strong><br><br>
                    Your exceptional performance has earned you a place among our most successful creators.
                </td>
            </tr>

            <!-- Achievement Highlight -->
            <tr>
                <td style="padding: 20px; background: linear-gradient(135deg, #8C52FF 0%, #F94F97 100%); border-radius: 10px; margin: 20px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td style="color: white; font-weight: bold; font-size: 18px; text-align: center; padding-bottom: 10px;">
                                Your First 30-Day Achievement
                            </td>
                        </tr>
                        <tr>
                            <td style="color: white; font-weight: bold; font-size: 32px; text-align: center; padding-bottom: 10px;">
                                £{{ number_format($first30DayEarnings, 2) }}
                            </td>
                        </tr>
                        <tr>
                            <td style="color: white; font-size: 14px; text-align: center;">
                                You've earned this incredible amount in your first 30 days on the platform!
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0 15px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    We're thrilled to welcome you to our exclusive Founder Program.
                </td>
            </tr>

            <!-- Benefits Section -->
            <tr>
                <td style="padding: 20px; background: #FBF0F5; border-radius: 10px; margin: 20px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td style="font-weight: bold; font-size: 16px; color: #8C52FF; text-align: center; padding-bottom: 15px;">
                                🌟 Your Founder Benefits
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #4D4D4D;">
                                💰 <strong>Monthly Bonus:</strong> Earn 10% extra on your monthly earnings (£100-£1000 range)
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #4D4D4D;">
                                👑 <strong>Founder Badge:</strong> Special recognition on your profile
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #4D4D4D;">
                                🎯 <strong>Priority Support:</strong> Direct access to our team
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-size: 14px; color: #4D4D4D;">
                                📊 <strong>Advanced Analytics:</strong> Detailed insights into your performance
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr style="line-height: 20px; height: 20px;"><td></td></tr>

            <tr>
                <td style="padding:0 0 20px 0; text-align: center;">
                    <a href="{{ config('app.url') }}/founder/bonus" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">View Your Founder Dashboard</a>
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0 15px 0; font-weight: bold; font-size: 16px; color: #141414; text-align: center;">
                    What happens next?
                </td>
            </tr>

            <tr>
                <td style="padding: 0 0 15px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: left;">
                    • Your founder badge will appear on your profile within 24 hours<br>
                    • Monthly bonuses will be calculated automatically on the 7th of each month<br>
                    • Payouts are processed via Stripe to your connected account<br>
                    • You'll receive detailed monthly reports of your bonus earnings
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0 15px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Keep up the amazing work! We're excited to see what you'll achieve as a SpennyPiggy Founder.
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0 15px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Best regards,<br><strong>The SpennyPiggy Team</strong>
                </td>
            </tr>

            <tr>
                <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 12px; line-height: 18px; color: #666666; text-align: center;">
                    Questions? Reply to this email or contact us at <a href="mailto:support@spennypiggy.co" style="color:#F94F97; text-decoration:none;">support@spennypiggy.co</a>
                </td>
            </tr>

            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
        </table>
    </td>
</tr>
@endsection