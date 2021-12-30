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
import secrets from './secrets';

const decoder = compositeDecoder([base64Decoder(secrets.key), decodeAndVerifyECDSASignature(secrets.ecdsa.public)]);

export default class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  readonly license = new LicenseSettings(decoder, 'https://dataviz.boutique');
  readonly theme = new UpSetThemeSettings();
  readonly fonts = new UpSetFontSizeSettings();
  readonly combinations = new UpSetCombinationSettings();
  readonly sets = new UpSetSetSettings();
  readonly style = new UpSetStyleSettings();
}

export class UpSetThemeSettings extends UpSetBaseThemeSettings {
  alternatingBackgroundColor = defaults.alternatingBackgroundColor;
  hoverHintColor = defaults.hoverHintColor;
  notMemberColor = defaults.notMemberColor;
}

export class UpSetStyleSettings {
  setName = defaults.setName;
  setLabelAlignment = defaults.setLabelAlignment;
  combinationName = defaults.combinationName;
  numericScale = defaults.numericScale;
  setNameAxisOffset = defaults.setNameAxisOffset;
  setMaxScale = defaults.setMaxScale;
  combinationNameAxisOffset = defaults.combinationNameAxisOffset;
  combinationMaxScale = defaults.combinationMaxScale;
}

export class UpSetSetSettings {
  show = true;
  displayName = 'Sets';
  order = 'inherit';
  limit = 10;
}
