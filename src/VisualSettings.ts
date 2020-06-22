/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import powerbi from 'powerbi-visuals-api';
import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import { fillDefaults, GenerateSetCombinationsOptions, UpSetFontSizes } from '@upsetjs/bundle';
import { LicenseManager } from './LicenseManager';

export default class VisualSettings extends DataViewObjectsParser {
  readonly license = new LicenseManager('UVWXYZ01234tuvwxyzABCDEFGHIJKLMhijklmnopqrsNOPQRST56789+/=abcdefg');
  readonly theme = new UpSetThemeSettings();
  readonly fonts = new UpSetFontSizeSettings();
  readonly combinations = new UpSetCombinationSettings();
  readonly style = new UpSetStyleSettings();
}

export const defaults = fillDefaults({ sets: [], width: 100, height: 100 });

export class UpSetThemeSettings {
  theme = 'light';
  color = defaults.color;
  opacity = defaults.opacity;
  hasSelectionColor = defaults.hasSelectionColor;
  hasSelectionOpacity = defaults.hasSelectionOpacity;
  textColor = defaults.textColor;
  selectionColor = defaults.selectionColor;
  alternatingBackgroundColor = defaults.alternatingBackgroundColor;
  hoverHintColor = defaults.hoverHintColor;
  notMemberColor = defaults.notMemberColor;

  generate(colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette, data: powerbi.DataViewCategorical) {
    const keys: (keyof Omit<UpSetThemeSettings, 'generate'>)[] = [
      'theme',
      'color',
      'opacity',
      'hasSelectionColor',
      'hasSelectionOpacity',
      'alternatingBackgroundColor',
      'hoverHintColor',
      'notMemberColor',
      'selectionColor',
      'textColor',
    ];
    const r: any = {};
    if (this.theme === 'powerbi') {
      Object.assign(r, generatePowerBITheme(colorPalette));
    } else if (this.theme === 'auto') {
      Object.assign(r, generateAutoPowerBITheme(colorPalette, data));
    } else {
      r.theme = this.theme;
    }
    keys.forEach((key) => {
      const defaultValue = (<any>defaults)[key];
      const current = this[key];
      if (current !== defaultValue) {
        r[key] = current;
      }
    });
    return r;
  }
}

export class UpSetFontSizeSettings {
  fontFamily = 'Segoe UI';
  barLabel = 7; // pt
  chartLabel = 12; // pt
  setLabel = 12; // pt

  generate(): UpSetFontSizes {
    return {
      barLabel: `${this.barLabel}pt`,
      chartLabel: `${this.chartLabel}pt`,
      setLabel: `${this.setLabel}pt`,
    };
  }
}

export function generatePowerBITheme(colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette) {
  const c = colorPalette.foreground.value;
  return {
    color: c,
    textColor: colorPalette.foregroundButton.value,
    selectionColor: colorPalette.foregroundSelected.value,
    opacity: 1,
    hasSelectionOpacity: 0.4,
  };
}

export function generateAutoPowerBITheme(
  colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette,
  data: powerbi.DataViewCategorical
) {
  if (!data.categories || data.categories.length === 0) {
    return {};
  }
  const c = colorPalette.getColor(data.categories[0].source.displayName).value;
  return {
    color: c,
    textColor: colorPalette.foregroundButton.value,
    selectionColor: c,
    opacity: 1,
    hasSelectionOpacity: 0.4,
  };
}

export class UpSetStyleSettings {
  setName = defaults.setName;
  combinationName = defaults.combinationName;
  numericScale = defaults.numericScale;
  setNameAxisOffset = defaults.setNameAxisOffset;
  combinationNameAxisOffset = defaults.combinationNameAxisOffset;
}

export class UpSetCombinationSettings implements GenerateSetCombinationsOptions {
  type: 'intersection' | 'union' = 'intersection';
  min = 0;
  max = 6;
  empty = false;
  order = <'cardinality'>'cardinality,name';
  limit = 100;
}

export function fixOrder(order: string) {
  if (order.includes(',')) {
    return order.split(',');
  }
  return order;
}
