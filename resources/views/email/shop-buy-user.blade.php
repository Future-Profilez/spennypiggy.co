@extends('email.default-2')
@section('content')
@php
    $totalPaid = isset($data->total_paid) && $data->total_paid > 0 ? $data->total_paid : ($data->amount + ($data->shipping_amount ?? 0) + ($data->vat_tax_amount ?? 0));
    $creatorUsername = $data->shop->user->username ?? null;
    $base = url('/history');
    $common = http_build_query([
        'support_open' => '1',
        'creator_username' => $creatorUsername,
        'event_type' => 'gift_shop',
        'source' => 'shop_payments',
        'source_id' => (string) ($data->id ?? ''),
    ]);
    $contactUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=contact') : $base;
    $refundUrl = $creatorUsername ? ($base . '?' . $common . '&support_type=refund') : $base;
    $orderId = $data->session_id ?? null;
    $receiptId = $data->uuid ?? null;
@endphp
<tr>
    <td align="center" style="padding: 32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width: 440px; width: 100%;">

            {{-- Shop emoji badge --}}
            <tr>
                <td align="center" style="padding: 0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🛍️
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
                    Purchase Confirmed!
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    Thank you for purchasing <strong style="color:#1A1A1A;">{{ ucwords($data->shop->user->name) }}</strong>'s Shop Item
                    <strong style="color:#8C52FF;">{{ $data->shop->name }}</strong> on Spenny Piggy 🐷
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
                                            {{ ucwords($data->shop->user->name ?? 'Creator') }}
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
                                    @if(!empty($data->id))
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            #️⃣ Internal ID
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $data->id }}
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
                                            {{ $curr }}{{ number_format($totalPaid, 2) }}
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Physical order notice --}}
            @if($data->shop->type === 'physical')
            <tr>
                <td style="padding:0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td align="center" style="padding:16px 20px;font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;line-height:20px;text-align:center;">
                                📦 <strong style="color:#1A1A1A;">Your order has been placed!</strong><br><br>
                                The creator will process and ship your order soon. You'll receive an email with tracking details once it's dispatched.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Digital download --}}
            @if(!empty($url))
            <tr>
                <td style="padding:0 0 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;width:100%;">
                        <tr>
                            <td style="padding:16px 20px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="width:48px;max-width:48px;">
                                            <span style="display:block;text-align:center;width:48px;height:48px;border-radius:8px;border:1px solid #FFD6E8;">
                                                <img style="min-width:20px;height:20px;padding-top:13px;padding-left:2px" src="https://ci3.googleusercontent.com/meips/ADKq_NayzxuR3j0qbRPNtSEJbwMaNcC0milvvW2DMZAahdAN4XoKXFcu9YqxkRwoaRusR-RhMle5Ab4TRDzGQ1zn8WW4KNzQZYwpXbzdYkOVRXc7S86K7GKpGMXie-FceGPw=s0-d-e1-ft#https://cdn.buymeacoffee.com/assets/img/email-template/new/attachment.png" className="CToWUd" data-bit="iit">
                                            </span>
                                        </td>
                                        <td style="padding-right:16px;padding-left:14px;">
                                            <p style="font-family:'Outfit',Arial,sans-serif;color:#1A1A1A;font-size:14px;font-weight:700;margin:0;line-height:24px;text-align:left;">{{ $data->shop->reward_file_type ? ucwords($data->shop->reward_file_type) . ' File' : 'Digital Content' }}</p>
                                        </td>
                                        <td align="right" style="padding-top:4px;">
                                            @php
                                                $accessUrl = isset($deliverable) && isset($deliverable->uuid)
                                                   ? route('deliverable.access', $deliverable->uuid)
                                                   : $url;
                                            @endphp
                                            <a href="{{ $accessUrl }}" target="_blank" style="background:#8C52FF;border-radius:50px;font-size:14px;font-family:'Outfit',Arial,sans-serif;font-weight:700;padding:10px 20px;display:inline-block;text-decoration:none;color:#ffffff;">📥 Download Content</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 18px 0;">
                    @include('email.digital-content-notice')
                </td>
            </tr>
            @endif

            {{-- Confirmation message --}}
            @if(!empty($data->shop->success_page_value))
            <tr>
                <td style="padding:0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7" style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:16px 20px;">
                                <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;color:#8C52FF;margin:0 0 10px 0;">
                                    🚀 Confirmation Message:
                                </p>
                                @if(($data->shop->type ?? null) !== 'physical' && empty($url))
                                    <div style="margin: 0 0 12px 0;">
                                        @include('email.digital-content-notice')
                                    </div>
                                @endif
                                @if($data->shop->success_page_type === 'url')
                                    <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;margin:0;line-height:20px;">
                                        Access your content here: <a href="{{ $data->shop->success_page_value }}" style="color:#FF007F;text-decoration:underline;" target="_blank">{{ $data->shop->success_page_value }}</a>
                                    </p>
                                @else
                                    <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;margin:0;line-height:20px;white-space:pre-wrap;">{{ $data->shop->success_page_value }}</p>
                                @endif
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Merchant of Record / refund notice --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:12px;color:#999999;
                           line-height:18px;padding:0 0 18px 0;text-align:center;">
                    @if(($data->shop->type ?? null) === 'physical')
                        Physical item purchase. Delivery and tracking will be provided by the creator.
                    @else
                        Delivered instantly. No cancellation rights after access. Final and non-refundable except where required by law.
                    @endif
                    <br>
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

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Go to <a href="{{ env('APP_URL') }}" style="color:#FF007F;text-decoration:none;font-weight:600;">Spenny Piggy</a> and discover more creators to support. ✨
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
                                <a href="{{ env('APP_URL') . '/' . $data->shop->user->username }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Send More Surprises →
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
