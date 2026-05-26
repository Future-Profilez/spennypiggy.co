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
                         <span style="color:#FF007F ">
                         @php
                             $totalPaid = isset($data->total_paid) && $data->total_paid > 0 
                                 ? $data->total_paid 
                                 : ($data->amount + ($data->shipping_amount ?? 0) + ($data->vat_tax_amount ?? 0));
                         @endphp
                         Thank you for purchasing {{ ucwords($data->shop->user->name) }}'s Shop Item ({{ $data->shop->name }}) for {{ $curr }}{{ number_format($totalPaid, 2) }} on Spenny Piggy 🐷🎁!
                         </span>
                     </td>
                 </tr>

                 @if($data->shop->type === 'physical')
                 <tr>
                     <td style="padding: 15px 0;">
                         <div style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF; text-align: center;">
                             <p style="font-family: Arial; font-size: 14px; color: #666; margin: 0; line-height: 1.4;">
                                 📦 <strong>Your order has been placed!</strong><br><br>
                                 The creator will process and ship your order soon. You'll receive an email with tracking details once it's dispatched.
                             </p>
                         </div>
                     </td>
                 </tr>
                 @endif

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
                                            <p style="color:#000000;font-size:14px!important;font-family:Helvetica Neue Roman,Arial,sans-serif,'Open Sans';margin:0;line-height:24px;text-align: left;">{{ $data->shop->reward_file_type ? ucwords($data->shop->reward_file_type) . ' File' : 'Digital Content' }}</p>

                                        </td>
                                        <td style="float:right;padding-top: 8px;">
                                            @php
                                                $accessUrl = isset($deliverable) && isset($deliverable->uuid) 
                                                   ? route('deliverable.access', $deliverable->uuid) 
                                                   : $url;
                                            @endphp
                                            <a href="{{ $accessUrl }}" style="background:#8C52FF;border:1px solid #dddddd;border-radius:25px;font-size: 14px;font-family:Helvetica Neue Roman,Arial,sans-serif,'Open Sans';font-weight: bold;padding: 10px 20px;display:inline-block;text-decoration:none;color:#ffffff!important;margin-top: 3;" target="_blank">📥 Download Content</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px 0;">
                            @include('email.digital-content-notice')
                        </td>
                    </tr>
                @endif

                @if(!empty($data->shop->success_page_value))
                     <tr>
                         <td style="padding: 15px 0;">
                             <div style="padding: 15px; background-color: #f0f7ff; border-radius: 8px; border-left: 4px solid #007bff; text-align: left;">
                                 <p style="font-family: Arial; font-size: 14px; font-weight: bold; color: #007bff; margin: 0 0 10px 0;">
                                     🚀 Confirmation Message:
                                 </p>
                                 @if($data->shop->success_page_type === 'url')
                                     <p style="font-family: Arial; font-size: 14px; color: #333; margin: 0; line-height: 1.4;">
                                         Access your content here: <a href="{{ $data->shop->success_page_value }}" style="color: #007bff; text-decoration: underline;" target="_blank">{{ $data->shop->success_page_value }}</a>
                                     </p>
                                 @else
                                     <p style="font-family: Arial; font-size: 14px; color: #333; margin: 0; line-height: 1.4; white-space: pre-wrap;">{{ $data->shop->success_page_value }}</p>
                                 @endif
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
                         Go to <a href="{{ env('APP_URL') }}">Spenny Piggy</a> and discover more creators' wishes to fulfil! Check out their profile Intros, memberships and more!
                     </td>
                 </tr>
                 <tr>
                     <td style="padding:0 0 10px 0; text-align: center;">
                        <a href={{ env('APP_URL') . '/' . $data->shop->user->username }}
                            style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F;  font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Send more surprises</a>
                     </td>
                 </tr>
             </table>
         </td>
     </tr>
@endsection
