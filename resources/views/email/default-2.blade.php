<html>

<head>
    <title>{{ $title ?? 'Spanny Piggy Emails' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet">
    <style>
        * {
            font-family: 'Outfit', sans-serif;
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
    <table align="center" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 400px; border-collapse: collapse; box-shadow: 0 0 25px 0 rgba(0,0,0,0.1); border-radius: 10px;">
        {{-- <tr>
            <td align="center" style="padding:30px 10px 30px 10px; border-bottom: 1px solid #e5e5e5;"><a href="https://whoyouinto.com"><img alt="image" width="210px" src="https://whoyouinto.com/icons/new/template/logo.png?asldfjlaskdf" style="border:none"></a></td>
        </tr> --}}

        @yield('content')

        <tr>
            <td style="padding:20px 10px 10px 10px; background-color: #f5f3fd;border-radius: 0 0 10px 10px;">
                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                        <td>

                        </td>
                    </tr>
                    {{-- <tr>
                        <td align="center" style="text-align: center;">
                            <table align="center" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td valign="middle" style="padding-right: 10px"><a href="https://m.facebook.com/whoyouinto" target="_blank"><img src="https://whoyouinto.com/icons/new/template/facebookicon.png"></a></td>

                                    <td valign="middle" style="padding-right: 10px"><a href="https://twitter.com/whoyouinto" target="_blank"><img src="https://whoyouinto.com/icons/new/template/twittericon.png"></a></td>

                                    <td valign="middle" style="padding-right: 10px"><a href="https://instagram.com/whoyouinto?igshid=OGQ5ZDc2ODk2ZA==
                        " target="_blank"><img src="https://whoyouinto.com/icons/new/template/instagramicon.png"></a></td>

                                    <td valign="middle" style="padding-right: 10px"><a href="https://www.youtube.com/channel/UC5IHsRra_Pe9mc1DSzkNxMQ?app=desktop" target="_blank"><img src="https://whoyouinto.com/icons/new/template/youtubeicon.png"></a></td>

                                    <td valign="middle"><a href="https://www.tiktok.com/@whoyouinto" target="_blank"><img src="https://whoyouinto.com/icons/new/template/tiktokicon.png"></a></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:15px 0 5px 0; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 15px; color: 666666; text-align: center;">
                            You’re receiving this email because you’re a valued member of the Whoyouinto community.</td>
                    </tr>
                    <tr>
                        <td style="padding:0 0 10px 0; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 15px; color: 666666; text-align: center;">To stop receiving notification emails, For Unsubscribe <br> Please <a href="https://whoyouinto.com/settings?page=1" style="color:#5d25fd">click here</a>
                        </td>
                    </tr> --}}

                    <tr>
                        <td style="padding:0 0 10px; font-family: Arial; font-weight: normal; font-size: 11px; line-height: 15px; color: #666666; text-align: center; ">
                            Copyright &copy; 2023 Spanny Piggy
                        </td>
                    </tr>

                    {{-- <tr>
                        <td>
                            <table align="center" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="left" style="padding-right: 20px; text-align: left;">
                                        <img style="display: inline-block; vertical-align: middle; margin: 1px;" src="https://whoyouinto.com/icons/new/template/webappicon.png" alt="img">
                                        <p style="display: inline-block; vertical-align: middle; margin: 1px;padding: 0; font-family: Arial; font-weight: bold; font-size: 11px; color: #5D25FD;">Web App</p>
                                    </td>

                                    <td align="left" style="padding-right: 20px; text-align: left;">
                                        <img style="display: inline-block; vertical-align: middle; margin: 1px;" src="https://whoyouinto.com/icons/new/template/ssiencryptionicon.png" alt="img">
                                        <p style="display: inline-block; vertical-align: middle; margin: 1px;padding: 0; font-family: Arial; font-weight: bold; font-size: 11px; color: #5D25FD;">SSl Encryption</p>
                                    </td>

                                    <td align="left" style=" text-align: left;">
                                        <img style="display: inline-block; vertical-align: middle; margin: 1px;" src="https://whoyouinto.com/icons/new/template/pcicon.png" alt="img">
                                        <p style="display: inline-block; vertical-align: middle; margin: 1px;padding: 0; font-family: Arial; font-weight: bold; font-size: 11px; color: #5D25FD;">PCI Compliant</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr> --}}
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
