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
                                🛡️
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
                    Verify Your <span style="color:#8C52FF;">Email</span> ✉️
                </td>
            </tr>

            {{-- Body --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 8px 0;text-align:center;">
                    Hello <strong style="color:#8C52FF;">{{ $data['name'] ?? 'there' }}</strong>!
                </td>
            </tr>
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                           line-height:22px;padding:0 0 24px 0;text-align:center;">
                    Welcome to Spenny Piggy 🐷 Please verify your email address to get started.
                </td>
            </tr>

            {{-- OTP Code Block --}}
            @if(!empty($data['otp']))
            <tr>
                <td align="center" style="padding:0 0 20px 0;text-align:center;">
                    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#8C52FF;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px 0;">
                        Your Verification Code
                    </p>
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center" style="margin:0 auto;">
                        <tr>
                            <td align="center" bgcolor="#F8F5FF"
                                style="background-color:#F8F5FF;border:2px dashed #8C52FF;border-radius:12px;-webkit-border-radius:12px;padding:14px 28px;">
                                <span style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#1A1A1A;">
                                    {{ $data['otp'] }}
                                </span>
                            </td>
                        </tr>
                    </table>
                    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#999999;margin:8px 0 0 0;">
                        Enter this 6-digit code on the verification screen (expires in 15 minutes).
                    </p>
                </td>
            </tr>
            @endif

            {{-- Helper text --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:13px;color:#888888;
                           line-height:20px;padding:0 0 18px 0;text-align:center;">
                    Or click below to verify automatically without typing:
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
                                {{-- Signed URL built by the job. `env('APP_URL')` is NULL once the
                                     config is cached on deploy, and an unsigned `/user/{uuid}`
                                     link let anyone verify any account's address.

                                     🚨 The old fallback built that unsigned URL by hand, so
                                     whenever `verify_url` was absent the button shipped a link
                                     `hasValidSignature()` REFUSES — a guaranteed "invalid or
                                     expired" for a link the platform had just minted. The
                                     fallback is the login page: a working page beats a
                                     verification button that cannot work. --}}
                                <a href="{{ $data['verify_url'] ?? route('login') }}"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    Verify Email Address →
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
