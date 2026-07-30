@extends('email.default-2')
@section('content')
{{--
    Abandoned checkout reminder.

    The CTA returns the supporter to the SAME Stripe Checkout session they already
    opened, so the price they see is the price they were quoted.

    Content-first copy only: this is an unfinished PURCHASE of creator content. No
    gift / tip / donation / fundraising wording, and never the reward body — that is
    the paid content and is delivered after payment.
--}}
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
                                {{ $isFinalReminder ? '⏳' : '🛒' }}
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
                    @if ($isFinalReminder)
                        Your checkout link expires soon, <span style="color:#FF007F;">{{ $firstName }}</span>
                    @else
                        You are one step away, <span style="color:#FF007F;">{{ $firstName }}</span>
                    @endif
                </td>
            </tr>

            {{-- Intro --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    @if ($isFinalReminder)
                        Your checkout with {{ $creatorName }} is still open, but the payment link will stop
                        working shortly. Finish now and your content is unlocked straight away.
                    @else
                        Your purchase from {{ $creatorName }} was not completed. Nothing has been charged.
                        Pick up exactly where you left off &mdash; same price, same content.
                    @endif
                </td>
            </tr>

            {{-- What was in the checkout --}}
            @if ($itemTitle || $rewardTitle || $amountLabel)
            <tr>
                <td style="padding:0 0 8px 0;">
                    <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;letter-spacing:1px;
                                text-transform:uppercase;color:#9A9A9A;padding-bottom:10px;">
                        Waiting in your checkout
                    </div>

                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;">
                        <tr>
                            <td style="padding:14px 16px;">
                                @if ($itemTitle)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                            font-size:15px;color:#1A1A1A;line-height:22px;">
                                    {{ $itemTitle }}
                                </div>
                                @endif

                                @if ($creatorUsername)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                            color:#9A9A9A;line-height:20px;">
                                    {{-- &#64; not &commat;: the named entity is HTML5-only and
                                         several mail clients render it as literal text
                                         ("&commat;testcreator"). The numeric reference is
                                         decoded everywhere, and avoids Blade seeing a bare @. --}}
                                    &#64;{{ $creatorUsername }}
                                </div>
                                @endif

                                {{-- The reward HEADLINE only. The body is the paid content. --}}
                                @if ($rewardTitle)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                            color:#4A4A4A;line-height:20px;padding-top:8px;">
                                    You get: {{ $rewardTitle }}
                                </div>
                                @endif

                                @if ($amountLabel)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;
                                            font-size:16px;color:#1A1A1A;line-height:24px;padding-top:10px;">
                                    {{ $amountLabel }}
                                </div>
                                @endif
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Primary action: back to the SAME Stripe session --}}
            <tr>
                <td align="center" style="padding:24px 0 12px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $checkoutUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#FFFFFF;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    Complete purchase
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Secondary action --}}
            <tr>
                <td align="center" style="padding:0 0 22px 0;">
                    <a href="{{ $creatorUrl }}" target="_blank"
                       style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:600;
                              color:#7A7A7A;text-decoration:underline;">
                        Or take another look at {{ $creatorName }}'s page
                    </a>
                </td>
            </tr>

            {{-- Footnote: says plainly why this arrived and how to stop it. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You are receiving this because you started a purchase on Spenny Piggy and did not finish it.
                    @if ($unsubscribeUrl)
                    <br>
                    <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Turn off these reminders
                    </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
