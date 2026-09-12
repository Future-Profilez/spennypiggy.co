@extends('email.default-2')
@section('content')
{{--
    "Welcome to Spenny Piggy — your page is ready" — sent once, on creator
    registration, by App\Jobs\WelcomeUser.

    🚨 TRANSACTIONAL. No unsubscribe link, deliberately: it explains the account
    the reader just opened. The shared layout only appends its footer pair when a
    mail supplies `unsubscribeUrl`, so leaving that unset is what keeps it off.

    🚨 EVERY FIGURE IS A VARIABLE. The fee, the ladder amounts, the free months,
    the referral reward and the plan price all come from App\Mail\Welcome, which
    reads FeeModel, config/membership_credits.php, config/referral.php and
    SubscriptionPlan. Never type one in here — a literal is a number that cannot
    follow a client's config change, which is exactly how three creator forms
    came to advertise "19%" after the fee model changed.

    🚨 CONTENT-FIRST COPY ONLY. No gift / tip / donation / fundraise / expense
    wording anywhere on this page, and no "buy me a coffee" framing. Every module
    is described as content or a creator service, because this mail is read
    alongside a Stripe-facing product.

    🚨 THE LADDER FIGURES ARE SALES, NOT TAKE-HOME. QualifyingEarnings is the
    LISTED SALE VALUE (net + VAT, refunds removed proportionally) and its own
    docblock forbids any copy calling it what the creator keeps — where VAT
    applies, part of it goes to HMRC. Hence "in sales", never "earned" or "kept".

    ⚠️ A CREDIT IS A FREE MONTH AND NEVER CASH (config/membership_credits.php).
    The panel says so in as many words; do not shorten that line away.

    ⚠️ Black type on the pink button, not white. #FF007F is mid-luminance: white
    is 3.78:1 and fails AA at label size, black is 5.56:1. House rule, both apps.

    ⚠️ Mint (#05EFB8) appears ONLY inside the black panel. On white it measures
    1.4:1 and is unreadable — the same fault that once put a creator's earnings
    figure in the one colour they could not read.
--}}
<tr>
    <td align="center" style="padding:34px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Headline. No emoji badge and no single coloured word: the black
                 panel below is where this design spends its boldness, and a
                 second focal point would flatten it. --}}
            <tr>
                <td style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:26px;color:#1A1A1A;
                           line-height:32px;padding:0 0 12px 0;">
                    Hi {{ $name }} — your page is ready.
                </td>
            </tr>

            <tr>
                <td style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 26px 0;">
                    Put up a photo, a short bio and one thing to sell. Both the photo and the bio are checked
                    automatically the moment you save them, so there is nothing to wait for and nobody to chase.
                </td>
            </tr>

            {{-- ============ WHAT YOU CAN SELL ============
                 Not a sequence — a creator picks whichever fits — so no numbered
                 markers. Names match the profile tabs exactly (Wishes, Shop,
                 Tasks, Piggy Pots, Memberships, Bills); a creator reading a
                 different word here would go looking for a tab that is not
                 there. --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FFF6FA;border-radius:14px;border:1px solid #FFDCEB;">
                        <tr>
                            <td style="padding:18px 20px 6px 20px;font-family:'Outfit',Arial,sans-serif;
                                       font-size:14px;font-weight:700;color:#1A1A1A;line-height:20px;">
                                Six ways to sell
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:0 20px 18px 20px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                                       style="font-family:'Outfit',Arial,sans-serif;">
                                    @foreach ([
                                        ['Wishes', 'One piece of content, unlocked on purchase.'],
                                        ['Memberships', 'A monthly content bundle for your regulars.'],
                                        ['Shop', 'Sell a file, or something you post out.'],
                                        ['Tasks', 'Content made to order, paid up front.'],
                                        ['Piggy Pots', 'One release a group unlocks together.'],
                                        ['Bills', 'Content on a monthly schedule.'],
                                    ] as $i => $module)
                                    <tr>
                                        <td width="104" valign="top"
                                            style="width:104px;padding:{{ $i === 0 ? '6px' : '10px' }} 10px 0 0;
                                                   font-size:14px;font-weight:700;color:#1A1A1A;line-height:20px;">
                                            {{ $module[0] }}
                                        </td>
                                        <td valign="top"
                                            style="padding:{{ $i === 0 ? '6px' : '10px' }} 0 0 0;
                                                   font-size:13px;color:#6A6A6A;line-height:20px;">
                                            {{ $module[1] }}
                                        </td>
                                    </tr>
                                    @endforeach
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            @if ($creditsEnabled && count($creditRungs))
            {{-- ============ THE LADDER — the one bold block ============
                 A genuine sequence, so the amounts themselves act as the markers.
                 Mint is legible here and only here. --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           bgcolor="#0E0E0E"
                           style="background-color:#0E0E0E;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:22px 22px 14px 22px;font-family:'Outfit',Arial,sans-serif;">
                                <div style="font-size:19px;font-weight:800;color:#FFFFFF;line-height:26px;">
                                    Sell enough and your subscription is on us
                                </div>
                                <div style="font-size:13px;color:#A9A9A9;line-height:20px;padding-top:6px;">
                                    Your creator tools are {{ $planPrice }} + VAT a month, and nothing is charged
                                    until your first sale. Keep selling and you stop paying for it.
                                </div>
                            </td>
                        </tr>

                        @foreach ($creditRungs as $rung)
                        <tr>
                            <td style="padding:0 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td height="1" bgcolor="#262626"
                                            style="height:1px;line-height:1px;font-size:1px;
                                                   background-color:#262626;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:13px 22px;font-family:'Outfit',Arial,sans-serif;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td valign="middle" align="left"
                                            style="font-size:21px;font-weight:900;color:#FFFFFF;line-height:26px;">
                                            {{ $rung['amount'] }}
                                        </td>
                                        <td valign="middle" align="right"
                                            style="font-size:14px;font-weight:700;color:#05EFB8;line-height:26px;">
                                            {{ $rung['label'] }}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        @endforeach

                        <tr>
                            <td style="padding:2px 22px 20px 22px;font-family:'Outfit',Arial,sans-serif;
                                       font-size:12px;color:#8A8A8A;line-height:18px;">
                                Measured on settled sales at your listed price, from the day you start.
                                Refunds come back off. Free months are credit against your own subscription,
                                never a cash payout.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- ============ REFERRAL ============ --}}
            <tr>
                <td style="padding:0 0 26px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="border:1px solid #EAEAEA;border-radius:14px;">
                        <tr>
                            <td style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;
                                       font-size:14px;color:#4A4A4A;line-height:21px;">
                                <span style="font-weight:700;color:#1A1A1A;">Bring another creator with you.</span>
                                When someone who signs up on your link reaches {{ $referralThreshold }} in sales,
                                you get {{ $referralReward }}. Your link is on your dashboard.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- ============ PRIMARY ACTION ============ --}}
            <tr>
                <td align="center" style="padding:0 0 22px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;-webkit-border-radius:999px;">
                                <a href="{{ $ctaUrl }}" target="_blank"
                                   style="display:inline-block;padding:15px 40px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#000000;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    Set up my page
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- ============ THE TWO FACTS A NEW CREATOR ASKS FIRST ============
                 What it costs them, and when they get paid. --}}
            <tr>
                <td style="padding:0 0 6px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                        <tr>
                            <td height="1" bgcolor="#EAEAEA"
                                style="height:1px;line-height:1px;font-size:1px;background-color:#EAEAEA;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding:14px 0 0 0;font-family:'Outfit',Arial,sans-serif;font-size:13px;
                           color:#6A6A6A;line-height:21px;">
                    <span style="font-weight:700;color:#1A1A1A;">You set the price, you keep it.</span>
                    Supporters pay one {{ $feeLabel }} fee on top at checkout, and card processing comes out of
                    that — not out of you.
                </td>
            </tr>
            <tr>
                <td style="padding:10px 0 8px 0;font-family:'Outfit',Arial,sans-serif;font-size:13px;
                           color:#6A6A6A;line-height:21px;">
                    <span style="font-weight:700;color:#1A1A1A;">Paid every Friday.</span>
                    Sales run in a Friday-to-Thursday week and that week is paid the Friday after next,
                    so your first payment lands 8 to 14 days after your first sale.
                </td>
            </tr>

            <tr>
                <td style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:14px 0 8px 0;">
                    You are receiving this because you opened a creator account on Spenny Piggy.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
