/**
 * Popup JavaScript for FocusGuard
 * Handles popup UI interactions and background communication
 */

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.settings = {};
    this.stats = {};
    this.actionLog = [];
    
    this.initialize();
  }

  /**
   * Initialize popup
   */
  async initialize() {
    try {
      // Show loading
      this.showLoading(true);
      
      // Get current tab
      await this.getCurrentTab();
      
      // Load settings and stats
      await this.loadSettings();
      await this.loadStats();
      
      // Setup UI
      this.setupEventListeners();
      this.updateUI();
      
      // Hide loading
      this.showLoading(false);
      
      console.log('FocusGuard: Popup initialized');
    } catch (error) {
      console.error('FocusGuard: Popup initialization error:', error);
      this.showToast('Error loading popup', 'error');
      this.showLoading(false);
    }
  }

  /**
   * Get current active tab
   */
  async getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
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
      }
    } catch (error) {
      console.error('FocusGuard: Error loading settings:', error);
    }
  }

  /**
   * Load statistics from background
   */
  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getStats'
      });
      
      if (response.success) {
        this.stats = response.stats;
        this.actionLog = response.stats.actionLog || [];
      }
    } catch (error) {
      console.error('FocusGuard: Error loading stats:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Master toggle
    const masterToggle = document.getElementById('masterToggle');
    masterToggle.addEventListener('change', (e) => {
      this.toggleExtension(e.target.checked);
    });

    // Mode buttons removed - using block-list-only model

    // Filter mode
    document.querySelectorAll('input[name="filterMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.setFilterMode(e.target.value);
      });
    });

    // Quick actions
    document.getElementById('blockDomainBtn').addEventListener('click', () => {
      this.addDomainToList('block');
    });

    document.getElementById('allowDomainBtn').addEventListener('click', () => {
      this.addDomainToList('allow');
    });

    // Footer buttons
    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('openStats').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  /**
   * Update UI with current data
   */
  updateUI() {
    // Update page URL
    if (this.currentTab) {
      const urlText = document.querySelector('.url-text');
      urlText.textContent = this.currentTab.url;
      urlText.title = this.currentTab.url;
    }

    // Update status indicator
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const masterToggle = document.getElementById('masterToggle');
    
    const isEnabled = this.settings.extensionEnabled !== false;
    masterToggle.checked = isEnabled;
    
    if (isEnabled) {
      statusDot.classList.remove('inactive');
      statusText.textContent = 'Active';
    } else {
      statusDot.classList.add('inactive');
      statusText.textContent = 'Inactive';
    }

    // Mode display removed - using block-list-only model

    // Update filter mode
    const filterMode = this.settings.filterMode || 'blur';
    document.querySelector(`input[name="filterMode"][value="${filterMode}"]`).checked = true;

    // Update stats
    this.updateStats();

    // Update action log
    this.updateActionLog();
  }

  /**
   * Update statistics display
   */
  updateStats() {
    const totalBlocks = this.stats.totalBlocksToday || 0;
    const textBlocks = this.stats.blockedTexts?.count || 0;
    const imageBlocks = this.stats.blockedImages?.count || 0;
    const videoBlocks = this.stats.blockedVideos?.count || 0;

    document.getElementById('blockCount').textContent = totalBlocks;
    document.getElementById('textBlocks').textContent = textBlocks;
    document.getElementById('imageBlocks').textContent = imageBlocks;
    document.getElementById('videoBlocks').textContent = videoBlocks;
  }

  /**
   * Update action log display
   */
  updateActionLog() {
    const actionLog = document.getElementById('actionLog');
    const recentActions = this.actionLog.slice(-5).reverse();

    if (recentActions.length === 0) {
      actionLog.innerHTML = `
        <div class="log-entry">
          <span class="log-time">Just now</span>
          <span class="log-action">Extension loaded</span>
        </div>
      `;
      return;
    }

    actionLog.innerHTML = recentActions.map(action => {
      const time = this.formatTime(action.timestamp);
      const actionText = this.formatActionText(action);
      
      return `
        <div class="log-entry">
          <span class="log-time">${time}</span>
          <span class="log-action">${actionText}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Format action text for display
   */
  formatActionText(action) {
    switch (action.action) {
      case 'block':
        return `Blocked ${action.type} (${action.category})`;
      case 'domain_blocked':
        return `Added ${action.domain} to block list`;
      case 'domain_allowed':
        return `Added ${action.domain} to allow list`;
      case 'settings_updated':
        return 'Settings updated';
      default:
        return action.action || 'Unknown action';
    }
  }

  /**
   * Toggle extension on/off
   */
  async toggleExtension(enabled) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'toggleExtension',
        tabId: this.currentTab.id,
        enabled: enabled
      });

      if (response.success) {
        this.showToast(
          enabled ? 'Content filtering enabled' : 'Content filtering disabled',
          'success'
        );
        
        // Update status indicator
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (enabled) {
          statusDot.classList.remove('inactive');
          statusText.textContent = 'Active';
        } else {
          statusDot.classList.add('inactive');
          statusText.textContent = 'Inactive';
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('FocusGuard: Error toggling extension:', error);
      this.showToast('Error toggling extension', 'error');
      
      // Revert toggle
      document.getElementById('masterToggle').checked = !enabled;
    }
  }

  // setMode method removed - using block-list-only model

  /**
   * Set filter mode
   */
  async setFilterMode(filterMode) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { filterMode: filterMode }
      });

      if (response.success) {
        this.settings.filterMode = filterMode;
        this.showToast(`Filter mode set to ${filterMode}`, 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('FocusGuard: Error setting filter mode:', error);
      this.showToast('Error updating filter mode', 'error');
    }
  }

  /**
   * Add domain to block/allow list
   */
  async addDomainToList(listType) {
    if (!this.currentTab) {
      this.showToast('No current tab found', 'error');
      return;
    }

    const domain = new URL(this.currentTab.url).hostname;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'addDomainToList',
        domain: domain,
        listType: listType
      });

      if (response.success) {
        const action = listType === 'block' ? 'blocked' : 'allowed';
        this.showToast(`Domain ${action}: ${domain}`, 'success');
        
        // Update settings locally
        if (listType === 'block') {
          if (!this.settings.blockedDomains) this.settings.blockedDomains = [];
          if (!this.settings.blockedDomains.includes(domain)) {
            this.settings.blockedDomains.push(domain);
          }
        } else {
          if (!this.settings.allowedDomains) this.settings.allowedDomains = [];
          if (!this.settings.allowedDomains.includes(domain)) {
            this.settings.allowedDomains.push(domain);
          }
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('FocusGuard: Error adding domain to list:', error);
      this.showToast('Error updating domain list', 'error');
    }
  }

  /**
   * Show/hide loading overlay
   */
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  /**
   * Refresh data
   */
  async refresh() {
    await this.loadSettings();
    await this.loadStats();
    this.updateUI();
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});