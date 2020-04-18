import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import { UpSetThemeProps, fillDefaults, GenerateSetCombinationsOptions } from '@upsetjs/bundle';

export default class VisualSettings extends DataViewObjectsParser {
  theme: UpSetThemeSettings = new UpSetThemeSettings();
  combinations: UpSetCombinationSettings = new UpSetCombinationSettings();
}

const defaults = fillDefaults({ sets: [], width: 100, height: 100 });

export class UpSetThemeSettings implements Required<UpSetThemeProps> {
  selectionColor = defaults.selectionColor;
  alternatingBackgroundColor = defaults.alternatingBackgroundColor;
  color = defaults.color;
  textColor = defaults.textColor;
  hoverHintColor = defaults.hoverHintColor;
  notMemberColor = defaults.notMemberColor;
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
