# FocusGuard Setup Guide

## Prerequisites

- **Google Chrome** (version 88 or later)
- **Basic understanding** of Chrome extensions
- **ONNX models** (optional, see Model Setup section)

## Installation Steps

### 1. Clone or Download the Repository

```bash
# Clone the repository
git clone <repository-url>
cd focusguard

# Or download and extract the ZIP file
```

### 2. Model Setup (Optional but Recommended)

To enable AI-powered content classification, you need to add ONNX models:

#### Option A: Use Pre-trained Models (Recommended)

1. **Download Text Classification Model**:
   - Visit: https://huggingface.co/models?library=onnx&pipeline=text-classification
   - Recommended: `distilbert-base-uncased-finetuned-sst-2-english` or similar
   - Download the `.onnx` file
   - Rename to: `text-classifier-model.onnx`
   - Place in: `focusguard/models/`

2. **Download NSFW Classification Model**:
   - Visit: https://github.com/onnx/models/tree/main/vision/classification/efficientnet-lite4
   - Or search for "NSFW classification ONNX model"
   - Download the `.onnx` file
   - Rename to: `nsfw-classifier-model.onnx`
   - Place in: `focusguard/models/`

#### Option B: Create Custom Models

1. **Train Text Classifier**:
   ```python
   # Using Hugging Face Transformers
   from transformers import AutoTokenizer, AutoModelForSequenceClassification
   import torch
   
   model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=12)
   tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
   
   # Export to ONNX
   dummy_input = tokenizer("Sample text", return_tensors="pt")
   torch.onnx.export(
       model,
       (dummy_input['input_ids'], dummy_input['attention_mask']),
       "text-classifier-model.onnx",
       input_names=['input_ids', 'attention_mask'],
       output_names=['output'],
       dynamic_axes={'input_ids': {0: 'batch', 1: 'sequence'}, 'attention_mask': {0: 'batch', 1: 'sequence'}}
   )
   ```

2. **Train NSFW Classifier**:
   ```python
   # Using PyTorch
   import torch
   import torchvision.models as models
   
   model = models.mobilenet_v2(pretrained=True)
   model.classifier[1] = torch.nn.Linear(model.last_channel, 2)  # NSFW/Safe
   
   # Export to ONNX
   dummy_input = torch.randn(1, 3, 224, 224)
   torch.onnx.export(
       model,
       dummy_input,
       "nsfw-classifier-model.onnx",
       input_names=['input'],
       output_names=['output']
   )
   ```

#### Option C: Use ONNX Runtime Web CDN

If you don't want to host models locally:

1. Edit `manifest.json`:
   ```json
   "web_accessible_resources": [
     {
       "resources": [
         "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js",
         "https://your-cdn.com/models/*"
       ],
       "matches": ["<all_urls>"]
     }
   ]
   ```

2. Update `lib/model-loader.js` to use CDN URLs

### 3. Install Dependencies (if using build tools)

```bash
# If you want to use npm for development tools
npm install

# Or if using yarn
yarn install
```

### 4. Load Extension in Chrome

1. **Open Chrome Extensions**:
   - Go to `chrome://extensions/`
   - Or: Chrome menu → More tools → Extensions

2. **Enable Developer Mode**:
   - Toggle "Developer mode" switch (top right)

3. **Load Unpacked Extension**:
   - Click "Load unpacked" button
   - Select the `focusguard` directory
   - Extension will appear in your extensions list

### 5. Verify Installation

1. **Check Extension Icon**:
   - Look for FocusGuard icon in Chrome toolbar
   - If not visible, click puzzle piece → Pin FocusGuard

2. **Test Basic Functionality**:
   - Navigate to any website
   - Click FocusGuard icon
   - Toggle the master switch
   - Verify popup loads correctly

3. **Open Options Page**:
   - Right-click FocusGuard icon → Options
   - Or click "Settings" in popup
   - Verify all sections load correctly

## Configuration

### 1. Initial Setup

1. **Open Options Page**:
   - Click FocusGuard icon → Settings

2. **Configure Categories**:
   - Add categories to "Allowed Categories" (content you want to see)
   - Add categories to "Blocked Categories" (content to filter)
   - Example: Allow ["Education", "Technology"], Block ["Adult", "Gaming"]

3. **Set Filtering Mode**:
   - **Blur Mode**: Content blurred but accessible on hover
   - **Block Mode**: Content completely removed

4. **Choose Personality**:
   - **Balanced Mode**: Block only items in block list
   - **Strict Mode**: Block everything not in allow list

5. **Adjust Sensitivity**:
   - **Low**: 50% confidence threshold (more aggressive filtering)
   - **Medium**: 70% confidence threshold (balanced)
   - **High**: 90% confidence threshold (conservative)

### 2. Domain Management

1. **Block Specific Domains**:
   - Visit website you want to block
   - Click FocusGuard icon → "Block this domain"
   - Or add manually in Options → Domain Management

2. **Allow Specific Domains**:
   - Add trusted domains to allow list
   - Content from these domains will never be blocked

### 3. Testing Configuration

1. **Test with News Sites**:
   - Visit `https://news.ycombinator.com` or `https://reddit.com`
   - Observe filtering in action

2. **Test with Educational Sites**:
   - Visit `https://wikipedia.org` or `https://coursera.org`
   - Verify content is allowed if in allow list

3. **Test Analytics**:
   - Browse for a few minutes
   - Check analytics in Options page
   - Verify block counts are tracked

## Troubleshooting

### Common Issues

#### Extension Not Loading
**Problem**: Extension doesn't appear after loading
**Solution**:
1. Check for manifest.json syntax errors
2. Verify all files exist in correct locations
3. Look for errors in `chrome://extensions/` (click "Errors" button)

#### Models Not Working
**Problem**: No AI classification happening
**Solution**:
1. Verify ONNX models are in `models/` folder
2. Check browser console for model loading errors
3. Ensure models are compatible with ONNX Runtime Web

#### Content Not Being Filtered
**Problem**: Extension active but no filtering occurs
**Solution**:
1. Check if extension is enabled for current tab
2. Verify categories are properly configured
3. Check sensitivity settings
4. Enable debug mode to see console logs

#### Performance Issues
**Problem**: Slow page loading or high CPU usage
**Solution**:
1. Reduce sensitivity to decrease classification frequency
2. Enable debug mode to identify bottlenecks
3. Consider using smaller models

#### Storage Issues
**Problem**: Settings not saving or syncing
**Solution**:
1. Check Chrome sync is enabled
2. Verify storage quota isn't exceeded
3. Clear extension data and reconfigure

### Debug Mode

Enable debug mode to troubleshoot:

1. **Enable Debug Mode**:
   - Options → Developer & Debug → Enable "Debug Mode"

2. **Check Console Logs**:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for "FocusGuard:" prefixed logs

3. **Monitor Network**:
   - Check Network tab for model loading
   - Verify no failed requests

4. **Performance Profiling**:
   - Use Performance tab to identify bottlenecks
   - Look for long-running classification tasks

## Advanced Setup

### 1. Custom Model Integration

To use custom models:

1. **Update Model Loader**:
   ```javascript
   // In lib/model-loader.js
   async loadCustomClassifier() {
     const modelUrl = chrome.runtime.getURL('models/custom-model.onnx');
     return await ort.InferenceSession.create(modelUrl);
   }
   ```

2. **Update Categories**:
   ```javascript
   // In lib/keyword-fallback.js
   getCategoryKeywords() {
     return {
       'CustomCategory1': ['keyword1', 'keyword2'],
       'CustomCategory2': ['keyword3', 'keyword4']
     };
   }
   ```

### 2. Development Environment

For active development:

1. **Install Development Tools**:
   ```bash
   npm install --save-dev eslint prettier
   ```

2. **Setup ESLint**:
   ```json
   // .eslintrc.json
   {
     "extends": ["eslint:recommended"],
     "env": {"browser": true, "webextensions": true}
   }
   ```

3. **Enable Auto-Reload**:
   - Use Chrome Extension Reloader extension
   - Or manually reload at `chrome://extensions/`

### 3. Build Process

For production builds:

1. **Minify JavaScript**:
   ```bash
   npm install --save-dev terser
   npx terser lib/*.js --compress --mangle -o dist/
   ```

2. **Optimize CSS**:
   ```bash
   npm install --save-dev clean-css-cli
   cleancss -o dist/ styles/*.css
   ```

3. **Package Extension**:
   ```bash
   zip -r focusguard-v1.0.0.zip focusguard/ -x "*.git*" "*node_modules*"
   ```

## Performance Optimization

### 1. Model Optimization

- **Quantize Models**: Use int8 quantization for smaller size
- **Model Pruning**: Remove unnecessary layers
- **Batch Processing**: Process multiple items together

### 2. Caching Strategy

- **Inference Cache**: Cache classification results
- **Model Cache**: Keep models in memory when active
- **Domain Cache**: Cache domain classifications

### 3. Resource Management

- **Lazy Loading**: Load models only when needed
- **Memory Cleanup**: Clear unused data periodically
- **Background Processing**: Offload heavy tasks to background

## Security Considerations

### 1. Model Security

- **Model Validation**: Verify model integrity
- **Input Sanitization**: Clean all inputs to models
- **Output Validation**: Verify model outputs

### 2. Data Privacy

- **Local Processing**: All processing happens locally
- **No Telemetry**: No data sent to external servers
- **User Control**: Users control all data

### 3. Extension Security

- **CSP Compliance**: Follow Content Security Policy
- **Permission Minimization**: Request only necessary permissions
- **Input Validation**: Sanitize all user inputs

## Support

### 1. Documentation

- **Architecture**: See `docs/ARCHITECTURE.md`
- **API Reference**: See `docs/API.md`
- **Testing Guide**: See `docs/TESTING.md`

### 2. Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share experiences
- **Wiki**: Community-maintained documentation

### 3. Contributing

1. **Fork Repository**
2. **Create Feature Branch**
3. **Make Changes**
4. **Add Tests**
5. **Submit Pull Request**

## Next Steps

After completing setup:

1. **Test Thoroughly**: Verify all features work as expected
2. **Customize Settings**: Configure for your specific needs
3. **Monitor Performance**: Keep an eye on resource usage
4. **Provide Feedback**: Help improve the extension

Enjoy using FocusGuard to stay focused and productive!