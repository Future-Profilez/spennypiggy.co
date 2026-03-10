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
                    <td style="font-weight: bold; font-size: 24px; color: #f6993f; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                        Account Warning
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 16px; line-height: 24px; color: #141414; text-align: left;">
                        Hello {{ $user->name }},
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: left;">
                        Your account metrics have flagged a potential issue (Refund Rate: {{ number_format($metric->refund_rate_30d * 100, 1) }}%).
                    </td>
                </tr>

                <!-- Alert Box -->
                <tr>
                    <td style="padding: 15px; background-color: #fffdf5; border: 1px solid #ffc107; border-radius: 8px; text-align: left;">
                        <strong style="color: #856404; font-size: 15px;">Account Status: Medium Risk</strong><br>
                        <span style="font-size: 13px; color: #856404;">
                            A {{ $metric->reserve_percent }}% rolling reserve has been temporarily applied.
                        </span>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 15px 0 15px 0; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: left;">
                        This is a precautionary measure. Reserves are released automatically after 90 days.
                    </td>
                </tr>

                <tr>
                    <td style="padding: 20px 0 20px 0; text-align: center;">
                        <a href="{{ url('/dashboard') }}" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #f6993f; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">View Dashboard</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
