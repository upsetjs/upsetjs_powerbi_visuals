/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import 'core-js/stable';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import VisualSettings, { fixOrder } from './VisualSettings';
import {
  render,
  asSets,
  ISet,
  UpSetProps,
  ISetLike,
  generateCombinations,
  ISetCombinations,
  boxplotAddon,
} from '@upsetjs/bundle';
import { usesProFeatures, createWatermarkUrl } from './LicenceManager';

declare type IPowerBIElem = {
  s?: powerbi.visuals.ISelectionId;
  v: powerbi.PrimitiveValue;
  attrs: number[];
};
declare type IPowerBIElems = ReadonlyArray<IPowerBIElem>;

interface IPowerBISet extends ISet<IPowerBIElem> {
  value: powerbi.DataViewValueColumn;
}

declare type IPowerBISets = ReadonlyArray<IPowerBISet>;

function isSelection(s: powerbi.extensibility.ISelectionId): s is powerbi.visuals.ISelectionId {
  return s != null && typeof (<powerbi.visuals.ISelectionId>s).includes === 'function';
}

export class Visual implements IVisual {
  private readonly target: HTMLElement;
  private readonly interactive: boolean;
  private settings: VisualSettings = <VisualSettings>VisualSettings.getDefault();
  private readonly selectionManager: powerbi.extensibility.ISelectionManager;
  private readonly host: powerbi.extensibility.visual.IVisualHost;

  private props: UpSetProps<IPowerBIElem> = { sets: [], width: 100, height: 100 };

  // private readonly license = new LicenceManager();

  constructor(options: VisualConstructorOptions) {
    this.target = options.element;
    this.interactive = options.host.allowInteractions;
    this.selectionManager = options.host.createSelectionManager();
    this.host = options.host;
    this.renderPlaceholder();
  }

  private setSelection = (selection: ISetLike<IPowerBIElem> | null) => {
    if (!selection) {
      this.selectionManager.clear().then(() => {
        this.props.selection = null;
        this.render();
      });
    } else {
      this.selectionManager.select(selection.elems.map((e) => e.s!)).then(() => {
        this.props.selection = selection;
        this.render();
      });
    }
  };

  private onContextMenu = (selection: ISetLike<IPowerBIElem> | null, evt: MouseEvent) => {
    this.selectionManager.showContextMenu(selection && selection.elems.length > 0 ? selection.elems[0].s : {}, {
      x: evt.clientX,
      y: evt.clientY,
    });
    evt.preventDefault();
  };

  private render() {
    render(this.target, this.props);
  }

  update(options: VisualUpdateOptions) {
    try {
      this.host.eventService.renderingStarted(options);
      const success = this.renderImpl(options);
      if (!success) {
        this.renderPlaceholder();
      }
      this.host.eventService.renderingFinished(options);
    } catch (error) {
      this.host.eventService.renderingFailed(options, String(error));
    }
  }

  private renderPlaceholder() {
    this.target.textContent = '';
    // eslint-disable-next-line @typescript-eslint/tslint/config
    const ns = 'http://www.w3.org/2000/svg';
    const doc = this.target.ownerDocument;
    const svg = doc.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 300 200');
    svg.style.width = '100%';
    svg.style.height = '100%';
    this.target.style.position = 'relative';
    this.target.appendChild(svg);

    const rect = (x: number, y: number, w: number, h: number, bg: string = '#A6A8AB') => {
      const rect = doc.createElementNS(ns, 'rect');
      rect.setAttribute('x', x.toString());
      rect.setAttribute('y', y.toString());
      rect.setAttribute('width', w.toString());
      rect.setAttribute('height', h.toString());
      rect.setAttribute('fill', bg);
      return rect;
    };
    const circle = (x: number, y: number, d: number, filled: boolean) => {
      const circle = doc.createElementNS(ns, 'circle');
      circle.setAttribute('cx', (x + d / 2).toString());
      circle.setAttribute('cy', (y + d / 2).toString());
      circle.setAttribute('r', (d / 2).toString());
      circle.setAttribute('fill', filled ? '#A6A8AB' : '#E1E2E3');
      return circle;
    };
    svg.appendChild(rect(0, 0, 300, 200, '#F4F4F4'));
    const wi = 20;
    const padding = 10;

    const sWidth = 75;
    const sY = 110;

    const cHeight = 100;
    const csX = 85;

    const cOffsets = [10, 20, 35, 60, 65, 80, 90];
    const sOffsets = [50, 30, 15];
    cOffsets.forEach((offset, i) => {
      svg.appendChild(rect(csX + i * (wi + padding), offset, wi, cHeight - offset));
    });

    sOffsets.forEach((offset, j) => {
      svg.appendChild(rect(offset, sY + j * (wi + padding), sWidth - offset, wi));
    });

    cOffsets.forEach((_, i) => {
      sOffsets.forEach((_, j) => {
        const filled = j === 2 - i || (i == 3 && j > 0) || (i === 4 && j !== 1) || (i === 5 && j < 2) || i === 6;
        svg.appendChild(circle(csX + i * (wi + padding), sY + j * (wi + padding), wi, filled));
      });
    });
    const lw = 6;
    svg.appendChild(rect(csX + (wi - lw) / 2 + 3 * (wi + padding), sY + 10 + 1 * (wi + padding), lw, 30));
    svg.appendChild(rect(csX + (wi - lw) / 2 + 4 * (wi + padding), sY + 10, lw, 60));
    svg.appendChild(rect(csX + (wi - lw) / 2 + 5 * (wi + padding), sY + 10, lw, 30));
    svg.appendChild(rect(csX + (wi - lw) / 2 + 6 * (wi + padding), sY + 10, lw, 60));
  }

  private renderImpl(options: VisualUpdateOptions) {
    // reset watermark
    this.target.style.background = null;

    if (options.dataViews.length === 0) {
      return false;
    }
    const dataView = options.dataViews[0];
    this.settings = Visual.parseSettings(dataView);

    const areDummyValues = dataView.categorical!.categories.length === 0;

    // handle window
    const elems = this.extractElems(dataView.categorical!);
    const sets = elems.length === 0 ? [] : this.extractSets(elems, dataView.categorical!);

    if (sets.length === 0) {
      return false;
    }

    this.verifyLicense(
      sets.length,
      dataView.categorical!.values.reduce((acc, d) => acc + (d.source.roles.attributes ? 1 : 0), 0)
    );

    if (dataView.metadata.segment) {
      // load more chunks
      requestAnimationFrame(() => this.host.fetchMoreData());
    }

    const combinations = generateCombinations(
      sets,
      Object.assign({}, this.settings.combinations, {
        order: fixOrder(this.settings.combinations.order),
        elems,
      })
    );
    if (combinations.length === 0) {
      return false;
    }

    let selection: IPowerBIElems = this.deriveSelection(elems, dataView.categorical!);
    if (!selection && !areDummyValues && this.interactive) {
      selection = this.fromSelection(elems);
    }

    this.props = Object.assign(
      {
        sets,
        width: options.viewport.width,
        height: options.viewport.height,
        combinations,
        selection: this.findSet(selection, sets, combinations),
        exportButtons: false,
      },
      this.settings.theme.generate(this.host.colorPalette, dataView.categorical!),
      this.settings.style
    );

    this.injectAttributes(dataView.categorical!);

    if (!areDummyValues && this.interactive) {
      this.props.onClick = this.setSelection;
      this.props.onContextMenu = this.onContextMenu;
    }

    this.render();
    return true;
  }

  private verifyLicense(numSets: number, numAttributes: number) {
    const state = this.settings.license.updateLicenseState(this.host);
    if (state === 'valid' || !usesProFeatures(numSets, numAttributes, this.settings)) {
      return;
    }
    this.target.style.background = createWatermarkUrl();
  }

  private injectAttributes(data: powerbi.DataViewCategorical) {
    const attrs = data.values.filter((d) => d.source.roles.attributes);

    if (attrs.length === 0) {
      return;
    }

    this.props.setAddons = attrs.map((attr, i) =>
      boxplotAddon(
        (v) => v.attrs[i],
        {
          min: <number>attr.minLocal,
          max: <number>attr.maxLocal,
        },
        {
          name: attr.source.displayName,
        }
      )
    );
    this.props.combinationAddons = attrs.map((attr, i) =>
      boxplotAddon(
        (v) => v.attrs[i],
        {
          min: <number>attr.minLocal,
          max: <number>attr.maxLocal,
        },
        {
          name: attr.source.displayName,
          orient: 'vertical',
        }
      )
    );
  }

  private deriveSelection(elems: IPowerBIElems, data: powerbi.DataViewCategorical) {
    if (data.values.length === 0 || data.values[0].highlights == null) {
      return undefined;
    }
    return data.values[0].highlights.map((v, i) => (v === null ? null : elems[i])).filter((v) => v !== null);
  }

  private fromSelection(elems: IPowerBIElems): IPowerBIElems | undefined {
    const sel = this.selectionManager.getSelectionIds();

    if (sel.length === 0) {
      return undefined;
    }
    return elems.filter((elem) => sel.some((s) => elem === s || (elem.s && isSelection(s) && s.includes(elem.s))));
  }

  private findSet(
    selection: IPowerBIElems | undefined,
    sets: IPowerBISets,
    combinations: ISetCombinations<IPowerBIElem>
  ) {
    if (!selection || selection.length === 0) {
      return undefined;
    }
    const toFind = new Set(selection);
    const set = sets.find((s) => {
      if (s.cardinality !== selection.length) {
        return false;
      }
      return s.elems.every((e) => toFind.has(e));
    });
    if (set) {
      return set;
    }
    const c = combinations.find((s) => {
      if (s.cardinality !== selection.length) {
        return false;
      }
      return s.elems.every((e) => toFind.has(e));
    });
    if (c) {
      return c;
    }
    return selection;
  }

  private extractElems(data: powerbi.DataViewCategorical): IPowerBIElems {
    const attrs = data.values.filter((d) => d.source.roles.attributes);

    if (data.categories.length === 0) {
      return data.values.map((_, i) => ({
        v: i,
        attrs: attrs.map((attr) => <number>attr.values[i]),
      }));
    }
    const cat = data.categories[0]!;
    if (!this.interactive) {
      return cat.values.map((v, i) => ({
        v,
        attrs: attrs.map((attr) => <number>attr.values[i]),
      }));
    }
    return cat.values.map((v, i) => ({
      s: this.host.createSelectionIdBuilder().withCategory(cat, i).createSelectionId(),
      v,
      attrs: attrs.map((attr) => <number>attr.values[i]),
    }));
  }

  private extractSets(elems: IPowerBIElems, data: powerbi.DataViewCategorical): ReadonlyArray<IPowerBISet> {
    // just the sets
    const sets = data.values.filter((d) => d.source.roles.sets);
    return asSets(
      sets
        .map((value) => {
          const vs = value.values;
          return {
            value,
            name: value.source.displayName,
            elems: vs.map((v, i) => (v ? elems[i] : null)).filter((v) => v != null),
          };
        })
        .reverse()
    );
  }

  private static parseSettings(dataView: DataView): VisualSettings {
    return VisualSettings.parse(dataView);
  }

  /**
   * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
   * objects and properties you want to expose to the users in the property pane.
   *
   */
  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    return VisualSettings.enumerateObjectInstances(this.settings, options);
  }
}
