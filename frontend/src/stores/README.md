# Theme Store Usage Guide

## Overview

The Theme Store is a Zustand-based state management solution for the unified theme system. It provides centralized control over theme state, loading, persistence, and manipulation.

## Basic Usage

### Importing the Store

```typescript
import { useThemeStore } from '../stores/themeStore';
```

### Loading Themes

```typescript
// In a component or effect
const loadTheme = useThemeStore(state => state.loadTheme);
const currentTheme = useThemeStore(state => state.currentTheme);

// Load global theme
useEffect(() => {
  loadTheme('global');
}, []);

// Load dashboard-specific theme
loadTheme('dashboard', dashboardId);

// Load widget-specific theme
loadTheme('widget', widgetId);
```

### Updating Theme Variables

```typescript
const updateVariable = useThemeStore(state => state.updateVariable);

// Update a color variable
updateVariable('primary-500', {
  hex: '#3b82f6',
  rgb: { r: 59, g: 130, b: 246 },
  hsl: { h: 217, s: 91, l: 60 },
  alpha: 1,
});
```

### Saving Themes

```typescript
const saveTheme = useThemeStore(state => state.saveTheme);
const isDirty = useThemeStore(state => state.isDirty);

// Save current theme
if (isDirty) {
  await saveTheme();
}
```

### Resetting Changes

```typescript
const resetTheme = useThemeStore(state => state.resetTheme);

// Revert to original theme (before editing)
resetTheme();
```

### Applying Presets

```typescript
const applyPreset = useThemeStore(state => state.applyPreset);
const presets = useThemeStore(state => state.presets);
const loadPresets = useThemeStore(state => state.loadPresets);

// Load available presets
useEffect(() => {
  loadPresets();
}, []);

// Apply a preset
applyPreset('zinc-dark');
```

### Import/Export

```typescript
const exportTheme = useThemeStore(state => state.exportTheme);
const importTheme = useThemeStore(state => state.importTheme);

// Export current theme
const json = exportTheme();
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Trigger download...

// Import theme from JSON
const handleImport = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const json = e.target?.result as string;
    importTheme(json);
  };
  reader.readAsText(file);
};
```

### Editor Control

```typescript
const openEditor = useThemeStore(state => state.openEditor);
const closeEditor = useThemeStore(state => state.closeEditor);
const isEditorOpen = useThemeStore(state => state.isEditorOpen);

// Open theme editor
openEditor('global');

// Open editor for specific scope
openEditor('dashboard', dashboardId);

// Close editor
closeEditor();
```

### Computed Values

```typescript
const getComputedTheme = useThemeStore(state => state.getComputedTheme);
const getInheritedValue = useThemeStore(state => state.getInheritedValue);

// Get computed theme with inheritance resolved
const computedTheme = getComputedTheme();

// Get inherited value for a variable
const inheritedColor = getInheritedValue('primary-500');
```

## Complete Example: Theme Editor Component

```typescript
import React, { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export const ThemeEditorButton: React.FC = () => {
  const openEditor = useThemeStore(state => state.openEditor);
  const loadPresets = useThemeStore(state => state.loadPresets);
  
  useEffect(() => {
    // Load presets on mount
    loadPresets();
  }, [loadPresets]);
  
  return (
    <button onClick={() => openEditor('global')}>
      Customize Theme
    </button>
  );
};

export const ThemeEditor: React.FC = () => {
  const {
    isEditorOpen,
    closeEditor,
    currentTheme,
    updateVariable,
    saveTheme,
    resetTheme,
    isDirty,
    isSaving,
  } = useThemeStore();
  
  if (!isEditorOpen || !currentTheme) return null;
  
  const handleSave = async () => {
    try {
      await saveTheme();
      // Show success message
    } catch (error) {
      // Show error message
    }
  };
  
  return (
    <div className="theme-editor">
      <h2>Theme Editor</h2>
      
      {/* Variable editors */}
      {Object.entries(currentTheme.variables).map(([key, variable]) => (
        <div key={key}>
          <label>{variable.name}</label>
          <ColorPicker
            value={variable.value}
            onChange={(color) => updateVariable(key, color)}
          />
        </div>
      ))}
      
      {/* Actions */}
      <div className="actions">
        <button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={resetTheme} disabled={!isDirty}>
          Reset
        </button>
        <button onClick={closeEditor}>
          Close
        </button>
      </div>
    </div>
  );
};
```

## State Structure

```typescript
interface ThemeState {
  // Current state
  currentTheme: Theme | null;
  currentScope: ThemeScope;
  currentScopeId?: string;
  
  // Theme hierarchy
  globalTheme: Theme | null;
  dashboardThemes: Map<string, Theme>;
  widgetThemes: Map<string, Theme>;
  
  // Editor state
  isEditorOpen: boolean;
  isDirty: boolean;
  previewMode: boolean;
  originalTheme: Theme | null;
  
  // Presets
  presets: ThemePreset[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions...
}
```

## Best Practices

1. **Load themes early**: Load the global theme in your app's root component
2. **Use selectors**: Only subscribe to the state you need to avoid unnecessary re-renders
3. **Handle errors**: Always handle errors from async actions (loadTheme, saveTheme)
4. **Preview mode**: Enable preview mode when editing to see changes in real-time
5. **Dirty checking**: Check `isDirty` before closing editor to prompt user about unsaved changes
6. **Scope management**: Load appropriate theme when navigating between dashboards/widgets

## API Integration

The store automatically handles API calls to:
- `GET /api/themes` - Load theme
- `POST /api/themes` - Save theme
- `GET /api/themes/presets` - Load presets

Ensure your backend implements these endpoints according to the API specification.

