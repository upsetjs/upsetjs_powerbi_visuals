import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import {
  FontsCardSettings,
  SetColorCardSettings,
  AttributeColorCardSettings,
  ThemeCardSettings,
} from "./utils/settings";
import {
  GenerateSetCombinationsOptions,
  SetCombinationType,
  UpSetLayoutProps,
  UpSetStyleProps,
  UpSetProps,
} from "@upsetjs/bundle/dist";
import { IPowerBIElem, } from "utils/interfaces";
import { SetOptions } from "utils/model";

const { SimpleCard, ItemDropdown, Model, TextInput,NumUpDown, ToggleSwitch } = formattingSettings;

export class StyleCardSettings extends SimpleCard {
  numericScale = new ItemDropdown({
    name: "numericScale",
    displayName: "Scale",
    items: [
      { displayName: "Linear Scale", value: "linear" },
      { displayName: "Log Scale", value: "log" },
    ],
    value: { displayName: "Linear Scale", value: "linear" },
  });

  setName = new TextInput({
    name: "setName",
    displayName: "Set Axis Name",
    placeholder: "The label on the set axis",
    value: "",
  });

  setLabelAlignment = new ItemDropdown({
    name: "setLabelAlignment",
    displayName: "Set Label Alignment",
    items: [
      { displayName: "Left", value: "left" },
      { displayName: "Center", value: "center" },
      { displayName: "Right", value: "right" },
    ],
    value: { displayName: "Center", value: "center" }, // default value
  });

  combinationName = new TextInput({
    name: "combinationName",
    displayName: "Combination Axis Name",
    placeholder: "The label on the combination axis",
    value: "",
  });

  setNameAxisOffset = new NumUpDown({
    name: "setNameAxisOffset",
    displayName: "Set Axis Offset",
    value: 0,
  });

  combinationNameAxisOffset = new NumUpDown({
    name: "combinationNameAxisOffset",
    displayName: "Combination Axis Offset",
    value: 0,
  });

  setMaxScale = new NumUpDown({
    name: "setMaxScale",
    displayName: "Set Scale Maximum",
    value: 100,
  });

  combinationScaleMax = new NumUpDown({
    name: "combinationScaleMax",
    displayName: "Combination Scale Maximum",
    value: 100,
  });

  name: string = "style";
  displayName: string = "Style";
  slice = [
    this.numericScale,
    this.setName,
    this.setLabelAlignment,
    this.combinationName,
    this.setNameAxisOffset,
    this.combinationNameAxisOffset,
    this.setMaxScale,
    this.combinationScaleMax,
  ];

  generate(): Partial<UpSetProps<unknown>> {
    return {
      numericScale: this.numericScale.value.value as UpSetProps['numericScale'],
      setName: this.setName.value,
      setLabelAlignment: this.setLabelAlignment.value
        .value as UpSetProps["setLabelAlignment"],
      combinationName: this.combinationName.value,
      setNameAxisOffset: this.setNameAxisOffset.value,
      combinationNameAxisOffset: this.combinationNameAxisOffset.value,
      setMaxScale: this.setMaxScale.value,
      combinationMaxScale: this.combinationScaleMax.value,
    };
  }
}

export class SetsCardSettings extends SimpleCard {
  show = new ToggleSwitch({
    name: "show",
    displayName: "Show",
    value: true,
  });

  displayNameAttr = new TextInput({
    name: "displayName",
    displayName: "Display Name",
    placeholder: "The name to show",
    value: "",
  });

  order = new ItemDropdown({
    name: "order",
    displayName: "Order Sets By",
    items: [
      { displayName: "Inherit Order", value: "inherit" },
      { displayName: "Name", value: "name" },
      { displayName: "Cardinality", value: "cardinality" },
      { displayName: "Cardinality (decreasing)", value: "cardinality:desc" },
    ],
    value: { displayName: "Inherit Order", value: "inherit" },
  });

  limit = new NumUpDown({
    name: "limit",
    displayName: "Limit to Top N Sets",
    value: 10,
  });

  name: string = "sets";
  displayName: string = "Sets";
  slices = [this.show, this.displayNameAttr, this.order, this.limit];

  generate(): SetOptions {
    return {
      limit: this.limit.value,
      order: this.order.value.value as SetOptions['order']
    };
  }
}

export class CombinationsCardSettings extends SimpleCard {
  show = new ToggleSwitch({
    name: "show",
    displayName: "Show",
    value: true,
  });

  displayNameAttr = new TextInput({
    name: "displayName",
    displayName: "Display Name",
    placeholder: "The name to show",
    value: "",
  });

  mode = new ItemDropdown({
    name: "mode",
    displayName: "Generation Mode",
    items: [
      { displayName: "Set Intersections", value: "intersection" },
      { displayName: "Set Unions", value: "union" },
      {
        displayName: "Distinct Set Intersections",
        value: "distinctIntersection",
      },
    ],
    value: { displayName: "Set Intersections", value: "intersection" },
  });

  min = new NumUpDown({
    name: "min",
    displayName: "Minimum Degree",
    value: 1,
  });

  max = new NumUpDown({
    name: "max",
    displayName: "Maximum Degree",
    value: 5,
  });

  empty = new ToggleSwitch({
    name: "empty",
    displayName: "Show Empty Combinations",
    value: false,
  });

  limit = new NumUpDown({
    name: "limit",
    displayName: "Limit to Top N Combinations",
    value: 20,
  });

  order = new ItemDropdown({
    name: "order",
    displayName: "Order Combinations By",
    items: [
      { displayName: "1. Name", value: "name" },
      { displayName: "1. Cardinality 2. Name", value: "cardinality,name" },
      {
        displayName: "1. Cardinality 2. Degree 3. Name",
        value: "cardinality,degree,name",
      },
      { displayName: "1. Degree 2. Name", value: "degree,name" },
      {
        displayName: "1. Degree 2. Cardinality 3. Name",
        value: "degree,cardinality,name",
      },
      { displayName: "1. Set Group 2. Name", value: "group,name" },
      {
        displayName: "1. Set Group 2. Cardinality 3. Name",
        value: "group,cardinality,name",
      },
      {
        displayName: "1. Set Group 2. Degree 3. Name",
        value: "group,degree,name",
      },
      {
        displayName: "1. Set Group 2. Degree 3. Cardinality 4. Name",
        value: "group,degree,cardinality,name",
      },
    ],
    value: { displayName: "1. Name", value: "name" },
  });

  name: string = "combinations";
  displayName: string = "Set Combinations";
  slices = [
    this.show,
    this.displayNameAttr,
    this.mode,
    this.min,
    this.max,
    this.empty,
    this.limit,
    this.order,
  ];

  generate(): GenerateSetCombinationsOptions<IPowerBIElem> {
    return {
      type: this.mode.value.value as SetCombinationType,
      min: this.min.value,
      max: this.max.value,
      empty: this.empty.value,
      limit: this.limit.value,
      order: <'cardinality'>fixOrder(this.order.value.value as string),
    };
  }
}

function fixOrder(order: string) {
  if (order.includes(',')) {
    return order.split(',');
  }
  return order;
}


export default class VisualFormattingSettingsModel extends Model {
  public sets = new SetsCardSettings();
  public combinations = new CombinationsCardSettings();

  public theme = new ThemeCardSettings();
  public setColors = new SetColorCardSettings();
  public attributeColors = new AttributeColorCardSettings();
  public style = new StyleCardSettings();
  public fonts = new FontsCardSettings();

  cards = [
    this.sets,
    this.combinations,
    this.theme,
    this.setColors,
    this.attributeColors,
    this.style,
    this.fonts,
  ];
}
