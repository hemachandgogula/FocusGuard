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
      currentSettings = response.settings;
      
      const blockedCategories = currentSettings.blockedCategories || DEFAULT_BLOCKED_CATEGORIES;
      if (blockedCategories.length === 0) {
        currentSettings.blockedCategories = DEFAULT_BLOCKED_CATEGORIES;
        await saveSettings();
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
  document.querySelector(`input[name="filterMode"][value="${filterMode}"]`).checked = true;
  
  const sensitivity = currentSettings.sensitivity || 'medium';
  const sensitivityMap = { low: 0, medium: 1, high: 2 };
  document.getElementById('sensitivitySlider').value = sensitivityMap[sensitivity] || 1;
  updateSensitivityText(sensitivity);
  
  const extensionToggle = document.getElementById('extensionToggle');
  extensionToggle.checked = true;
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
  await saveSettings();
  await renderCategoryGrid();
  
  applyFiltersToAllTabs();
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
  
  await saveSettings();
  await renderCategoryGrid();
  showToast(`Added "${category}" to blocked categories`, 'success');
  
  applyFiltersToAllTabs();
}

async function resetDefaults() {
  if (!confirm('Reset to default blocked categories? This will remove all your custom selections.')) {
    return;
  }
  
  currentSettings.blockedCategories = [...DEFAULT_BLOCKED_CATEGORIES];
  customCategories = [];
  
  await saveSettings();
  await renderCategoryGrid();
  showToast('Reset to defaults', 'success');
  
  applyFiltersToAllTabs();
}

async function saveSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: currentSettings
    });
    
    if (response.success) {
      console.log('Settings saved successfully');
    }
  } catch (error) {
    console.error('FocusGuard: Error saving settings:', error);
    showToast('Error saving settings', 'error');
  }
}

async function loadAnalytics() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    
    if (response.success && response.stats) {
      const stats = response.stats;
      const today = stats.today || {};
      
      document.getElementById('textBlocked').textContent = today.text || 0;
      document.getElementById('imageBlocked').textContent = today.image || 0;
      document.getElementById('videoBlocked').textContent = today.video || 0;
      
      const total = (today.text || 0) + (today.image || 0) + (today.video || 0);
      document.getElementById('totalBlocked').textContent = total;
      
      renderTopBlockedCategories(today.categories || {});
    }
  } catch (error) {
    console.error('FocusGuard: Error loading analytics:', error);
  }
}

function renderTopBlockedCategories(categories) {
  const list = document.getElementById('topBlockedList');
  
  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sorted.length === 0) {
    list.innerHTML = '<span class="placeholder-text">No data yet</span>';
    return;
  }
  
  list.innerHTML = sorted.map(([cat, count]) => `
    <div class="top-blocked-item">${cat} (${count})</div>
  `).join('');
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

function setupEventListeners() {
  document.getElementById('extensionToggle')?.addEventListener('change', async (e) => {
    const statusMessage = document.getElementById('statusMessage');
    if (e.target.checked) {
      statusMessage.textContent = '✅ Active on all websites';
      statusMessage.style.color = '#10B981';
    } else {
      statusMessage.textContent = '⛔ Disabled';
      statusMessage.style.color = '#EF4444';
    }
    showToast(e.target.checked ? 'Extension enabled' : 'Extension disabled', 'info');
  });
  
  document.querySelectorAll('input[name="filterMode"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      currentSettings.filterMode = e.target.value;
      await saveSettings();
      showToast(`Filter mode changed to ${e.target.value}`, 'success');
      applyFiltersToAllTabs();
    });
  });
  
  document.getElementById('sensitivitySlider')?.addEventListener('change', async (e) => {
    const levels = ['low', 'medium', 'high'];
    const level = levels[parseInt(e.target.value)];
    currentSettings.sensitivity = level;
    updateSensitivityText(level);
    await saveSettings();
    showToast(`Sensitivity set to ${level}`, 'success');
    applyFiltersToAllTabs();
  });
  
  document.getElementById('addCustomCategoryBtn')?.addEventListener('click', addCustomCategory);
  
  document.getElementById('customCategoryInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomCategory();
    }
  });
  
  document.getElementById('resetDefaultsBtn')?.addEventListener('click', resetDefaults);
  
  document.getElementById('resetStatsBtn')?.addEventListener('click', resetStats);
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', initOptions);
