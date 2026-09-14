@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:460px;width:100%;">

            {{-- ⚠️ AMBER, NOT RED, AND THAT IS THE WHOLE POINT OF THE REDESIGN.
                 Nothing is broken and nothing was blocked — the platform noticed
                 one account and a person decides what happens. The first version
                 was a bare red-barred paragraph and admins read it as an outage. --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFF4D6"
                                style="width:56px;height:56px;border-radius:28px;font-size:26px;line-height:56px;">
                                🚩
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:bold;color:#111111;padding:0 0 6px 0;">
                    {{ $flagLabel }}
                </td>
            </tr>

            {{-- 🚨 WHO. "#203" is not a person, and an admin could not act on it. --}}
            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#555555;padding:0 0 20px 0;">
                    @if ($username !== '')
                        <strong style="color:#111111;">&#64;{{ $username }}</strong> &nbsp;·&nbsp; account #{{ $userId }}
                    @else
                        Account #{{ $userId }}
                    @endif
                </td>
            </tr>

            {{-- WHAT IT MEANS — read from config/user_flags.php, so this mail and
                 the admin screen cannot describe the same flag differently. --}}
            @if (trim($meaning) !== '')
                <tr>
                    <td style="padding:0 0 16px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                            bgcolor="#FFF9EC" style="border-radius:12px;">
                            <tr>
                                <td
                                    style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#7A5B00;padding:16px 18px;">
                                    <span style="font-weight:bold;">What this means</span><br>
                                    {{ $meaning }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @endif

            {{-- ⚠️ Only when it adds something. The reason is often a shorter
                 restatement of the meaning above, and printing both makes the
                 mail read as though two separate things happened. --}}
            @if (trim($reason) !== '' && trim($reason) !== trim($meaning))
                <tr>
                    <td style="padding:0 0 16px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                            bgcolor="#F6F6F7" style="border-radius:12px;">
                            <tr>
                                <td
                                    style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#444444;padding:16px 18px;">
                                    <span style="font-weight:bold;">What we recorded</span><br>
                                    {{ $reason }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @endif

            @if (trim($action) !== '')
                <tr>
                    <td style="padding:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#333333;">
                        <span style="font-weight:bold;color:#111111;">What to do</span><br>
                        {{ $action }}
                    </td>
                </tr>
            @endif

            {{-- 🚨 BLACK ON PINK — white on #FF007F is 3.78:1 and fails AA. --}}
            <tr>
                <td align="center" style="padding:0 0 12px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F" style="border-radius:26px;">
                                <a href="{{ $accountUrl }}"
                                    style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#000000;text-decoration:none;border-radius:26px;">
                                    Open this account
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#888888;padding:0 0 8px 0;">
                    Nothing was blocked automatically — a flag is something the platform noticed, not a decision.
                    <a href="{{ $flagsUrl }}" style="color:#888888;">See all flagged accounts</a>
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
