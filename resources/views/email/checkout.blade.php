@extends('email.default-2')
@section('content')
{{ Log::info("come in checkout blade file") }}

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
                        style="font-family: Arial; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                        New <span style="color: #8C52FF">Wish Granted</span> on <br> Spenny Piggy 🎁 </td>
                </tr>
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;"><img
                            src="https://ucarecdn.com/4e45b4c3-8538-496f-8873-b5fd53115c50/giftimg.png" alt="img"></td>
                </tr>
                <tr>
                    @if ($data->wish_item_id == null)
                        <td
                            style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                            Lucky you! <br></br>
                            @if ($data->payment->anonymous == 0)
                                {{ $anon == false ? $data->cart->user->name : $anonname }} just granted you a surprise gift on Spenny Piggy for {{ $symbol }}{{ $data->amount }} 🎁🥳 .
                            @else
                                Anonymous user just granted you a surprise gift on Spenny Piggy for {{ $symbol }}{{ $data->amount }} 🎁🥳 .
                            @endif
                            <!-- {{ $anon == false ? $data->cart->user->name : $anonname }} granted you a surprise gift of
                            £{{ $data->amount }}🤩. -->
                        </td>
                    @else
                        <td
                            style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                            <!-- {{ $anon == false ? $data->cart->user->name : $anonname }} granted you a Wish on <span
                                style="color:#F94F97 ">{{ $data->wish->wishname ?? '' }}</span> of £{{ $data->amount }}🤩.
                         -->
                            Lucky you! <br></br>
                            @if ($data->payment->anonymous == 0)
                                {{ $anon == false ? $data->cart->user->name : $anonname }} just granted your wish {{ $data->wish->wishname ?? 'surprise gift' }} on Spenny Piggy for {{ $symbol }}{{ $data->amount }} 🎁🥳 .
                            @else
                                Anonymous user just granted your wish {{ $data->wish->wishname ?? 'surprise gift' }} on Spenny Piggy for {{ $symbol }}{{ $data->amount }} 🎁🥳 .
                            @endif

                            </td>
                    @endif
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                        Go to <a href="https://spennypiggy.co">Spenny Piggy</a> where you can see your granted wish, send a message to
                        your gifter and share your gift on social media </td>
                </tr>
                @if (!empty($messages))
                    <tr>
                        <td
                            style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                            <b>Message :~ </b>{{ $messages ?? '' }}
                        </td>
                    </tr>
                @endif
                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href={{ env('APP_URL') . '/wish-tracker' }}
                            style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">See
                            your granted wish</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
