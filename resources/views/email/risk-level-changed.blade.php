@extends('email.default-2')
@section('content')
    @php
        $riskColor = match($metric->risk_level) {
            'high' => '#e3342f',
            'medium' => '#f6993f',
            'low' => '#38c172',
            default => '#F94F97',
        };
    @endphp

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
                    <td style="font-weight: bold; font-size: 24px; color: {{ $riskColor }}; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                        Account Status Update
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 16px; line-height: 24px; color: #141414; text-align: left;">
                        Hello {{ ucwords($user->name) }},
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: left;">
                        {{ $messageBody }}
                    </td>
                </tr>

                <!-- Status Box -->
                <tr>
                    <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid {{ $riskColor }}; text-align: left;">
                        <strong style="color: {{ $riskColor }}; font-size: 15px;">Current Status: {{ ucfirst($metric->risk_level) }} Risk</strong><br>
                        <span style="font-size: 13px; color: #4D4D4D;">
                            @if($metric->risk_level === 'low')
                                Your account is in good standing. No additional reserves are being held.
                            @else
                                A temporary rolling reserve has been applied to your account to cover potential disputes or refunds.
                            @endif
                        </span>
                    </td>
                </tr>

                <!-- Details Table -->
                <tr>
                    <td style="padding: 20px 0 0 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px;"><strong>Reserve Rate:</strong></td>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px; text-align: right;">{{ $metric->reserve_percent }}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px;"><strong>Payout Delay:</strong></td>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px; text-align: right;">{{ $metric->payout_delay_days }} Days</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px;"><strong>Dispute Rate (30d):</strong></td>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px; text-align: right;">{{ number_format($metric->dispute_rate_30d * 100, 1) }}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px;"><strong>Refund Rate (30d):</strong></td>
                                <td style="padding: 5px 0; border-bottom: 1px solid #eee; color: #4D4D4D; font-size: 14px; text-align: right;">{{ number_format($metric->refund_rate_30d * 100, 1) }}%</td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 20px 0 15px 0; font-size: 13px; line-height: 20px; color: #999; text-align: left;">
                        Rolling reserves are released automatically after 90 days if no disputes occur. You can continue to accept payments normally.
                    </td>
                </tr>

                <tr>
                    <td style="padding: 10px 0 20px 0; text-align: center;">
                        <a href="{{ url('/dashboard') }}" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: {{ $riskColor }}; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">View Dashboard</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
