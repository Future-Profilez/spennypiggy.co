@extends('email.default-2')

@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Fraud warning emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                @if($eventType === 'created') 🚨 @elseif($eventType === 'updated') 🔄 @else ✅ @endif
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
                    @if($eventType === 'created') Fraud Warning Detected @elseif($eventType === 'updated') Fraud Warning Updated @else Fraud Warning Resolved @endif
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    @if($eventType === 'created')
                    <strong style="color:#FF007F;">⚠️ Alert!</strong><br><br>
                    A fraud warning has been detected for payment
                    <strong style="color:#8C52FF;">
                        {{ $fraudWarning->stripe_charge_id ?? $fraudWarning->stripe_payment_intent ?? 'Unknown' }}
                    </strong>
                    @elseif($eventType === 'updated')
                    <strong style="color:#FF007F;">🔄 Updated!</strong><br><br>
                    The fraud warning status has been updated
                    @else
                    <strong style="color:#28a745;">✅ Resolved!</strong><br><br>
                    Your fraud warning has been successfully resolved
                    @endif
                </td>
            </tr>

            {{-- Fraud Warning Details Card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table>

                        <tr>

                            <td><b>Fraud Type</b></td>

                            <td>{{ ucwords(str_replace('_',' ', $fraudWarning->fraud_type)) }}</td>

                        </tr>

                        @if(!empty($fraudWarning->amount))

                        <tr>

                            <td><b>Amount</b></td>

                            <td>{{ strtoupper($fraudWarning->currency) }} {{ number_format($fraudWarning->amount,2) }}</td>

                        </tr>

                        @endif

                        @if(!empty($fraudWarning->creator_name))

                        <tr>

                            <td><b>Creator</b></td>

                            <td>{{ $fraudWarning->creator_name }}</td>

                        </tr>

                        @endif

                        @if(!empty($fraudWarning->buyer_name))

                        <tr>

                            <td><b>Buyer</b></td>

                            <td>{{ $fraudWarning->buyer_name }}</td>

                        </tr>

                        @endif

                        @if(!empty($fraudWarning->product_name))

                        <tr>

                            <td><b>Product</b></td>

                            <td>{{ $fraudWarning->product_name }}</td>

                        </tr>

                        @endif

                        <tr>

                            <td><b>Payment Intent</b></td>

                            <td>{{ $fraudWarning->stripe_payment_intent }}</td>

                        </tr>

                        <tr>

                            <td><b>Charge</b></td>

                            <td>{{ $fraudWarning->stripe_charge_id }}</td>

                        </tr>

                    </table>
                </td>
            </tr>

            {{-- Status Information --}}
            @if($eventType === 'created')
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    ⏳ <strong style="color:#1A1A1A;">What happens next?</strong><br>
                    Our team is investigating this warning. Funds have been placed on hold.<br>
                    <strong style="color:#FF007F;">No action is required from you at this time.</strong>
                </td>
            </tr>
            @elseif($eventType === 'updated')
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    📊 <strong style="color:#1A1A1A;">Status Updated</strong><br>
                    Please monitor your dashboard for any further updates.
                </td>
            </tr>
            @else
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    ✅ <strong style="color:#1A1A1A;">Funds Released</strong><br>
                    Any held funds have been released back to your account.
                </td>
            </tr>
            @endif

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Go to <a href="{{ env('APP_URL') . '/dashboard' }}" style="color:#8C52FF;text-decoration:none;font-weight:600;">Spenny Piggy</a> to view full details and manage your account. 🔒
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
                                <a href="{{ env('APP_URL') . '/dashboard' }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    View Dashboard →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Support contact --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:13px;color:#aaaaaa;
                           line-height:18px;padding:16px 0 0 0;text-align:center;">
                    Need help? Contact our support team at
                    <a href="mailto:support@spennypiggy.com" style="color:#8C52FF;text-decoration:none;font-weight:600;">
                        support@spennypiggy.com
                    </a>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection