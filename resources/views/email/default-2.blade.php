<html>

<head>
    <title>{{ $title ?? 'Spenny Piggy Emails' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet">
    <style>
        * {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
            }

        .userVimg img {
            width: 100%;
            height: 100%;
        }

        .userVimg {
            border-radius: 50%;
            overflow: hidden;
            width: 50px;
            height: 50px;
        }

        .userVcontent h2 {
            font-size: 17px;
            margin: 0;
            line-height: 14px;
            font-weight: 300;
        }

        .userView {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
        }

        .userVcontent p {
            margin: 0;
            font-size: 13px;
            color: #a3a3a3;
            line-height: 18px;
            font-weight: 300;
        }

        .userVcontent {
            padding-left: 10px;
        }

        .userBox {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            padding: 12px;
            border-radius: 10px 15px;
            background: #181818;
            margin-bottom: 20px;
        }

        .userVcontent a {
            display: inline-block;
            text-decoration: none;
        }

        span.unread-count {
            font-size: 13px;
            color: #7fffd4;
        }
    </style>
    @stack('custom-css')
</head>

<body>
    <table align="center" cellspacing="0" cellpadding="0" border="0"
        style="width: 100%; max-width: 450px; border-collapse: collapse; box-shadow: 0 0 25px 0 rgba(0,0,0,0.1); border-radius: 10px;">
        <tr>
            <td style="background-color: #F94F97; padding: 10px 15px 10px 15px">
                <img src="https://ucarecdn.com/1fa9114e-a0ee-4097-add8-0cd7afa2632b/activedots.png" alt="img">
            </td>
        </tr>

        @yield('content')

        <tr>
            <td style="padding:20px 10px 10px 10px; background-color: #FBF0F5;border-radius: 0 0 10px 10px;">
                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                        <td>

                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="text-align: center;padding: 0 0 15px 0;">
                        <table align="center" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <!-- <td valign="middle" style="padding-right: 10px"><a
                                            href="https://m.facebook.com/whoyouinto" target="_blank"><img
                                                src="https://whoyouinto.com/emails/user/facebookicon.png"></a></td> -->
                                    <td valign="middle" style="padding-right: 10px"><a href="https://x.com/spennypiggy?s=21&t=C7pgKTNG0gHS2ka9yuTonA" target="_blank">
                                            <img src="https://ucarecdn.com/e8193ffe-aadc-4d10-8a18-1cbb8336a284/twittericon.png"></a></td>
                                    <td valign="middle" style="padding-right: 10px">
                                        <a href="https://www.instagram.com/spennypiggy?igsh=MW55cjFqYjh6eWFrZQ==" target="_blank">
                                            <img src="https://ucarecdn.com/a6a70fa1-396c-43b6-be45-12fcdbbeca5b/instagramicon.png"></a></td>
                                    <td valign="middle" style="padding-right: 10px">
                                        <a href="https://m.youtube.com/channel/UCC1GASMLYEjW46dHuKZZMZQ" target="_blank">
                                            <img src="https://ucarecdn.com/28ec803c-9f8b-4580-b8e8-2bbf9d5f94f6/youtubeicon.png"></a></td>
                                    <td valign="middle">
                                        <a href="https://www.tiktok.com/@spennypiggy?_t=8iySXCcoeGG&_r=1" target="_blank">
                                            <img src="https://ucarecdn.com/89808096-fd59-4aad-a352-cf05bac855e7/tiktokicon.png"></a></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table align="center" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td width="50%" style="padding: 0 5px 0 0">
                                        <table align="left" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td><img src="https://ucarecdn.com/fcce9347-a23a-495e-b6c3-b3a71360b9f9/lockicon.png" alt="img"></td>
                                                <td
                                                    style="color:#8C52FF; font-family: Arial; font-size:12px; font-style: normal; font-weight: 400; line-height: normal;">
                                                    SSL Encryption</td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="50%" style="padding: 0 0 0 5px">
                                        <table align="left" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td><img src="https://ucarecdn.com/be624d04-6b8d-485b-ac21-b20fd0c0d5bc/pciimg.png" alt="img"></td>
                                                <td style="color:#8C52FF; font-family: Arial; font-size:12px; font-style: normal; font-weight: 400; line-height: normal;">
                                                    PCI Compliant</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="padding:15px 0 5px 0; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #666666; text-align: center;">
                            You’re receiving this email because you’re a valued member of the Spenny Piggy community.</td>
                    </tr>
                    <tr>
                        <td
                            style="padding:0 0 10px 0; font-family: Arial; font-weight: normal;font-size: 12px; line-height: 18px;color: #666666; text-align: center;">
                            To stop receiving notification emails, please <a
                                href="https://spennypiggy.co/unsubscribe" style="color:#5D25FD">click here</a>
                        </td>
                    </tr>

                    <tr>
                        <td
                            style="padding:0 0 10px; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #666666; text-align: center; ">
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
</body>

</html>