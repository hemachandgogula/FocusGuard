const DEFAULT_BLOCKED_CATEGORIES = ['Adult Content', 'Entertainment', 'Cruelty'];

const ALL_CATEGORIES = [
  'Adult Content',
  'Entertainment', 
  'Cruelty',
  'Gambling',
  'Violence',
  'Politics',
  'Gaming',
  'Social Media',
  'Shopping',
  'News',
  'Sports'
];

let currentSettings = {};
let customCategories = [];
let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 500;

async function initOptions() {
  await loadSettings();
  await renderCategoryGrid();
  setupEventListeners();
  await loadAnalytics();
}

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    
    if (response.success) {
      currentSettings = response.settings || {};
      
      const blockedCategories = currentSettings.blockedCategories && currentSettings.blockedCategories.length
        ? currentSettings.blockedCategories
        : [...DEFAULT_BLOCKED_CATEGORIES];
      
      if (!currentSettings.blockedCategories || currentSettings.blockedCategories.length === 0) {
        currentSettings.blockedCategories = [...DEFAULT_BLOCKED_CATEGORIES];
        await saveAllSettings();
      }
      
      customCategories = blockedCategories.filter(cat => !ALL_CATEGORIES.includes(cat));
      
      applySettingsToUI();
    }
  } catch (error) {
    console.error('FocusGuard: Error loading settings:', error);
    showToast('Error loading settings', 'error');
  }
}

function applySettingsToUI() {
  const filterMode = currentSettings.filterMode || 'blur';
  const filterInput = document.querySelector(`input[name="filterMode"][value="${filterMode}"]`);
  if (filterInput) {
    filterInput.checked = true;
  }
  
  const sensitivity = currentSettings.sensitivity || 'medium';
  const sensitivityMap = { low: 0, medium: 1, high: 2 };
  const sensitivitySlider = document.getElementById('sensitivitySlider');
  if (sensitivitySlider) {
    sensitivitySlider.value = sensitivityMap[sensitivity] || 1;
  }
  updateSensitivityText(sensitivity);
  
  const extensionToggle = document.getElementById('extensionToggle');
  const isEnabled = currentSettings.extensionEnabled !== false;
  if (extensionToggle) {
    extensionToggle.checked = isEnabled;
  }
  updateStatusMessage(isEnabled);
}

async function renderCategoryGrid() {
  const grid = document.getElementById('categoryGrid');
  const blockedCategories = currentSettings.blockedCategories || [];
  
  grid.innerHTML = '';
  
  const allCats = [...ALL_CATEGORIES, ...customCategories];
  
  allCats.forEach(category => {
    const isBlocked = blockedCategories.includes(category);
    const card = document.createElement('div');
    card.className = `category-card ${isBlocked ? 'selected' : ''}`;
    card.setAttribute('data-category', category);
    
    card.innerHTML = `
      <input type="checkbox" ${isBlocked ? 'checked' : ''}>
      <span>${category}</span>
    `;
    
    card.addEventListener('click', (e) => {
      toggleCategory(category);
    });
    
    grid.appendChild(card);
  });
  
  renderSelectedList();
}

function renderSelectedList() {
  const list = document.getElementById('selectedBlockedList');
  const blockedCategories = currentSettings.blockedCategories || [];
  
  if (blockedCategories.length === 0) {
    list.innerHTML = '<p class="placeholder-text">No categories blocked yet</p>';
    return;
  }
  
  list.innerHTML = blockedCategories.map(cat => `
    <div class="selected-item">
      <span>${cat}</span>
      <button class="remove-btn" data-category="${cat}">×</button>
    </div>
  `).join('');
  
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const category = btn.getAttribute('data-category');
      toggleCategory(category);
    });
  });
}

async function toggleCategory(category) {
  let blockedCategories = currentSettings.blockedCategories || [];
  
  if (blockedCategories.includes(category)) {
    blockedCategories = blockedCategories.filter(c => c !== category);
  } else {
    blockedCategories.push(category);
  }
  
  currentSettings.blockedCategories = blockedCategories;
  await renderCategoryGrid();
  scheduleAutoSave();
}

async function addCustomCategory() {
  const input = document.getElementById('customCategoryInput');
  const category = input.value.trim();
  
  if (!category) {
    showToast('Please enter a category name', 'error');
    return;
  }
  
  const allCats = [...ALL_CATEGORIES, ...customCategories];
  if (allCats.includes(category)) {
    showToast('Category already exists', 'error');
    return;
  }
  
  customCategories.push(category);
  
  let blockedCategories = currentSettings.blockedCategories || [];
  blockedCategories.push(category);
  currentSettings.blockedCategories = blockedCategories;
  
  input.value = '';
  
  await renderCategoryGrid();
  scheduleAutoSave();
  showToast(`Added "${category}" to blocked categories`, 'success');
}

async function resetDefaults() {
  if (!confirm('Reset to default blocked categories? This will remove all your custom selections.')) {
    return;
  }
  
  currentSettings.blockedCategories = [...DEFAULT_BLOCKED_CATEGORIES];
  customCategories = [];
  
  await renderCategoryGrid();
  scheduleAutoSave();
  showToast('Reset to defaults', 'success');
}

async function saveSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: currentSettings
    });
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'unable_to_save');
    }
    
    if (response.settings) {
      currentSettings = response.settings;
    }

    return response;
  } catch (error) {
    console.error('FocusGuard: Error saving settings:', error);
    showToast('Error saving settings', 'error');
    throw error;
  }
}

async function saveAllSettings() {
  const response = await saveSettings();
  applyFiltersToAllTabs();
  return response;
}

async function loadAnalytics() {
  try {
    const counts = await AnalyticsManager.getTodayBlockCounts() || {};
    const text = counts.text ?? 0;
    const images = counts.images ?? 0;
    const videos = counts.videos ?? 0;
    const total = counts.total ?? (text + images + videos);
    
    document.getElementById('textBlocked').textContent = text;
    document.getElementById('imageBlocked').textContent = images;
    document.getElementById('videoBlocked').textContent = videos;
    document.getElementById('totalBlocked').textContent = total;
    
    const topBlocked = await AnalyticsManager.getTopBlockedDomains(5);
    renderTopBlockedDomains(topBlocked);
  } catch (error) {
    console.error('FocusGuard: Error loading analytics:', error);
    const list = document.getElementById('topBlockedList');
    if (list) {
      list.innerHTML = '<div style="color: #94A3B8; font-size: 13px;">Unable to load analytics</div>';
    }
  }
}

function renderTopBlockedDomains(domains = []) {
  const list = document.getElementById('topBlockedList');
  
  if (!list) {
    console.error('FocusGuard: topBlockedList element not found');
    return;
  }
  
  list.innerHTML = '';
  const domainList = Array.isArray(domains) ? domains : [];
  
  if (!domainList.length) {
    list.innerHTML = '<div style="color: #94A3B8; font-size: 13px;">No blocks yet today</div>';
    return;
  }
  
  domainList.forEach(({ domain, count }) => {
    const sanitizedDomain = typeof domain === 'string' ? domain.trim() : '';
    const invalidDomain = !sanitizedDomain || sanitizedDomain.toLowerCase() === 'undefined' || sanitizedDomain.toLowerCase() === 'null';
    const safeDomain = invalidDomain ? 'Unknown' : sanitizedDomain;
    const numericCount = Number(count);
    const safeCount = Number.isFinite(numericCount) ? numericCount : 0;
    const item = document.createElement('div');
    item.className = 'top-blocked-list-item';
    const domainEl = document.createElement('span');
    domainEl.className = 'category';
    domainEl.textContent = safeDomain;
    const countEl = document.createElement('span');
    countEl.className = 'count';
    countEl.textContent = String(safeCount);
    item.append(domainEl, countEl);
    list.appendChild(item);
  });
}

async function resetStats() {
  if (!confirm('Reset today\'s statistics?')) {
    return;
  }
  
  try {
    await chrome.runtime.sendMessage({ action: 'resetStats' });
    await loadAnalytics();
    showToast('Statistics reset', 'success');
  } catch (error) {
    console.error('FocusGuard: Error resetting stats:', error);
    showToast('Error resetting statistics', 'error');
  }
}

function updateSensitivityText(level) {
  const text = document.getElementById('sensitivityText');
  const descriptions = {
    low: 'Low - Blocks less content (50% confidence)',
    medium: 'Medium - Balances accuracy & speed (70% confidence)',
    high: 'High - More aggressive blocking (90% confidence)'
  };
  text.innerHTML = `Current: <strong>${level.charAt(0).toUpperCase() + level.slice(1)}</strong> - ${descriptions[level]}`;
}

function updateStatusMessage(isEnabled) {
  const statusMessage = document.getElementById('statusMessage');
  if (!statusMessage) {
    return;
  }

  if (isEnabled) {
    statusMessage.textContent = '✅ Active on all websites';
    statusMessage.style.color = '#10B981';
  } else {
    statusMessage.textContent = '⛔ Disabled';
    statusMessage.style.color = '#EF4444';
  }
}

function applyFiltersToAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          settings: currentSettings
        }).catch(() => {});
      }
    });
  });
}

function scheduleAutoSave() {
  const status = document.getElementById('saveStatus');
  if (!status) {
    return;
  }

  clearTimeout(saveTimeout);
  status.textContent = '💾 Saving...';

  saveTimeout = setTimeout(async () => {
    try {
      await saveAllSettings();
      status.textContent = '✅ Saved';
      showSaveNotification('✅ Preferences saved successfully');
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    } catch (error) {
      status.textContent = '❌ Save failed';
      showSaveNotification('❌ Failed to save preferences', 'error');
    }
  }, SAVE_DEBOUNCE_MS);
}

async function handleManualSave() {
  const status = document.getElementById('saveStatus');
  clearTimeout(saveTimeout);
  if (status) {
    status.textContent = '💾 Saving...';
  }

  try {
    await saveAllSettings();
    if (status) {
      status.textContent = '✅ Saved';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    }
    showSaveNotification('✅ All preferences saved successfully');
  } catch (error) {
    if (status) {
      status.textContent = '❌ Save failed';
    }
    showSaveNotification('❌ Failed to save preferences', 'error');
  }
}

function showSaveNotification(message, type = 'success') {
  const notification = document.getElementById('saveNotification');
  if (!notification) {
    return;
  }

  notification.textContent = message;
  notification.className = `save-notification save-${type} show`;

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function setupEventListeners() {
  document.getElementById('extensionToggle')?.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    currentSettings.extensionEnabled = enabled;
    updateStatusMessage(enabled);
    scheduleAutoSave();
    showToast(enabled ? 'Extension enabled' : 'Extension disabled', 'info');
  });
  
  document.querySelectorAll('input[name="filterMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentSettings.filterMode = e.target.value;
      scheduleAutoSave();
      showToast(`Filter mode changed to ${e.target.value}`, 'success');
    });
  });
  
  document.getElementById('sensitivitySlider')?.addEventListener('change', (e) => {
    const levels = ['low', 'medium', 'high'];
    const level = levels[parseInt(e.target.value, 10)] || 'medium';
    currentSettings.sensitivity = level;
    updateSensitivityText(level);
    scheduleAutoSave();
    showToast(`Sensitivity set to ${level}`, 'success');
  });
  
  document.getElementById('addCustomCategoryBtn')?.addEventListener('click', addCustomCategory);
  
  document.getElementById('customCategoryInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomCategory();
    }
  });
  
  document.getElementById('resetDefaultsBtn')?.addEventListener('click', resetDefaults);
  
  document.getElementById('resetStatsBtn')?.addEventListener('click', resetStats);
  
  document.getElementById('saveButton')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleManualSave();
  });
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

document.addEventListener('change', (event) => {
  if (!event.isTrusted || event.target?.id === 'saveButton') {
    return;
  }
  scheduleAutoSave();
});

document.addEventListener('DOMContentLoaded', initOptions);
