<html>

<head>
    <title>{{ $title ?? 'Spenny Piggy Emails' }}</title>
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style type="text/css">
        /* Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }

        /* Base font */
        * { font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif !important; }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
            .footer-bg { background-color: #3D1A30 !important; }
            .footer-text { color: #E8A8D8 !important; }
            .footer-link-subtle { color: #E8A8D8 !important; }
            .footer-divider { background-color: #8C3270 !important; }
        }

        /* Legacy user-profile styles used by some templates */
        .userVimg img { width: 100%; height: 100%; }
        .userVimg { border-radius: 50%; overflow: hidden; width: 50px; height: 50px; }
        .userVcontent h2 { font-size: 17px; margin: 0; line-height: 14px; font-weight: 300; }
        .userView { display: flex; align-items: center; }
        .userVcontent p { margin: 0; font-size: 13px; color: #a3a3a3; line-height: 18px; font-weight: 300; }
        .userVcontent { padding-left: 10px; }
        .userBox { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 10px; background: #181818; margin-bottom: 20px; }
        .userVcontent a { display: inline-block; text-decoration: none; }
        span.unread-count { font-size: 13px; color: #7fffd4; }
    </style>
    @stack('custom-css')
</head>

<body style="margin: 0; padding: 0; background-color: #ECECEC;">
    {{-- Outer wrapper gives gray space above & below the card --}}
    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" bgcolor="#ECECEC"
        style="background-color: #ECECEC;">
        <tr>
            <td align="center" style="padding: 24px 12px 32px 12px;">

    {{-- Card: rounded all corners; overflow clips header top & footer bottom --}}
    <table align="center" cellspacing="0" cellpadding="0" border="0" role="presentation"
        bgcolor="#ffffff"
        style="width: 100%; max-width: 480px; border-collapse: separate; margin: 0 auto;
               background-color: #ffffff;
               border-radius: 16px; -webkit-border-radius: 16px;
               overflow: hidden;">

        {{-- ======================== HEADER ======================== --}}
        {{-- Magenta header: small logo left, macOS dots right.        --}}
        <tr>
            <td bgcolor="#ea297a"
                style="background-color: #ea297a;
                       padding: 16px 22px;
                       border-radius: 16px 16px 0 0;
                       -webkit-border-radius: 16px 16px 0 0;">
                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                    <tr>
                        <td align="left" valign="middle">
                            <img src="https://ucarecdn.com/1f1f8919-15f3-491d-b48e-0e3d0a251903/spenny_piggy_logo.png"
                                 width="150" alt="Spenny Piggy"
                                 style="display: block; width: 150px; height: auto; border: 0;">
                        </td>
                        <td align="right" valign="middle">
                            <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="right">
                                <tr>
                                    <td width="12" height="12" bgcolor="#FF5F56" style="width:12px;height:12px;background-color:#FF5F56;border-radius:50%;-webkit-border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                                    <td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>
                                    <td width="12" height="12" bgcolor="#FFBD2E" style="width:12px;height:12px;background-color:#FFBD2E;border-radius:50%;-webkit-border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                                    <td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>
                                    <td width="12" height="12" bgcolor="#27C93F" style="width:12px;height:12px;background-color:#27C93F;border-radius:50%;-webkit-border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        {{-- ======================== CONTENT ======================== --}}
        {{-- Individual templates inject <tr> rows here — NOT changed --}}
        @yield('content')

        {{-- ======================== FOOTER ======================== --}}
        <tr>
            <td class="footer-bg"
                bgcolor="#FFF1F7"
                style="background-color: #FFF1F7;
                       border-radius: 0 0 16px 16px;
                       -webkit-border-radius: 0 0 16px 16px;
                       padding: 0 24px 22px 24px;">
                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">

                    {{-- Pink divider --}}
                    <tr>
                        <td class="footer-divider" style="padding: 0 0 14px 0;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td height="1" bgcolor="#FFCCE0"
                                        style="height: 1px; line-height: 1px; font-size: 1px;
                                               background-color: #FFCCE0;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Social icons --}}
                    <tr>
                        <td align="center" style="padding: 0 0 14px 0;">
                            <table align="center" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td valign="middle" style="padding-right: 10px;">
                                        <a href="https://x.com/spennypiggy?s=21&t=C7pgKTNG0gHS2ka9yuTonA" target="_blank">
                                            <img src="https://img.icons8.com/ios-filled/100/CC88BB/twitterx--v1.png" width="22" height="22" alt="X (Twitter)" style="display: block; width: 22px; height: 22px;">
                                        </a>
                                    </td>
                                    <td valign="middle" style="padding-right: 10px;">
                                        <a href="https://www.instagram.com/spennypiggy?igsh=MW55cjFqYjh6eWFrZQ==" target="_blank">
                                            <img src="https://img.icons8.com/ios-filled/100/CC88BB/instagram-new.png" width="22" height="22" alt="Instagram" style="display: block; width: 22px; height: 22px;">
                                        </a>
                                    </td>
                                    <td valign="middle" style="padding-right: 10px;">
                                        <a href="https://m.youtube.com/channel/UCC1GASMLYEjW46dHuKZZMZQ" target="_blank">
                                            <img src="https://img.icons8.com/ios-filled/100/CC88BB/youtube-play.png" width="22" height="22" alt="YouTube" style="display: block; width: 22px; height: 22px;">
                                        </a>
                                    </td>
                                    <td valign="middle">
                                        <a href="https://www.tiktok.com/@spennypiggy?_t=8iySXCcoeGG&_r=1" target="_blank">
                                            <img src="https://img.icons8.com/ios-filled/100/CC88BB/tiktok--v1.png" width="22" height="22" alt="TikTok" style="display: block; width: 22px; height: 22px;">
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- SSL / PCI --}}
                    <tr>
                        <td align="center" style="padding: 0 0 12px 0;">
                            <table align="center" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td valign="middle" style="padding-right: 5px;">
                                        <img src="https://img.icons8.com/ios-filled/100/CC88BB/lock--v1.png" width="13" height="13" alt="" style="display: block; width: 13px; height: 13px;">
                                    </td>
                                    <td class="footer-text"
                                        style="font-family: 'Outfit', Arial, sans-serif; font-size: 11px;
                                               font-weight: 600; color: #CC88BB; padding-right: 14px;
                                               mso-line-height-rule: exactly; line-height: 14px;">
                                        SSL Encrypted
                                    </td>
                                    <td valign="middle" style="padding-right: 5px;">
                                        <img src="https://img.icons8.com/ios-filled/100/CC88BB/security-checked.png" width="14" height="14" alt="" style="display: block; width: 14px; height: 14px;">
                                    </td>
                                    <td class="footer-text"
                                        style="font-family: 'Outfit', Arial, sans-serif; font-size: 11px;
                                               font-weight: 600; color: #CC88BB;
                                               mso-line-height-rule: exactly; line-height: 14px;">
                                        PCI Compliant
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Membership text --}}
                    <tr>
                        <td class="footer-text"
                            style="padding: 0 0 6px 0; font-family: 'Outfit', Arial, sans-serif;
                                   font-size: 12px; font-weight: 400; line-height: 18px;
                                   color: #CC88BB; text-align: center;">
                            You're receiving this email because you're a valued member of the Spenny Piggy community.
                        </td>
                    </tr>

                    {{-- Preferences / Unsubscribe --}}
                    @if(isset($user) && $user instanceof \App\Models\User)
                    <tr>
                        <td class="footer-text"
                            style="padding: 0 0 8px 0; font-family: 'Outfit', Arial, sans-serif;
                                   font-size: 12px; line-height: 18px; color: #CC88BB; text-align: center;">
                            <a href="{{ url('/email-preferences') }}"
                               style="color: #FF007F; text-decoration: none; font-weight: 700;">Manage preferences</a>
                            <span style="color: #CC88BB;">&nbsp;·&nbsp;</span>
                            <a href="{{ \App\Http\Controllers\EmailPreferenceController::generateUnsubscribeToken($user) }}"
                               style="color: #CC88BB; text-decoration: none;">Unsubscribe</a>
                        </td>
                    </tr>
                    @else
                    <tr>
                        <td class="footer-text"
                            style="padding: 0 0 8px 0; font-family: 'Outfit', Arial, sans-serif;
                                   font-size: 12px; line-height: 18px; color: #CC88BB; text-align: center;">
                            <a href="{{ url('/email-preferences') }}"
                               style="color: #FF007F; text-decoration: none; font-weight: 700;">Manage preferences</a>
                            <span style="color: #CC88BB;">&nbsp;(login required)</span>
                        </td>
                    </tr>
                    @endif

                    {{-- Copyright --}}
                    <tr>
                        <td class="footer-text"
                            style="padding: 0; font-family: 'Outfit', Arial, sans-serif;
                                   font-size: 11px; line-height: 17px; color: #CC88BB; text-align: center;">
                            @if(app()->environment('production'))
                                Copyright &copy; {{ date('Y') }} SpennyPiggy. All rights reserved.
                            @elseif(app()->environment('local'))
                                Copyright &copy; {{ date('Y') }} SpennyPiggy LOCAL. All rights reserved.
                            @else
                                Copyright &copy; {{ date('Y') }} SpennyPiggy DEV. All rights reserved.
                            @endif
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
    {{-- /card --}}

            </td>
        </tr>
    </table>
    {{-- /outer wrapper --}}
</body>

</html>
