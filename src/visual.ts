/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2025 Samuel Gratzl <sam@sgratzl.com>
 */

import type { UpSetProps } from '@upsetjs/bundle';
import { boxplotAddon, categoricalAddon, render, renderSkeleton } from '@upsetjs/bundle';
import type powerbi from 'powerbi-visuals-api';
import {
  extractElems,
  resolveSelection,
  resolveElementsFromSelection,
  createColorResolver,
  extractSetsAndCombinations,
} from './utils/model';
import type { OnHandler } from './utils/handler';
import { createTooltipHandler, createContextMenuHandler, createSelectionHandler } from './utils/handler';
import { UpSetCategoricalAttribute, UpSetNumericAttribute, isNumeric } from './utils/attributes';
import VisualFormattingSettingsModel from "./VisualFormattingSettingsModel";
import type { IPowerBIElem, IPowerBIElems } from './utils/interfaces';
import { UniqueColorPalette } from './utils/UniqueColorPalette';
import { FormattingSettingsService } from 'powerbi-visuals-utils-formattingmodel';

const EMPTY_ARRAY: any[] = [];

export class UpSetPlot implements powerbi.extensibility.visual.IVisual {
  private readonly target: HTMLElement;
  private readonly selectionManager: powerbi.extensibility.ISelectionManager;
  private readonly host: powerbi.extensibility.visual.IVisualHost;
  private readonly localizationManager: powerbi.extensibility.ILocalizationManager;
  private readonly formattingSettingsService: FormattingSettingsService;

  private readonly onContextMenu: OnHandler;
  private readonly setSelection: OnHandler;
  private readonly onHover: undefined | OnHandler;
  private readonly onMouseMove: undefined | OnHandler;
  private readonly colorPalette: UniqueColorPalette;

  private settings: VisualFormattingSettingsModel;
  private attributes: (UpSetCategoricalAttribute | UpSetNumericAttribute)[] =
    [];
  private rows: IPowerBIElems = [];
  private props: UpSetProps = { sets: [], width: 100, height: 100 };

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
    this.target = options.element;
    this.localizationManager = options.host.createLocalizationManager();
    this.selectionManager = options.host.createSelectionManager();
    this.selectionManager = options.host.createSelectionManager();
    this.colorPalette = new UniqueColorPalette(options.host.colorPalette);
    this.host = options.host;
    this.formattingSettingsService = new FormattingSettingsService(
      this.localizationManager,
    );
    this.settings = new VisualFormattingSettingsModel();
    this.settings.theme.applyColorPalette(options.host.colorPalette);

    this.renderPlaceholder();

    [this.onHover, this.onMouseMove] = createTooltipHandler(
      this.target,
      this.host,
    );
    this.onContextMenu = createContextMenuHandler(this.selectionManager);
    this.target.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.selectionManager.showContextMenu(
        {},
        {
          x: e.clientX,
          y: e.clientY,
        },
      );
    });
    this.setSelection = createSelectionHandler(this.selectionManager, (s) => {
      this.props.selection = s;
      this.render();
    });
    this.selectionManager.registerOnSelectCallback((ids) => {
      this.props.selection = resolveElementsFromSelection(ids, this.rows);
      this.render();
    });
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    this.settings.setColors.derive(
      this.props.sets,
      this.settings.theme.supportIndividualColors(),
      this.colorPalette,
    );
    const categoricalAttributes = this.attributes.filter(
      (d): d is UpSetCategoricalAttribute =>
        d instanceof UpSetCategoricalAttribute,
    );
    this.settings.addonColors.derive(categoricalAttributes);
    return this.formattingSettingsService.buildFormattingModel(this.settings);
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
    this.target.textContent = "";
    this.target.style.position = "relative";
    renderSkeleton(this.target, {
      width: "100%",
      height: "100%",
    });
  }

  private renderImpl(
    options: powerbi.extensibility.visual.VisualUpdateOptions,
  ) {
    if (!options.dataViews || options.dataViews.length === 0) {
      this.colorPalette.clear();
      return false;
    }
    const dataView = options.dataViews[0];
    this.settings =
      this.formattingSettingsService.populateFormattingSettingsModel(
        VisualFormattingSettingsModel,
        dataView,
      );

    if (!dataView.categorical || !dataView.categorical.categories) {
      this.colorPalette.clear();
      return false;
    }

    const areDummyValues = dataView.categorical!.categories.length === 0;

    // handle window
    this.rows = extractElems(dataView.categorical!, this.host);

    this.attributes = this.generateAttributes(dataView);

    if (!dataView.categorical!.values) {
      this.colorPalette.clear();
      return false;
    }

    const hasMore = Boolean(dataView.metadata.segment);
    if (hasMore) {
      // load more chunks
      requestAnimationFrame(() => this.host.fetchMoreData());
    }

    const { sets, combinations } = this.generateSetsAndCombinations(dataView);

    if (sets.length === 0 || combinations.length === 0) {
      this.colorPalette.clear();
      return false;
    }

    const selection = resolveSelection(
      this.rows,
      sets,
      combinations,
      dataView.categorical!,
      this.selectionManager,
      !areDummyValues && this.host.hostCapabilities.allowInteractions === true,
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
      this.settings.fonts.generate(),
      this.settings.theme.generate(this.colorPalette, dataView.categorical!),
      this.settings.style.generate(),
    );

    if (this.attributes.length === 0) {
      this.props.setAddons = EMPTY_ARRAY;
      this.props.combinationAddons = EMPTY_ARRAY;
    } else {
      this.props.setAddons = this.attributes.map((attr, i) =>
        asAddon(attr, i, false),
      );
      this.props.combinationAddons = this.attributes.map((attr, i) =>
        asAddon(attr, i, true),
      );
    }

    if (!areDummyValues && this.host.hostCapabilities.allowInteractions) {
      this.props.onClick = this.setSelection;
      this.props.onContextMenu = this.onContextMenu;
      this.props.onHover = this.onHover;
      this.props.onMouseMove = this.onMouseMove;
      this.props.tooltips = false;
    }

    this.render();
    return true;
  }

  private generateSetsAndCombinations(dataView: powerbi.DataView) {
    const { rows, settings } = this;

    if (rows.length === 0) {
      return { sets: [], combinations: [] };
    }

    const colorResolver = createColorResolver(
      this.colorPalette,
      settings.theme.supportIndividualColors()
        ? this.settings.setColors.toColors()
        : undefined,
    );

    return extractSetsAndCombinations(
      rows,
      dataView.categorical!,
      this.settings.sets,
      colorResolver,
      this.deriveOptions(),
    );
  }

  private deriveOptions() {
    const genOptions = this.settings.combinations.generate();
    genOptions.elems = this.rows;
    if (!this.settings.theme.deriveCombinationColor.value.value) {
      genOptions.mergeColors = () => undefined;
    }
    return genOptions;
  }

  private generateAttributes(dataView: powerbi.DataView) {
    const cat = dataView.categorical!.categories![0];
    // we need some offset since individual categories cannot be directly selected just categories rows
    let enumerationOffset = 0;
    return dataView.categorical!.values
      ? dataView
          .categorical!.values.filter((d) => d.source?.roles?.attributes)
          .map((attr) => {
            if (isNumeric(attr)) {
              return new UpSetNumericAttribute(attr);
            }
            const c = new UpSetCategoricalAttribute(
              attr,
              cat,
              this.host,
              enumerationOffset,
            );
            enumerationOffset += c.categories.length;
            return c;
          })
      : [];
  }
}

function asAddon(attr: UpSetNumericAttribute | UpSetCategoricalAttribute, i: number, vertical: boolean) {
  if (attr instanceof UpSetNumericAttribute) {
    return boxplotAddon(
      (v: IPowerBIElem) => <number>v.attrs[i],
      {
        min: <number>attr.data.minLocal,
        max: <number>attr.data.maxLocal,
      },
      {
        name: attr.displayName,
        orient: vertical ? 'vertical' : 'horizontal',
      }
    );
  }
  return categoricalAddon(
    (v: IPowerBIElem) => String(v.attrs[i]),
    {
      categories: attr.categories,
    },
    {
      name: attr.displayName,
      orient: vertical ? 'vertical' : 'horizontal',
    }
  );
}
