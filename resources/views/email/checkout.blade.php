@extends('email.default-2')
@section('content')

<tr>
         <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt="image"
                     width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
     </tr>
     <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; width: 100%; margin: 0 auto; text-align: center;">
                <tr>
                    <td style="font-family: Arial, sans-serif; font-weight: bold; font-size: 24px; color: #000000; line-height: 32px; padding: 0 0 25px 0; text-align: center;" align="center">
                        New <span style="color: #8C52FF">Wish Granted</span> on <br> Spenny Piggy 🎁 
                    </td>
                </tr>
                 <tr>
                     <td style="line-height:20px;height:20px;"></td>
                 </tr>
                 <tr>
                     <td style=" padding: 0 0 25px 0; text-align: center;"><img src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" style="max-width: 200px;" alt="img"></td>
                 </tr>
                 <tr>
                     @if ($data->wish_item_id == null)
                     <td
                         style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        <span style="color:#F94F97; font-weight: bold;">Lucky you!</span><br><br>
                        @if ($data->payment->anonymous == 0)
                        <strong>{{ $anon == false ? ucwords($data->cart->user->name) : ucwords($anonname) }}</strong> just granted you a surprise gift on Spenny Piggy for <span style="color:#8C52FF; font-weight: bold;">{{ $symbol }}{{ number_format($data->amount, 2) }}</span> 🎁🥳
                        @else
                        An <strong>anonymous user</strong> just granted you a surprise gift on Spenny Piggy for <span style="color:#8C52FF; font-weight: bold;">{{ $symbol }}{{ number_format($data->amount, 2) }}</span> 🎁🥳
                        @endif
                     </td>
                     @else
                     <td
                         style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        <span style="color:#F94F97; font-weight: bold;">Lucky you!</span><br><br>
                        @if ($data->payment->anonymous == 0)
                        <strong>{{ $anon == false ? ucwords($data->cart->user->name) : ucwords($anonname) }}</strong> just granted your wish <em>"{{ $data->wish->wishname ?? 'surprise gift' }}"</em> on Spenny Piggy for <span style="color:#8C52FF; font-weight: bold;">{{ $symbol }}{{ number_format($data->amount, 2) }}</span> 🎁🥳
                        @else
                        An <strong>anonymous user</strong> just granted your wish <em>"{{ $data->wish->wishname ?? 'surprise gift' }}"</em> on Spenny Piggy for <span style="color:#8C52FF; font-weight: bold;">{{ $symbol }}{{ number_format($data->amount, 2) }}</span> 🎁🥳
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
                         <a href={{ env('APP_URL') . '/history' }}
                             style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">See
                             your granted wish</a>
                     </td>
                 </tr>
             </table>
         </td>
     </tr>
@endsection
