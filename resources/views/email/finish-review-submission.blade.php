@extends('email.default-2')
@section('content')
{{--
    "Your profile is submitted, one thing is missing" reminder.

    Content-first copy only: no gift/tip/donation/bill wording. Use &#64; for @.

    Names WHY the profile was last turned down (when it was) and WHAT is still
    missing — one without the other sends the creator to fix the wrong thing.
--}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFF6D6"
                                style="width:68px;height:68px;background-color:#FFF6D6;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                📋
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
                    One step left, {{ $creatorName }}
                </td>
            </tr>

            {{-- Intro: what is true, then what is missing --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 12px 0;text-align:center;">
                    You sent your profile for review, and it is still waiting on one thing from you.
                    We cannot start the review until you add {{ $missingSentence }}.
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    Add it and your profile goes to the team on its own — there is nothing to submit again.
                </td>
            </tr>

            {{-- WHY it was turned down last time, when it was (7 Sep 2026). Named so the
                 creator fixes the thing that was wrong, not only the thing that is missing. --}}
            @if (! empty($rejectReason))
            <tr>
                <td style="padding:0 0 12px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FFF6D6;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:6px;">
                                    Last time your profile was turned down because
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#4A4A4A;line-height:20px;">
                                    {{ $rejectReason }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

            {{-- WHAT is still outstanding, listed --}}
            <tr>
                <td style="padding:0 0 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:8px;">
                                    Still to add
                                </div>
                                @foreach ($missing as $item)
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#666666;line-height:20px;">
                                    &bull; {{ ucfirst($item) }}
                                </div>
                                @endforeach
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Primary action --}}
            <tr>
                <td align="center" style="padding:24px 0 24px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            {{-- Black type on brand pink: white measures 3.78:1 and fails AA. --}}
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $actionUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#000000;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    {{ $actionLabel }}
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Footnote --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You are receiving this because you sent your Spenny Piggy profile for review and it is still waiting on you.
                    @if ($unsubscribeUrl)
                    <br>
                    <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Unsubscribe from creator updates
                    </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
