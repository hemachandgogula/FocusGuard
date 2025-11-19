/**
 * Analytics Manager for FocusGuard
 * Tracks blocking statistics and user behavior
 */

class AnalyticsManager {
  static KEYS = {
    BLOCKED_TEXTS: 'blockedTexts',
    BLOCKED_IMAGES: 'blockedImages',
    BLOCKED_VIDEOS: 'blockedVideos',
    BLOCKED_DOMAINS: 'blockedDomains',
    ACTION_LOG: 'actionLog',
    SESSION_STATS: 'sessionStats',
    HISTORICAL_DATA: 'historicalData',
    DETAILED_LOGS: 'detailedLogs'
  };

  static MAX_LOG_ENTRIES = 100;
  static MAX_DETAILED_LOG_ENTRIES = 500;

  /**
   * Log a block action with detailed information
   * @param {string} type - Type of content ('text', 'image', 'video')
   * @param {string} category - Content category
   * @param {string} domain - Domain where blocked
   * @param {number} timestamp - Timestamp of action
   * @param {string} contentSnippet - Extracted text or alt text (first 100 chars)
   * @param {string} actionType - Action taken ('blur' or 'block')
   */
  static async logBlockAction(type, category, domain, timestamp, contentSnippet = '', actionType = 'blur') {
    try {
      // Increment block counts
      await AnalyticsManager.incrementBlockCount(type);
      
      // Update domain counts
      await AnalyticsManager.updateDomainCount(domain);
      
      // Add to action log
      await AnalyticsManager.addToActionLog({
        action: 'block',
        type,
        category,
        domain,
        timestamp: timestamp || Date.now()
      });
      
      // Add to detailed logs
      await AnalyticsManager.addToDetailedLogs({
        type,
        category,
        domain,
        timestamp: timestamp || Date.now(),
        contentSnippet: contentSnippet.substring(0, 100),
        actionType
      });
      
      // Update session stats
      await AnalyticsManager.updateSessionStats();
      
    } catch (error) {
      console.error('FocusGuard: Error logging block action:', error);
    }
  }

  /**
   * Increment block count for content type
   * @param {string} type - Type of content ('text', 'image', 'video')
   */
  static async incrementBlockCount(type) {
    const key = type === 'text' ? AnalyticsManager.KEYS.BLOCKED_TEXTS :
               type === 'image' ? AnalyticsManager.KEYS.BLOCKED_IMAGES :
               AnalyticsManager.KEYS.BLOCKED_VIDEOS;
    
    const result = await chrome.storage.local.get(key);
    const current = result[key] || { count: 0, lastUpdated: Date.now() };
    
    current.count++;
    current.lastUpdated = Date.now();
    
    await chrome.storage.local.set({ [key]: current });
  }

  /**
   * Update domain block count
   * @param {string} domain - Domain name
   */
  static async updateDomainCount(domain) {
    const result = await chrome.storage.local.get(AnalyticsManager.KEYS.BLOCKED_DOMAINS);
    const domains = result[AnalyticsManager.KEYS.BLOCKED_DOMAINS] || {};
    
    domains[domain] = (domains[domain] || 0) + 1;
    
    await chrome.storage.local.set({ [AnalyticsManager.KEYS.BLOCKED_DOMAINS]: domains });
  }

  /**
   * Add entry to action log
   * @param {Object} entry - Log entry object
   */
  static async addToActionLog(entry) {
    const result = await chrome.storage.local.get(AnalyticsManager.KEYS.ACTION_LOG);
    let log = result[AnalyticsManager.KEYS.ACTION_LOG] || [];
    
    log.push(entry);
    
    // Keep only recent entries
    if (log.length > AnalyticsManager.MAX_LOG_ENTRIES) {
      log = log.slice(-AnalyticsManager.MAX_LOG_ENTRIES);
    }
    
    await chrome.storage.local.set({ [AnalyticsManager.KEYS.ACTION_LOG]: log });
  }

  /**
   * Add entry to detailed logs
   * @param {Object} entry - Detailed log entry object
   */
  static async addToDetailedLogs(entry) {
    const result = await chrome.storage.local.get(AnalyticsManager.KEYS.DETAILED_LOGS);
    let logs = result[AnalyticsManager.KEYS.DETAILED_LOGS] || [];
    
    logs.push(entry);
    
    // Keep only recent entries
    if (logs.length > AnalyticsManager.MAX_DETAILED_LOG_ENTRIES) {
      logs = logs.slice(-AnalyticsManager.MAX_DETAILED_LOG_ENTRIES);
    }
    
    await chrome.storage.local.set({ [AnalyticsManager.KEYS.DETAILED_LOGS]: logs });
  }

  /**
   * Update session statistics
   */
  static async updateSessionStats() {
    const result = await chrome.storage.local.get(AnalyticsManager.KEYS.SESSION_STATS);
    let session = result[AnalyticsManager.KEYS.SESSION_STATS];
    
    if (!session || !session.startTime) {
      // Start new session
      session = {
        startTime: Date.now(),
        endTime: null,
        totalBlocked: 1
      };
    } else {
      // Update existing session
      session.totalBlocked++;
      session.endTime = Date.now();
    }
    
    await chrome.storage.local.set({ [AnalyticsManager.KEYS.SESSION_STATS]: session });
  }

  /**
   * Get comprehensive statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getStats() {
    const keys = Object.values(AnalyticsManager.KEYS);
    const result = await chrome.storage.local.get(keys);
    
    const stats = {
      blockedTexts: result[AnalyticsManager.KEYS.BLOCKED_TEXTS] || { count: 0, lastUpdated: Date.now() },
      blockedImages: result[AnalyticsManager.KEYS.BLOCKED_IMAGES] || { count: 0, lastUpdated: Date.now() },
      blockedVideos: result[AnalyticsManager.KEYS.BLOCKED_VIDEOS] || { count: 0, lastUpdated: Date.now() },
      blockedDomains: result[AnalyticsManager.KEYS.BLOCKED_DOMAINS] || {},
      actionLog: result[AnalyticsManager.KEYS.ACTION_LOG] || [],
      sessionStats: result[AnalyticsManager.KEYS.SESSION_STATS] || {
        startTime: Date.now(),
        endTime: null,
        totalBlocked: 0
      },
      historicalData: result[AnalyticsManager.KEYS.HISTORICAL_DATA] || {},
      detailedLogs: result[AnalyticsManager.KEYS.DETAILED_LOGS] || []
    };
    
    // Calculate total blocks today
    stats.totalBlocksToday = stats.blockedTexts.count + 
                            stats.blockedImages.count + 
                            stats.blockedVideos.count;
    
    return stats;
  }

  /**
   * Get top blocked domains
   * @param {number} limit - Maximum number of domains to return
   * @returns {Promise<Array>} Array of {domain, count} objects
   */
  static async getTopBlockedDomains(limit = 10) {
    const stats = await AnalyticsManager.getStats();
    const domains = stats.blockedDomains;
    
    // Convert to array and sort by count
    const sortedDomains = Object.entries(domains)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sortedDomains;
  }

  /**
   * Get today's block count by type
   * @returns {Promise<Object>} Block counts by type
   */
  static async getTodayBlockCounts() {
    const stats = await AnalyticsManager.getStats();
    return {
      text: stats.blockedTexts.count,
      images: stats.blockedImages.count,
      videos: stats.blockedVideos.count,
      total: stats.totalBlocksToday
    };
  }

  /**
   * Reset daily statistics
   */
  static async resetDailyStats() {
    try {
      // Save current stats to historical data before reset
      const currentStats = await AnalyticsManager.getStats();
      await AnalyticsManager.saveToHistoricalData(currentStats);
      
      // Reset daily counters
      const resetKeys = [
        AnalyticsManager.KEYS.BLOCKED_TEXTS,
        AnalyticsManager.KEYS.BLOCKED_IMAGES,
        AnalyticsManager.KEYS.BLOCKED_VIDEOS,
        AnalyticsManager.KEYS.BLOCKED_DOMAINS,
        AnalyticsManager.KEYS.ACTION_LOG,
        AnalyticsManager.KEYS.DETAILED_LOGS
      ];
      
      const resetData = {};
      resetKeys.forEach(key => {
        if (key === AnalyticsManager.KEYS.BLOCKED_DOMAINS) {
          resetData[key] = {};
        } else if (key === AnalyticsManager.KEYS.ACTION_LOG || 
                   key === AnalyticsManager.KEYS.DETAILED_LOGS) {
          resetData[key] = [];
        } else {
          resetData[key] = { count: 0, lastUpdated: Date.now() };
        }
      });
      
      await chrome.storage.local.set(resetData);
      
      console.log('FocusGuard: Daily statistics reset successfully');
    } catch (error) {
      console.error('FocusGuard: Error resetting daily stats:', error);
    }
  }

  /**
   * Save current stats to historical data
   * @param {Object} stats - Current statistics
   */
  static async saveToHistoricalData(stats) {
    const result = await chrome.storage.local.get(AnalyticsManager.KEYS.HISTORICAL_DATA);
    const historical = result[AnalyticsManager.KEYS.HISTORICAL_DATA] || {};
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    historical[today] = {
      blockedTexts: stats.blockedTexts.count,
      blockedImages: stats.blockedImages.count,
      blockedVideos: stats.blockedVideos.count,
      blockedDomains: stats.blockedDomains,
      totalBlocks: stats.totalBlocksToday,
      sessionStats: stats.sessionStats,
      detailedLogsCount: stats.detailedLogs.length
    };
    
    // Keep only last 30 days of historical data
    const dates = Object.keys(historical).sort().reverse();
    if (dates.length > 30) {
      const datesToKeep = dates.slice(0, 30);
      const newHistorical = {};
      datesToKeep.forEach(date => {
        newHistorical[date] = historical[date];
      });
      await chrome.storage.local.set({ [AnalyticsManager.KEYS.HISTORICAL_DATA]: newHistorical });
    } else {
      await chrome.storage.local.set({ [AnalyticsManager.KEYS.HISTORICAL_DATA]: historical });
    }
  }

  /**
   * Get historical data for date range
   * @param {number} days - Number of days to retrieve
   * @returns {Promise<Object>} Historical data
   */
  static async getHistoricalData(days = 7) {
    const result = await chrome.storage.local.get(AnalyticsManager.KEYS.HISTORICAL_DATA);
    const historical = result[AnalyticsManager.KEYS.HISTORICAL_DATA] || {};
    
    const dates = Object.keys(historical)
      .sort()
      .slice(-days);
    
    const filtered = {};
    dates.forEach(date => {
      filtered[date] = historical[date];
    });
    
    return filtered;
  }

  /**
   * Get detailed logs with optional filtering
   * @param {Object} filters - Filter options
   * @param {string} filters.category - Filter by category
   * @param {string} filters.type - Filter by content type ('text', 'image', 'video')
   * @param {string} filters.actionType - Filter by action type ('blur', 'block')
   * @param {number} filters.timeRange - Filter by time range in hours (e.g., 24 for last 24 hours)
   * @param {number} limit - Maximum number of entries to return
   * @returns {Promise<Array>} Filtered detailed logs
   */
  static async getDetailedLogs(filters = {}, limit = 100) {
    const stats = await AnalyticsManager.getStats();
    let logs = [...stats.detailedLogs];
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply filters
    if (filters.category) {
      logs = logs.filter(log => log.category === filters.category);
    }
    
    if (filters.type) {
      logs = logs.filter(log => log.type === filters.type);
    }
    
    if (filters.actionType) {
      logs = logs.filter(log => log.actionType === filters.actionType);
    }
    
    if (filters.timeRange) {
      const cutoffTime = Date.now() - (filters.timeRange * 60 * 60 * 1000);
      logs = logs.filter(log => log.timestamp >= cutoffTime);
    }
    
    // Apply limit
    if (limit > 0) {
      logs = logs.slice(0, limit);
    }
    
    return logs;
  }

  /**
   * Get category breakdown from detailed logs
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Category counts
   */
  static async getCategoryBreakdown(filters = {}) {
    const logs = await AnalyticsManager.getDetailedLogs(filters);
    const breakdown = {};
    
    logs.forEach(log => {
      const category = log.category || 'Unknown';
      breakdown[category] = (breakdown[category] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Clear detailed logs
   */
  static async clearDetailedLogs() {
    await chrome.storage.local.set({ [AnalyticsManager.KEYS.DETAILED_LOGS]: [] });
  }

  /**
   * Export analytics data as JSON
   * @returns {Promise<string>} JSON string of analytics data
   */
  static async exportAnalytics() {
    const stats = await AnalyticsManager.getStats();
    const historical = await AnalyticsManager.getHistoricalData(30);
    
    const exportData = {
      currentStats: stats,
      historicalData: historical,
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all analytics data
   */
  static async clearAllData() {
    const keys = Object.values(AnalyticsManager.KEYS);
    const clearData = {};
    
    keys.forEach(key => {
      if (key === AnalyticsManager.KEYS.BLOCKED_DOMAINS) {
        clearData[key] = {};
      } else if (key === AnalyticsManager.KEYS.ACTION_LOG || 
                 key === AnalyticsManager.KEYS.HISTORICAL_DATA || 
                 key === AnalyticsManager.KEYS.DETAILED_LOGS) {
        clearData[key] = [];
      } else if (key === AnalyticsManager.KEYS.SESSION_STATS) {
        clearData[key] = {
          startTime: Date.now(),
          endTime: null,
          totalBlocked: 0
        };
      } else {
        clearData[key] = { count: 0, lastUpdated: Date.now() };
      }
    });
    
    await chrome.storage.local.set(clearData);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsManager;
}