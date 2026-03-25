@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 380px; width: 100%; text-align: center;">
            <tr>
                <td style="padding: 0 0 20px 0; text-align: center;">
                    <img style="max-width: 220px; margin:20px 0;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img">
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 12px 0; font-family: Arial; font-weight: bold; font-size: 20px; line-height: 28px; color: #141414; text-align: center;">
                    Confirm Your Payment
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 18px 0; font-family: Arial; font-size: 14px; line-height: 22px; color: #141414; text-align: center;">
                    Use this one-time code to confirm your payment.
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 0 0 18px 0;">
                    <div style="display:inline-block; padding: 14px 20px; background:#FBF0F5; border:2px solid #F94F97; border-radius:12px; font-family: Arial; font-weight:bold; font-size: 22px; letter-spacing: 3px; color:#141414;">
                        {{ $otp }}
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 8px 0; font-family: Arial; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center;">
                    This code expires in 10 minutes.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 10px 0; font-family: Arial; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center;">
                    If you didn't request this, you can ignore this email.
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection

