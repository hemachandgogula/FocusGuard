/**
 * Background Service Worker for FocusGuard
 * Manages storage, messaging, and coordination between components
 */

if (typeof window === 'undefined' && typeof self !== 'undefined') {
  self.window = self;
}

importScripts('lib/storage-manager.js');
importScripts('lib/analytics-manager.js');
importScripts('lib/filter-engine.js');
importScripts('lib/onnx-runtime-web.min.js');
importScripts('lib/model-loader.js');

class BackgroundService {
  constructor() {
    this.activeContentScripts = new Map();
    this.heartbeatIntervalId = null;

    this.initializeAlarms();
    this.setupMessageListeners();
    this.setupTabListeners();
    this.startContentScriptMonitor();
  }

  /**
   * Initialize Chrome alarms for daily reset
   */
  initializeAlarms() {
    chrome.alarms.create('dailyReset', {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60 // Repeat daily
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'dailyReset') {
        AnalyticsManager.resetDailyStats();
        console.log('FocusGuard: Daily stats reset');
      }
    });
  }

  /**
   * Get next midnight timestamp
   */
  getNextMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  }

  /**
   * Setup message listeners for popup and content script communication
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  /**
   * Handle incoming messages from popup and content scripts
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'contentScriptReady':
          if (sender.tab && typeof sender.tab.id === 'number') {
            this.markContentScriptActive(sender.tab.id);
            console.log('FocusGuard: Content script ready on tab', sender.tab.id);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'missing_tab_context' });
          }
          break;

        case 'contentScriptHeartbeat':
          if (sender.tab && typeof sender.tab.id === 'number') {
            this.markContentScriptActive(sender.tab.id);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'missing_tab_context' });
          }
          break;

        case 'ping':
          sendResponse({ status: 'alive' });
          break;

        case 'classifyContent':
          this.markContentScriptActive(sender?.tab?.id);
          await this.handleClassifyContent(message, sender, sendResponse);
          break;
        
        case 'getSettings':
          await this.handleGetSettings(sendResponse);
          break;
        
        case 'updateSettings':
          await this.handleUpdateSettings(message.settings, sendResponse);
          break;
        
        case 'getStats':
          await this.handleGetStats(sendResponse);
          break;
        
        case 'toggleExtension':
          await this.handleToggleExtension(message.tabId, message.enabled, sendResponse);
          break;
        
        case 'getTabExtensionState':
          await this.handleGetTabExtensionState(message.tabId, sendResponse);
          break;
        
        case 'addDomainToList':
          await this.handleAddDomainToList(message.domain, message.listType, sendResponse);
          break;
        
        case 'logBlockAction':
          this.markContentScriptActive(sender?.tab?.id);
          await this.handleLogBlockAction(message.data, sendResponse);
          break;
        
        case 'resetStats':
          await this.handleResetStats(sendResponse);
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
   * Classify content using ML models
   */
  async handleClassifyContent(message, sender, sendResponse) {
    const { content, type, domain } = message.data || {};
    
    try {
      // Load models if not already loaded
      const textSession = await ModelLoader.loadTextClassifier();
      const nsfwSession = await ModelLoader.loadNSFWClassifier();
      
      // Classify based on content type
      let result;
      if (type === 'text') {
        result = await ModelLoader.runInference(textSession, content, 'text');
      } else if (type === 'image') {
        result = await ModelLoader.runInference(nsfwSession, content, 'image');
      } else {
        result = { category: 'unknown', confidence: 0.0 };
      }
      
      sendResponse({ 
        success: true, 
        classification: result 
      });
    } catch (error) {
      console.error('FocusGuard: Classification error:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Get current settings from storage
   */
  async handleGetSettings(sendResponse) {
    const settings = await StorageManager.getAllSettings();
    sendResponse({ success: true, settings });
  }

  /**
   * Update settings in storage
   */
  async handleUpdateSettings(settings = {}, sendResponse) {
    await StorageManager.updateSettings(settings);
    const updatedSettings = await StorageManager.getAllSettings();
    
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!this.isContentScriptActive(tab.id)) {
        continue;
      }

      try {
        await this.sendMessageToContentScript(tab.id, {
          action: 'settingsUpdated',
          settings: updatedSettings
        }, { retries: 2, initialDelay: 200, skipInitialPing: true });
      } catch (error) {
        console.debug('FocusGuard: Unable to deliver settings update to tab', tab.id, error?.message || error);
      }
    }
    
    sendResponse({ success: true, settings: updatedSettings });
  }

  /**
   * Get analytics stats
   */
  async handleGetStats(sendResponse) {
    const stats = await AnalyticsManager.getStats();
    sendResponse({ success: true, stats });
  }

  /**
   * Toggle extension on/off for specific tab
   */
  async handleToggleExtension(tabId, enabled, sendResponse) {
    await StorageManager.setExtensionEnabled(tabId, enabled);
    
    try {
      await this.sendMessageToContentScript(tabId, {
        action: 'toggleFiltering',
        enabled: enabled
      });
    } catch (error) {
      console.warn('FocusGuard: Error notifying content script:', error?.message || error);
    }
    
    sendResponse({ success: true });
  }

  /**
   * Get extension enabled state for specific tab
   */
  async handleGetTabExtensionState(tabId, sendResponse) {
    const enabled = await StorageManager.getExtensionEnabled(tabId);
    sendResponse({ success: true, enabled });
  }

  /**
   * Add domain to block/allow list
   */
  async handleAddDomainToList(domain, listType, sendResponse) {
    if (listType === 'block') {
      await StorageManager.addBlockedDomain(domain);
    } else if (listType === 'allow') {
      await StorageManager.addAllowedDomain(domain);
    }
    
    sendResponse({ success: true });
  }

  /**
   * Log block action for analytics
   */
  async handleLogBlockAction(data, sendResponse) {
    await AnalyticsManager.logBlockAction(
      data.type, 
      data.category, 
      data.domain, 
      data.timestamp,
      data.contentSnippet,
      data.actionType
    );
    sendResponse({ success: true });
  }

  /**
   * Reset daily statistics
   */
  async handleResetStats(sendResponse) {
    await AnalyticsManager.resetDailyStats();
    sendResponse({ success: true });
  }

  /**
   * Manage active content script tracking
   */
  markContentScriptActive(tabId) {
    if (typeof tabId === 'number') {
      this.activeContentScripts.set(tabId, Date.now());
    }
  }

  markContentScriptInactive(tabId) {
    if (typeof tabId === 'number') {
      this.activeContentScripts.delete(tabId);
    }
  }

  isContentScriptActive(tabId) {
    return typeof tabId === 'number' && this.activeContentScripts.has(tabId);
  }

  startContentScriptMonitor() {
    if (typeof setInterval !== 'function') {
      return;
    }

    const CHECK_INTERVAL = 60000;
    const STALE_THRESHOLD = 120000;

    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }

    this.heartbeatIntervalId = setInterval(() => {
      const now = Date.now();

      for (const [tabId, lastSeen] of this.activeContentScripts.entries()) {
        if (now - lastSeen > STALE_THRESHOLD) {
          this.activeContentScripts.delete(tabId);
        }
      }
    }, CHECK_INTERVAL);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async pingContentScript(tabId) {
    if (typeof tabId !== 'number') {
      throw new Error('invalid_tab_id');
    }

    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      this.markContentScriptActive(tabId);
      return true;
    } catch (error) {
      this.markContentScriptInactive(tabId);
      throw error;
    }
  }

  async sendMessageToContentScript(tabId, message, options = {}) {
    if (typeof tabId !== 'number') {
      throw new Error('invalid_tab_id');
    }

    const {
      retries = 3,
      initialDelay = 150,
      skipInitialPing = false
    } = options;

    let attempt = 0;
    let shouldPing = skipInitialPing ? false : !this.isContentScriptActive(tabId);

    while (attempt < retries) {
      try {
        if (shouldPing) {
          await this.pingContentScript(tabId);
          shouldPing = false;
        }

        const response = await chrome.tabs.sendMessage(tabId, message);
        this.markContentScriptActive(tabId);
        return response;
      } catch (error) {
        this.markContentScriptInactive(tabId);

        attempt += 1;
        if (attempt >= retries) {
          throw error;
        }

        const delayDuration = initialDelay * Math.pow(2, attempt - 1);
        await this.delay(delayDuration);
        shouldPing = true;
      }
    }

    return null;
  }

  /**
   * Setup tab listeners for extension lifecycle
   */
  setupTabListeners() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading') {
        this.markContentScriptInactive(tabId);
      }

      if (changeInfo.status === 'complete' && tab.url) {
        // Initialize tab settings if not exists
        StorageManager.getExtensionEnabled(tabId).then(enabled => {
          if (enabled === undefined) {
            StorageManager.setExtensionEnabled(tabId, true);
          }
        });
      }
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.markContentScriptInactive(tabId);
    });
  }
}

// Initialize background service
new BackgroundService();