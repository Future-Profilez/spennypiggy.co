@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;"><a href="{{ env('APP_URL') . '/' }}"><img alt="image"
                    width="119" src="https://ucarecdn.com/8df7911e-6a62-4bb4-967c-9ec0fda23c16/spennyPiggyMailLogo.png" style="border:none"></a></td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width: 296px; width: 100%; text-align: center;">
                <tr>
                    <td
                        style="font-family: Arial; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                        🚨 Your Wishlist Item on Spenny Piggy was Removed 🚨 </td>
                </tr>
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>

                <tr>
                    <td style=" padding: 0 0 25px 0; text-align: center;">
                        <img src="https://ucarecdn.com/4e45b4c3-8538-496f-8873-b5fd53115c50/giftimg.png" alt="img">
                    </td>
                </tr>
                <tr>

                    <td
                        style="padding: 0 0 15px 0; font-family: Arial; font-weight: bold;  font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        The item posted was flagged by our AI for unwanted adult content. Please note that multiple removals will result in account suspension and possible termination. We are working hard to ensure that Spenny Piggy can operate for years to come and as our payment processor does not allow adult content, we have a due diligence to remove it. If you believe this was an error please reach out to support.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
