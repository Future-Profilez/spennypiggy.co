{{--
    Growth Bonus — an outcome that is not a milestone.

    🚨 THE HEADLINE AND MESSAGE ARE PASSED IN, NOT WRITTEN HERE. They are the same
    strings the push and the bell carry (GrowthBonusService::notifyOutcome), so the
    three surfaces cannot say different things about the same outcome.

    🚨 TRANSACTIONAL — no unsubscribe footer by design. It reports the state of the
    creator's own account in a programme they were enrolled in.

    ⚠️ Only `window_closing` carries a button. Sending someone to "see your
    milestones" under "your window has closed" walks them to a page that repeats
    the bad news.
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
                            <td align="center" valign="middle"
                                bgcolor="{{ $actionable ? '#E9E1FF' : '#F1EFF4' }}"
                                style="width:68px;height:68px;background-color:{{ $actionable ? '#E9E1FF' : '#F1EFF4' }};
                                       border-radius:50%;-webkit-border-radius:50%;text-align:center;
                                       font-size:34px;line-height:68px;">
                                {{ $actionable ? '⏳' : '🐷' }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:21px;color:#1A1A1A;
                           line-height:29px;padding:0 0 10px 0;text-align:center;">
                    {{ $headline }}
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#4A4A4A;
                           line-height:24px;padding:0 0 22px 0;text-align:center;">
                    Hi {{ ucwords($creator->name) }} — {{ $message }}
                </td>
            </tr>

            @if ($actionable)
                <tr>
                    <td align="center" style="padding:0 0 8px 0;">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                            <tr>
                                <td align="center" bgcolor="#8C52FF"
                                    style="background-color:#8C52FF;border-radius:999px;">
                                    <a href="{{ rtrim(config('app.url'), '/') }}/growth-bonus"
                                       style="display:inline-block;padding:13px 28px;font-family:'Outfit',Arial,sans-serif;
                                              font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">
                                        See what you need
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @else
                {{-- ⚠️ No button, but the account is not in trouble and the mail
                     should not read as though it is. --}}
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#7A7A7A;
                               line-height:22px;padding:0 0 8px 0;text-align:center;">
                        Your listings, payouts and everything else carry on exactly as before.
                    </td>
                </tr>
            @endif

        </table>
    </td>
</tr>
@endsection
