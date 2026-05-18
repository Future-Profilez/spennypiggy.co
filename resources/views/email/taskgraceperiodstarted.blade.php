@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img alt="Spenny Piggy" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 296px; width: 100%; text-align: center;">
            <tr>
                <td style="font-family:Arial;font-weight:bold;font-size: 21px;color:#000;line-height: 26px;padding:0 0 25px 0;text-align:center">
                    Grace Period Started ⏳
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: 141414; text-align: center;">
                    Task: <strong>{{ $data['title'] }}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Your task has passed its original deadline. You have entered a <strong>1-hour grace period</strong>.<br><br>
                    Please submit your work immediately. If not completed within the grace period, the order will be cancelled and refunded automatically.
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/task/dashboard' }}"
                        style="display: inline-block; border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                        Go to Dashboard
                    </a>
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>

        </table>
    </td>
</tr>
@endsection
