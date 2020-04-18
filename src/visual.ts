import 'core-js/stable';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import VisualSettings from './VisualSettings';
import { renderUpSet, asSets, ISet } from '@upsetjs/bundle';

interface IPowerBISet extends ISet<powerbi.PrimitiveValue> {}

export class Visual implements IVisual {
  private readonly target: HTMLElement;
  private settings: VisualSettings = <VisualSettings>VisualSettings.getDefault();

  constructor(options: VisualConstructorOptions) {
    console.log('Visual constructor', options);
    this.target = options.element;
  }

  update(options: VisualUpdateOptions) {
    const dataView = options.dataViews[0];
    this.settings = Visual.parseSettings(dataView);

    const sets = this.extractSets(dataView.categorical!);

    renderUpSet(this.target, {
      sets,
      width: options.viewport.width,
      height: options.viewport.height,
    });
  }

  private extractSets(data: powerbi.DataViewCategorical): ReadonlyArray<IPowerBISet> {
    const defaultElems = () => {
      if (data.values.length === 0) {
        return [];
      }
      return data.values[0].values.map((_, i) => i);
    };
    const elems: powerbi.PrimitiveValue[] = data.categories.length > 0 ? data.categories[0].values : defaultElems();

    return asSets(
      data.values
        .map((value) => {
          return {
            name: value.source.displayName,
            elems: value.values.map((v, i) => (v ? elems[i] : null)).filter((v) => v != null),
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
