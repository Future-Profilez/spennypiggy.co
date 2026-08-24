{{--
    Discovery Phase 4 — the 7-day / 1-day / on-the-day birthday reminder.

    🚨 THE BIRTH YEAR IS NEVER DISPLAYED. This view prints `birthday_label`,
    which the service builds from day and month only. There is no date object
    here and no year in the payload to format.

    🚨 The profile link comes in ALREADY TAGGED as `$creator['url']`
    (`birthday-reminder`). Never hand-build `?sp_d=` in a template: an
    unrecognised key is dropped in silence and looks exactly like a link that
    works, while the visit it produces is invisible for ever.

    ⚠️ Content-first: no gift, tip, donation, present or fundraising wording
    anywhere on this page, and no creator earnings.
--}}
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
                                {{ $emoji }}
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
                    {{ $heading }}, <span style="color:#FF007F;">{{ $firstName }}</span>
                </td>
            </tr>

            {{-- Intro --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    {{ $intro }}
                </td>
            </tr>

            {{-- The creator card: image, display name, @username, short line, View profile. --}}
            @if (!empty($creator) && !empty($creator['username']))
            <tr>
                <td style="padding:0 0 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;">
                        <tr>
                            <td style="padding:16px;">
                                <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%">
                                    <tr>
                                        <td width="60" valign="middle" style="width:60px;">
                                            <img src="{{ $creator['avatar_url'] }}" width="56" height="56" alt=""
                                                 style="width:56px;height:56px;border-radius:50%;
                                                        -webkit-border-radius:50%;display:block;border:0;
                                                        object-fit:cover;background-color:#FFE6F2;">
                                        </td>
                                        <td valign="middle" style="padding-left:14px;">
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                                        font-size:17px;color:#1A1A1A;line-height:22px;">
                                                {{ $creator['name'] }}
                                            </div>
                                            {{-- &#64; not &commat;: the named entity is HTML5-only
                                                 and several mail clients print it as literal text. --}}
                                            <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                                        color:#9A9A9A;line-height:18px;">
                                                &#64;{{ $creator['username'] }}
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                @if (!empty($creator['line']))
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4A4A4A;
                                            line-height:21px;padding-top:12px;">
                                    {{ $creator['line'] }}
                                </div>
                                @endif

                                {{-- 🚨 Day and month. Never a year. --}}
                                @if (!empty($creator['birthday_label']))
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;
                                            color:#FF007F;line-height:20px;padding-top:10px;">
                                    Birthday &middot; {{ $creator['birthday_label'] }}
                                </div>
                                @endif

                                @if (!empty($creator['url']))
                                <div style="padding-top:14px;">
                                    <a href="{{ $creator['url'] }}" target="_blank"
                                       style="font-family:'Outfit',Arial,sans-serif;font-size:14px;
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
            @endif

            {{-- Primary action --}}
            @if (!empty($creator['url']))
            <tr>
                <td align="center" style="padding:24px 0 12px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $creator['url'] }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#FFFFFF;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    See their profile
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- Secondary action — the birthday collection. --}}
            <tr>
                <td align="center" style="padding:0 0 22px 0;">
                    <a href="{{ $collectionUrl }}" target="_blank"
                       style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:600;
                              color:#7A7A7A;text-decoration:underline;">
                        Discover more birthdays
                    </a>
                </td>
            </tr>

            {{-- Footnote: says plainly why this arrived and how to stop it.
                 🚨 The unsubscribe is CATEGORY-SPECIFIC — it turns off BIRTHDAY
                 email and nothing else. The second link opens the full
                 preference centre, which needs no login. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You are receiving this because you support this creator on Spenny Piggy.
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
