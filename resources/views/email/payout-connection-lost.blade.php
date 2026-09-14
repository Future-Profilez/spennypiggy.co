@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFF4D6"
                                style="width:56px;height:56px;border-radius:28px;font-size:26px;line-height:56px;">
                                🏦
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:bold;color:#111111;padding:0 0 12px 0;">
                    Reconnect Stripe to receive your payouts
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#555555;padding:0 0 18px 0;">
                    @if ($creatorName !== '')Hi {{ $creatorName }},@endif
                    Stripe is no longer letting us reach your payout account, so we cannot send you money you have earned.
                </td>
            </tr>

            {{-- ⚠️ Says what it IS, never what they did. The platform cannot tell
                 a creator who disconnected us on purpose from an account Stripe
                 itself closed, and guessing would accuse somebody who did
                 nothing. --}}
            <tr>
                <td style="padding:0 0 20px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF9EC" style="border-radius:12px;">
                        <tr>
                            <td
                                style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#7A5B00;padding:16px 18px;">
                                This usually means the Spenny Piggy connection was removed from your Stripe account, or Stripe closed it. Everything else about your account is working — your page is live and supporters can still buy from you. Only the payout is stopped.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- 🚨 BLACK ON PINK. Measured: white on #FF007F is 3.78:1 and fails
                 AA at label size; black is 5.56:1. House rule, every surface. --}}
            <tr>
                <td align="center" style="padding:0 0 24px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F" style="border-radius:26px;">
                                <a href="{{ $reconnectUrl }}"
                                    style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#000000;text-decoration:none;border-radius:26px;">
                                    Reconnect Stripe
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#888888;padding:0 0 8px 0;">
                    Nothing you have earned is lost — it waits until the connection is back. If you think this is wrong, reply to this email and a person will look.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
