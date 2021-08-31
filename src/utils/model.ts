/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2021 Samuel Gratzl <sam@sgratzl.com>
 */
import {
  asSets,
  extractFromExpression,
  ExtractFromExpressionOptions,
  generateCombinations,
  GenerateSetCombinationsOptions,
  ISet,
  ISetCombinations,
} from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';
import { UpSetSetSettings } from 'VisualSettings';
import { IPowerBIElem, IPowerBIElems, IPowerBISet, IPowerBISetCombinations, IPowerBISets } from './interfaces';
import { UniqueColorPalette } from './UniqueColorPalette';

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

export function resolveElementsFromSelection(sel: readonly powerbi.extensibility.ISelectionId[], elems: IPowerBIElems) {
  if (sel.length === 0) {
    return null;
  }
  // resolve to the elements that are included
  return elems.filter((elem) => sel.some((s) => elem === s || (elem.s && isSelection(s) && s.includes(elem.s))));
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
  return resolveElementsFromSelection(selectionManager.getSelectionIds(), elems);
}

export function extractElems(
  data: powerbi.DataViewCategorical,
  host: powerbi.extensibility.visual.IVisualHost
): IPowerBIElems {
  const attrs = data.values?.filter((d) => d.source?.roles?.attributes) ?? [];
  const countColumn = data.values?.find((d) => d.source?.roles?.counts);

  if (!data.categories || data.categories.length === 0) {
    if (!data.values) {
      return [];
    }
    return data.values.map((_, i) => ({
      v: i,
      i,
      attrs: attrs.map((attr) => <number>attr.values[i]),
      count: countColumn ? <number>countColumn.values[i] : 1,
    }));
  }
  const cat = data.categories[0]!;
  if (!host.allowInteractions) {
    return cat.values.map((v, i) => ({
      v,
      i,
      attrs: attrs.map((attr) => <number>attr.values[i]),
      count: countColumn ? <number>countColumn.values[i] : 1,
    }));
  }
  return cat.values.map((v, i) => ({
    s: host.createSelectionIdBuilder().withCategory(cat, i).createSelectionId(),
    v,
    cat,
    i,
    attrs: attrs.map((attr) => <number>attr.values[i]),
    count: countColumn ? <number>countColumn.values[i] : 1,
  }));
}

export function createColorResolver(colorPalette: UniqueColorPalette, setColorObjectName?: string) {
  return (value: powerbi.DataViewValueColumn) => {
    if (!setColorObjectName) {
      return undefined;
    }
    // reserve color in any case
    const base = colorPalette.getColor(value.source.queryName!).value;
    if (value.source.objects && value.source.objects[setColorObjectName]) {
      return (<powerbi.Fill>value.source.objects[setColorObjectName].fill).solid!.color;
    }
    return base;
  };
}

function isPartOfSet(v: powerbi.PrimitiveValue) {
  return !(!v || String(v).toLowerCase().startsWith('f'));
}

function extractBaseSets(
  data: powerbi.DataViewCategorical,
  colorResolver: (value: powerbi.DataViewValueColumn) => string | undefined
) {
  // just the sets
  const sets = data.values ? data.values.filter((d) => d.source?.roles?.sets) : [];
  return sets.map((value, i) => {
    return {
      value,
      index: i,
      values: value.values,
      name: value.source.displayName,
      color: colorResolver(value),
    };
  });
}

function extractSets(
  elems: IPowerBIElems,
  baseSets: ReturnType<typeof extractBaseSets>,
  options: UpSetSetSettings
): readonly IPowerBISet[] {
  const setObjects = asSets(
    baseSets.map((s) => {
      const setElems = elems.filter((_, i) => isPartOfSet(s.values[i]));
      return {
        ...s,
        elems: setElems,
        cardinality: setElems.reduce((acc, elem) => acc + elem.count, 0),
      };
    })
  );

  return postProcessSets(options, setObjects);
}

function postProcessSets(options: UpSetSetSettings, setObjects: IPowerBISet[]): readonly IPowerBISet[] {
  const byName = (a: ISet<IPowerBIElem>, b: ISet<IPowerBIElem>) => a.name.localeCompare(b.name);
  if (options.order === 'cardinality:desc') {
    setObjects.sort((a, b) => {
      if (a.cardinality === b.cardinality) {
        return byName(a, b);
      }
      return b.cardinality - a.cardinality;
    });
  } else if (options.order === 'cardinality') {
    setObjects.sort((a, b) => {
      if (a.cardinality === b.cardinality) {
        return byName(a, b);
      }
      return a.cardinality - b.cardinality;
    });
  } else if (options.order === 'name') {
    setObjects.sort(byName);
  } else if (options.order === 'inherit') {
    setObjects.sort((a, b) => a.index - b.index);
  }
  if (setObjects.length > options.limit) {
    setObjects.splice(options.limit, setObjects.length - options.limit);
  }

  // for visual order
  setObjects.reverse();

  return setObjects;
}

function extractExpressionInput(
  elems: IPowerBIElems,
  baseSets: ReturnType<typeof extractBaseSets>,
  options: UpSetSetSettings,
  genOptions: GenerateSetCombinationsOptions<IPowerBIElem>
): {
  sets: IPowerBISets;
  combinations: IPowerBISetCombinations;
} {
  const type = genOptions.type ?? 'distinctIntersection';
  const { sets, combinations } = extractFromExpression(
    elems.map((elem, i) => {
      return {
        index: i,
        elems: [elem],
        cardinality: elem.count,
      };
    }),
    (e) => baseSets.filter((d) => isPartOfSet(d.values[e.index])).map((d) => d.name),
    {
      setOrder: <ExtractFromExpressionOptions['setOrder']>options.order,
      combinationOrder: genOptions.order,
      type,
    }
  );
  const byName = new Map(baseSets.map((s) => [s.name, s]));
  const typedCombinations = <IPowerBISetCombinations>combinations;
  const typedSets: IPowerBISets = postProcessSets(
    options,
    sets.map((s) => {
      const base = byName.get(s.name);
      if (base) {
        Object.assign(s, base);
      }
      if (type === 'distinctIntersection') {
        // combine all elements into it
        Object.assign(s, {
          elems: combinations
            .filter((d) => d.sets.has(s))
            .reduce((acc, d) => {
              acc.push(...(<IPowerBIElem[]>d.elems));
              return acc;
            }, <IPowerBIElem[]>[]),
        });
      }
      return <IPowerBISet>s;
    })
  );
  return { sets: typedSets, combinations: typedCombinations };
}

export function extractSetsAndCombinations(
  elems: IPowerBIElems,
  data: powerbi.DataViewCategorical,
  options: UpSetSetSettings,
  colorResolver: (value: powerbi.DataViewValueColumn) => string | undefined,
  genOptions: GenerateSetCombinationsOptions<IPowerBIElem>
): {
  sets: IPowerBISets;
  combinations: IPowerBISetCombinations;
} {
  const baseSets = extractBaseSets(data, colorResolver);
  const hasCountColumn = data.values?.find((d) => d.source?.roles?.counts) != null;

  if (!hasCountColumn) {
    const sets = extractSets(elems, baseSets, options);
    if (sets.length === 0) {
      return { sets, combinations: [] };
    }
    const combinations = generateCombinations(sets, genOptions);
    return { sets, combinations };
  }

  return extractExpressionInput(elems, baseSets, options, genOptions);
}
