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
                    <td style="font-weight: bold; font-size: 24px; color: {{ $state === 'FREEZE' ? '#e3342f' : ($state === 'THROTTLE' ? '#f6993f' : '#38c172') }}; line-height: 32px; padding: 0 0 25px 0; text-align: center;">
                        Platform Risk Alert: {{ $state }}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 0 15px 0; font-weight: bold; font-size: 16px; line-height: 24px; color: #141414; text-align: center;">
                        The automated Risk Engine has detected anomaly metrics and updated the platform state.
                    </td>
                </tr>

                <tr>
                    <td style="padding: 10px 0 5px 0; text-align: left; font-weight: bold; font-size: 16px; border-bottom: 1px solid #eee;">
                        Reasons
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0 20px 0; text-align: left;">
                        @if(count($reasons) > 0)
                            <ul style="margin: 0; padding-left: 20px; color: #4D4D4D;">
                                @foreach($reasons as $reason)
                                    <li style="margin-bottom: 5px;">{{ $reason }}</li>
                                @endforeach
                            </ul>
                        @else
                            <p style="margin: 0; color: #4D4D4D;">No specific reasons provided.</p>
                        @endif
                    </td>
                </tr>

                <tr>
                    <td style="padding: 0 0 5px 0; text-align: left; font-weight: bold; font-size: 16px; border-bottom: 1px solid #eee;">
                        Trigger Metrics
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0 20px 0; text-align: left;">
                        @if(count($metrics) > 0)
                            <ul style="margin: 0; padding-left: 20px; color: #4D4D4D;">
                                @foreach($metrics as $key => $value)
                                    <li style="margin-bottom: 5px;"><strong>{{ $key }}:</strong> {{ $value }}</li>
                                @endforeach
                            </ul>
                        @else
                            <p style="margin: 0; color: #4D4D4D;">No specific metrics provided.</p>
                        @endif
                    </td>
                </tr>

                <tr>
                    <td style="padding: 20px 0 20px 0; text-align: center;">
                        <a href="{{ env('APP_URL') }}/admin/dashboard" style="border-radius:30px;padding:13px 30px 13px 30px; width: 210px; text-decoration:none; border:none;background-color: #FF007F; font-weight: bold; font-size: 15px; text-align: center; color:#ffffff; cursor: pointer;">Go to Admin Dashboard</a>
                    </td>
                </tr>
                
                <tr>
                    <td style="padding: 0 0 20px 0; font-weight: normal; font-size: 12px; line-height: 18px; color: #999; text-align: center;">
                        This action was taken automatically by the Risk Engine.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
@endsection
