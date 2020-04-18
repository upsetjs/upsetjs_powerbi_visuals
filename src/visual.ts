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

export class Visual implements IVisual {
  private readonly target: HTMLElement;
  private dataView: DataView | null = null;
  private settings: VisualSettings | null = null;

  private updateCount: number;
  private textNode: Text;

  constructor(options: VisualConstructorOptions | undefined) {
    console.log('Visual constructor', options);
    this.target = options.element;
    this.updateCount = 0;

    this.textNode = document!.createTextNode(this.updateCount.toString());
    if (this.target) {
      const doc = this.target.ownerDocument!;
      const new_p: HTMLElement = doc.createElement('p');
      new_p.appendChild(doc.createTextNode('Update count:'));
      const new_em: HTMLElement = doc.createElement('em');
      new_em.appendChild(this.textNode);
      new_p.appendChild(new_em);
      this.target.appendChild(new_p);
    }
  }

  update(options: VisualUpdateOptions, _viewModel?: any) {
    this.dataView = options.dataViews[0];
    this.settings = Visual.parseSettings(this.dataView);

    console.log('Visual update', options);

    if (this.textNode) {
      this.textNode.textContent = (this.updateCount++).toString();
    }
  }

  destroy() {
    // implement me
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
    return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
  }
}
