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
import { renderUpSet, asSets, ISet, UpSetProps } from '@upsetjs/bundle';

interface IPowerBISet extends ISet<powerbi.PrimitiveValue> {
  value: powerbi.DataViewValueColumn;
}

export class Visual implements IVisual {
  private readonly target: HTMLElement;
  private settings: VisualSettings = <VisualSettings>VisualSettings.getDefault();

  constructor(options: VisualConstructorOptions) {
    this.target = options.element;
  }

  update(options: VisualUpdateOptions) {
    const dataView = options.dataViews[0];
    this.settings = Visual.parseSettings(dataView);

    const { sets, elems } = this.extractSets(dataView.categorical!);

    const selection = this.deriveSelection(elems, dataView.categorical!);

    const props: UpSetProps<powerbi.PrimitiveValue> = Object.assign(
      {
        sets,
        width: options.viewport.width,
        height: options.viewport.height,
        combinations: Object.assign({}, this.settings.combinations, {
          order: fixOrder(this.settings.combinations.order),
          elems,
        }),
        selection,
        exportButtons: false,
      },
      this.settings.theme.dropDefaults(),
      this.settings.style
    );

    renderUpSet(this.target, props);
  }

  private deriveSelection(elems: ReadonlyArray<powerbi.PrimitiveValue>, data: powerbi.DataViewCategorical) {
    if (data.values.length === 0 || data.values[0].highlights == null) {
      return undefined;
    }
    return data.values[0].highlights.map((v, i) => (v === null ? null : elems[i])).filter((v) => v !== null);
  }

  private extractSets(
    data: powerbi.DataViewCategorical
  ): { sets: ReadonlyArray<IPowerBISet>; elems: ReadonlyArray<powerbi.PrimitiveValue> } {
    const defaultElems = () => {
      if (data.values.length === 0) {
        return [];
      }
      return data.values[0].values.map((_, i) => i);
    };
    const elems: powerbi.PrimitiveValue[] = data.categories.length > 0 ? data.categories[0].values : defaultElems();

    const sets = asSets(
      data.values
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
    return { sets, elems };
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
