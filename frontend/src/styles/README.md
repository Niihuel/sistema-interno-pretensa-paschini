# Theme System Styles

This directory contains the CSS variable system for the unified theme system.

## Files

### theme-variables.css

The main CSS variables file that defines all theme colors and design tokens. This file includes:

- **Primary Colors** (50-900 scale): Main brand colors for primary actions
- **Secondary Colors** (50-900 scale): Supporting colors for secondary actions
- **Accent Colors** (50-900 scale): Highlight colors for special elements
- **State Colors**: Semantic colors (success, warning, error, info)
- **Chart Colors**: 8 distinct colors for data visualization (Recharts)
- **Background Colors**: Base backgrounds and surfaces
- **Border & Input Colors**: Interactive element colors
- **Text Colors**: Typography colors
- **Destructive Colors**: For destructive actions
- **Radius Values**: Border radius design tokens

## Usage

### In Tailwind Classes

All colors are available through Tailwind utility classes:

```tsx
// Primary colors
<div className="bg-primary-500 text-primary-50">Primary Button</div>

// State colors
<div className="bg-success-500">Success Message</div>
<div className="bg-error-500">Error Message</div>

// Chart colors
<div className="bg-chart-1">Chart Series 1</div>
```

### In CSS

Use CSS custom properties directly:

```css
.my-component {
  background-color: rgb(var(--primary-500));
  color: rgb(var(--foreground));
  border: 1px solid rgb(var(--border));
  border-radius: var(--radius-lg);
}
```

### Theme Scoping

Apply themes at different levels using data attributes:

```tsx
// Dashboard-level theme
<div data-dashboard-id="dashboard-123">
  {/* Content inherits dashboard theme */}
</div>

// Widget-level theme
<div data-widget-id="widget-456">
  {/* Content inherits widget theme */}
</div>
```

## Theme Inheritance

The theme system follows a three-level inheritance hierarchy:

1. **Global Theme** (root level)
2. **Dashboard Theme** (overrides global)
3. **Widget Theme** (overrides dashboard and global)

Variables cascade down, so if a color isn't defined at the widget level, it inherits from the dashboard level, and if not defined there, from the global level.

## Available Presets

12 shadcn-inspired theme presets are available in `frontend/src/shared/themes/presets/`:

- Zinc
- Slate
- Stone
- Gray
- Neutral
- Red
- Rose
- Orange
- Green
- Blue
- Yellow
- Violet

## Transitions

All color changes include smooth transitions (150ms) for a polished user experience. This is defined in the theme-variables.css file.

## Accessibility

The theme system includes:
- WCAG contrast ratio validation
- Semantic color naming
- Support for reduced motion preferences
