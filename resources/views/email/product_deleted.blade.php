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
                    <span style="color: #DC3545">Important Update: Your Products Have Been Removed</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 18px; line-height: 27px; color: #141414;">
                    Hi {{ ucfirst(strtolower($user->name)) }},
                    <br><br>
                    We’ve recently made updates to our platform’s product and subscription policy to ensure better integration with Stripe and improved compliance.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 16px; line-height: 24px; color: #4D4D4D;">
                    As part of this change, all of your existing products linked with Stripe have been removed from Spenny Piggy and deactivated from Stripe. Any associated active subscriptions have also been scheduled for cancellation.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 16px; line-height: 24px; color: #4D4D4D;">
                    To continue offering content or services on Spenny Piggy, please create new products directly through our platform using the updated flow.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 14px; line-height: 22px; color: #4D4D4D;">
                    Thank you for being a part of the Spenny Piggy community. If you have any questions or need help setting up your new products, feel free to reach out to our support team.
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
