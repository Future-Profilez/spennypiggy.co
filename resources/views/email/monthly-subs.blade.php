@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Renew emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🔄
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
                    Subscription <span style="color:#8C52FF;">Active</span> 💳
                </td>
            </tr>

            {{-- Subline --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    Hello <strong style="color:#8C52FF;">{{ ucwords($sub->name ?? 'there') }}</strong>!<br><br>
                    {{-- ⚠️ Never print the raw DB status. `monthly_charges.status` is an
                         internal enum, and each billing period gets its own row — the row
                         that started this subscription is marked 'ended' the moment the
                         paid period row is created, so this line read "Your payment for
                         monthly subscription is ended" in a subscription-started email. --}}
                    Your creator subscription is now active on Spenny Piggy.
                </td>
            </tr>

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                           line-height:20px;padding:0 0 22px 0;text-align:center;">
                    Thank you — your subscription keeps your creator tools running. You can
                    manage or cancel it any time from your account settings.
                </td>
            </tr>

            {{-- The dates. A billing email that does not say what period was paid
                 for, or when the next charge lands, sends the creator to support to
                 ask. --}}
            @php
                            $fmt = fn ($d) => $d ? \Carbon\Carbon::parse($d)->format('j M Y') : null;

                            // The symbol comes from the currencies table, exactly as
                            // every other money-bearing template resolves it. A
                            // hardcoded "GBP ? £ : ''" is the bug that made a USD
                            // subscription read "10.79" with no symbol at all; the
                            // ISO code is the fallback, never nothing.
                            $symbol = \App\Helpers::getCurrency($sub->currency ?? 'GBP');
                            $total = (float) ($sub->amount ?? 0) + (float) ($sub->tax ?? 0);

                            $rows = array_filter([
                                // Only when something was actually charged — a "£0.00"
                                // line in a payment email reads as a billing fault.
                                'Amount' => $total > 0 ? $symbol.number_format($total, 2) : null,
                                'Period starts' => $fmt($sub->current_start_subscription_date ?? null),
                                'Period ends' => $fmt($sub->current_end_subscription_date ?? null),
                                'Next charge' => $fmt($sub->upcoming_payment ?? null),
                ]);
            @endphp

            {{-- A setup-mode or legacy free-period row has no charge and no dates,
                 so every line is filtered out. Without this guard the creator got an
                 empty grey box where their billing details should be. --}}
            @if (! empty($rows))
            <tr>
                <td style="padding:4px 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        @foreach ($rows as $label => $value)
                            <tr>
                                <td style="padding:11px 16px;font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                           color:#666666;{{ ! $loop->last ? 'border-bottom:1px solid #EAEAEA;' : '' }}">
                                    {{ $label }}
                                </td>
                                <td align="right" style="padding:11px 16px;font-family:'Outfit',Arial,sans-serif;
                                           font-size:13px;font-weight:700;color:#1A1A1A;
                                           {{ ! $loop->last ? 'border-bottom:1px solid #EAEAEA;' : '' }}">
                                    {{ $value }}
                                </td>
                            </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            @endif

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
                                    Manage Subscriptions →
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
