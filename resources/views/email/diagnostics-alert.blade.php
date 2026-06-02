@extends('email.default-2')
@section('content')

{{-- Header --}}
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ $appUrl }}">
            <img alt="Spenny Piggy" width="119"
                 src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png"
                 style="border:none">
        </a>
    </td>
</tr>

{{-- Overall Status Banner --}}
<tr>
    <td style="padding: 0 20px 20px 20px;">
        @php
            $bannerColor = $overallStatus === 'failed' ? '#dc2626' : ($overallStatus === 'warning' ? '#d97706' : '#16a34a');
            $bannerText  = $overallStatus === 'failed' ? '🚨 System Issues Detected' : ($overallStatus === 'warning' ? '⚠️ Warnings Detected' : '✅ All Systems Operational');
        @endphp
        <table width="100%" cellspacing="0" cellpadding="0" border="0"
               style="background-color: {{ $bannerColor }}; border-radius: 8px;">
            <tr>
                <td style="padding: 16px 20px; text-align: center;
                           font-family: Arial, sans-serif; font-size: 18px;
                           font-weight: bold; color: #ffffff;">
                    {{ $bannerText }}
                </td>
            </tr>
        </table>
    </td>
</tr>

{{-- Meta Info --}}
<tr>
    <td style="padding: 0 20px 16px 20px; font-family: Arial, sans-serif; font-size: 13px; color: #6b7280; text-align: center;">
        Environment: <strong>{{ strtoupper($environment) }}</strong> &nbsp;|&nbsp;
        Run at: <strong>{{ $timestamp }}</strong><br>
        Failed: <strong style="color:#dc2626;">{{ $failedCount }}</strong> &nbsp;|&nbsp;
        Warnings: <strong style="color:#d97706;">{{ $warningCount }}</strong>
    </td>
</tr>

{{-- Diagnostic Results Table --}}
<tr>
    <td style="padding: 0 20px 20px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0"
               style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

            {{-- Table Header --}}
            <tr style="background-color: #f9fafb;">
                <td style="padding: 10px 14px; font-family: Arial, sans-serif;
                           font-size: 11px; font-weight: bold; color: #374151;
                           text-transform: uppercase; letter-spacing: 0.05em;
                           border-bottom: 1px solid #e5e7eb; width: 30px;">
                </td>
                <td style="padding: 10px 14px; font-family: Arial, sans-serif;
                           font-size: 11px; font-weight: bold; color: #374151;
                           text-transform: uppercase; letter-spacing: 0.05em;
                           border-bottom: 1px solid #e5e7eb;">
                    Check
                </td>
                <td style="padding: 10px 14px; font-family: Arial, sans-serif;
                           font-size: 11px; font-weight: bold; color: #374151;
                           text-transform: uppercase; letter-spacing: 0.05em;
                           border-bottom: 1px solid #e5e7eb;">
                    Result
                </td>
                <td style="padding: 10px 14px; font-family: Arial, sans-serif;
                           font-size: 11px; font-weight: bold; color: #374151;
                           text-transform: uppercase; letter-spacing: 0.05em;
                           border-bottom: 1px solid #e5e7eb; text-align: right;">
                    Time
                </td>
            </tr>

            @php
                $checkLabels = [
                    'routes_syntax'       => 'Code Syntax & Routes',
                    'database'            => 'Database',
                    'cache'               => 'Cache / Redis',
                    'signup_flow'         => 'Sign Up Flow',
                    'wish_items'          => 'Wish Items',
                    'bills'               => 'Bills',
                    'memberships'         => 'Memberships',
                    'shop_items'          => 'Shop Items',
                    'tasks'               => 'Tasks',
                    'cart_flow'           => 'Cart Flow',
                    'social_flow'         => 'Social Flow',
                    'profile_update'      => 'Profile Update',
                    'search_engine'       => 'Search Engine',
                    'stripe_id_flow'      => 'Stripe Connect & ID',
                    'stripe_payments'     => 'Stripe Payments',
                    'email'               => 'Email Service',
                    'push_notifications'  => 'Push Notifications',
                    'uploadcare'          => 'Image Hosting',
                    'intercom'            => 'Support Chat',
                    'queue_health'        => 'Queue Health',
                    'recent_errors'       => 'Recent Error Log',
                    'financial_integrity' => 'Financial Integrity',
                    'referral_system'     => 'Referral System',
                    'storage_permissions' => 'Storage Permissions',
                    'disk_space'          => 'Disk Space',
                    'env_variables'       => 'Environment Variables',
                    'stripe_webhook'      => 'Stripe Webhook Config',
                    'scheduled_tasks'     => 'Scheduled Tasks / Cron',
                ];
            @endphp

            @foreach($results as $key => $result)
                @php
                    $status = $result['status'] ?? 'unknown';
                    $rowBg  = $status === 'failed' ? '#fef2f2' : ($status === 'warning' ? '#fffbeb' : '#ffffff');
                    $icon   = $status === 'passed' ? '✅' : ($status === 'failed' ? '❌' : '⚠️');
                    $msgColor = $status === 'failed' ? '#991b1b' : ($status === 'warning' ? '#92400e' : '#166534');
                    $label  = $checkLabels[$key] ?? str_replace('_', ' ', ucwords($key, '_'));
                @endphp
                <tr style="background-color: {{ $rowBg }}; border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 14px; text-align: center; font-size: 16px;">
                        {{ $icon }}
                    </td>
                    <td style="padding: 10px 14px; font-family: Arial, sans-serif;
                               font-size: 13px; font-weight: 600; color: #111827;">
                        {{ $label }}
                        @if(!empty($result['errors']))
                            <br>
                            @foreach(array_slice($result['errors'], 0, 3) as $err)
                                <span style="font-size: 11px; font-weight: normal; color: #dc2626; display: block; margin-top: 2px;">
                                    → {{ Str::limit($err, 120) }}
                                </span>
                            @endforeach
                            @if(count($result['errors']) > 3)
                                <span style="font-size: 11px; color: #6b7280;">
                                    +{{ count($result['errors']) - 3 }} more...
                                </span>
                            @endif
                        @endif
                    </td>
                    <td style="padding: 10px 14px; font-family: Arial, sans-serif;
                               font-size: 12px; color: {{ $msgColor }};">
                        {{ Str::limit($result['message'] ?? '', 80) }}
                    </td>
                    <td style="padding: 10px 14px; font-family: Arial, sans-serif;
                               font-size: 11px; color: #9ca3af; text-align: right; white-space: nowrap;">
                        {{ isset($result['time_ms']) ? $result['time_ms'] . 'ms' : '-' }}
                    </td>
                </tr>
            @endforeach
        </table>
    </td>
</tr>

{{-- CTA Button --}}
<tr>
    <td align="center" style="padding: 0 20px 30px 20px;">
        <a href="{{ $appUrl }}/admin/system-diagnostics"
           style="display: inline-block; background-color: #4f46e5; color: #ffffff;
                  font-family: Arial, sans-serif; font-size: 14px; font-weight: bold;
                  padding: 12px 28px; border-radius: 6px; text-decoration: none;">
            View Full Dashboard →
        </a>
    </td>
</tr>

{{-- Footer --}}
<tr>
    <td align="center" style="padding: 0 20px 20px 20px;
                               font-family: Arial, sans-serif; font-size: 11px; color: #9ca3af;">
        This is an automated alert from the Spenny Piggy platform monitoring system.<br>
        Sent to platform administrators only.
    </td>
</tr>

@endsection
