@extends('email.default-2')

@push('custom-css')
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    .pending-summary-content * {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif !important;
    }
    
    .pending-item {
        background: linear-gradient(135deg, #f8f9ff 0%, #f1f3ff 100%);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 20px;
        margin: 12px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(140, 82, 255, 0.08);
        transition: all 0.2s ease;
    }
    
    .pending-item:hover {
        box-shadow: 0 4px 16px rgba(140, 82, 255, 0.12);
        transform: translateY(-1px);
    }
    
    .pending-item-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .pending-item-icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #8C52FF 0%, #a855f7 100%);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .pending-item-label {
        font-weight: 600;
        font-size: 16px;
        color: #1e293b;
        margin: 0;
    }
    
    .pending-item-count {
        background: linear-gradient(135deg, #8C52FF 0%, #a855f7 100%);
        color: #ffffff;
        font-weight: 700;
        font-size: 14px;
        padding: 6px 12px;
        border-radius: 20px;
        min-width: 28px;
        text-align: center;
    }
    
    .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #8C52FF 0%, #a855f7 100%);
        color: #ffffff !important;
        padding: 16px 32px;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 4px 16px rgba(140, 82, 255, 0.24);
        transition: all 0.2s ease;
    }
    
    .cta-button:hover {
        box-shadow: 0 6px 20px rgba(140, 82, 255, 0.32);
        transform: translateY(-2px);
    }
    
    @media only screen and (max-width: 600px) {
        .pending-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
        }
        
        .pending-item-left {
            width: 100%;
        }
        
        .pending-item-count {
            align-self: flex-end;
        }
        
        .cta-button {
            padding: 14px 28px;
            font-size: 15px;
        }
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
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; text-align: center;" class="pending-summary-content">
            <tr>
                <td style="font-weight: 700; font-size: 28px; color:#1e293b; line-height: 36px; padding: 0 0 16px 0;">
                    <span style="color: #8C52FF">📊 Pending Approval Summary</span>
                </td>
            </tr>
            
            <tr>
                <td style="font-size: 16px; color: #64748b; padding: 0 0 32px 0; line-height: 24px;">
                    Hello Admin! 👋<br>
                    Here's your latest summary of items awaiting approval:
                </td>
            </tr>

            <tr>
                <td style="padding: 0 0 32px 0;">
                    <div style="text-align: left;">
                        @foreach ($pendingSummary as $entry)
                        <div class="pending-item">
                            <div class="pending-item-left">
                                <div class="pending-item-icon">
                                    {{ $entry['icon'] ?? '📋' }}
                                </div>
                                <h3 class="pending-item-label">{{ $entry['label'] }}</h3>
                            </div>
                            <div class="pending-item-count">
                                {{ $entry['count'] }}
                            </div>
                        </div>
                        @endforeach
                    </div>
                </td>
            </tr>

            <tr>
                <td style="padding: 0 0 32px 0; text-align: center;">
                    <a href="{{ env('APP_URL') . '/login' }}" class="cta-button">
                        🔍 Review All Items
                    </a>
                </td>
            </tr>
            
            <tr>
                <td style="padding: 24px 20px; background: linear-gradient(135deg, #f8f9ff 0%, #f1f3ff 100%); border-radius: 12px; margin: 16px 0;">
                    <div style="font-size: 14px; color: #64748b; line-height: 20px; text-align: center;">
                        💡 <strong>Pro Tip:</strong> Items with pending edit requests are automatically excluded from this summary to keep things organized.
                    </div>
                </td>
            </tr>

            <tr>
                <td style="padding: 20px 0 0 0; font-size: 16px; color: #64748b; text-align: center; line-height: 24px;">
                    Thanks for keeping Spenny Piggy running smoothly! 🚀
                    <br><br>
                    <span style="font-size: 14px; color: #94a3b8;">This notification was sent at {{ now()->format('M j, Y \a\t g:i A') }}</span>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endsection
