/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import powerbi from 'powerbi-visuals-api';
import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import { fillDefaults, GenerateSetCombinationsOptions } from '@upsetjs/bundle';
import { LicenseManager } from './LicenseManager';

export default class VisualSettings extends DataViewObjectsParser {
  readonly license = new LicenseManager('UVWXYZ01234tuvwxyzABCDEFGHIJKLMhijklmnopqrsNOPQRST56789+/=abcdefg');
  readonly theme = new UpSetThemeSettings();
  readonly combinations = new UpSetCombinationSettings();
  readonly style = new UpSetStyleSettings();
}

export const defaults = fillDefaults({ sets: [], width: 100, height: 100 });

export class UpSetThemeSettings {
  theme = 'light';
  color = defaults.color;
  hasSelectionColor = defaults.hasSelectionColor;
  textColor = defaults.textColor;
  selectionColor = defaults.selectionColor;
  alternatingBackgroundColor = defaults.alternatingBackgroundColor;
  hoverHintColor = defaults.hoverHintColor;
  notMemberColor = defaults.notMemberColor;

  generate(colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette, data: powerbi.DataViewCategorical) {
    const keys: (keyof UpSetThemeSettings)[] = [
      'theme',
      'color',
      'hasSelectionColor',
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

export function generatePowerBITheme(colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette) {
  const c = colorPalette.foreground.value;
  return {
    color: c,
    textColor: colorPalette.foregroundButton.value,
    selectionColor: colorPalette.foregroundSelected.value,
    hasSelectionColor: c.startsWith('#') ? `${c}66` : c.replace('rgb(', 'rgba(').replace(')', ',0.4)'),
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
    hasSelectionColor: c.startsWith('#') ? `${c}66` : c.replace('rgb(', 'rgba(').replace(')', ',0.4)'),
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
