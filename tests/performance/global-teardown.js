// tests/performance/global-teardown.js

async function globalTeardown(config) {
  console.log('🧹 Cleaning up performance testing environment...');
  
  try {
    // Generate performance summary report
    const fs = require('fs');
    const path = require('path');
    
    // Check if results exist
    const resultsPath = path.join(process.cwd(), 'playwright-report.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        total_tests: results.stats?.total || 0,
        passed_tests: results.stats?.passed || 0,
        failed_tests: results.stats?.failed || 0,
        duration_ms: results.stats?.duration || 0,
        projects: results.suites?.map(suite => ({
          name: suite.title,
          tests: suite.specs?.length || 0,
          passed: suite.specs?.filter(spec => spec.outcome === 'passed')?.length || 0
        })) || []
      };
      
      // Write performance summary
      const summaryPath = path.join(process.cwd(), 'performance-test-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log('📊 Performance test summary:');
      console.log(`   Total tests: ${summary.total_tests}`);
      console.log(`   Passed: ${summary.passed_tests}`);
      console.log(`   Failed: ${summary.failed_tests}`);
      console.log(`   Duration: ${Math.round(summary.duration_ms / 1000)}s`);
      
      // Alert on failures
      if (summary.failed_tests > 0) {
        console.warn('⚠️  Some performance tests failed. Check the detailed report.');
      }
    }
    
    // Cleanup temporary files if needed
    const tempFiles = [
      'lighthouse-temp.json',
      'performance-trace.json'
    ];
    
    tempFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Cleaned up: ${file}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Teardown error:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  }
  
  console.log('✅ Performance testing cleanup complete');
}

module.exports = globalTeardown;
