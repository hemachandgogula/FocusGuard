/**
 * Filter Engine for FocusGuard
 * Handles content classification logic and filter application
 */

class FilterEngine {
  constructor() {
    this.sensitivityThresholds = {
      'low': 0.5,
      'medium': 0.7,
      'high': 0.9
    };
  }

  /**
   * Classify content using available methods
   * @param {string|Object} content - Content to classify
   * @param {string} type - Content type ('text', 'image', 'video')
   * @returns {Promise<Object>} Classification result {category, confidence}
   */
  async classifyContent(content, type) {
    try {
      // For now, return a placeholder - this will be enhanced with ONNX models
      // In a real implementation, this would call the model loader
      return {
        category: 'unknown',
        confidence: 0.0
      };
    } catch (error) {
      console.error('FocusGuard: Classification error:', error);
      return {
        category: 'unknown',
        confidence: 0.0
      };
    }
  }

  /**
   * Determine if content should be blocked based on settings and classification
   * Simplified block-list-only logic: blocks only if category is in blockedCategories
   * @param {string} category - Content category
   * @param {number} confidence - Confidence score (0-1)
   * @param {Object} settings - User settings
   * @returns {boolean} True if should block
   */
  shouldBlock(category, confidence, settings = {}) {
    const sensitivity = settings.sensitivity || 'medium';
    const threshold = this.sensitivityThresholds[sensitivity] ?? 0.7;
    const blockedCategories = Array.isArray(settings.blockedCategories) ? settings.blockedCategories : [];

    if (!category || blockedCategories.length === 0) {
      return false;
    }

    if (typeof confidence === 'number' && confidence < threshold) {
      return false;
    }

    const normalizedCategory = this.normalizeCategory(category);

    return blockedCategories.some(blocked => {
      const normalizedBlocked = this.normalizeCategory(blocked);
      return normalizedCategory === normalizedBlocked ||
             normalizedCategory.includes(normalizedBlocked) ||
             normalizedBlocked.includes(normalizedCategory);
    });
  }

  /**
   * Normalize category text for comparison
   * @param {string} value - Category text
   * @returns {string} Normalized category value
   */
  normalizeCategory(value) {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  /**
   * Apply blur filter to element
   * @param {Element} element - Element to blur
   * @param {string} category - Content category
   */
  applyBlur(element, category) {
    if (!element || !element.style) {
      return;
    }
    
    element.setAttribute('data-focusguard-filtered', 'true');
    element.setAttribute('data-focusguard-category', category);
    element.setAttribute('data-focusguard-filter-type', 'blur');
    
    element.classList.add('focusguard-blur', 'focusguard-blurred');
    
    element.style.filter = 'blur(12px) grayscale(100%)';
    element.style.transition = 'filter 0.3s ease';
    element.style.pointerEvents = 'none';
    element.style.cursor = 'not-allowed';
    element.style.opacity = '0.85';
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
  }

  /**
   * Remove element (block mode)
   * @param {Element} element - Element to remove
   * @param {string} category - Content category
   */
  removeElement(element, category) {
    if (!element || !element.parentNode) {
      return;
    }
    
    // Mark as filtered before removal
    element.setAttribute('data-focusguard-filtered', 'true');
    element.setAttribute('data-focusguard-category', category);
    element.setAttribute('data-focusguard-filter-type', 'block');
    
    // Create placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'focusguard-placeholder';
    placeholder.innerHTML = `
      <div class="focusguard-placeholder-content">
        <span class="focusguard-placeholder-icon">🚫</span>
        <span class="focusguard-placeholder-text">Content blocked by FocusGuard</span>
        <span class="focusguard-placeholder-category">(${category})</span>
        <button class="focusguard-reveal-btn">Show content</button>
      </div>
    `;
    
    // Add reveal button handler
    const revealBtn = placeholder.querySelector('.focusguard-reveal-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.revealElement(element, placeholder);
      });
    }
    
    // Replace element with placeholder
    element.parentNode.replaceChild(placeholder, element);
    
    // Store original element for potential restoration
    placeholder.setAttribute('data-focusguard-original-element', 'true');
    this.storeOriginalElement(placeholder, element);
  }

  /**
   * Store original element for restoration
   * @param {Element} placeholder - Placeholder element
   * @param {Element} original - Original element
   */
  storeOriginalElement(placeholder, original) {
    // Create a unique key for this element
    const key = 'focusguard-original-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    placeholder.setAttribute('data-focusguard-key', key);
    
    // Store the original element's HTML
    const originalData = {
      html: original.outerHTML,
      tagName: original.tagName,
      className: original.className,
      id: original.id
    };
    
    // Store in a temporary map (in production, this might use WeakMap)
    if (!window.focusguardOriginals) {
      window.focusguardOriginals = {};
    }
    window.focusguardOriginals[key] = originalData;
  }

  /**
   * Reveal blocked element
   * @param {Element} original - Original element
   * @param {Element} placeholder - Placeholder element
   */
  revealElement(original, placeholder) {
    if (!placeholder || !placeholder.parentNode) {
      return;
    }
    
    const key = placeholder.getAttribute('data-focusguard-key');
    
    if (key && window.focusguardOriginals && window.focusguardOriginals[key]) {
      // Recreate the original element from stored data
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = window.focusguardOriginals[key].html;
      const newElement = tempDiv.firstChild;
      
      // Remove filter attributes
      newElement.removeAttribute('data-focusguard-filtered');
      newElement.removeAttribute('data-focusguard-category');
      newElement.removeAttribute('data-focusguard-filter-type');
      
      // Replace placeholder with original
      placeholder.parentNode.replaceChild(newElement, placeholder);
      
      // Clean up stored data
      delete window.focusguardOriginals[key];
    }
  }

  /**
   * Remove filter from element
   * @param {Element} element - Element to unfilter
   */
  removeFilter(element) {
    if (!element) {
      return;
    }
    
    // Remove filter attributes
    element.removeAttribute('data-focusguard-filtered');
    element.removeAttribute('data-focusguard-category');
    element.removeAttribute('data-focusguard-filter-type');
    
    // Remove CSS classes
    element.classList.remove('focusguard-blur', 'focusguard-blurred', 'focusguard-blocked');
    
    // Remove inline styles
    element.style.filter = '';
    element.style.transition = '';
    element.style.pointerEvents = '';
    element.style.cursor = '';
    element.style.opacity = '';
    element.style.userSelect = '';
    element.style.webkitUserSelect = '';
    
    // Remove event listeners (by cloning and replacing)
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
  }

  /**
   * Get sensitivity threshold value
   * @param {string} level - Sensitivity level ('low', 'medium', 'high')
   * @returns {number} Threshold value
   */
  getSensitivityThreshold(level = 'medium') {
    return this.sensitivityThresholds[level] || 0.7;
  }

  /**
   * Apply progressive blur based on content sensitivity
   * @param {Element} element - Element to blur
   * @param {number} intensity - Blur intensity (0-100)
   */
  applyProgressiveBlur(element, intensity) {
    if (!element || !element.style) {
      return;
    }
    
    const blurAmount = Math.max(0, Math.min(20, intensity / 5)); // 0-20px blur
    const grayscaleAmount = Math.max(0, Math.min(100, intensity)); // 0-100% grayscale
    
    element.classList.add('focusguard-blur', 'focusguard-blurred');
    element.style.filter = `blur(${blurAmount}px) grayscale(${grayscaleAmount}%)`;
    element.style.transition = 'filter 0.3s ease';
    element.style.pointerEvents = 'none';
    element.style.cursor = 'not-allowed';
    element.style.opacity = '0.85';
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
  }

  /**
   * Check if element is currently filtered
   * @param {Element} element - Element to check
   * @returns {boolean} True if filtered
   */
  isFiltered(element) {
    return element && element.hasAttribute('data-focusguard-filtered');
  }

  /**
   * Get filter info for element
   * @param {Element} element - Element to check
   * @returns {Object|null} Filter info
   */
  getFilterInfo(element) {
    if (!this.isFiltered(element)) {
      return null;
    }
    
    return {
      category: element.getAttribute('data-focusguard-category'),
      filterType: element.getAttribute('data-focusguard-filter-type'),
      isFiltered: true
    };
  }

  /**
   * Remove all filters from page
   */
  removeAllFilters() {
    const filteredElements = document.querySelectorAll('[data-focusguard-filtered]');
    filteredElements.forEach(element => {
      this.removeFilter(element);
    });
    
    // Remove placeholders and restore original elements
    const placeholders = document.querySelectorAll('.focusguard-placeholder');
    placeholders.forEach(placeholder => {
      const key = placeholder.getAttribute('data-focusguard-key');
      if (key && window.focusguardOriginals && window.focusguardOriginals[key]) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = window.focusguardOriginals[key].html;
        const newElement = tempDiv.firstChild;
        placeholder.parentNode.replaceChild(newElement, placeholder);
        delete window.focusguardOriginals[key];
      } else {
        placeholder.remove();
      }
    });
  }

  /**
   * Get filter statistics
   * @returns {Object} Filter statistics
   */
  getFilterStats() {
    const blurredElements = document.querySelectorAll('[data-focusguard-filter-type="blur"]').length;
    const blockedElements = document.querySelectorAll('.focusguard-placeholder').length;
    const totalFiltered = document.querySelectorAll('[data-focusguard-filtered]').length;
    
    return {
      blurred: blurredElements,
      blocked: blockedElements,
      total: totalFiltered
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterEngine;
}