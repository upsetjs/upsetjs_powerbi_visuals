/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2021 Samuel Gratzl <sam@sgratzl.com>
 */

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import LicenseSettings from './utils/LicenseSettings';
import { compositeDecoder, decodeAndVerifyECDSASignature } from './utils/crypto';
import base64Decoder from './internal/base64Decoder';
import { defaults, UpSetBaseThemeSettings, UpSetCombinationSettings, UpSetFontSizeSettings } from './utils/settings';
import secretsJson from './secrets.json';

const decoder = compositeDecoder([
  base64Decoder(secretsJson.key),
  decodeAndVerifyECDSASignature(secretsJson.ecdsa.public),
]);

export default class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  readonly license = new LicenseSettings(decoder, 'https://dataviz.boutique');
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
