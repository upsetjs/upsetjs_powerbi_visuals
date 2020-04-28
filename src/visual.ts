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
  renderUpSet,
  asSets,
  ISet,
  UpSetProps,
  ISetLike,
  generateCombinations,
  ISetCombinations,
  boxplotAddon,
} from '@upsetjs/bundle';

declare type IPowerBIElem = {
  s?: powerbi.visuals.ISelectionId;
  v: powerbi.PrimitiveValue;
  attrs: number[];
};
declare type IPowerBIElems = ReadonlyArray<IPowerBIElem>;

interface IPowerBISet extends ISet<IPowerBIElem> {
  value: powerbi.DataViewValueColumn;
}

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

  constructor(options: VisualConstructorOptions) {
    this.target = options.element;
    this.interactive = options.host.allowInteractions;
    this.selectionManager = options.host.createSelectionManager();
    this.host = options.host;
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

  private render() {
    renderUpSet(this.target, this.props);
  }

  update(options: VisualUpdateOptions) {
    try {
      this.host.eventService.renderingStarted(options);
      this.renderImpl(options);
      this.host.eventService.renderingFinished(options);
    } catch (error) {
      this.host.eventService.renderingFailed(options, String(error));
    }
  }

  private renderImpl(options: VisualUpdateOptions) {
    const dataView = options.dataViews[0];
    this.settings = Visual.parseSettings(dataView);

    const areDummyValues = dataView.categorical!.categories.length === 0;

    const elems = this.extractElems(dataView.categorical!);
    const sets = this.extractSets(elems, dataView.categorical!);
    const combinations = generateCombinations(
      sets,
      Object.assign({}, this.settings.combinations, {
        order: fixOrder(this.settings.combinations.order),
        elems,
      })
    );

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
      this.settings.theme.dropDefaults(),
      this.settings.style
    );

    this.injectAttributes(dataView.categorical!);

    if (!areDummyValues && this.interactive) {
      this.props.onClick = this.setSelection;
    }

    this.render();
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
    sets: ReadonlyArray<IPowerBISet>,
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
