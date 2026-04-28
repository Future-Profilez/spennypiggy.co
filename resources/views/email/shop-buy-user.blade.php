@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width: 296px; width: 100%; text-align: center;">
                 <tr>
                     <td style=" padding: 0 0 25px 0; text-align: center;"><img  style="max-width: 200px;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img"></td>
                 </tr>
                 <tr>
                     <td
                         style="padding: 0 0 15px 0;  font-weight: bold;  font-size: 16px; line-height: 23px;  color: 141414; text-align: left; text-align: center;">
                         <span style="color:#F94F97 ">
                         Thank you for purchasing {{ $data->user->name }} Shop Item ({{ $data->shop->name }}) for {{ $curr.$data->amount }} on Spenny Piggy 🐷🎁!
                         </span>
                     </td>
                 </tr>

                 @if(!empty($url))
                     <tr>
                         <td>
                             <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;width:100%;box-sizing:border-box;clear:both;border-bottom:1px solid #e6e6e6;padding: 14px 0;" width="100%">
                                 <tbody>
                                     <tr>
                                         <td style="width:48px;max-width:48px">
                                             <span style="display:block;text-align:center;width:48px;height:48px;border-radius:2px;border:1px solid #e5e5e5">
                                                 <img style="min-width:20px;height:20px;padding-top:13px;padding-left:2px" src="https://ci3.googleusercontent.com/meips/ADKq_NayzxuR3j0qbRPNtSEJbwMaNcC0milvvW2DMZAahdAN4XoKXFcu9YqxkRwoaRusR-RhMle5Ab4TRDzGQ1zn8WW4KNzQZYwpXbzdYkOVRXc7S86K7GKpGMXie-FceGPw=s0-d-e1-ft#https://cdn.buymeacoffee.com/assets/img/email-template/new/attachment.png" className="CToWUd" data-bit="iit">
                                             </span>
                                         </td>
                                         <td style="padding-right:16px;padding-left:14px">
                                             <p style="color:#000000;font-size:14px!important;font-family:Helvetica Neue Roman,Arial,sans-serif,'Open Sans';margin:0;line-height:24px;text-align: left;">{{ $data->shop->reward_file_type ? ucwords($data->shop->reward_file_type) . ' File' : '' }}</p>

                                         </td>
                                         <td style="float:right;padding-top: 8px;">
                                             @php
                                                 $accessUrl = isset($deliverable->uuid) 
                                                    ? route('deliverable.access', $deliverable->uuid) 
                                                    : $url;
                                             @endphp
                                             <a href="{{ $accessUrl }}" style="background:#ffffff;border:1px solid #dddddd;border-radius:4px;font-size: 12px;font-family:Helvetica Neue Roman,Arial,sans-serif,'Open Sans';font-weight: 500;padding: 8px 16px;display:inline-block;text-decoration:none;color:#000000!important;margin-top: 3;" target="_blank">Download</a>
                                         </td>
                                     </tr>
                                 </tbody>
                             </table>
                         </td>
                     </tr>
                     <tr>
                         <td style="padding: 15px 0;">
                             <div style="padding: 15px; background-color: #fff4f8; border: 1px solid #f94f97; border-radius: 8px;">
                                 <p style="font-family: Arial; font-size: 13px; color: #f94f97; margin: 0; line-height: 1.4; text-align: center;">
                                     <strong>Important Notice:</strong> By clicking the download link above, you acknowledge and agree that you are requesting immediate access to digital content. You further acknowledge that this will waive your statutory right to cancel this purchase once the download has started.
                                 </p>
                             </div>
                         </td>
                     </tr>
                 @endif
                 <tr>
                     <td style="height: 10px;line-height: 10px;">
                     </td>
                 </tr>
                 <tr>
                     <td
                         style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                         Go to <a href="{{ env('APP_URL') . '/history' }}">Spenny Piggy</a>  and discover more creators wishes to fulfil! Check out their profile Intros, memberships and more!
                     </td>
                 </tr>
                 <tr>
                     <td style="padding:0 0 10px 0; text-align: center;">
                        <a href={{ env('APP_URL') . '/' . $data->user->username }}
                            style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97;  font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Send more surprises</a>
                     </td>
                 </tr>
             </table>
         </td>
     </tr>
@endsection
