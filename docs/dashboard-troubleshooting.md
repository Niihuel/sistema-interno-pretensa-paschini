# Dashboard Troubleshooting Guide

## Common Issues and Solutions

### Error: "ReactGridLayout.children[0].x must be a number"

**Symptoms:**
- Dashboard fails to load
- Error message appears in console
- White screen or error boundary triggered

**Cause:**
This error occurs when widget layout data is corrupted or incomplete in localStorage.

**Solution 1: Use the Built-in Clear Button**
1. Look for the error alert at the top of the dashboard page
2. Click the "Limpiar datos y reiniciar" (Clear data and restart) button
3. The page will reload with a fresh dashboard

**Solution 2: Clear via Browser Console**
1. Open Developer Tools (F12)
2. Go to the Console tab
3. Paste and run the following command:
```javascript
localStorage.removeItem('dashboard-layout-admin');
location.reload();
```

**Solution 3: Clear All Dashboard Data**
1. Open Developer Tools (F12)
2. Go to the Console tab
3. Copy and paste the contents of `/scripts/clear-dashboard-data.js`
4. Run it
5. Reload the page

**Solution 4: Manual Browser Storage Clear**
1. Open Developer Tools (F12)
2. Go to the Application tab (Chrome) or Storage tab (Firefox)
3. Expand "Local Storage" in the left sidebar
4. Click on your domain
5. Find and delete keys starting with "dashboard-layout-"
6. Reload the page

### Prevention

The dashboard now includes automatic validation and cleanup:
- Invalid widgets are automatically filtered out
- Corrupted data is detected on load
- Clean data is saved back to localStorage
- Error messages guide users to recovery options

### Widgets Not Saving

**Symptoms:**
- Widgets disappear after page reload
- Changes don't persist

**Solution:**
1. Check browser console for errors
2. Ensure localStorage is not disabled
3. Check if you're in private/incognito mode
4. Try the "Save" button explicitly (don't rely only on auto-save)

### Layout Resets After Refresh

**Symptoms:**
- Widget positions reset to default
- Layout changes don't persist

**Solution:**
1. Ensure you save the dashboard before leaving
2. Check for the "unsaved changes" indicator
3. Look for browser console errors
4. Verify localStorage quota hasn't been exceeded

### Widget Configuration Lost

**Symptoms:**
- Widget data/configuration is lost
- Widgets show default placeholder data

**Solution:**
1. Re-configure the widget using the edit button
2. Save the dashboard after configuration
3. Export dashboard as backup (recommended)

## Best Practices

### Regular Backups
1. Click "Exportar" in the dashboard toolbar
2. Save the JSON file to a safe location
3. Import when needed using "Importar"

### Testing Changes
1. Export current dashboard first
2. Make changes
3. Test thoroughly
4. If issues occur, import the backup

### Browser Compatibility
- Use modern browsers (Chrome, Firefox, Edge, Safari)
- Keep browsers updated
- Clear cache if experiencing issues

## Developer Information

### Key Files
- `useDashboardWidgets.ts` - Main widget state management
- `DashboardGrid.tsx` - Grid rendering and layout
- `clearDashboard.ts` - Cleanup utilities
- `widgetCatalog.ts` - Widget definitions and defaults

### Data Structure
Widgets are stored in localStorage with this structure:
```json
{
  "id": "dashboard-layout-admin",
  "name": "Admin Dashboard",
  "widgets": [
    {
      "id": "widget-123",
      "type": "kpi",
      "layout": {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 2
      },
      "config": { ... }
    }
  ]
}
```

### Validation Rules
- `x`, `y`, `w`, `h` must be numbers
- `x`, `y` must be >= 0
- `w`, `h` must be >= 2 (minimum size)
- Widget must have valid `id` and `type`

### Debug Mode
To enable verbose logging:
```javascript
localStorage.setItem('DEBUG_DASHBOARD', 'true');
```

To disable:
```javascript
localStorage.removeItem('DEBUG_DASHBOARD');
```

## Getting Help

If none of these solutions work:
1. Check browser console for specific error messages
2. Export any working dashboard as backup
3. Clear all dashboard data as last resort
4. Report the issue with:
   - Browser version
   - Error message
   - Steps to reproduce
   - Console logs
