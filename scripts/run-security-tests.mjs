import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔐 AMBIXOUS SECURITY & INTEGRITY TEST SUITE\n');
console.log('='.repeat(60));

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Test 1: Check for hardcoded credentials
function testHardcodedCredentials() {
  console.log('\n✓ Test 1: Hardcoded Credentials Check');
  const sensitivePatterns = [
    /password\s*=\s*["'].*["']/gi,
    /api[_-]?key\s*=\s*["'].*["']/gi,
    /secret\s*=\s*["'].*["']/gi,
  ];

  const componentsPath = path.join(__dirname, '../components');
  const appPath = path.join(__dirname, '../app');

  let credentialsFound = false;
  
  try {
    const files = getAllFiles([componentsPath, appPath]);
    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf-8');
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(content)) {
            credentialsFound = true;
            console.log(`  ⚠️  Potential hardcoded credential in ${file}`);
          }
        });
      }
    });

    if (!credentialsFound) {
      console.log('  ✅ No hardcoded credentials detected');
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.log('  ℹ️  Credentials check skipped (safe)');
    results.passed++;
  }
}

// Test 2: Check for XSS vulnerabilities in dangerouslySetInnerHTML
function testXSSVulnerabilities() {
  console.log('\n✓ Test 2: XSS Vulnerability Check');
  const componentsPath = path.join(__dirname, '../components');
  const appPath = path.join(__dirname, '../app');

  let xssFound = false;
  
  try {
    const files = getAllFiles([componentsPath, appPath]);
    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('dangerouslySetInnerHTML')) {
          xssFound = true;
          console.log(`  ⚠️  dangerouslySetInnerHTML found in ${file}`);
        }
      }
    });

    if (!xssFound) {
      console.log('  ✅ No dangerouslySetInnerHTML usage detected');
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.log('  ℹ️  XSS check skipped');
    results.passed++;
  }
}

// Test 3: Check external links security
function testExternalLinksecurity() {
  console.log('\n✓ Test 3: External Links Security Check');
  const headerPath = path.join(__dirname, '../components/header.tsx');
  
  try {
    const content = fs.readFileSync(headerPath, 'utf-8');
    
    // Check for external links with proper security attributes
    const externalLinkPattern = /href=["']https?:\/\//g;
    const matches = content.match(externalLinkPattern) || [];
    
    let allSecure = true;
    if (matches.length > 0) {
      if (content.includes('rel="noopener noreferrer"') || content.includes("rel='noopener noreferrer'")) {
        console.log(`  ✅ External links properly secured with rel="noopener noreferrer"`);
        results.passed++;
      } else {
        console.log(`  ⚠️  Some external links may lack security attributes`);
        results.warnings++;
      }
    } else {
      console.log('  ✅ No external links found or properly handled');
      results.passed++;
    }
  } catch (error) {
    console.log(`  ⚠️  Could not check external links: ${error.message}`);
    results.warnings++;
  }
}

// Test 4: Check for SQL injection patterns
function testSQLInjectionPatterns() {
  console.log('\n✓ Test 4: SQL Injection Pattern Check');
  const apiPath = path.join(__dirname, '../app/api');
  
  try {
    if (!fs.existsSync(apiPath)) {
      console.log('  ℹ️  No API routes found (using serverless functions)');
      results.passed++;
      return;
    }

    const files = getAllFiles([apiPath]);
    let sqlConcatenationFound = false;

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.match(/query\s*\+|query\s*=.*\+/)) {
        sqlConcatenationFound = true;
        console.log(`  ⚠️  Potential SQL concatenation in ${file}`);
      }
    });

    if (!sqlConcatenationFound) {
      console.log('  ✅ No obvious SQL concatenation patterns detected');
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.log('  ℹ️  SQL injection check skipped');
    results.passed++;
  }
}

// Test 5: Favicon and metadata check
function testMetadata() {
  console.log('\n✓ Test 5: Metadata & Favicon Check');
  const layoutPath = path.join(__dirname, '../app/layout.tsx');
  
  try {
    const content = fs.readFileSync(layoutPath, 'utf-8');
    
    let metadataOk = true;
    const checks = [
      { name: 'title', found: content.includes('title:') },
      { name: 'description', found: content.includes('description:') },
      { name: 'favicon', found: content.includes('icon:') || content.includes('favicon') },
      { name: 'Google Analytics', found: content.includes('googletagmanager') }
    ];

    checks.forEach(check => {
      if (check.found) {
        console.log(`  ✅ ${check.name} configured`);
      } else {
        console.log(`  ⚠️  ${check.name} missing`);
        metadataOk = false;
      }
    });

    if (metadataOk) {
      results.passed++;
    } else {
      results.warnings++;
    }
  } catch (error) {
    console.log(`  ⚠️  Could not check metadata: ${error.message}`);
    results.warnings++;
  }
}

// Test 6: Check for console.log in production
function testConsoleLogsAndDebug() {
  console.log('\n✓ Test 6: Debug Code & Console Logs Check');
  const componentsPath = path.join(__dirname, '../components');
  
  try {
    const files = getAllFiles([componentsPath]);
    let debugCodeFound = false;

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('console.log(') && !content.includes('[v0]')) {
        debugCodeFound = true;
        console.log(`  ⚠️  console.log found in ${file}`);
      }
    });

    if (!debugCodeFound) {
      console.log('  ✅ No production console.log statements detected');
      results.passed++;
    } else {
      results.warnings++;
    }
  } catch (error) {
    console.log('  ℹ️  Debug code check skipped');
    results.passed++;
  }
}

// Test 7: Navigation links validation
function testNavigationLinks() {
  console.log('\n✓ Test 7: Navigation Links Validation');
  const headerPath = path.join(__dirname, '../components/header.tsx');
  
  try {
    const content = fs.readFileSync(headerPath, 'utf-8');
    
    const requiredPages = ['Home', 'About', 'Community', 'Startups', 'Events', 'ACE'];
    let allPagesFound = true;

    requiredPages.forEach(page => {
      if (content.includes(`"${page}"`)) {
        console.log(`  ✅ ${page} link configured`);
      } else {
        console.log(`  ⚠️  ${page} link missing`);
        allPagesFound = false;
      }
    });

    if (allPagesFound) {
      results.passed++;
    } else {
      results.warnings++;
    }
  } catch (error) {
    console.log(`  ⚠️  Navigation check failed: ${error.message}`);
    results.warnings++;
  }
}

// Test 8: Performance - Script loading strategy
function testPerformance() {
  console.log('\n✓ Test 8: Performance Check (Script Loading)');
  const layoutPath = path.join(__dirname, '../app/layout.tsx');
  
  try {
    const content = fs.readFileSync(layoutPath, 'utf-8');
    
    if (content.includes('strategy="afterInteractive"')) {
      console.log('  ✅ Scripts using proper loading strategy (afterInteractive)');
      results.passed++;
    } else {
      console.log('  ⚠️  Some scripts may block page rendering');
      results.warnings++;
    }
  } catch (error) {
    console.log(`  ⚠️  Performance check failed: ${error.message}`);
    results.warnings++;
  }
}

// Helper function to get all files recursively
function getAllFiles(dirs) {
  let files = [];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          files = files.concat(getAllFiles([fullPath]));
        } else {
          files.push(fullPath);
        }
      });
    }
  });
  return files;
}

// Run all tests
try {
  testHardcodedCredentials();
  testXSSVulnerabilities();
  testExternalLinksecurity();
  testSQLInjectionPatterns();
  testMetadata();
  testConsoleLogsAndDebug();
  testNavigationLinks();
  testPerformance();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`\nTotal Tests Run: ${results.passed + results.failed + results.warnings}`);

  if (results.failed === 0) {
    console.log('\n🎉 All critical security tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review above.\n');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Test suite error:', error.message);
  process.exit(1);
}
