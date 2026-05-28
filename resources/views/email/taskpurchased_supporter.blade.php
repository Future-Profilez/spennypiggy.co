@extends('email.default-2')
@section('content')

@php

$currencyCode = $purchase->currency ?? $task->currency ?? 'USD';

$currencySymbol = \App\Models\Currency::where('ISO', $currencyCode)->value('symbol') ?? '$';

// Creator actual/base amount
$creatorAmount = (float) ($purchase->amount ?? $task->price ?? 0);

// Supporter paid amount
$supporterPaid = (float) (
$purchase->total_paid && $purchase->total_paid > 0
? $purchase->total_paid
: (
($purchase->transfer_amount ?? 0)
+ ($purchase->platform_fee ?? 0)
)
);
// VAT
$vatAmount = (float) ($purchase->vat_amount ?? 0);

// Final display amount
$displayAmount = $supporterPaid > 0 ? $supporterPaid : $creatorAmount;

@endphp

<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img alt="Spenny Piggy" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 420px; width: 100%; text-align: center;">
            <tr>
                <td style="font-family:Arial;font-weight:bold;font-size: 21px;color:#000;line-height: 26px;padding:0 0 25px 0;text-align:center">
                    Task <span style="color: #8C52FF">Order Confirmed</span>! 📋
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: 141414; text-align: center;">
                    Thank you, {{ $supporter ? ucwords($supporter->name) : "Guest" }}! <br>
                    You just purchased the task <strong>{{ $task->title }}</strong> from {{ ucwords($task->creator->name) }} for {{ $currencySymbol }}{{ number_format($displayAmount, 2) }}.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    @if($task->type === 'instant')
                    This is an instant task. Your content is ready below!
                    @else
                    This is a timed task. The creator has been notified and will submit proof or content once it's done. You will receive another email when it is ready.
                    @endif
                </td>
            </tr>
            @if($task->type === 'instant' && $deliverableUrl)
            <tr>
                <td style="padding: 0 0 20px 0; text-align: center;">
                    @include('email.digital-content-notice')
                    <a href="{{ $deliverableUrl }}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #8C52FF; color: white; text-decoration: none; border-radius: 25px; font-family: Arial; font-size: 14px; font-weight: bold;">
                        📥 Download Content
                    </a>
                </td>
            </tr>
            @endif
            <tr style="line-height: 10px; height: 10px;">
                <td></td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    @php
                        $creatorUsername = $task->creator->username ?? null;
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
                    <div style="padding: 14px; background: #f8f8f8; border: 1px solid #eeeeee; border-radius: 12px; text-align: left;">
                        <div style="font-family: Arial; font-weight: bold; font-size: 13px; color: #141414; margin-bottom: 8px;">
                            Receipt Details
                        </div>
                        <div style="font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #4D4D4D;">
                            <div><b>Seller (Creator):</b> {{ ucwords($task->creator->name ?? 'Creator') }}</div>
                            <div><b>Order ID:</b> {{ $orderId ?: 'N/A' }}</div>
                            @if(!empty($receiptId))
                                <div><b>Receipt ID:</b> {{ $receiptId }}</div>
                            @endif
                            @if(!empty($paymentIntentId))
                                <div><b>Payment Intent:</b> {{ $paymentIntentId }}</div>
                            @endif
                            @if(!empty($purchase->id))
                                <div><b>Internal ID:</b> {{ $purchase->id }}</div>
                            @endif
                        </div>
                    </div>
                    <div style="margin-top: 12px; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #4D4D4D; text-align: center;">
                        @if($task->type === 'instant')
                            Delivered instantly. No cancellation rights after access. Final and non-refundable except where required by law.
                        @else
                            Timed task purchase. The creator will deliver your task; if there is an issue, contact the creator first or request a refund.
                        @endif
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
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/task/dashboard' }}"
                        style="display: inline-block; border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                        My Tasks
                    </a>
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;">
                <td></td>
            </tr>

        </table>
    </td>
</tr>
@endsection
