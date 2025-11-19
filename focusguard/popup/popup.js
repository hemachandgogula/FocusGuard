/**
 * Modern Popup Logic for FocusGuard
 */

let currentTab = null;
let currentSettings = {};

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

async function initializePopup() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0] || null;
    updatePageUrl(currentTab);

    await loadSettings();
    await loadStats();
    setupEventListeners();
  } catch (error) {
    console.error('FocusGuard: Failed to initialize popup', error);
  }
}

function updatePageUrl(tab) {
  const pageUrlElement = document.getElementById('pageUrl');
  if (!pageUrlElement) {
    return;
  }

  try {
    const hostname = tab?.url ? new URL(tab.url).hostname : 'Unavailable';
    pageUrlElement.textContent = hostname || 'Unavailable';
  } catch (error) {
    pageUrlElement.textContent = 'Unavailable';
  }
}

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response?.success) {
      currentSettings = response.settings || {};
      
      // Get extension enabled state (consider both global and tab-specific)
      let isEnabled = true; // Default to enabled
      if (currentTab?.id) {
        // Check both global and tab-specific state
        let globalEnabled = true;
        let tabEnabled = true;
        
        if (typeof StorageManager !== 'undefined' && StorageManager.getExtensionEnabledGlobal && StorageManager.getExtensionEnabled) {
          globalEnabled = await StorageManager.getExtensionEnabledGlobal();
          tabEnabled = await StorageManager.getExtensionEnabled(currentTab.id);
        } else {
          // Fallback: ask background service for states
          const globalResponse = await chrome.runtime.sendMessage({ 
            action: 'getSettings' 
          });
          if (globalResponse?.success) {
            globalEnabled = globalResponse.settings.extensionEnabled !== false;
          }
          
          const tabResponse = await chrome.runtime.sendMessage({ 
            action: 'getTabExtensionState', 
            tabId: currentTab.id 
          });
          if (tabResponse?.success) {
            tabEnabled = tabResponse.enabled;
          }
        }
        
        // Extension is only enabled if both global and tab-specific states are enabled
        isEnabled = globalEnabled && tabEnabled;
      } else {
        // No tab available, just check global state
        if (typeof StorageManager !== 'undefined' && StorageManager.getExtensionEnabledGlobal) {
          isEnabled = await StorageManager.getExtensionEnabledGlobal();
        } else if (currentSettings.extensionEnabled !== undefined) {
          isEnabled = currentSettings.extensionEnabled !== false;
        }
      }
      
      updateStatusToggle(isEnabled);
      updateModeButtons(currentSettings.filterMode || 'blur');
    }
  } catch (error) {
    console.error('FocusGuard: Unable to load settings', error);
  }
}

async function loadStats() {
  try {
    let counts = {};

    if (typeof AnalyticsManager !== 'undefined' && AnalyticsManager.getTodayBlockCounts) {
      counts = await AnalyticsManager.getTodayBlockCounts() || {};
    } else {
      const response = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (response?.success && response.stats) {
        counts = {
          text: response.stats.blockedTexts?.count ?? 0,
          images: response.stats.blockedImages?.count ?? 0,
          videos: response.stats.blockedVideos?.count ?? 0,
          total: response.stats.totalBlocksToday ?? 0
        };
      }
    }

    const total = counts.total ?? ((counts.text || 0) + (counts.images || 0) + (counts.videos || 0));
    document.getElementById('totalBlockedCount').textContent = total || 0;
    document.getElementById('textBlockedCount').textContent = counts.text || 0;
    document.getElementById('imageBlockedCount').textContent = counts.images || 0;
  } catch (error) {
    console.error('FocusGuard: Unable to load stats', error);
  }
}

function setupEventListeners() {
  document.getElementById('extensionToggle')?.addEventListener('change', (event) => {
    toggleExtension(event.target.checked);
  });

  document.getElementById('blurModeBtn')?.addEventListener('click', () => {
    setFilterMode('blur');
  });

  document.getElementById('blockModeBtn')?.addEventListener('click', () => {
    setFilterMode('block');
  });

  document.getElementById('blockDomainBtn')?.addEventListener('click', () => {
    handleDomainAction('block');
  });

  document.getElementById('allowDomainBtn')?.addEventListener('click', () => {
    handleDomainAction('allow');
  });

  document.getElementById('settingsBtn')?.addEventListener('click', openSettingsPage);
  document.getElementById('openSettingsLink')?.addEventListener('click', (event) => {
    event.preventDefault();
    openSettingsPage();
  });
}

function updateStatusToggle(isEnabled) {
  const statusText = document.getElementById('statusText');
  const toggle = document.getElementById('extensionToggle');

  if (toggle) {
    toggle.checked = isEnabled;
  }

  if (statusText) {
    statusText.textContent = isEnabled ? '● Active' : '● Paused';
    statusText.classList.toggle('inactive', !isEnabled);
  }
}

function updateModeButtons(mode) {
  const blurButton = document.getElementById('blurModeBtn');
  const blockButton = document.getElementById('blockModeBtn');

  if (blurButton) {
    blurButton.classList.toggle('active', mode === 'blur');
  }

  if (blockButton) {
    blockButton.classList.toggle('active', mode === 'block');
  }
}

async function toggleExtension(enabled) {
  if (!currentTab?.id) {
    console.warn('FocusGuard: No current tab available for toggle');
    return;
  }

  try {
    // Check global state first - if global is disabled, don't allow tab-specific enable
    if (enabled) {
      let globalEnabled = true;
      if (typeof StorageManager !== 'undefined' && StorageManager.getExtensionEnabledGlobal) {
        globalEnabled = await StorageManager.getExtensionEnabledGlobal();
      } else {
        const globalResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
        if (globalResponse?.success) {
          globalEnabled = globalResponse.settings.extensionEnabled !== false;
        }
      }
      
      if (!globalEnabled) {
        alert('❌ Extension is disabled globally. Please enable it in settings first.');
        updateStatusToggle(false);
        return;
      }
    }

    const response = await chrome.runtime.sendMessage({
      action: 'toggleExtension',
      tabId: currentTab.id,
      enabled
    });

    if (!response?.success) {
      throw new Error(response?.error || 'toggle_failed');
    }

    // Update the UI immediately for better UX
    updateStatusToggle(enabled);
    
    // Show brief feedback
    const statusText = document.getElementById('statusText');
    if (statusText) {
      const originalText = statusText.textContent;
      statusText.textContent = enabled ? '✓ Activated' : '✓ Paused';
      setTimeout(() => {
        statusText.textContent = originalText;
      }, 1000);
    }
  } catch (error) {
    console.error('FocusGuard: Failed to toggle extension', error);
    // Revert the toggle state on error
    updateStatusToggle(!enabled);
    alert('❌ Unable to update filtering status for this tab.');
  }
}

async function setFilterMode(mode) {
  if (!mode || currentSettings.filterMode === mode) {
    updateModeButtons(mode || currentSettings.filterMode || 'blur');
    return;
  }

  currentSettings.filterMode = mode;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: currentSettings
    });

    if (!response?.success) {
      throw new Error(response?.error || 'update_failed');
    }

    if (response.settings) {
      currentSettings = response.settings;
    }

    updateModeButtons(mode);
  } catch (error) {
    console.error('FocusGuard: Failed to update filter mode', error);
    alert('❌ Unable to update filter mode.');
  }
}

async function handleDomainAction(action) {
  if (!currentTab?.url) {
    alert('❌ Unable to detect the current domain.');
    return;
  }

  const domain = getDomainFromUrl(currentTab.url);
  if (!domain) {
    alert('❌ Unable to detect the current domain.');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'addDomainToList',
      domain,
      listType: action === 'block' ? 'block' : 'allow'
    });

    if (!response?.success) {
      throw new Error(response?.error || 'domain_update_failed');
    }

    const message = action === 'block'
      ? `✅ ${domain} added to block list`
      : `✅ ${domain} added to allow list`;
    alert(message);
  } catch (error) {
    console.error('FocusGuard: Failed to update domain list', error);
    alert('❌ Unable to update domain preferences.');
  }
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return '';
  }
}

function openSettingsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
}
