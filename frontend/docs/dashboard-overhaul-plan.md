# Dashboard Overhaul Roadmap

## 1. Objectives

- Deliver a Hyprland/Windows-style dashboard experience with fluid resize, snapping, and feedback.
- Unify theming across widgets, charts, and layout with inheritance (global → dashboard → widget).
- Simplify the UI so editing controls appear contextually and viewing mode stays clean.
- Complete critical features (permissions, refresh, data sources, undo/redo, import/export validation).
- Establish a maintainable architecture with clear component layers, reusable hooks, and documentation.

---

## 2. Target Architecture

### 2.1 Layering

| Layer | Responsibility | Key Artifacts |
|-------|----------------|---------------|
| **Page Shell** | Routing + providers + layout chrome | `AdminDashboardPage`, `DashboardShell` |
| **Dashboard Core** | Grid, resize system, overlays, history, autosave | `DashboardViewport`, `GridSystem`, `ResizeOverlay`, hooks |
| **Widget Surface** | Widget base wrapper, toolbar, controls, theming | `WidgetSurface`, `WidgetToolbar`, `WidgetThemeBoundary` |
| **Widget Types** | Visual + business logic per widget | `WidgetKPI`, `WidgetChart`, etc. |
| **Configuration** | Modal, forms, preview | `WidgetConfigModal`, `WidgetPreview`, stepper forms |
| **Services** | Theme engine, data sources, permissions, history store | `useWidgetData`, `useWidgetTheme`, `useDashboardHistory`, API clients |

### 2.2 Component Breakdown

- **DashboardShell**: Top-level container; orchestrates mode (view/edit), unsaved state, top toolbar.
- **DashboardViewport**: Wraps `ReactGridLayout`, owns grid settings, exposes layout events.
- **GridSystemOverlay**: Renders column guide, snapping preview, measurement tooltip, conflict highlights.
- **ResizeOverlay**: Manages pointer interactions for edge/corner resize, coordinates with grid system.
- **WidgetSurface**: Base wrapper for every widget. Handles focus, hover, controls, theming, permissions, drag/resize handles.
- **WidgetToolbar**: Contextual controls (refresh, edit, delete) shown only in edit mode/hover.
- **WidgetThemeBoundary**: Applies theme inheritance; connects to `useWidgetTheme`.
- **WidgetConfigModal**: Redesigned structure with sections (Overview, Data, Appearance, Advanced); includes live preview via `WidgetPreview` component.
- **DashboardToolbarMenu**: Hamburger menu with secondary actions (import/export, layout versions, settings).
- **ChangeHistoryPanel**: Side panel showing undo/redo timeline with metadata.

### 2.3 Hooks & State

| Hook | Purpose |
|------|---------|
| `useDashboardMode` | View/edit toggle, unsaved tracking, contextual UI state |
| `useGridSystem` | Grid metrics, snapping calculations, column map, min/max validation |
| `useWidgetResize` | Pointer-driven resize, overlay feedback, commit layout changes |
| `useWidgetTheme` | Theme resolution, inheritance, CSS variable application |
| `useWidgetData` | Fetching and refreshing widget data, backend integration, loading state |
| `useDashboardHistory` | Undo/redo stack, checkpoint management, conflict resolution |
| `useAutoSave` | Debounced persistence to backend/localStorage with conflict detection |
| `useWidgetPermissions` | Evaluate RBAC rules, hide/disable widgets/controls |

### 2.4 Theme System

- **Data Model**: Global theme + per-dashboard overrides + per-widget overrides. Each theme stores semantic tokens (`surface`, `border`, `text-primary`, `accent`, `chart-series[...]`).
- **Application**: CSS custom properties scoped by `data-theme-scope` attributes. Charts subscribe via `useChartTheme` hook mapped from tokens.
- **Editor**: `ThemeEditor` with tabs: Variables, Presets, Accessibility. Live preview uses `WidgetPreview` components. Broadcast changes via existing sync service.
- **Validation**: Real-time WCAG contrast checks, missing token warnings, history of recent themes.

### 2.5 Data & Persistence

- **Layout**: Stored as versioned documents (`layoutId`, `version`, widgets array). Undo/redo uses immutable snapshots persisted locally and optionally to backend.
- **Widgets**: Each widget record includes `type`, `position`, `dimension`, `themeRef`, `dataSource`, `permissions`, `settings`.
- **Import/Export**: Validate schema, ensure referenced data sources exist, sanitize unknown fields.
- **Permissions**: `useWidgetPermissions` consults RBAC store/API before rendering controls.
- **Data Sources**: Catalog fetched from backend; UI surfaces module + endpoint selection with validation.

---

## 3. Delivery Roadmap

### Phase 0 – Foundations
- Freeze current feature work. Audit existing styles/hooks. Extract util functions where re-used.
- Introduce feature flags/config to toggle new experience during development.
- Establish coding standards (lint fixes, Storybook or docs for new components, test strategy).

### Phase 1 – Architecture Refactor
- Create `DashboardShell`, `DashboardViewport`, `WidgetSurface`, `WidgetToolbar`, `WidgetThemeBoundary` skeletons.
- Move shared logic from widgets into the base wrapper.
- Implement `useDashboardMode`, `useWidgetPermissions`, `useAutoSave` scaffolding.
- Update `AdminDashboardPage` to use new structure behind a flag, keeping old behavior available for fallback.

### Phase 2 – Professional Resize System
- Build `useGridSystem` for column metrics and snapping.
- Implement `ResizeOverlay` with window-manager-style resize (edges, corners, measurement tooltip).
- Integrate overlay with `ReactGridLayout` by translating overlay commits into grid updates.
- Add grid visualization (column lines, active cell highlight) and constraint feedback (min/max, conflicts).

### Phase 3 – Unified Theme System
- Finalize theme store structure (global/dashboard/widget). Ensure CSS variables cascade via DOM attributes.
- Expand theme tokens to cover widgets, buttons, badges, charts.
- Extend `ThemeEditor` UI: full token list, grouping, accessible color validation, live widget preview, preset management.
- Integrate Recharts palette updates via `useChartTheme` and ensure screen-reader announcements for changes.

### Phase 4 – UI/UX Refinement
- Simplify toolbar with hamburger menu for advanced actions; surface status indicators (mode, unsaved changes, active theme).
- Show widget controls only in edit mode/hover; add micro-interactions for focus/hover.
- Redesign config modal with section navigation, inline validation, and live preview.
- Replace JSON fields with structured forms + advanced JSON editor toggle when necessary.

### Phase 5 – Functional Completeness
- Implement automatic refresh with countdown indicator per widget.
- Wire `useWidgetData` to backend; support offline/local fallback.
- Enforce permissions client-side (hide/disable) and double-check in backend calls.
- Build undo/redo via `useDashboardHistory`, integrate with autosave and import/export validations.
- Harden import/export (schema validation, referential integrity, sanitization, descriptive errors).

### Phase 6 – Quality & Documentation
- Resolve lint debt; enforce `npm run lint` and `npm run build` in CI.
- Add targeted tests: hook unit tests, integration tests for resize/theme, visual regression baselines if possible.
- Produce updated READMEs (`dashboard/README.md`, `theme-system/README.md`, migration notes).
- Document extension guidelines (adding widget types, new tokens, data sources).

---

## 4. Dependencies & Risks

- **React Grid Layout constraints**: confirm overlay integration without forking. If limitations arise, evaluate wrapper customization or community plugins.
- **Theme performance**: applying many CSS variables must remain performant; monitor repaint costs.
- **Undo/redo storage size**: manage snapshot size (consider diffing or capped history).
- **Backend alignment**: ensure APIs exist or plan mocks for data sources, permissions, versioning.
- **Scope creep**: guard roadmap by locking feature requests per phase; use milestones for visibility.

---

## 5. Next Actions

1. Review and sign off on this architecture document with the team.
2. Create feature flag scaffolding (`dashboardModernExperience`) to allow gradual rollout.
3. Start Phase 1 implementation: establish new component structure and base hooks.
