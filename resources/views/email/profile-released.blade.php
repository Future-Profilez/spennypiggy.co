@extends('email.default-2')
@section('content')
{{--
    Sent by `profiles:release-historic` (client D6: "notify released creators by email").

    🚨 IT NEVER MENTIONS A REVIEW QUEUE. These creators were turned down under a process
    that no longer exists; telling them "we have re-reviewed you" describes a thing that
    did not happen and invites the question of who looked. It says what is true: pages
    publish themselves now, and theirs is open.

    ⚠️ TWO CASES, and they must not be merged — `$isLive` false means the creator still
    has something to do, and telling that group their page is live sends them away.

    ⚠️ Content-first copy: no gift/tip/donation/bill wording, and no earnings figure.
--}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#A2E4B8"
                                style="width:68px;height:68px;background-color:#A2E4B8;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🐷
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    @if ($isLive)
                        Your page is live{{ $creatorName !== '' ? ', '.$creatorName : '' }}
                    @else
                        Your page is open again{{ $creatorName !== '' ? ', '.$creatorName : '' }}
                    @endif
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#555555;padding:0 0 18px 0;">
                    @if ($isLive)
                        We have changed how Spenny Piggy works: pages now go live as soon as they
                        are saved. Yours is published — supporters can find it and buy from it today.
                    @else
                        We have changed how Spenny Piggy works: pages now go live as soon as they
                        are saved, with no approval to wait for. Your account is no longer held —
                        open your page, finish the last details and it publishes itself.
                    @endif
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 22px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:12px;">
                                <a href="{{ $profileUrl }}"
                                   style="display:inline-block;padding:14px 28px;font-family:'Outfit',Arial,sans-serif;
                                          font-weight:800;font-size:15px;color:#000000;text-decoration:none;">
                                    @if ($isLive) See your page @else Open your page @endif
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#777777;padding:0 0 8px 0;">
                    One thing worth knowing: your details need to be real. Accounts built on fake
                    or copied details are removed.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
