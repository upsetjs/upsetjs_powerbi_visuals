# UpSet.js as PowerBI Visual

[![Github Actions][github-actions-image]][github-actions-url]

This is a [PowerBI Custom Visual](https://powerbi.microsoft.com/en-us/developers/custom-visualization/?cdn=disable) for rendering [UpSet.js](https://upset.js.org).

This package is part of the UpSet.js ecosystem located at the main [Github Monorepo](https://github.com/upsetjs/upsetjs).

![UpSet.js Report](https://user-images.githubusercontent.com/4129778/79641879-808ea480-819a-11ea-87f9-441c3647812f.png)

## Installation

Download the latest package from [https://github.com/upsetjs/upsetjs_powerbi_visuals/releases/latest/download/upsetjs.pbiviz](https://github.com/upsetjs/upsetjs_powerbi_visuals/releases/latest/download/upsetjs.pbiviz) and install into your PowerBI environment.

## Data Roles

The UpSet.js visual has three data roles:

- `Elements` exactly one grouping with a unique identifier for each row (e.g., a name)
- `Sets` one or more measures or groupings which represent the sets. When it's value at row `i` results in a trueish value (e.g., 1, true, ...) UpSet will interpret it that the element at row `i` is part of this set
- `Attributes` zero or more numeric measures that are used to generate boxplots for each set intersection

In addition, the visual supports various styling options including the customization of how the set combinations are generated.

## Interaction

The UpSet.js visual reacts to selections from other widgets by highlighting the elements in its chart. Moreover, when the user **clicks** on an element in the chart, the corresponding set (combination) will be selected.

## Dev Environment

see also https://docs.microsoft.com/en-us/power-bi/developer/visuals/custom-visual-develop-tutorial

```sh
npm i
npm run pbiviz -- --install-cert
```

### Test Server

```sh
npm start
```

### Building

```sh
npm run lint
npm run build
```

### Release

via release-it

```sh
npm run release:major
npm run release:minor
npm run release:patch
```

## License

### Commercial license

If you want to use Upset.js for a commercial application the commercial license is the appropriate license. Contact [@sgratzl](mailto:sam@sgratzl.com) for details.

### Open-source license

This library is released under the `GNU AGPLv3` version to be used for private and academic purposes. In case of a commercial use, please get in touch regarding a commercial license.

[github-actions-image]: https://github.com/upsetjs/upsetjs_powerbi_visuals/workflows/ci/badge.svg
[github-actions-url]: https://github.com/upsetjs/upsetjs_powerbi_visuals/actions
[codepen]: https://img.shields.io/badge/CodePen-open-blue?logo=codepen
