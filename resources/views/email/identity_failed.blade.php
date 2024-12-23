@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') }}">
            <img alt="Logo" width="119" src="https://ucarecdn.com/8df7911e-6a62-4bb4-967c-9ec0fda23c16/spennyPiggyMailLogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; text-align: center;">
            <tr>
                <td style="font-family: Arial; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                    <span style="color: #DC3545">Identity Verification Failed</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                    Hello {{ ucfirst(strtolower($user->name)) }}, <br><br>
                    Unfortunately, your identity verification failed. Please review the details you submitted and try again.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 25px 0; font-family: Arial; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: left;">
                    If you believe this is an error, contact our support team for assistance.
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
