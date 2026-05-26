@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; text-align: left;">
            <tr>
                <td style="font-family: Arial; font-weight: bold; font-size: 18px; line-height: 26px; color: #141414; padding: 0 0 10px 0;">
                    Reminder: Please respond to a {{ $ticket->type === 'refund' ? 'refund request' : 'support message' }}
                </td>
            </tr>
            <tr>
                <td style="font-family: Arial; font-size: 14px; line-height: 22px; color: #4D4D4D; padding: 0 0 14px 0;">
                    Approximately {{ $hoursLeft }} hours left before escalation.
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0 0 0;">
                    <a href="{{ url('/creator/disputes') }}" style="display:inline-block; padding:10px 18px; background:#FF007F; color:#fff; text-decoration:none; border-radius:999px; font-family: Arial; font-weight:bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        Open Dispute & Refund Center
                    </a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection

