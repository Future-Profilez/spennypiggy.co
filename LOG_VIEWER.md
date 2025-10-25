# Laravel Log Viewer

A secure, web-based log viewer for monitoring and debugging Laravel applications in production environments.

## Features

- **Secure Access Control**: Multiple authentication methods for production safety
- **Real-time Filtering**: Filter logs by level (ERROR, WARNING, INFO, DEBUG, etc.)
- **Search Functionality**: Search through log messages and stack traces
- **Pagination**: Efficiently handle large log files with pagination
- **Download Logs**: Download complete log files for offline analysis
- **Clear Logs**: Clear log files (with confirmation) for maintenance
- **Responsive Design**: Works on desktop and mobile devices
- **Color-coded Levels**: Visual distinction between different log levels
- **Stack Trace Support**: Multi-line log entries are properly parsed

## Access Methods

### 1. Admin User Access
Users with admin role (`role = 0`) can always access the log viewer:
```
https://your-app.com/debug/logs
```

### 2. Debug Token Access (Production)
For production environments, you can set up a secure debug token:

1. Add to your `.env` file:
```env
LOG_DEBUG_TOKEN=your-super-secure-random-token-here
```

2. Access with token:
```
https://your-app.com/debug/logs?debug_token=your-super-secure-random-token-here
```

Or use as header:
```bash
curl -H "X-Debug-Token: your-super-secure-random-token-here" https://your-app.com/debug/logs
```

### 3. Non-Production Environment
In local, staging, or testing environments, any authenticated user can access the log viewer.

## URLs

| Action | URL | Method | Description |
|--------|-----|--------|-------------|
| View Logs | `/debug/logs` | GET | Main log viewer interface |
| Download Log | `/debug/logs/download` | GET | Download complete log file |
| Clear Logs | `/debug/logs/clear` | POST | Clear all log entries |

## Usage Examples

### Basic Access
```
GET /debug/logs
```

### Filter by Log Level
```
GET /debug/logs?level=error
```

### Search in Logs
```
GET /debug/logs?search=database
```

### Combined Filtering
```
GET /debug/logs?level=warning&search=timeout
```

### With Debug Token
```
GET /debug/logs?debug_token=your-token&level=error
```

## Security Features

1. **Authentication Required**: All users must be logged in
2. **Role-based Access**: Admin users have unrestricted access
3. **Token-based Access**: Secure token for production debugging
4. **Environment Checks**: Different access rules for different environments
5. **CSRF Protection**: Clear logs action is CSRF protected

## Log Format Support

The viewer supports standard Laravel log format:
```
[2024-01-01 10:00:00] environment.LEVEL: Message
Additional lines for stack traces
```

Supported log levels:
- **EMERGENCY**: System is unusable
- **ALERT**: Action must be taken immediately
- **CRITICAL**: Critical conditions
- **ERROR**: Error conditions
- **WARNING**: Warning conditions
- **NOTICE**: Normal but significant condition
- **INFO**: Informational messages
- **DEBUG**: Debug-level messages

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Focus search input
- **Escape**: Clear search and filters
- **Enter**: Submit search (when in search box)

## Performance Considerations

- **Memory Efficient**: Streams log file instead of loading everything into memory
- **Paginated Results**: Shows 100 log entries per page
- **Latest First**: Most recent logs appear first
- **Lazy Loading**: Only processes visible entries
- **File Streaming**: Uses `fopen()` for large file handling

## Production Setup

### Step 1: Generate Debug Token
```bash
# Generate a secure random token
php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
```

### Step 2: Add to Environment
```bash
# Add to your .env file
echo "LOG_DEBUG_TOKEN=your-generated-token-here" >> .env
```

### Step 3: Reload Application
```bash
# If using Laravel Vapor, redeploy
# If using traditional hosting, clear cache
php artisan config:cache
```

### Step 4: Test Access
```bash
curl "https://your-app.com/debug/logs?debug_token=your-generated-token-here"
```

## Troubleshooting

### "Log file not found" Message
- Check if `storage/logs/laravel.log` exists
- Ensure proper file permissions (readable by web server)
- Verify logging is enabled in your Laravel configuration

### 403 Forbidden Error
- Verify user authentication
- Check user role (admin users need `role = 0`)
- Verify debug token if in production
- Confirm middleware is properly registered

### Large File Performance Issues
- Consider log rotation policies
- Use the search and filter features to narrow results
- Download logs for offline analysis if needed

### Empty Log Display
- Check if Laravel is actually writing logs
- Verify `LOG_CHANNEL` configuration
- Test by triggering a log entry: `Log::info('Test message')`

## Maintenance

### Log Rotation
Consider implementing log rotation to prevent files from becoming too large:

```bash
# Example daily log rotation with logrotate
/path/to/storage/logs/laravel.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 644 www-data www-data
}
```

### Regular Cleanup
Clear logs periodically in production:
1. Use the web interface "Clear Logs" button
2. Or via command line: `echo "" > storage/logs/laravel.log`
3. Or via Laravel command: `php artisan log:clear` (if you create this command)

## Security Best Practices

1. **Strong Debug Token**: Use cryptographically secure random tokens
2. **Token Rotation**: Regularly rotate your debug tokens
3. **Access Logging**: Monitor who accesses the log viewer
4. **Environment Separation**: Different tokens for different environments
5. **Time-based Access**: Consider implementing token expiration
6. **IP Restrictions**: Add IP whitelisting for additional security

## Integration with Monitoring

The log viewer can be integrated with monitoring systems:

```bash
# Check for critical errors via API
curl -s -H "X-Debug-Token: token" "https://app.com/debug/logs?level=critical&format=json"

# Monitor error rates
curl -s -H "X-Debug-Token: token" "https://app.com/debug/logs?level=error&format=json" | jq '.logs | length'
```

## Support

For issues or feature requests related to the log viewer:
1. Check this documentation first
2. Review error messages carefully
3. Test with different access methods
4. Verify environment configuration
5. Check Laravel logs for middleware errors

---

**Note**: This log viewer is designed for debugging purposes. For production monitoring, consider dedicated logging services like Papertrail, Loggly, or ELK stack for comprehensive log management.