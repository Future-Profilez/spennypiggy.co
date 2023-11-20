<table align="center" cellspacing="0" cellpadding="0" border="0"
    style="width: 100%; max-width: 300px; border-collapse: collapse; box-shadow: 0 0 25px 0 rgba(0,0,0,0.1); border-radius: 10px;">
    <tr>
        <td style="background-color: #F94F97; padding: 10px 15px 10px 15px">
            <img src="https://whoyouinto.com/emails/user/activedots.png" alt="img">
        </td>
    </tr>

    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;"><a href="https://whoyouinto.com"><img alt="image"
                    width="119" src="https://whoyouinto.com/emails/user/logo.png" style="border:none"></a></td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width: 296px; width: 100%; text-align: center;">
                {{-- <tr>
               <td style="font-family: Arial; font-weight: bold; font-size: 18px; color:#000; line-height: 26px; padding: 0 0 25px 0; text-align: center;">New <span style="color: #8C52FF">Granted Wish</span>  on <br> Spenny Piggy 🎁 </td>
            </tr> --}}

                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;"><img
                            src="https://whoyouinto.com/emails/user/giftimg.png" alt="img"></td>
                </tr>
                <tr>
                    <td><b>Hello {{ $data['name'] ?? 'user' }}</b></td>
                </tr>
                <tr>
                    <td><b>Click on the given below button to verify your email</b></td>
                </tr>
                <tr>
                    <button style="color:#F94F97;color:white"><a
                            href="{{ env('APP_URL') }}/user/{{ $data['uuid'] }}"></a>Verify Button</button>
                </tr>

                {{-- <tr>
               <td style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold; font-size: 13px; color: 141414; text-align: left; line-height: 18px; text-align: center;">Someone granted you a <span style="color:#F94F97 ">Wish</span> 🤩</td>
            </tr> --}}

                {{-- <tr>
               <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 10px; color: #4D4D4D; text-align: center; line-height: 18px;">Go to <a href="#">Spenny Piggy</a> where you can see your granted wish, send a message to your gifter and share your gift on social media </td>
            </tr> --}}



                {{-- <tr> --}}
                {{-- <td style="padding:0 0 10px 0; text-align: center;">
                  <button style="padding:13px 10px 13px 10px; width: 210px; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 10px; text-align: center; color:#ffffff; cursor: pointer;">See your granted wish</button>
               </td>
            </tr> --}}

            </table>
        </td>
    </tr>

    {{-- <tr>
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

                        <td valign="middle" style="padding-right: 10px"><a href="https://instagram.com/whoyouinto?igshid=OGQ5ZDc2ODk2ZA==
                        " target="_blank"><img src="https://whoyouinto.com/emails/user/instagramicon.png"></a></td>

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
                                 <td style="color:#8C52FF; font-family: Arial; font-size: 7.858px; font-style: normal; font-weight: 400; line-height: normal;">SSl Encryption</td>
                              </tr>
                           </table>
                        </td>
                        <td width="50%" style="padding: 0 0 0 5px">
                           <table align="left" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                 <td><img src="https://whoyouinto.com/emails/user/pciimg.png" alt="img"></td>
                                 <td style="color:#8C52FF; font-family: Arial; font-size: 7.858px; font-style: normal; font-weight: 400; line-height: normal;">SSl Encryption</td>
                              </tr>
                           </table>
                        </td>
                     </tr>
                  </table>
               </td>
            </tr>
            <tr>
               <td style="padding:15px 0 5px 0; font-family: Arial; font-weight: normal; font-size: 8px; line-height: 15px; color: #666666; text-align: center;">
                  You’re receiving this email because you’re a valued member of the Spenny Piggy community.
                 To stop receiving notification emails, Please click here</td>
            </tr>
            <tr>
               <td style="padding:0 0 10px 0; font-family: Arial; font-weight: normal; font-size: 8px; line-height: 15px; color: #666666; text-align: center;">To stop receiving notification emails, For Unsubscribe <br> Please <a href="#" style="color:#5D25FD">click here</a>
               </td>
            </tr>

            <tr>
               <td style="padding:0 0 10px; font-family: Arial; font-weight: normal; font-size: 8px; line-height: 15px; color: #666666; text-align: center; ">
                  Copyright &copy; 2023 Spenny Piggy
               </td>
            </tr>
         </table>
      </td>
   </tr> --}}
</table>
