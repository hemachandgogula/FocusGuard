# FocusGuard

> AI-powered content filtering Chrome extension that helps you stay focused by blocking distracting content.

![FocusGuard Icon](icons/icon-focus.svg)

## 🚀 Features

### 🧠 AI-Powered Classification
- **Text Classification**: Categorizes text content into 12+ categories
- **Image Classification**: NSFW detection using computer vision
- **Video Content**: Identifies and filters video content
- **On-Device Processing**: All ML models run locally for privacy

### 🎯 Smart Filtering
- **Filter Modes**: 
  - **Blur Mode**: Content blurred but accessible on hover
  - **Block Mode**: Content completely removed with placeholders
- **Block-List-Only Model**: Simple and intuitive - everything is allowed by default, only block what you explicitly select
- **Sensitivity Levels**: Low (50%), Medium (70%), High (90%) confidence thresholds

### 📋 Category Management
- **11 Suggested Categories**: Adult Content, Entertainment, Cruelty, Gambling, Violence, Politics, Gaming, Social Media, Shopping, News, Sports
- **Custom Categories**: Add your own categories to the block list
- **Default Blocked**: Adult Content, Entertainment, Cruelty (easily customizable)
- **Domain Management**: Allow or block specific domains

### 📊 Analytics & Insights
- **Real-time Statistics**: Track text, image, and video blocks
- **Daily Reset**: Automatic midnight reset for fresh start
- **Top Blocked Domains**: See which sites trigger most filters
- **Historical Data**: 30-day history of blocking patterns
- **Export Data**: Download your analytics as JSON

### 🎨 User Interface
- **Modern Design**: Gradient header, smooth animations, card-based layout
- **Comprehensive Options**: Full settings management with intuitive category grid
- **Real-time Updates**: Instant feedback with toast notifications
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Color Scheme**: Professional blue/purple gradients with accessible contrast

### ⚡ Performance
- **Optimized Scanning**: MutationObserver with debouncing
- **Batch Processing**: Efficient content classification
- **Smart Caching**: 5-minute TTL for classification results
- **Memory Management**: Automatic cleanup and optimization

## 🛠️ Installation

### Option 1: Chrome Web Store (Recommended)
1. Visit Chrome Web Store
2. Search "FocusGuard"
3. Click "Add to Chrome"
4. Grant permissions
5. Configure settings

### Option 2: Developer Installation
1. Clone this repository
2. Open Chrome Extensions (`chrome://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `focusguard` directory

## 📖 Quick Start

### 1. Initial Setup
1. Click FocusGuard icon in Chrome toolbar
2. Open Settings (⚙️ button)
3. Select **Blocked Categories** (default: Adult Content, Entertainment, Cruelty)
4. Add custom categories if needed
5. Choose your filter mode (Blur vs Block)
6. Adjust sensitivity if desired

### 2. Basic Usage
- **Toggle Extension**: Use master switch in popup or options
- **Select Categories**: Click category cards to block/unblock
- **Add Custom**: Type name and click "+ Add Custom"
- **Block Domain**: Click "Block this domain" in popup
- **View Statistics**: Check daily block counts and top categories

### 3. Advanced Configuration
- **Sensitivity Adjustment**: Fine-tune confidence thresholds (Low/Medium/High)
- **Custom Categories**: Add any content type to your block list
- **Domain Lists**: Manage allow/block lists for specific sites
- **Reset to Defaults**: Quickly restore default blocked categories

## 🏗️ Architecture

FocusGuard follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup UI     │    │  Options Page   │    │ Content Script  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Background SW   │
                    │ (Coordination) │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Storage Layer   │
                    │  (Sync/Local)  │
                    └─────────────────┘
```

### Core Components

- **Background Service Worker**: Central coordination and state management
- **Content Script**: Real-time DOM monitoring and filtering
- **Storage Manager**: Chrome storage abstraction layer
- **Analytics Manager**: Statistics tracking and reporting
- **DOM Scanner**: Content extraction and change detection
- **Filter Engine**: Classification logic and filter application
- **Model Loader**: ONNX model loading and inference
- **Keyword Fallback**: Backup classification method

For detailed architecture information, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🔧 Configuration

### Categories

FocusGuard includes 12 default categories:

| Category | Description | Typical Content |
|----------|-------------|------------------|
| Education | Learning and academic content | Courses, tutorials, research |
| Technology | Tech news and development | Programming, gadgets, startups |
| Science | Scientific content | Research, discoveries, experiments |
| Health | Medical and wellness content | Health tips, medical news |
| Business | Business and finance | Companies, markets, entrepreneurship |
| News | Current events and journalism | Articles, reports, journalism |
| Sports | Sports content and news | Games, teams, athletes |
| Entertainment | Media and entertainment | Movies, music, TV shows |
| Gaming | Video games and gaming | Games, streaming, esports |
| Adult | Adult content | NSFW, mature content |
| Politics | Political content | Elections, government, policy |
| Agriculture | Farming and agriculture | Crops, livestock, farming |

### Filtering Modes

#### Blur Mode
- Content is blurred with CSS filters
- Hover to temporarily reveal content
- Click to permanently unblur
- Progressive blur based on sensitivity

#### Block Mode
- Content is completely removed
- Replaced with informative placeholders
- Click "Show content" to reveal
- Category-specific placeholder colors

### Mode Personalities

#### Balanced Mode (Default)
- **Logic**: Block only items in your block list
- **Best for**: General browsing with minimal interference
- **Use case**: Block specific distractions while allowing most content

#### Strict Mode
- **Logic**: Block everything not in your allow list
- **Best for**: Maximum focus and productivity
- **Use case**: Deep work sessions with minimal distractions

### Sensitivity Levels

| Level | Confidence | Use Case |
|--------|-------------|-----------|
| Low | 50% | More aggressive filtering, catches borderline content |
| Medium | 70% | Balanced approach, recommended for most users |
| High | 90% | Conservative filtering, only blocks high-confidence matches |

## 📊 Analytics

FocusGuard tracks comprehensive analytics to help you understand your browsing patterns:

### Metrics Tracked
- **Daily Block Counts**: Text, image, and video blocks
- **Domain Statistics**: Which sites trigger most filters
- **Category Breakdown**: Content categories being filtered
- **Session Data**: Browsing sessions and focus periods
- **Action Log**: Recent filtering actions with timestamps

### Data Privacy
- **Local Processing**: All analytics stored locally
- **No Telemetry**: No data sent to external servers
- **User Control**: Full export and delete capabilities
- **Anonymous Data**: No personal information collected

### Analytics Dashboard
- **Real-time Updates**: Live statistics as you browse
- **Historical Trends**: 30-day history and patterns
- **Top Domains**: Most frequently blocked sites
- **Export Functionality**: Download data as JSON

## 🤖 AI Models

FocusGuard uses ONNX (Open Neural Network Exchange) models for on-device AI inference:

### Text Classification Model
- **Input**: Tokenized text (up to 128 tokens)
- **Output**: Category probabilities for 12 categories
- **Size**: ~10-50MB (optimized for web)
- **Performance**: ~100ms per classification

### NSFW Image Classification
- **Input**: Image tensor (224x224x3 pixels)
- **Output**: Safe/NSFW probabilities
- **Size**: ~10-50MB (optimized for web)
- **Performance**: ~200ms per image

### Model Management
- **Lazy Loading**: Models loaded only when needed
- **Caching**: Results cached for 5 minutes
- **Fallback**: Keyword-based classification when models unavailable
- **Privacy**: All processing happens locally

## 🔒 Security & Privacy

### Privacy First
- **Local Processing**: No data sent to external servers
- **On-Device AI**: Models run entirely in your browser
- **No Tracking**: No telemetry or analytics collection
- **User Control**: You control all data and settings

### Security Measures
- **Content Security Policy**: Strict CSP compliance
- **Input Validation**: All user inputs sanitized
- **Permission Minimalism**: Only necessary permissions requested
- **Regular Audits**: Code reviewed for security issues

### Data Handling
- **Encryption**: Settings synced with Chrome's encrypted storage
- **Local Storage**: Analytics stored locally only
- **Export Control**: Full data export and deletion
- **Transparent**: Open source code for auditability

## 🚀 Performance

### Optimization Features
- **Debounced Processing**: 300ms delay for batch operations
- **WeakSet Caching**: Prevents duplicate content processing
- **Memory Management**: Automatic cleanup and garbage collection
- **Network Optimization**: Minimal background communication

### Performance Metrics
- **Page Load Impact**: < 100ms additional load time
- **Memory Usage**: < 50MB additional memory
- **Classification Speed**: < 500ms per content item
- **Battery Impact**: Minimal impact on battery life

### Browser Compatibility
- **Chrome 88+**: Full feature support
- **Manifest V3**: Latest Chrome extension standards
- **Cross-Platform**: Windows, macOS, Linux, ChromeOS
- **Mobile Support**: Works on Chrome for Android

## 🛠️ Development

### Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI/ML**: ONNX Runtime Web
- **Storage**: Chrome Storage API (sync + local)
- **Build**: No build process required (vanilla JS)
- **Testing**: Manual testing + automated unit tests

### Project Structure
```
focusguard/
├── manifest.json              # Extension manifest
├── background.js              # Service worker
├── contentScript.js           # Content injection
├── popup/                    # Popup interface
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/                  # Options page
│   ├── options.html
│   ├── options.js
│   └── options.css
├── lib/                      # Core libraries
│   ├── storage-manager.js
│   ├── analytics-manager.js
│   ├── dom-scanner.js
│   ├── filter-engine.js
│   ├── model-loader.js
│   ├── keyword-fallback.js
│   └── onnx-runtime-web.min.js
├── models/                   # AI model files
├── styles/                   # CSS styles
├── icons/                    # Extension icons
└── docs/                     # Documentation
```

### Getting Started
1. **Clone Repository**: `git clone <repository-url>`
2. **Install Dependencies**: `npm install` (optional)
3. **Load Extension**: Chrome Extensions → Load unpacked
4. **Configure Models**: Add ONNX models to `/models/` directory
5. **Start Development**: Make changes and reload extension

### Contributing
1. **Fork Repository**: Create your own fork
2. **Create Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Implement your feature or fix
4. **Add Tests**: Include appropriate tests
5. **Submit PR**: Create pull request with description

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)**: Detailed system architecture
- **[Setup Instructions](docs/SETUP.md)**: Complete installation and configuration
- **[API Documentation](docs/API.md)**: Comprehensive API reference
- **[Testing Guide](docs/TESTING.md)**: Testing procedures and scenarios

## 🤝 Support

### Getting Help
- **Documentation**: Check the [docs/](docs/) folder first
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Wiki**: Community-maintained documentation

### Bug Reports
When reporting bugs, please include:
- Chrome version and OS
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

### Feature Requests
- Use GitHub Issues with "enhancement" label
- Describe use case and expected behavior
- Consider impact on other users
- Provide examples if possible

## 📈 Roadmap

### Phase 1 ✅ (Current)
- ✅ Basic content classification
- ✅ Blur and block filtering
- ✅ Category management
- ✅ Analytics dashboard
- ✅ ONNX model support

### Phase 2 (Planned)
- 🔄 Cloud model options
- 🔄 Collaborative filtering
- 🔄 Advanced analytics
- 🔄 Custom model training
- 🔄 Browser extensions (Firefox, Safari)

### Phase 3 (Future)
- 📋 Mobile applications
- 📋 Team/organization features
- 📋 API access for developers
- 📋 Integration with productivity tools
- 📋 AI-powered recommendations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ONNX Runtime**: Microsoft's ONNX Runtime Web for browser-based AI
- **Chrome Extensions**: Google's Chrome Extension APIs
- **Open Source Community**: Contributors and maintainers
- **Test Users**: Beta testers and feedback providers

## 📞 Contact

- **GitHub**: [FocusGuard Repository](https://github.com/focusguard/focusguard)
- **Issues**: [Report Issues](https://github.com/focusguard/focusguard/issues)
- **Discussions**: [Community Discussions](https://github.com/focusguard/focusguard/discussions)

---

<div align="center">
  <p>Made with ❤️ for focused productivity</p>
  <p>
    <a href="#top">Back to top</a> •
    <a href="docs/SETUP.md">Setup Guide</a> •
    <a href="docs/API.md">API Docs</a>
  </p>
</div>