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
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 6px 0;">
                                    📋 Fraud Warning Details
                                </div>

                                {{-- Fraud Type --}}
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Fraud Type:
                                    <span style="color:#FF007F;font-weight:700;">
                                        {{ ucfirst(str_replace('_', ' ', $fraudWarning->fraud_type ?? 'Unknown')) }}
                                    </span>
                                </div>

                                {{-- Risk Level --}}
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Risk Level:
                                    @if(strtolower($fraudWarning->risk_level ?? '') == 'high')
                                    <span style="color:#dc3545;font-weight:700;">🔴 High</span>
                                    @elseif(strtolower($fraudWarning->risk_level ?? '') == 'medium')
                                    <span style="color:#ffc107;font-weight:700;">🟡 Medium</span>
                                    @elseif(strtolower($fraudWarning->risk_level ?? '') == 'low')
                                    <span style="color:#28a745;font-weight:700;">🟢 Low</span>
                                    @else
                                    <span style="color:#6c757d;font-weight:700;">⚪ {{ ucfirst($fraudWarning->risk_level ?? 'Unknown') }}</span>
                                    @endif
                                </div>

                                {{-- Action --}}
                                @if($fraudWarning->action)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Action Taken:
                                    <span style="color:#8C52FF;font-weight:700;">
                                        {{ ucfirst(str_replace('_', ' ', $fraudWarning->action)) }}
                                    </span>
                                </div>
                                @endif

                                {{-- Amount & Payment Details --}}
                                @php
                                $payment = \App\Models\Payment::find($fraudWarning->payment_id);
                                $amount = 0;
                                $currency = 'USD';
                                $creator = null;
                                $buyer = null;
                                $productName = 'Unknown';

                                if ($payment) {
                                $amount = $payment->amount / 100;
                                $currency = strtoupper($payment->currency ?? 'USD');
                                if ($payment->creator_id) {
                                $creator = \App\Models\User::where('uuid', $payment->creator_id)->first();
                                }
                                }

                                // Try to get from TaskPurchase
                                if ($fraudWarning->stripe_payment_intent) {
                                $taskPurchase = \App\Models\TaskPurchase::where('payment_intent_id', $fraudWarning->stripe_payment_intent)->first();
                                if ($taskPurchase) {
                                $amount = $taskPurchase->amount ?? $amount;
                                $currency = strtoupper($taskPurchase->currency ?? $currency);
                                $productName = $taskPurchase->task->title ?? 'Task Purchase';
                                if ($taskPurchase->creator_id) {
                                $creator = \App\Models\User::find($taskPurchase->creator_id);
                                }
                                if ($taskPurchase->supporter_id) {
                                $buyer = \App\Models\User::find($taskPurchase->supporter_id);
                                }
                                }
                                }

                                $currencyModel = \App\Models\Currency::where('ISO', $currency)->first();
                                $symbol = $currencyModel ? $currencyModel->symbol : '$';
                                @endphp

                                @if($amount > 0)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Amount:
                                    <span style="color:#28a745;font-weight:700;">
                                        {{ $symbol }}{{ number_format($amount, 2) }} {{ $currency }}
                                    </span>
                                </div>
                                @endif

                                @if($productName != 'Unknown')
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Product:
                                    <span style="color:#666;font-weight:500;">
                                        {{ $productName }}
                                    </span>
                                </div>
                                @endif

                                @if($creator)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Creator:
                                    <span style="color:#8C52FF;font-weight:500;">
                                        {{ $creator->name ?? $creator->email ?? 'Unknown' }}
                                    </span>
                                </div>
                                @endif

                                @if($buyer)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Buyer:
                                    <span style="color:#666;font-weight:500;">
                                        {{ $buyer->name ?? $buyer->email ?? 'Unknown' }}
                                    </span>
                                </div>
                                @endif

                                {{-- Payment Intent --}}
                                @if($fraudWarning->stripe_payment_intent)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Payment Intent:
                                    <span style="color:#666;font-weight:500;font-size:12px;word-break:break-all;">
                                        {{ $fraudWarning->stripe_payment_intent }}
                                    </span>
                                </div>
                                @endif

                                {{-- EFW ID --}}
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Warning ID:
                                    <span style="color:#666;font-weight:500;font-size:12px;word-break:break-all;">
                                        {{ $fraudWarning->stripe_efw_id }}
                                    </span>
                                </div>

                                {{-- Date --}}
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;line-height:20px;padding:6px 0;">
                                    Detected:
                                    <span style="color:#666;font-weight:500;">
                                        {{ $fraudWarning->created_at ? $fraudWarning->created_at->format('Y-m-d H:i:s') : 'Unknown' }}
                                    </span>
                                </div>
                            </td>
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