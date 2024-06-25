/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2024 Samuel Gratzl <sam@sgratzl.com>
 */
import powerbi from 'powerbi-visuals-api';

function isValidDate(decoded: string) {
  if (!/^(\d\d)\.(\d\d)\.(\d\d\d\d)$/gm.test(decoded)) {
    return null;
  }
  const arr = decoded.split('.');
  const day = Number.parseInt(arr[0], 10);
  const month = Number.parseInt(arr[1], 10);
  const year = Number.parseInt(arr[2], 10);

  return new Date(year, month - 1, day);
}

const KNOWN_LICENSES = ['test', 'test2'];

export default class LicenseSettings {
  code = '';
  info = '';
  contact = '';

  readonly _decoder: (code: string) => Promise<string | null>;
  readonly _url: string;

  constructor(decoder: (code: string) => Promise<string | null>, url: string) {
    this._decoder = decoder;
    this._url = url;
    this.contact = url;
  }

  private updateInfo(host: powerbi.extensibility.visual.IVisualHost, info: string) {
    if (this.info === info) {
      return;
    }
    host.persistProperties({
      merge: [
        {
          objectName: 'license',
          selector: '',
          properties: {
            info,
          },
        },
      ],
    });
  }

  private hasLicense(info: powerbi.extensibility.visual.LicenseInfoResult): boolean {
    if (!info.isLicenseInfoAvailable || info.isLicenseUnsupportedEnv || !info.plans) {
      return false;
    }
    return (
      info.plans.find((d) => {
        if (d.state == powerbi.ServicePlanState.Active || d.state == powerbi.ServicePlanState.Warning) {
          return KNOWN_LICENSES.includes(d.spIdentifier);
        }
        return false;
      }) != null
    );
  }

  private deriveLicenseState(
    decoded: string | null,
    host: powerbi.extensibility.visual.IVisualHost,
    licensePlans: powerbi.extensibility.visual.LicenseInfoResult
  ): 'no-license' | 'invalid' | 'valid' | 'expired' {
    if (this.hasLicense(licensePlans)) {
      this.updateInfo(host, `managed license detected`);
      return 'valid';
    }
    if (!decoded || decoded.trim().length === 0) {
      this.updateInfo(host, '');
      return 'no-license';
    }
    if (!decoded.includes(':')) {
      this.updateInfo(host, 'invalid license code');
      return 'invalid';
    }
    const [dateString, customer] = decoded.split(':');
    const expirationDate = isValidDate(dateString);
    if (!expirationDate) {
      this.updateInfo(host, 'invalid license code');
      return 'invalid';
    }
    const today = new Date();
    if (today <= expirationDate) {
      const date = expirationDate.toDateString();
      this.updateInfo(host, `${customer} (valid until ${date})`);
      return 'valid';
    }
    this.updateInfo(host, `${customer} (license expired)`);
    return 'expired';
  }

  updateLicenseState(
    target: HTMLElement,
    host: powerbi.extensibility.visual.IVisualHost,
    licensePlans: powerbi.IPromise<powerbi.extensibility.visual.LicenseInfoResult>,
    usesProFeatures: () => boolean
  ) {
    return Promise.all([this._decoder(this.code), licensePlans]).then(([decoded, plans]) => {
      const state = this.deriveLicenseState(decoded, host, plans);
      if (state === 'valid' || !usesProFeatures()) {
        this.resetWatermark(target);
      } else {
        applyWatermark(target, this._url);
      }
    });
  }

  resetWatermark(target: HTMLElement) {
    target.style.background = '';
  }
}

function applyWatermark(target: HTMLElement, text: string) {
  const fontSize = 30;
  const opacity = 0.2;
  const size = 110 * 2;
  const height = 110 * 2;

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

  const url = `${prefix} height='${height}px' width='${
    size * 1.5
  }px'><g style='${style}'>${white}${grey}${green}${white2}</g></svg>")`;

  target.style.background = url;
}
