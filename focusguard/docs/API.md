# FocusGuard API Documentation

## Overview

FocusGuard provides a comprehensive API for content classification, filtering, and analytics. The API is organized into several modules, each with specific responsibilities.

## Table of Contents

- [Storage Manager API](#storage-manager-api)
- [Analytics Manager API](#analytics-manager-api)
- [DOM Scanner API](#dom-scanner-api)
- [Filter Engine API](#filter-engine-api)
- [Model Loader API](#model-loader-api)
- [Keyword Fallback API](#keyword-fallback-api)
- [Message Protocol](#message-protocol)
- [Extension Events](#extension-events)

## Storage Manager API

### Category Management

#### `getCategories(type)`
Gets categories from storage.

**Parameters:**
- `type` (string): `'allow'` or `'block'`

**Returns:** `Promise<string[]>` - Array of category names

**Example:**
```javascript
const allowedCategories = await StorageManager.getCategories('allow');
// Returns: ['Education', 'Technology', 'Health']
```

#### `setCategories(type, categories)`
Sets categories in storage.

**Parameters:**
- `type` (string): `'allow'` or `'block'`
- `categories` (string[]): Array of category names

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.setCategories('block', ['Adult', 'Gaming']);
```

#### `addCategory(type, category)`
Adds a category to the specified list.

**Parameters:**
- `type` (string): `'allow'` or `'block'`
- `category` (string): Category name to add

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.addCategory('allow', 'Science');
```

#### `removeCategory(type, category)`
Removes a category from the specified list.

**Parameters:**
- `type` (string): `'allow'` or `'block'`
- `category` (string): Category name to remove

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.removeCategory('block', 'Politics');
```

### Settings Management

#### `getMode()`
Gets the filtering mode.

**Returns:** `Promise<string>` - `'strict'` or `'balanced'`

**Example:**
```javascript
const mode = await StorageManager.getMode();
// Returns: 'balanced'
```

#### `setMode(mode)`
Sets the filtering mode.

**Parameters:**
- `mode` (string): `'strict'` or `'balanced'`

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.setMode('strict');
```

#### `getFilterMode()`
Gets the filter display mode.

**Returns:** `Promise<string>` - `'blur'` or `'block'`

**Example:**
```javascript
const filterMode = await StorageManager.getFilterMode();
// Returns: 'blur'
```

#### `setFilterMode(mode)`
Sets the filter display mode.

**Parameters:**
- `mode` (string): `'blur'` or `'block'`

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.setFilterMode('block');
```

#### `getSensitivity()`
Gets the sensitivity level.

**Returns:** `Promise<string>` - `'low'`, `'medium'`, or `'high'`

**Example:**
```javascript
const sensitivity = await StorageManager.getSensitivity();
// Returns: 'medium'
```

#### `setSensitivity(level)`
Sets the sensitivity level.

**Parameters:**
- `level` (string): `'low'`, `'medium'`, or `'high'`

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.setSensitivity('high');
```

#### `getSensitivityThreshold()`
Gets the numerical sensitivity threshold.

**Returns:** `Promise<number>` - Confidence threshold (0.5, 0.7, or 0.9)

**Example:**
```javascript
const threshold = await StorageManager.getSensitivityThreshold();
// Returns: 0.7
```

### Domain Management

#### `getBlockedDomains()`
Gets the list of blocked domains.

**Returns:** `Promise<string[]>` - Array of domain names

**Example:**
```javascript
const blockedDomains = await StorageManager.getBlockedDomains();
// Returns: ['reddit.com', 'youtube.com']
```

#### `addBlockedDomain(domain)`
Adds a domain to the blocked list.

**Parameters:**
- `domain` (string): Domain name to block

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.addBlockedDomain('twitter.com');
```

#### `removeBlockedDomain(domain)`
Removes a domain from the blocked list.

**Parameters:**
- `domain` (string): Domain name to unblock

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.removeBlockedDomain('reddit.com');
```

#### `getAllowedDomains()`
Gets the list of allowed domains.

**Returns:** `Promise<string[]>` - Array of domain names

**Example:**
```javascript
const allowedDomains = await StorageManager.getAllowedDomains();
// Returns: ['wikipedia.org', 'github.com']
```

#### `addAllowedDomain(domain)`
Adds a domain to the allowed list.

**Parameters:**
- `domain` (string): Domain name to allow

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.addAllowedDomain('stackoverflow.com');
```

#### `removeAllowedDomain(domain)`
Removes a domain from the allowed list.

**Parameters:**
- `domain` (string): Domain name to remove

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.removeAllowedDomain('github.com');
```

### Extension State Management

#### `getExtensionEnabled(tabId)`
Gets extension enabled state for a tab.

**Parameters:**
- `tabId` (number): Chrome tab ID

**Returns:** `Promise<boolean>` - Extension enabled status

**Example:**
```javascript
const isEnabled = await StorageManager.getExtensionEnabled(123);
// Returns: true
```

#### `setExtensionEnabled(tabId, enabled)`
Sets extension enabled state for a tab.

**Parameters:**
- `tabId` (number): Chrome tab ID
- `enabled` (boolean): Extension enabled status

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.setExtensionEnabled(123, false);
```

### Bulk Operations

#### `getAllSettings()`
Gets all settings as a single object.

**Returns:** `Promise<Object>` - All settings

**Example:**
```javascript
const settings = await StorageManager.getAllSettings();
// Returns: { allowedCategories: [...], blockedCategories: [...], mode: 'balanced', ... }
```

#### `updateSettings(settings)`
Updates multiple settings at once.

**Parameters:**
- `settings` (Object): Settings object to update

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.updateSettings({
  mode: 'strict',
  sensitivity: 'high',
  filterMode: 'block'
});
```

#### `resetToDefaults()`
Resets all settings to default values.

**Returns:** `Promise<void>`

**Example:**
```javascript
await StorageManager.resetToDefaults();
```

#### `exportSettings()`
Exports settings as JSON string.

**Returns:** `Promise<string>` - JSON string of settings

**Example:**
```javascript
const settingsJson = await StorageManager.exportSettings();
// Returns: '{"allowedCategories":[...],"blockedCategories":[...],...}'
```

#### `importSettings(jsonSettings)`
Imports settings from JSON string.

**Parameters:**
- `jsonSettings` (string): JSON string of settings

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
const success = await StorageManager.importSettings('{"mode":"strict"}');
// Returns: true
```

## Analytics Manager API

### Tracking

#### `logBlockAction(type, category, domain, timestamp)`
Logs a block action for analytics.

**Parameters:**
- `type` (string): Content type (`'text'`, `'image'`, `'video'`)
- `category` (string): Content category
- `domain` (string): Domain where blocked
- `timestamp` (number): Timestamp of action (optional, defaults to now)

**Returns:** `Promise<void>`

**Example:**
```javascript
await AnalyticsManager.logBlockAction('image', 'Adult', 'example.com', Date.now());
```

#### `incrementBlockCount(type)`
Increments block count for content type.

**Parameters:**
- `type` (string): Content type (`'text'`, `'image'`, `'video'`)

**Returns:** `Promise<void>`

**Example:**
```javascript
await AnalyticsManager.incrementBlockCount('text');
```

### Statistics

#### `getStats()`
Gets comprehensive statistics.

**Returns:** `Promise<Object>` - Statistics object

**Example:**
```javascript
const stats = await AnalyticsManager.getStats();
// Returns: {
//   blockedTexts: { count: 45, lastUpdated: 1703123456789 },
//   blockedImages: { count: 23, lastUpdated: 1703123456789 },
//   blockedVideos: { count: 12, lastUpdated: 1703123456789 },
//   blockedDomains: { 'youtube.com': 15, 'reddit.com': 8 },
//   actionLog: [...],
//   sessionStats: { startTime: ..., totalBlocked: 80 },
//   totalBlocksToday: 80
// }
```

#### `getTopBlockedDomains(limit)`
Gets top blocked domains.

**Parameters:**
- `limit` (number): Maximum number of domains to return (optional, defaults to 10)

**Returns:** `Promise<Array>` - Array of `{domain, count}` objects

**Example:**
```javascript
const topDomains = await AnalyticsManager.getTopBlockedDomains(5);
// Returns: [
//   { domain: 'youtube.com', count: 15 },
//   { domain: 'reddit.com', count: 8 },
//   ...
// ]
```

#### `getTodayBlockCounts()`
Gets today's block counts by type.

**Returns:** `Promise<Object>` - Block counts by type

**Example:**
```javascript
const counts = await AnalyticsManager.getTodayBlockCounts();
// Returns: { text: 45, images: 23, videos: 12, total: 80 }
```

### Management

#### `resetDailyStats()`
Resets daily statistics.

**Returns:** `Promise<void>`

**Example:**
```javascript
await AnalyticsManager.resetDailyStats();
```

#### `clearAllData()`
Clears all analytics data.

**Returns:** `Promise<void>**

**Example:**
```javascript
await AnalyticsManager.clearAllData();
```

#### `exportAnalytics()`
Exports analytics data as JSON.

**Returns:** `Promise<string>` - JSON string of analytics data

**Example:**
```javascript
const analyticsJson = await AnalyticsManager.exportAnalytics();
```

#### `getHistoricalData(days)`
Gets historical data for date range.

**Parameters:**
- `days` (number): Number of days to retrieve (optional, defaults to 7)

**Returns:** `Promise<Object>` - Historical data

**Example:**
```javascript
const historical = await AnalyticsManager.getHistoricalData(30);
```

## DOM Scanner API

### Monitoring

#### `startMonitoring(callback)`
Starts monitoring DOM for changes.

**Parameters:**
- `callback` (function): Callback function for detected content

**Example:**
```javascript
const scanner = new DOMScanner();
scanner.startMonitoring((content) => {
  console.log('Detected content:', content);
});
```

#### `stopMonitoring()`
Stops DOM monitoring.

**Example:**
```javascript
scanner.stopMonitoring();
```

### Content Extraction

#### `scanElement(element)`
Scans element for content.

**Parameters:**
- `element` (Element): DOM element to scan

**Returns:** `Array` - Array of content objects

**Example:**
```javascript
const content = scanner.scanElement(document.body);
// Returns: [
//   { element: p, type: 'text', data: 'Sample text', domain: 'example.com' },
//   { element: img, type: 'image', data: { src: '...', alt: '...' }, domain: 'example.com' }
// ]
```

#### `getContentStats()`
Gets content statistics for current page.

**Returns:** `Object` - Content statistics

**Example:**
```javascript
const stats = scanner.getContentStats();
// Returns: { textElements: 45, images: 12, videos: 3, links: 28 }
```

### Utility

#### `clearProcessedCache()`
Clears processed elements cache.

**Example:**
```javascript
scanner.clearProcessedCache();
```

#### `getScanStatus()`
Gets current scan status.

**Returns:** `Object` - Scan status

**Example:**
```javascript
const status = scanner.getScanStatus();
// Returns: { isScanning: true, queueLength: 0, hasObserver: true, stats: {...} }
```

#### `scanElementManually(element)`
Manually scans a specific element.

**Parameters:**
- `element` (Element): Element to scan

**Example:**
```javascript
scanner.scanElementManually(specificElement);
```

## Filter Engine API

### Classification

#### `classifyContent(content, type)`
Classifies content using available methods.

**Parameters:**
- `content` (string|Object): Content to classify
- `type` (string): Content type (`'text'`, `'image'`, `'video'`)

**Returns:** `Promise<Object>` - Classification result

**Example:**
```javascript
const result = await filterEngine.classifyContent('Sample text', 'text');
// Returns: { category: 'Education', confidence: 0.85 }
```

### Filtering Logic

#### `shouldBlock(category, confidence, settings)`
Determines if content should be blocked.

**Parameters:**
- `category` (string): Content category
- `confidence` (number): Confidence score (0-1)
- `settings` (Object): User settings

**Returns:** `boolean` - True if should block

**Example:**
```javascript
const shouldBlock = filterEngine.shouldBlock('Adult', 0.9, settings);
// Returns: true
```

### Filter Application

#### `applyBlur(element, category)`
Applies blur filter to element.

**Parameters:**
- `element` (Element): Element to blur
- `category` (string): Content category

**Example:**
```javascript
filterEngine.applyBlur(imageElement, 'Adult');
```

#### `removeElement(element, category)`
Removes element (block mode).

**Parameters:**
- `element` (Element): Element to remove
- `category` (string): Content category

**Example:**
```javascript
filterEngine.removeElement(videoElement, 'Gaming');
```

#### `removeFilter(element)`
Removes filter from element.

**Parameters:**
- `element` (Element): Element to unfilter

**Example:**
```javascript
filterEngine.removeFilter(blurredElement);
```

#### `applyProgressiveBlur(element, intensity)`
Applies progressive blur based on sensitivity.

**Parameters:**
- `element` (Element): Element to blur
- `intensity` (number): Blur intensity (0-100)

**Example:**
```javascript
filterEngine.applyProgressiveBlur(element, 75);
```

### Utility

#### `getSensitivityThreshold(level)`
Gets sensitivity threshold value.

**Parameters:**
- `level` (string): Sensitivity level (`'low'`, `'medium'`, `'high'`)

**Returns:** `number` - Threshold value

**Example:**
```javascript
const threshold = filterEngine.getSensitivityThreshold('medium');
// Returns: 0.7
```

#### `isFiltered(element)`
Checks if element is currently filtered.

**Parameters:**
- `element` (Element): Element to check

**Returns:** `boolean` - True if filtered

**Example:**
```javascript
const filtered = filterEngine.isFiltered(element);
// Returns: true
```

#### `getFilterInfo(element)`
Gets filter information for element.

**Parameters:**
- `element` (Element): Element to check

**Returns:** `Object|null` - Filter information

**Example:**
```javascript
const info = filterEngine.getFilterInfo(element);
// Returns: { category: 'Adult', filterType: 'blur', isFiltered: true }
```

#### `removeAllFilters()`
Removes all filters from page.

**Example:**
```javascript
filterEngine.removeAllFilters();
```

#### `getFilterStats()`
Gets filter statistics.

**Returns:** `Object` - Filter statistics

**Example:**
```javascript
const stats = filterEngine.getFilterStats();
// Returns: { blurred: 5, blocked: 3, total: 8 }
```

## Model Loader API

### Model Management

#### `loadTextClassifier()`
Loads text classifier model.

**Returns:** `Promise<Object>` - ONNX inference session

**Example:**
```javascript
const session = await ModelLoader.loadTextClassifier();
```

#### `loadNSFWClassifier()`
Loads NSFW classifier model.

**Returns:** `Promise<Object>` - ONNX inference session

**Example:**
```javascript
const session = await ModelLoader.loadNSFWClassifier();
```

#### `unloadModels()`
Unloads models to free memory.

**Example:**
```javascript
ModelLoader.unloadModels();
```

#### `getModelStatus()`
Gets model loading status.

**Returns:** `Object` - Model status

**Example:**
```javascript
const status = ModelLoader.getModelStatus();
// Returns: {
//   initialized: true,
//   textClassifierLoaded: true,
//   nsfwClassifierLoaded: true,
//   cacheSize: 15
// }
```

### Inference

#### `runInference(session, input, type)`
Runs inference on content.

**Parameters:**
- `session` (Object): ONNX inference session
- `input` (string|Object): Input data
- `type` (string): Input type (`'text'` or `'image'`)

**Returns:** `Promise<Object>` - Classification result

**Example:**
```javascript
const result = await ModelLoader.runInference(session, 'Sample text', 'text');
// Returns: { category: 'Education', confidence: 0.85 }
```

### Cache Management

#### `cacheResults(key, result, ttl)`
Caches inference result.

**Parameters:**
- `key` (string): Cache key
- `result` (Object): Result to cache
- `ttl` (number): Time to live in milliseconds (optional, defaults to 5 minutes)

**Example:**
```javascript
ModelLoader.cacheResults('text_sample123', { category: 'Education', confidence: 0.85 });
```

#### `clearCache()`
Clears inference cache.

**Example:**
```javascript
ModelLoader.clearCache();
```

#### `getCacheStats()`
Gets cache statistics.

**Returns:** `Object` - Cache statistics

**Example:**
```javascript
const stats = ModelLoader.getCacheStats();
// Returns: { size: 15, timeout: 300000 }
```

## Keyword Fallback API

### Classification

#### `classifyByKeywords(text, domain)`
Classifies content by keywords and domain.

**Parameters:**
- `text` (string): Text content to classify
- `domain` (string): Domain name

**Returns:** `Object` - Classification result

**Example:**
```javascript
const result = KeywordFallback.classifyByKeywords('Educational content about science', 'wikipedia.org');
// Returns: { category: 'Education', confidence: 0.8 }
```

### Category Management

#### `getAvailableCategories()`
Gets all available categories.

**Returns:** `Array` - Array of category names

**Example:**
```javascript
const categories = KeywordFallback.getAvailableCategories();
// Returns: ['Education', 'Technology', 'Science', ...]
```

#### `addCategoryKeywords(category, keywords)`
Adds keywords to category.

**Parameters:**
- `category` (string): Category name
- `keywords` (Array): Keywords to add

**Example:**
```javascript
KeywordFallback.addCategoryKeywords('Custom', ['keyword1', 'keyword2']);
```

#### `removeCategoryKeywords(category, keywords)`
Removes keywords from category.

**Parameters:**
- `category` (string): Category name
- `keywords` (Array): Keywords to remove

**Example:**
```javascript
KeywordFallback.removeCategoryKeywords('Education', ['old_keyword']);
```

#### `getCategoryKeywordsList(category)`
Gets keywords for specific category.

**Parameters:**
- `category` (string): Category name

**Returns:** `Array` - Array of keywords

**Example:**
```javascript
const keywords = KeywordFallback.getCategoryKeywordsList('Education');
// Returns: ['learn', 'study', 'education', ...]
```

### Domain Management

#### `addDomainToBlacklist(domain)`
Adds domain to blacklist.

**Parameters:**
- `domain` (string): Domain to add

**Example:**
```javascript
KeywordFallback.addDomainToBlacklist('example.com');
```

#### `removeDomainFromBlacklist(domain)`
Removes domain from blacklist.

**Parameters:**
- `domain` (string): Domain to remove

**Example:**
```javascript
KeywordFallback.removeDomainFromBlacklist('example.com');
```

#### `addDomainToWhitelist(domain)`
Adds domain to whitelist.

**Parameters:**
- `domain` (string): Domain to add

**Example:**
```javascript
KeywordFallback.addDomainToWhitelist('wikipedia.org');
```

#### `removeDomainFromWhitelist(domain)`
Removes domain from whitelist.

**Parameters:**
- `domain` (string): Domain to remove

**Example:**
```javascript
KeywordFallback.removeDomainFromWhitelist('wikipedia.org');
```

### Data Management

#### `exportKeywordData()`
Exports keyword data.

**Returns:** `Object` - Keyword data object

**Example:**
```javascript
const data = KeywordFallback.exportKeywordData();
// Returns: { blacklist: [...], whitelist: [...], categoryKeywords: {...} }
```

#### `importKeywordData(data)`
Imports keyword data.

**Parameters:**
- `data` (Object): Keyword data object

**Example:**
```javascript
KeywordFallback.importKeywordData({
  blacklist: ['example.com'],
  categoryKeywords: { 'Custom': ['keyword1'] }
});
```

## Message Protocol

### Background Script Messages

#### From Popup/Options to Background

**Get Settings:**
```javascript
chrome.runtime.sendMessage({
  action: 'getSettings'
});
```

**Response:**
```javascript
{
  success: true,
  settings: { /* settings object */ }
}
```

**Update Settings:**
```javascript
chrome.runtime.sendMessage({
  action: 'updateSettings',
  settings: { /* settings object */ }
});
```

**Response:**
```javascript
{
  success: true
}
```

**Toggle Extension:**
```javascript
chrome.runtime.sendMessage({
  action: 'toggleExtension',
  tabId: 123,
  enabled: true
});
```

**Response:**
```javascript
{
  success: true
}
```

**Add Domain to List:**
```javascript
chrome.runtime.sendMessage({
  action: 'addDomainToList',
  domain: 'example.com',
  listType: 'block' // 'block' or 'allow'
});
```

**Response:**
```javascript
{
  success: true
}
```

**Get Stats:**
```javascript
chrome.runtime.sendMessage({
  action: 'getStats'
});
```

**Response:**
```javascript
{
  success: true,
  stats: { /* stats object */ }
}
```

#### From Content Script to Background

**Classify Content:**
```javascript
chrome.runtime.sendMessage({
  action: 'classifyContent',
  data: {
    content: 'Sample text',
    type: 'text',
    domain: 'example.com'
  }
});
```

**Response:**
```javascript
{
  success: true,
  classification: {
    category: 'Education',
    confidence: 0.85
  }
}
```

**Log Block Action:**
```javascript
chrome.runtime.sendMessage({
  action: 'logBlockAction',
  data: {
    type: 'text',
    category: 'Adult',
    domain: 'example.com',
    timestamp: 1703123456789
  }
});
```

**Response:**
```javascript
{
  success: true
}
```

### Background to Content Script Messages

**Settings Updated:**
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'settingsUpdated',
  settings: { /* settings object */ }
});
```

**Toggle Filtering:**
```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'toggleFiltering',
  enabled: true
});
```

## Extension Events

### Chrome Events

#### `chrome.runtime.onMessage`
Handles incoming messages from popup, options, and content scripts.

#### `chrome.tabs.onUpdated`
Handles tab updates (page navigation, loading complete).

#### `chrome.tabs.onRemoved`
Handles tab removal (cleanup).

#### `chrome.alarms.onAlarm`
Handles scheduled tasks (daily stats reset).

### DOM Events

#### `MutationObserver`
Monitors DOM changes for new content.

#### Element Events
- `mouseenter`/`mouseleave`: Reveal blurred content
- `click`: Permanently reveal content
- `change`: Form inputs in options page

### Custom Events

#### `focusguard:contentDetected`
Fired when new content is detected for classification.

#### `focusguard:filterApplied`
Fired when a filter is applied to content.

#### `focusguard:settingsChanged`
Fired when user settings are changed.

## Error Handling

### Common Error Codes

- `MODEL_LOAD_ERROR`: Failed to load ONNX model
- `INFERENCE_ERROR`: Model inference failed
- `STORAGE_ERROR`: Chrome storage operation failed
- `CLASSIFICATION_ERROR`: Content classification failed
- `PERMISSION_ERROR`: Missing required permissions
- `INVALID_INPUT`: Invalid input parameters

### Error Response Format

```javascript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  details: { /* additional error details */ }
}
```

### Error Recovery

1. **Model Errors**: Fall back to keyword classification
2. **Storage Errors**: Use in-memory defaults
3. **Classification Errors**: Skip content and log error
4. **Permission Errors**: Request permissions or disable features

## Performance Considerations

### Optimization Tips

1. **Batch Processing**: Group multiple classifications
2. **Caching**: Cache classification results
3. **Debouncing**: Delay DOM processing
4. **Lazy Loading**: Load models on demand
5. **Memory Management**: Clear unused data

### Performance Monitoring

```javascript
// Enable performance monitoring
console.time('classification');
const result = await classifyContent(text);
console.timeEnd('classification');

// Monitor memory usage
if (performance.memory) {
  console.log('Memory:', performance.memory.usedJSHeapSize);
}
```

## Security Notes

### Input Validation

- Sanitize all user inputs
- Validate parameter types
- Check for malicious content

### Data Protection

- All processing happens locally
- No data sent to external servers
- User has full control over data

### Permission Management

- Request minimum necessary permissions
- Explain permission usage
- Allow users to revoke permissions

This API documentation provides comprehensive information for developers working with or extending the FocusGuard extension.