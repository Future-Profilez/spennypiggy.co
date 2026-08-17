@extends('email.default-2')
@section('content')
{{--
    "Creator sign-ups are open again."

    Sent ONCE, to somebody with no account — they were refused one while the
    platform had paused new creator registrations, and left this address so they
    would not have to keep checking.

    🚨 The copy must not describe WHY sign-ups were paused. The reason is a
    platform risk state, and naming it to somebody outside the company is both
    useless to them and a signal we do not publish. "We paused, we've reopened,
    here is the link" is the whole message.

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
                            <td align="center" valign="middle" bgcolor="#E6FFF7"
                                style="width:68px;height:68px;background-color:#E6FFF7;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🐷
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
                    You can create your account now
                </td>
            </tr>

            {{-- Intro --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 24px 0;text-align:center;">
                    You asked us to let you know when creator sign-ups reopened. They have —
                    so your spot is ready whenever you are.
                </td>
            </tr>

            {{-- What happens next --}}
            <tr>
                <td style="padding:0 0 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:4px;">
                                    ⏱ A few minutes to set up
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#666666;line-height:18px;padding-bottom:12px;">
                                    Pick a username, add a photo and a short bio, and our team reviews your
                                    profile before it goes live.
                                </div>

                                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;color:#1A1A1A;padding-bottom:4px;">
                                    💷 Nothing to pay to get started
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#666666;line-height:18px;">
                                    You are not charged for your Spenny Piggy plan until you make your first sale.
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
                                {{-- Black on brand pink: white measures 3.78:1 and fails AA at this size. --}}
                                <a href="{{ $registerUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#000000;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    Create my account
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Footnote. No unsubscribe link: this is the ONLY email this address
                 will ever receive, and offering to stop a list of one is noise. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:20px;padding:0 0 8px 0;text-align:center;">
                    You're getting this one email because you asked to be told when sign-ups reopened.
                    We won't email you again unless you create an account.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
