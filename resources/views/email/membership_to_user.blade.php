@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt=""
                     width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
     </tr>
     <tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width: 420px; width: 100%; text-align: center;">
                 <tr>
                     <td style=" font-weight: bold; font-size: 18px; color:#000; line-height: 26px; padding: 0 0 25px 0; text-align: center;">
                         You have successfully subscribed <span style="color: #8C52FF">{{ ucwords($mem->membership->user->name) }}</span> {{ $mem->membership->level }} Membership of amount {{ $amountWithcurrency }} on Spenny Piggy 🐷🎁!
                     </td>
                 </tr>

                 <tr>
                     <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                         @php
                             $creatorUsername = $mem->membership->user->username ?? null;
                             $base = url('/history');
                             $common = http_build_query([
                                 'support_open' => '1',
                                 'creator_username' => $creatorUsername,
                                 'event_type' => 'gift_membership',
                                 'source' => 'membership_payments',
                                 'source_id' => (string) ($mem->id ?? ''),
                             ]);
                             $contactUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=contact') : $base;
                             $refundUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=refund') : $base;
                             $orderId = $mem->session_id ?? null;
                             $receiptId = $mem->uuid ?? null;
                         @endphp
                         <div style="padding: 14px; background: #f8f8f8; border: 1px solid #eeeeee; border-radius: 12px; text-align: left;">
                             <div style="font-family: Arial; font-weight: bold; font-size: 13px; color: #141414; margin-bottom: 8px;">
                                 Receipt Details
                             </div>
                             <div style="font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #4D4D4D;">
                                 <div><b>Seller (Creator):</b> {{ ucwords($mem->membership->user->name ?? 'Creator') }}</div>
                                 <div><b>Order ID:</b> {{ $orderId ?: 'N/A' }}</div>
                                 @if(!empty($receiptId))
                                     <div><b>Receipt ID:</b> {{ $receiptId }}</div>
                                 @endif
                                 @if(!empty($mem->stripe_id))
                                     <div><b>Stripe ID:</b> {{ $mem->stripe_id }}</div>
                                 @endif
                                 @if(!empty($mem->id))
                                     <div><b>Internal ID:</b> {{ $mem->id }}</div>
                                 @endif
                             </div>
                         </div>
                         <div style="margin-top: 12px; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #4D4D4D; text-align: center;">
                             Delivered instantly. No cancellation rights after access. Final and non-refundable except where required by law.
                             <br />
                             Spenny Piggy is the technology platform; the Creator is the seller (Merchant of Record).
                         </div>
                         <div style="margin-top: 14px; text-align: center;">
                             <a href="{{ $contactUrl }}"
                                 style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; display:inline-block; text-decoration:none; border:none;background-color: #FF007F; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                                 Contact Creator
                             </a>
                             <div style="height: 10px; line-height: 10px;">&nbsp;</div>
                             <a href="{{ $refundUrl }}"
                                 style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; display:inline-block; text-decoration:none; border:none;background-color: #FF007F; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                                 Request Refund
                             </a>
                         </div>
                     </td>
                 </tr>
     
                 <tr>
                     <td style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; color: #4D4D4D; text-align: center; line-height: 18px;">
                         Go to <a href="{{ env('APP_URL') . '/history' }}">Spenny Piggy</a> to manage your current Memberships.</td>
                 </tr>

                 <tr>
                     <td style="padding: 20px 0; border-top: 1px solid #eee;">
                         <h3 style="font-family: Arial; font-weight: bold; font-size: 18px; color: #FF007F; text-align: center; margin-bottom: 15px;">💎 Welcome to the Inner Circle!</h3>
                         <p style="font-family: Arial; font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">Your membership is now active. You have unlocked exclusive access to:</p>
                         
                         @include('email.digital-content-notice')
                         
                         <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF; text-align: left;">
                             <p style="font-family: Arial; font-size: 16px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Membership Benefits</p>
                            <p style="font-family: Arial; font-size: 14px; color: #666; margin-bottom: 10px;">You can now access members-only posts of {{ ucwords($mem->membership->user->name) }}.</p>
                            <p style="font-family: Arial; font-size: 14px; color: #666; margin-bottom: 5px;"><strong>Your Benefits:</strong></p>
                            <ul style="font-family: Arial; font-size: 14px; color: #666; margin: 0; padding-left: 20px; line-height: 1.6;">
                                 <li>Direct Support to {{ ucwords($mem->membership->user->name) }}</li>
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
                         <a href="{{ env('APP_URL') . '/history' }}" style=" border-radius:30px;padding: 13px 25px 13px 25px;border:none;background-color:#FF007F;font-family:Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;text-decoration: none;">My Account.</a>
                     </td>
                 </tr>
                 <tr style="line-height: 20px; height: 20px;" ><td></td></tr>
             </table>
         </td>
     </tr>
@endsection
