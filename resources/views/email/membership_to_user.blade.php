@extends('email.default-2')
@section('content')
@php
    $creatorName = ucwords($mem->membership->user->name ?? 'Creator');
    $levelName = ucwords(str_replace('_',' ',$mem->membership->level));
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
    $accessUrl = isset($deliverable->uuid)
       ? route('deliverable.access', $deliverable->uuid)
       : env('APP_URL') . '/' . $mem->membership->user->username;
@endphp
<tr>
    <td align="center" style="padding: 32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width: 440px; width: 100%;">

            {{-- Membership emoji badge --}}
            <tr>
                <td align="center" style="padding: 0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                ⭐
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
                    Membership Confirmed!
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    You're now subscribed to <strong style="color:#8C52FF;">{{ $creatorName }}</strong>'s
                    <strong style="color:#1A1A1A;">{{ $levelName }}</strong> Membership on Spenny Piggy 🐷
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
                                            {{ $creatorName }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            ⭐ Level
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $levelName }}
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
                                    @if(!empty($mem->stripe_id))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            💳 Stripe ID
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;word-break:break-all;">
                                            {{ $mem->stripe_id }}
                                        </td>
                                    </tr>
                                    @endif
                                    @if(!empty($mem->id))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            #️⃣ Internal ID
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $mem->id }}
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
                                            {{ $amountWithcurrency }}
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

            {{-- Welcome / benefits block --}}
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
                                            💎 Welcome to the Inner Circle!
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#666666;line-height:20px;padding:0 0 14px 0;text-align:center;">
                                            Your membership is now active. You have unlocked exclusive access to:
                                        </td>
                                    </tr>
                                </table>

                                @include('email.digital-content-notice')

                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="margin-top:14px;">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:15px;color:#1A1A1A;padding:0 0 6px 0;">
                                            Membership Benefits
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#666666;line-height:20px;padding:0 0 8px 0;">
                                            You can now access members-only posts of {{ $creatorName }}.<br>
                                            <strong style="color:#1A1A1A;">Your Benefits:</strong> Direct Support to {{ $creatorName }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding:8px 0 0 0;text-align:center;">
                                            <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                                                <tr>
                                                    <td align="center" bgcolor="#8C52FF" style="background-color:#8C52FF;border-radius:50px;-webkit-border-radius:50px;">
                                                        <a href="{{ $accessUrl }}" target="_blank"
                                                            style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:50px;-webkit-border-radius:50px;">
                                                            🔓 Access Creator Profile
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

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Manage your memberships anytime from your account. ✨
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
                                    My Account →
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
