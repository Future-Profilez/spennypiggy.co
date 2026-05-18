@extends('email.default-2')
@section('content')
<tr>
         <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt=""
                     width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a></td>
     </tr>
     <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; width: 100%; margin: 0 auto; text-align: center;">
                <tr>
                    <td style="font-family: Arial, sans-serif; font-weight: bold; font-size: 21px; color: #000000; line-height: 26px; padding: 0 0 25px 0; text-align: center;" align="center">
                        New <span style="color: #8C52FF">Shop Item</span> claimed on <br> Spenny Piggy 🎁 </td>
                </tr>
                 <tr>
                     <td style="line-height:20px;height:20px;"></td>
                 </tr>
     
                 <tr>
                     <td style=" padding: 0 0 25px 0; text-align: center;"><img style="max-width: 200px;"
                             src="https://ucarecdn.com/84ef1131-a3fe-434c-a234-bd77f9590e7c/gifticon.png" alt="img"></td>
                 </tr>
                 <tr>
                    <td style="padding: 0 0 15px 0;  font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        Lucky you! <br></br>
                        @php
                            $fanName = $anon == false ? ucwords($data->name ?? 'A customer') : "Anonymous User";
                            $itemName = $data->shop?->name ?? 'a shop item';
                        @endphp
                        {{ $fanName }} just claimed {{ $itemName }} on Spenny Piggy for {{ $amountUserPay }} 🎁🥳 .
                    </td>
                </tr>
                 
                 @if($data->shop->type === 'physical')
                 <tr>
                     <td style="padding: 15px 0;">
                         <div style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF; text-align: center;">
                             <p style="font-family: Arial; font-size: 14px; color: #666; margin: 0; line-height: 1.4;">
                                 📦 <strong>New Order to Fulfill!</strong><br><br>
                                 Please make sure to process and ship this physical order. Once shipped, update the status in your dashboard so the gifter receives their tracking details.
                             </p>
                         </div>
                     </td>
                 </tr>
                 @else
                 <tr>
                     <td style="padding: 15px 0;">
                         <div style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #8C52FF; text-align: center;">
                             <p style="font-family: Arial; font-size: 14px; color: #666; margin: 0; line-height: 1.4;">
                                 📥 <strong>Digital Item Delivered!</strong><br><br>
                                 The gifter has been sent an email containing the secure link to access the digital content for this item.
                             </p>
                         </div>
                     </td>
                 </tr>
                 @endif
                 <tr>
                     <td style="padding: 0 0 20px 0;  font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; ">
                         Go to <a href="{{ env('APP_URL') . '/history' }}">Spenny Piggy</a> where you can see your granted items, send a message to
                         your gifter and share your gift on social media </td>
                 </tr>
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>
                 <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href="{{ env('APP_URL') . '/' }}"
                            style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F;  font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Go To Dashboard</a>
                    </td>
                </tr>
                 <tr style="line-height: 10px; height: 10px;"><td></td></tr>

             </table>
         </td>
     </tr>
@endsection
