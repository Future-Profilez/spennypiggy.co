@extends('email.default-2')
@section('content')
<tr>
               <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt=""
                           width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
         </tr>
         <tr>
               <td align="center" style="padding:10px 10px 20px 10px;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; width: 100%; margin: 0 auto; text-align: center;">
                     <tr>
                           <td style="font-family: Arial, sans-serif; font-weight: bold; font-size: 24px; color: #000000; line-height: 32px; padding: 0 0 25px 0; text-align: center;" align="center">
                              New <span style="color: #8C52FF">Membership!</span> 🎉🐷
                           </td>
                     </tr>
                     <tr>
                         <td style="line-height:20px;height:20px;"></td>
                     </tr>
                     <tr>
                         <td style="padding: 0 0 25px 0; text-align: center;">
                             <img style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="Membership Gift">
                         </td>
                     </tr>
                     <tr>
                           <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: #141414; text-align: center;">
                              <strong style="color:#8C52FF;">{{ $mem->anonymous == 1 ? 'Someone' : ucwords($mem->user->name) }}</strong> subscribed to your <strong style="color:#8C52FF;">{{ ucwords(str_replace('_',' ',$mem->membership->level)) }}</strong> Membership!<br><br>
                              They purchased it for <strong style="color:#8C52FF;">{{ $amountWithCurr }}</strong> on Spenny Piggy.
                           </td>
                     </tr>
         
                     <tr>
                           <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                              {{ $mem->anonymous == 1 ? 'Someone' : ucwords($mem->user->name) }} has just bought a new membership for you. <a href="{{ env('APP_URL') . '/' . $mem->user->username }}" style="color:#F94F97; text-decoration:none;">Send them a message</a> and say thanks!
                           </td>
                     </tr>
         
                     <tr>
                           <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                              Visit <a href="{{ env('APP_URL') . '/history' }}" style="color:#F94F97; text-decoration:none;">Spenny Piggy</a> to manage your current memberships.
                           </td>
                     </tr>
                     <tr style="line-height: 10px; height: 10px;"><td></td></tr>
         
                     <tr>
                           <td style="padding:0 0 10px 0; text-align: center;">
                              <a href="{{ env('APP_URL') . '/history' }}" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Manage Memberships</a>
                           </td>
                     </tr>
                     <tr style="line-height: 10px; height: 10px;"><td></td></tr>

                  </table>
               </td>
         </tr>
@endsection
