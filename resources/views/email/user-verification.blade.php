   <tr>
        <td align="center" style="padding:10px 10px 20px 10px;"><a href="https://whoyouinto.com"><img alt="image" width="119" src="https://whoyouinto.com/emails/user/logo.png" style="border:none"></a></td>
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
                    <button style="background-color:#F94F97;color:white;border:none"><a
                            href="{{ env('APP_URL') }}/user/{{ $data['uuid'] }}" style="text-decoration:none;color:white">Verify Button</a></button>
                </tr>

                <tr>
                <td style="padding: 0 0 20px 0; font-family: Arial; font-weight: normal; font-size: 10px; color: #4D4D4D; text-align: center; line-height: 18px;">Go to <a href="#">Spenny Piggy</a> where you can see your granted wish, send a message to your gifter and share your gift on social media </td>
                </tr>
                <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                  <button style="padding:13px 10px 13px 10px; width: 210px; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 10px; text-align: center; color:#ffffff; cursor: pointer;">See your granted wish</button>
               </td>
            </tr>

            </table>
        </td>
    </tr>
