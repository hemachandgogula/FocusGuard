# FocusGuard Testing Guide

## Quick Start Testing

### 1. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `/focusguard` directory
5. The extension should load successfully

### 2. Test Options Page

1. Click on the FocusGuard extension icon
2. Click "Settings" or right-click extension → Options
3. You should see:
   - ✅ Modern gradient header with "🎯 FocusGuard"
   - ✅ Filter Status section with toggle
   - ✅ Filtering Mode section (Blur/Block radio buttons)
   - ✅ Sensitivity slider (Low/Medium/High)
   - ✅ Blocked Categories section with grid
   - ✅ Today's Activity statistics
   - ❌ NO "Allowed Categories" section
   - ❌ NO "Strict/Balanced Mode" options

### 3. Test Category Selection

1. In Blocked Categories section:
   - Click on category cards to toggle selection
   - Selected categories should have blue gradient background
   - Should see: Adult Content, Entertainment, Cruelty, Gambling, Violence, Politics, Gaming, Social Media, Shopping, News, Sports
   
2. Add custom category:
   - Type "Recipes" in the input field
   - Click "+ Add Custom" button
   - Should see success toast
   - New category should appear in grid
   
3. Remove category:
   - Click on a selected category to deselect
   - Card should return to gray gradient
   - Should see update toast

### 4. Test Settings Controls

1. **Extension Toggle:**
   - Toggle extension on/off
   - Status message should change
   - Toast notification should appear

2. **Filter Mode:**
   - Select "Blur Mode"
   - Select "Block Mode"
   - Should see toast confirmation

3. **Sensitivity Slider:**
   - Drag slider to Low/Medium/High
   - Text below should update with description
   - Should see toast confirmation

### 5. Test Reset to Defaults

1. Click "Reset to Defaults" button
2. Confirm the dialog
3. Should reset to: Adult Content, Entertainment, Cruelty
4. Should see success toast

### 6. Test Statistics

The statistics section should show:
- Total Blocked count
- Text/Images/Videos breakdown
- Top Blocked Categories (if any data exists)

### 7. Test Popup

1. Click extension icon in toolbar
2. You should see:
   - ✅ Current page URL
   - ✅ Extension toggle
   - ✅ Statistics for today
   - ✅ Quick actions (Block/Allow domain)
   - ✅ Filter mode selection
   - ❌ NO "Mode" display (Strict/Balanced)
   - ❌ NO mode toggle buttons

### 8. Visual Testing

Check these modern design elements:

**Colors:**
- Header gradient: Blue to Purple
- Selected categories: Blue gradient
- Toggle switches: Green when on, Gray when off
- Buttons: Blue gradient on primary
- Stats cards: Light blue backgrounds

**Animations:**
- Hover effects on category cards (lift and shadow)
- Toggle switch animation
- Button hover effects (lift and shadow increase)
- Toast notifications slide in from bottom-right

**Responsiveness:**
- Resize browser window
- On tablet (768px): Grid adjusts
- On mobile (480px): Grid shows 2 columns, full-width buttons

### 9. Functional Testing

1. **Block Logic Test:**
   - Block "Entertainment" category
   - Visit a website with entertainment content
   - Content should be filtered based on filter mode

2. **Allow Logic Test:**
   - By default, ALL content not in block list should be visible
   - Only explicitly blocked categories should be filtered

3. **Settings Persistence:**
   - Close and reopen options page
   - Settings should be preserved
   - Blocked categories should remain selected

### 10. Console Testing

Open Developer Console (F12) and check:
- ✅ No JavaScript errors
- ✅ "Settings saved successfully" logs
- ✅ No warnings about missing elements
- ❌ NO errors about "strictMode" or "currentMode" elements
- ❌ NO errors about "allowedCategories"

## Expected Behavior Summary

### ✅ Should Work:
- Block-list-only filtering
- Modern, responsive UI
- Smooth animations
- Category selection with grid
- Custom categories
- Statistics display
- Settings persistence
- Toast notifications
- Extension toggle

### ❌ Should NOT Exist:
- Allowed Categories section
- Strict/Balanced mode options
- Mode display in popup
- Allow list logic in filtering

## Browser Compatibility

- Chrome (tested): ✅
- Edge (Chromium-based): ✅
- Brave: ✅
- Other Chromium browsers: Should work

## Known Limitations

1. Analytics data requires actual content blocking to populate
2. Statistics reset at midnight
3. Custom categories are stored per browser/profile

## Troubleshooting

### Issue: Options page doesn't load
- Check console for errors
- Verify all script files are present
- Check manifest.json is valid

### Issue: Categories don't save
- Check storage permissions in manifest
- Open chrome://extensions and check for errors
- Verify background service worker is running

### Issue: Styles look broken
- Verify options.css is loaded
- Check browser console for CSS errors
- Try hard refresh (Ctrl+Shift+R)

### Issue: Toast notifications don't show
- Check if toast element exists in HTML
- Verify CSS classes are applied
- Check for JavaScript errors

## Success Criteria

✅ All files load without errors
✅ Options page displays modern UI
✅ No "Allowed Categories" visible
✅ Category selection works smoothly
✅ Settings persist correctly
✅ Animations are smooth
✅ Responsive on all screen sizes
✅ No console errors
✅ Block-list-only logic works correctly
