@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                ⚠️
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
                    Identity Verification Failed
                </td>
            </tr>

            {{-- Body --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 8px 0;text-align:center;">
                    Hello <strong style="color:#1A1A1A;">{{ ucfirst(strtolower($user->name)) }}</strong>,
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    Unfortunately, your identity verification <strong style="color:#8C52FF;">failed</strong>. Please review the details you submitted and try again.
                </td>
            </tr>

            @if(isset($user->identity_verification_error))
            @php
            $error = json_decode($user->identity_verification_error, true);
            @endphp
            {{-- Error details card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td colspan="2" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#c53030;font-weight:700;padding:0 0 10px 0;">
                                            ⚠️ Error Details
                                        </td>
                                    </tr>
                                    @if($error && is_array($error))
                                        @if(isset($error['code']))
                                        <tr>
                                            <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 6px 0;">
                                                Code
                                            </td>
                                            <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 6px 0;">
                                                {{ $error['code'] }}
                                            </td>
                                        </tr>
                                        @endif
                                        @if(isset($error['reason']))
                                        <tr>
                                            <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 0 0;">
                                                Reason
                                            </td>
                                            <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 0 0;">
                                                {{ $error['reason'] }}
                                            </td>
                                        </tr>
                                        @endif
                                    @else
                                        <tr>
                                            <td colspan="2" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#666666;font-weight:400;line-height:20px;">
                                                Unable to retrieve error details. Please contact support for further assistance.
                                            </td>
                                        </tr>
                                    @endif
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif

        </table>
    </td>
</tr>
@endsection
