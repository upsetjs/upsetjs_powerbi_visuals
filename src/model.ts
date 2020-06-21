/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import {
  ISet,
  asSets,
  ISetCombinations,
  ISetCombination,
  ISetLike,
  isSetCombination,
  UpSetAddonHandlerInfos,
  UpSetAddonHandlerInfo,
  ICategoryBins,
  IBoxPlot,
} from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';

export declare type IPowerBIElem = {
  s?: powerbi.visuals.ISelectionId;
  v: powerbi.PrimitiveValue;
  cat?: powerbi.DataViewCategoryColumn;
  i: number;
  attrs: (number | string)[];
};

export declare type IPowerBIElems = readonly IPowerBIElem[];

export interface IPowerBISet extends ISet<IPowerBIElem> {
  value: powerbi.DataViewValueColumn;
  s?: powerbi.visuals.ISelectionId;
}

export declare type IPowerBISetCombination = ISetCombination<IPowerBIElem> & {
  s?: powerbi.visuals.ISelectionId;
};

export declare type IPowerBiSetLike = ISetLike<IPowerBIElem> & { s: powerbi.visuals.ISelectionId };
export declare type IPowerBISets = readonly IPowerBISet[];
export declare type IPowerBISetCombinations = readonly IPowerBISetCombination[];

export function isPowerBiSetLike(s: ISetLike<IPowerBIElem>): s is IPowerBiSetLike {
  return (<IPowerBiSetLike>s).s != null;
}

export function isSelection(s: powerbi.extensibility.ISelectionId): s is powerbi.visuals.ISelectionId {
  return s != null && typeof (<powerbi.visuals.ISelectionId>s).includes === 'function';
}

function findSet(
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

function deriveHighlight(elems: IPowerBIElems, data: powerbi.DataViewCategorical) {
  if (!data.values || data.values.length === 0 || data.values[0].highlights == null) {
    return undefined;
  }
  return data.values[0].highlights
    .map((v, i) => (v === null ? null : elems[i]))
    .filter((v): v is IPowerBIElem => v !== null);
}

export function resolveSelection(
  elems: IPowerBIElems,
  sets: IPowerBISets,
  combinations: IPowerBISetCombinations,
  data: powerbi.DataViewCategorical,
  selectionManager: powerbi.extensibility.ISelectionManager,
  interactive: boolean
) {
  const selection: IPowerBIElems | undefined = deriveHighlight(elems, data);
  if (selection) {
    return findSet(selection, sets, combinations);
  }
  if (!interactive) {
    return null;
  }
  const sel = selectionManager.getSelectionIds();
  if (sel.length === 0) {
    return null;
  }
  if (sel.length === 1) {
    // could be a set or a combination elem
    const s = sets.find((s) => s.s === sel[0]);
    if (s) {
      return s;
    }
    const c = combinations.find((s) => s.s === sel[0]);
    if (c) {
      return c;
    }
  }

  // resolve to the elements that are included
  return elems.filter((elem) => sel.some((s) => elem === s || (elem.s && isSelection(s) && s.includes(elem.s))));
}

export function extractElems(
  data: powerbi.DataViewCategorical,
  host: powerbi.extensibility.visual.IVisualHost
): IPowerBIElems {
  const attrs = data.values ? data.values.filter((d) => d.source?.roles?.attributes) : [];

  if (!data.categories || data.categories.length === 0) {
    if (!data.values) {
      return [];
    }
    return data.values.map((_, i) => ({
      v: i,
      i,
      attrs: attrs.map((attr) => <number>attr.values[i]),
    }));
  }
  const cat = data.categories[0]!;
  if (!host.allowInteractions) {
    return cat.values.map((v, i) => ({
      v,
      i,
      attrs: attrs.map((attr) => <number>attr.values[i]),
    }));
  }
  return cat.values.map((v, i) => ({
    s: host.createSelectionIdBuilder().withCategory(cat, i).createSelectionId(),
    v,
    cat,
    i,
    attrs: attrs.map((attr) => <number>attr.values[i]),
  }));
}

export function extractSets(
  elems: IPowerBIElems,
  data: powerbi.DataViewCategorical,
  host: powerbi.extensibility.visual.IVisualHost
): ReadonlyArray<IPowerBISet> {
  // just the sets
  const sets = data.values ? data.values.filter((d) => d.source?.roles?.sets) : [];
  return asSets(
    sets
      .map((value) => {
        const builder = host.allowInteractions ? host.createSelectionIdBuilder() : null;
        const setElems: IPowerBIElem[] = [];
        value.values.forEach((v, i) => {
          if (!v) {
            return;
          }
          // trueish
          const elem = elems[i];
          setElems.push(elem);
          if (builder && elem.cat) {
            builder.withCategory(elem.cat, elem.i);
          }
        });
        return {
          value,
          name: value.source.displayName,
          s: builder ? builder.createSelectionId() : undefined,
          elems: setElems,
        };
      })
      .reverse()
  );
}

export function injectSelectionId(
  combinations: readonly IPowerBISetCombination[],
  host: powerbi.extensibility.visual.IVisualHost
): ReadonlyArray<IPowerBISetCombination> {
  if (!host.allowInteractions) {
    return combinations;
  }
  combinations.forEach((c) => {
    const builder = host.createSelectionIdBuilder();
    c.elems.forEach((elem) => {
      if (elem.cat) {
        builder.withCategory(elem.cat, elem.i);
      }
    });
    c.s = builder.createSelectionId();
  });
  return combinations;
}

export function createContextMenuHandler(selectionManager: powerbi.extensibility.ISelectionManager) {
  return (selection: ISetLike<IPowerBIElem> | null, evt: MouseEvent) => {
    evt.preventDefault();
    if (!selection) {
      return;
    }
    const sel = isPowerBiSetLike(selection) ? selection : selection.elems[0];
    const id = sel && sel.s != null ? sel.s : {};
    selectionManager.showContextMenu(id, {
      x: evt.clientX,
      y: evt.clientY,
    });
  };
}

export function createSelectionHandler(
  selectionManager: powerbi.extensibility.ISelectionManager,
  selectImpl: (v: ISetLike<IPowerBIElem> | null) => void
) {
  return (selection: ISetLike<IPowerBIElem> | null) => {
    if (!selection) {
      selectionManager.clear().then(() => {
        selectImpl(null);
      });
    } else {
      const sel = isPowerBiSetLike(selection) ? selection.s : selection.elems.map((e) => e.s!);
      selectionManager.select(sel).then(() => {
        selectImpl(selection);
      });
    }
  };
}

function toHeader(s: ISetLike<any>) {
  switch (s.type) {
    case 'composite':
      return 'Set Composite';
    case 'distinctIntersection':
    case 'intersection':
      return 'Set Intersection';
    case 'union':
      return 'Set Union';
    default:
      return 'Set';
  }
}

function renderAddon(addon: UpSetAddonHandlerInfo | null): powerbi.extensibility.VisualTooltipDataItem[] {
  if (!addon) {
    return [];
  }
  if (addon.id === 'categorical') {
    // should be fixed in 1.4.1
    const bins = <ICategoryBins>Object.keys(addon.value)
      .filter((v) => v !== 'toString')
      .map((k) => (<any>addon.value)[k]);
    return [{ displayName: 'Attribute', value: addon.name }].concat(
      bins.map((bin) => ({
        displayName: bin.label,
        color: bin.color,
        value: `${bin.count.toLocaleString()} (${Math.round(100 * bin.percentage)}%)`,
      }))
    );
  }
  if (addon.id === 'boxplot') {
    const b = <IBoxPlot>addon.value;
    const labels = ['Minimum', '25% Quantile', 'Median', '75% Quantile', 'Maximum'];
    const values = [b.min, b.q1, b.median, b.q3, b.max];
    return [{ displayName: 'Attribute', value: addon.name }].concat(
      labels.map((l, i) => ({ displayName: l, value: values[i].toFixed(2) }))
    );
  }
  return [];
}

const TOOLTIP_DELAY = 250;

export declare type OnHandler = (
  selection: ISetLike<IPowerBIElem> | null,
  evt: MouseEvent,
  addons: UpSetAddonHandlerInfos
) => void;

export function createTooltipHandler(
  target: HTMLElement,
  host: powerbi.extensibility.visual.IVisualHost
): [OnHandler | undefined, OnHandler | undefined] {
  if (!host.tooltipService.enabled()) {
    return [undefined, undefined];
  }

  const createArgs = (selection: ISetLike<IPowerBIElem>, evt: MouseEvent, addons: UpSetAddonHandlerInfos) => {
    const bb = target.getBoundingClientRect();
    const coordinates = [evt.clientX - bb.left - target.clientLeft, evt.clientY - bb.top - target.clientTop];

    const sel = isPowerBiSetLike(selection) ? selection.s : selection.elems.map((e) => e.s!);
    return <powerbi.extensibility.TooltipShowOptions>{
      isTouchEvent: false,
      coordinates,
      dataItems: [
        {
          header: toHeader(selection),
          displayName: selection.name,
          value: selection.cardinality.toLocaleString(),
        },
        ...(isSetCombination(selection) && selection.degree > 1
          ? Array.from(selection.sets).map((s) => ({ displayName: s.name, value: s.cardinality.toLocaleString() }))
          : []),
        ...(<powerbi.extensibility.VisualTooltipDataItem[]>[]).concat(...addons.map(renderAddon)),
      ],
      identities: [sel],
    };
  };

  let visible = false;
  let timeout = -1;

  return [
    (s, evt, addons) => {
      if (timeout >= 0) {
        clearTimeout(timeout);
        timeout = -1;
      }
      if (!s) {
        visible = false;
        host.tooltipService.hide({
          immediately: false,
          isTouchEvent: false,
        });
        return;
      }
      timeout = self.setTimeout(() => {
        const args = createArgs(s, evt, addons);
        visible = true;
        host.tooltipService.show(args);
      }, TOOLTIP_DELAY);
    },
    (s, evt, addons) => {
      if (!s || !visible) {
        return;
      }
      const args = createArgs(s, evt, addons);
      host.tooltipService.move(args);
    },
  ];
}
