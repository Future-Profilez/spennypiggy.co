# Pending Approval Manual Trigger Endpoint

## Overview

The `/pending-approval/manual-trigger` endpoint allows you to manually execute the same logic as the automated pending approval job that runs every 30 minutes.

## Endpoint Details

- **URL**: `GET /pending-approval/manual-trigger`
- **Route Name**: `pending-approval.trigger`
- **Authentication**: None (no middleware protection)
- **Environments**: Available in all environments (dev, staging, production)

## What it does

When you hit this endpoint, it will:

1. **Run the same logic as the scheduled job**: Collects all unapproved items from the database:
   - Wish Items (with `is_approved = 0`)
   - Memberships (with `approved = 0`)
   - Bills (with `approved = 0`) 
   - Shops (with `approved = 0`)
   - User Intros (with `approved = 0`)
   - User Avatars (users with `avatar_approved = 0`)
   - User Profiles (pending creator/gifter profiles)
   - Posts (with `approved = 0`)

2. **Send the actual summary email**: If any pending items are found, it sends the email to the configured recipients based on your current environment's configuration

3. **Return the counts as JSON**: Shows you exactly what data the job processed

## Response Format

### Success Response (with pending items)
```json
{
    "status": "success",
    "message": "Pending approval email sent successfully.",
    "email_sent": true,
    "summary": [
        {
            "label": "Wish Items",
            "count": 5,
            "items": [...],
            "icon": "🎁"
        },
        {
            "label": "User Avatars", 
            "count": 3,
            "items": [...],
            "icon": "👤"
        }
    ],
    "timestamp": "2025-01-18T09:38:55.000000Z"
}
```

### Success Response (no pending items)
```json
{
    "status": "success",
    "message": "No pending items found to send.",
    "email_sent": false,
    "summary": [],
    "timestamp": "2025-01-18T09:38:55.000000Z"
}
```

### Error Response
```json
{
    "status": "error", 
    "message": "Failed to process pending approval summary: [error details]",
    "email_sent": false,
    "summary": [],
    "timestamp": "2025-01-18T09:38:55.000000Z"
}
```

## Security Considerations

⚠️ **Important**: This endpoint has no authentication or authorization middleware, making it accessible to anyone who knows the URL. 

- **Keep the URL private** if you're concerned about unauthorized access
- Consider adding authentication middleware if needed for your use case
- The endpoint is intentionally public to work across all environments without authentication barriers

## Usage Examples

### Development
```bash
curl https://dev.spennypiggy.co/pending-approval/manual-trigger
```

### Production  
```bash
curl https://spennypiggy.co/pending-approval/manual-trigger
```

## Related Files

- **Service**: `app/Services/PendingApprovalService.php` - Contains the core logic
- **Controller**: `app/Http/Controllers/PendingApprovalController.php` - Handles the HTTP request
- **Command**: `app/Console/Commands/SendPendingApprovalNotifications.php` - Scheduled command that uses the same service
- **Routes**: `routes/web.php` - Where the route is defined
- **Email Template**: `resources/views/email/pending_approval_summary.blade.php` - The email template used

## Configuration

Email recipients are configured in your `config/pending-approval.php` file based on environment domains.
