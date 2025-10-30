/**
 * Utility to clear dashboard data from localStorage
 */

export const clearDashboardData = (layoutId?: string): boolean => {
  try {
    const storageKey = layoutId ? `dashboard-layout-${layoutId}` : 'dashboard-layout-default';
    localStorage.removeItem(storageKey);
    console.log('Dashboard data cleared from localStorage');
    return true;
  } catch (err) {
    console.error('Failed to clear dashboard data:', err);
    return false;
  }
};

export const clearAllDashboards = (): boolean => {
  try {
    const keys = Object.keys(localStorage);
    const dashboardKeys = keys.filter(key => key.startsWith('dashboard-layout-'));
    
    dashboardKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${dashboardKeys.length} dashboard(s) from localStorage`);
    return true;
  } catch (err) {
    console.error('Failed to clear all dashboards:', err);
    return false;
  }
};

/**
 * Validates if a dashboard in localStorage is corrupted
 */
export const isDashboardCorrupted = (layoutId?: string): boolean => {
  try {
    const storageKey = layoutId ? `dashboard-layout-${layoutId}` : 'dashboard-layout-default';
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return false;
    
    const layout = JSON.parse(stored);
    
    // Check if structure is valid
    if (!layout.widgets || !Array.isArray(layout.widgets)) {
      return true;
    }
    
    // Check if any widget has invalid layout
    return layout.widgets.some((widget: any) => {
      return !widget.layout ||
             typeof widget.layout.x !== 'number' ||
             typeof widget.layout.y !== 'number' ||
             typeof widget.layout.w !== 'number' ||
             typeof widget.layout.h !== 'number' ||
             isNaN(widget.layout.x) ||
             isNaN(widget.layout.y) ||
             isNaN(widget.layout.w) ||
             isNaN(widget.layout.h);
    });
  } catch (err) {
    console.error('Error checking dashboard corruption:', err);
    return true; // If we can't parse it, it's corrupted
  }
};
