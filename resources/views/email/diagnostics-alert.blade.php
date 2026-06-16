@extends('email.default-2')
@section('content')
<tr>
    <td align="center" style="padding:32px 28px 8px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:440px;width:100%;">

            {{-- Emoji badge --}}
            <tr>
                <td align="center" style="padding:0 0 18px 0;">
                    <table cellspacing="0" cellpadding="0" border="0" role="presentation" align="center">
                        <tr>
                            <td align="center" valign="middle" bgcolor="#FFE6F2"
                                style="width:68px;height:68px;background-color:#FFE6F2;border-radius:50%;
                                       -webkit-border-radius:50%;text-align:center;font-size:34px;line-height:68px;">
                                🔧
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            @php
                $bannerText  = $overallStatus === 'failed' ? '🚨 System Issues Detected' : ($overallStatus === 'warning' ? '⚠️ Warnings Detected' : '✅ All Systems Operational');
            @endphp

            {{-- Heading --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:800;font-size:22px;color:#1A1A1A;
                           line-height:30px;padding:0 0 16px 0;text-align:center;">
                    {{ $bannerText }}
                </td>
            </tr>

            {{-- Meta card --}}
            <tr>
                <td style="padding:0 0 20px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:20px 22px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:0 0 4px 0;">
                                            🌐 Environment
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:0 0 4px 0;">
                                            {{ strtoupper($environment) }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            🕒 Run At
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $timestamp }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 4px 0;">
                                            ❌ Failed
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#c53030;font-weight:700;padding:8px 0 4px 0;">
                                            {{ $failedCount }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;padding:8px 0 0 0;">
                                            ⚠️ Warnings
                                        </td>
                                        <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1A1A1A;font-weight:700;padding:8px 0 0 0;">
                                            {{ $warningCount }}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
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

            {{-- Results card --}}
            <tr>
                <td style="padding:0 0 24px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"
                        bgcolor="#FFF1F7"
                        style="background-color:#FFF1F7;border-radius:16px;-webkit-border-radius:16px;">
                        <tr>
                            <td style="padding:18px 20px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                                    @foreach($results as $key => $result)
                                        @php
                                            $status = $result['status'] ?? 'unknown';
                                            $icon   = $status === 'passed' ? '✅' : ($status === 'failed' ? '❌' : '⚠️');
                                            $msgColor = $status === 'failed' ? '#c53030' : ($status === 'warning' ? '#8C52FF' : '#666666');
                                            $label  = $checkLabels[$key] ?? str_replace('_', ' ', ucwords($key, '_'));
                                        @endphp
                                        <tr>
                                            <td valign="top" style="font-family:'Outfit',Arial,sans-serif;font-size:14px;padding:0 0 8px 0;">
                                                {{ $icon }} <span style="color:#1A1A1A;font-weight:700;">{{ $label }}</span>
                                                <span style="color:{{ $msgColor }};font-weight:400;">— {{ Str::limit($result['message'] ?? '', 80) }}</span>
                                                @if(!empty($result['errors']))
                                                    @foreach(array_slice($result['errors'], 0, 3) as $err)
                                                        <span style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#c53030;display:block;padding:2px 0 0 16px;">
                                                            → {{ Str::limit($err, 120) }}
                                                        </span>
                                                    @endforeach
                                                    @if(count($result['errors']) > 3)
                                                        <span style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#999999;display:block;padding:0 0 0 16px;">
                                                            +{{ count($result['errors']) - 3 }} more...
                                                        </span>
                                                    @endif
                                                @endif
                                            </td>
                                            <td valign="top" align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#999999;white-space:nowrap;padding:0 0 8px 0;">
                                                {{ isset($result['time_ms']) ? $result['time_ms'] . 'ms' : '-' }}
                                            </td>
                                        </tr>
                                    @endforeach
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
                                <a href="{{ $appUrl }}/admin/system-diagnostics"
                                    style="display:inline-block;font-family:'Outfit',Arial,sans-serif;font-weight:700;
                                           font-size:15px;color:#ffffff;text-decoration:none;padding:14px 38px;
                                           border-radius:50px;-webkit-border-radius:50px;">
                                    View Full Dashboard →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            {{-- Footer note --}}
            <tr>
                <td align="center"
                    style="font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:13px;color:#999999;
                           line-height:20px;padding:0 0 12px 0;text-align:center;">
                    This is an automated alert from the Spenny Piggy platform monitoring system.<br>
                    Sent to platform administrators only.
                </td>
            </tr>

        </table>
    </td>
</tr>
@endsection
