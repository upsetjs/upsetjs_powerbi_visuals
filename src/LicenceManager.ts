/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import VisualSettings, { defaults } from './VisualSettings';
import powerbi from 'powerbi-visuals-api';

const CYPHER_KEY = 'UVWXYZ01234tuvwxyzABCDEFGHIJKLMNOPQRST56789+/=abcdefghijklmnopqrs';

function utf8_decode(e: string) {
  let t = '';
  let n = 0;
  while (n < e.length) {
    const r = e.charCodeAt(n);
    if (r < 128) {
      t += String.fromCharCode(r);
      n++;
    } else if (r > 191 && r < 224) {
      const c2 = e.charCodeAt(n + 1);
      t += String.fromCharCode(((r & 31) << 6) | (c2 & 63));
      n += 2;
    } else {
      const c2 = e.charCodeAt(n + 1);
      const c3 = e.charCodeAt(n + 2);
      t += String.fromCharCode(((r & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      n += 3;
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
  if (!/^\d\d.\d\d.\d\d\d\d$/gm.test(decoded)) {
    return null;
  }
  const arr = decoded.split('.');
  const day = Number.parseInt(arr[0], 10);
  const month = Number.parseInt(arr[1], 10);
  const year = Number.parseInt(arr[1], 10);

  return new Date(year, month - 1, day);
}

export function isValidTrial(license: string) {
  const licenseArr = license.split(':');
  if (licenseArr.length !== 2) {
    return null;
  }
  const licenseDate = licenseArr[0];
  const dtF = isValidDate(licenseDate);
  if (dtF) {
    return dtF;
  }
  return null;
}

export function getInfo(license: string) {
  const licenseArr = license.split(':');
  return `${decode(licenseArr[0])} ${decode(licenseArr[1])}`;
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
    const expirationDate = isValidDate(this.code);
    if (!expirationDate) {
      this.updateInfo(host, 'invalid license code');
      return 'invalid';
    }
    const today = new Date();
    if (today <= expirationDate) {
      this.updateInfo(host, 'valid license');
      return 'valid';
    }
    this.updateInfo(host, 'license expired');
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
  const size = 150 * 1.5;
  const text = 'https://dataviz.boutique';

  const x = size / 2 + fontSize / 2;
  const y = size / 2 + fontSize / 2;

  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='${size}px' width='${size}px' style='fill: rgba(0,0,0,${opacity}); font-size: ${fontSize}; text-anchor: middle'><text transform='translate(${x},${y}) rotate(-45)'>${text}</text></svg>")`;
}
