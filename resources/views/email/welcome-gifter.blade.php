@extends('email.default-2')
@section('content')
    <tr>
        <td>
            <span style="display:none; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#ffffff;">
                Discover creators, follow favorites, and send gifts securely on Spenny Piggy.
            </span>
        </td>
    </tr>
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
                                    👋
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
                        Welcome to <span style="color:#8C52FF;">Spenny Piggy</span>! 🐷
                    </td>
                </tr>

                {{-- Subline --}}
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                               line-height:22px;padding:0 0 22px 0;text-align:center;">
                        Hi <strong style="color:#8C52FF;">{{ ucwords($name ?? 'there') }}</strong> — you’re all set to discover creators and make someone’s day with the perfect gift.
                    </td>
                </tr>

                {{-- Gradient CTA button --}}
                <tr>
                    <td align="center" style="padding:0 0 26px 0;text-align:center;">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                            <tr>
                                <td align="center" bgcolor="#FF007F"
                                    style="background-color:#FF007F;
                                           background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    <a href="{{ url('/discover') }}"
                                        style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                               font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                               border-radius:50px;-webkit-border-radius:50px;">
                                        Discover Creators →
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Steps card title --}}
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:16px;color:#1A1A1A;
                               line-height:24px;padding:0 0 14px 0;text-align:center;">
                        Your first 3 minutes on Spenny Piggy
                    </td>
                </tr>

                {{-- Step 1 --}}
                <tr>
                    <td style="padding:0 0 12px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                            <tr>
                                <td valign="top" width="40" style="width:40px;padding:0 12px 0 0;">
                                    <table cellspacing="0" cellpadding="0" border="0" role="presentation">
                                        <tr>
                                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                                style="width:30px;height:30px;background-color:#FFE6F2;border-radius:50%;
                                                       -webkit-border-radius:50%;text-align:center;
                                                       font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:800;
                                                       color:#FF007F;line-height:30px;">
                                                1
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td valign="middle"
                                    style="font-family:'Outfit',Arial,sans-serif;font-weight:600;font-size:14px;color:#1A1A1A;line-height:20px;">
                                    Follow a creator you love
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Step 2 --}}
                <tr>
                    <td style="padding:0 0 12px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                            <tr>
                                <td valign="top" width="40" style="width:40px;padding:0 12px 0 0;">
                                    <table cellspacing="0" cellpadding="0" border="0" role="presentation">
                                        <tr>
                                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                                style="width:30px;height:30px;background-color:#FFE6F2;border-radius:50%;
                                                       -webkit-border-radius:50%;text-align:center;
                                                       font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:800;
                                                       color:#FF007F;line-height:30px;">
                                                2
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td valign="middle"
                                    style="font-family:'Outfit',Arial,sans-serif;font-weight:600;font-size:14px;color:#1A1A1A;line-height:20px;">
                                    Pick a wish that fits your budget
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Step 3 --}}
                <tr>
                    <td style="padding:0 0 24px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                            <tr>
                                <td valign="top" width="40" style="width:40px;padding:0 12px 0 0;">
                                    <table cellspacing="0" cellpadding="0" border="0" role="presentation">
                                        <tr>
                                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                                style="width:30px;height:30px;background-color:#FFE6F2;border-radius:50%;
                                                       -webkit-border-radius:50%;text-align:center;
                                                       font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:800;
                                                       color:#FF007F;line-height:30px;">
                                                3
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td valign="middle"
                                    style="font-family:'Outfit',Arial,sans-serif;font-weight:600;font-size:14px;color:#1A1A1A;line-height:20px;">
                                    Send a gift with a message (or keep it private)
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Why card --}}
                <tr>
                    <td style="padding:0 0 22px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                            bgcolor="#FFF1F7"
                            style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                            <tr>
                                <td style="padding:20px 22px;">
                                    <div style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:15px;line-height:22px;color:#1A1A1A;padding:0 0 10px 0;">
                                        Why you’ll love gifting here
                                    </div>
                                    <div style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;line-height:24px;color:#666666;">
                                        <span style="color:#8C52FF;font-weight:800;">✓</span> Secure checkout and privacy-first design<br>
                                        <span style="color:#8C52FF;font-weight:800;">✓</span> Discover wishes, memberships and subscriptions<br>
                                        <span style="color:#8C52FF;font-weight:800;">✓</span> Support creators across the world in minutes
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Helper text --}}
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:14px;color:#888888;
                               line-height:20px;padding:0 0 22px 0;text-align:center;">
                        Want a quick tour? Read <a href="{{ url('/how-it-works') }}" style="color:#8C52FF;text-decoration:none;font-weight:800;">how it works</a>. ✨
                    </td>
                </tr>

            </table>
        </td>
    </tr>
@endsection
