@extends('email.default-2')
@section('content')
{{--
    "We can't confirm your phone alerts are still on."

    🚨 THE COPY MUST NEVER SAY PUSH IS BROKEN. A web-push subscription lives in the
    browser and at MagicBell, so a stale heartbeat means we have not been able to
    CONFIRM it — not that it stopped. Claiming the stronger version tells a creator
    their notifications are dead when they may be arriving fine, and one wrong
    email of this kind is enough for every later one to be ignored.

    Content-first copy only: no gift/tip/donation/fundraise wording. Use &#64; for @.
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
                                🔔
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
                    Are your phone alerts still on, {{ $creatorName }}?
                </td>
            </tr>

            {{-- Intro. Note the careful claim: we cannot CONFIRM, we do not assert. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    Your phone alerts may still be working perfectly — but we haven't been able to check them
                    for over {{ $days }} days, because your browser only tells us while you're signed in.
                    Emails like this one keep arriving either way.
                </td>
            </tr>

            {{-- What to do, and why it is worth doing --}}
            <tr>
                <td style="padding:0 0 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:4px;">
                                    📲 Takes about ten seconds
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#666666;line-height:18px;padding-bottom:12px;">
                                    Sign in on your phone. If alerts need turning back on, you'll see a prompt at the
                                    top of the page — tap it and you're done.
                                </div>

                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:4px;">
                                    ⚡ What you'd otherwise wait an email for
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#666666;line-height:18px;">
                                    A sale landing, a payout arriving, an item cleared for sale, or a supporter
                                    waiting on something from you.
                                </div>
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
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $dashboardUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#FFFFFF;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    Open Spenny Piggy
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
                    You're getting this because we haven't been able to confirm your phone alerts for a while.
                    @if ($unsubscribeUrl)
                    <br>
                    <a href="{{ $unsubscribeUrl }}" target="_blank" style="color:#9A9A9A;text-decoration:underline;">
                        Turn off phone alerts and stop these checks
                    </a>
                    @endif
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
