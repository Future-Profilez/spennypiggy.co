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
                    Proof <span style="color: #FF0000">Rejected</span> ⚠️
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: 141414; text-align: center;">
                    Attention Needed <br>
                    <strong>{{ $supporter->name }}</strong> has rejected your proof for the task <strong>{{ $task->title }}</strong>.
                </td>
            </tr>
             <tr>
                <td style="padding: 0 0 15px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center; background-color: #FFF0F0; border-radius: 8px;">
                    <strong>Reason:</strong><br>
                    "{{ $purchase->rejection_reason }}"
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Please review the feedback and upload a new proof or contact the supporter.
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/tasks/dashboard' }}"
                        style="display: inline-block; border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                        View Order
                    </a>
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
        </table>
    </td>
</tr>
@endsection
