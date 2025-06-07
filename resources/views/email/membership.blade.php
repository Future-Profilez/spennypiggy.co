@extends('email.default-2')
@section('content')
<tr>
               <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt=""
                           width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
         </tr>
         <tr>
               <td align="center" style="padding:10px 10px 20px 10px;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="max-width: 296px; width: 100%; text-align: center;">
                     <tr>
                           <td style=" font-weight: bold; font-size: 18px; color:#000; line-height: 26px; padding: 0 0 25px 0; text-align: center;">
                              {{ $mem->anonymous == 1 ? 'Someone' : ucfirst($mem->user->name) }} subscribed to your <span style="color: #8C52FF"> {{ ucwords(str_replace('_',' ',$mem->membership->level)) }} </span> Membership of {{ $amountWithCurr }} on Spenny Piggy 🐷🎁!
                           </td>
                     </tr>
         
                     <tr>
                           <td style=" font-weight: normal; font-size: 14px; color:#4D4D4D; text-align: center; line-height: 20px; padding-bottom: 25px;">
                              {{ $mem->anonymous == 1 ? 'Someone' : ucfirst($mem->user->name) }} has just bought a new membership for you.
                              <a href="{{ env('APP_URL') . '/' . $mem->user->username }}" style="color: #8C52FF; text-decoration: underline;">
                                 Send them a message
                              </a> and say thanks!
                           </td>
                     </tr>
         
                     <tr>
                           <td style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; color: #4D4D4D; text-align: center; line-height: 18px;">
                              Go to <a href="{{ env('APP_URL') . '/wish-tracker' }}">Spenny Piggy</a> to manage your current Memberships.</td>
                     </tr>
                     <tr style="line-height: 10px; height: 10px;"><td></td></tr>
         
                     <tr>
                           <td style="padding:0 0 10px 0; text-align: center;">
                              <a href="{{ env('APP_URL') . '/wish-tracker' }}" style="border-radius:30px;padding: 13px 25px 13px 25px;border:none;background-color:#f94f97;font-family:Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;text-decoration: none;">My Account.</a>
                           </td>
                     </tr>
                     <tr style="line-height: 10px; height: 10px;"><td></td></tr>

                  </table>
               </td>
         </tr>
@endsection
