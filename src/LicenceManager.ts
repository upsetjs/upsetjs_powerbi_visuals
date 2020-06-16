/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import VisualSettings, { defaults } from './VisualSettings';
import powerbi from 'powerbi-visuals-api';

const CYPHER_KEY = 'UVWXYZ01234tuvwxyzABCDEFGHIJKLMhijklmnopqrsNOPQRST56789+/=abcdefg';

function utf8_decode(e: string) {
  let t = '';
  let n = 0;
  // 6 bit encoding
  while (n < e.length) {
    const r = e.charCodeAt(n++);
    if (r < 128) {
      t += String.fromCharCode(r);
    } else if (r > 191 && r < 224) {
      const c2 = e.charCodeAt(n++);
      t += String.fromCharCode(((r & 31) << 6) | (c2 & 63));
    } else {
      const c2 = e.charCodeAt(n++);
      const c3 = e.charCodeAt(n++);
      t += String.fromCharCode(((r & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
    }
  }
  return t;
}

function decode(e: string) {
  let t = '';
  let f = 0;
  e = e.replace(/[^A-Za-z0-9+/=]/g, '');
  while (f < e.length) {
    const s = CYPHER_KEY.indexOf(e.charAt(f++));
    const o = CYPHER_KEY.indexOf(e.charAt(f++));
    const u = CYPHER_KEY.indexOf(e.charAt(f++));
    const a = CYPHER_KEY.indexOf(e.charAt(f++));
    const n = (s << 2) | (o >> 4);
    const r = ((o & 15) << 4) | (u >> 2);
    const i = ((u & 3) << 6) | a;
    t = t + String.fromCharCode(n);
    if (u !== 64) {
      t = t + String.fromCharCode(r);
    }
    if (a !== 64) {
      t = t + String.fromCharCode(i);
    }
  }
  t = utf8_decode(t);
  return t;
}

function isValidDate(license: string) {
  const decoded = decode(license);
  if (!/^(\d\d)\.(\d\d)\.(\d\d\d\d)$/gm.test(decoded)) {
    return null;
  }
  const arr = decoded.split('.');
  const day = Number.parseInt(arr[0], 10);
  const month = Number.parseInt(arr[1], 10);
  const year = Number.parseInt(arr[2], 10);

  return new Date(year, month - 1, day);
}

export class LicenseSettings {
  code = '';
  info = '';

  private updateInfo(host: powerbi.extensibility.visual.IVisualHost, info: string) {
    if (this.info === info) {
      return;
    }
    host.persistProperties({
      merge: [
        {
          objectName: 'license',
          selector: null,
          properties: {
            info,
          },
        },
      ],
    });
  }

  updateLicenseState(host: powerbi.extensibility.visual.IVisualHost): 'no-license' | 'invalid' | 'valid' | 'expired' {
    if (this.code.trim().length === 0) {
      this.updateInfo(host, '');
      return 'no-license';
    }
    if (!this.code.includes(':')) {
      this.updateInfo(host, 'invalid license code');
      return 'invalid';
    }
    const [dateCode, customerCode] = this.code.split(':');
    const expirationDate = isValidDate(dateCode);
    if (!expirationDate) {
      this.updateInfo(host, 'invalid license code');
      return 'invalid';
    }
    console.log(expirationDate);
    const customer = decode(customerCode);
    const today = new Date();
    if (today <= expirationDate) {
      this.updateInfo(host, `${customer}: valid license`);
      return 'valid';
    }
    this.updateInfo(host, `${customer}: license expired`);
    return 'expired';
  }
}

export function usesProFeatures(numSets: number, numAttributes: number, settings: VisualSettings) {
  if (numSets > 4 || numAttributes > 0) {
    return true;
  }

  const theme = settings.theme;
  if (theme.theme !== 'light') {
    return true;
  }

  const combinations = settings.combinations;
  if (<string>combinations.order !== 'cardinality,name') {
    return true;
  }

  const style = settings.style;
  if (style.numericScale !== defaults.numericScale) {
    return true;
  }

  return false;
}

export function createWatermarkUrl() {
  const fontSize = 30;
  const opacity = 0.2;
  const size = 110 * 2;
  const height = 110 * 2;
  const text = 'https://dataviz.boutique';

  const x = size / 2;
  const y = height / 2;

  const grey = `<text transform='translate(${x},${y}) rotate(-45)'>${text}</text>`;
  const green = `<text transform='translate(${
    x + size * 0.5
  },${y}) rotate(-45)' fill='rgb(190, 227, 190)'>${text}</text>`;
  const white = `<text transform='translate(${x + size * 1},${y}) rotate(-45)' fill='white'>${text}</text>`;
  const white2 = `<text transform='translate(${x + size * -0.5},${y}) rotate(-45)' fill='white'>${text}</text>`;
  const style = `fill: black; font-size: ${fontSize}; text-anchor: middle; dominant-baseline: central; fill-opacity: ${opacity}`;
  const prefix = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1'`;

  return `${prefix} height='${height}px' width='${
    size * 1.5
  }px'><g style='${style}'>${white}${grey}${green}${white2}</g></svg>")`;
}
