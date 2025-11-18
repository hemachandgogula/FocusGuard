/**
 * Keyword Fallback for FocusGuard
 * Provides keyword-based classification when ML models are unavailable
 */

const KEYWORD_DATABASE = {
  'social-media': {
    keywords: ['instagram', 'tiktok', 'snapchat', 'reels', 'reel', 'tweet', 'facebook', 'reddit', 'dancing', 'viral', 'trending'],
    confidence: 0.9
  },
  'adult-content': {
    keywords: ['xxx', 'adult', 'porn', 'nude', 'nsfw', '18+', 'onlyfans', 'sensual'],
    confidence: 0.95
  },
  'entertainment': {
    keywords: ['movie', 'film', 'entertainment', 'watch', 'video', 'music', 'song', 'show', 'concert', 'series'],
    confidence: 0.7
  },
  'gaming': {
    keywords: ['game', 'gaming', 'play', 'gamer', 'esports', 'twitch', 'discord', 'livestream'],
    confidence: 0.8
  },
  'violence': {
    keywords: ['fight', 'war', 'kill', 'death', 'violent', 'attack', 'weapon', 'blood'],
    confidence: 0.85
  },
  'cruelty': {
    keywords: ['animal', 'abuse', 'cruel', 'cruelty', 'torture', 'hurt', 'harm'],
    confidence: 0.85
  },
  'politics': {
    keywords: ['politics', 'political', 'democrat', 'republican', 'election', 'president', 'vote', 'campaign'],
    confidence: 0.8
  },
  'news': {
    keywords: ['news', 'breaking', 'headline', 'report', 'story', 'update'],
    confidence: 0.7
  }
};

class KeywordFallback {
  constructor() {
    this.predefinedBlacklist = this.getPredefinedBlacklist();
    this.predefinedWhitelist = this.getPredefinedWhitelist();
    this.categoryKeywords = this.getCategoryKeywords();
  }

  /**
   * Classify content by keywords and domain
   * @param {string} text - Text content to classify
   * @param {string} domain - Domain name
   * @returns {Object} Classification result {category, confidence}
   */
  static classifyByKeywords(text, domain) {
    const fallback = new KeywordFallback();
    return fallback.classifyContent(text, domain);
  }

  /**
   * Classify content instance method
   * @param {string} text - Text content to classify
   * @param {string} domain - Domain name
   * @returns {Object} Classification result {category, confidence}
   */
  classifyContent(text, domain = '') {
    try {
      if (!text && !domain) {
        return { category: 'unknown', confidence: 0.0 };
      }

      if (domain && this.isDomainBlacklisted(domain)) {
        return { category: 'Adult Content', confidence: 0.9 };
      }

      if (domain && this.isDomainWhitelisted(domain)) {
        return { category: 'Education', confidence: 0.8 };
      }

      if (!text) {
        console.warn('FocusGuard: classifyContent received empty text');
        return { category: 'unknown', confidence: 0.0 };
      }

      if (typeof text !== 'string') {
        console.warn('FocusGuard: Invalid text input for classification', typeof text, text);
        text = String(text);
      }

      const result = this.classifyByText(text, domain);
      if (!result || !result.category) {
        return { category: 'unknown', confidence: 0.0 };
      }

      return result;
    } catch (error) {
      console.error('FocusGuard: Error in classifyContent', error);
      return { category: 'unknown', confidence: 0.0 };
    }
  }

  /**
   * Classify content by text keywords
   * @param {string} text - Text content
   * @param {string} domain - Domain name (optional)
   * @returns {Object} Classification result {category, confidence}
   */
  classifyByText(text, domain = '') {
    if (!text) {
      console.warn('FocusGuard: classifyByText received empty text');
      return { category: 'unknown', confidence: 0.0 };
    }

    if (typeof text !== 'string') {
      console.warn('FocusGuard: classifyByText received non-string:', typeof text, text);
      text = String(text);
    }

    const cleanText = text.trim().toLowerCase();
    if (!cleanText.length) {
      return { category: 'unknown', confidence: 0.0 };
    }

    let bestMatch = { category: 'unknown', confidence: 0.0 };

    Object.entries(KEYWORD_DATABASE).forEach(([categoryKey, categoryData]) => {
      const { keywords, confidence: baseConfidence } = categoryData;
      let matchCount = 0;

      keywords.forEach(keyword => {
        if (cleanText.includes(keyword)) {
          matchCount++;
        }
      });

      if (matchCount > 0) {
        const rawConfidence = Math.min(
          0.95,
          (matchCount / keywords.length) * baseConfidence
        );
        const confidence = Math.max(rawConfidence, Math.min(0.95, baseConfidence));

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            category: this.formatCategoryName(categoryKey),
            confidence: Number(confidence.toFixed(2))
          };
        }
      }
    });

    if (bestMatch.category !== 'unknown') {
      const preview = text.length > 50 ? `${text.substring(0, 50)}...` : text;
      console.debug(
        `FocusGuard: Classified "${preview}" as "${bestMatch.category}" (${bestMatch.confidence})`
      );
    }

    return bestMatch;
  }

  /**
   * Check if domain is blacklisted
   * @param {string} domain - Domain name
   * @returns {boolean} True if blacklisted
   */
  isDomainBlacklisted(domain) {
    return this.predefinedBlacklist.some(blacklisted => {
      return domain.includes(blacklisted) || blacklisted.includes(domain);
    });
  }

  /**
   * Check if domain is whitelisted
   * @param {string} domain - Domain name
   * @returns {boolean} True if whitelisted
   */
  isDomainWhitelisted(domain) {
    return this.predefinedWhitelist.some(whitelisted => {
      return domain.includes(whitelisted) || whitelisted.includes(domain);
    });
  }

  /**
   * Get predefined blacklist domains
   * @returns {string[]} Array of blacklisted domains
   */
  getPredefinedBlacklist() {
    return [
      'adult',
      'porn',
      'xxx',
      'nsfw',
      'gambling',
      'casino',
      'bet',
      'dating',
      'escort',
      'hookup'
    ];
  }

  /**
   * Get predefined whitelist domains
   * @returns {string[]} Array of whitelisted domains
   */
  getPredefinedWhitelist() {
    return [
      'edu',
      'ac.uk',
      'gov',
      'org',
      'wikipedia',
      'coursera',
      'edx',
      'khanacademy',
      'mit.edu',
      'stanford.edu',
      'harvard.edu'
    ];
  }

  /**
   * Get category keywords mapping
   * @returns {Object} Category to keywords mapping
   */
  getCategoryKeywords() {
    return Object.entries(KEYWORD_DATABASE).reduce((acc, [categoryKey, categoryData]) => {
      acc[this.formatCategoryName(categoryKey)] = [...categoryData.keywords];
      return acc;
    }, {});
  }

  /**
   * Add custom keywords to category
   * @param {string} category - Category name
   * @param {string[]} keywords - Keywords to add
   */
  addCategoryKeywords(category, keywords) {
    if (!this.categoryKeywords[category]) {
      this.categoryKeywords[category] = [];
    }
    
    keywords.forEach(keyword => {
      if (!this.categoryKeywords[category].includes(keyword)) {
        this.categoryKeywords[category].push(keyword);
      }
    });
  }

  /**
   * Remove keywords from category
   * @param {string} category - Category name
   * @param {string[]} keywords - Keywords to remove
   */
  removeCategoryKeywords(category, keywords) {
    if (!this.categoryKeywords[category]) {
      return;
    }
    
    keywords.forEach(keyword => {
      const index = this.categoryKeywords[category].indexOf(keyword);
      if (index > -1) {
        this.categoryKeywords[category].splice(index, 1);
      }
    });
  }

  /**
   * Add domain to blacklist
   * @param {string} domain - Domain to add
   */
  addDomainToBlacklist(domain) {
    if (!this.predefinedBlacklist.includes(domain)) {
      this.predefinedBlacklist.push(domain);
    }
  }

  /**
   * Remove domain from blacklist
   * @param {string} domain - Domain to remove
   */
  removeDomainFromBlacklist(domain) {
    const index = this.predefinedBlacklist.indexOf(domain);
    if (index > -1) {
      this.predefinedBlacklist.splice(index, 1);
    }
  }

  /**
   * Add domain to whitelist
   * @param {string} domain - Domain to add
   */
  addDomainToWhitelist(domain) {
    if (!this.predefinedWhitelist.includes(domain)) {
      this.predefinedWhitelist.push(domain);
    }
  }

  /**
   * Remove domain from whitelist
   * @param {string} domain - Domain to remove
   */
  removeDomainFromWhitelist(domain) {
    const index = this.predefinedWhitelist.indexOf(domain);
    if (index > -1) {
      this.predefinedWhitelist.splice(index, 1);
    }
  }

  /**
   * Get all available categories
   * @returns {string[]} Array of category names
   */
  getAvailableCategories() {
    return Object.keys(this.categoryKeywords);
  }

  /**
   * Get keywords for specific category
   * @param {string} category - Category name
   * @returns {string[]} Array of keywords
   */
  getCategoryKeywordsList(category) {
    return this.categoryKeywords[category] || [];
  }

  /**
   * Export keyword data
   * @returns {Object} Keyword data object
   */
  exportKeywordData() {
    return {
      blacklist: [...this.predefinedBlacklist],
      whitelist: [...this.predefinedWhitelist],
      categoryKeywords: { ...this.categoryKeywords }
    };
  }

  /**
   * Import keyword data
   * @param {Object} data - Keyword data object
   */
  importKeywordData(data) {
    if (data.blacklist) {
      this.predefinedBlacklist = [...data.blacklist];
    }
    
    if (data.whitelist) {
      this.predefinedWhitelist = [...data.whitelist];
    }
    
    if (data.categoryKeywords) {
      this.categoryKeywords = { ...data.categoryKeywords };
    }
  }

  /**
   * Format category key into readable name
   * @param {string} categoryKey - Category key
   * @returns {string} Readable category name
   */
  formatCategoryName(categoryKey = '') {
    return categoryKey
      .split('-')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeywordFallback;
}