{{--
    Growth Bonus — approved, with the date it will be sent.

    🚨 THE DATE IS PASSED IN FROM THE REWARD ROW. Never compute "next Friday"
    here: the creator reads this date and the payer acts on the stored one, and
    two calculations are two chances to name different days.

    🚨 "SENT", NEVER "IN YOUR BANK". We decide when the transfer leaves; the bank
    decides when it lands.

    ⚠️ A null date means the payout is switched off or the account cannot receive
    yet — the whole line is dropped rather than guessed at.

    🚨 TRANSACTIONAL — no unsubscribe footer by design. It reports money owed.
--}}
@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#D8F7EC"
                                style="width:68px;height:68px;background-color:#D8F7EC;
                                       border-radius:50%;-webkit-border-radius:50%;text-align:center;
                                       font-size:34px;line-height:68px;">
                                🐷
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:21px;color:#1A1A1A;
                           line-height:29px;padding:0 0 10px 0;text-align:center;">
                    Your {{ $rewardLabel }} Growth Bonus is approved
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 20px 0;text-align:center;">
                    Hi {{ ucwords($creator->name) }} — we have checked the milestone you passed at
                    {{ $milestoneLabel }} in qualifying earnings, and your bonus is cleared for payment.
                </td>
            </tr>

            @if ($scheduledLabel)
                <tr>
                    <td align="center" style="padding:0 0 20px 0;">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%"
                               style="border:2px solid #000000;border-radius:16px;">
                            <tr>
                                <td align="center" style="padding:16px 18px;">
                                    <div style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;
                                                text-transform:uppercase;letter-spacing:1.4px;color:#6A6A6A;
                                                padding-bottom:6px;">
                                        We send it on
                                    </div>
                                    <div style="font-family:'Outfit',Arial,sans-serif;font-size:22px;font-weight:800;
                                                color:#1A1A1A;line-height:28px;">
                                        {{ $scheduledLabel }}
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7A7A7A;
                               line-height:21px;padding:0 0 20px 0;text-align:center;">
                        {{-- 🚨 The bank's timing is not ours to promise. --}}
                        That is the day it leaves us. How quickly it reaches your account after
                        that is up to your bank.
                    </td>
                </tr>
            @else
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7A7A7A;
                               line-height:21px;padding:0 0 20px 0;text-align:center;">
                        We will send it with your next payout. You will get a message when it is on
                        its way.
                    </td>
                </tr>
            @endif

            <tr>
                <td align="center" style="padding:0 0 8px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            {{-- Black on brand pink, per the house contrast rule. --}}
                            <td align="center" bgcolor="#FF007F" style="background-color:#FF007F;border-radius:999px;">
                                <a href="{{ rtrim(config('app.url'), '/') }}/growth-bonus"
                                   style="display:inline-block;padding:13px 28px;font-family:'Outfit',Arial,sans-serif;
                                          font-size:15px;font-weight:700;color:#000000;text-decoration:none;">
                                    See your milestones
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
