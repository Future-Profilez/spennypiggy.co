@extends('email.default-2')
@section('content')
{{--
    "Your account can sell now" — sent once, when a gifter converts their own
    account into a creator account.

    🚨 TRANSACTIONAL. It states what changed about the reader's own account and
    carries NO unsubscribe link, deliberately — see App\Mail\CreatorAccountOpened.
    The shared layout only appends its own footer pair when the mail supplies an
    `unsubscribeUrl`, so leaving that variable unset is what keeps it off.

    ⚠️ It does NOT list the setup steps. `email.finish-setup` owns that copy and
    reads it from CreatorJourneyService::STEPS; a second list here is how the two
    drift and then say different things.

    Content-first copy only: no gift/tip/donation/fundraise/bill wording.
    Use &#64; for @.

    ⚠️ Black type on the pink button, not white. #FF007F is mid-luminance: white
    is 3.78:1 (fails AA at label size), black is 5.56:1. House rule, both apps.
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
                                🎉
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
                    Your account is a creator account
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 20px 0;text-align:center;">
                    Hi {{ $creatorName }} — you can list content, memberships and requests from this account now.
                </td>
            </tr>

            {{-- What changed. The review is the one fact they cannot see from an
                 inbox, and the one most likely to look like something went wrong. --}}
            <tr>
                <td style="padding:0 0 4px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="background-color:#FAF7F9;border-radius:14px;border:1px solid #EAEAEA;">
                        <tr>
                            <td style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;font-size:14px;
                                       color:#4A4A4A;line-height:22px;">
                                @if ($reviewingAssets)
                                    Your profile photo and bio have gone to our review team, because a creator page is checked before it can sell. Nothing was deleted — they are still on your page exactly as you left them.
                                @else
                                    Add a profile photo and a short bio next. A creator page is checked before it can sell, so those two go to our review team once you save them.
                                @endif
                                <br><br>
                                Everything you have bought stays with this account — your purchases, your subscriptions and your saved items are exactly where they were.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Primary action --}}
            <tr>
                <td align="center" style="padding:24px 0 20px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:999px;
                                       -webkit-border-radius:999px;">
                                <a href="{{ $ctaUrl }}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#000000;text-decoration:none;
                                          border-radius:999px;-webkit-border-radius:999px;">
                                    Open my page
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
                    You are receiving this because you turned this account into a creator account on Spenny Piggy.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
