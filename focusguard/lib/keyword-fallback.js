/**
 * Keyword Fallback for FocusGuard
 * Provides keyword-based classification when ML models are unavailable
 */

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
  classifyContent(text, domain) {
    if (!text && !domain) {
      return { category: 'unknown', confidence: 0.0 };
    }

    // Check domain blacklist first
    if (domain && this.isDomainBlacklisted(domain)) {
      return { category: 'Adult', confidence: 0.9 };
    }

    // Check domain whitelist
    if (domain && this.isDomainWhitelisted(domain)) {
      return { category: 'Education', confidence: 0.8 };
    }

    // Classify by text keywords
    if (text) {
      const textClassification = this.classifyByText(text);
      return textClassification;
    }

    return { category: 'unknown', confidence: 0.0 };
  }

  /**
   * Classify content by text keywords
   * @param {string} text - Text content
   * @returns {Object} Classification result {category, confidence}
   */
  classifyByText(text) {
    const lowerText = text.toLowerCase();
    const scores = {};

    // Calculate scores for each category
    Object.entries(this.categoryKeywords).forEach(([category, keywords]) => {
      scores[category] = this.calculateKeywordScore(lowerText, keywords);
    });

    // Find category with highest score
    let bestCategory = 'unknown';
    let bestScore = 0;

    Object.entries(scores).forEach(([category, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    // Convert score to confidence (0-1)
    const confidence = Math.min(bestScore / 10, 1.0);

    return {
      category: bestCategory,
      confidence: confidence
    };
  }

  /**
   * Calculate keyword score for text
   * @param {string} text - Lowercase text
   * @param {string[]} keywords - Keywords array
   * @returns {number} Score value
   */
  calculateKeywordScore(text, keywords) {
    let score = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    });

    return score;
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
    return {
      'Education': [
        'learn', 'study', 'education', 'school', 'university', 'college', 'course', 'lesson',
        'tutorial', 'academic', 'research', 'knowledge', 'teaching', 'student', 'professor',
        'classroom', 'curriculum', 'assignment', 'exam', 'textbook', 'library', 'lecture'
      ],
      'Technology': [
        'software', 'programming', 'code', 'developer', 'tech', 'computer', 'algorithm',
        'database', 'network', 'security', 'artificial intelligence', 'machine learning',
        'web development', 'app development', 'coding', 'javascript', 'python', 'java'
      ],
      'Science': [
        'research', 'experiment', 'scientific', 'biology', 'chemistry', 'physics',
        'mathematics', 'astronomy', 'medicine', 'healthcare', 'laboratory', 'discovery',
        'innovation', 'breakthrough', 'study', 'analysis', 'data', 'hypothesis'
      ],
      'Health': [
        'health', 'medical', 'fitness', 'wellness', 'nutrition', 'exercise', 'disease',
        'treatment', 'therapy', 'hospital', 'doctor', 'nurse', 'pharmacy', 'medication',
        'symptoms', 'diagnosis', 'prevention', 'mental health'
      ],
      'Business': [
        'business', 'finance', 'economy', 'investment', 'marketing', 'sales', 'entrepreneur',
        'startup', 'company', 'corporate', 'management', 'strategy', 'revenue', 'profit',
        'market', 'industry', 'commerce', 'trade'
      ],
      'News': [
        'news', 'breaking', 'report', 'journalist', 'article', 'headline', 'update',
        'current events', 'politics', 'world news', 'local news', 'investigation',
        'interview', 'press', 'media', 'broadcast'
      ],
      'Sports': [
        'sport', 'game', 'match', 'team', 'player', 'athlete', 'competition', 'tournament',
        'championship', 'league', 'score', 'victory', 'defeat', 'training', 'coach',
        'football', 'basketball', 'soccer', 'tennis', 'baseball'
      ],
      'Entertainment': [
        'movie', 'film', 'music', 'concert', 'show', 'theater', 'celebrity', 'actor',
        'actress', 'director', 'entertainment', 'hollywood', 'netflix', 'streaming',
        'tv show', 'series', 'drama', 'comedy'
      ],
      'Gaming': [
        'game', 'gaming', 'video game', 'console', 'playstation', 'xbox', 'nintendo',
        'pc gaming', 'esports', 'multiplayer', 'online game', 'mobile game', 'gamer',
        'achievement', 'level', 'quest', 'raid', 'pvp', 'mmo'
      ],
      'Adult': [
        'adult', 'porn', 'sex', 'erotic', 'nude', 'explicit', 'xxx', 'nsfw',
        'sexual', 'intimate', 'sensual', 'mature', '18+', 'adult content'
      ],
      'Politics': [
        'politics', 'political', 'government', 'election', 'vote', 'campaign',
        'policy', 'democracy', 'republic', 'congress', 'senate', 'president',
        'minister', 'parliament', 'legislation', 'political party'
      ],
      'Agriculture': [
        'agriculture', 'farming', 'crops', 'livestock', 'harvest', 'soil', 'irrigation',
        'pesticide', 'fertilizer', 'farm', 'rural', 'agricultural', 'cultivation'
      ]
    };
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeywordFallback;
}