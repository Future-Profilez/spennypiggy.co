@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img alt="" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 420px; width: 100%; text-align: center;">
            <tr>
                <td style="font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 16px 0;">
                    Payout on the way, <span style="color: #8C52FF">{{ ucwords($creator->name) }}</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 18px 0; font-size: 14px; line-height: 22px; color: #4D4D4D;">
                    Your {{ $label }} has been initiated and is being processed by Stripe.
                </td>
            </tr>

            <tr>
                <td style="padding: 18px; background: linear-gradient(135deg, #8C52FF 0%, #FF007F 100%); border-radius: 12px;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td style="color: white; font-weight: bold; font-size: 14px; text-align: center; padding-bottom: 8px;">
                                {{ $label }} Amount
                            </td>
                        </tr>
                        <tr>
                            <td style="color: white; font-weight: bold; font-size: 34px; text-align: center; padding-bottom: 6px;">
                                {{ strtoupper($currency) }} {{ number_format((float) $amount, 2) }}
                            </td>
                        </tr>
                        @if(!empty($periodLabel))
                        <tr>
                            <td style="color: rgba(255,255,255,0.95); font-size: 13px; text-align: center;">
                                Period: {{ $periodLabel }}
                            </td>
                        </tr>
                        @endif
                        @if(!empty($arrivalDate))
                        <tr>
                            <td style="color: rgba(255,255,255,0.95); font-size: 13px; text-align: center; padding-top: 6px;">
                                Expected arrival: {{ $arrivalDate }}
                            </td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>

            <tr style="line-height: 16px; height: 16px;">
                <td></td>
            </tr>

            <tr>
                <td style="padding:0 0 16px 0; text-align: center;">
                    <a href="{{ config('app.url') }}/creator/financial/dashboard" style="border-radius:30px;padding:13px 30px 13px 30px; width: 220px; text-decoration:none; border:none;background-color: #FF007F; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                        View Payout Status
                    </a>
                </td>
            </tr>

            <tr>
                <td style="padding: 0 0 14px 0; font-size: 13px; line-height: 20px; color: #666666; text-align: center;">
                    You can track this payout in your Payout History. If it fails, you’ll see the reason and we’ll notify you.
                </td>
            </tr>

            <tr>
                <td style="padding: 10px 0 15px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Best regards,<br><strong>The SpennyPiggy Team</strong>
                </td>
            </tr>

            <tr>
                <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 12px; line-height: 18px; color: #666666; text-align: center;">
                    Questions? Reply to this email or contact us at <a href="mailto:support@spennypiggy.co" style="color:#FF007F; text-decoration:none;">support@spennypiggy.co</a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection

