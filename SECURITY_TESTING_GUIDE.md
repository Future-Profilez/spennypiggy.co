# 🛡️ Leaderboard Security Testing Quick Guide

## Overview
This guide provides step-by-step instructions for running comprehensive security tests on the leaderboard functionality.

## 🚀 Quick Start

### Prerequisites
```bash
# Install Python dependencies for security tools
pip install requests python-owasp-zap-v2

# Ensure application is running
php artisan serve --host=127.0.0.1 --port=8000
```

### 1. Run PHPUnit Security Tests ⚡
```bash
# Run all security tests
php artisan test tests/Feature/LeaderboardSecurityTest.php

# Run specific test
php artisan test --filter guest_users_cannot_access_sensitive_earnings_endpoints

# Run with verbose output for debugging
php artisan test tests/Feature/LeaderboardSecurityTest.php --debug
```

### 2. Manual Penetration Testing 🎯
```bash
cd tests/security

# Basic scan (no authentication)
python manual_pentest.py http://127.0.0.1:8000

# Authenticated scan
python manual_pentest.py http://127.0.0.1:8000 YOUR_AUTH_TOKEN

# This will generate:
# - pentest_report.json
# - pentest_report.txt
```

### 3. OWASP ZAP Automated Scanning 🕷️
```bash
# Start OWASP ZAP (GUI or headless)
# GUI: Launch OWASP ZAP application
# Headless: zap.sh -daemon -host 127.0.0.1 -port 8080

cd tests/security
python zap_security_scan.py http://127.0.0.1:8000

# This will generate:
# - security_scan_report.json  
# - security_scan_report.txt
```

### 4. Postman API Security Testing 📮
```bash
# Import collection into Postman
# File: tests/postman/LeaderboardSecurityTests.postman_collection.json

# Set environment variables:
# - base_url: http://127.0.0.1:8000
# - auth_token: YOUR_AUTH_TOKEN (if available)

# Run collection and review results
```

## 🔍 Test Coverage Matrix

| Test Type | Guest Access | IDOR | Parameter Tampering | Mass Assignment | SQL Injection | XSS | Rate Limiting |
|-----------|:------------:|:----:|:------------------:|:---------------:|:-------------:|:---:|:-------------:|
| PHPUnit   | ✅           | ✅    | ✅                  | ✅               | ✅             | ✅   | ✅             |
| Manual    | ✅           | ✅    | ✅                  | ✅               | ✅             | ✅   | ✅             |
| OWASP ZAP | ✅           | ✅    | ✅                  | ✅               | ✅             | ✅   | ❌             |
| Postman   | ✅           | ✅    | ✅                  | ✅               | ✅             | ✅   | ✅             |

## 🎯 Critical Endpoints to Test

### Public Endpoints (Should be accessible to guests)
- `/leaderboard`
- `/recent-gifters`
- `/largest/gifts/alltime`
- `/leaderboard/star/lists`
- `/first-three-leaderboard`

### Sensitive Endpoints (Should require authentication)
- `/earnings/all-data`
- `/earnings/graph-data`
- `/earnings/top-wishes`
- `/earnings/top-subscription`
- `/earnings/top-bill`
- `/earnings/top-shop`
- `/earnings/top-piggy-bank`

## ⚠️ Expected Security Behaviors

### ✅ Correct Behaviors
- **Guest users**: Redirected to login (302) for sensitive endpoints
- **Public responses**: No real names, financial amounts, or sensitive data
- **Rate limiting**: 429 status after 60 requests/minute
- **Authentication**: 401 for invalid/missing tokens
- **IDOR attempts**: No unauthorized data access
- **SQL injection**: Safe error handling without data exposure
- **Parameter tampering**: Ignored malicious parameters

### ❌ Security Violations (Report These!)
- Real names in public leaderboard responses
- Financial amounts visible to unauthenticated users  
- Access to other users' earnings data
- SQL error messages exposing database structure
- Successful privilege escalation via parameter tampering
- XSS payloads reflected in responses
- No rate limiting on public endpoints

## 🚨 Immediate Action Items

If you find security issues:

1. **Document the vulnerability**:
   ```bash
   # Screenshot or copy the vulnerable response
   # Note the exact URL and parameters used
   # Record the expected vs actual behavior
   ```

2. **Create a test case**:
   ```php
   /** @test */
   public function specific_vulnerability_test()
   {
       // Add test to LeaderboardSecurityTest.php
       // This ensures the fix is verified
   }
   ```

3. **Report findings**:
   - Add to `SECURITY_FINDINGS_AND_FIXES.md`
   - Create GitHub issue with "security" label
   - Notify development team immediately

## 🔧 Troubleshooting

### Common Issues

**PHPUnit tests failing due to database**:
```bash
# Run migrations
php artisan migrate

# Seed test data
php artisan db:seed --class=TestDataSeeder
```

**OWASP ZAP connection failed**:
```bash
# Check ZAP is running
curl http://127.0.0.1:8080

# Start ZAP headless if needed
zap.sh -daemon -host 127.0.0.1 -port 8080
```

**Manual pentest script errors**:
```bash
# Install missing dependencies
pip install requests urllib3

# Check target is accessible
curl http://127.0.0.1:8000/leaderboard
```

**Postman environment issues**:
```json
{
  "base_url": "http://127.0.0.1:8000",
  "auth_token": "your_token_here"
}
```

## 📊 Interpreting Results

### PHPUnit Results
```bash
# ✅ All tests pass = Good security posture
# ❌ Any test fails = Security vulnerability found
```

### Manual Pentest Results
```bash
# Check pentest_report.txt for:
# - Total vulnerabilities found
# - Vulnerability types and severity
# - Specific endpoints affected
```

### OWASP ZAP Results
```bash
# Review security_scan_report.txt for:
# - High/Medium risk vulnerabilities
# - SQL injection findings
# - XSS vulnerabilities
# - Information disclosure issues
```

### Postman Results
```javascript
// Check test results tab for:
// - Failed assertions (security issues)
// - Unexpected response codes
// - Sensitive data in responses
```

## 🔄 Continuous Testing

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
php artisan test tests/Feature/LeaderboardSecurityTest.php
if [ $? -ne 0 ]; then
    echo "Security tests failed! Commit blocked."
    exit 1
fi
```

### CI/CD Pipeline
```yaml
# .github/workflows/security.yml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Security Tests
        run: |
          php artisan test tests/Feature/LeaderboardSecurityTest.php
          cd tests/security && python manual_pentest.py http://127.0.0.1:8000
```

## 📞 Support

**Need help?**
- Check `SECURITY_FINDINGS_AND_FIXES.md` for detailed explanations
- Review test files for examples
- Contact the development security team

**Found a vulnerability?**
- Document it thoroughly
- Create a test case
- Report immediately to security team
- Don't commit the vulnerability to version control

---

**Remember**: Security is everyone's responsibility! 🛡️
