@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none" alt="Spenny Piggy Logo">
        </a>
    </td>
</tr>
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; width: 100%; text-align: center;">
            <tr>
                <td style="font-family: Arial, sans-serif; font-weight: bold; font-size: 24px; color:#000; line-height: 32px; padding: 0 0 18px 0; text-align: center;">
                    Ticket <span style="color:#8C52FF">Updated</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 22px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    The creator has replied to your support request (Ticket #{{ strtoupper(explode('-', $ticket->uuid)[0]) }}).
                </td>
            </tr>
            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ $supportUrl }}" style="display:inline-block; border-radius:30px;padding:13px 30px;text-decoration:none;border:3px solid #000;background-color:#FF007F;font-family: Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;cursor:pointer;">View Message</a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection