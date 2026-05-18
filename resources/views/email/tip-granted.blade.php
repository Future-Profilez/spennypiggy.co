@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img  width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
     </tr>
     <tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width: 296px; width: 100%; text-align: center;">
                 <!-- <tr>
                     <td
                         style=" font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                         Support <span style="color: #8C52FF">Top Up!</span>💸💰 </td>
                 </tr> -->
                 <tr>
                     <td style="line-height:20px;height:20px;"></td>
                 </tr>
 
                 <tr>
                     <td style=" padding: 0 0 25px 0; text-align: center;"><img
                             style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img"></td>
                 </tr>
                 <tr>
 
                     <td style="padding: 0 0 15px 0;  font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        Thanks for supporting {{ ucwords($tip->creator->name) }}'s Tip Jar with <strong style="color:#8C52FF;">{{ $symbol }}{{ number_format($amount, 2) }}</strong>!<br><br>You've just made their day a little brighter 😍🎁
                    </td>
                 </tr>
                 <tr>
                     <td
                         style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                         Visit <a href="{{ env('APP_URL') . '/' }}" style="color:#FF007F; text-decoration:none;">Spenny Piggy</a> to discover more creators' wishes to fulfill! Check out their profiles, intros, memberships, and more.
                 </tr>
                 @if (!empty($tip->message))
                     <tr>
                         <td
                             style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                             <b>Message :~ </b>{{ $tip->message ?? '' }}
                         </td>
                     </tr>
                 @endif

                 @if(isset($deliverable) && !empty($deliverable->deliverable_url))
                 <tr>
                     <td style="padding: 20px 0; border-top: 1px solid #eee;">
                         <h3 style="font-family: Arial; font-weight: bold; font-size: 18px; color: #FF007F; text-align: center; margin-bottom: 15px;">🎁 Your Supporter Rewards!</h3>
                         <p style="font-family: Arial; font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">As a thank you for your support, you now have access to exclusive content:</p>
                         
                         <div style="margin-bottom: 20px; padding: 15px; background-color: #fff4f8; border: 1px solid #f94f97; border-radius: 8px;">
                             <p style="font-family: Arial; font-size: 13px; color: #f94f97; margin: 0; line-height: 1.4;">
                                 <strong>Important Notice:</strong> By clicking the access links below, you acknowledge and agree that you are requesting immediate access to digital content. You further acknowledge that this will waive your statutory right to cancel this purchase once the download or streaming has started.
                             </p>
                         </div>
                         
                         <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF;">
                             <p style="font-family: Arial; font-size: 16px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Supporter Certificate</p>
                             <p style="font-family: Arial; font-size: 14px; color: #666; margin: 0 0 8px 0;">
                                 🏆 Official Certificate of Authenticity
                             </p>
                             @php
                                 $accessUrl = isset($deliverable->uuid) 
                                    ? route('deliverable.access', $deliverable->uuid) 
                                    : $deliverable->deliverable_url;
                             @endphp
                             <a href="{{ $accessUrl }}" 
                                style="display: inline-block; padding: 10px 20px; background-color: #8C52FF; color: white; text-decoration: none; border-radius: 25px; font-family: Arial; font-size: 14px; font-weight: bold;"
                                target="_blank">📜 View Certificate</a>
                         </div>
                     </td>
                 </tr>
                 @endif
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>
                 <tr>
                     <td style="padding:0 0 10px 0; text-align: center;">
                         <a href={{ env('APP_URL') . '/history' }}
                             style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F;  font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Show More Love</a>
                     </td>
                 </tr>
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>
             </table>
         </td>
     </tr>
@endsection
