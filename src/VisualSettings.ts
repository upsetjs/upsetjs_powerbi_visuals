import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import { UpSetThemeProps, fillDefaults } from '@upsetjs/bundle';

export default class VisualSettings extends DataViewObjectsParser {
  public theme: UpSetThemeSettings = new UpSetThemeSettings();
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
