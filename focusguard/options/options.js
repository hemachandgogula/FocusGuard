/**
 * Options Page JavaScript for FocusGuard
 * Handles settings page interactions and data management
 */

const PREDEFINED_CATEGORIES = {
  allow: [
    'Education',
    'Science',
    'Technology',
    'Philosophy',
    'Health',
    'Business',
    'Finance',
    'Sports',
    'Arts',
    'History',
    'Nature',
    'Other'
  ],
  block: [
    'Adult Content',
    'Entertainment',
    'Cruelty',
    'Gambling',
    'Violence',
    'Politics',
    'Gaming',
    'Social Media',
    'Shopping',
    'Other'
  ]
};

const DEFAULT_ALLOWED_CATEGORIES = ['Education', 'Science', 'Technology', 'Philosophy'];
const DEFAULT_BLOCKED_CATEGORIES = ['Adult Content', 'Entertainment', 'Cruelty'];

class OptionsManager {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.availableCategories = [];
    this.modalType = null;
    
    this.initialize();
  }

  /**
   * Initialize options page
   */
  async initialize() {
    try {
      // Load data
      await this.loadSettings();
      await this.loadStats();
      await this.loadAvailableCategories();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update UI
      this.updateUI();
      
      console.log('FocusGuard: Options page initialized');
    } catch (error) {
      console.error('FocusGuard: Options initialization error:', error);
      this.showToast('Error loading options', 'error');
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
        await this.initializeDefaultCategories();
      }
    } catch (error) {
      console.error('FocusGuard: Error loading settings:', error);
    }
  }

  /**
   * Initialize default categories on first launch
   */
  async initializeDefaultCategories() {
    const allowedCategories = this.settings.allowedCategories || [];
    const blockedCategories = this.settings.blockedCategories || [];
    
    if (allowedCategories.length === 0) {
      this.settings.allowedCategories = DEFAULT_ALLOWED_CATEGORIES;
    }
    
    if (blockedCategories.length === 0) {
      this.settings.blockedCategories = DEFAULT_BLOCKED_CATEGORIES;
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
      }
    } catch (error) {
      console.error('FocusGuard: Error loading stats:', error);
    }
  }

  /**
   * Load available categories
   */
  async loadAvailableCategories() {
    // Default categories
    this.availableCategories = [
      'Education', 'Technology', 'Science', 'Health', 'Business',
      'News', 'Sports', 'Entertainment', 'Gaming', 'Adult',
      'Politics', 'Agriculture'
    ];
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // Export/Import buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportSettings();
      });
    }

    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        this.showImportModal();
      });
    }

    // Category management - Use event delegation
    const addAllowedBtn = document.getElementById('addAllowedBtn');
    if (addAllowedBtn) {
      addAllowedBtn.addEventListener('click', () => {
        this.addCategory('allow');
      });
    }

    const addBlockedBtn = document.getElementById('addBlockedBtn');
    if (addBlockedBtn) {
      addBlockedBtn.addEventListener('click', () => {
        this.addCategory('block');
      });
    }

    const resetCategoriesBtn = document.getElementById('resetCategoriesBtn');
    if (resetCategoriesBtn) {
      resetCategoriesBtn.addEventListener('click', () => {
        this.resetCategories();
      });
    }

    // Enter key for category inputs
    const newAllowedCategory = document.getElementById('newAllowedCategory');
    if (newAllowedCategory) {
      newAllowedCategory.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addCategory('allow');
      });
    }

    const newBlockedCategory = document.getElementById('newBlockedCategory');
    if (newBlockedCategory) {
      newBlockedCategory.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addCategory('block');
      });
    }

    // Category card selection
    document.addEventListener('click', (e) => {
      if (e.target.matches('.category-card')) {
        this.toggleCategoryCard(e.target);
      } else if (e.target.matches('.category-card input[type="checkbox"]')) {
        this.toggleCategoryCard(e.target.closest('.category-card'));
      }
    });

    // Filtering options
    document.querySelectorAll('input[name="filterMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.settings.filterMode = e.target.value;
      });
    });

    document.querySelectorAll('input[name="mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.settings.mode = e.target.value;
      });
    });

    // Sensitivity slider
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    sensitivitySlider.addEventListener('input', (e) => {
      this.updateSensitivityDisplay(e.target.value);
    });

    sensitivitySlider.addEventListener('change', (e) => {
      const levels = ['low', 'medium', 'high'];
      this.settings.sensitivity = levels[e.target.value];
    });

    // Preview toggle
    document.getElementById('togglePreviewBtn').addEventListener('click', () => {
      this.togglePreview();
    });

    // Analytics actions
    document.getElementById('resetStatsBtn').addEventListener('click', () => {
      this.resetStats();
    });

    document.getElementById('exportAnalyticsBtn').addEventListener('click', () => {
      this.exportAnalytics();
    });

    // Domain management
    const addBlockedDomainBtn = document.getElementById('addBlockedDomainBtn');
    if (addBlockedDomainBtn) {
      addBlockedDomainBtn.addEventListener('click', () => {
        this.addDomain('block');
      });
    }

    const addAllowedDomainBtn = document.getElementById('addAllowedDomainBtn');
    if (addAllowedDomainBtn) {
      addAllowedDomainBtn.addEventListener('click', () => {
        this.addDomain('allow');
      });
    }

    const newBlockedDomain = document.getElementById('newBlockedDomain');
    if (newBlockedDomain) {
      newBlockedDomain.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addDomain('block');
      });
    }

    const newAllowedDomain = document.getElementById('newAllowedDomain');
    if (newAllowedDomain) {
      newAllowedDomain.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addDomain('allow');
      });
    }

    // Debug options
    const debugMode = document.getElementById('debugMode');
    if (debugMode) {
      debugMode.addEventListener('change', (e) => {
        this.settings.debugMode = e.target.checked;
      });
    }

    const exportSettingsBtn = document.getElementById('exportSettingsBtn');
    if (exportSettingsBtn) {
      exportSettingsBtn.addEventListener('click', () => {
        this.exportSettingsJSON();
      });
    }

    const importSettingsBtn = document.getElementById('importSettingsBtn');
    if (importSettingsBtn) {
      importSettingsBtn.addEventListener('click', () => {
        this.showImportSettingsModal();
      });
    }

    const clearAllDataBtn = document.getElementById('clearAllDataBtn');
    if (clearAllDataBtn) {
      clearAllDataBtn.addEventListener('click', () => {
        this.clearAllData();
      });
    }

    // Modal controls
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        this.hideModal();
      });
    }

    const modalCancel = document.getElementById('modalCancel');
    if (modalCancel) {
      modalCancel.addEventListener('click', () => {
        this.hideModal();
      });
    }

    const modalConfirm = document.getElementById('modalConfirm');
    if (modalConfirm) {
      modalConfirm.addEventListener('click', () => {
        this.confirmModal();
      });
    }

    // Close modal on outside click
    const importExportModal = document.getElementById('importExportModal');
    if (importExportModal) {
      importExportModal.addEventListener('click', (e) => {
        if (e.target.id === 'importExportModal') {
          this.hideModal();
        }
      });
    }

    // Footer links
    const docsLink = document.getElementById('docsLink');
    if (docsLink) {
      docsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: chrome.runtime.getURL('docs/ARCHITECTURE.md') });
      });
    }

    const supportLink = document.getElementById('supportLink');
    if (supportLink) {
      supportLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/focusguard/support' });
      });
    }

    const githubLink = document.getElementById('githubLink');
    if (githubLink) {
      githubLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/focusguard/focusguard' });
      });
    }
  }

  /**
   * Update UI with current data
   */
  updateUI() {
    this.renderCategoryCards();
    this.updateCategoryLists();
    this.updateFilteringOptions();
    this.updateAnalytics();
    this.updateDomainLists();
    this.updateDebugOptions();
  }

  /**
   * Render category cards (predefined options)
   */
  renderCategoryCards() {
    const allowedCategories = this.settings.allowedCategories || [];
    const blockedCategories = this.settings.blockedCategories || [];

    // Render allowed category cards
    const allowedGridContainer = document.getElementById('allowedCategoriesGrid');
    if (allowedGridContainer) {
      allowedGridContainer.innerHTML = '';
      PREDEFINED_CATEGORIES.allow.forEach(category => {
        const isSelected = allowedCategories.includes(category);
        const isOther = category === 'Other';
        
        const card = document.createElement('div');
        card.className = `category-card ${isSelected ? 'selected' : ''}`;
        card.dataset.category = category;
        card.dataset.type = 'allow';
        
        if (isOther) {
          card.innerHTML = `
            <input type="checkbox" ${isSelected ? 'checked' : ''}>
            <label>
              <span class="category-label">${category}</span>
              <span class="category-add-icon">+</span>
            </label>
          `;
        } else {
          card.innerHTML = `
            <input type="checkbox" ${isSelected ? 'checked' : ''}>
            <label>
              <span class="category-label">${category}</span>
              <span class="checkmark" style="display: ${isSelected ? 'inline' : 'none'}">✓</span>
            </label>
          `;
        }
        
        allowedGridContainer.appendChild(card);
      });
    }

    // Render blocked category cards
    const blockedGridContainer = document.getElementById('blockedCategoriesGrid');
    if (blockedGridContainer) {
      blockedGridContainer.innerHTML = '';
      PREDEFINED_CATEGORIES.block.forEach(category => {
        const isSelected = blockedCategories.includes(category);
        const isOther = category === 'Other';
        
        const card = document.createElement('div');
        card.className = `category-card ${isSelected ? 'selected' : ''}`;
        card.dataset.category = category;
        card.dataset.type = 'block';
        
        if (isOther) {
          card.innerHTML = `
            <input type="checkbox" ${isSelected ? 'checked' : ''}>
            <label>
              <span class="category-label">${category}</span>
              <span class="category-add-icon">+</span>
            </label>
          `;
        } else {
          card.innerHTML = `
            <input type="checkbox" ${isSelected ? 'checked' : ''}>
            <label>
              <span class="category-label">${category}</span>
              <span class="checkmark" style="display: ${isSelected ? 'inline' : 'none'}">✓</span>
            </label>
          `;
        }
        
        blockedGridContainer.appendChild(card);
      });
    }

    // Show/hide custom input for "Other"
    this.updateOtherInputVisibility();
  }

  /**
   * Toggle category card selection
   */
  toggleCategoryCard(card) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    const category = card.dataset.category;
    const type = card.dataset.type;
    
    if (category === 'Other') {
      checkbox.checked = !checkbox.checked;
      card.classList.toggle('selected');
      this.updateOtherInputVisibility();
    } else {
      const listKey = type === 'allow' ? 'allowedCategories' : 'blockedCategories';
      const categories = this.settings[listKey] || [];
      
      // Filter out 'Other' if it exists
      const filteredCategories = categories.filter(cat => cat !== 'Other');
      
      if (filteredCategories.includes(category)) {
        const index = filteredCategories.indexOf(category);
        filteredCategories.splice(index, 1);
        card.classList.remove('selected');
        checkbox.checked = false;
      } else {
        filteredCategories.push(category);
        card.classList.add('selected');
        checkbox.checked = true;
      }
      
      this.settings[listKey] = filteredCategories;
      const checkmark = card.querySelector('.checkmark');
      if (checkmark) {
        checkmark.style.display = checkbox.checked ? 'inline' : 'none';
      }
    }
  }

  /**
   * Update visibility of custom input for "Other"
   */
  updateOtherInputVisibility() {
    const allowedCategories = this.settings.allowedCategories || [];
    const blockedCategories = this.settings.blockedCategories || [];
    
    const allowedOtherCard = document.querySelector('[data-category="Other"][data-type="allow"]');
    const blockedOtherCard = document.querySelector('[data-category="Other"][data-type="block"]');
    
    const allowedOtherInput = document.getElementById('allowOtherCategoryInput');
    const blockedOtherInput = document.getElementById('blockOtherCategoryInput');
    
    if (allowedOtherInput && allowedOtherCard) {
      const allowedOtherCheckbox = allowedOtherCard.querySelector('input[type="checkbox"]');
      allowedOtherInput.style.display = allowedOtherCheckbox?.checked ? 'flex' : 'none';
    }
    
    if (blockedOtherInput && blockedOtherCard) {
      const blockedOtherCheckbox = blockedOtherCard.querySelector('input[type="checkbox"]');
      blockedOtherInput.style.display = blockedOtherCheckbox?.checked ? 'flex' : 'none';
    }
  }

  /**
   * Update category lists
   */
  updateCategoryLists() {
    const allowedCategories = this.settings.allowedCategories || [];
    const blockedCategories = this.settings.blockedCategories || [];

    // Update allowed categories
    const allowedContainer = document.getElementById('allowedCategoriesList');
    if (allowedContainer) {
      allowedContainer.innerHTML = this.renderCategoryItems(allowedCategories, 'allow');
    }

    // Update blocked categories
    const blockedContainer = document.getElementById('blockedCategoriesList');
    if (blockedContainer) {
      blockedContainer.innerHTML = this.renderCategoryItems(blockedCategories, 'block');
    }

    // Setup remove handlers
    this.setupCategoryRemoveHandlers();
  }

  /**
   * Render category items
   */
  renderCategoryItems(categories, type) {
    if (categories.length === 0) {
      return '<div class="empty-state">No categories added</div>';
    }

    return categories.map(category => `
      <div class="category-item" data-category="${category}" data-type="${type}">
        <span>${category}</span>
        <span class="remove-btn" data-category="${category}" data-type="${type}">×</span>
      </div>
    `).join('');
  }

  /**
   * Setup category remove handlers
   */
  setupCategoryRemoveHandlers() {
    document.querySelectorAll('.category-item .remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        const type = e.target.dataset.type;
        this.removeCategory(type, category);
      });
    });
  }

  /**
   * Update filtering options
   */
  updateFilteringOptions() {
    // Filter mode
    const filterMode = this.settings.filterMode || 'blur';
    const filterModeInput = document.querySelector(`input[name="filterMode"][value="${filterMode}"]`);
    if (filterModeInput) {
      filterModeInput.checked = true;
    }

    // Mode
    const mode = this.settings.mode || 'balanced';
    const modeInput = document.querySelector(`input[name="mode"][value="${mode}"]`);
    if (modeInput) {
      modeInput.checked = true;
    }

    // Sensitivity
    const sensitivity = this.settings.sensitivity || 'medium';
    const sensitivityValues = { 'low': 0, 'medium': 1, 'high': 2 };
    const slider = document.getElementById('sensitivitySlider');
    if (slider) {
      slider.value = sensitivityValues[sensitivity];
      this.updateSensitivityDisplay(slider.value);
    }
  }

  /**
   * Update sensitivity display
   */
  updateSensitivityDisplay(value) {
    const descriptions = [
      'Low confidence (50%) - More aggressive filtering',
      'Medium confidence (70%) - Balanced filtering',
      'High confidence (90%) - Conservative filtering'
    ];
    const sensitivityDescription = document.getElementById('sensitivityDescription');
    if (sensitivityDescription) {
      sensitivityDescription.textContent = descriptions[value];
    }
  }

  /**
   * Update analytics display
   */
  updateAnalytics() {
    // Update stats
    const todayTextBlocks = document.getElementById('todayTextBlocks');
    if (todayTextBlocks) {
      todayTextBlocks.textContent = this.stats.blockedTexts?.count || 0;
    }
    
    const todayImageBlocks = document.getElementById('todayImageBlocks');
    if (todayImageBlocks) {
      todayImageBlocks.textContent = this.stats.blockedImages?.count || 0;
    }
    
    const todayVideoBlocks = document.getElementById('todayVideoBlocks');
    if (todayVideoBlocks) {
      todayVideoBlocks.textContent = this.stats.blockedVideos?.count || 0;
    }
    
    const todayTotalBlocks = document.getElementById('todayTotalBlocks');
    if (todayTotalBlocks) {
      todayTotalBlocks.textContent = this.stats.totalBlocksToday || 0;
    }

    // Update top domains
    this.updateTopDomains();
  }

  /**
   * Update top blocked domains
   */
  updateTopDomains() {
    const domains = this.stats.blockedDomains || {};
    const sortedDomains = Object.entries(domains)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const container = document.getElementById('topBlockedDomains');
    if (!container) {
      return;
    }
    
    if (sortedDomains.length === 0) {
      container.innerHTML = '<div class="empty-state">No blocked domains yet</div>';
      return;
    }

    container.innerHTML = sortedDomains.map(([domain, count]) => `
      <div class="domain-item">
        <span>${domain}</span>
        <span class="domain-count">${count}</span>
      </div>
    `).join('');
  }

  /**
   * Update domain lists
   */
  updateDomainLists() {
    const blockedDomains = this.settings.blockedDomains || [];
    const allowedDomains = this.settings.allowedDomains || [];

    // Update blocked domains
    const blockedContainer = document.getElementById('blockedDomainsList');
    blockedContainer.innerHTML = this.renderDomainItems(blockedDomains, 'block');

    // Update allowed domains
    const allowedContainer = document.getElementById('allowedDomainsList');
    allowedContainer.innerHTML = this.renderDomainItems(allowedDomains, 'allow');

    // Setup remove handlers
    this.setupDomainRemoveHandlers();
  }

  /**
   * Render domain items
   */
  renderDomainItems(domains, type) {
    if (domains.length === 0) {
      return '<div class="empty-state">No domains added</div>';
    }

    return domains.map(domain => `
      <div class="domain-item-managed">
        <span>${domain}</span>
        <button class="domain-remove-btn" data-domain="${domain}" data-type="${type}">Remove</button>
      </div>
    `).join('');
  }

  /**
   * Setup domain remove handlers
   */
  setupDomainRemoveHandlers() {
    document.querySelectorAll('.domain-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const domain = e.target.dataset.domain;
        const type = e.target.dataset.type;
        this.removeDomain(type, domain);
      });
    });
  }

  /**
   * Update debug options
   */
  updateDebugOptions() {
    const debugMode = document.getElementById('debugMode');
    if (debugMode) {
      debugMode.checked = this.settings.debugMode || false;
    }
  }

  /**
   * Add category to list
   */
  addCategory(type) {
    const inputId = type === 'allow' ? 'newAllowedCategory' : 'newBlockedCategory';
    const input = document.getElementById(inputId);
    
    if (!input) {
      console.error(`FocusGuard: Input element not found: ${inputId}`);
      this.showToast('Error: Input element not found', 'error');
      return;
    }
    
    const category = input.value.trim();
    
    if (!category) {
      this.showToast('Please enter a category name', 'warning');
      return;
    }

    const listKey = type === 'allow' ? 'allowedCategories' : 'blockedCategories';
    const categories = this.settings[listKey] || [];
    
    if (categories.includes(category)) {
      this.showToast(`"${category}" already exists`, 'warning');
      return;
    }

    categories.push(category);
    this.settings[listKey] = categories;
    
    input.value = '';
    this.renderCategoryCards();
    this.updateCategoryLists();
    this.showToast(`Category added to ${type} list`, 'success');
  }

  /**
   * Add custom category from "Other" input
   */
  addCustomCategory(type) {
    const inputId = type === 'allow' ? 'allowOtherInput' : 'blockOtherInput';
    const input = document.getElementById(inputId);
    
    if (!input) {
      console.error(`FocusGuard: Custom input element not found: ${inputId}`);
      return;
    }
    
    const category = input.value.trim();
    
    if (!category) {
      this.showToast('Please enter a category name', 'warning');
      return;
    }

    const listKey = type === 'allow' ? 'allowedCategories' : 'blockedCategories';
    const categories = this.settings[listKey] || [];
    
    if (categories.includes(category)) {
      this.showToast(`"${category}" already exists`, 'warning');
      return;
    }

    categories.push(category);
    this.settings[listKey] = categories;
    
    input.value = '';
    this.renderCategoryCards();
    this.updateCategoryLists();
    this.showToast(`Category added to ${type} list`, 'success');
  }

  /**
   * Remove category from list
   */
  removeCategory(type, category) {
    const listKey = type === 'allow' ? 'allowedCategories' : 'blockedCategories';
    const categories = this.settings[listKey] || [];
    const index = categories.indexOf(category);
    
    if (index > -1) {
      categories.splice(index, 1);
      this.settings[listKey] = categories;
      this.updateCategoryLists();
      this.showToast(`Category removed from ${type} list`, 'success');
    }
  }

  /**
   * Reset categories to defaults
   */
  resetCategories() {
    if (confirm('Are you sure you want to reset all categories to defaults?')) {
      this.settings.allowedCategories = [...DEFAULT_ALLOWED_CATEGORIES];
      this.settings.blockedCategories = [...DEFAULT_BLOCKED_CATEGORIES];
      this.renderCategoryCards();
      this.updateCategoryLists();
      this.showToast('Categories reset to defaults', 'success');
    }
  }

  /**
   * Add domain to list
   */
  addDomain(type) {
    const inputId = `new${type.charAt(0).toUpperCase() + type.slice(1)}Domain`;
    const input = document.getElementById(inputId);
    
    if (!input) {
      console.error(`FocusGuard: Input element not found: ${inputId}`);
      this.showToast('Error: Input element not found', 'error');
      return;
    }
    
    const domain = input.value.trim();
    
    if (!domain) {
      this.showToast('Please enter a domain name', 'warning');
      return;
    }

    const listKey = type === 'allow' ? 'allowedDomains' : 'blockedDomains';
    const domains = this.settings[listKey] || [];
    
    if (domains.includes(domain)) {
      this.showToast(`"${domain}" already exists`, 'warning');
      return;
    }

    domains.push(domain);
    this.settings[listKey] = domains;
    
    input.value = '';
    this.updateDomainLists();
    this.showToast(`Domain added to ${type} list`, 'success');
  }

  /**
   * Remove domain from list
   */
  removeDomain(type, domain) {
    const listKey = type === 'allow' ? 'allowedDomains' : 'blockedDomains';
    const domains = this.settings[listKey] || [];
    const index = domains.indexOf(domain);
    
    if (index > -1) {
      domains.splice(index, 1);
      this.settings[listKey] = domains;
      this.updateDomainLists();
      this.showToast(`Domain removed from ${type} list`, 'success');
    }
  }

  /**
   * Toggle preview
   */
  togglePreview() {
    const previewContent = document.getElementById('previewContent');
    if (!previewContent) {
      console.error('FocusGuard: Preview content element not found');
      return;
    }
    
    const isFiltered = previewContent.hasAttribute('data-preview-filtered');
    
    if (isFiltered) {
      previewContent.removeAttribute('data-preview-filtered');
      previewContent.style.filter = '';
      previewContent.innerHTML = `
        <p>This is a sample content that might be filtered based on your settings.</p>
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ESample Image%3C/text%3E%3C/svg%3E" alt="Sample image">
      `;
    } else {
      previewContent.setAttribute('data-preview-filtered', 'true');
      const filterMode = this.settings.filterMode || 'blur';
      
      if (filterMode === 'blur') {
        previewContent.style.filter = 'blur(10px) grayscale(100%)';
        previewContent.innerHTML = `
          <p>This is a sample content that might be filtered based on your settings.</p>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3ESample Image%3C/text%3E%3C/svg%3E" alt="Sample image">
        `;
      } else {
        previewContent.style.filter = '';
        previewContent.innerHTML = `
          <div style="padding: 20px; border: 2px dashed #ccc; text-align: center; color: #666;">
            <div style="font-size: 24px; margin-bottom: 8px;">🚫</div>
            <div>Content blocked by FocusGuard</div>
            <div style="font-size: 12px; margin-top: 4px;">(Sample content)</div>
          </div>
        `;
      }
    }
  }

  /**
   * Reset statistics
   */
  async resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'resetStats'
        });
        
        if (response.success) {
          await this.loadStats();
          this.updateAnalytics();
          this.showToast('Statistics reset successfully', 'success');
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('FocusGuard: Error resetting stats:', error);
        this.showToast('Error resetting statistics', 'error');
      }
    }
  }

  /**
   * Export analytics
   */
  async exportAnalytics() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportAnalytics'
      });
      
      if (response.success) {
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `focusguard-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Analytics exported successfully', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('FocusGuard: Error exporting analytics:', error);
      this.showToast('Error exporting analytics', 'error');
    }
  }

  /**
   * Export settings
   */
  async exportSettings() {
    try {
      const settingsJson = JSON.stringify(this.settings, null, 2);
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusguard-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showToast('Settings exported successfully', 'success');
    } catch (error) {
      console.error('FocusGuard: Error exporting settings:', error);
      this.showToast('Error exporting settings', 'error');
    }
  }

  /**
   * Show import modal
   */
  showImportModal() {
    this.modalType = 'import';
    document.getElementById('modalTitle').textContent = 'Import Settings';
    document.getElementById('importExportTextarea').value = '';
    document.getElementById('importExportTextarea').placeholder = 'Paste your exported settings JSON here...';
    document.getElementById('importExportModal').classList.add('show');
  }

  /**
   * Show import settings modal
   */
  showImportSettingsModal() {
    this.modalType = 'importSettings';
    document.getElementById('modalTitle').textContent = 'Import Settings from JSON';
    document.getElementById('importExportTextarea').value = '';
    document.getElementById('importExportTextarea').placeholder = 'Paste your settings JSON here...';
    document.getElementById('importExportModal').classList.add('show');
  }

  /**
   * Hide modal
   */
  hideModal() {
    document.getElementById('importExportModal').classList.remove('show');
    this.modalType = null;
  }

  /**
   * Confirm modal action
   */
  async confirmModal() {
    const textarea = document.getElementById('importExportTextarea');
    const jsonData = textarea.value.trim();
    
    if (!jsonData) {
      this.showToast('Please enter JSON data', 'warning');
      return;
    }

    try {
      const importedData = JSON.parse(jsonData);
      
      if (this.modalType === 'importSettings') {
        this.settings = importedData;
        this.updateUI();
        this.showToast('Settings imported successfully', 'success');
      }
      
      this.hideModal();
    } catch (error) {
      this.showToast('Invalid JSON format', 'error');
    }
  }

  /**
   * Export settings as JSON
   */
  exportSettingsJSON() {
    const settingsJson = JSON.stringify(this.settings, null, 2);
    navigator.clipboard.writeText(settingsJson).then(() => {
      this.showToast('Settings copied to clipboard', 'success');
    }).catch(() => {
      this.showToast('Error copying to clipboard', 'error');
    });
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      if (confirm('This will permanently delete all settings, statistics, and cached data. Are you absolutely sure?')) {
        try {
          // Clear settings
          this.settings = {};
          
          // Clear stats via background
          const response = await chrome.runtime.sendMessage({
            action: 'clearAllData'
          });
          
          if (response.success) {
            await this.loadStats();
            this.updateUI();
            this.showToast('All data cleared successfully', 'success');
          } else {
            throw new Error(response.error);
          }
        } catch (error) {
          console.error('FocusGuard: Error clearing data:', error);
          this.showToast('Error clearing data', 'error');
        }
      }
    }
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });
      
      if (response.success) {
        this.showToast('Settings saved successfully', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('FocusGuard: Error saving settings:', error);
      this.showToast('Error saving settings', 'error');
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) {
      console.warn('FocusGuard: Toast elements not found. Message:', message);
      return;
    }
    
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
}

// Initialize options page when DOM is ready
let optionsManager;
document.addEventListener('DOMContentLoaded', () => {
  optionsManager = new OptionsManager();
});