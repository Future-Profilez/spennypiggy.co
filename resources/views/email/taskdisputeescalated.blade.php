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
        <td align="center" style="padding: 32px 28px 8px 28px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width: 440px; width: 100%;">

                {{-- Emoji badge --}}
                <tr>
                    <td align="center" style="padding: 0 0 18px 0;">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                            <tr>
                                <td align="center" valign="middle" bgcolor="#FFE6F2"
                                    style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                           -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                    🚩
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Heading --}}
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                               line-height:30px;padding:0 0 10px 0;text-align:center;">
                        Dispute Escalated
                    </td>
                </tr>

                {{-- Subline --}}
                <tr>
                    <td align="center"
                        style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:15px;color:#666666;
                               line-height:22px;padding:0 0 24px 0;text-align:center;">
                        {{ $message }}
                    </td>
                </tr>

                {{-- Details card --}}
                <tr>
                    <td style="padding:0 0 24px 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                            bgcolor="#FFF1F7"
                            style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                            <tr>
                                <td style="padding:20px 22px;">

                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                        <tr>
                                            <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 4px 0;">
                                                🆔 Order ID
                                            </td>
                                            <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 4px 0;">
                                                {{ $purchase->uuid }}
                                            </td>
                                        </tr>
                                    </table>

                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Gradient CTA button --}}
                <tr>
                    <td align="center" style="padding:0 0 12px 0;text-align:center;">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                            <tr>
                                <td align="center" bgcolor="#FF007F"
                                    style="background-color:#FF007F;
                                           background-image:linear-gradient(135deg,#FF007F 0%,#8C52FF 100%);
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    <a href="{{ route('task.show', $task->uuid) }}"
                                        style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                               font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                               border-radius:50px;-webkit-border-radius:50px;">
                                        View Task →
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
@endsection
