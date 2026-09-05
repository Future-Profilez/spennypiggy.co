@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                💸
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
                    Payout on the way, <span style="color:#8C52FF;">{{ ucwords($creator->name) }}</span>
                </td>
            </tr>

            {{-- Intro --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 22px 0;text-align:center;">
                    @if ($arrivalDate)
                        We've sent your earnings to your bank. Your bank expects it by {{ $arrivalDate }}.
                    @else
                        We've sent your earnings to your bank. It usually lands within a few business days.
                    @endif
                </td>
            </tr>

            {{-- Amount --}}
            <tr>
                <td align="center" style="padding:0 0 20px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%"
                           style="background-color:#F7F4FF;border-radius:14px;">
                        <tr>
                            <td align="center" style="padding:18px 16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;letter-spacing:1px;
                                            text-transform:uppercase;color:#7A7A7A;padding-bottom:6px;">Amount</div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:28px;color:#1A1A1A;">
                                    {{ $currency }} {{ number_format($amount, 2) }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Details --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%"
                           style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4A4A4A;">
                        {{-- The earning week this payout covers. Rendered only when it could be
                             derived — a payment receipt naming the wrong week is worse than one
                             naming none. --}}
                        @if (! empty($earningWeek))
                            <tr>
                                <td style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#7A7A7A;">Covers</td>
                                <td align="right" style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#1A1A1A;font-weight:600;">
                                    {{ $earningWeek }}
                                </td>
                            </tr>
                        @endif
                        <tr>
                            <td style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#7A7A7A;">Sent on</td>
                            <td align="right" style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#1A1A1A;font-weight:600;">
                                {{ $sentAt }}
                            </td>
                        </tr>
                        @if ($arrivalDate)
                        <tr>
                            <td style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#7A7A7A;">Estimated arrival</td>
                            <td align="right" style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#1A1A1A;font-weight:600;">
                                {{ $arrivalDate }}
                            </td>
                        </tr>
                        @endif
                        @if ($destination)
                        <tr>
                            <td style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#7A7A7A;">Destination</td>
                            <td align="right" style="padding:8px 0;border-bottom:1px solid #EEEEEE;color:#1A1A1A;font-weight:600;">
                                {{ $destination }}
                            </td>
                        </tr>
                        @endif
                        @if ($reference)
                        <tr>
                            <td style="padding:8px 0;color:#7A7A7A;">Reference</td>
                            <td align="right" style="padding:8px 0;color:#1A1A1A;font-weight:600;">
                                {{ $reference }}
                            </td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>

            {{-- Footnote --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    We'll email you again once your bank confirms the payout has arrived.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
