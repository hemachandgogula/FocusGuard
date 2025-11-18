/**
 * Content Script for FocusGuard
 * Handles DOM scanning, content classification, and filtering
 */

console.log('FocusGuard: Content script starting on', window.location.hostname);

let contentScriptManager = null;
let managerReady = false;
let heartbeatTimerId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) {
    return false;
  }

  if (message.action === 'ping') {
    sendResponse({ status: 'alive' });
    return false;
  }

  if (managerReady && contentScriptManager) {
    const keepPortOpen = contentScriptManager.handleRuntimeMessage(message, sender, sendResponse);
    return keepPortOpen === true;
  }

  sendResponse({ success: false, error: 'content_script_initializing' });
  return false;
});

function announceContentScriptReady(attempt = 0) {
  const MAX_ATTEMPTS = 5;
  chrome.runtime.sendMessage({ action: 'contentScriptReady' }, (response) => {
    if (chrome.runtime.lastError) {
      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = 300 * (attempt + 1);
        setTimeout(() => announceContentScriptReady(attempt + 1), delay);
      } else {
        console.warn('FocusGuard: Unable to notify background after multiple attempts:', chrome.runtime.lastError.message);
      }
      return;
    }

    console.log('FocusGuard: Background acknowledged content script readiness', response);
  });
}

function startHeartbeat() {
  const HEARTBEAT_INTERVAL = 30000;

  if (heartbeatTimerId) {
    return;
  }

  heartbeatTimerId = setInterval(() => {
    chrome.runtime.sendMessage({ action: 'contentScriptHeartbeat' }, () => {
      if (chrome.runtime.lastError) {
        console.debug('FocusGuard: Heartbeat delivery issue:', chrome.runtime.lastError.message);
      }
    });
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimerId) {
    clearInterval(heartbeatTimerId);
    heartbeatTimerId = null;
  }
}

window.addEventListener('beforeunload', stopHeartbeat);

class ContentScriptManager {
  constructor() {
    this.isEnabled = true;
    this.settings = {};
    this.currentDomain = window.location.hostname;
    this.scanner = new DOMScanner();
    this.filterEngine = new FilterEngine();
    this.processingQueue = [];
    this.isProcessing = false;
    this.monitoringActive = false;

    this.bootstrap();
  }

  async bootstrap() {
    try {
      await this.waitForDomReady();
      await this.ensureOnnxRuntimeLoaded();
      await this.initialize();
    } catch (error) {
      console.error('FocusGuard: Bootstrap error:', error);
      managerReady = true;
      announceContentScriptReady();
    }
  }

  async waitForDomReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      return;
    }

    await new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
  }

  async ensureOnnxRuntimeLoaded() {
    if (typeof window.ort !== 'undefined') {
      return;
    }

    try {
      await import(chrome.runtime.getURL('lib/onnx-runtime-web.min.js'));
      if (typeof window.ort !== 'undefined') {
        console.log('FocusGuard: ONNX Runtime Web loaded via dynamic import');
      } else {
        console.warn('FocusGuard: ONNX Runtime Web still unavailable after dynamic import');
      }
    } catch (error) {
      console.error('FocusGuard: Failed to dynamically import ONNX Runtime Web', error);
    }
  }

  async initialize() {
    try {
      await this.loadSettings();

      if (this.isEnabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }

      managerReady = true;
      announceContentScriptReady();
      startHeartbeat();

      console.log('FocusGuard: Content script initialized');
    } catch (error) {
      console.error('FocusGuard: Initialization error:', error);
      managerReady = true;
      announceContentScriptReady();
      startHeartbeat();
    }
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSettings'
      });

      if (response && response.success) {
        this.settings = response.settings;
        this.isEnabled = this.settings.extensionEnabled !== false;
      } else {
        console.warn('FocusGuard: Using default settings - unable to fetch from background');
      }
    } catch (error) {
      console.error('FocusGuard: Error loading settings:', error);
    }
  }

  handleRuntimeMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'settingsUpdated':
          this.settings = message.settings;
          this.isEnabled = this.settings.extensionEnabled !== false;

          if (this.isEnabled) {
            this.startMonitoring();
          } else {
            this.stopMonitoring();
            this.processingQueue = [];
            this.isProcessing = false;
            this.removeAllFilters();
          }

          sendResponse({ success: true });
          return false;

        case 'toggleFiltering':
          this.isEnabled = message.enabled;

          if (this.isEnabled) {
            this.startMonitoring();
          } else {
            this.stopMonitoring();
            this.processingQueue = [];
            this.isProcessing = false;
            this.removeAllFilters();
          }

          sendResponse({ success: true });
          return false;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
          return false;
      }
    } catch (error) {
      console.error('FocusGuard: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
      return false;
    }
  }

  startMonitoring() {
    if (this.monitoringActive) {
      return;
    }

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring(), { once: true });
      return;
    }

    this.scanner.startMonitoring((content) => {
      this.processContent(content);
    });

    this.monitoringActive = true;
    console.log('FocusGuard: DOM monitoring started');
  }

  stopMonitoring() {
    this.scanner.stopMonitoring();
    this.monitoringActive = false;
  }

  async processContent(content) {
    if (!this.isEnabled || !content) {
      return;
    }

    const items = Array.isArray(content) ? content : [content];
    if (items.length === 0) {
      return;
    }

    this.processingQueue.push(...items);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0 && this.isEnabled) {
      await this.sleep(300);

      const batch = this.processingQueue.splice(0);

      try {
        for (const item of batch) {
          await this.processContentItem(item);
        }
      } catch (error) {
        console.error('FocusGuard: Error processing content batch:', error);
      }
    }

    this.isProcessing = false;
  }

  async processContentItem(content) {
    const { element, type, data, domain } = content;

    try {
      if (!document.contains(element)) {
        return;
      }

      if (this.isDomainAllowed(domain)) {
        return;
      }

      if (this.isDomainBlocked(domain)) {
        this.applyFilter(element, 'domain-blocked', type);
        return;
      }

      const classification = await this.classifyContent(data, type, domain);

      const shouldBlock = this.filterEngine.shouldBlock(
        classification.category,
        classification.confidence,
        this.settings
      );

      if (shouldBlock) {
        this.applyFilter(element, classification.category, type);
        this.logBlockAction(type, classification.category, domain);
      }

    } catch (error) {
      console.error('FocusGuard: Error processing content item:', error);
    }
  }

  async classifyContent(data, type, domain) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'classifyContent',
        data: { content: data, type, domain }
      });

      if (response && response.success) {
        return response.classification;
      }

      return KeywordFallback.classifyByKeywords(data, domain);
    } catch (error) {
      console.error('FocusGuard: Classification error:', error);
      return KeywordFallback.classifyByKeywords(data, domain);
    }
  }

  isDomainAllowed(domain) {
    return this.settings.allowedDomains &&
           this.settings.allowedDomains.includes(domain);
  }

  isDomainBlocked(domain) {
    return this.settings.blockedDomains &&
           this.settings.blockedDomains.includes(domain);
  }

  applyFilter(element, category, type) {
    const filterMode = this.settings.filterMode || 'blur';

    if (filterMode === 'blur') {
      this.filterEngine.applyBlur(element, category);
    } else {
      this.filterEngine.removeElement(element, category);
    }
  }

  removeAllFilters() {
    const filteredElements = document.querySelectorAll('[data-focusguard-filtered]');
    filteredElements.forEach(element => {
      this.filterEngine.removeFilter(element);
    });
  }

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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

try {
  contentScriptManager = new ContentScriptManager();
} catch (error) {
  console.error('FocusGuard: Failed to bootstrap content script manager:', error);
  managerReady = false;
}
