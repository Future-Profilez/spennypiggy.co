@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width: 420px; width: 100%; text-align: center;">
                 <tr>
                     <td style=" padding: 0 0 25px 0; text-align: center;"><img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img"></td>
                 </tr>
                 <tr>
                     <td
                         style="padding: 0 0 15px 0;  font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                         <span style="color:#FF007F ">
                             {{ $pay->payment->owner->name ?? "Creator" }} is sending an thank you message to {$pay->payment->user->name ?? "User"}. Please take action on it.
                         </span>
                     </td>
                 </tr>
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>
                 <tr>
                     <td style="padding:0 0 10px 0; text-align: center;">
                         <a href="https://admin.spennypiggy.co/thank-you-messages/"
                             style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F;  font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">See Thankyou Message</a>
                     </td>
                 </tr>
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>

             </table>
         </td>
     </tr>
@endsection
