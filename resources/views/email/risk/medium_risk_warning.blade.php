<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Warning: Medium Risk</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #333; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; } /* Yellow Header */
        .content { padding: 30px; }
        .alert-box { background-color: #fffdf5; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777; }
        .btn { display: inline-block; background-color: #ffc107; color: #333; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Warning</h1>
        </div>
        <div class="content">
            <h2>Hello {{ $user->name }},</h2>
            <p>Your account metrics have flagged a potential issue (Refund Rate: {{ number_format($metric->refund_rate_30d * 100, 1) }}%).</p>
            
            <div class="alert-box">
                <strong>Account Status: Medium Risk</strong><br>
                A {{ $metric->reserve_percent }}% rolling reserve has been temporarily applied.
            </div>

            <p>This is a precautionary measure. Reserves are released automatically after 90 days.</p>
            
            <a href="{{ url('/dashboard') }}" class="btn">View Dashboard</a>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Spenny Piggy. All rights reserved.
        </div>
    </div>
</body>
</html>
