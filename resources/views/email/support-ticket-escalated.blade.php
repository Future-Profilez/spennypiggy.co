@extends('email.default-2')
@section('content')
@php
    $appEnv = env('APP_ENV', 'production');
    $adminBaseUrl = 'https://admin.spennypiggy.co';
    
    if ($appEnv === 'local') {
        $adminBaseUrl = 'http://localhost:8001';
    } elseif (in_array($appEnv, ['development', 'dev', 'staging'])) {
        $adminBaseUrl = 'https://dev.admin.spennypiggy.co';
    }
    
    $adminUrl = $adminBaseUrl . '/support/tickets';
@endphp
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
                    Ticket <span style="color:#FF007F">Escalated</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 22px 0; font-family: Arial; font-weight: normal; font-size: 14px; line-height: 22px; color: #4D4D4D; text-align: center;">
                    A support ticket has breached the SLA deadline and requires administrative review.
                </td>
            </tr>
            <tr>
                <td style="padding: 0 0 18px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:3px solid #000;border-radius:20px;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);">
                        <tr>
                            <td style="padding: 20px; text-align: left;">
                                <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 12px; color:#666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                                    Ticket ID
                                </div>
                                <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color:#000; margin-bottom: 16px;">
                                    #{{ strtoupper(explode('-', $ticket->uuid)[0]) }}
                                </div>
                                
                                <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 12px; color:#666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                                    Type
                                </div>
                                <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color:#000; margin-bottom: 16px;">
                                    {{ strtoupper($ticket->type) }}
                                </div>

                                <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 12px; color:#666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                                    Status
                                </div>
                                <div style="font-family: Arial, sans-serif; font-weight: bold; font-size: 14px; color:#fff; background:#FF007F; display:inline-block; padding: 6px 12px; border-radius: 8px; border: 2px solid #000; text-transform: uppercase;">
                                    {{ strtoupper($ticket->status) }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding:10px 0 10px 0; text-align: center;">
                    <a href="{{ $adminUrl }}" style="display:inline-block; border-radius:30px;padding:13px 30px;text-decoration:none;border:3px solid #000;background-color:#FF007F;font-family: Arial;font-weight:bold;font-size: 15px;text-align:center;color:#ffffff;cursor:pointer;">
                        Open Admin Inbox
                    </a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection

