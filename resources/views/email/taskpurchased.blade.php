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
                    New <span style="color: #8C52FF">Task Order</span> Received! 📋
                </td>
            </tr>
            <tr>
                <td style="line-height:20px;height:20px;"></td>
            </tr>

            <tr>
                <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 18px; line-height: 27px; color: 141414; text-align: center;">
                    Great news! <br>
                    {{ $supporter ? $supporter->name : "A Guest" }} just purchased your task <strong>{{ $task->title }}</strong> for {{ $currencySymbol }}{{ $task->price }}.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    @if($task->type === 'instant')
                        This is an <strong>Instant Delivery</strong> task, so the content has been automatically delivered to the supporter. No action is required from you!
                    @else
                        This is a <strong>Timed Delivery</strong> task. Please log in to your dashboard to view the requirements and deliver the work within the SLA timeframe.
                    @endif
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>
            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/task/dashboard' }}"
                        style="display: inline-block; border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #F94F97; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                        Manage Order
                    </a>
                </td>
            </tr>
            <tr style="line-height: 10px; height: 10px;"><td></td></tr>

        </table>
    </td>
</tr>
@endsection
