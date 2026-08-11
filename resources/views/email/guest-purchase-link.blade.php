@extends('email.default-2')
@section('content')
{{--
    The link back to a guest's own purchases.

    Transactional — this is about content already paid for, so it carries no
    unsubscribe and no marketing copy. Content-first wording only: no gift, tip,
    donation or fundraising language, and never the reward body itself, which is the
    paid content and lives behind the link.
--}}
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🔑
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;
                           font-size:24px;line-height:30px;font-weight:bold;color:#111111;">
                    Here are your purchases
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;
                           font-size:15px;line-height:23px;color:#444444;">
                    You bought content on Spenny Piggy without creating an account.
                    Open the link below to see everything you have bought and to get
                    your content again.
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 20px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;border-radius:26px;">
                                <a href="{{ $link }}"
                                   style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;
                                          font-size:16px;line-height:20px;font-weight:bold;color:#ffffff;
                                          text-decoration:none;border-radius:26px;">
                                    View my purchases
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;
                           font-size:13px;line-height:20px;color:#777777;">
                    This link works for {{ $expiresInDays }} days and only from this email.
                    Do not forward it — anyone with the link can see your purchases.
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;
                           font-size:13px;line-height:20px;color:#777777;">
                    If you did not ask for this, you can ignore it. Nothing has changed
                    on your purchases.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
