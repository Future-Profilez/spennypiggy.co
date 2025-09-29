# Log Management Security

This document explains how the log management system is secured with token-based authentication for production environments.

## Security Overview

The log management system at `/admin/logs` is protected with different security levels based on the application environment:

### Local Development (`APP_ENV=local`)
- **Access**: Open access without authentication
- **Reason**: For development convenience
- **Security**: Not exposed to public internet

### Staging/Development (`APP_ENV=staging` or other non-production)
- **Access**: Requires user authentication + admin role (role=0) OR valid LOG_DEBUG_TOKEN
- **Reason**: Basic protection while allowing developer access
- **Security**: User session-based or token-based

### Production (`APP_ENV=production`)
- **Access**: Requires valid LOG_DEBUG_TOKEN ONLY
- **Reason**: Maximum security - no user authentication dependencies
- **Security**: Token-based access only

## LOG_DEBUG_TOKEN Configuration

### Setting the Token

1. **Generate a secure token:**
   ```bash
   openssl rand -hex 32
   ```

2. **Add to your production `.env` file:**
   ```env
   LOG_DEBUG_TOKEN=your_secure_64_character_hex_token_here
   ```

3. **Keep this token SECRET** - treat it like a password

### Token Usage

#### Web Interface Access
```
https://yourproductionsite.com/admin/logs?token=YOUR_LOG_DEBUG_TOKEN
```

#### API Access
```bash
# Using query parameter
curl "https://yourproductionsite.com/api/debug/logs?token=YOUR_LOG_DEBUG_TOKEN"

# Using header
curl -H "X-Log-Debug-Token: YOUR_LOG_DEBUG_TOKEN" "https://yourproductionsite.com/api/debug/logs"
```

## Available Endpoints

### Web Interface
- `GET /admin/logs` - Log management web interface
- Requires `?token=TOKEN` parameter in production

### API Endpoints
- `GET /api/debug/logs` - Fetch log contents (supports search, pagination)
- `POST /api/debug/logs/clear` - Clear log files
- `GET /api/debug/logs/download` - Download log files
- `GET /api/test-logs` - Simple log test (last 50 lines)
- `GET /api/simple-test` - API connectivity test

All API endpoints require token in production via:
- Query parameter: `?token=TOKEN`
- Header: `X-Log-Debug-Token: TOKEN`

## Security Features

### Token Validation
- Uses `hash_equals()` for timing-safe string comparison
- Prevents timing attacks on token validation

### Environment-Based Protection
- Different security levels per environment
- Production has strictest requirements
- Development has convenient access

### Request Type Detection
- API requests return JSON error responses
- Web requests redirect to login or show 403 pages
- Proper HTTP status codes (403 Forbidden)

### CSRF Protection
- Web forms protected with Laravel CSRF tokens
- API endpoints use proper HTTP methods

## Best Practices

### Token Security
1. **Use strong tokens**: Generated with `openssl rand -hex 32`
2. **Keep tokens secret**: Never commit to version control
3. **Rotate tokens regularly**: Change periodically for security
4. **Use HTTPS**: Always access over encrypted connections in production

### Access Control
1. **Limit access**: Only share token with authorized personnel
2. **Monitor access**: Check logs for unauthorized access attempts
3. **Use temporarily**: Consider time-limited access for debugging

### Production Deployment
1. **Set environment**: Ensure `APP_ENV=production`
2. **Configure token**: Set secure `LOG_DEBUG_TOKEN`
3. **Test access**: Verify token-based access works
4. **Document token**: Securely share with team members who need access

## Example Usage Scenarios

### Emergency Debugging
```bash
# Quick log check
curl -s "https://yoursite.com/api/debug/logs?token=TOKEN&lines=50&search=ERROR"

# Download logs for analysis  
curl -o logs.txt "https://yoursite.com/api/debug/logs/download?token=TOKEN"
```

### Web Interface Access
1. Navigate to: `https://yoursite.com/admin/logs?token=YOUR_TOKEN`
2. Interface will show "Valid token provided" confirmation
3. All features (refresh, search, clear, download) work with token

### Clearing Logs
```bash
curl -X POST -H "X-Log-Debug-Token: TOKEN" "https://yoursite.com/api/debug/logs/clear"
```

## Troubleshooting

### Common Issues

1. **"Invalid or missing log debug token"**
   - Check token is correct in .env file
   - Ensure token is passed in request
   - Verify environment is production

2. **"Log debug token not configured"**
   - LOG_DEBUG_TOKEN not set in .env
   - Config cache may need clearing: `php artisan config:clear`

3. **403 Forbidden**
   - Wrong token provided
   - Token not included in request
   - Environment mismatch

### Testing Token Protection

```bash
# This should fail in production without token
curl "https://yoursite.com/api/debug/logs"

# This should work in production with correct token
curl "https://yoursite.com/api/debug/logs?token=CORRECT_TOKEN"
```

## Migration from Development to Production

1. **Update environment**: Change `APP_ENV=production`
2. **Set token**: Add `LOG_DEBUG_TOKEN` to production .env
3. **Clear caches**: Run `php artisan config:clear`
4. **Test access**: Verify token-based access works
5. **Update bookmarks**: Update any saved URLs to include token

This ensures your log management system remains secure in production while providing convenient access for authorized debugging and monitoring.