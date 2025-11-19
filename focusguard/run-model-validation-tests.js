#!/usr/bin/env node

/**
 * Test Runner for ONNX Model Validation
 * This script runs the validation test suite and generates reports
 */

const fs = require('fs');
const path = require('path');

// Load KeywordFallback
const KeywordFallbackCode = fs.readFileSync(path.join(__dirname, 'lib/keyword-fallback.js'), 'utf8');
eval(KeywordFallbackCode);

// Load FilterEngine
const FilterEngineCode = fs.readFileSync(path.join(__dirname, 'lib/filter-engine.js'), 'utf8');
eval(FilterEngineCode);

// Load test validator
const ValidatorCode = fs.readFileSync(path.join(__dirname, 'test-onnx-model-validation.js'), 'utf8');
eval(ValidatorCode);

/**
 * Run tests and generate reports
 */
async function runTests() {
  console.log('🚀 Starting ONNX Model Validation Test Suite\n');
  
  const validator = new ONNXModelValidator();
  const report = await validator.runAllTests();
  
  // Print console report
  validator.printReport(report);
  
  // Save reports
  const reportDir = path.join(__dirname, 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('-').slice(0, -1).join('-');
  
  // Save JSON report
  const jsonReportPath = path.join(reportDir, `model-validation-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, validator.exportAsJSON());
  console.log(`\n✅ JSON Report saved: ${jsonReportPath}`);
  
  // Save CSV report
  const csvReportPath = path.join(reportDir, `model-validation-${timestamp}.csv`);
  fs.writeFileSync(csvReportPath, validator.exportAsCSV());
  console.log(`✅ CSV Report saved: ${csvReportPath}`);
  
  // Determine exit code based on performance
  const accuracy = parseFloat(report.summary.accuracy);
  const falsePositiveRate = parseFloat(report.summary.falsePositiveRate);
  
  if (accuracy < 85 || falsePositiveRate > 10) {
    console.log('\n⚠️  Model performance below acceptable thresholds');
    process.exit(1);
  } else {
    console.log('\n✅ Model validation completed successfully');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
