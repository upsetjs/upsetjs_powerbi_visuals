/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import { LicenseManager } from './internal/LicenseManager';
import { defaults, UpSetBaseThemeSettings, UpSetCombinationSettings, UpSetFontSizeSettings } from './utils/settings';
import secretsJson from './secrets.json';

export default class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  readonly license = new LicenseManager(secretsJson.key);
  readonly theme = new UpSetThemeSettings();
  readonly fonts = new UpSetFontSizeSettings();
  readonly combinations = new UpSetCombinationSettings();
  readonly style = new UpSetStyleSettings();
}

export class UpSetThemeSettings extends UpSetBaseThemeSettings {
  alternatingBackgroundColor = defaults.alternatingBackgroundColor;
  hoverHintColor = defaults.hoverHintColor;
  notMemberColor = defaults.notMemberColor;
}

export class UpSetStyleSettings {
  setName = defaults.setName;
  combinationName = defaults.combinationName;
  numericScale = defaults.numericScale;
  setNameAxisOffset = defaults.setNameAxisOffset;
  combinationNameAxisOffset = defaults.combinationNameAxisOffset;
}
