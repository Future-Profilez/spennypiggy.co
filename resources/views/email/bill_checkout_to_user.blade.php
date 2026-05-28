@extends('email.default-2')
@section('content')
    <tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 420px; width: 100%; text-align: center;">
        <tr>
            <td style=" padding: 0 0 25px 0; text-align: center;"><img src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" style="max-width: 200px;margin:20px 0;" alt="spenny piggy gift icon"></td>
        </tr>
        <tr>
            <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                <span style="color:#FF007F ">
                    Thank you for granting {{ ucwords($user_name) }}'s bill ({{$bill_pay->bill->name}}) of {{ $amountWithCurr }} on Spenny Piggy 🐷🎁
                </span>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                @php
                    $creatorUsername = $bill_pay->bill->user->username ?? null;
                    $base = url('/history');
                    $common = http_build_query([
                        'support_open' => '1',
                        'creator_username' => $creatorUsername,
                        'event_type' => 'gift_bill',
                        'source' => 'bill_payments',
                        'source_id' => (string) ($bill_pay->id ?? ''),
                    ]);
                    $contactUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=contact') : $base;
                    $refundUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=refund') : $base;
                    $orderId = $bill_pay->session_id ?? null;
                    $receiptId = $bill_pay->uuid ?? null;
                @endphp
                <div style="padding: 14px; background: #f8f8f8; border: 1px solid #eeeeee; border-radius: 12px; text-align: left;">
                    <div style="font-family: Arial; font-weight: bold; font-size: 13px; color: #141414; margin-bottom: 8px;">
                        Receipt Details
                    </div>
                    <div style="font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #4D4D4D;">
                        <div><b>Seller (Creator):</b> {{ ucwords($bill_pay->bill->user->name ?? 'Creator') }}</div>
                        <div><b>Order ID:</b> {{ $orderId ?: 'N/A' }}</div>
                        @if(!empty($receiptId))
                            <div><b>Receipt ID:</b> {{ $receiptId }}</div>
                        @endif
                        @if(!empty($bill_pay->stripe_id))
                            <div><b>Stripe ID:</b> {{ $bill_pay->stripe_id }}</div>
                        @endif
                        @if(!empty($bill_pay->id))
                            <div><b>Internal ID:</b> {{ $bill_pay->id }}</div>
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
            <td style="padding: 20px 0; border-top: 1px solid #eee;">
                <h3 style="font-family: Arial; font-weight: bold; font-size: 18px; color: #FF007F; text-align: center; margin-bottom: 15px;">📜 Bill Fulfillment</h3>
                
                @include('email.digital-content-notice')
                
                <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF; text-align: center;">
                    <p style="font-family: Arial; font-size: 14px; color: #666; margin-bottom: 10px;">You can now see subscription-only posts of {{ ucwords($bill_pay->bill->user->name) }}.</p>
                    @php
                        $accessUrl = isset($deliverable->uuid) 
                           ? route('deliverable.access', $deliverable->uuid) 
                           : env('APP_URL') . '/' . $bill_pay->bill->user->username;
                    @endphp
                    <a href="{{ $accessUrl }}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #8C52FF; color: white; text-decoration: none; border-radius: 25px; font-family: Arial; font-size: 14px; font-weight: bold;"
                       target="_blank">🔓 Access Content</a>
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                Go to <a href="{{ env('APP_URL') . '/history' }}">Spenny Piggy</a>  and discover more creators bills to fulfil! Check out their profile Intros, memberships and more! </td>
            </tr>
        <tr>
            <td style="padding:0 0 10px 0; text-align: center;">
                <a href={{ env('APP_URL') . '/' . $bill_pay->bill->user->username }}
                    style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Send more surprises</a>
            </td>
        </tr>
        <tr>
        <td style="height: 20px; line-height: 20px;"></td>
        </tr>
    </table>
    </td>
    </tr>
@endsection
