<html lang="en">

<head>
    {{-- Without this, clients fall back to latin-1 and every emoji, em dash and
         curly quote in any email using this layout renders as mojibake. --}}
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
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

        /* Dark mode.
           ⚠️ Only the FOOTER is covered, deliberately: every content row is
           injected by the individual template with inline styles this stylesheet
           cannot reach, so a partial flip is all that is honestly available.
           `color-scheme: light dark` above still tells the client we have
           handled it, which stops the more destructive auto-inversion. */
        @media (prefers-color-scheme: dark) {
            .footer-bg { background-color: #3D1A30 !important; }
            .footer-text { color: #E8A8D8 !important; }
            .footer-link-subtle { color: #E8A8D8 !important; }
            .footer-link-strong { color: #FF74B8 !important; }
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

    {{-- Preheader: the grey line an inbox prints after the subject.
         Opt-in — pass `$preheader` from the Mailable. With nothing passed this
         renders nothing at all, and the client falls back to the first words of
         the email exactly as it does today, so no existing template changes.
         ⚠️ The trailing zero-width joiners stop the client pulling body copy in
         after a short preheader; without them "Your payout is on the way" is
         followed by whatever the first table cell happens to say. --}}
    @isset($preheader)
    <div style="display:none;font-size:1px;color:#ECECEC;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
        {{ $preheader }}
        {!! str_repeat('&#8204;&nbsp;', 60) !!}
    </div>
    @endisset

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
            {{-- 🚨 BRAND PINK IS #FF007F. This band was #ea297a in BOTH apps — a
                 muted magenta that appears nowhere in the product, so every email
                 the platform sent was a slightly different pink from the site it
                 links to. The white logo is the documented exception to
                 black-on-pink: it is display-size artwork, not label text.

                 ⚠️ The macOS traffic-light dots (red/amber/green circles) that sat
                 on the right were removed. They are browser-window chrome — a
                 template artifact that said nothing about this product, competed
                 with the logo for the one piece of brand real estate in the email,
                 and cost three nested tables to draw. --}}
            <td bgcolor="#FF007F"
                style="background-color: #FF007F;
                       padding: 18px 22px;
                       border-radius: 16px 16px 0 0;
                       -webkit-border-radius: 16px 16px 0 0;">
                <img src="https://ucarecdn.com/1f1f8919-15f3-491d-b48e-0e3d0a251903/spenny_piggy_logo.png"
                     width="150" alt="Spenny Piggy"
                     style="display: block; width: 150px; height: auto; border: 0;">
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
                                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/twitterx--v1.png" width="22" height="22" alt="X (Twitter)" style="display: block; width: 22px; height: 22px;">
                                        </a>
                                    </td>
                                    <td valign="middle" style="padding-right: 10px;">
                                        <a href="https://www.instagram.com/spennypiggy?igsh=MW55cjFqYjh6eWFrZQ==" target="_blank">
                                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/instagram-new.png" width="22" height="22" alt="Instagram" style="display: block; width: 22px; height: 22px;">
                                        </a>
                                    </td>
                                    <td valign="middle" style="padding-right: 10px;">
                                        <a href="https://m.youtube.com/channel/UCC1GASMLYEjW46dHuKZZMZQ" target="_blank">
                                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/youtube-play.png" width="22" height="22" alt="YouTube" style="display: block; width: 22px; height: 22px;">
                                        </a>
                                    </td>
                                    <td valign="middle">
                                        <a href="https://www.tiktok.com/@spennypiggy?_t=8iySXCcoeGG&_r=1" target="_blank">
                                            <img src="https://img.icons8.com/ios-filled/100/8B4E76/tiktok--v1.png" width="22" height="22" alt="TikTok" style="display: block; width: 22px; height: 22px;">
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
                                        <img src="https://img.icons8.com/ios-filled/100/8B4E76/lock--v1.png" width="13" height="13" alt="" style="display: block; width: 13px; height: 13px;">
                                    </td>
                                    <td class="footer-text"
                                        style="font-family: 'Outfit', Arial, sans-serif; font-size: 11px;
                                               font-weight: 600; color: #8B4E76; padding-right: 14px;
                                               mso-line-height-rule: exactly; line-height: 14px;">
                                        SSL Encrypted
                                    </td>
                                    <td valign="middle" style="padding-right: 5px;">
                                        <img src="https://img.icons8.com/ios-filled/100/8B4E76/security-checked.png" width="14" height="14" alt="" style="display: block; width: 14px; height: 14px;">
                                    </td>
                                    <td class="footer-text"
                                        style="font-family: 'Outfit', Arial, sans-serif; font-size: 11px;
                                               font-weight: 600; color: #8B4E76;
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
                                   color: #8B4E76; text-align: center;">
                            You're receiving this email because you're a valued member of the Spenny Piggy community.
                        </td>
                    </tr>

                    {{-- Preferences / Unsubscribe.
                         🚨 THE ROW ONLY RENDERS WHEN THERE IS A USER TO UNSUBSCRIBE.
                         The old `@else` branch printed "Manage preferences (login
                         required)" on EVERY email that carries no `$user` — which is
                         every receipt, OTP, password reset and guest purchase mail.
                         Security, legal and transactional mail has no switch by
                         design (see CLAUDE.md → Email Preferences), so offering one
                         on a receipt is both noise and a way to talk somebody into
                         turning off mail they actually want. Marketing and category
                         mail always passes a `$user`, so nothing that legally needs
                         an opt-out loses it.

                         ⚠️ `#C4006A`, not `#FF007F`: brand pink on this footer tint
                         measures 3.45:1 and fails AA at 12px. --}}
                    {{-- 🚨 A MAIL THAT BRINGS ITS OWN LINKS GETS THEM USED — IT DOES NOT
                         GET A SECOND, WRONGER PAIR UNDERNEATH.

                         This block used to render unconditionally, so the birthday e-mails
                         shipped FOUR footer links: their own correct pair, and this one.
                         Both of this pair were wrong for them:

                         · The Unsubscribe called `generateUnsubscribeToken($user)` with NO
                           category, which defaults to `marketing_emails_enabled` and also
                           SUPPRESSES the address for all marketing. On a category-class mail
                           like the birthday reminder — which does not ride marketing consent
                           — clicking it silenced every promotion the person had agreed to
                           and did not stop the birthday reminders at all. The link that
                           looks like the unsubscribe was the one that did not work.

                         · "Manage preferences" was a bare `url('/email-preferences')`, which
                           sits behind `auth`. A suspended creator cannot sign in, so that is
                           the login dead end the SIGNED no-login centre exists to avoid.

                         ⚠️ The fallback below is unchanged, so every mail that does not
                         supply its own links behaves exactly as before. --}}
                    @php
                        /*
                         * 🚨 THE OPT-OUT IS THE MAIL'S OWN WHEN IT HAS ONE; THE PREFERENCE
                         * LINK IS ALWAYS THE SIGNED ONE.
                         *
                         * This block used to render both links unconditionally, so every mail
                         * that draws its own footer — ten of them — shipped FOUR links leading
                         * to two destinations, and this pair were the wrong two:
                         *
                         * · The Unsubscribe called `generateUnsubscribeToken($user)` with NO
                         *   category, which defaults to `marketing_emails_enabled` AND
                         *   suppresses the address for all marketing. On a category-class mail
                         *   like the birthday reminder, the link labelled "Unsubscribe" — the
                         *   one a reader is likeliest to press — silenced every promotion the
                         *   person had agreed to and did not stop the birthday mail at all.
                         *
                         * · "Manage preferences" was a bare `url('/email-preferences')`, which
                         *   sits behind `auth`. A suspended creator cannot sign in, so for
                         *   exactly the person most likely to be using it that was the login
                         *   dead end the SIGNED no-login centre exists to avoid.
                         *
                         * So: a mail carrying its own opt-out keeps it alone (it is the
                         * narrower switch and it is already drawn, in that mail's own words).
                         * The preference link survives for the eight mails that draw an
                         * opt-out and no centre link — but as the signed token, never the
                         * walled path.
                         */
                        $hasUser = isset($user) && $user instanceof \App\Models\User;

                        $footerUnsubscribeUrl = ! empty($unsubscribeUrl)
                            ? null
                            : ($hasUser
                                ? \App\Http\Controllers\EmailPreferenceController::generateUnsubscribeToken($user)
                                : null);

                        // `generateManageToken()` returns NULL when the route is not
                        // registered — never let that become a dead `href=""`.
                        $footerPreferencesUrl = ! empty($preferencesUrl)
                            ? null
                            : ($hasUser
                                ? \App\Http\Controllers\EmailPreferenceController::generateManageToken($user)
                                : null);
                    @endphp

                    @if($footerPreferencesUrl || $footerUnsubscribeUrl)
                    <tr>
                        <td class="footer-text"
                            style="padding: 0 0 8px 0; font-family: 'Outfit', Arial, sans-serif;
                                   font-size: 12px; line-height: 18px; color: #8B4E76; text-align: center;">
                            @if($footerPreferencesUrl)
                            <a href="{{ $footerPreferencesUrl }}" class="footer-link-strong"
                               style="color: #C4006A; text-decoration: none; font-weight: 700;">Manage preferences</a>
                            @endif
                            @if($footerPreferencesUrl && $footerUnsubscribeUrl)
                            <span style="color: #8B4E76;">&nbsp;·&nbsp;</span>
                            @endif
                            @if($footerUnsubscribeUrl)
                            <a href="{{ $footerUnsubscribeUrl }}"
                               class="footer-link-subtle"
                               style="color: #8B4E76; text-decoration: underline;">Unsubscribe</a>
                            @endif
                        </td>
                    </tr>
                    @endif

                    {{-- Copyright --}}
                    <tr>
                        <td class="footer-text"
                            style="padding: 0; font-family: 'Outfit', Arial, sans-serif;
                                   font-size: 11px; line-height: 17px; color: #8B4E76; text-align: center;">
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
