@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; text-align: center;">
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 22px; line-height: 30px;  color:F94F97; text-align: left; text-align: center;">
                        <br class="text-transform:capitalize;color:#F94F97 "> {{ $payment->payment->owner->name }} send a<br></br>
                            thankyou message for you. 
                         </b>
                    </td>
                </tr>
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;"><img style="max-width: 170px;"
                    src="https://whoyouinto.com/emails/user/thankyou.png" alt="img"></td>
                </tr>
                <tr>
                    <td
                        style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color:#000000; text-align: left; text-align: center;">
                        <b class="text-transform:capitalize">{{ $payment->message ?? '' }}.</b>
                    </td>
                </tr>
                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href="{{env('APP_URL')/wish-tracker}"
                            style="padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-family: Arial; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">See Message</a>
                    </td>
                </tr>
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
