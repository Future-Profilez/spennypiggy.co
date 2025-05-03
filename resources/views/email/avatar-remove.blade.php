@extends('email.default-2')
@section('content')
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <a href="{{ env('APP_URL') . '/' }}">
                <img alt="image" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
            </a>
        </td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:330px; width: 100%; text-align: center;">
                <tr>
                    <td style=" font-weight: bold; font-size: 50px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                    🚨 </td>
                </tr>
                <tr>
                    <td style=" font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                        Your Profile Pic on Spenny Piggy was Removed</td>
                </tr>
                <tr>
                    <td style="line-height:20px;height:20px;"></td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        The Profile Pic posted was flagged by our AI for unwanted adult content. Please note that multiple removals will result in account suspension and possible termination.
                        
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-size: 18px; line-height: 27px;  color: 141414; text-align: left; text-align: center;">
                        We are working hard to ensure that Spenny Piggy can operate for years to come and as our payment processor does not allow adult content, we have a due diligence to remove it. If you believe this was an error please reach out to support.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
