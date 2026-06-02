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
                    Support Request <span style="color:#8C52FF">Received</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 22px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    Your {{ $ticket->type === 'refund' ? 'refund request' : 'support message' }} has been successfully sent to the creator. They have been asked to respond within 48 hours.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:3px solid #000;border-radius:20px;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);">
                        <tr>
                            <td style="padding:16px;text-align:left;">
                                <div style="font-family: Arial; font-weight: 900; font-size: 14px; color:#000; text-transform:uppercase; margin-bottom:10px;">Ticket Details</div>
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family: Arial; font-size: 14px;">
                                    <tr>
                                        <td style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:700;color:#555;">Ticket No.</td>
                                        <td align="right" style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:900;color:#000;">#{{ strtoupper(explode('-', $ticket->uuid)[0]) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:700;color:#555;">Type</td>
                                        <td align="right" style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:900;color:#000;">{{ str_replace('_', ' ', strtoupper($ticket->event_type ?? 'support')) }}</td>
                                    </tr>
                                    @if($ticket->payment)
                                    <tr>
                                        <td style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:700;color:#555;">Amount Paid</td>
                                        <td align="right" style="padding:8px 0;border-bottom:1px dashed #ccc;font-weight:900;color:#000;">{{ strtoupper($ticket->payment->currency) }} {{ number_format($ticket->payment->amount / 100, 2) }}</td>
                                    </tr>
                                    @endif
                                </table>
                                @if(!empty($ticket->reason))
                                <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #ccc;">
                                    <div style="font-family: Arial; font-weight: 900; font-size: 12px; color:#000; text-transform:uppercase; margin-bottom:6px;">Reason</div>
                                    <div style="font-family: Arial; font-size: 13px; color:#141414; font-weight:700;">{{ $ticket->reason }}</div>
                                </div>
                                @endif
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding:0 0 10px 0; text-align: center;">
                    <a href="{{ $supportUrl }}" style="display:inline-block; border-radius:30px;padding:13px 30px;text-decoration:none;border:3px solid #000;background-color:#FF007F;font-family: Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;cursor:pointer;">View Request</a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection