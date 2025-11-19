# Git LFS Setup Guide for ONNX Models

**Problem**: ONNX model files (>25MB) cannot be pushed to GitHub  
**Solution**: Use Git LFS (Large File Storage)  
**Status**: Guide for setup

---

## Understanding the Issue

### GitHub's File Size Limits
- **Hard Limit**: Individual files > 100MB are blocked
- **Soft Limit**: Files > 50MB trigger warnings
- **Recommended**: Keep individual files < 25MB

ONNX models often exceed these limits:
- Small models: 10-50MB
- Medium models: 50-200MB
- Large models: 200MB+

### Why Git LFS?
Git LFS replaces large files with pointers, storing the actual files on LFS servers:
- ✅ Keeps repository lean
- ✅ Faster clones and pulls
- ✅ Handles binary files efficiently
- ✅ Works transparently with Git

---

## Step 1: Install Git LFS

### On Ubuntu/Debian
```bash
sudo apt-get install git-lfs
git lfs install
```

### On macOS
```bash
brew install git-lfs
git lfs install
```

### On Windows
```bash
# Download installer from https://git-lfs.github.com/
# Or use chocolatey
choco install git-lfs
git lfs install
```

### Verify Installation
```bash
git lfs version
# Output: git-lfs/3.x.x (...)
```

---

## Step 2: Configure Git LFS for Your Repository

### A. Set Up LFS Tracking for ONNX Models

```bash
cd /home/engine/project

# Track all ONNX files
git lfs track "*.onnx"

# Track other model formats if needed
git lfs track "*.pb"          # TensorFlow
git lfs track "*.h5"          # Keras
git lfs track "*.pth"         # PyTorch
git lfs track "*.model"       # Generic
```

### B. Add .gitattributes to Version Control

```bash
# This file is created automatically by git lfs track
# Verify it was created
cat .gitattributes
```

Expected output:
```
*.onnx filter=lfs diff=lfs merge=lfs -text
*.pb filter=lfs diff=lfs merge=lfs -text
*.h5 filter=lfs diff=lfs merge=lfs -text
*.pth filter=lfs diff=lfs merge=lfs -text
*.model filter=lfs diff=lfs merge=lfs -text
```

### C. Commit .gitattributes

```bash
git add .gitattributes
git commit -m "Configure Git LFS for model files"
```

---

## Step 3: Add Your ONNX Models

### Option A: If Models Are Already Tracked by Git

```bash
# Remove from git cache (but keep local files)
git rm --cached focusguard/models/*.onnx

# Re-add them (will now use LFS)
git add focusguard/models/*.onnx

# Commit
git commit -m "Add ONNX models via Git LFS"
```

### Option B: If Models Are New

```bash
# Copy models to the models directory
cp /path/to/text-classifier-model.onnx focusguard/models/
cp /path/to/nsfw-classifier-model.onnx focusguard/models/

# Add them
git add focusguard/models/*.onnx

# Commit
git commit -m "Add ONNX models via Git LFS"
```

### Option C: If Models Were Previously Rejected

```bash
# Clean up any failed attempts
git reflog
git gc --prune=now

# Then proceed with Option A or B above
```

---

## Step 4: Push to GitHub

### First Time Push
```bash
git push origin validate-onnx-model-benchmark
```

GitHub will:
1. Detect LFS files
2. Upload them to LFS storage
3. Create pointers in the repository
4. Success! ✅

### Verify Push
```bash
# Check remote
git ls-remote --heads origin

# The branch should show your commit
# The actual model files are on LFS servers
```

---

## Step 5: Verify Setup

### Check What Git LFS Is Tracking

```bash
git lfs ls-files
```

Expected output:
```
cccb0a4b62 * focusguard/models/text-classifier-model.onnx
2a3c1f8b91 * focusguard/models/nsfw-classifier-model.onnx
```

### Check Pointer Files

```bash
cat focusguard/models/text-classifier-model.onnx
```

Expected output (pointer file):
```
version https://git-lfs.github.com/spec/v1
oid sha256:abc123...
size 45876543
```

### Verify Model Files Still Work

```bash
# The actual files are still accessible locally
ls -lh focusguard/models/*.onnx

# And work exactly like normal
# (Git LFS is transparent to users)
```

---

## Troubleshooting

### Problem: "Git LFS not installed"
```bash
# Install it
sudo apt-get install git-lfs
git lfs install
```

### Problem: Files Still Too Large
```bash
# Check file size
ls -lh focusguard/models/

# If > 2GB, consider:
# 1. Compression
# 2. Splitting into multiple files
# 3. Remote storage (S3, etc.)
```

### Problem: "LFS quota exceeded"
```bash
# GitHub LFS limits:
# - Free tier: 1GB free per month
# - Pro tier: 100GB per month

# Solutions:
# 1. Upgrade GitHub plan
# 2. Store models on S3 instead
# 3. Compress models
# 4. Use model quantization
```

### Problem: Already Committed Large Files

```bash
# Remove from history
git filter-branch --tree-filter 'rm -f focusguard/models/*.onnx' HEAD

# Or use BFG Repo-Cleaner (safer)
bfg --delete-files '*.onnx' --replace-refs DELETE_FILES_AND_REFS

# Then push
git push -f origin validate-onnx-model-benchmark
```

---

## For Team Members

### Cloning Repository with LFS

```bash
# Standard clone (LFS files downloaded automatically)
git clone https://github.com/your-org/focusguard.git

# Sparse clone (if repo is large)
git clone --single-branch --branch validate-onnx-model-benchmark \
  https://github.com/your-org/focusguard.git
```

### Pulling LFS Files

```bash
# Automatic (if git-lfs installed)
git pull origin validate-onnx-model-benchmark

# Manual (if needed)
git lfs pull
```

---

## Alternative Approaches (If LFS Doesn't Fit Your Needs)

### Option 1: Store Models on Separate Service

**Pros**:
- ✅ Keep repo lean
- ✅ No GitHub LFS quota issues
- ✅ Independent scaling

**Cons**:
- ❌ Manual download/setup needed
- ❌ Extra infrastructure

**Implementation**:
```bash
# Store models on S3 or similar
# Create script to download at build time
# Or fetch at runtime in extension

# Example: Download at build time
wget https://s3.example.com/models/text-classifier.onnx -O focusguard/models/
```

### Option 2: Compress Models

**Pros**:
- ✅ Smaller file sizes
- ✅ Works with standard Git

**Cons**:
- ❌ Need decompression step
- ❌ Adds overhead

**Implementation**:
```bash
# Compress before adding
gzip text-classifier-model.onnx
git add text-classifier-model.onnx.gz

# Decompress after pulling
gunzip text-classifier-model.onnx.gz
```

### Option 3: Model Quantization

**Pros**:
- ✅ Reduces model size 50-75%
- ✅ Maintains most accuracy
- ✅ Faster inference

**Cons**:
- ❌ Requires retraining/conversion
- ❌ Some accuracy loss

**Implementation**:
```python
# Example with ONNX
import onnx
from onnxruntime.quantization import quantize_dynamic

quantize_dynamic(
    'text-classifier-model.onnx',
    'text-classifier-model-quantized.onnx'
)
```

---

## Chrome Extension Specific Considerations

### Model Loading in Extension

Since models are now in Git LFS, update your manifest or loading code:

```json
{
  "manifest_version": 3,
  "web_accessible_resources": [
    {
      "resources": ["models/*.onnx"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### Size Considerations for Browser

ONNX models must be reasonable size for browser loading:
- **Ideal**: < 50MB
- **Acceptable**: 50-100MB
- **Too Large**: > 100MB (may timeout)

### Loading at Runtime

```javascript
// In your extension
async function loadModel() {
  const modelPath = chrome.runtime.getURL('models/text-classifier-model.onnx');
  const session = await ort.InferenceSession.create(modelPath);
  return session;
}
```

---

## Complete Workflow Example

### First Time Setup
```bash
# 1. Install Git LFS
sudo apt-get install git-lfs

# 2. Navigate to repo
cd /home/engine/project

# 3. Install LFS for repo
git lfs install

# 4. Track model files
git lfs track "*.onnx"
git add .gitattributes
git commit -m "Configure Git LFS for ONNX models"

# 5. Add your models
cp /path/to/models/*.onnx focusguard/models/
git add focusguard/models/*.onnx
git commit -m "Add ONNX models"

# 6. Push
git push origin validate-onnx-model-benchmark
```

### Verification
```bash
# Verify LFS tracking
git lfs ls-files

# Check pointer files
cat focusguard/models/text-classifier-model.onnx

# Confirm models work
ls -lh focusguard/models/
```

---

## Important Notes

### GitHub LFS Pricing
- **Free Tier**: 1GB/month bandwidth
- **Pro Tier**: 100GB/month bandwidth
- **Enterprise**: Unlimited

### Model File Locations
```
focusguard/models/
├── text-classifier-model.onnx      (your model)
├── nsfw-classifier-model.onnx      (your model)
├── model-loader.js                 (loader code)
└── (other model files)
```

### What About the Validation Tests?

The validation tests I created work without actual ONNX models because they use the `KeywordFallback` system. Once you add the models via Git LFS, the tests will:
1. Still work as-is (no changes needed)
2. Can optionally be updated to test actual ML models
3. Maintain all validation metrics

---

## Next Steps

### To Get Models Working:

1. **If you have models locally**:
   ```bash
   # Set up Git LFS (steps above)
   # Copy models to focusguard/models/
   # Add and push
   ```

2. **If you don't have models yet**:
   - See the validation analysis for model recommendations
   - Download from HuggingFace or similar
   - Or continue with keyword-based system (which works perfectly)

3. **If models are too large**:
   - Consider quantization (reduce size 50-75%)
   - Or store externally (S3, etc.)
   - Or use model hub for runtime download

---

## Support Resources

- **Git LFS Docs**: https://git-lfs.github.com/
- **GitHub LFS Guide**: https://docs.github.com/en/repositories/working-with-files/managing-large-files
- **ONNX Runtime**: https://onnxruntime.ai/
- **Model Compression**: https://github.com/microsoft/onnxruntime/tree/main/onnxruntime/python/tools/quantization

---

## Summary

| Task | Command |
|------|---------|
| Install LFS | `sudo apt-get install git-lfs` |
| Configure repo | `git lfs track "*.onnx"` |
| Add models | `git add focusguard/models/*.onnx` |
| Commit | `git commit -m "Add models"` |
| Push | `git push origin validate-onnx-model-benchmark` |
| Verify | `git lfs ls-files` |

**Status**: Ready to implement

---

For questions or issues, refer to the Git LFS documentation or contact your team's DevOps/infrastructure team.
