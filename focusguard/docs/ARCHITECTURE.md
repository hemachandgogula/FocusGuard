# FocusGuard Architecture

## Overview

FocusGuard is a Chrome Manifest V3 extension that uses AI-powered content filtering to help users stay focused by blocking distracting content. The architecture follows a modular design with clear separation of concerns between background processing, content injection, and user interface components.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FocusGuard Extension                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Popup     │  │   Options     │  │   Content Script │   │
│  │   UI        │  │   Page        │  │   (per tab)      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Background Service Worker                     │   │
│  │  (Central coordination and state management)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Storage Layer                             │   │
│  │  chrome.storage.sync  │  chrome.storage.local         │   │
│  │  (Settings, config)   │  (Analytics, cache)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Background Service Worker (background.js)

**Purpose**: Central coordination and state management

**Responsibilities**:
- Message routing between components
- Chrome storage management
- Tab state tracking
- Alarm management for daily resets
- Model loading coordination

**Key Interactions**:
```
Popup ←→ Background ←→ Content Script
   ↓           ↓              ↓
Storage    Analytics    DOM Scanner
```

### 2. Content Script (contentScript.js)

**Purpose**: Real-time content scanning and filtering

**Responsibilities**:
- DOM monitoring with MutationObserver
- Content extraction (text, images, videos)
- Classification requests
- Filter application (blur/block)
- Performance optimization (debouncing, batching)

**Processing Pipeline**:
```
DOM Change → MutationObserver → Content Extraction → 
Classification Request → Filter Decision → DOM Modification
```

### 3. Popup Interface (popup/)

**Purpose**: Quick access controls and status display

**Components**:
- Master toggle switch
- Mode selection (Strict/Balanced)
- Statistics display
- Quick domain actions
- Real-time status updates

### 4. Options Page (options/)

**Purpose**: Comprehensive settings management

**Sections**:
- Category management (Allow/Block lists)
- Filtering behavior configuration
- Analytics dashboard
- Domain management
- Debug options

## Library Architecture

### Core Libraries

#### Storage Manager (lib/storage-manager.js)
**Interface**:
```javascript
// Category management
StorageManager.getCategories(type)           // 'allow' or 'block'
StorageManager.setCategories(type, categories)
StorageManager.addCategory(type, category)
StorageManager.removeCategory(type, category)

// Settings management
StorageManager.getMode()                    // 'strict' or 'balanced'
StorageManager.setMode(mode)
StorageManager.getFilterMode()              // 'blur' or 'block'
StorageManager.setFilterMode(mode)
StorageManager.getSensitivity()             // 'low', 'medium', 'high'

// Domain management
StorageManager.getBlockedDomains()
StorageManager.addBlockedDomain(domain)
StorageManager.getAllowedDomains()
StorageManager.addAllowedDomain(domain)
```

#### Analytics Manager (lib/analytics-manager.js)
**Interface**:
```javascript
// Tracking
AnalyticsManager.logBlockAction(type, category, domain, timestamp)
AnalyticsManager.incrementBlockCount(type)   // 'text', 'image', 'video'

// Statistics
AnalyticsManager.getStats()
AnalyticsManager.getTopBlockedDomains(limit)
AnalyticsManager.getTodayBlockCounts()

// Management
AnalyticsManager.resetDailyStats()
AnalyticsManager.clearAllData()
```

#### DOM Scanner (lib/dom-scanner.js)
**Interface**:
```javascript
// Monitoring
DOMScanner.startMonitoring(callback)
DOMScanner.stopMonitoring()

// Content extraction
DOMScanner.scanElement(element)              // Returns {text, images, videos, links}
DOMScanner.getContentStats()                 // Page statistics

// Performance
DOMScanner.clearProcessedCache()
DOMScanner.getScanStatus()
```

#### Filter Engine (lib/filter-engine.js)
**Interface**:
```javascript
// Classification
FilterEngine.classifyContent(content, type)   // async classification
FilterEngine.shouldBlock(category, confidence, settings)

// Filter application
FilterEngine.applyBlur(element, category)
FilterEngine.removeElement(element, category)
FilterEngine.removeFilter(element)

// Statistics
FilterEngine.getFilterStats()
FilterEngine.isFiltered(element)
```

#### Model Loader (lib/model-loader.js)
**Interface**:
```javascript
// Model management
ModelLoader.loadTextClassifier()             // Returns ONNX session
ModelLoader.loadNSFWClassifier()             // Returns ONNX session
ModelLoader.unloadModels()

// Inference
ModelLoader.runInference(session, input, type)
ModelLoader.cacheResults(key, result, ttl)

// Cache management
ModelLoader.clearCache()
ModelLoader.getCacheStats()
```

#### Keyword Fallback (lib/keyword-fallback.js)
**Interface**:
```javascript
// Classification
KeywordFallback.classifyByKeywords(text, domain)

// Category management
KeywordFallback.getAvailableCategories()
KeywordFallback.addCategoryKeywords(category, keywords)

// Domain management
KeywordFallback.addDomainToBlacklist(domain)
KeywordFallback.addDomainToWhitelist(domain)
```

## Data Flow Architecture

### 1. Content Classification Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DOM Scanner   │───▶│ Background SW   │───▶│ Model Loader    │
│                 │    │                  │    │                 │
│ - Extract text   │    │ - Route request  │    │ - Load ONNX     │
│ - Extract images │    │ - Manage cache   │    │ - Run inference │
│ - Extract videos │    │ - Fallback      │    │ - Cache results │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Filter Engine   │◀───│ Classification  │◀───│ Inference       │
│                 │    │ Result          │    │ Result          │
│ - Apply blur    │    │ - Category      │    │ - Confidence    │
│ - Apply block   │    │ - Confidence    │    │ - Metadata      │
│ - Update stats  │    │ - Metadata      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2. Settings Management Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Options Page    │───▶│ Background SW   │───▶│ Storage Manager │
│                 │    │                  │    │                 │
│ - UI changes    │    │ - Validate      │    │ - chrome.storage │
│ - User input    │    │ - Broadcast     │    │ - Sync/Locals   │
│ - Validation    │    │ - Persist       │    │ - Defaults      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Content Scripts │◀───│ Settings Update  │◀───│ Storage Update  │
│                 │    │                 │    │                 │
│ - Receive sync  │    │ - Message tabs   │    │ - Notify change │
│ - Apply changes │    │ - Update state   │    │ - Persist data  │
│ - Refresh UI    │    │ - Log changes   │    │ - Handle errors │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 3. Analytics Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Filter Engine   │───▶│ Analytics Mgr   │───▶│ Storage Local   │
│                 │    │                  │    │                 │
│ - Block action  │    │ - Increment     │    │ - Daily counts  │
│ - Category      │    │ - Domain stats  │    │ - Action log    │
│ - Confidence    │    │ - Session data  │    │ - Historical    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Options Page    │◀───│ Statistics API  │◀───│ Storage Queries │
│                 │    │                  │    │                 │
│ - Display stats │    │ - Aggregations   │    │ - Read data     │
│ - Charts        │    │ - Top domains   │    │ - Format data   │
│ - Export        │    │ - Trends        │    │ - Cache results │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Storage Architecture

### chrome.storage.sync (Settings)
```javascript
{
  "allowedCategories": ["Education", "Technology"],
  "blockedCategories": ["Adult", "Gaming"],
  "mode": "balanced",                    // "strict" | "balanced"
  "filterMode": "blur",                 // "blur" | "block"
  "sensitivity": "medium",               // "low" | "medium" | "high"
  "blockedDomains": ["example.com"],
  "allowedDomains": ["wikipedia.org"],
  "debugMode": false
}
```

### chrome.storage.local (Analytics)
```javascript
{
  "blockedTexts": { "count": 45, "lastUpdated": 1703123456789 },
  "blockedImages": { "count": 23, "lastUpdated": 1703123456789 },
  "blockedVideos": { "count": 12, "lastUpdated": 1703123456789 },
  "blockedDomains": {
    "youtube.com": 15,
    "reddit.com": 8,
    "twitter.com": 5
  },
  "actionLog": [
    { "action": "block", "type": "text", "category": "Gaming", "domain": "reddit.com", "timestamp": 1703123456789 }
  ],
  "sessionStats": {
    "startTime": 1703123456789,
    "endTime": 1703123456789,
    "totalBlocked": 80
  },
  "historicalData": {
    "2023-12-21": { /* daily stats */ }
  }
}
```

## Performance Architecture

### 1. Content Script Optimization
- **Debouncing**: 300ms delay for batch processing
- **WeakSet Caching**: Prevents duplicate processing
- **Lazy Loading**: Models loaded on-demand
- **Inference Caching**: 5-minute TTL for results

### 2. Memory Management
- **Model Unloading**: Clear models when not in use
- **Cache Cleanup**: Automatic expired entry removal
- **DOM Cleanup**: Remove event listeners on element removal

### 3. Network Optimization
- **Local Storage**: Minimize background communication
- **Batch Operations**: Group storage writes
- **Message Throttling**: Prevent message flooding

## Security Architecture

### 1. Content Security
- **CSP Compliant**: No inline scripts or eval()
- **Sandboxed Content**: Content script isolation
- **Permission Minimalism**: Only required permissions

### 2. Data Privacy
- **Local Processing**: No external API calls
- **On-Device ML**: Models run locally
- **User Control**: Full data export/clear options

### 3. Input Validation
- **Sanitization**: All user inputs sanitized
- **Type Checking**: Strict type validation
- **Error Boundaries**: Graceful error handling

## Extension Lifecycle

### 1. Installation
```
Extension Install → Default Settings → Options Page → User Configuration
```

### 2. Normal Operation
```
Page Load → Content Script Inject → DOM Monitoring → Classification → Filtering
```

### 3. Settings Update
```
Options Change → Background Sync → Content Script Update → Filter Reapply
```

### 4. Extension Update
```
Update Available → Migration Script → Settings Preserve → New Features
```

## Error Handling Architecture

### 1. Fallback Chain
```
ONNX Model → Keyword Classification → Domain Lists → Default Policy
```

### 2. Error Recovery
```
Model Load Error → Fallback Mode → User Notification → Background Retry
```

### 3. Debug Mode
```
Debug Enabled → Console Logging → Error Tracking → Performance Metrics
```

## Testing Architecture

### 1. Unit Tests
- Library function testing
- Mock Chrome APIs
- Edge case validation

### 2. Integration Tests
- Component communication
- Storage operations
- Message passing

### 3. End-to-End Tests
- Real website testing
- Performance benchmarking
- User scenario validation

## Future Extensibility

### 1. Plugin Architecture
- Custom filter engines
- Third-party models
- External integrations

### 2. API Extensions
- Cloud model support
- Collaborative filtering
- Advanced analytics

### 3. Platform Support
- Firefox extension
- Safari extension
- Mobile applications

This architecture provides a solid foundation for the FocusGuard Phase 1 implementation while allowing for future growth and enhancement.