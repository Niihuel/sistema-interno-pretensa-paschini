/**
 * Script to help users clear corrupted dashboard data
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this script
 * 4. Run it
 * 5. Reload the page
 */

(function clearDashboardData() {
  console.log('🔧 Dashboard Data Cleanup Tool');
  console.log('================================');
  
  // Find all dashboard keys
  const allKeys = Object.keys(localStorage);
  const dashboardKeys = allKeys.filter(key => key.startsWith('dashboard-layout-'));
  
  if (dashboardKeys.length === 0) {
    console.log('✅ No dashboard data found in localStorage');
    return;
  }
  
  console.log(`📊 Found ${dashboardKeys.length} dashboard(s):`);
  dashboardKeys.forEach((key, index) => {
    console.log(`  ${index + 1}. ${key}`);
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`     - Widgets: ${data.widgets?.length || 0}`);
      console.log(`     - Theme: ${data.theme || 'N/A'}`);
    } catch (e) {
      console.log(`     ⚠️ CORRUPTED - Unable to parse`);
    }
  });
  
  console.log('\n🗑️ Clearing dashboard data...');
  
  dashboardKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`  ✅ Cleared: ${key}`);
    } catch (e) {
      console.log(`  ❌ Failed to clear: ${key}`, e);
    }
  });
  
  console.log('\n✨ Cleanup complete!');
  console.log('💡 Please reload the page to start with a fresh dashboard.');
  console.log('   You can run: location.reload()');
})();
