{{--
    Creator Growth Bonus — a milestone was reached.

    🚨 TRANSACTIONAL. This is money the creator has earned, so it carries NO
    unsubscribe footer by design — the shared layout only draws one when the mail
    supplies `unsubscribeUrl`, and this one deliberately does not.

    ⚠️ The milestone is the creator's LISTED SALE VALUE — a £100 listing counts as
    £100 (terms clause 2.1). It was gross customer spend until 26 Aug 2026, which
    is why this template used to avoid "earnings". This is the one message that
    states the threshold directly, so it uses the terms' defined term.

    ⚠️ NEVER NAME A PAYOUT DAY. The bonus rides the payout run carrying the sale
    that crossed the milestone, so it lands 7–13 days later depending on the
    weekday (client rule, 26 Aug 2026).
--}}
@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#E9E1FF"
                                style="width:68px;height:68px;background-color:#E9E1FF;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🎯
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
                    Nice one, <span style="color:#8C52FF;">{{ ucwords($creator->name) }}</span>! 🐷
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 22px 0;text-align:center;">
                    You have passed <strong>{{ $symbol }}{{ number_format($milestoneGmv, 0) }}</strong> in
                    qualifying earnings and unlocked a
                    <strong>{{ $symbol }}{{ number_format($rewardAmount, 0) }}</strong> Growth Bonus.
                </td>
            </tr>

            {{-- The sum --}}
            <tr>
                <td style="padding:0 0 22px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                           style="border:2px solid #1A1A1A;border-radius:14px;">
                        <tr>
                            <td style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                       color:#4A4A4A;line-height:20px;">
                                Milestone reached
                            </td>
                            <td align="right" style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;
                                       font-size:16px;font-weight:800;color:#1A1A1A;">
                                {{ $symbol }}{{ number_format($milestoneGmv, 0) }}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border-top:2px solid #1A1A1A;font-size:0;line-height:0;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                       color:#4A4A4A;line-height:20px;">
                                Bonus unlocked
                            </td>
                            <td align="right" style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;
                                       font-size:20px;font-weight:800;color:#8C52FF;">
                                {{ $symbol }}{{ number_format($rewardAmount, 0) }}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="border-top:2px solid #1A1A1A;font-size:0;line-height:0;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;font-size:13px;
                                       color:#4A4A4A;line-height:20px;">
                                Earned so far
                            </td>
                            <td align="right" style="padding:16px 18px;font-family:'Outfit',Arial,sans-serif;
                                       font-size:16px;font-weight:800;color:#1A1A1A;">
                                {{ $symbol }}{{ number_format($earnedTotal, 0) }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- ⚠️ NO DAY IS NAMED. See the docblock above. --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4A4A4A;
                           line-height:22px;padding:0 0 20px 0;text-align:center;">
                    It will be paid on the same payout as the sales that qualified you,
                    once those sales have cleared their usual 7-day wait. There is
                    nothing to claim.
                </td>
            </tr>

            @if ($nextMilestone && $nextReward)
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4A4A4A;
                               line-height:22px;padding:0 0 22px 0;text-align:center;">
                        Next up: <strong>{{ $symbol }}{{ number_format($nextMilestone, 0) }}</strong> in
                        qualifying earnings unlocks another
                        <strong>{{ $symbol }}{{ number_format($nextReward, 0) }}</strong>.
                    </td>
                </tr>
            @else
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#4A4A4A;
                               line-height:22px;padding:0 0 22px 0;text-align:center;">
                        That is every milestone — you have earned the full
                        {{ $symbol }}{{ number_format($maxTotal, 0) }}.
                    </td>
                </tr>
            @endif

            {{-- CTA --}}
            <tr>
                <td align="center" style="padding:0 0 8px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#8C52FF"
                                style="background-color:#8C52FF;border-radius:999px;">
                                <a href="{{ rtrim(config('app.url'), '/') }}/growth-bonus"
                                   style="display:inline-block;padding:13px 28px;font-family:'Outfit',Arial,sans-serif;
                                          font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">
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
