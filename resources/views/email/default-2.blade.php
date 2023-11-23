<html>

<head>
    <title>{{ $title ?? 'Spanny Piggy Emails' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet">
    <style>
        *{font-family:'Outfit',sans-serif;}
        .userVimg img{width:100%;height:100%;}
        .userVimg{border-radius:50%;overflow:hidden;width:50px;height:50px;}
        .userVcontent h2{font-size:17px;margin:0;line-height:14px;font-weight:300;}
        .userView{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;}
        .userVcontent p{margin:0;font-size:13px;color:#a3a3a3;line-height:18px;font-weight:300;}
        .userVcontent{padding-left:10px;}
        .userBox{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;padding:12px;border-radius:10px 15px;background:#181818;margin-bottom:20px;}
        .userVcontent a{display:inline-block;text-decoration:none;}
        span.unread-count{font-size:13px;color:#7fffd4;}
    </style>
    @stack('custom-css')
</head>

<body>
    <table align="center" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 450px; border-collapse: collapse; box-shadow: 0 0 25px 0 rgba(0,0,0,0.1); border-radius: 10px;">
    <tr>
        <td style="background-color: #F94F97; padding: 10px 15px 10px 15px">
            <img src="https://whoyouinto.com/emails/user/activedots.png" alt="img">
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
                        <td valign="middle" style="padding-right: 10px"><a href="https://m.facebook.com/whoyouinto" target="_blank"><img src="https://whoyouinto.com/emails/user/facebookicon.png"></a></td>
                        <td valign="middle" style="padding-right: 10px"><a href="https://twitter.com/whoyouinto" target="_blank"><img src="https://whoyouinto.com/emails/user/twittericon.png"></a></td>
                        <td valign="middle" style="padding-right: 10px"><a href="https://instagram.com/whoyouinto?igshid=OGQ5ZDc2ODk2ZA==" target="_blank"><img src="https://whoyouinto.com/emails/user/instagramicon.png"></a></td>
                        <td valign="middle" style="padding-right: 10px"><a href="https://www.youtube.com/channel/UC5IHsRra_Pe9mc1DSzkNxMQ?app=desktop" target="_blank"><img src="https://whoyouinto.com/emails/user/youtubeicon.png"></a></td>
                        <td valign="middle"><a href="https://www.tiktok.com/@whoyouinto" target="_blank"><img src="https://whoyouinto.com/emails/user/tiktokicon.png"></a></td>
                        </tr>
                  </table>
               </td>
            </tr>
            <tr>
               <td>
                  <table align="center" cellspacing="0" cellpadding="0" border="0" >
                     <tr>
                        <td width="50%" style="padding: 0 5px 0 0">
                           <table align="left" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                 <td><img src="https://whoyouinto.com/emails/user/lockicon.png" alt="img"></td>
                                 <td style="color:#8C52FF; font-family: Arial; font-size:12px; font-style: normal; font-weight: 400; line-height: normal;">SSl Encryption</td>
                              </tr>
                           </table>
                        </td>
                        <td width="50%" style="padding: 0 0 0 5px">
                           <table align="left" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                 <td><img src="https://whoyouinto.com/emails/user/pciimg.png" alt="img"></td>
                                 <td style="color:#8C52FF; font-family: Arial; font-size:12px; font-style: normal; font-weight: 400; line-height: normal;">SSl Encryption</td>
                              </tr>
                           </table>
                        </td>
                     </tr>
                  </table>
               </td>
            </tr>
            <tr>
               <td style="padding:15px 0 5px 0; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #666666; text-align: center;">
                  asdasdasdadasdadsd You’re receiving this email because you’re a valued member of the Spenny Piggy community. To stop receiving notification emails, Please click here</td>
            </tr>
            <tr>
               <td style="padding:0 0 10px 0; font-family: Arial; font-weight: normal;font-size: 12px; line-height: 18px;color: #666666; text-align: center;">
                    To stop receiving notification emails, For Unsubscribe <br> Please <a href="www.spennypiggy.co" style="color:#5D25FD">click here</a>
               </td>
            </tr>

            <tr>
               <td style="padding:0 0 10px; font-family: Arial; font-weight: normal; font-size: 12px; line-height: 18px; color: #666666; text-align: center; ">
                  Copyright &copy; 2023 Spenny Piggy
               </td>
            </tr>
         </table>
      </td>
    </tr>
    </table>
</body>

</html>
