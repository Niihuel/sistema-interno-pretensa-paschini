# Theme System API

This module provides REST API endpoints for managing user themes with support for global, dashboard, and widget-level customization.

## Endpoints

### GET /api/themes
Get theme for a specific scope with computed inheritance.

**Query Parameters:**
- `scope` (optional): 'GLOBAL' | 'DASHBOARD' | 'WIDGET' (default: 'GLOBAL')
- `scopeId` (optional): Dashboard or widget ID
- `mode` (optional): 'LIGHT' | 'DARK' (default: 'DARK')

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": { /* raw theme */ },
    "computed": { /* theme with inheritance resolved */ }
  }
}
```

### POST /api/themes
Create or update a theme.

**Body:**
```json
{
  "name": "My Theme",
  "scope": "GLOBAL",
  "scopeId": null,
  "mode": "DARK",
  "variables": {
    "primary-500": {
      "hex": "#3b82f6",
      "rgb": { "r": 59, "g": 130, "b": 246 },
      "hsl": { "h": 217, "s": 91, "l": 60 },
      "alpha": 1
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": { /* created/updated theme */ },
    "computed": { /* theme with inheritance */ }
  }
}
```

### DELETE /api/themes/:id
Delete a theme by ID.

**Response:**
```json
{
  "success": true,
  "message": "Theme deleted successfully"
}
```

### GET /api/themes/presets
Get all available theme presets (shadcn-inspired).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "zinc",
      "name": "Zinc",
      "description": "A neutral zinc theme with subtle grays",
      "source": "shadcn",
      "variables": { /* preset variables */ }
    }
  ]
}
```

### POST /api/themes/import
Import a theme from JSON.

**Body:**
```json
{
  "json": "{ \"name\": \"Imported Theme\", \"variables\": {...} }",
  "scope": "GLOBAL",
  "scopeId": null,
  "mode": "DARK"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": { /* imported theme */ },
    "computed": { /* theme with inheritance */ }
  }
}
```

### GET /api/themes/:id/export
Export a theme as JSON.

**Response:**
```json
{
  "success": true,
  "data": {
    "json": "{ \"name\": \"My Theme\", ... }"
  }
}
```

## Theme Inheritance

Themes follow a hierarchical inheritance model:

1. **Global Theme**: Base theme for the entire application
2. **Dashboard Theme**: Overrides global theme for a specific dashboard
3. **Widget Theme**: Overrides dashboard and global themes for a specific widget

When retrieving a theme, the system automatically computes the final values by merging:
- Widget theme variables (highest priority)
- Dashboard theme variables (medium priority)
- Global theme variables (lowest priority)

## Variable Structure

Each theme variable must have at least one color format:

```typescript
{
  hex?: string;        // e.g., "#3b82f6"
  rgb?: {              // RGB values (0-255)
    r: number;
    g: number;
    b: number;
  };
  hsl?: {              // HSL values (h: 0-360, s: 0-100, l: 0-100)
    h: number;
    s: number;
    l: number;
  };
  alpha?: number;      // Opacity (0-1)
}
```

## Presets

The system includes 6 shadcn-inspired presets:
- Zinc
- Slate
- Blue
- Green
- Rose
- Orange

Each preset includes:
- Primary colors (50-900 scale)
- Background and foreground colors
- Chart colors (8 distinct colors for data visualization)

## Permissions

All endpoints require:
- Authentication (JWT)
- Permission: `dashboard:view` (for GET requests)
- Permission: `dashboard:edit` (for POST requests)
- Permission: `dashboard:delete` (for DELETE requests)

## Audit Logging

All theme operations are automatically logged in the audit system with:
- Entity: 'Theme'
- Category: 'DATA'
- Severity: INFO (view), MEDIUM (create/update), HIGH (delete)
