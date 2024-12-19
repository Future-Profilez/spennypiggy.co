@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt="image"
                    width="119" src="https://ucarecdn.com/8df7911e-6a62-4bb4-967c-9ec0fda23c16/spennyPiggyMailLogo.png" style="border:none"></a></td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width: 296px; width: 100%; text-align: center;">
                <tr>
                    <td
                        style="font-family:Arial;font-weight:bold;font-size: 21px;color:#000;line-height: 26px;padding:0 0 25px 0;text-align:center">
                        New <span style="color: #8C52FF">Shop Item</span> claimed on <br> Spenny Piggy 🎁 </td>
                </tr>
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;"><img
                            src="https://whoyouinto.com/emails/user/giftimg.png" alt="img"></td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        Lucky you! <br></br>
                        {{ $anon == false ? $data->name : "Anonymous User" }} just claimed {{ $data->shop->name }} on Spenny Piggy for {{ $symbol }}{{ $data->amount }} 🎁🥳 .
                        <!-- {{ $anon == false ? $data->cart->user->name : $anonname }} granted you a surprise gift of
                        £{{ $data->amount }}🤩. -->
                    </td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                        Go to <a href="https://spennypiggy.co">Spenny Piggy</a> where you can see your granted items, send a message to
                        your gifter and share your gift on social media </td>
                </tr>
                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href={{ env('APP_URL') . '/' }}
                            style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Go To Dashboard</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
