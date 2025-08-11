#!/usr/bin/env python3
"""
OWASP ZAP Security Scanner for Leaderboard Routes

This script performs automated security scanning of the leaderboard endpoints
using OWASP ZAP to identify potential vulnerabilities.

Requirements:
- OWASP ZAP installed and running
- Python zapv2 library: pip install python-owasp-zap-v2
"""

import time
import json
import requests
from zapv2 import ZAPv2
import sys
from typing import Dict, List, Any

# ZAP Configuration
ZAP_PROXY = {'http': 'http://127.0.0.1:8080', 'https': 'http://127.0.0.1:8080'}
ZAP_API_KEY = ''  # Leave empty if not using API key
TARGET_URL = 'http://127.0.0.1:8000'

class LeaderboardSecurityScanner:
    def __init__(self, target_url: str, zap_proxy: str = 'http://127.0.0.1:8080'):
        self.target_url = target_url
        self.zap_proxy = zap_proxy
        self.zap = ZAPv2(proxies=ZAP_PROXY, apikey=ZAP_API_KEY)
        self.leaderboard_endpoints = [
            '/leaderboard',
            '/recent-gifters',
            '/largest/gifts/alltime', 
            '/leaderboard/star/lists',
            '/first-three-leaderboard',
            '/leaderboard/public',
            '/leaderboard/public/trends/growth',
            '/leaderboard/public/categories',
            '/leaderboard/public/analytics/overview'
        ]
        self.sensitive_endpoints = [
            '/earnings/all-data',
            '/earnings/graph-data',
            '/earnings/top-wishes',
            '/earnings/top-subscription',
            '/earnings/top-bill',
            '/earnings/top-shop',
            '/earnings/top-piggy-bank'
        ]

    def start_scan(self):
        """Start the comprehensive security scan"""
        print("🔍 Starting OWASP ZAP Security Scan for Leaderboard Routes")
        print(f"Target URL: {self.target_url}")
        print("=" * 60)
        
        try:
            # Check ZAP connection
            self.check_zap_connection()
            
            # Spider the target
            self.spider_target()
            
            # Active scan
            self.active_scan()
            
            # Generate report
            self.generate_security_report()
            
        except Exception as e:
            print(f"❌ Error during scan: {str(e)}")
            sys.exit(1)

    def check_zap_connection(self):
        """Verify ZAP is running and accessible"""
        try:
            version = self.zap.core.version
            print(f"✅ Connected to ZAP version: {version}")
        except Exception as e:
            print(f"❌ Failed to connect to ZAP: {str(e)}")
            print("Please ensure ZAP is running on http://127.0.0.1:8080")
            sys.exit(1)

    def spider_target(self):
        """Spider the target application to discover URLs"""
        print("\n🕷️  Starting Spider Scan...")
        
        # Start spider for each endpoint
        for endpoint in self.leaderboard_endpoints + self.sensitive_endpoints:
            url = f"{self.target_url}{endpoint}"
            print(f"  Spidering: {url}")
            scan_id = self.zap.spider.scan(url)
            
            # Wait for spider to complete
            while int(self.zap.spider.status(scan_id)) < 100:
                print(f"    Spider progress: {self.zap.spider.status(scan_id)}%")
                time.sleep(2)
        
        print("✅ Spider scan completed")
        
        # Print discovered URLs
        urls = self.zap.core.urls()
        print(f"📋 Discovered {len(urls)} URLs")

    def active_scan(self):
        """Run active security scan"""
        print("\n⚡ Starting Active Security Scan...")
        
        # Configure scan policies for different endpoint types
        self.configure_scan_policies()
        
        # Scan public endpoints
        self.scan_endpoint_group("Public Endpoints", self.leaderboard_endpoints)
        
        # Scan sensitive endpoints (should be protected)
        self.scan_endpoint_group("Sensitive Endpoints", self.sensitive_endpoints)

    def configure_scan_policies(self):
        """Configure ZAP scan policies for comprehensive testing"""
        print("⚙️  Configuring scan policies...")
        
        # Enable all scan rules for thorough testing
        scan_policy_name = 'LeaderboardSecurityPolicy'
        
        # SQL Injection tests
        self.zap.ascan.enable_scanners('40018,40019,40020,40021,40022')
        
        # XSS tests
        self.zap.ascan.enable_scanners('40012,40013,40014,40016,40017')
        
        # Authentication bypass tests
        self.zap.ascan.enable_scanners('10101,10102,10103')
        
        # Information disclosure tests
        self.zap.ascan.enable_scanners('10025,10026,10027')
        
        print("✅ Scan policies configured")

    def scan_endpoint_group(self, group_name: str, endpoints: List[str]):
        """Scan a group of endpoints"""
        print(f"\n🎯 Scanning {group_name}...")
        
        for endpoint in endpoints:
            url = f"{self.target_url}{endpoint}"
            print(f"  Scanning: {url}")
            
            # Start active scan
            scan_id = self.zap.ascan.scan(url)
            
            # Wait for scan to complete
            while int(self.zap.ascan.status(scan_id)) < 100:
                progress = self.zap.ascan.status(scan_id)
                print(f"    Scan progress: {progress}%")
                time.sleep(5)
            
            # Check for vulnerabilities in this endpoint
            alerts = self.get_endpoint_alerts(url)
            if alerts:
                print(f"    ⚠️  Found {len(alerts)} potential vulnerabilities")

    def get_endpoint_alerts(self, url: str) -> List[Dict]:
        """Get security alerts for a specific endpoint"""
        all_alerts = self.zap.core.alerts(baseurl=url)
        return [alert for alert in all_alerts if alert.get('url', '').startswith(url)]

    def generate_security_report(self):
        """Generate comprehensive security report"""
        print("\n📊 Generating Security Report...")
        
        all_alerts = self.zap.core.alerts()
        
        # Categorize alerts by risk level
        risk_levels = {'High': [], 'Medium': [], 'Low': [], 'Informational': []}
        
        for alert in all_alerts:
            risk = alert.get('risk', 'Low')
            risk_levels[risk].append(alert)
        
        # Generate report data
        report_data = {
            'scan_summary': {
                'target_url': self.target_url,
                'scan_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'total_alerts': len(all_alerts),
                'risk_breakdown': {level: len(alerts) for level, alerts in risk_levels.items()}
            },
            'leaderboard_specific_findings': self.analyze_leaderboard_vulnerabilities(all_alerts),
            'detailed_alerts': all_alerts,
            'recommendations': self.generate_recommendations(risk_levels)
        }
        
        # Save JSON report
        with open('security_scan_report.json', 'w') as f:
            json.dump(report_data, f, indent=2)
        
        # Generate human-readable report
        self.generate_human_readable_report(report_data)
        
        print("✅ Security reports generated:")
        print("  - security_scan_report.json")
        print("  - security_scan_report.txt")

    def analyze_leaderboard_vulnerabilities(self, alerts: List[Dict]) -> Dict:
        """Analyze vulnerabilities specific to leaderboard functionality"""
        leaderboard_issues = {
            'data_exposure': [],
            'access_control': [],
            'injection_attacks': [],
            'authentication_bypass': []
        }
        
        for alert in alerts:
            url = alert.get('url', '')
            name = alert.get('name', '')
            
            # Check for data exposure issues
            if any(endpoint in url for endpoint in self.sensitive_endpoints):
                if 'information disclosure' in name.lower() or 'sensitive' in name.lower():
                    leaderboard_issues['data_exposure'].append(alert)
            
            # Check for access control issues
            if 'authorization' in name.lower() or 'access control' in name.lower():
                leaderboard_issues['access_control'].append(alert)
            
            # Check for injection attacks
            if 'sql injection' in name.lower() or 'xss' in name.lower():
                leaderboard_issues['injection_attacks'].append(alert)
            
            # Check for authentication bypass
            if 'authentication' in name.lower() or 'session' in name.lower():
                leaderboard_issues['authentication_bypass'].append(alert)
        
        return leaderboard_issues

    def generate_recommendations(self, risk_levels: Dict) -> List[str]:
        """Generate security recommendations based on findings"""
        recommendations = []
        
        if risk_levels['High']:
            recommendations.append("🚨 CRITICAL: Address high-risk vulnerabilities immediately")
            recommendations.append("- Review input validation and sanitization")
            recommendations.append("- Implement proper access controls")
            recommendations.append("- Use parameterized queries to prevent SQL injection")
        
        if risk_levels['Medium']:
            recommendations.append("⚠️ MEDIUM: Address medium-risk vulnerabilities")
            recommendations.append("- Implement proper error handling")
            recommendations.append("- Review authentication mechanisms")
            recommendations.append("- Add rate limiting to prevent abuse")
        
        # Leaderboard-specific recommendations
        recommendations.extend([
            "📊 LEADERBOARD SPECIFIC:",
            "- Ensure sensitive earnings data is only accessible to authorized users",
            "- Implement proper field filtering for public vs private responses",
            "- Add caching to prevent performance-based information disclosure",
            "- Implement proper CORS headers for API endpoints",
            "- Use HTTPS for all sensitive data transmission"
        ])
        
        return recommendations

    def generate_human_readable_report(self, report_data: Dict):
        """Generate a human-readable security report"""
        with open('security_scan_report.txt', 'w') as f:
            f.write("OWASP ZAP SECURITY SCAN REPORT\n")
            f.write("=" * 50 + "\n\n")
            
            # Summary
            summary = report_data['scan_summary']
            f.write(f"Target: {summary['target_url']}\n")
            f.write(f"Scan Date: {summary['scan_timestamp']}\n")
            f.write(f"Total Alerts: {summary['total_alerts']}\n\n")
            
            # Risk breakdown
            f.write("RISK LEVEL BREAKDOWN:\n")
            for risk, count in summary['risk_breakdown'].items():
                f.write(f"  {risk}: {count} issues\n")
            f.write("\n")
            
            # Leaderboard-specific findings
            f.write("LEADERBOARD SECURITY FINDINGS:\n")
            findings = report_data['leaderboard_specific_findings']
            for category, issues in findings.items():
                if issues:
                    f.write(f"  {category.replace('_', ' ').title()}: {len(issues)} issues\n")
            f.write("\n")
            
            # Recommendations
            f.write("SECURITY RECOMMENDATIONS:\n")
            for rec in report_data['recommendations']:
                f.write(f"{rec}\n")
            f.write("\n")
            
            # Detailed findings
            f.write("DETAILED FINDINGS:\n")
            f.write("-" * 30 + "\n")
            
            for alert in report_data['detailed_alerts']:
                f.write(f"\nAlert: {alert.get('name', 'Unknown')}\n")
                f.write(f"Risk: {alert.get('risk', 'Unknown')}\n")
                f.write(f"URL: {alert.get('url', 'Unknown')}\n")
                f.write(f"Description: {alert.get('description', 'No description')}\n")
                f.write(f"Solution: {alert.get('solution', 'No solution provided')}\n")
                f.write("-" * 30 + "\n")

def main():
    """Main function to run the security scan"""
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
    else:
        target_url = TARGET_URL
    
    print("OWASP ZAP Leaderboard Security Scanner")
    print("=" * 50)
    print("This tool will scan leaderboard endpoints for security vulnerabilities")
    print(f"Target URL: {target_url}")
    print("\nMake sure:")
    print("1. OWASP ZAP is running on http://127.0.0.1:8080")
    print("2. The target application is accessible")
    print("3. You have permission to scan the target")
    print("\nStarting scan in 5 seconds...")
    
    time.sleep(5)
    
    scanner = LeaderboardSecurityScanner(target_url)
    scanner.start_scan()
    
    print("\n🎉 Security scan completed!")
    print("Review the generated reports and address any identified vulnerabilities.")

if __name__ == "__main__":
    main()
