/**
 * Storage Manager for FocusGuard
 * Wrapper for chrome.storage.sync and chrome.storage.local
 */

class StorageManager {
  static KEYS = {
    ALLOWED_CATEGORIES: 'allowedCategories',
    BLOCKED_CATEGORIES: 'blockedCategories',
    MODE: 'mode', // 'strict' or 'balanced'
    FILTER_MODE: 'filterMode', // 'blur' or 'block'
    SENSITIVITY: 'sensitivity', // 'low', 'medium', 'high'
    EXTENSION_ENABLED: 'extensionEnabled',
    BLOCKED_DOMAINS: 'blockedDomains',
    ALLOWED_DOMAINS: 'allowedDomains',
    TAB_SETTINGS: 'tabSettings_' // prefix for tab-specific settings
  };

  static DEFAULT_SETTINGS = {
    [StorageManager.KEYS.ALLOWED_CATEGORIES]: [],
    [StorageManager.KEYS.BLOCKED_CATEGORIES]: [],
    [StorageManager.KEYS.MODE]: 'balanced',
    [StorageManager.KEYS.FILTER_MODE]: 'blur',
    [StorageManager.KEYS.SENSITIVITY]: 'medium',
    [StorageManager.KEYS.BLOCKED_DOMAINS]: [],
    [StorageManager.KEYS.ALLOWED_DOMAINS]: []
  };

  /**
   * Get categories from storage
   * @param {string} type - 'allow' or 'block'
   * @returns {Promise<string[]>} List of categories
   */
  static async getCategories(type) {
    const key = type === 'allow' ? StorageManager.KEYS.ALLOWED_CATEGORIES : StorageManager.KEYS.BLOCKED_CATEGORIES;
    const result = await chrome.storage.sync.get(key);
    return result[key] || StorageManager.DEFAULT_SETTINGS[key];
  }

  /**
   * Set categories in storage
   * @param {string} type - 'allow' or 'block'
   * @param {string[]} categories - List of categories
   */
  static async setCategories(type, categories) {
    const key = type === 'allow' ? StorageManager.KEYS.ALLOWED_CATEGORIES : StorageManager.KEYS.BLOCKED_CATEGORIES;
    await chrome.storage.sync.set({ [key]: categories });
  }

  /**
   * Add category to list
   * @param {string} type - 'allow' or 'block'
   * @param {string} category - Category to add
   */
  static async addCategory(type, category) {
    const categories = await StorageManager.getCategories(type);
    if (!categories.includes(category)) {
      categories.push(category);
      await StorageManager.setCategories(type, categories);
    }
  }

  /**
   * Remove category from list
   * @param {string} type - 'allow' or 'block'
   * @param {string} category - Category to remove
   */
  static async removeCategory(type, category) {
    const categories = await StorageManager.getCategories(type);
    const index = categories.indexOf(category);
    if (index > -1) {
      categories.splice(index, 1);
      await StorageManager.setCategories(type, categories);
    }
  }

  /**
   * Get filtering mode ('strict' or 'balanced')
   * @returns {Promise<string>} Filtering mode
   */
  static async getMode() {
    const result = await chrome.storage.sync.get(StorageManager.KEYS.MODE);
    return result[StorageManager.KEYS.MODE] || StorageManager.DEFAULT_SETTINGS.MODE;
  }

  /**
   * Set filtering mode
   * @param {string} mode - 'strict' or 'balanced'
   */
  static async setMode(mode) {
    await chrome.storage.sync.set({ [StorageManager.KEYS.MODE]: mode });
  }

  /**
   * Get filter mode ('blur' or 'block')
   * @returns {Promise<string>} Filter mode
   */
  static async getFilterMode() {
    const result = await chrome.storage.sync.get(StorageManager.KEYS.FILTER_MODE);
    return result[StorageManager.KEYS.FILTER_MODE] || StorageManager.DEFAULT_SETTINGS.FILTER_MODE;
  }

  /**
   * Set filter mode
   * @param {string} mode - 'blur' or 'block'
   */
  static async setFilterMode(mode) {
    await chrome.storage.sync.set({ [StorageManager.KEYS.FILTER_MODE]: mode });
  }

  /**
   * Get sensitivity level
   * @returns {Promise<string>} Sensitivity level ('low', 'medium', 'high')
   */
  static async getSensitivity() {
    const result = await chrome.storage.sync.get(StorageManager.KEYS.SENSITIVITY);
    return result[StorageManager.KEYS.SENSITIVITY] || StorageManager.DEFAULT_SETTINGS.SENSITIVITY;
  }

  /**
   * Set sensitivity level
   * @param {string} level - 'low', 'medium', or 'high'
   */
  static async setSensitivity(level) {
    await chrome.storage.sync.set({ [StorageManager.KEYS.SENSITIVITY]: level });
  }

  /**
   * Get sensitivity threshold value
   * @returns {number} Confidence threshold (0.5, 0.7, or 0.9)
   */
  static async getSensitivityThreshold() {
    const level = await StorageManager.getSensitivity();
    switch (level) {
      case 'low': return 0.5;
      case 'medium': return 0.7;
      case 'high': return 0.9;
      default: return 0.7;
    }
  }

  /**
   * Check if extension is enabled for specific tab
   * @param {number} tabId - Tab ID
   * @returns {Promise<boolean>} Extension enabled status
   */
  static async getExtensionEnabled(tabId) {
    const key = StorageManager.KEYS.TAB_SETTINGS + tabId;
    const result = await chrome.storage.local.get(key);
    return result[key] !== false; // Default to true
  }

  /**
   * Set extension enabled status for specific tab
   * @param {number} tabId - Tab ID
   * @param {boolean} enabled - Extension enabled status
   */
  static async setExtensionEnabled(tabId, enabled) {
    const key = StorageManager.KEYS.TAB_SETTINGS + tabId;
    await chrome.storage.local.set({ [key]: enabled });
  }

  /**
   * Get blocked domains
   * @returns {Promise<string[]>} List of blocked domains
   */
  static async getBlockedDomains() {
    const result = await chrome.storage.sync.get(StorageManager.KEYS.BLOCKED_DOMAINS);
    return result[StorageManager.KEYS.BLOCKED_DOMAINS] || StorageManager.DEFAULT_SETTINGS.BLOCKED_DOMAINS;
  }

  /**
   * Add domain to blocked list
   * @param {string} domain - Domain to block
   */
  static async addBlockedDomain(domain) {
    const domains = await StorageManager.getBlockedDomains();
    if (!domains.includes(domain)) {
      domains.push(domain);
      await chrome.storage.sync.set({ [StorageManager.KEYS.BLOCKED_DOMAINS]: domains });
    }
  }

  /**
   * Remove domain from blocked list
   * @param {string} domain - Domain to unblock
   */
  static async removeBlockedDomain(domain) {
    const domains = await StorageManager.getBlockedDomains();
    const index = domains.indexOf(domain);
    if (index > -1) {
      domains.splice(index, 1);
      await chrome.storage.sync.set({ [StorageManager.KEYS.BLOCKED_DOMAINS]: domains });
    }
  }

  /**
   * Get allowed domains
   * @returns {Promise<string[]>} List of allowed domains
   */
  static async getAllowedDomains() {
    const result = await chrome.storage.sync.get(StorageManager.KEYS.ALLOWED_DOMAINS);
    return result[StorageManager.KEYS.ALLOWED_DOMAINS] || StorageManager.DEFAULT_SETTINGS.ALLOWED_DOMAINS;
  }

  /**
   * Add domain to allowed list
   * @param {string} domain - Domain to allow
   */
  static async addAllowedDomain(domain) {
    const domains = await StorageManager.getAllowedDomains();
    if (!domains.includes(domain)) {
      domains.push(domain);
      await chrome.storage.sync.set({ [StorageManager.KEYS.ALLOWED_DOMAINS]: domains });
    }
  }

  /**
   * Remove domain from allowed list
   * @param {string} domain - Domain to remove from allowed list
   */
  static async removeAllowedDomain(domain) {
    const domains = await StorageManager.getAllowedDomains();
    const index = domains.indexOf(domain);
    if (index > -1) {
      domains.splice(index, 1);
      await chrome.storage.sync.set({ [StorageManager.KEYS.ALLOWED_DOMAINS]: domains });
    }
  }

  /**
   * Get all settings
   * @returns {Promise<Object>} All settings object
   */
  static async getAllSettings() {
    const keys = Object.values(StorageManager.KEYS).filter(key => !key.startsWith('tabSettings_'));
    const result = await chrome.storage.sync.get(keys);
    
    // Merge with defaults
    const settings = { ...StorageManager.DEFAULT_SETTINGS };
    Object.assign(settings, result);
    
    return settings;
  }

  /**
   * Update multiple settings
   * @param {Object} settings - Settings to update
   */
  static async updateSettings(settings) {
    await chrome.storage.sync.set(settings);
  }

  /**
   * Reset settings to defaults
   */
  static async resetToDefaults() {
    await chrome.storage.sync.set(StorageManager.DEFAULT_SETTINGS);
  }

  /**
   * Export settings as JSON
   * @returns {Promise<string>} JSON string of settings
   */
  static async exportSettings() {
    const settings = await StorageManager.getAllSettings();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   * @param {string} jsonSettings - JSON string of settings
   */
  static async importSettings(jsonSettings) {
    try {
      const settings = JSON.parse(jsonSettings);
      await StorageManager.updateSettings(settings);
      return true;
    } catch (error) {
      console.error('FocusGuard: Error importing settings:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}