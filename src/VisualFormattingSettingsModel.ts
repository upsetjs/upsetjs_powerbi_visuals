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
  UpSetProps,
} from "@upsetjs/bundle/dist";
import { SetOptions } from "utils/model";

const { SimpleCard, ItemDropdown, Model, TextInput, NumUpDown, ToggleSwitch } =
  formattingSettings;

export class StyleCardSettings extends SimpleCard {
  numericScale = new ItemDropdown({
    name: "numericScale",
    displayNameKey: "Style_NumericScale_DisplayName",
    items: [
      { displayNameKey: "Style_NumericScale_Linear", value: "linear" },
      { displayNameKey: "Style_NumericScale_Log", value: "log" },
    ],
    value: { displayNameKey: "Style_NumericScale_Linear", value: "linear" },
  });

  setName = new TextInput({
    name: "setName",
    displayNameKey: "Style_SetName_DisplayName",
    placeholder: "The label on the set axis",
    value: "",
  });

  setLabelAlignment = new ItemDropdown({
    name: "setLabelAlignment",
    displayNameKey: "Style_SetLabelAlignment_DisplayName",
    items: [
      { displayName: "Left", value: "left" },
      { displayName: "Center", value: "center" },
      { displayName: "Right", value: "right" },
    ],
    value: { displayName: "Center", value: "center" }, // default value
  });

  combinationName = new TextInput({
    name: "combinationName",
    displayNameKey: "Style_CombinationName_DisplayName",
    placeholder: "The label on the combination axis",
    value: "",
  });

  setNameAxisOffset = new NumUpDown({
    name: "setNameAxisOffset",
    displayNameKey: "Style_SetNameAxisOffset_DisplayName",
    value: 0,
  });

  combinationNameAxisOffset = new NumUpDown({
    name: "combinationNameAxisOffset",
    displayNameKey: "Style_CombinationNameAxisOffset_DisplayName",
    value: 0,
  });

  setMaxScale = new NumUpDown({
    name: "setMaxScale",
    displayNameKey: "Style_SetMaxScale_DisplayName",
    value: undefined,
  });

  combinationScaleMax = new NumUpDown({
    name: "combinationScaleMax",
    displayNameKey: "Style_CombinationScaleMax_DisplayName",
    value: undefined,
  });

  name: string = "style";
  displayNameKey: string = "Style_DisplayName";
  slices = [
    this.numericScale,
    this.setName,
    this.setLabelAlignment,
    this.combinationName,
    this.setNameAxisOffset,
    this.combinationNameAxisOffset,
    this.setMaxScale,
    this.combinationScaleMax,
  ];

  generate() {
    // }: Partial<UpSetProps<unknown>> {
    return {
      numericScale: this.numericScale.value.value as UpSetProps["numericScale"],
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
  order = new ItemDropdown({
    name: "order",
    displayNameKey: "Sets_Order_DisplayName",
    items: [
      { displayNameKey: "Sets_Order_Inherit", value: "inherit" },
      { displayNameKey: "Sets_Order_Name", value: "name" },
      { displayNameKey: "Sets_Order_Cardinality", value: "cardinality" },
      {
        displayNameKey: "Sets_Order_Cardinality_Desc",
        value: "cardinality:desc",
      },
    ],
    value: { displayNameKey: "Sets_Order_Inherit", value: "inherit" },
  });

  limit = new NumUpDown({
    name: "limit",
    displayNameKey: "Sets_Limit",
    value: 10,
  });

  name: string = "sets";
  displayNameKey: string = "Sets_DisplayName";
  slices = [this.order, this.limit];

  generate(): SetOptions {
    return {
      limit: this.limit.value,
      order: this.order.value.value as SetOptions["order"],
    };
  }
}

export class CombinationsCardSettings extends SimpleCard {
  mode = new ItemDropdown({
    name: "mode",
    displayNameKey: "Combinations_Mode_DisplayName",
    items: [
      {
        displayNameKey: "Combinations_Mode_Intersection",
        value: "intersection",
      },
      { displayNameKey: "Combinations_Mode_Union", value: "union" },
      {
        displayNameKey: "Combinations_Mode_DistinctIntersection",
        value: "distinctIntersection",
      },
    ],
    value: {
      displayNameKey: "Combinations_Mode_Intersection",
      value: "intersection",
    },
  });

  min = new NumUpDown({
    name: "min",
    displayNameKey: "Combinations_Min",
    value: 1,
  });

  max = new NumUpDown({
    name: "max",
    displayNameKey: "Combinations_Max",
    value: 5,
  });

  empty = new ToggleSwitch({
    name: "empty",
    displayNameKey: "Combinations_Empty",
    value: false,
  });

  limit = new NumUpDown({
    name: "limit",
    displayNameKey: "Combinations_Limit",
    value: 20,
  });

  order = new ItemDropdown({
    name: "order",
    displayNameKey: "Combinations_Order",
    items: [
      { displayNameKey: "Combinations_Order_Name", value: "name" },
      {
        displayNameKey: "Combinations_Order_Cardinality_Name",
        value: "cardinality,name",
      },
      {
        displayNameKey: "Combinations_Order_Cardinality_Degree_Name",
        value: "cardinality,degree,name",
      },
      {
        displayNameKey: "Combinations_Order_Degree_Name",
        value: "degree,name",
      },
      {
        displayNameKey: "Combinations_Order_Degree_Cardinality_Name",
        value: "degree,cardinality,name",
      },
      { displayNameKey: "Combinations_Order_Group_Name", value: "group,name" },
      {
        displayNameKey: "Combinations_Order_Group_Cardinality_Name",
        value: "group,cardinality,name",
      },
      {
        displayNameKey: "Combinations_Order_Group_Degree_Name",
        value: "group,degree,name",
      },
      {
        displayNameKey: "Combinations_Order_Group_Degree_Cardinality_Name",
        value: "group,degree,cardinality,name",
      },
    ],
    value: { displayNameKey: "Combinations_Order_Name", value: "name" },
  });

  name: string = "combinations";
  displayNameKey: string = "Combinations_DisplayName";
  slices = [this.mode, this.min, this.max, this.empty, this.limit, this.order];

  generate(): GenerateSetCombinationsOptions {
    return {
      type: this.mode.value.value as SetCombinationType,
      min: this.min.value,
      max: this.max.value,
      empty: this.empty.value,
      limit: this.limit.value,
      order: <"cardinality">fixOrder(this.order.value.value as string),
    };
  }
}

function fixOrder(order: string) {
  if (order.includes(",")) {
    return order.split(",");
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
