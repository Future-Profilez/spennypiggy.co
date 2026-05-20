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
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; width: 100%; text-align: center;">
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