@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding: 32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width: 440px; width: 100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding: 0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                📤
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
                    Task Proof Submitted!
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    Good news! <strong style="color:#1A1A1A;">{{ ucwords($creator->name) }}</strong> has submitted proof for your task
                    <strong style="color:#8C52FF;">{{ $task->title }}</strong>.
                </td>
            </tr>

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Please review the submitted work and either accept it to complete the order or reject it if revisions are needed.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 22px 0; text-align: center;">
                    @include('email.digital-content-notice')
                </td>
            </tr>
            @if(isset($proofUrl) && $proofUrl)
            <tr>
                <td style="padding: 0 0 22px 0; text-align: center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#8C52FF" style="background-color:#8C52FF;border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ $proofUrl }}" target="_blank" style="display: inline-block; font-family:'Outfit',Arial,sans-serif; font-weight:700; font-size:14px; color:#ffffff; text-decoration:none; padding:13px 32px; border-radius:50px;-webkit-border-radius:50px;">
                                    📥 Download Proof / Content
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif
            <tr>
                <td style="padding: 0 0 22px 0; font-family:'Outfit',Arial,sans-serif; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    @php
                        $creatorUsername = $creator->username ?? null;
                        $base = url('/history');
                        $common = http_build_query([
                            'support_open' => '1',
                            'creator_username' => $creatorUsername,
                            'event_type' => 'gift_task',
                            'source' => 'task_purchases',
                            'source_id' => (string) ($purchase->id ?? ''),
                        ]);
                        $contactUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=contact') : $base;
                        $refundUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=refund') : $base;
                        $orderId = $purchase->stripe_session_id ?? null;
                        $receiptId = $purchase->uuid ?? null;
                        $paymentIntentId = $purchase->payment_intent_id ?? null;
                    @endphp
                    <div style="padding: 18px 20px; background: #FFF1F7; border-radius: 16px; text-align: left;">
                        <div style="font-family:'Outfit',Arial,sans-serif; font-weight: bold; font-size: 13px; color: #141414; margin-bottom: 10px;">
                            🧾 Receipt Details
                        </div>
                        <div style="font-family:'Outfit',Arial,sans-serif; font-weight: normal; font-size: 12px; line-height: 19px; color: #4D4D4D;">
                            <div><b style="color:#1A1A1A;">Seller (Creator):</b> {{ ucwords($creator->name ?? 'Creator') }}</div>
                            <div><b style="color:#1A1A1A;">Order ID:</b> {{ $orderId ?: 'N/A' }}</div>
                            @if(!empty($receiptId))
                                <div><b style="color:#1A1A1A;">Receipt ID:</b> {{ $receiptId }}</div>
                            @endif
                            @if(!empty($paymentIntentId))
                                <div><b style="color:#1A1A1A;">Payment Intent:</b> {{ $paymentIntentId }}</div>
                            @endif
                            @if(!empty($purchase->id))
                                <div><b style="color:#1A1A1A;">Internal ID:</b> {{ $purchase->id }}</div>
                            @endif
                        </div>
                    </div>
                    <div style="margin-top: 14px; font-family:'Outfit',Arial,sans-serif; font-weight: normal; font-size: 12px; line-height: 18px; color: #999999; text-align: center;">
                        Delivered instantly. No cancellation rights after access. Final and non-refundable except where required by law.
                        <br />
                        Spenny Piggy is the technology platform; the Creator is the seller (Merchant of Record).
                    </div>
                    <div style="margin-top: 18px; text-align: center;">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                            <tr>
                                <td align="center" bgcolor="#FF007F"
                                    style="background-color:#FF007F;background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);border-radius:50px;-webkit-border-radius:50px;">
                                    <a href="{{ $contactUrl }}"
                                        style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;border-radius:50px;-webkit-border-radius:50px;">
                                        Contact Creator →
                                    </a>
                                </td>
                            </tr>
                        </table>
                        <div style="height: 12px; line-height: 12px;">&nbsp;</div>
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                            <tr>
                                <td align="center" bgcolor="#4a5568" style="background-color:#4a5568;border-radius:50px;-webkit-border-radius:50px;">
                                    <a href="{{ $refundUrl }}"
                                        style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;border-radius:50px;-webkit-border-radius:50px;">
                                        Request Refund →
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding:0 0 12px 0; text-align: center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);border-radius:50px;-webkit-border-radius:50px;">
                                <a href="{{ env('APP_URL') . '/task/dashboard' }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;border-radius:50px;-webkit-border-radius:50px;">
                                    Review Proof →
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
