@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt="image"
                     width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
     </tr>
     <tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width: 296px; width: 100%; text-align: center;">
                 <tr>
                     <td
                         style=" font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                         Tip Jar <span style="color: #8C52FF">Top Up!</span>💸💰 </td>
                 </tr>
                 <tr>
                     <td style="line-height:20px;height:20px;"></td>
                 </tr>
 
                 <tr>
                     <td style=" padding: 0 0 25px 0; text-align: center;"><img
                           style="max-width: 200px;"  src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img"></td>
                 </tr>
                 <tr>
 
                     <td
                         style="padding: 0 0 15px 0;  font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                         You just received a new tip of {{ $symbol }}{{ $tip->amount }} towards your tip jar goal on Spenny Piggy!🤑🎉
                     </td>
                 </tr>
                 <tr>
                     <td
                         style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                         Go to <a href="spennypiggy.co">Spenny Piggy</a> where you can see your granted tip, send a message
                         to
                         your gifter and share your gift on social media </td>
                 </tr>
                 @if (!empty($tip->message))
                     <tr>
                         <td
                             style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                             <b>Message :~ </b>{{ $tip->message ?? '' }}
                         </td>
                     </tr>
                 @endif
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>
                 <tr>
                     <td style="padding:0 0 10px 0; text-align: center;">
                         <a href={{ env('APP_URL') . '/wish-tracker' }}
                             style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97;  font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">See
                             your granted wish</a>
                     </td>
                 </tr>
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>
             </table>
         </td>
     </tr>
@endsection
