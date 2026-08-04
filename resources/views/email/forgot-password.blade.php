@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding: 32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width: 440px; width: 100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding: 0 0 18px 0;">
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

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 10px 0;text-align:center;">
                    Reset Your Password
                </td>
            </tr>

            {{-- Body --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 16px 0;text-align:center;">
                    Hello <strong style="color:#8C52FF;">{{ $data['name'] ?? 'there' }}</strong>!<br><br>
                    We received a request to reset your password for your Spenny Piggy account.
                </td>
            </tr>

            {{-- Body --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 22px 0;text-align:center;">
                    Click the button below to create a new password. If you didn't request this, you can safely ignore this email.
                </td>
            </tr>

            {{-- Gradient CTA button --}}
            <tr>
                <td align="center" style="padding:0 0 12px 0;text-align:center;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" bgcolor="#FF007F"
                                style="background-color:#FF007F;
                                       background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                       border-radius:50px;-webkit-border-radius:50px;">
                                {{-- ⚠️ Never `env('APP_URL')` here: it is NULL once the config is
                                     cached (every Vapor deploy) and the link loses its host.
                                     The URL is built by the job, which also carries the
                                     single-use reset token — the uuid alone proves nothing. --}}
                                <a href="{{ $data['reset_url'] ?? rtrim(config('app.url'), '/').'/forgot-password/'.$data['uuid'] }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Reset Password →
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
