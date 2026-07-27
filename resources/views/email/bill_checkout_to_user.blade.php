@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Thanks emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🙏
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
                    Thank You!
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    You granted <strong style="color:#1A1A1A;">{{ ucwords($user_name) }}</strong>'s bill
                    (<strong style="color:#8C52FF;">{{$bill_pay->bill->name}}</strong>) of
                    <strong style="color:#8C52FF;">{{ $amountWithCurr }}</strong> on Spenny Piggy 🐷🎁
                </td>
            </tr>

            {{-- Receipt details card --}}
            <tr>
                <td style="padding:0 0 16px 0;">
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
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:13px;color:#1A1A1A;padding:0 0 10px 0;">
                                    🧾 Receipt Details
                                </div>
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Seller (Creator)</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;">{{ ucwords($bill_pay->bill->user->name ?? 'Creator') }}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Order ID</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $orderId ?: 'N/A' }}</td>
                                    </tr>
                                    @if(!empty($receiptId))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Receipt ID</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $receiptId }}</td>
                                    </tr>
                                    @endif
                                    @if(!empty($bill_pay->stripe_id))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Stripe ID</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $bill_pay->stripe_id }}</td>
                                    </tr>
                                    @endif
                                    @if(!empty($bill_pay->id))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:4px 0;">Internal ID</td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:4px 0;word-break:break-all;">{{ $bill_pay->id }}</td>
                                    </tr>
                                    @endif
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Compliance note --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:12px;color:#999999;
                           line-height:18px;padding:0 0 20px 0;text-align:center;">
                    Delivered instantly. No cancellation rights after access. Final and non-refundable except where required by law.
                    <br />
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
                <td align="center" style="padding:0 0 22px 0;text-align:center;">
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

            {{-- The creator's welcome reward (file/message/link) — the
                 fulfillment card below covers ongoing subscriber access. --}}
            @include('email.reward-block', ['rewardItem' => $bill_pay->bill, 'rewardShowFile' => true])

            {{-- Bill fulfillment card --}}
            <tr>
                <td style="padding:0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:16px;color:#FF007F;text-align:center;padding:0 0 14px 0;">📜 Bill Fulfillment</div>

                                @include('email.digital-content-notice')

                                @php
                                    $accessUrl = isset($deliverable->uuid)
                                       ? route('deliverable.access', $deliverable->uuid)
                                       : env('APP_URL') . '/' . $bill_pay->bill->user->username;
                                @endphp
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin:0;">
                                    <tr>
                                        <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px;border-left:4px solid #8C52FF;padding:14px 16px;text-align:center;">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;padding:0 0 12px 0;">You can now see subscription-only posts of {{ ucwords($bill_pay->bill->user->name) }}.</div>
                                            <a href="{{ $accessUrl }}"
                                               style="display:inline-block;padding:10px 24px;background-color:#8C52FF;color:#ffffff;text-decoration:none;border-radius:50px;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;"
                                               target="_blank">🔓 Access Content</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Discover more creators on <a href="{{ env('APP_URL') . '/history' }}" style="color:#8C52FF;text-decoration:none;font-weight:600;">Spenny Piggy</a> — check out their Intros, memberships and more! ✨
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
                                <a href={{ env('APP_URL') . '/' . $bill_pay->bill->user->username }}
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Send more surprises →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
