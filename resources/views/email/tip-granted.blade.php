@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img  width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
     </tr>
     <tr>
         <td align="center" style="padding:10px 10px 20px 10px;">
             <table width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="max-width: 420px; width: 100%; text-align: center;">
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

                @php
                    $creator = $tip->creator ?? ($tip->owner ?? null);
                    $creatorUsername = $creator->username ?? null;
                    $orderId = $tip->session_id ?? ($tip->stripe_session_id ?? null);
                    $receiptId = $tip->uuid ?? null;
                    $paymentIntentId = $deliverable->payment_intent_id ?? null;
                    $internalId = $tip->id ?? null;
                    $isGuest = empty($tip->user) && empty($tip->user_id) && !empty($tip->guest_email);

                    $historyBase = url('/history');
                    $common = [
                        'support_open' => '1',
                        'creator_username' => $creatorUsername,
                        'event_type' => 'gift_tip',
                        'source' => 'tip_goals_payments',
                        'source_id' => (string) ($internalId ?? ''),
                    ];

                    if ($isGuest && !empty($tip->guest_email) && !empty($internalId)) {
                        $contactUrl = URL::signedRoute('support.guest.tip.create', ['tipPaymentId' => $internalId, 'email' => $tip->guest_email, 'type' => 'contact']);
                        $refundUrl = URL::signedRoute('support.guest.tip.create', ['tipPaymentId' => $internalId, 'email' => $tip->guest_email, 'type' => 'refund']);
                    } else {
                        $contactUrl = $creatorUsername ? ($historyBase . '?' . http_build_query(array_merge($common, ['support_type' => 'contact']))) : $historyBase;
                        $refundUrl = $creatorUsername ? ($historyBase . '?' . http_build_query(array_merge($common, ['support_type' => 'refund']))) : $historyBase;
                    }
                @endphp

                <tr>
                    <td style="padding: 0 0 18px 0; text-align: center;">
                        <div style="padding: 14px; background: #f8f8f8; border: 1px solid #eeeeee; border-radius: 12px; text-align: left;">
                            <div style="font-family: Arial; font-weight: bold; font-size: 13px; color: #141414; margin-bottom: 8px;">
                                Receipt Details
                            </div>
                            <div style="font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #4D4D4D;">
                                <div><b>Seller (Creator):</b> {{ ucwords($creator->name ?? 'Creator') }}</div>
                                <div><b>Order ID:</b> {{ $orderId ?: 'N/A' }}</div>
                                @if(!empty($receiptId))
                                    <div><b>Receipt ID:</b> {{ $receiptId }}</div>
                                @endif
                                @if(!empty($paymentIntentId))
                                    <div><b>Payment Intent:</b> {{ $paymentIntentId }}</div>
                                @endif
                                @if(!empty($internalId))
                                    <div><b>Internal ID:</b> {{ $internalId }}</div>
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

                 @if(isset($deliverable) && !empty($deliverable->deliverable_url))
                 <tr>
                     <td style="padding: 20px 0; border-top: 1px solid #eee;">
                         <h3 style="font-family: Arial; font-weight: bold; font-size: 18px; color: #FF007F; text-align: center; margin-bottom: 15px;">🎁 Your Supporter Rewards!</h3>
                         <p style="font-family: Arial; font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">As a thank you for your support, you now have access to exclusive content:</p>
                         
                         @include('email.digital-content-notice')
                         
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
