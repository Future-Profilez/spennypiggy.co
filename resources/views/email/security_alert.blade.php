{{--
    Security alert — Security Checklist §3 "See what's happening".

    Same shell as every other Spenny Piggy email so these do not read as a
    different product. The one deliberate addition is the environment pill:
    local, dev and production all run this detection, and an alert you cannot
    place is an alert you cannot act on.

    Expects:
      $badge       array from App\Support\SecurityAlert::badge()
      $alertTitle  string
      $alertIntro  string — why this email exists at all
      $sections    array of ['heading' => string, 'rows' => [string, ...]]
      $checkedAt   string

    ⚠️ Every value arrives already redacted (App\Support\SecurityRedactor). Do
    not add a field here that reads a raw model attribute — this template is not
    where redaction happens.
--}}
@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Environment pill. Production is red so it can never be mistaken
                 for the dev noise sitting above it in an inbox. --}}
            <tr>
                <td align="center" style="padding:0 0 16px 0;">
                    <span style="display:inline-block;padding:6px 16px;border-radius:999px;
                                 background-color:{{ $badge['background'] ?? '#EFEFF1' }};
                                 color:{{ $badge['ink'] ?? '#4F555C' }};
                                 font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;
                                 letter-spacing:1.5px;text-transform:uppercase;">
                        {{ $badge['label'] ?? 'UNKNOWN' }}
                    </span>
                </td>
            </tr>

            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🔐
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    {{ $alertTitle }}
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 8px 0;text-align:center;">
                    {{ $alertIntro }}
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           padding:0 0 24px 0;text-align:center;">
                    {{ $badge['host'] ?? '' }} · {{ $checkedAt }}
                </td>
            </tr>

            @foreach($sections as $section)
                @continue(empty($section['rows']))
                <tr>
                    <td style="padding:0 0 16px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                            bgcolor="#FFF1F7"
                            style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                            <tr>
                                <td style="padding:20px 22px;">
                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                        <tr>
                                            <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;
                                                       font-weight:500;padding:0 0 10px 0;">
                                                {{ $section['heading'] }}
                                            </td>
                                        </tr>
                                        @foreach($section['rows'] as $row)
                                            <tr>
                                                <td style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;
                                                           font-weight:600;line-height:20px;padding:0 0 6px 0;">
                                                    → {{ $row }}
                                                </td>
                                            </tr>
                                        @endforeach
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @endforeach

            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#9A9A9A;
                           line-height:18px;padding:8px 0 0 0;text-align:center;">
                    Spenny Piggy security watchdog · this alert is operational mail and has no opt-out.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
