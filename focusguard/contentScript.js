/**
 * Content Script for FocusGuard
 * Handles DOM scanning, content classification, and filtering
 */

importScripts('lib/dom-scanner.js');
importScripts('lib/filter-engine.js');
importScripts('lib/keyword-fallback.js');

class ContentScriptManager {
  constructor() {
    this.isEnabled = true;
    this.settings = {};
    this.currentDomain = window.location.hostname;
    this.scanner = new DOMScanner();
    this.filterEngine = new FilterEngine();
    this.processingQueue = [];
    this.isProcessing = false;
    
    this.initialize();
  }

  /**
   * Initialize content script
   */
  async initialize() {
    try {
      // Load initial settings
      await this.loadSettings();
      
      // Setup message listeners
      this.setupMessageListeners();
      
      // Start DOM monitoring if enabled
      if (this.isEnabled) {
        this.startMonitoring();
      }
      
      console.log('FocusGuard: Content script initialized');
    } catch (error) {
      console.error('FocusGuard: Initialization error:', error);
    }
  }

  /**
   * Load settings from background
   */
  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSettings'
      });
      
      if (response.success) {
        this.settings = response.settings;
        this.isEnabled = this.settings.extensionEnabled !== false;
      }
    } catch (error) {
      console.error('FocusGuard: Error loading settings:', error);
    }
  }

  /**
   * Setup message listeners from background
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  /**
   * Handle messages from background script
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'settingsUpdated':
          this.settings = message.settings;
          this.isEnabled = this.settings.extensionEnabled !== false;
          
          if (this.isEnabled) {
            this.startMonitoring();
          } else {
            this.stopMonitoring();
          }
          sendResponse({ success: true });
          break;
        
        case 'toggleFiltering':
          this.isEnabled = message.enabled;
          if (this.isEnabled) {
            this.startMonitoring();
          } else {
            this.stopMonitoring();
            this.removeAllFilters();
          }
          sendResponse({ success: true });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('FocusGuard: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Start DOM monitoring
   */
  startMonitoring() {
    this.scanner.startMonitoring((content) => {
      this.processContent(content);
    });
  }

  /**
   * Stop DOM monitoring
   */
  stopMonitoring() {
    this.scanner.stopMonitoring();
  }

  /**
   * Process detected content
   */
  async processContent(content) {
    // Add to processing queue
    this.processingQueue.push(content);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process content queue with debouncing
   */
  async processQueue() {
    this.isProcessing = true;
    
    // Wait a bit for batch processing
    await this.sleep(300);
    
    const batch = this.processingQueue.splice(0);
    
    try {
      for (const content of batch) {
        await this.processContentItem(content);
      }
    } catch (error) {
      console.error('FocusGuard: Error processing content batch:', error);
    }
    
    this.isProcessing = false;
    
    // Continue processing if more items were added
    if (this.processingQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Process individual content item
   */
  async processContentItem(content) {
    const { element, type, data, domain } = content;
    
    try {
      // Check if element is still in DOM
      if (!document.contains(element)) {
        return;
      }
      
      // Check domain lists first
      if (this.isDomainAllowed(domain)) {
        return;
      }
      
      if (this.isDomainBlocked(domain)) {
        this.applyFilter(element, 'domain-blocked', type);
        return;
      }
      
      // Classify content
      const classification = await this.classifyContent(data, type, domain);
      
      // Determine if should block
      const shouldBlock = this.filterEngine.shouldBlock(
        classification.category,
        classification.confidence,
        this.settings
      );
      
      if (shouldBlock) {
        this.applyFilter(element, classification.category, type);
        
        // Log to analytics
        this.logBlockAction(type, classification.category, domain);
      }
      
    } catch (error) {
      console.error('FocusGuard: Error processing content item:', error);
    }
  }

  /**
   * Classify content using background script
   */
  async classifyContent(data, type, domain) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'classifyContent',
        data: { content: data, type, domain }
      });
      
      if (response.success) {
        return response.classification;
      } else {
        // Fallback to keyword classification
        return KeywordFallback.classifyByKeywords(data, domain);
      }
    } catch (error) {
      console.error('FocusGuard: Classification error:', error);
      // Fallback to keyword classification
      return KeywordFallback.classifyByKeywords(data, domain);
    }
  }

  /**
   * Check if domain is allowed
   */
  isDomainAllowed(domain) {
    return this.settings.allowedDomains && 
           this.settings.allowedDomains.includes(domain);
  }

  /**
   * Check if domain is blocked
   */
  isDomainBlocked(domain) {
    return this.settings.blockedDomains && 
           this.settings.blockedDomains.includes(domain);
  }

  /**
   * Apply filter to element
   */
  applyFilter(element, category, type) {
    const filterMode = this.settings.filterMode || 'blur';
    
    if (filterMode === 'blur') {
      this.filterEngine.applyBlur(element, category);
    } else {
      this.filterEngine.removeElement(element, category);
    }
  }

  /**
   * Remove all filters from page
   */
  removeAllFilters() {
    const filteredElements = document.querySelectorAll('[data-focusguard-filtered]');
    filteredElements.forEach(element => {
      this.filterEngine.removeFilter(element);
    });
  }

  /**
   * Log block action to analytics
   */
  logBlockAction(type, category, domain) {
    chrome.runtime.sendMessage({
      action: 'logBlockAction',
      data: {
        type,
        category,
        domain: domain || this.currentDomain,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize content script
new ContentScriptManager();