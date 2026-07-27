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
                            <td align="center" valign="middle" bgcolor="#FFF4D6"
                                style="width:56px;height:56px;border-radius:28px;font-size:26px;line-height:56px;">
                                ⏳
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:bold;color:#111111;padding:0 0 12px 0;">
                    Your {{ $feature }} is under review
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#555555;padding:0 0 18px 0;">
                    @if ($creatorName !== '')Hi {{ $creatorName }},@endif
                    @if ($itemTitle !== '')
                        Your {{ $feature }} <strong>{{ $itemTitle }}</strong> is not visible to buyers at the moment.
                    @else
                        Your {{ $feature }} is not visible to buyers at the moment.
                    @endif
                </td>
            </tr>

            @if ($reason !== '')
                <tr>
                    <td style="padding:0 0 20px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                            bgcolor="#FFF9EC" style="border-radius:12px;">
                            <tr>
                                <td
                                    style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#7A5B00;padding:16px 18px;">
                                    {{ $reason }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @endif

            <tr>
                <td align="center" style="padding:0 0 24px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F" style="border-radius:26px;">
                                <a href="{{ $manageUrl }}"
                                    style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:26px;">
                                    Edit and resubmit
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td align="center"
                    style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#888888;padding:0 0 8px 0;">
                    Most reviews are quick. If you think this is a mistake, reply to this email and our team will take
                    a look.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
