@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <img style="max-width: 200px; margin:20px 0;" src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img">
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; width: 100%; text-align: center;">
            <tr>
                <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold; font-size: 18px; line-height: 27px; color: 141414; text-align: center;">
                    <span style="color:#FF007F; font-weight: bold;">
                        Thank you for supporting {{ $pay->creator?->name ?? 'this creator' }}'s Piggy Pot!
                    </span><br><br>
                    <span style="color:#141414;">
                        Your generous contribution of {{ $symbol }}{{ number_format((float) ($pay->total_paid ?? 0), 2) }} has made their day brighter 🎁✨
                    </span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Go to <a href="https://spennypiggy.co/">Spenny Piggy</a> and discover more creators wishes to fulfil! Check out their profile Intros, memberships and more!
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 18px 0;">
                    @php
                        $creatorUsername = $pay->creator?->username ?? null;
                        $base = url('/history');
                        $common = http_build_query([
                            'support_open' => '1',
                            'creator_username' => $creatorUsername,
                            'event_type' => 'piggy_pot',
                            'source' => 'piggy_pot_contributions',
                            'source_id' => (string) ($pay->id ?? ''),
                        ]);
                        $contactUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=contact') : $base;
                        $refundUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=refund') : $base;
                        $orderId = $pay->session_id ?? null;
                        $receiptId = $pay->uuid ?? null;
                        $paymentIntentId = $pay->payment_intent_id ?? null;
                    @endphp
                    <div style="padding: 14px; background: #f8f8f8; border: 1px solid #eeeeee; border-radius: 12px; text-align: left;">
                        <div style="font-family: Arial; font-weight: bold; font-size: 13px; color: #141414; margin-bottom: 8px;">
                            Receipt Details
                        </div>
                        <div style="font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #4D4D4D;">
                            <div><b>Seller (Creator):</b> {{ ucwords($pay->creator?->name ?? 'Creator') }}</div>
                            <div><b>Order ID:</b> {{ $orderId ?: 'N/A' }}</div>
                            @if(!empty($receiptId))
                                <div><b>Receipt ID:</b> {{ $receiptId }}</div>
                            @endif
                            @if(!empty($paymentIntentId))
                                <div><b>Payment Intent:</b> {{ $paymentIntentId }}</div>
                            @endif
                            @if(!empty($pay->id))
                                <div><b>Internal ID:</b> {{ $pay->id }}</div>
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

            @php
                $rewardUrl = null;
                $rewardText = null;
                if (!empty($pay->piggyPot?->content_description)) {
                    $rewardText = $pay->piggyPot->content_description;
                }
                if (!empty($pay->piggyPot?->content_file)) {
                    $rewardUrl = $pay->piggyPot->content_file;
                    if (strpos($rewardUrl, 'http://') !== 0 && strpos($rewardUrl, 'https://') !== 0) {
                        $rewardUrl = 'https://ucarecdn.com/' . trim($rewardUrl, '/') . '/';
                    }
                }
            @endphp

            @if(!empty($rewardUrl) || !empty($rewardText))
            <tr>
                <td style="padding: 0 0 18px 0;">
                    @include('email.digital-content-notice')
                </td>
            </tr>
            @endif

            @if(!empty($rewardUrl) || !empty($rewardText))
            <tr>
                <td style="padding: 0 0 18px 0; text-align: left;">
                    <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF; text-align: left;">
                        <div style="font-family: Arial; font-weight: 900; font-size: 13px; color:#FF007F; text-transform:uppercase; margin-bottom:8px;">Exclusive Reward</div>
                        @if(!empty($rewardText))
                            <div style="font-family: Arial; font-size: 14px; color: #666; margin-bottom: 10px; font-weight: 700;">{{ $rewardText }}</div>
                        @endif
                        @if(!empty($rewardUrl))
                            <a href="{{ $rewardUrl }}" style="display: inline-block; padding: 10px 20px; background-color: #8C52FF; color: white; text-decoration: none; border-radius: 25px; font-family: Arial; font-size: 14px; font-weight: bold;" target="_blank">🎁 Access Reward</a>
                        @endif
                    </div>
                </td>
            </tr>
            @endif

            @if(!empty($thankYouUrl))
            <tr>
                <td style="padding:0 0 12px 0; text-align: center;">
                    <a href="{{ $thankYouUrl }}" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; display:inline-block; text-decoration:none; border:none;background-color: #FF007F; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;" target="_blank">Open Thank You Page</a>
                </td>
            </tr>
            @endif

            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/' . ($pay->creator?->username ?? '') }}" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; display:inline-block; text-decoration:none; border:none;background-color: #FF007F; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">View Creator Profile</a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
