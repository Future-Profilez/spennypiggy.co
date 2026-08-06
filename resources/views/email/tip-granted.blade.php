@extends('email.default-2')
@section('content')
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
    <td align="center" style="padding: 32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width: 440px; width: 100%;">

            {{-- Tip emoji badge --}}
            <tr>
                <td align="center" style="padding: 0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                💝
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    Thanks for Your Support!
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    You supported <strong style="color:#1A1A1A;">{{ ucwords($tip->creator->name) }}</strong>'s Tip Jar on Spenny Piggy 🐷 you've just made their day a little brighter 😍
                </td>
            </tr>

            {{-- Details card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">

                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 4px 0;">
                                            🛍️ Seller (Creator)
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 4px 0;">
                                            {{ ucwords($creator->name ?? 'Creator') }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            🧾 Order ID
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;word-break:break-all;">
                                            {{ $orderId ?: 'N/A' }}
                                        </td>
                                    </tr>
                                    @if(!empty($receiptId))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            🔖 Receipt ID
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;word-break:break-all;">
                                            {{ $receiptId }}
                                        </td>
                                    </tr>
                                    @endif
                                    @if(!empty($paymentIntentId))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            💳 Payment Intent
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;word-break:break-all;">
                                            {{ $paymentIntentId }}
                                        </td>
                                    </tr>
                                    @endif
                                    @if(!empty($internalId))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            #️⃣ Internal ID
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $internalId }}
                                        </td>
                                    </tr>
                                    @endif
                                    @if (!empty($tip->message))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            💬 Message
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $tip->message ?? '' }}
                                        </td>
                                    </tr>
                                    @endif
                                </table>

                                {{-- Divider --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td height="1" bgcolor="#FFD6E8" style="height:1px;line-height:1px;font-size:1px;background-color:#FFD6E8;padding:0;">&nbsp;</td>
                                    </tr>
                                </table>

                                {{-- Amount --}}
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;font-weight:600;padding:12px 0 0 0;">
                                            💰 Amount
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:24px;color:#FF007F;font-weight:800;padding:12px 0 0 0;">
                                            {{ $symbol }}{{ number_format($amount, 2) }}
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Merchant of Record / refund notice --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:12px;color:#999999;
                           line-height:18px;padding:0 0 18px 0;text-align:center;">
                    Delivered instantly. No cancellation rights after access. Final and non-refundable except where required by law.<br>
                    Spenny Piggy is the technology platform; the Creator is the seller (Merchant of Record).
                </td>
            </tr>

            {{-- Contact / Refund buttons --}}
            <tr>
                <td align="center" style="padding:0 0 10px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ $contactUrl }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Contact Creator →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding:0 0 24px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#4a5568"
                                style="background-color:#4a5568;border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ $refundUrl }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Request Refund
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            @if(isset($deliverable) && !empty($deliverable->deliverable_url))
            {{-- Supporter rewards block --}}
            <tr>
                <td style="padding:0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td align="center" style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:17px;color:#FF007F;padding:0 0 6px 0;text-align:center;">
                                            🎁 Your Supporter Rewards!
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#666666;line-height:20px;padding:0 0 14px 0;text-align:center;">
                                            As a thank you for your support, you now have access to exclusive content:
                                        </td>
                                    </tr>
                                </table>

                                @include('email.digital-content-notice')

                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin-top:14px;">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:15px;color:#1A1A1A;padding:0 0 4px 0;">
                                            Supporter Certificate
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#666666;padding:0 0 8px 0;">
                                            🏆 Official Certificate of Authenticity
                                        </td>
                                    </tr>
                                    @php
                                        $accessUrl = isset($deliverable->uuid)
                                           ? route('deliverable.access', $deliverable->uuid)
                                           : $deliverable->deliverable_url;
                                    @endphp
                                    <tr>
                                        <td align="center" style="padding:6px 0 0 0;text-align:center;">
                                            <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                                                <tr>
                                                    <td align="center" bgcolor="#8C52FF" style="background-color:#8C52FF;border-radius:50px;-webkit-border-radius:50px;">
                                                        <a href="{{ $accessUrl }}" target="_blank"
                                                            style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:50px;-webkit-border-radius:50px;">
                                                            📜 View Certificate
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Visit <a href="{{ env('APP_URL') . '/' }}" style="color:#FF007F;text-decoration:none;font-weight:600;">Spenny Piggy</a> to discover more creators to support. ✨
                </td>
            </tr>

            {{-- Gradient CTA button --}}
            <tr>
                <td align="center" style="padding:0 0 12px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ env('APP_URL') . '/history' }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Show More Love →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

        </table>
    </td>
</tr>
@include('email.guest-purchase-hint', ['isGuest' => $isGuest])
@endsection
