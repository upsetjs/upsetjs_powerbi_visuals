/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2024 Samuel Gratzl <sam@sgratzl.com>
 */

import LicenseSettings from './utils/LicenseSettings';
import { compositeDecoder, decodeAndVerifyECDSASignature } from './utils/crypto';
import base64Decoder from './internal/base64Decoder';
import { defaults, UpSetBaseThemeSettings, UpSetCombinationSettings, UpSetFontSizeSettings } from './utils/settings';
import secrets from './secrets';
import { formattingSettings } from 'powerbi-visuals-utils-formattingmodel';

const decoder = compositeDecoder([base64Decoder(secrets.key), decodeAndVerifyECDSASignature(secrets.ecdsa.public)]);

export default class VisualSettings extends formattingSettings.Model {
  readonly license = new LicenseSettings(decoder, 'https://www.sgratzl.com') satisfies formattingSettings.CompositeCard;
  readonly theme = new UpSetThemeSettings() satisfies formattingSettings.CompositeCard;
  readonly fonts = new UpSetFontSizeSettings() satisfies formattingSettings.CompositeCard;
  readonly combinations = new UpSetCombinationSettings() satisfies formattingSettings.CompositeCard;
  readonly sets = new UpSetSetSettings() satisfies formattingSettings.CompositeCard;
  readonly style = new UpSetStyleSettings() satisfies formattingSettings.CompositeCard;

  // Add formatting settings card to cards list in model
  cards: formattingSettings.Cards[] = [this.license, this.theme, this.fonts, this.combinations, this.sets, this.style];
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
