/**
 * Model Loader for FocusGuard
 * Handles ONNX model loading and inference
 */

class ModelLoader {
  constructor() {
    this.textClassifierSession = null;
    this.nsfwClassifierSession = null;
    this.inferenceCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.isInitialized = false;
  }

  /**
   * Initialize ONNX Runtime Web
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if ONNX Runtime Web is available
      const runtimeScope = typeof globalThis !== 'undefined' ? globalThis : self;
      if (typeof runtimeScope.ort === 'undefined') {
        // Load ONNX Runtime Web script
        await this.loadONNXRuntime();
      }

      this.isInitialized = true;
      console.log('FocusGuard: Model loader initialized');
    } catch (error) {
      console.error('FocusGuard: Failed to initialize model loader:', error);
      throw error;
    }
  }

  /**
   * Load ONNX Runtime Web script
   * @returns {Promise<void>}
   */
  async loadONNXRuntime() {
    // Service workers and other worker contexts do not have document access
    if (typeof importScripts === 'function') {
      try {
        importScripts(chrome.runtime.getURL('lib/onnx-runtime-web.min.js'));
        return;
      } catch (error) {
        console.error('FocusGuard: Failed to load ONNX Runtime via importScripts', error);
        throw error;
      }
    }

    if (typeof document !== 'undefined') {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('lib/onnx-runtime-web.min.js');
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    throw new Error('FocusGuard: Unsupported environment for loading ONNX Runtime');
  }

  /**
   * Load text classifier model
   * @returns {Promise<Object>} ONNX inference session
   */
  async loadTextClassifier() {
    if (this.textClassifierSession) {
      return this.textClassifierSession;
    }

    try {
      await this.initialize();

      // Load model from extension
      const modelUrl = chrome.runtime.getURL('models/text-classifier-model.onnx');
      
      // Create inference session
      this.textClassifierSession = await ort.InferenceSession.create(modelUrl);
      
      console.log('FocusGuard: Text classifier model loaded');
      return this.textClassifierSession;
    } catch (error) {
      console.error('FocusGuard: Failed to load text classifier:', error);
      throw error;
    }
  }

  /**
   * Load NSFW image classifier model
   * @returns {Promise<Object>} ONNX inference session
   */
  async loadNSFWClassifier() {
    if (this.nsfwClassifierSession) {
      return this.nsfwClassifierSession;
    }

    try {
      await this.initialize();

      // Load model from extension
      const modelUrl = chrome.runtime.getURL('models/nsfw-classifier-model.onnx');
      
      // Create inference session
      this.nsfwClassifierSession = await ort.InferenceSession.create(modelUrl);
      
      console.log('FocusGuard: NSFW classifier model loaded');
      return this.nsfwClassifierSession;
    } catch (error) {
      console.error('FocusGuard: Failed to load NSFW classifier:', error);
      throw error;
    }
  }

  /**
   * Run inference on content
   * @param {Object} session - ONNX inference session
   * @param {string|Object} input - Input data (text string or image data)
   * @param {string} type - Input type ('text' or 'image')
   * @returns {Promise<Object>} Classification result {category, confidence}
   */
  async runInference(session, input, type) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(input, type);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      let result;
      if (type === 'text') {
        result = await this.runTextInference(session, input);
      } else if (type === 'image') {
        result = await this.runImageInference(session, input);
      } else {
        throw new Error(`Unsupported input type: ${type}`);
      }

      // Cache result
      this.cacheResult(cacheKey, result);

      return result;
    } catch (error) {
      console.error('FocusGuard: Inference error:', error);
      return { category: 'unknown', confidence: 0.0 };
    }
  }

  /**
   * Run text classification inference
   * @param {Object} session - ONNX inference session
   * @param {string} text - Input text
   * @returns {Promise<Object>} Classification result
   */
  async runTextInference(session, text) {
    try {
      // Preprocess text (tokenization, embedding)
      const processedInput = await this.preprocessText(text);
      
      // Create tensor
      const inputTensor = new ort.Tensor('float32', processedInput.data, processedInput.shape);
      
      // Run inference
      const outputs = await session.run({ input: inputTensor });
      
      // Postprocess results
      const result = this.postprocessTextOutput(outputs);
      
      return result;
    } catch (error) {
      console.error('FocusGuard: Text inference error:', error);
      return { category: 'unknown', confidence: 0.0 };
    }
  }

  /**
   * Run image classification inference
   * @param {Object} session - ONNX inference session
   * @param {Object} imageData - Image data object
   * @returns {Promise<Object>} Classification result
   */
  async runImageInference(session, imageData) {
    try {
      // Preprocess image
      const processedInput = await this.preprocessImage(imageData);
      
      // Create tensor
      const inputTensor = new ort.Tensor('float32', processedInput.data, processedInput.shape);
      
      // Run inference
      const outputs = await session.run({ input: inputTensor });
      
      // Postprocess results
      const result = this.postprocessImageOutput(outputs);
      
      return result;
    } catch (error) {
      console.error('FocusGuard: Image inference error:', error);
      return { category: 'unknown', confidence: 0.0 };
    }
  }

  /**
   * Preprocess text for model input
   * @param {string} text - Input text
   * @returns {Promise<Object>} Processed input {data, shape}
   */
  async preprocessText(text) {
    // This is a placeholder implementation
    // In a real implementation, this would handle tokenization and embedding
    
    // Simple tokenization by splitting on whitespace and taking first 128 tokens
    const tokens = text.toLowerCase().split(/\s+/).slice(0, 128);
    
    // Convert to numerical representation (placeholder)
    const data = new Float32Array(128);
    tokens.forEach((token, index) => {
      // Simple hash-based token embedding (placeholder)
      data[index] = this.simpleTokenHash(token) / 1000.0;
    });
    
    return {
      data: data,
      shape: [1, 128]
    };
  }

  /**
   * Preprocess image for model input
   * @param {Object} imageData - Image data object
   * @returns {Promise<Object>} Processed input {data, shape}
   */
  async preprocessImage(imageData) {
    // This is a placeholder implementation
    // In a real implementation, this would load and preprocess the image
    
    // For now, return dummy data
    const size = 224; // Standard image size for many models
    const data = new Float32Array(3 * size * size);
    
    // Fill with dummy normalized pixel values
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random();
    }
    
    return {
      data: data,
      shape: [1, 3, size, size] // [batch, channels, height, width]
    };
  }

  /**
   * Postprocess text model output
   * @param {Object} outputs - Model outputs
   * @returns {Object} Classification result
   */
  postprocessTextOutput(outputs) {
    // This is a placeholder implementation
    // In a real implementation, this would convert model logits to categories
    
    const categories = [
      'Education', 'Technology', 'Science', 'Health', 'Business',
      'News', 'Sports', 'Entertainment', 'Gaming', 'Adult',
      'Politics', 'Agriculture'
    ];
    
    // Get output data (placeholder)
    const outputData = outputs.output?.data || new Float32Array(categories.length);
    
    // Find category with highest score
    let maxIndex = 0;
    let maxScore = outputData[0];
    
    for (let i = 1; i < outputData.length; i++) {
      if (outputData[i] > maxScore) {
        maxScore = outputData[i];
        maxIndex = i;
      }
    }
    
    // Apply softmax to get confidence
    const confidence = this.softmax(maxScore, outputData);
    
    return {
      category: categories[maxIndex] || 'unknown',
      confidence: confidence
    };
  }

  /**
   * Postprocess image model output
   * @param {Object} outputs - Model outputs
   * @returns {Object} Classification result
   */
  postprocessImageOutput(outputs) {
    // This is a placeholder implementation
    // NSFW classifier typically outputs [safe, unsafe] scores
    
    const outputData = outputs.output?.data || new Float32Array(2);
    const safeScore = outputData[0] || 0.9;
    const unsafeScore = outputData[1] || 0.1;
    
    const isNSFW = unsafeScore > safeScore;
    const confidence = Math.max(safeScore, unsafeScore);
    
    return {
      category: isNSFW ? 'Adult' : 'Safe',
      confidence: confidence,
      isNSFW: isNSFW
    };
  }

  /**
   * Simple token hash function (placeholder)
   * @param {string} token - Token to hash
   * @returns {number} Hash value
   */
  simpleTokenHash(token) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Apply softmax function
   * @param {number} value - Value to softmax
   * @param {Float32Array} allValues - All values for softmax
   * @returns {number} Softmax value
   */
  softmax(value, allValues) {
    const maxVal = Math.max(...allValues);
    const expValues = Array.from(allValues).map(v => Math.exp(v - maxVal));
    const sumExp = expValues.reduce((a, b) => a + b, 0);
    return Math.exp(value - maxVal) / sumExp;
  }

  /**
   * Generate cache key for input
   * @param {string|Object} input - Input data
   * @param {string} type - Input type
   * @returns {string} Cache key
   */
  generateCacheKey(input, type) {
    if (type === 'text') {
      return `text_${this.hashString(input.substring(0, 100))}`;
    } else if (type === 'image' && input.src) {
      return `image_${this.hashString(input.src)}`;
    }
    return `${type}_${Date.now()}`;
  }

  /**
   * Simple string hash
   * @param {string} str - String to hash
   * @returns {string} Hash string
   */
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Cache inference result
   * @param {string} key - Cache key
   * @param {Object} result - Result to cache
   */
  cacheResult(key, result) {
    this.inferenceCache.set(key, {
      result: result,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached result
   * @param {string} key - Cache key
   * @returns {Object|null} Cached result or null
   */
  getCachedResult(key) {
    const cached = this.inferenceCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.inferenceCache.delete(key);
    }
    
    return null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.inferenceCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.inferenceCache.size,
      timeout: this.cacheTimeout
    };
  }

  /**
   * Check if models are loaded
   * @returns {Object} Model status
   */
  getModelStatus() {
    return {
      initialized: this.isInitialized,
      textClassifierLoaded: !!this.textClassifierSession,
      nsfwClassifierLoaded: !!this.nsfwClassifierSession,
      cacheSize: this.inferenceCache.size
    };
  }

  /**
   * Unload models to free memory
   */
  unloadModels() {
    this.textClassifierSession = null;
    this.nsfwClassifierSession = null;
    this.clearCache();
    console.log('FocusGuard: Models unloaded');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModelLoader;
}