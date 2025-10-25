@extends('email.default-2')

@push('custom-css')
<style>
    .subscription-blocked-content {
        font-family: Arial, sans-serif !important;
    }
    
    .warning-box {
        background-color: #fef2f2;
        border: 2px solid #f87171;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
    }
    
    .status-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        text-align: center;
    }
    
    .cta-button {
        display: inline-block;
        background-color: #8C52FF;
        color: #ffffff !important;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        margin: 8px 4px;
    }
    
    .cta-button-pink {
        background-color: #F94F97;
    }
</style>
@endpush

@section('content')
<tr>
    <td align="center" style="padding:10px 10px 20px 10px;">
        <a href="{{ env('APP_URL') . '/' }}">
            <img alt="Spenny Piggy Logo" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none">
        </a>
    </td>
</tr>

<tr>
    <td align="center" style="padding:10px 20px 20px 20px;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;" class="subscription-blocked-content">
            <tr>
                <td style="font-weight: 700; font-size: 24px; color:#F94F97; text-align: center; padding: 0 0 16px 0;">
                    🚨 Payment Alert - Subscription Required
                </td>
            </tr>
            
            <tr>
                <td style="font-size: 16px; color: #1e293b; padding: 0 0 16px 0; text-align: center;">
                    Hi {{ $creator->name }}! 👋
                </td>
            </tr>
            
            <tr>
                <td style="font-size: 14px; color: #64748b; padding: 0 0 20px 0; line-height: 20px; text-align: center;">
                    Someone just tried to pay you @if($paymentAmount)<strong style="color: #F94F97;">£{{ number_format($paymentAmount, 2) }}</strong>@endif, but the payment couldn't be completed because your creator subscription is not active.
                </td>
            </tr>

            <tr>
                <td class="warning-box">
                    <div style="font-size: 16px; font-weight: bold; color: #dc2626; margin: 0 0 8px 0;">
                        ⚠️ Active Subscription Required
                    </div>
                    <div style="font-size: 14px; color: #7f1d1d;">
                        You need an <strong>active creator subscription</strong> to receive payments from supporters.
                    </div>
                </td>
            </tr>

            <tr><td style="height: 20px;"></td></tr>


            
            <tr>
                <td style="padding: 24px 0 12px 0; font-size: 18px; font-weight: bold; color: #1e293b; text-align: center;">
                    🚀 Get Back Online in Minutes:
                </td>
            </tr>
            
            @if($subscriptionData['status'] === 'trial_active' && isset($subscriptionData['action_required']))
            <tr>
                <td style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td style="width: 40px; vertical-align: middle; text-align: center;">
                                <div style="background: #f59e0b; width: 32px; height: 32px; border-radius: 8px; line-height: 32px; text-align: center; color: white; font-size: 16px;">⏰</div>
                            </td>
                            <td style="padding-left: 12px; vertical-align: middle;">
                                <div style="font-weight: bold; color: #1e293b; font-size: 16px;">Update Payment Method</div>
                                <div style="font-size: 12px; color: #f59e0b; font-weight: 600;">Trial ending soon</div>
                            </td>
                            <td style="text-align: right; vertical-align: middle;">
                                <a href="{{ env('APP_URL') . '/subscription/manage' }}" style="background: #F94F97; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600;">Update Now</a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @else
            <tr>
                <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 8px 0;">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td style="width: 40px; vertical-align: middle; text-align: center;">
                                <div style="background: #22c55e; width: 32px; height: 32px; border-radius: 8px; line-height: 32px; text-align: center; color: white; font-size: 16px;">🔄</div>
                            </td>
                            <td style="padding-left: 12px; vertical-align: middle;">
                                <div style="font-weight: bold; color: #1e293b; font-size: 16px;">Reactivate Subscription</div>
                                <div style="font-size: 12px; color: #22c55e; font-weight: 600;">3 minutes</div>
                            </td>
                            <td style="text-align: right; vertical-align: middle;">
                                <a href="{{ env('APP_URL') . '/subscription/manage' }}" style="background: #F94F97; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600;">Reactivate</a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @endif


            
            <tr>
                <td style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; border: 1px solid #bfdbfe;">
                    <div style="color: #0c4a6e; font-size: 13px; line-height: 18px;">
                        💡 <strong>Good news:</strong> Once your subscription is active, payments will automatically resume and you won't miss any future opportunities!
                    </div>
                </td>
            </tr>
            
            <tr>
                <td style="font-size: 18px; font-weight: bold; color: #1e293b; text-align: center; padding: 16px 0 8px 0;">
                    Don't let your supporters down!
                </td>
            </tr>
            
            <tr>
                <td style="font-size: 14px; color: #64748b; text-align: center; padding: 0 0 16px 0;">
                    Your fans are eager to support your amazing work 💖
                </td>
            </tr>
            
            <tr>
                <td style="font-size: 12px; color: #94a3b8; text-align: center; padding: 16px 0; line-height: 18px;">
                    Need help? Reply to this email or contact our support team.<br>
                    We're here to help you succeed! ✨
                </td>
            </tr>

            <tr>
                <td style="padding: 16px 0 0 0; font-size: 14px; color: #1e293b; text-align: center; font-weight: bold;">
                    Keep creating! 🎨<br>
                    <span style="color: #8C52FF;">The Spenny Piggy Team</span>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection