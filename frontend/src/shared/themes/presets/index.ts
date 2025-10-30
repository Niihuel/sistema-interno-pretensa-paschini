/**
 * Theme Presets Index
 * 
 * Exports all available theme presets inspired by shadcn/ui
 * Each preset includes complete color definitions for the theme system
 */

import zincPreset from './zinc.json';
import slatePreset from './slate.json';
import stonePreset from './stone.json';
import grayPreset from './gray.json';
import neutralPreset from './neutral.json';
import redPreset from './red.json';
import rosePreset from './rose.json';
import orangePreset from './orange.json';
import greenPreset from './green.json';
import bluePreset from './blue.json';
import yellowPreset from './yellow.json';
import violetPreset from './violet.json';

export interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  alpha: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  source: 'shadcn' | 'custom';
  variables: Record<string, ColorValue>;
}

export const THEME_PRESETS: ThemePreset[] = [
  zincPreset as ThemePreset,
  slatePreset as ThemePreset,
  stonePreset as ThemePreset,
  grayPreset as ThemePreset,
  neutralPreset as ThemePreset,
  redPreset as ThemePreset,
  rosePreset as ThemePreset,
  orangePreset as ThemePreset,
  greenPreset as ThemePreset,
  bluePreset as ThemePreset,
  yellowPreset as ThemePreset,
  violetPreset as ThemePreset,
];

export const getPresetById = (id: string): ThemePreset | undefined => {
  return THEME_PRESETS.find(preset => preset.id === id);
};

export const getPresetsBySource = (source: 'shadcn' | 'custom'): ThemePreset[] => {
  return THEME_PRESETS.filter(preset => preset.source === source);
};

export default THEME_PRESETS;
