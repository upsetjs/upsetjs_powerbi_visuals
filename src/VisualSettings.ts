/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import { UpSetThemeProps, fillDefaults, GenerateSetCombinationsOptions } from '@upsetjs/bundle';

export default class VisualSettings extends DataViewObjectsParser {
  readonly theme = new UpSetThemeSettings();
  readonly combinations = new UpSetCombinationSettings();
  readonly style = new UpSetStyleSettings();
}

const defaults = fillDefaults({ sets: [], width: 100, height: 100 });

export class UpSetThemeSettings implements Required<UpSetThemeProps> {
  theme = 'light';
  color = defaults.color;
  textColor = defaults.textColor;
  selectionColor = defaults.selectionColor;
  alternatingBackgroundColor = defaults.alternatingBackgroundColor;
  hoverHintColor = defaults.hoverHintColor;
  notMemberColor = defaults.notMemberColor;

  dropDefaults() {
    const keys: (keyof UpSetThemeSettings)[] = [
      'theme',
      'color',
      'alternatingBackgroundColor',
      'hoverHintColor',
      'notMemberColor',
      'selectionColor',
      'textColor',
    ];
    const r: any = {};
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
