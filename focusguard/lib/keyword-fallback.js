/**
 * Keyword Fallback for FocusGuard
 * Provides keyword-based classification when ML models are unavailable
 */

const KEYWORD_DATABASE = {
  'social-media': {
    keywords: [
      'instagram', 'tiktok', 'snapchat', 'reels', 'reel', 'tweet', 'facebook', 'reddit', 'dancing', 'viral', 'trending',
      'shorts', 'youtube', 'pinterest', 'tumblr', 'discord', 'twitch', 'livestream', 'streamer',
      'followers', 'influencer', 'likes', 'shares', 'comment', 'subscribe', 'channel',
      'meme', 'memes', 'funny', 'humor', 'comedy', 'prank', 'challenge',
      'vlog', 'vlogging', 'vlogger', 'selfie', 'selfies', 'photoshoot',
      'মালা', 'కోసం', 'కోసమైన', 'సోషల్', 'సిరీజ్', 'కలక్షన్', 'కన్నడ', 'తెలుగు',
      'পর্ব', 'পর্ব', 'সিরিজ', 'বাংলা', 'হিন্দি', 'তামিল'
    ],
    confidence: 0.9
  },
  'adult-content': {
    keywords: [
      'xxx', 'adult', 'porn', 'nude', 'nsfw', '18+', 'onlyfans', 'sensual',
      'sexy', 'erotic', 'explicit', 'mature', 'sex', 'xxx18', 'girls', 'men',
      'hot', 'exclusive', 'private', 'amateur', 'homemade'
    ],
    confidence: 0.95
  },
  'entertainment': {
    keywords: [
      'movie', 'film', 'entertainment', 'watch', 'video', 'music', 'song', 'show', 'concert', 'series',
      'drama', 'comedy', 'action', 'thriller', 'horror', 'romance', 'documentary', 'cartoon',
      'anime', 'animated', 'animation', 'episode', 'season', 'sequel', 'premiere', 'release',
      'actor', 'actress', 'director', 'cast', 'plot', 'review', 'trailer',
      'తెలుగు', 'తెలుగు సినిమా', 'తెలుగు సీరీస్', 'తెలుగు చిత్రం', 'తెలుగు నటురు',
      'తామిల్', 'కన్నడ', 'మలయాళం', 'हिंदी', 'मराठी', 'ভাষা', 'সিনেমা', 'নাটক',
      'پندہ', 'فلم', 'ڈراما', 'سیریز', 'ویڈیو',
      'malla', 'kosam', 'kani', 'pelli', 'anta', 'samatha', 'aliens', 'serial',
      'web series', 'webseries', 'web-series', 'short film', 'shortfilm'
    ],
    confidence: 0.7
  },
  'gaming': {
    keywords: [
      'game', 'gaming', 'play', 'gamer', 'esports', 'twitch', 'discord', 'livestream',
      'stream', 'streaming', 'streams', 'streamer', 'e-sports', 'esports', 'tournament',
      'rank', 'ranking', 'level', 'character', 'item', 'loot', 'achievement',
      'fps', 'moba', 'rpg', 'mmorpg', 'rts', 'tactical', 'strategy',
      'player', 'pro', 'pro-player', 'professional', 'team', 'guild', 'clan'
    ],
    confidence: 0.8
  },
  'violence': {
    keywords: [
      'fight', 'war', 'kill', 'death', 'violent', 'attack', 'weapon', 'blood',
      'gore', 'graphic', 'brutal', 'murder', 'assault', 'combat', 'battle',
      'explosion', 'crash', 'accident', 'injury', 'injured', 'wounded',
      'gun', 'knife', 'sword', 'bomb', 'explosive', 'terrorism', 'terror'
    ],
    confidence: 0.85
  },
  'cruelty': {
    keywords: [
      'animal', 'abuse', 'cruel', 'cruelty', 'torture', 'hurt', 'harm',
      'suffering', 'suffer', 'pain', 'painful', 'mistreatment', 'neglect',
      'animal abuse', 'animal cruelty', 'animal suffering', 'endangered', 'extinct',
      'hunting', 'kill animal', 'poaching', 'slaughter'
    ],
    confidence: 0.85
  },
  'politics': {
    keywords: [
      'politics', 'political', 'democrat', 'republican', 'election', 'president', 'vote', 'campaign',
      'government', 'policy', 'law', 'parliament', 'congress', 'senate', 'representative',
      'minister', 'minister', 'party', 'political party', 'voting', 'ballot',
      'politician', 'political leader', 'political candidate', 'political debate'
    ],
    confidence: 0.8
  },
  'news': {
    keywords: [
      'news', 'breaking', 'headline', 'report', 'story', 'update',
      'latest', 'today', 'breaking news', 'news update', 'news story',
      'incident', 'event', 'happening', 'current', 'trending news', 'top stories'
    ],
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
   * @param {string|Object} text - Text content or media object to classify
   * @param {string} domain - Domain name
   * @returns {Object} Classification result {category, confidence}
   */
  static classifyByKeywords(text, domain) {
    const fallback = new KeywordFallback();
    return fallback.classifyContent(text, domain);
  }

  /**
   * Classify content instance method
   * @param {string|Object} text - Text content or media object to classify
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

      // Extract text from media objects if needed
      const extractedText = this.extractTextFromContent(text);
      
      if (!extractedText) {
        console.warn('FocusGuard: No extractable text found for classification');
        return { category: 'unknown', confidence: 0.0 };
      }

      if (typeof extractedText !== 'string') {
        console.warn('FocusGuard: Invalid text input for classification', typeof extractedText, extractedText);
        text = String(extractedText);
      }

      if (this.isGenericUIText(extractedText)) {
        console.debug(`FocusGuard: Skipping generic UI text: "${extractedText}"`);
        return { category: 'unknown', confidence: 0.0 };
      }

      const result = this.classifyByText(extractedText, domain);
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
   * Check if text is likely generic UI text (navigation, menu, etc.)
   * @param {string} text - Text to check
   * @returns {boolean} True if text appears to be generic UI
   */
  isGenericUIText(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const lowerText = text.toLowerCase().trim();

    const genericUIPatterns = [
      /^(skip|skip to|go to|jump to|menu|navigation|nav|breadcrumb|footer|header|sidebar|search|login|sign in|register|account|settings|language|theme|dark mode|light mode|help|about|contact|feedback|report|subscribe|terms|privacy|policy|cookie|advertisement|ad|ads|sponsored|trending|popular|recommended|related|more|load|loading|click|share|print|email|download|save|delete|edit|view|show|hide|expand|collapse)\s*(content|menu|link|button|action|here)?$/i,
      /^(skip|home|back|next|previous|page|page \d+|1|2|3)$/i,
      /^\s*(close|x|✕|×|✓|√|✔|→|←|↑|↓|…|⋮|⋯)\s*$/i,
      /^(loading\.\.\.|please wait|coming soon|unavailable)$/i,
      /^(you|me|him|her|it|they|we|all|any|some|none|nothing|everything|something)$/i,
      /^(and|or|but|with|from|to|for|in|on|at|by|as|is|are|be|have|has|was|were|can|will|do|does)$/i,
      /^\s*[\d\s.,;:!?-]*\s*$/,
      /^(new|old|first|last|best|worst|top|bottom|high|low|hot|cold)$/i
    ];

    if (genericUIPatterns.some(pattern => pattern.test(lowerText))) {
      return true;
    }

    if (lowerText.split(/\s+/).length < 2) {
      return true;
    }

    return false;
  }

  /**
   * Extract text from various content types (text, images, videos)
   * @param {string|Object} content - Content to extract text from
   * @returns {string|null} Extracted text or null if no text found
   */
  extractTextFromContent(content) {
    // If it's already a string, return it directly
    if (typeof content === 'string') {
      return content.trim() || null;
    }

    // If it's not an object, return null
    if (!content || typeof content !== 'object') {
      return null;
    }

    const textSources = [];

    // Handle image objects
    if (content.src || content.alt !== undefined) {
      // Add alt text
      if (content.alt && typeof content.alt === 'string' && content.alt.trim()) {
        textSources.push(content.alt.trim());
      }

      // Add title from src if it's a blob URL (try to extract from filename)
      if (content.src && typeof content.src === 'string') {
        if (content.src.startsWith('blob:')) {
          // For blob URLs, we can't extract much, but we can note it's media
          textSources.push('media content');
        } else {
          // Try to extract filename from URL
          try {
            const url = new URL(content.src);
            const filename = url.pathname.split('/').pop();
            if (filename && filename !== '') {
              // Remove extension and decode
              const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
              const decodedName = decodeURIComponent(nameWithoutExt);
              if (decodedName && decodedName.length > 2) {
                textSources.push(decodedName.replace(/[-_]/g, ' '));
              }
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      }
    }

    // Handle video objects
    if (content.poster !== undefined || content.duration !== undefined) {
      // Add poster text (extract filename like images)
      if (content.poster && typeof content.poster === 'string' && content.poster.trim()) {
        try {
          const url = new URL(content.poster);
          const filename = url.pathname.split('/').pop();
          if (filename && filename !== '') {
            const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
            const decodedName = decodeURIComponent(nameWithoutExt);
            if (decodedName && decodedName.length > 2) {
              textSources.push(decodedName.replace(/[-_]/g, ' '));
            }
          }
        } catch (e) {
          // Invalid URL, use as-is if it's not a URL
          if (!content.poster.includes('://')) {
            textSources.push(content.poster.trim());
          }
        }
      }

      // Add generic video indicator
      textSources.push('video content');
    }

    // Handle any other text properties
    if (content.title && typeof content.title === 'string' && content.title.trim()) {
      textSources.push(content.title.trim());
    }

    if (content.description && typeof content.description === 'string' && content.description.trim()) {
      textSources.push(content.description.trim());
    }

    if (content.caption && typeof content.caption === 'string' && content.caption.trim()) {
      textSources.push(content.caption.trim());
    }

    // Combine all text sources
    if (textSources.length === 0) {
      return null;
    }

    const combinedText = textSources.join(' ').trim();
    return combinedText || null;
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