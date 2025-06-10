@extends('email.default-2')

@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') }}">
            <img alt="Logo" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 320px; text-align: center;">
            <tr>
                <td style="font-family: Arial; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0;">
                    <span style="color: #DC3545">Action Required: Recreate Your Products</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 18px; line-height: 27px; color: #141414;">
                    Hi {{ ucfirst(strtolower($user->name)) }},
                    <br><br>
                    We’ve recently updated our backend systems to improve performance and ensure tighter integration with Stripe.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 16px; line-height: 24px; color: #4D4D4D;">
                    As part of this upgrade, all previously created products and related Stripe entries have been permanently deleted from our database. Any existing subscriptions linked to those products will also be cancelled accordingly.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 16px; line-height: 24px; color: #4D4D4D;">
                    To continue using Spenny Piggy and offer your content or services, please recreate your products using the new system via your dashboard.
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0 30px 0;" align="center">
                    <a href="{{ env('APP_URL') }}/login" style="border-radius:30px;padding:13px 30px 13px 30px;width:210px;text-decoration:none;border:none;background-color:#f94f97;font-weight:bold;font-size:15px;text-align:center;color:#ffffff">
                        Recreate Now
                    </a>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 14px; line-height: 22px; color: #4D4D4D;">
                    If you have any questions or need assistance, our support team is here to help. We appreciate your understanding and continued support as we work to improve your experience.
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
