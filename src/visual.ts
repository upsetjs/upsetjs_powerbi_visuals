/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import 'core-js/stable';
import powerbi from 'powerbi-visuals-api';
import VisualSettings, { fixOrder, defaults } from './VisualSettings';
import { render, UpSetProps, ISetLike, generateCombinations, boxplotAddon, categoricalAddon } from '@upsetjs/bundle';
import createSkeleton from './createSkeleton';
import {
  extractSets,
  extractElems,
  IPowerBIElem,
  injectSelectionId,
  resolveSelection,
  createContextMenuHandler,
  createSelectionHandler,
  createTooltipHandler,
} from './model';

export class Visual implements powerbi.extensibility.visual.IVisual {
  private readonly target: HTMLElement;
  private settings: VisualSettings = <VisualSettings>VisualSettings.getDefault();
  private readonly selectionManager: powerbi.extensibility.ISelectionManager;
  private readonly host: powerbi.extensibility.visual.IVisualHost;

  private props: UpSetProps<IPowerBIElem> = { sets: [], width: 100, height: 100 };
  private readonly onContextMenu: (v: ISetLike<IPowerBIElem> | null, evt: MouseEvent) => void;
  private readonly setSelection: (v: ISetLike<IPowerBIElem> | null) => void;
  private readonly onHover: undefined | ((v: ISetLike<IPowerBIElem> | null, evt: MouseEvent) => void);

  // private readonly license = new LicenceManager();

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
    this.target = options.element;
    this.selectionManager = options.host.createSelectionManager();
    this.host = options.host;
    this.renderPlaceholder();
    this.onHover = createTooltipHandler(this.target, this.host);
    this.onContextMenu = createContextMenuHandler(this.selectionManager);
    this.setSelection = createSelectionHandler(this.selectionManager, (s) => {
      this.props.selection = s;
      this.render();
    });
  }

  private render() {
    render(this.target, this.props);
  }

  update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
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
    this.target.style.position = 'relative';
    this.target.appendChild(createSkeleton(this.target.ownerDocument));
  }

  private renderImpl(options: powerbi.extensibility.visual.VisualUpdateOptions) {
    // reset watermark
    this.settings.license.resetWatermark(this.target);

    if (options.dataViews.length === 0) {
      return false;
    }
    const dataView = options.dataViews[0];
    this.settings = VisualSettings.parse(dataView);
    if (!dataView.categorical || !dataView.categorical.categories) {
      return false;
    }

    const areDummyValues = dataView.categorical!.categories.length === 0;

    // handle window
    const elems = extractElems(dataView.categorical!, this.host);
    const sets = elems.length === 0 ? [] : extractSets(elems, dataView.categorical!, this.host);

    dataView.categorical.values?.grouped();

    if (sets.length === 0 || !dataView.categorical!.values) {
      return false;
    }

    this.verifyLicense(
      sets.length,
      dataView.categorical!.values.reduce((acc, d) => acc + (d.source?.roles?.attributes ? 1 : 0), 0)
    );

    if (dataView.metadata.segment) {
      // load more chunks
      requestAnimationFrame(() => this.host.fetchMoreData());
    }

    const combinations = injectSelectionId(
      generateCombinations(
        sets,
        Object.assign({}, this.settings.combinations, {
          order: fixOrder(this.settings.combinations.order),
          elems,
        })
      ),
      this.host
    );
    if (combinations.length === 0) {
      return false;
    }

    const selection = resolveSelection(
      elems,
      sets,
      combinations,
      dataView.categorical!,
      this.selectionManager,
      !areDummyValues && this.host.allowInteractions
    );

    this.props = Object.assign(
      {
        sets,
        width: options.viewport.width,
        height: options.viewport.height,
        combinations,
        selection,
        exportButtons: false,
      },
      this.settings.theme.generate(this.host.colorPalette, dataView.categorical!),
      this.settings.style
    );

    this.injectAttributes(dataView.categorical!);

    if (!areDummyValues && this.host.allowInteractions) {
      this.props.onClick = this.setSelection;
      this.props.onContextMenu = this.onContextMenu;
      this.props.onHover = this.onHover;
    }

    this.render();
    return true;
  }

  private verifyLicense(numSets: number, numAttributes: number) {
    this.settings.license.updateLicenseState(this.target, this.host, () =>
      usesProFeatures(numSets, numAttributes, this.settings)
    );
  }

  private injectAttributes(data: powerbi.DataViewCategorical) {
    const attrs = data.values ? data.values.filter((d) => d.source?.roles?.attributes) : [];

    if (attrs.length === 0) {
      return;
    }

    function asAddon(attr: powerbi.DataViewValueColumn, i: number, vertical: boolean) {
      if (attr.source.type && (attr.source.type.integer || attr.source.type.numeric || attr.source.type.duration)) {
        return boxplotAddon(
          (v: IPowerBIElem) => <number>v.attrs[i],
          {
            min: <number>attr.minLocal,
            max: <number>attr.maxLocal,
          },
          {
            name: attr.source.displayName,
            orient: vertical ? 'vertical' : 'horizontal',
          }
        );
      }
      return categoricalAddon(
        (v: IPowerBIElem) => String(v.attrs[i]),
        {
          categories: Array.from(new Set(attr.values.map((v) => v.toString()))).sort(),
        },
        {
          name: attr.source.displayName,
          orient: vertical ? 'vertical' : 'horizontal',
        }
      );
      // return null;
    }

    this.props.setAddons = attrs.map((attr, i) => asAddon(attr, i, false)).filter((v) => v != null);
    this.props.combinationAddons = attrs.map((attr, i) => asAddon(attr, i, true)).filter((v) => v != null);
  }

  /**
   * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
   * objects and properties you want to expose to the users in the property pane.
   *
   */
  enumerateObjectInstances(
    options: powerbi.EnumerateVisualObjectInstancesOptions
  ): powerbi.VisualObjectInstance[] | powerbi.VisualObjectInstanceEnumerationObject {
    return VisualSettings.enumerateObjectInstances(this.settings, options);
  }
}

function usesProFeatures(numSets: number, numAttributes: number, settings: VisualSettings) {
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
