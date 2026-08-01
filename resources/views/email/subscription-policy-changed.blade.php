@extends('email.default-2')
@section('content')
{{--
    Announcement: the creator subscription is no longer charged until first sale.

    Uses the house layout (Outfit, 480px white card, pink #FF007F action) rather
    than a standalone document — a one-off announcement that looks nothing like
    every other email from the platform reads as a phishing attempt.

    A change email has one job: show the before and the after. The two-column
    comparison is the hero for that reason, not the new rule on its own.

    Content-first copy only: no tip/donation/fundraise wording.
--}}
@php
    $price = $plan['price_formatted'] ?? '£8.99';
    $total = $plan['total_formatted'] ?? '£10.79';
    $variant = $variant ?? 'none';
    $isBilling = $variant === \App\Mail\SubscriptionPolicyChanged::VARIANT_BILLING;
    $isFreePeriod = $variant === \App\Mail\SubscriptionPolicyChanged::VARIANT_FREE_PERIOD;
    $font = "'Outfit',Arial,sans-serif";
@endphp
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#E6F6EC"
                                style="width:68px;height:68px;background-color:#E6F6EC;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🎉
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Eyebrow --}}
            <tr>
                <td align="center"
                    style="font-family:{{ $font }};font-size:12px;letter-spacing:1px;text-transform:uppercase;
                           color:#FF007F;font-weight:700;padding:0 0 8px 0;text-align:center;">
                    What&rsquo;s changed
                </td>
            </tr>

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:{{ $font }};font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    @if ($isBilling)
                        Creators are no longer charged before they earn
                    @else
                        You&rsquo;re no longer charged before you earn
                    @endif
                </td>
            </tr>

            {{-- Intro --}}
            <tr>
                <td align="center"
                    style="font-family:{{ $font }};font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    Hi {{ $creatorName ?: 'there' }},
                    @if ($isBilling)
                        we&rsquo;ve changed when the creator subscription is first charged. Here is the difference.
                    @elseif ($isFreePeriod)
                        we&rsquo;ve changed when your subscription is first charged. Your card is already on file,
                        so here is what it means for you.
                    @else
                        we&rsquo;ve changed when the creator subscription is first charged. Here is the difference.
                    @endif
                </td>
            </tr>

            {{-- ── The change, as a change ─────────────────────────────────── --}}
            <tr>
                <td style="padding:0 0 8px 0;">
                    <div style="font-family:{{ $font }};font-size:12px;letter-spacing:1px;
                                text-transform:uppercase;color:#9A9A9A;padding-bottom:10px;">
                        Before and after
                    </div>

                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                        <tr>
                            {{-- Before --}}
                            <td width="48%" valign="top" bgcolor="#FAF7F9"
                                style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;padding:16px 14px;">
                                <div style="font-family:{{ $font }};font-size:11px;letter-spacing:1px;
                                            text-transform:uppercase;color:#B0AAB4;padding-bottom:8px;">
                                    Before
                                </div>
                                <div style="font-family:{{ $font }};font-weight:700;font-size:13px;color:#B0AAB4;
                                            text-decoration:line-through;padding-bottom:4px;">
                                    Charged on day 3
                                </div>
                                <div style="font-family:{{ $font }};font-weight:800;font-size:24px;color:#B0AAB4;
                                            text-decoration:line-through;line-height:30px;padding-bottom:6px;">
                                    {{ $total }}
                                </div>
                                <div style="font-family:{{ $font }};font-size:11px;color:#B0AAB4;line-height:16px;">
                                    Before you had earned anything
                                </div>
                            </td>

                            <td width="4%">&nbsp;</td>

                            {{-- Now --}}
                            <td width="48%" valign="top" bgcolor="#E6F6EC"
                                style="background-color:#E6F6EC;border-radius:14px;border:1px solid #A2E4B8;padding:16px 14px;">
                                <div style="font-family:{{ $font }};font-size:11px;letter-spacing:1px;
                                            text-transform:uppercase;color:#1A1A1A;padding-bottom:8px;">
                                    Now
                                </div>
                                <div style="font-family:{{ $font }};font-weight:700;font-size:13px;color:#1A1A1A;padding-bottom:4px;">
                                    Charged after your first sale
                                </div>
                                <div style="font-family:{{ $font }};font-weight:800;font-size:24px;color:#1A1A1A;
                                            line-height:30px;padding-bottom:6px;">
                                    £0.00
                                </div>
                                <div style="font-family:{{ $font }};font-size:11px;color:#3D6B4E;line-height:16px;">
                                    Nothing leaves your account today
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- What it means, in the reader's terms --}}
            <tr>
                <td style="padding:22px 0 8px 0;">
                    <div style="font-family:{{ $font }};font-size:12px;letter-spacing:1px;
                                text-transform:uppercase;color:#9A9A9A;padding-bottom:10px;">
                        What this means for you
                    </div>

                    @php
                        $points = $isBilling
                            ? [
                                ['✅', 'Your subscription carries on exactly as it is — same price, same date.'],
                                ['🙌', 'There is nothing for you to do.'],
                                ['💬', 'We wanted you to hear it from us rather than spot it on the site.'],
                            ]
                            : [
                                ['💳', 'Nothing is charged today, or at any point before your first sale.'],
                                ['📈', $price.' + VAT a month starts only once you have sold something.'],
                                ['🔓', 'If you never make a sale, you never pay. Cancel any time, no exit fee.'],
                            ];
                    @endphp

                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                @foreach ($points as $i => $point)
                                    <div style="font-family:{{ $font }};font-size:13px;color:#1A1A1A;line-height:20px;
                                                {{ $i < count($points) - 1 ? 'padding-bottom:12px;' : '' }}">
                                        {{ $point[0] }}&nbsp; {{ $point[1] }}
                                    </div>
                                @endforeach
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            @if ($showCta ?? false)
                {{-- Primary action --}}
                <tr>
                    <td align="center" style="padding:24px 0 8px 0;">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                            <tr>
                                <td align="center" bgcolor="#FF007F"
                                    style="background-color:#FF007F;border-radius:999px;-webkit-border-radius:999px;">
                                    <a href="{{ $ctaUrl }}" target="_blank"
                                       style="display:inline-block;padding:14px 34px;font-family:{{ $font }};
                                              font-weight:800;font-size:15px;color:#FFFFFF;text-decoration:none;
                                              border-radius:999px;-webkit-border-radius:999px;">
                                        Add your card and start selling
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @endif

            {{-- Footnote --}}
            <tr>
                <td align="center"
                    style="font-family:{{ $font }};font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:16px 0 8px 0;text-align:center;">
                    {{-- ⚠️ The layout footer already carries a generic "Unsubscribe", but that one
                         is the MARKETING opt-out and would not stop this email — the command sends
                         via sendCategoryEmail(..., 'creator_updates_enabled'), so only the category
                         link below actually does what a reader expects. Labelled distinctly so the
                         two do not read as the same control. --}}
                    You are receiving this because you have a creator account on Spenny Piggy.
                    @if ($unsubscribeUrl)
                        <br>
                        <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                            Turn off creator updates
                        </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
