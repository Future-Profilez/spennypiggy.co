@extends('email.default-2')
@section('content')
    @php
        $title = 'Dispute Escalated';
        
        if ($role == 'creator') {
            $message = "The proof for task '{$task->title}' has been rejected multiple times. The dispute has been escalated to the administrator for review. Please wait for further instructions.";
        } elseif ($role == 'admin') {
            $message = "A dispute has been escalated for task '{$task->title}'. The proof has been rejected multiple times. Please review the dispute in the admin panel.";
        } else {
            $message = "You have rejected the proof for task '{$task->title}' multiple times. The dispute has been escalated to the administrator for review. Please wait for further instructions.";
        }
    @endphp

    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <a href="{{ env('APP_URL') . '/' }}">
                <img alt="Spenny Piggy" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
            </a>
        </td>
    </tr>
    <tr>
        <td align="center" style="padding:10px 10px 20px 10px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 400px; width: 100%; text-align: center;">
                <tr>
                    <td style="font-family:Arial;font-weight:bold;font-size: 21px;color:#000;line-height: 26px;padding:0 0 25px 0;text-align:center">
                        ⚠️ Dispute Escalated
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-weight: normal; font-size: 16px; line-height: 24px; color: #4D4D4D; text-align: center;">
                        {{ $message }}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 20px 0; font-weight: bold; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                        Order ID: {{ $purchase->uuid }}
                    </td>
                </tr>
                <tr>
                    <td style="padding:0 0 10px 0; text-align: center;">
                        <a href="{{ route('task.show', $task->uuid) }}"
                            style="display: inline-block; border-radius:4px; padding:12px 24px; text-decoration:none; border:none; background-color: #F94F97; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">
                            View Task
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
