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
                         You have successfully subscribed <span style="color: #8C52FF">{{ $mem->membership->user->name }}</span> {{ $mem->membership->level }} Membership of amount {{ $amountWithcurrency }} on Spenny Piggy 🐷🎁!
                     </td>
                 </tr>
     
                 <tr>
                     <td style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; color: #4D4D4D; text-align: center; line-height: 18px;">
                         Go to <a href="{{ env('APP_URL') . '/history' }}">Spenny Piggy</a> to manage your current Memberships.</td>
                 </tr>

                 <tr>
                     <td style="padding: 20px 0; border-top: 1px solid #eee;">
                         <h3 style="font-family: Arial; font-weight: bold; font-size: 18px; color: #F94F97; text-align: center; margin-bottom: 15px;">💎 Welcome to the Inner Circle!</h3>
                         <p style="font-family: Arial; font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">Your membership is now active. You have unlocked exclusive access to:</p>
                         
                         <div style="margin-bottom: 20px; padding: 15px; background-color: #fff4f8; border: 1px solid #f94f97; border-radius: 8px;">
                             <p style="font-family: Arial; font-size: 13px; color: #f94f97; margin: 0; line-height: 1.4;">
                                 <strong>Important Notice:</strong> By clicking the access links below, you acknowledge and agree that you are requesting immediate access to digital content and membership benefits. You further acknowledge that this will waive your statutory right to cancel this purchase once the access has started.
                             </p>
                         </div>
                         
                         <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF; text-align: left;">
                             <p style="font-family: Arial; font-size: 16px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Membership Benefits</p>
                            <p style="font-family: Arial; font-size: 14px; color: #666; margin-bottom: 10px;">You can now access members-only posts of {{ $mem->membership->user->name }}.</p>
                            <ul style="font-family: Arial; font-size: 14px; color: #666; margin: 0 0 15px 0; padding-left: 20px;">
                                 <li>Exclusive Member-Only Posts</li>
                                 <li>Special Intro Videos</li>
                                 <li>Direct Support to {{ $mem->membership->user->name }}</li>
                             </ul>
                             <div style="text-align: center;">
                                 @php
                                     $accessUrl = isset($deliverable->uuid) 
                                        ? route('deliverable.access', $deliverable->uuid) 
                                        : env('APP_URL') . '/' . $mem->membership->user->username;
                                 @endphp
                                 <a href="{{ $accessUrl }}" 
                                    style="display: inline-block; padding: 10px 20px; background-color: #8C52FF; color: white; text-decoration: none; border-radius: 25px; font-family: Arial; font-size: 14px; font-weight: bold;"
                                    target="_blank">🔓 Access Creator Profile</a>
                             </div>
                         </div>
                     </td>
                 </tr>
                 <tr style="line-height: 20px; height: 20px;" ><td></td></tr>
                 <tr>
                     <td style="padding:0 0 10px 0; text-align: center; ">
                         <a href="{{ env('APP_URL') . '/history' }}" style=" border-radius:30px;padding: 13px 25px 13px 25px;border:none;background-color:#f94f97;font-family:Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;text-decoration: none;">My Account.</a>
                     </td>
                 </tr>
                 <tr style="line-height: 20px; height: 20px;" ><td></td></tr>
             </table>
         </td>
     </tr>
@endsection
