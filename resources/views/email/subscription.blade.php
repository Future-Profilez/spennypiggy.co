@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;"><a href="https://spennypiggy.co"><img alt="image"
                    width="119" src="https://whoyouinto.com/emails/user/logo.png" style="border:none"></a></td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width: 296px; width: 100%; text-align: center;">
                <tr>
                    <td
                        style="font-family: Arial; font-weight: bold; font-size: 18px; color:#000; line-height: 26px; padding: 0 0 25px 0; text-align: center;">
                        {{ $data->user->name }} subscribed you for your wish <span
                            style="color: #8C52FF">{{ $data->wish_item->wishname }}</span> on <br> Spenny Piggy 🎁
                    </td>
                </tr>

                {{-- <tr>
            <td style=" padding: 0 0 25px 0; text-align: center;"><img src="giftimg.png" alt="img"></td>
         </tr> --}}


                {{-- <tr>
            <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold; font-size: 13px; color: 141414; text-align: left; line-height: 18px; text-align: center;">Someone granted you a <span style="color:#F94F97 ">Wish</span> 🤩</td>
         </tr> --}}

                <tr>
                    <td
                        style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 10px; color: #4D4D4D; text-align: center; line-height: 18px;">
                        Go to <a href="#">Spenny Piggy</a> where you can see your pending payments for wish
                        subscriptions.</td>
                </tr>

                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href="{{ env('APP_URL') . '/' . $data->wish_item->user->name }}"
                            style="border-radius:30px;padding:13px 10px 13px 10px; width: 210px; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 10px; text-align: center; color:#ffffff; cursor: pointer;">See
                            your pending payment</a>
                    </td>
                </tr>
                {{-- <br><br>

                <tr>
                    <td
                        style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                        To cancel the subscription click on the link below.</td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                        <b>Cancel :~ <a href={{ env('APP_URL') . '/cancel-subs/' . $data->uuid }}>
                                Click Here</a></b>
                    </td>
                </tr> --}}

            </table>
        </td>
    </tr>
@endsection
