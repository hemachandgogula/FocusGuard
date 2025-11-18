/**
 * DOM Scanner for FocusGuard
 * Monitors DOM changes and extracts content for classification
 */

class DOMScanner {
  constructor() {
    this.observer = null;
    this.contentCallback = null;
    this.scanQueue = [];
    this.isScanning = false;
    this.debounceTimer = null;
    this.processedElements = new WeakSet();
    
    // Content selectors for different types
    this.selectors = {
      text: 'p, h1, h2, h3, h4, h5, h6, span, div, article, section',
      images: 'img',
      videos: 'video, iframe[src*="youtube"], iframe[src*="vimeo"]',
      links: 'a[href]'
    };
    
    // Blacklist of elements to ignore
    this.ignoreSelectors = [
      'script', 'style', 'noscript', 'meta', 'link', 'head',
      '[data-focusguard-ignore]',
      '.focusguard-ignored'
    ];

    this.priorityTextSelectors = [
      'yt-formatted-string[role="button"]',
      'h2 a',
      'a[aria-label]',
      '[data-description]',
      '.comment',
      'p',
      'span'
    ];
  }

  /**
   * Start monitoring DOM for changes
   * @param {Function} callback - Callback function for detected content
   */
  startMonitoring(callback) {
    if (this.observer) {
      this.stopMonitoring();
    }
    
    this.contentCallback = callback;
    this.isScanning = true;
    
    // Initial scan of existing content
    this.scanInitialContent();
    
    // Setup MutationObserver
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });
    
    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: true
    });
  }

  /**
   * Stop monitoring DOM
   */
  stopMonitoring() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.isScanning = false;
    this.contentCallback = null;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Scan initial content on page load
   */
  scanInitialContent() {
    const prioritizedText = this.extractPriorityTextContent(document.body);
    const baseContent = this.scanElement(document.body);
    const content = [...prioritizedText, ...baseContent];
    if (content.length > 0 && this.contentCallback) {
      this.contentCallback(content);
    }
  }

  /**
   * Handle DOM mutations
   * @param {MutationRecord[]} mutations - Array of mutation records
   */
  handleMutations(mutations) {
    if (!this.isScanning || !this.contentCallback) {
      return;
    }
    
    // Debounce mutations to batch process
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.processMutations(mutations);
    }, 300);
  }

  /**
   * Process mutations and extract content
   * @param {MutationRecord[]} mutations - Array of mutation records
   */
  processMutations(mutations) {
    const content = [];
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const extractedContent = this.scanElement(node);
            content.push(...extractedContent);

            const prioritizedContent = this.extractPriorityTextContent(node);
            if (prioritizedContent.length > 0) {
              content.push(...prioritizedContent);
            }
          }
        });
      } else if (mutation.type === 'characterData') {
        // Handle text content changes
        const parentElement = mutation.target.parentElement;
        if (parentElement && !this.shouldIgnoreElement(parentElement)) {
          const extractedContent = this.scanElement(parentElement);
          content.push(...extractedContent);

          const prioritizedContent = this.extractPriorityTextContent(parentElement);
          if (prioritizedContent.length > 0) {
            content.push(...prioritizedContent);
          }
        }
      }
    });
    
    // Send content to callback
    if (content.length > 0 && this.contentCallback) {
      this.contentCallback(content);
    }
  }

  /**
   * Scan element for content
   * @param {Element} element - Element to scan
   * @returns {Array} Array of content objects
   */
  scanElement(element) {
    const content = [];
    
    if (this.shouldIgnoreElement(element)) {
      return content;
    }
    
    // Check if already processed
    if (this.processedElements.has(element)) {
      return content;
    }
    
    // Scan for text content
    const textContent = this.extractTextContent(element);
    if (textContent && textContent.trim().length > 20) { // Minimum text length
      content.push({
        element: element,
        type: 'text',
        data: textContent.trim(),
        domain: window.location.hostname
      });
    }
    
    // Scan for images
    const images = element.querySelectorAll(this.selectors.images);
    images.forEach(img => {
      if (!this.shouldIgnoreElement(img) && !this.processedElements.has(img)) {
        const imageData = this.extractImageData(img);
        if (imageData) {
          content.push(imageData);
          this.processedElements.add(img);
        }
      }
    });
    
    // Scan for videos
    const videos = element.querySelectorAll(this.selectors.videos);
    videos.forEach(video => {
      if (!this.shouldIgnoreElement(video) && !this.processedElements.has(video)) {
        const videoData = this.extractVideoData(video);
        if (videoData) {
          content.push(videoData);
          this.processedElements.add(video);
        }
      }
    });
    
    // Mark element as processed
    this.processedElements.add(element);
    
    return content;
  }

  /**
   * Extract text content from element
   * @param {Element} element - Element to extract text from
   * @returns {string} Extracted text content
   */
  extractTextContent(element) {
    // Skip if element is text-only input or has no text content
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return '';
    }
    
    // Get text content, excluding script/style content
    const clonedElement = element.cloneNode(true);
    
    // Remove script and style elements
    const scripts = clonedElement.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    let text = clonedElement.textContent || clonedElement.innerText || '';
    
    // Clean up text
    text = text
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/^\s+|\s+$/g, '')  // Trim whitespace
      .replace(/[\r\n\t]/g, ' ');  // Replace newlines and tabs
    
    return text;
  }

  /**
   * Extract prioritized text content using targeted selectors
   * @param {Element|Document} root - Root element to search
   * @returns {Array} Array of prioritized content objects
   */
  extractPriorityTextContent(root = document) {
    const content = [];
    const extractedTexts = new Set();

    if (!root || typeof root.querySelectorAll !== 'function') {
      return content;
    }

    for (const selector of this.priorityTextSelectors) {
      if (content.length >= 50) {
        break;
      }

      const elements = root.querySelectorAll(selector);
      elements.forEach(el => {
        if (content.length >= 50) {
          return;
        }

        if (this.shouldIgnoreElement(el) || this.processedElements.has(el)) {
          return;
        }

        let text = (el.textContent || '').trim();
        if (!text && typeof el.getAttribute === 'function') {
          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel) {
            text = ariaLabel.trim();
          }
        }

        if (!text || text.length < 5 || text.length > 1000) {
          return;
        }

        if (extractedTexts.has(text)) {
          return;
        }

        extractedTexts.add(text);

        content.push({
          element: el,
          type: 'text',
          data: text,
          domain: window.location.hostname
        });

        this.processedElements.add(el);
      });
    }

    return content;
  }

  /**
   * Extract image data
   * @param {HTMLImageElement} img - Image element
   * @returns {Object|null} Image data object
   */
  extractImageData(img) {
    if (!img.src && !img.dataset.src) {
      return null;
    }
    
    const src = img.src || img.dataset.src;
    
    // Skip data URLs and tiny images
    if (src.startsWith('data:') || (img.naturalWidth && img.naturalWidth < 50)) {
      return null;
    }
    
    return {
      element: img,
      type: 'image',
      data: {
        src: src,
        alt: img.alt || '',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      },
      domain: window.location.hostname
    };
  }

  /**
   * Extract video data
   * @param {Element} video - Video or iframe element
   * @returns {Object|null} Video data object
   */
  extractVideoData(video) {
    let videoInfo = null;
    
    if (video.tagName === 'VIDEO') {
      if (video.src || video.querySelector('source')) {
        videoInfo = {
          src: video.src,
          poster: video.poster,
          duration: video.duration
        };
      }
    } else if (video.tagName === 'IFRAME') {
      const src = video.src || '';
      if (src.includes('youtube.com') || src.includes('vimeo.com') || src.includes('video')) {
        videoInfo = {
          src: src,
          type: 'embed'
        };
      }
    }
    
    if (videoInfo) {
      return {
        element: video,
        type: 'video',
        data: videoInfo,
        domain: window.location.hostname
      };
    }
    
    return null;
  }

  /**
   * Check if element should be ignored
   * @param {Element} element - Element to check
   * @returns {boolean} True if should ignore
   */
  shouldIgnoreElement(element) {
    if (!element || !element.tagName) {
      return true;
    }
    
    // Check ignore selectors
    for (const selector of this.ignoreSelectors) {
      if (element.matches && element.matches(selector)) {
        return true;
      }
    }
    
    // Check if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return true;
    }
    
    // Check if element is too small
    const rect = element.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      return true;
    }
    
    return false;
  }

  /**
   * Get content statistics
   * @returns {Object} Content statistics
   */
  getContentStats() {
    const stats = {
      textElements: document.querySelectorAll(this.selectors.text).length,
      images: document.querySelectorAll(this.selectors.images).length,
      videos: document.querySelectorAll(this.selectors.videos).length,
      links: document.querySelectorAll(this.selectors.links).length
    };
    
    return stats;
  }

  /**
   * Manually trigger a scan of specific element
   * @param {Element} element - Element to scan
   */
  scanElementManually(element) {
    if (!this.isScanning || !this.contentCallback) {
      return;
    }
    
    const content = this.scanElement(element);
    if (content.length > 0 && this.contentCallback) {
      this.contentCallback(content);
    }
  }

  /**
   * Clear processed elements cache
   */
  clearProcessedCache() {
    this.processedElements = new WeakSet();
  }

  /**
   * Get current scan status
   * @returns {Object} Scan status
   */
  getScanStatus() {
    return {
      isScanning: this.isScanning,
      queueLength: this.scanQueue.length,
      hasObserver: !!this.observer,
      stats: this.getContentStats()
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMScanner;
}