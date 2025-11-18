/**
 * Background Service Worker for FocusGuard
 * Manages storage, messaging, and coordination between components
 */

importScripts('lib/storage-manager.js');
importScripts('lib/analytics-manager.js');
importScripts('lib/filter-engine.js');
importScripts('lib/model-loader.js');

class BackgroundService {
  constructor() {
    this.initializeAlarms();
    this.setupMessageListeners();
    this.setupTabListeners();
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
        case 'classifyContent':
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
        
        case 'addDomainToList':
          await this.handleAddDomainToList(message.domain, message.listType, sendResponse);
          break;
        
        case 'logBlockAction':
          await this.handleLogBlockAction(message.data, sendResponse);
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
    const { content, type, domain } = message.data;
    
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
  async handleUpdateSettings(settings, sendResponse) {
    await StorageManager.updateSettings(settings);
    
    // Notify all content scripts of settings change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          settings: settings
        });
      } catch (error) {
        // Ignore errors for tabs that don't have content script
      }
    }
    
    sendResponse({ success: true });
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
    
    // Notify content script
    try {
      chrome.tabs.sendMessage(tabId, {
        action: 'toggleFiltering',
        enabled: enabled
      });
    } catch (error) {
      console.error('FocusGuard: Error notifying content script:', error);
    }
    
    sendResponse({ success: true });
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
      data.timestamp
    );
    sendResponse({ success: true });
  }

  /**
   * Setup tab listeners for extension lifecycle
   */
  setupTabListeners() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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
      // Clean up tab-specific data if needed
    });
  }
}

// Initialize background service
new BackgroundService();