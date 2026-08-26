{{--
    Discovery Phase 4 — the Monday "Birthdays This Week" campaign.

    🚨 THE BIRTH YEAR IS NEVER DISPLAYED. Each card prints `birthday_label`,
    built from day and month only.

    🚨 Every card's link arrives ALREADY TAGGED as `$creator['url']`
    (`birthdays-this-week`). Never hand-build `?sp_d=` here.

    ⚠️ Content-first, and creator earnings are never shown: a card carries an
    image, a display name, an @username, a short line and "View profile" — the
    five things the brief names, plus the day-and-month birthday.
--}}
@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- ⚠️ A WEEK CHIP, NOT A FLOATING EMOJI — same change as the reminder.
                 A 34px emoji alone in a 68px circle was the largest element above the
                 fold and said nothing; the week these birthdays fall in is the fact
                 the reader needs. Day and month only, never a year. --}}
            <tr>
                <td align="center" style="padding:0 0 16px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="background-color:#FFE6F2;border:2px solid #1A1A1A;border-radius:999px;
                                       -webkit-border-radius:999px;padding:8px 16px;
                                       font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:800;
                                       color:#1A1A1A;letter-spacing:0.06em;text-transform:uppercase;
                                       line-height:18px;white-space:nowrap;">
                                🎂@if (!empty($weekLabel)) &nbsp;{{ $weekLabel }}@endif
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
                    Birthdays this week, <span style="color:#FF007F;">{{ $firstName }}</span>
                </td>
            </tr>

            {{-- Intro. 🚨 The week is a day-and-month range — no year. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    @if (!empty($weekLabel))
                        These creators have a birthday between {{ $weekLabel }}.
                    @else
                        These creators have a birthday this week.
                    @endif
                    Have a look at what they have published.
                </td>
            </tr>

            {{-- The cards. Up to ten, chosen by rotation — never by earnings. --}}
            @if (!empty($creators))
            <tr>
                <td style="padding:0 0 8px 0;">
                    <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;letter-spacing:1px;
                                text-transform:uppercase;color:#9A9A9A;padding-bottom:10px;">
                        Celebrating this week
                    </div>

                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:14px;">
                        @foreach ($creators as $creator)
                        <tr>
                            <td style="padding:14px;{{ $loop->last ? '' : 'border-bottom:1px solid #DDD8DB;' }}">
                                <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%">
                                    <tr>
                                        <td width="52" valign="top" style="width:52px;">
                                            <img src="{{ $creator['avatar_url'] }}" width="52" height="52" alt=""
                                                 style="width:52px;height:52px;border-radius:50%;
                                                        -webkit-border-radius:50%;display:block;border:0;
                                                        object-fit:cover;background-color:#FFE6F2;">
                                        </td>
                                        <td valign="top" style="padding-left:12px;">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                                        font-size:15px;color:#1A1A1A;line-height:20px;">
                                                {{ $creator['name'] }}
                                            </div>
                                            {{-- &#64; not &commat; — see the reminder template. --}}
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                                        color:#9A9A9A;line-height:18px;">
                                                &#64;{{ $creator['username'] }}
                                            </div>

                                            @if (!empty($creator['line']))
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                                        color:#4A4A4A;line-height:19px;padding-top:6px;">
                                                {{ $creator['line'] }}
                                            </div>
                                            @endif

                                            {{-- 🚨 Day and month. Never a year.
                                                 ⚠️ A CHIP, NOT A LOOSE PINK LINE. In a stack of
                                                 near-identical cards the date is the one thing that
                                                 separates them, and as body text it read as a caption
                                                 nobody scans. Black on the pale pink ground, because
                                                 pink type on a pink tint is under AA. --}}
                                            @if (!empty($creator['birthday_label']))
                                            <div style="padding-top:8px;">
                                                <span style="display:inline-block;background-color:#FFE6F2;
                                                             border:2px solid #1A1A1A;border-radius:999px;
                                                             -webkit-border-radius:999px;padding:3px 10px;
                                                             font-family:'Outfit',Arial,sans-serif;font-size:11px;
                                                             font-weight:800;color:#1A1A1A;letter-spacing:0.05em;
                                                             text-transform:uppercase;line-height:16px;">
                                                    {{ $creator['birthday_label'] }}
                                                </span>
                                            </div>
                                            @endif

                                            @if (!empty($creator['url']))
                                            <div style="padding-top:8px;">
                                                <a href="{{ $creator['url'] }}" target="_blank"
                                                   style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                                          font-weight:700;color:#FF007F;text-decoration:none;">
                                                    View profile &rsaquo;
                                                </a>
                                            </div>
                                            @endif
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        @endforeach
                    </table>
                </td>
            </tr>
            @endif

            {{-- Final CTA, exactly as the brief names it. --}}
            <tr>
                <td align="center" style="padding:24px 0 22px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border:2px solid #1A1A1A;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $collectionUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#1A1A1A;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    Discover more birthdays
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Footnote. 🚨 A working, signed unsubscribe on day one. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You are receiving this because you have an account on Spenny Piggy.
                    @if ($unsubscribeUrl)
                    <br>
                    <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Turn off birthday emails
                    </a>
                    @endif
                    @if (! empty($preferencesUrl))
                    <br>
                    <a href="{{ $preferencesUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Choose what you hear from us
                    </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
