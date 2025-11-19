/**
 * Test script to verify filtering toggle persistence
 * This script can be run in the browser console to test the functionality
 */

async function testTogglePersistence() {
  console.log('🧪 Testing Filter Toggle Persistence...');
  
  try {
    // Test 1: Check if StorageManager is available
    if (typeof StorageManager === 'undefined') {
      console.error('❌ StorageManager not available');
      return false;
    }
    console.log('✅ StorageManager available');
    
    // Test 2: Check if getExtensionEnabled and setExtensionEnabled work
    const testTabId = 999999; // Fake tab ID for testing
    const originalState = await StorageManager.getExtensionEnabled(testTabId);
    console.log('📖 Original tab state:', originalState);
    
    // Test setting to false
    await StorageManager.setExtensionEnabled(testTabId, false);
    const newState = await StorageManager.getExtensionEnabled(testTabId);
    console.log('📖 After setting to false:', newState);
    
    if (newState !== false) {
      console.error('❌ Tab-specific state not persisting');
      return false;
    }
    console.log('✅ Tab-specific state persistence working');
    
    // Test setting to true
    await StorageManager.setExtensionEnabled(testTabId, true);
    const restoredState = await StorageManager.getExtensionEnabled(testTabId);
    console.log('📖 After setting to true:', restoredState);
    
    if (restoredState !== true) {
      console.error('❌ Tab-specific state restoration failed');
      return false;
    }
    console.log('✅ Tab-specific state restoration working');
    
    // Test 3: Check global state methods
    const originalGlobalState = await StorageManager.getExtensionEnabledGlobal();
    console.log('📖 Original global state:', originalGlobalState);
    
    await StorageManager.setExtensionEnabledGlobal(false);
    const newGlobalState = await StorageManager.getExtensionEnabledGlobal();
    console.log('📖 After setting global to false:', newGlobalState);
    
    if (newGlobalState !== false) {
      console.error('❌ Global state not persisting');
      return false;
    }
    console.log('✅ Global state persistence working');
    
    // Restore original global state
    await StorageManager.setExtensionEnabledGlobal(originalGlobalState);
    
    // Clean up test data
    await chrome.storage.local.remove('tabSettings_' + testTabId);
    
    console.log('🎉 All tests passed! Toggle persistence should work correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testTogglePersistence = testTogglePersistence;
  console.log('💡 Run testTogglePersistence() in console to test toggle persistence');
}