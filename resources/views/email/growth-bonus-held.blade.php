{{--
    Growth Bonus — on hold, with the reason and the way out.

    🚨 THE REASON IS PASSED IN, derived from a stored CODE by
    `GrowthBonusService::holdMessage()`. Never write a cause here: the email, the
    push and the dashboard must say the same sentence about the same hold.

    🚨 IT MUST STATE THE WAY OUT. A hold with no route reads as a refusal, and
    this one clears itself the moment the milestone is covered again.

    ⚠️ Amber, never red. Nothing has been taken away and nobody said no — the
    money is still owed. Red is what this platform uses when a person refuses.

    🚨 TRANSACTIONAL — no unsubscribe footer by design.
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
                            <td align="center" valign="middle" bgcolor="#F7EFC9"
                                style="width:68px;height:68px;background-color:#F7EFC9;
                                       border-radius:50%;-webkit-border-radius:50%;text-align:center;
                                       font-size:34px;line-height:68px;">
                                ⏳
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:21px;color:#1A1A1A;
                           line-height:29px;padding:0 0 10px 0;text-align:center;">
                    Your {{ $rewardLabel }} Growth Bonus is on hold
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 20px 0;text-align:center;">
                    Hi {{ ucwords($creator->name) }} — {{ $reasonText }}
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 20px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%"
                           style="border:2px solid #000000;border-radius:16px;">
                        <tr>
                            <td align="center" style="padding:16px 18px;">
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;
                                            text-transform:uppercase;letter-spacing:1.4px;color:#6A6A6A;
                                            padding-bottom:6px;">
                                    The milestone
                                </div>
                                <div style="font-family:'Outfit',Arial,sans-serif;font-size:22px;font-weight:800;
                                            color:#1A1A1A;line-height:28px;">
                                    {{ $milestoneLabel }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- 🚨 The way out. Without this the mail reads as a refusal. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7A7A7A;
                           line-height:21px;padding:0 0 20px 0;text-align:center;">
                    Nothing is lost and you do not need to do anything. We check again every
                    week, and the bonus goes out on the next payout day once it clears.
                </td>
            </tr>

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
