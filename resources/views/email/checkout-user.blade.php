@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width: 296px; width: 100%; text-align: center;">
                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;"><img src="https://whoyouinto.com/emails/user/giftimg.png" alt="img"></td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                            <span style="color:#F94F97 ">
                            Thankyou for granted a wish of {{ $data->owner->name }} on  Spenny Piggy of amount £{{ $data->amount_subtotal }} 🎁 
                            </span>
                    </td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                        Go to <a href="spennypiggy.co">Spenny Piggy</a> where you can see your granted wish, send a message to
                        your gifter and share your gift on social media </td>
                </tr>
                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href={{ env('APP_URL') . '/' . $data->user->username }}
                            style="padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">See
                            your granted wish</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
