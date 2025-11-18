# FocusGuard Testing Guide

## Overview

This guide provides comprehensive testing scenarios and validation procedures for the FocusGuard Chrome extension. Testing covers functionality, performance, compatibility, and user experience.

## Table of Contents

- [Testing Environment Setup](#testing-environment-setup)
- [Manual Testing Scenarios](#manual-testing-scenarios)
- [Automated Testing](#automated-testing)
- [Performance Testing](#performance-testing)
- [Compatibility Testing](#compatibility-testing)
- [Security Testing](#security-testing)
- [User Experience Testing](#user-experience-testing)
- [Regression Testing](#regression-testing)
- [Test Reporting](#test-reporting)

## Testing Environment Setup

### Required Tools

1. **Google Chrome** (latest stable version)
2. **Chrome Developer Tools** (built-in)
3. **Test Websites** (see list below)
4. **Network Throttling** (for performance testing)
5. **Mobile Device Emulation** (for responsive testing)

### Test Data Preparation

1. **Test Accounts**: Create accounts on various platforms
2. **Sample Content**: Prepare text, images, and videos for testing
3. **Test Domains**: List of domains for allow/block testing
4. **Performance Baselines**: Establish baseline metrics

### Test Websites

| Category | Websites | Purpose |
|----------|----------|---------|
| News | `nytimes.com`, `bbc.com`, `cnn.com` | Text content classification |
| Social Media | `reddit.com`, `twitter.com`, `facebook.com` | Mixed content, dynamic loading |
| Educational | `wikipedia.org`, `coursera.org`, `khanacademy.org` | Allowed content testing |
| Entertainment | `youtube.com`, `netflix.com`, `twitch.tv` | Video content testing |
| Gaming | `steam.com`, `ign.com`, `twitch.tv/games` | Gaming content classification |
| Adult Content | Use test URLs only | NSFW classification testing |
| E-commerce | `amazon.com`, `ebay.com` | Mixed content testing |

## Manual Testing Scenarios

### 1. Installation and Setup

#### Test Case 1.1: Extension Installation
**Objective**: Verify extension installs correctly

**Steps**:
1. Open Chrome Extensions page (`chrome://extensions/`)
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select focusguard directory
5. Verify extension appears in list

**Expected Results**:
- Extension loads without errors
- Icon appears in Chrome toolbar
- No error messages shown
- Extension version displayed correctly

**Test Case 1.2: First Launch
**Objective**: Verify first-time user experience

**Steps**:
1. Click extension icon
2. Verify popup opens correctly
3. Check default settings
4. Open Options page
5. Verify all sections load

**Expected Results**:
- Popup displays correctly
- Default settings applied
- Options page loads all sections
- No console errors

### 2. Popup Interface Testing

#### Test Case 2.1: Master Toggle
**Objective**: Verify master toggle functionality

**Steps**:
1. Open popup on any website
2. Toggle master switch off
3. Verify filtering stops
4. Toggle master switch on
5. Verify filtering resumes

**Expected Results**:
- Toggle state changes correctly
- Status indicator updates
- Filtering starts/stops appropriately
- Settings persist

#### Test Case 2.2: Mode Selection
**Objective**: Verify Strict/Balanced mode switching

**Steps**:
1. Open popup
2. Click "Strict" mode button
3. Verify mode changes
4. Click "Balanced" mode button
5. Verify mode changes back

**Expected Results**:
- Mode buttons update correctly
- Current mode display updates
- Settings save properly
- No page reload required

#### Test Case 2.3: Statistics Display
**Objective**: Verify statistics show correctly

**Steps**:
1. Browse some content that gets filtered
2. Open popup
3. Check block counts
4. Verify breakdown by type
5. Check recent activity

**Expected Results**:
- Block counts increment correctly
- Type breakdown accurate
- Recent activity shows recent actions
- Numbers update in real-time

#### Test Case 2.4: Quick Actions
**Objective**: Verify domain blocking/allowing

**Steps**:
1. Navigate to a website
2. Open popup
3. Click "Block this domain"
4. Verify confirmation
5. Click "Allow this domain"
6. Verify confirmation

**Expected Results**:
- Domain added to correct list
- Confirmation message shown
- Settings updated immediately
- Filtering applies to current page

### 3. Options Page Testing

#### Test Case 3.1: Category Management
**Objective**: Verify category add/remove functionality

**Steps**:
1. Open Options page
2. Go to Category Management section
3. Add custom category to allowed list
4. Add custom category to blocked list
5. Remove categories from both lists
6. Reset to defaults

**Expected Results**:
- Categories add/remove correctly
- Custom categories persist
- Reset restores defaults
- No duplicate categories allowed

#### Test Case 3.2: Filtering Behavior
**Objective**: Verify filtering settings work

**Steps**:
1. Open Options page
2. Test Blur vs Block mode
3. Test Strict vs Balanced mode
4. Test sensitivity levels
5. Use preview functionality

**Expected Results**:
- All settings apply correctly
- Preview shows expected behavior
- Settings save immediately
- Real-time updates work

#### Test Case 3.3: Analytics Dashboard
**Objective**: Verify analytics display and management

**Steps**:
1. Generate some blocked content
2. Open Options page
3. Check analytics dashboard
4. Verify top blocked domains
5. Test reset functionality
6. Test export functionality

**Expected Results**:
- Statistics display accurately
- Top domains update correctly
- Reset clears daily stats
- Export downloads correctly

#### Test Case 3.4: Domain Management
**Objective**: Verify domain list management

**Steps**:
1. Go to Domain Management section
2. Add domains to blocked list
3. Add domains to allowed list
4. Remove domains from both lists
5. Test domain validation

**Expected Results**:
- Domains add/remove correctly
- Input validation works
- No duplicate domains
- Lists update immediately

#### Test Case 3.5: Import/Export
**Objective**: Verify settings import/export

**Steps**:
1. Configure custom settings
2. Export settings as JSON
3. Reset to defaults
4. Import saved settings
5. Verify settings restored

**Expected Results**:
- Export downloads valid JSON
- Import restores settings correctly
- Invalid JSON rejected
- Settings apply immediately

### 4. Content Filtering Testing

#### Test Case 4.1: Text Content Classification
**Objective**: Verify text content is classified correctly

**Steps**:
1. Navigate to news website (nytimes.com)
2. Enable extension
3. Browse different article types
4. Verify classification accuracy
5. Check filtering application

**Expected Results**:
- Text content detected
- Classification seems reasonable
- Filters apply correctly
- Performance acceptable

#### Test Case 4.2: Image Content Classification
**Objective**: Verify image content is classified correctly

**Steps**:
1. Navigate to image-heavy site
2. Enable extension
3. Scroll through images
4. Verify NSFW classification
5. Check blur/block application

**Expected Results**:
- Images detected and processed
- Classification works (if models available)
- Filters apply correctly
- Hover reveal works (blur mode)

#### Test Case 4.3: Video Content Classification
**Objective**: Verify video content is classified correctly

**Steps**:
1. Navigate to YouTube
2. Enable extension
3. Browse different video types
4. Verify classification
5. Check placeholder generation

**Expected Results**:
- Videos detected correctly
- Classification applied
- Placeholders generated (block mode)
- Thumbnails handled properly

#### Test Case 4.4: Dynamic Content
**Objective**: Verify dynamically loaded content is handled

**Steps**:
1. Navigate to social media site
2. Enable extension
3. Scroll to load more content
4. Verify new content is filtered
5. Check infinite scroll behavior

**Expected Results**:
- New content detected automatically
- Filtering applies to dynamic content
- Performance remains acceptable
- No memory leaks

#### Test Case 4.5: Domain Lists
**Objective**: Verify domain allow/block lists work

**Steps**:
1. Add domain to blocked list
2. Navigate to that domain
3. Verify all content blocked
4. Add domain to allowed list
5. Navigate to allowed domain
6. Verify no content blocked

**Expected Results**:
- Blocked domain: all content filtered
- Allowed domain: no content filtered
- Lists work independently
- Settings persist across sessions

### 5. Performance Testing

#### Test Case 5.1: Page Load Performance
**Objective**: Verify extension doesn't slow page loading

**Steps**:
1. Open Developer Tools → Network tab
2. Clear cache and disable cache
3. Load test page without extension
4. Load test page with extension enabled
5. Compare load times

**Expected Results**:
- Extension adds < 100ms to load time
- Memory usage increases minimally
- No blocking network requests
- CPU usage remains reasonable

#### Test Case 5.2: Memory Usage
**Objective**: Verify memory usage stays within limits

**Steps**:
1. Open Developer Tools → Memory tab
2. Take heap snapshot without extension
3. Browse for 10 minutes with extension
4. Take another heap snapshot
5. Compare memory usage

**Expected Results**:
- Memory increase < 50MB
- No memory leaks detected
- Garbage collection works
- Memory usage stabilizes

#### Test Case 5.3: Classification Performance
**Objective**: Verify classification performance is acceptable

**Steps**:
1. Enable debug mode
2. Navigate to content-heavy page
3. Monitor classification timing
4. Check batch processing
5. Verify caching works

**Expected Results**:
- Classification < 500ms per item
- Batch processing reduces overhead
- Cache hits improve performance
- No UI blocking during classification

## Automated Testing

### Unit Tests

#### Test Suite: Storage Manager
```javascript
describe('StorageManager', () => {
  test('should get categories', async () => {
    const categories = await StorageManager.getCategories('allow');
    expect(Array.isArray(categories)).toBe(true);
  });

  test('should add category', async () => {
    await StorageManager.addCategory('allow', 'Test');
    const categories = await StorageManager.getCategories('allow');
    expect(categories).toContain('Test');
  });

  test('should remove category', async () => {
    await StorageManager.removeCategory('allow', 'Test');
    const categories = await StorageManager.getCategories('allow');
    expect(categories).not.toContain('Test');
  });
});
```

#### Test Suite: Filter Engine
```javascript
describe('FilterEngine', () => {
  test('should determine block decision', () => {
    const settings = { mode: 'balanced', blockedCategories: ['Adult'] };
    const shouldBlock = FilterEngine.shouldBlock('Adult', 0.8, settings);
    expect(shouldBlock).toBe(true);
  });

  test('should apply blur filter', () => {
    const element = document.createElement('div');
    FilterEngine.applyBlur(element, 'Test');
    expect(element.classList.contains('focusguard-blur')).toBe(true);
  });
});
```

#### Test Suite: DOM Scanner
```javascript
describe('DOMScanner', () => {
  test('should extract text content', () => {
    const element = document.createElement('p');
    element.textContent = 'Test content';
    const scanner = new DOMScanner();
    const content = scanner.scanElement(element);
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe('text');
  });
});
```

### Integration Tests

#### Test Suite: Message Passing
```javascript
describe('Message Passing', () => {
  test('should handle get settings message', async () => {
    const response = await chrome.runtime.sendMessage({
      action: 'getSettings'
    });
    expect(response.success).toBe(true);
    expect(response.settings).toBeDefined();
  });

  test('should handle classify content message', async () => {
    const response = await chrome.runtime.sendMessage({
      action: 'classifyContent',
      data: { content: 'test', type: 'text', domain: 'example.com' }
    });
    expect(response.success).toBe(true);
    expect(response.classification).toBeDefined();
  });
});
```

### End-to-End Tests

#### Test Suite: User Workflows
```javascript
describe('User Workflows', () => {
  test('should block content when configured', async () => {
    // Configure extension to block gaming content
    await StorageManager.addCategory('block', 'Gaming');
    await StorageManager.setMode('balanced');
    
    // Navigate to gaming site
    await page.goto('https://www.ign.com');
    
    // Verify content is blocked
    const blockedElements = await page.$$('.focusguard-blur, .focusguard-placeholder');
    expect(blockedElements.length).toBeGreaterThan(0);
  });

  test('should allow educational content', async () => {
    // Configure extension to allow educational content
    await StorageManager.addCategory('allow', 'Education');
    await StorageManager.setMode('strict');
    
    // Navigate to educational site
    await page.goto('https://www.wikipedia.org');
    
    // Verify no content is blocked
    const blockedElements = await page.$$('.focusguard-blur, .focusguard-placeholder');
    expect(blockedElements.length).toBe(0);
  });
});
```

## Performance Testing

### Benchmark Tests

#### Page Load Benchmark
```javascript
const performanceTest = async () => {
  const times = [];
  
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await page.goto('https://www.nytimes.com');
    const end = performance.now();
    times.push(end - start);
  }
  
  const average = times.reduce((a, b) => a + b) / times.length;
  console.log(`Average load time: ${average}ms`);
  
  expect(average).toBeLessThan(3000); // 3 seconds max
};
```

#### Memory Benchmark
```javascript
const memoryTest = async () => {
  const initialMemory = process.memoryUsage();
  
  // Browse for 5 minutes
  for (let i = 0; i < 60; i++) {
    await page.goto('https://www.reddit.com');
    await page.waitForTimeout(5000);
  }
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max
};
```

### Load Testing

#### Concurrent Classification Test
```javascript
const loadTest = async () => {
  const promises = [];
  
  // Simulate 100 concurrent classifications
  for (let i = 0; i < 100; i++) {
    promises.push(
      chrome.runtime.sendMessage({
        action: 'classifyContent',
        data: { content: `Test content ${i}`, type: 'text', domain: 'example.com' }
      })
    );
  }
  
  const start = performance.now();
  const results = await Promise.all(promises);
  const end = performance.now();
  
  console.log(`100 classifications in ${end - start}ms`);
  expect(results.every(r => r.success)).toBe(true);
  expect(end - start).toBeLessThan(5000); // 5 seconds max
};
```

## Compatibility Testing

### Browser Compatibility

#### Chrome Version Testing
| Version | Status | Notes |
|---------|--------|-------|
| 88+ | ✅ Supported | Minimum version |
| 90+ | ✅ Recommended | Better performance |
| 100+ | ✅ Optimal | Full feature support |

#### Platform Testing
| Platform | Status | Notes |
|----------|--------|-------|
| Windows | ✅ Supported | Full testing |
| macOS | ✅ Supported | Full testing |
| Linux | ✅ Supported | Basic testing |
| ChromeOS | ✅ Supported | Basic testing |

### Website Compatibility

#### High-Traffic Websites
```javascript
const compatibilityTests = [
  { url: 'https://www.google.com', expected: 'no_filtering' },
  { url: 'https://www.facebook.com', expected: 'mixed_content' },
  { url: 'https://www.youtube.com', expected: 'video_filtering' },
  { url: 'https://www.reddit.com', expected: 'dynamic_content' },
  { url: 'https://www.twitter.com', expected: 'mixed_content' },
  { url: 'https://www.wikipedia.org', expected: 'educational_content' },
  { url: 'https://www.amazon.com', expected: 'commercial_content' }
];

const testCompatibility = async () => {
  for (const test of compatibilityTests) {
    try {
      await page.goto(test.url);
      await page.waitForTimeout(3000);
      
      // Check for JavaScript errors
      const errors = await page.evaluate(() => {
        return window.console.errors || [];
      });
      
      expect(errors).toHaveLength(0);
      
      // Check extension functionality
      const extensionActive = await page.evaluate(() => {
        return typeof window.focusguard !== 'undefined';
      });
      
      expect(extensionActive).toBe(true);
      
      console.log(`✅ ${test.url} - Compatible`);
    } catch (error) {
      console.log(`❌ ${test.url} - Error: ${error.message}`);
    }
  }
};
```

## Security Testing

### Input Validation Tests

#### Malicious Input Testing
```javascript
const securityTests = [
  { input: '<script>alert("xss")</script>', type: 'text' },
  { input: 'javascript:alert("xss")', type: 'url' },
  { input: '../../../etc/passwd', type: 'path' },
  { input: 'SELECT * FROM users', type: 'sql' },
  { input: '${7*7}', type: 'template' }
];

const testInputValidation = async () => {
  for (const test of securityTests) {
    try {
      const result = await FilterEngine.classifyContent(test.input, test.type);
      expect(result.category).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      console.log(`✅ Input validated: ${test.type}`);
    } catch (error) {
      console.log(`❌ Input rejected: ${test.type} - ${error.message}`);
    }
  }
};
```

### Permission Testing

#### Minimal Permission Test
```javascript
const testPermissions = async () => {
  const permissions = chrome.runtime.getManifest().permissions;
  const requiredPermissions = ['storage', 'activeTab', 'scripting', 'alarms'];
  
  // Check for required permissions
  requiredPermissions.forEach(perm => {
    expect(permissions).toContain(perm);
  });
  
  // Check for unnecessary permissions
  const unnecessaryPermissions = ['history', 'bookmarks', 'tabs'];
  unnecessaryPermissions.forEach(perm => {
    expect(permissions).not.toContain(perm);
  });
  
  console.log('✅ Permissions are minimal and appropriate');
};
```

## User Experience Testing

### Usability Testing

#### First-Time User Experience
1. **Installation**: Can a non-technical user install the extension?
2. **Configuration**: Is the initial setup intuitive?
3. **First Use**: Does the extension work out of the box?
4. **Help**: Is help documentation accessible?

#### Interface Testing
1. **Popup**: Is the popup interface clear and responsive?
2. **Options**: Are all options easily discoverable?
3. **Feedback**: Does the user receive clear feedback?
4. **Errors**: Are error messages helpful?

### Accessibility Testing

#### Keyboard Navigation
```javascript
const testKeyboardNavigation = async () => {
  // Test tab navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement);
  expect(focusedElement).not.toBe(document.body);
  
  // Test Enter/Space on buttons
  await page.keyboard.press('Enter');
  
  // Test Escape to close modals
  await page.keyboard.press('Escape');
  
  console.log('✅ Keyboard navigation works correctly');
};
```

#### Screen Reader Testing
- Test with ChromeVox
- Verify ARIA labels
- Check semantic HTML
- Validate color contrast

## Regression Testing

### Test Automation

#### Continuous Integration
```yaml
# .github/workflows/test.yml
name: FocusGuard Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run lint
      - run: npm run build
```

#### Test Suite
```javascript
// test/regression.js
describe('Regression Tests', () => {
  test('should maintain backward compatibility', async () => {
    // Test with old settings format
    const oldSettings = { mode: 'balanced' };
    await StorageManager.updateSettings(oldSettings);
    
    const newSettings = await StorageManager.getAllSettings();
    expect(newSettings.mode).toBe('balanced');
  });

  test('should handle missing models gracefully', async () => {
    // Test without ONNX models
    const result = await ModelLoader.runInference(null, 'test', 'text');
    expect(result.category).toBe('unknown');
  });
});
```

## Test Reporting

### Test Results Format

```javascript
const testReport = {
  timestamp: '2023-12-21T10:00:00Z',
  version: '1.0.0',
  environment: {
    chromeVersion: '120.0.6099.71',
    platform: 'Windows 10',
    extensions: ['FocusGuard v1.0.0']
  },
  results: {
    unit: { passed: 45, failed: 2, skipped: 0 },
    integration: { passed: 23, failed: 1, skipped: 0 },
    e2e: { passed: 15, failed: 3, skipped: 2 },
    performance: { passed: 8, failed: 0, skipped: 0 }
  },
  coverage: {
    lines: 87.5,
    functions: 82.3,
    branches: 79.1,
    statements: 89.2
  },
  performance: {
    avgLoadTime: 2450, // ms
    memoryUsage: 35, // MB
    classificationTime: 120 // ms
  }
};
```

### Bug Report Template

```markdown
## Bug Report
**Extension Version**: 1.0.0
**Chrome Version**: 120.0.6099.71
**Operating System**: Windows 10

### Issue Description
[Clear description of the issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Console Errors
[Paste any console errors here]

### Additional Context
[Any additional information]
```

### Test Schedule

| Test Type | Frequency | Responsible |
|-----------|-----------|--------------|
| Unit Tests | Every commit | Developers |
| Integration Tests | Every PR | Developers |
| E2E Tests | Daily | CI/CD |
| Performance Tests | Weekly | QA Team |
| Security Tests | Monthly | Security Team |
| Compatibility Tests | Per Release | QA Team |

This comprehensive testing guide ensures the FocusGuard extension meets high quality standards across all aspects of functionality, performance, and user experience.