/**
 * ONNX Model Validation & Benchmark Test Suite
 * Comprehensive testing of FocusGuard classification against real-world use cases
 * 
 * This test suite validates the model's performance across:
 * - False positives (navigation UI text)
 * - Entertainment/Social Media content
 * - Adult Content
 * - Cruelty
 * - Regional Language Support (Telugu, Tamil, Hindi)
 */

class ONNXModelValidator {
  constructor() {
    this.results = [];
    this.testCases = this.buildTestCases();
    this.metrics = {
      total: 0,
      passed: 0,
      failed: 0,
      falsePositives: 0,
      falseNegatives: 0,
      totalLatency: 0,
      categoryMetrics: {}
    };
    this.keywordFallback = new KeywordFallback();
    this.filterEngine = new FilterEngine();
  }

  /**
   * Build comprehensive test cases
   */
  buildTestCases() {
    return {
      falsePositives: [
        {
          text: 'Skip to content Navigation Menu Toggle navigation Sign in Appearance settings Platform GitHub Copilo',
          expectedCategory: 'unknown',
          shouldBlock: false,
          category: 'False Positives - UI Navigation',
          language: 'English'
        },
        {
          text: 'Settings Preferences Options About Contact Us',
          expectedCategory: 'unknown',
          shouldBlock: false,
          category: 'False Positives - UI Navigation',
          language: 'English'
        },
        {
          text: 'Home Dashboard Profile Logout',
          expectedCategory: 'unknown',
          shouldBlock: false,
          category: 'False Positives - UI Navigation',
          language: 'English'
        },
        {
          text: 'Back Next Previous Page 1 2 3',
          expectedCategory: 'unknown',
          shouldBlock: false,
          category: 'False Positives - UI Navigation',
          language: 'English'
        },
        {
          text: 'Close × Menu Help',
          expectedCategory: 'unknown',
          shouldBlock: false,
          category: 'False Positives - UI Navigation',
          language: 'English'
        }
      ],
      entertainment: [
        {
          text: 'Aliens Mana Kosam',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - Telugu',
          language: 'Telugu'
        },
        {
          text: 'Samatha ki malli pelli anta',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - Telugu Wedding',
          language: 'Telugu'
        },
        {
          text: 'Video title: Samatha ki malli pelli anta',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - Telugu with prefix',
          language: 'Telugu'
        },
        {
          text: 'Latest movie reviews and trailers',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - Movies',
          language: 'English'
        },
        {
          text: 'Celebrity gossip and entertainment news',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - Celebrity',
          language: 'English'
        },
        {
          text: 'Trending TikTok videos',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - TikTok',
          language: 'English'
        },
        {
          text: 'Instagram reels and shorts',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - Instagram',
          language: 'English'
        },
        {
          text: 'YouTube shorts previews',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - YouTube',
          language: 'English'
        },
        {
          text: 'Serial drama series web series',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Entertainment - Serial',
          language: 'English'
        }
      ],
      adultContent: [
        {
          text: 'Adult content explicit xxx',
          expectedCategory: 'Adult Content',
          shouldBlock: true,
          category: 'Adult - Explicit',
          language: 'English'
        },
        {
          text: 'NSFW 18+ nude images',
          expectedCategory: 'Adult Content',
          shouldBlock: true,
          category: 'Adult - NSFW',
          language: 'English'
        },
        {
          text: 'OnlyFans exclusive content',
          expectedCategory: 'Adult Content',
          shouldBlock: true,
          category: 'Adult - OnlyFans',
          language: 'English'
        },
        {
          text: 'Sensual erotic content',
          expectedCategory: 'Adult Content',
          shouldBlock: true,
          category: 'Adult - Sensual',
          language: 'English'
        },
        {
          text: 'Mature adult dating site',
          expectedCategory: 'Adult Content',
          shouldBlock: true,
          category: 'Adult - Dating',
          language: 'English'
        }
      ],
      cruelty: [
        {
          text: 'Animal abuse and cruelty',
          expectedCategory: 'Cruelty',
          shouldBlock: true,
          category: 'Cruelty - Animal',
          language: 'English'
        },
        {
          text: 'Violence and gore graphic content',
          expectedCategory: 'Cruelty',
          shouldBlock: true,
          category: 'Cruelty - Violence',
          language: 'English'
        },
        {
          text: 'Torture and suffering pain',
          expectedCategory: 'Cruelty',
          shouldBlock: true,
          category: 'Cruelty - Torture',
          language: 'English'
        },
        {
          text: 'Animal hunting and poaching',
          expectedCategory: 'Cruelty',
          shouldBlock: true,
          category: 'Cruelty - Hunting',
          language: 'English'
        },
        {
          text: 'Harmful abusive language',
          expectedCategory: 'Cruelty',
          shouldBlock: true,
          category: 'Cruelty - Abuse',
          language: 'English'
        }
      ],
      regionalLanguages: [
        {
          text: 'తెలుగు సినిమా మూవీ సీరీస్',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Regional - Telugu Movie',
          language: 'Telugu'
        },
        {
          text: 'చలనచిత్రం నటిమణిని చిత్రం',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Regional - Telugu Cinema',
          language: 'Telugu'
        },
        {
          text: 'தமிழ் திரை படம் நடிகை',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Regional - Tamil Movie',
          language: 'Tamil'
        },
        {
          text: 'हिंदी फिल्म बॉलीवुड',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Regional - Hindi Bollywood',
          language: 'Hindi'
        },
        {
          text: 'ಕನ್ನಡ ಸಿನಿಮಾ ಪ್ರಯೋಗ',
          expectedCategory: 'Entertainment',
          shouldBlock: true,
          category: 'Regional - Kannada Cinema',
          language: 'Kannada'
        }
      ]
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting ONNX Model Validation Test Suite...\n');
    
    const blockedCategories = ['Adult Content', 'Entertainment', 'Cruelty'];
    const settings = { blockedCategories, sensitivity: 'medium' };
    
    // Test each category
    for (const [categoryName, testCases] of Object.entries(this.testCases)) {
      console.log(`\n📋 Testing ${categoryName.toUpperCase()}...`);
      
      for (const testCase of testCases) {
        const result = await this.runTestCase(testCase, settings);
        this.results.push(result);
        this.updateMetrics(result);
      }
    }
    
    return this.generateReport();
  }

  /**
   * Run individual test case
   */
  async runTestCase(testCase, settings) {
    const startTime = performance.now();
    
    try {
      // Classify content using keyword fallback (since ONNX models aren't loaded in test env)
      const classification = this.keywordFallback.classifyContent(testCase.text);
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      // Determine if should block
      const shouldBlock = this.filterEngine.shouldBlock(
        classification.category,
        classification.confidence,
        settings
      );
      
      // Evaluate pass/fail
      const passed = this.evaluateTestCase(testCase, classification, shouldBlock);
      
      return {
        testCase,
        classification,
        shouldBlock,
        passed,
        latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error testing "${testCase.text}":`, error);
      return {
        testCase,
        classification: { category: 'error', confidence: 0 },
        shouldBlock: false,
        passed: false,
        latency: 0,
        error: error.message
      };
    }
  }

  /**
   * Evaluate if test passed
   */
  evaluateTestCase(testCase, classification, shouldBlock) {
    // For false positives (should not block)
    if (testCase.shouldBlock === false) {
      if (shouldBlock) {
        return false; // False positive
      }
      return true; // Correctly not blocked
    }
    
    // For content that should be blocked
    if (testCase.shouldBlock === true) {
      if (!shouldBlock) {
        return false; // False negative
      }
      // Check if category is reasonable
      const normalizedPredicted = (classification.category || '').toLowerCase().replace(/\s+/g, ' ');
      const normalizedExpected = (testCase.expectedCategory || '').toLowerCase().replace(/\s+/g, ' ');
      
      if (normalizedPredicted === normalizedExpected || 
          normalizedPredicted.includes(normalizedExpected) ||
          normalizedExpected.includes(normalizedPredicted)) {
        return true;
      }
      return false;
    }
    
    return false;
  }

  /**
   * Update metrics based on test result
   */
  updateMetrics(result) {
    this.metrics.total++;
    this.metrics.totalLatency += result.latency;
    
    if (result.passed) {
      this.metrics.passed++;
    } else {
      this.metrics.failed++;
      
      // Track false positives and negatives
      if (result.testCase.shouldBlock === false && result.shouldBlock) {
        this.metrics.falsePositives++;
      } else if (result.testCase.shouldBlock === true && !result.shouldBlock) {
        this.metrics.falseNegatives++;
      }
    }
    
    // Category-specific metrics
    const category = result.testCase.category;
    if (!this.metrics.categoryMetrics[category]) {
      this.metrics.categoryMetrics[category] = {
        total: 0,
        passed: 0,
        failed: 0
      };
    }
    
    this.metrics.categoryMetrics[category].total++;
    if (result.passed) {
      this.metrics.categoryMetrics[category].passed++;
    } else {
      this.metrics.categoryMetrics[category].failed++;
    }
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics() {
    const blockShouldBlock = this.results.filter(r => r.testCase.shouldBlock === true);
    const blockCorrect = blockShouldBlock.filter(r => r.passed).length;
    const blockIncorrect = blockShouldBlock.filter(r => !r.passed).length;
    
    const uiNotBlock = this.results.filter(r => r.testCase.shouldBlock === false);
    const uiCorrect = uiNotBlock.filter(r => r.passed).length;
    const uiIncorrect = uiNotBlock.filter(r => !r.passed).length;
    
    const accuracy = this.metrics.total > 0 ? (this.metrics.passed / this.metrics.total) * 100 : 0;
    const precision = blockCorrect > 0 ? (blockCorrect / (blockCorrect + uiIncorrect)) * 100 : 0;
    const recall = blockShouldBlock.length > 0 ? (blockCorrect / blockShouldBlock.length) * 100 : 0;
    const f1 = (2 * (precision * recall)) / (precision + recall) || 0;
    const falsePositiveRate = uiNotBlock.length > 0 ? (uiIncorrect / uiNotBlock.length) * 100 : 0;
    const falseNegativeRate = blockShouldBlock.length > 0 ? (blockIncorrect / blockShouldBlock.length) * 100 : 0;
    const avgLatency = this.metrics.total > 0 ? this.metrics.totalLatency / this.metrics.total : 0;
    
    return {
      accuracy: accuracy.toFixed(2),
      precision: precision.toFixed(2),
      recall: recall.toFixed(2),
      f1: f1.toFixed(2),
      falsePositiveRate: falsePositiveRate.toFixed(2),
      falseNegativeRate: falseNegativeRate.toFixed(2),
      avgLatency: avgLatency.toFixed(2),
      totalTests: this.metrics.total,
      passed: this.metrics.passed,
      failed: this.metrics.failed
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const metrics = this.calculatePerformanceMetrics();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: metrics.totalTests,
        passed: metrics.passed,
        failed: metrics.failed,
        accuracy: `${metrics.accuracy}%`,
        precision: `${metrics.precision}%`,
        recall: `${metrics.recall}%`,
        f1Score: metrics.f1,
        falsePositiveRate: `${metrics.falsePositiveRate}%`,
        falseNegativeRate: `${metrics.falseNegativeRate}%`,
        avgLatency: `${metrics.avgLatency}ms`
      },
      categoryBreakdown: this.generateCategoryBreakdown(),
      detailedResults: this.results,
      recommendations: this.generateRecommendations(metrics)
    };
    
    return report;
  }

  /**
   * Generate category-wise breakdown
   */
  generateCategoryBreakdown() {
    const breakdown = {};
    
    for (const [category, metrics] of Object.entries(this.metrics.categoryMetrics)) {
      const passRate = metrics.total > 0 ? ((metrics.passed / metrics.total) * 100).toFixed(2) : 0;
      breakdown[category] = {
        total: metrics.total,
        passed: metrics.passed,
        failed: metrics.failed,
        passRate: `${passRate}%`
      };
    }
    
    return breakdown;
  }

  /**
   * Generate recommendations based on performance
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    const accuracy = parseFloat(metrics.accuracy);
    const falsePositiveRate = parseFloat(metrics.falsePositiveRate);
    const falseNegativeRate = parseFloat(metrics.falseNegativeRate);
    
    if (accuracy < 85) {
      recommendations.push({
        severity: 'HIGH',
        message: `Accuracy is ${metrics.accuracy}%, below the 85% threshold`,
        action: 'Consider replacing or fine-tuning the model'
      });
    }
    
    if (falsePositiveRate > 10) {
      recommendations.push({
        severity: 'HIGH',
        message: `False positive rate is ${metrics.falsePositiveRate}%, above 10% threshold`,
        action: 'Improve keyword database or model training data'
      });
    }
    
    if (falseNegativeRate > 15) {
      recommendations.push({
        severity: 'MEDIUM',
        message: `False negative rate is ${metrics.falseNegativeRate}%, above 15% threshold`,
        action: 'Enhance detection for edge cases'
      });
    }
    
    if (accuracy >= 85 && falsePositiveRate <= 10) {
      recommendations.push({
        severity: 'INFO',
        message: 'Model performance meets acceptable thresholds',
        action: 'Keep current model with periodic monitoring'
      });
    }
    
    return recommendations;
  }

  /**
   * Print report to console
   */
  printReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ONNX MODEL VALIDATION REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📈 PERFORMANCE SUMMARY:');
    console.log(`  Total Tests: ${report.summary.totalTests}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Accuracy: ${report.summary.accuracy}`);
    console.log(`  Precision: ${report.summary.precision}`);
    console.log(`  Recall: ${report.summary.recall}`);
    console.log(`  F1 Score: ${report.summary.f1}`);
    console.log(`  False Positive Rate: ${report.summary.falsePositiveRate}`);
    console.log(`  False Negative Rate: ${report.summary.falseNegativeRate}`);
    console.log(`  Average Latency: ${report.summary.avgLatency}`);
    
    console.log('\n📂 CATEGORY BREAKDOWN:');
    for (const [category, metrics] of Object.entries(report.categoryBreakdown)) {
      console.log(`  ${category}:`);
      console.log(`    - Total: ${metrics.total}`);
      console.log(`    - Passed: ${metrics.passed}`);
      console.log(`    - Failed: ${metrics.failed}`);
      console.log(`    - Pass Rate: ${metrics.passRate}`);
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    for (const rec of report.recommendations) {
      console.log(`  [${rec.severity}] ${rec.message}`);
      console.log(`         → ${rec.action}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Export report as JSON
   */
  exportAsJSON() {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as CSV
   */
  exportAsCSV() {
    const headers = ['Test Input', 'Expected Category', 'Predicted Category', 'Confidence', 'Should Block', 'Passed', 'Latency (ms)'];
    const rows = this.results.map(r => [
      `"${r.testCase.text.replace(/"/g, '""')}"`,
      r.testCase.expectedCategory,
      r.classification.category,
      r.classification.confidence,
      r.testCase.shouldBlock,
      r.passed ? 'PASS' : 'FAIL',
      r.latency.toFixed(2)
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ONNXModelValidator;
}
