@extends('email.default-2')
@section('content')
{{ Log::info("come in monthly-subs.blade.php file ") }}
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;"><a href="https://uk.spennypiggy.co/"><img alt="image"
                width="119" src="https://d36ape3u423eoo.cloudfront.net/1374cecd-53d6-4089-a20a-5b8812ee3d4d/build/assets/logo-164abf9b.png" style="border:none"></a></td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0"
            style="max-width: 296px; width: 100%; text-align: center;">
            <tr>
                <td style="font-family: Arial; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align:
                center;">
                    <span style="color: #8C52FF">Payment </span>{{ $sub->status }} on <br> Spenny Piggy 🎁
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style=" padding: 0 0 25px 0; text-align: center;"><img
                        src="https://whoyouinto.com/emails/user/giftimg.png" alt="img"></td>
            </tr>
            <tr>
                <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                    Hello {{ $sub->name }}! <br><br>
                    Your payment for monthly subscription is {{ $sub->status }} on Spenny Piggy.
                </td>
            </tr>
            <br>
        </table>
    </td>
</tr>
@endsection
