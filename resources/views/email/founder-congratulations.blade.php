<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎉 Welcome to the Founder Program!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #e91e63;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1a202c;
            margin: 20px 0;
        }
        .emoji {
            font-size: 48px;
            margin: 20px 0;
        }
        .highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .earnings {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .benefits {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .benefit-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .benefit-icon {
            margin-right: 10px;
            font-size: 18px;
        }
        .cta {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: #e91e63;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SpennyPiggy</div>
            <div class="emoji">🎉</div>
            <h1 class="title">Congratulations, {{ $creator->name }}!</h1>
            <p>You're now officially a <strong>SpennyPiggy Founder</strong>!</p>
        </div>

        <div class="highlight">
            <h2>Your First 30-Day Achievement</h2>
            <div class="earnings">£{{ number_format($first30DayEarnings, 2) }}</div>
            <p>You've earned this incredible amount in your first 30 days on the platform!</p>
        </div>

        <p>We're thrilled to welcome you to our exclusive Founder Program. Your exceptional performance in your first month has earned you a place among our most successful creators.</p>

        <div class="benefits">
            <h3>🌟 Your Founder Benefits</h3>
            <div class="benefit-item">
                <span class="benefit-icon">💰</span>
                <span><strong>Monthly Bonus:</strong> Earn 10% extra on your monthly earnings (£100-£1000 range)</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">👑</span>
                <span><strong>Founder Badge:</strong> Special recognition on your profile</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">🎯</span>
                <span><strong>Priority Support:</strong> Direct access to our team</span>
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">📊</span>
                <span><strong>Advanced Analytics:</strong> Detailed insights into your performance</span>
            </div>
        </div>

        <div class="cta">
            <a href="{{ config('app.url') }}/founder/bonus" class="button">View Your Founder Dashboard</a>
        </div>

        <p><strong>What happens next?</strong></p>
        <ul>
            <li>Your founder badge will appear on your profile within 24 hours</li>
            <li>Monthly bonuses will be calculated automatically on the 7th of each month</li>
            <li>Payouts are processed via Stripe to your connected account</li>
            <li>You'll receive detailed monthly reports of your bonus earnings</li>
        </ul>

        <p>Keep up the amazing work! We're excited to see what you'll achieve as a SpennyPiggy Founder.</p>

        <div class="footer">
            <p>Best regards,<br>The SpennyPiggy Team</p>
            <p>Questions? Reply to this email or contact us at support@spennypiggy.co</p>
        </div>
    </div>
</body>
</html>