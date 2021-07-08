
## Yarn Resolve And Fetch

Node API for Yarn v1 resolution and fetching code.

Yarn v1 comes as a bundle of many features. While most of these features are desirable, some others may not be a good fit for your needs.
This package extracts the resolution and fetching logic of yarn. This enables you to use the great work of the Yarn team without compromizing on your specific needs.

In addition, some optimizations make this code twice as fast and twice as resilient in large repositories as Yarn v1.

This package resolves your dependencies, update the yarn.lock file if needed and downloads all the dependencies to cache. The rest of the installation can be implemented to meet your needs.

## Using Yraf

```js
const { resolveAndFetch } = require("yraf");

resolveAndFetch()
  .then( ({ resolutionMap, locationMap }) => {
    // Do your own installation

    // `resolutionMap` gives you the pined version for a given dependency.
    // `locationMap` gives you the location on disk for a given dependency.

  });

```


## Configuration

Yraf allows to declare dependencies on behalf of external packages, this is useful when external package forgot to declare all their dependencies.

Example: package.json
```javascript
{
  // rest of package.json
  "extraDependencies": {
    "webpack": {
      "^4.0.0": {
        "dependencies": {
          "webpack-cli": "^4.0.0"
        }
      }
    }
  }
}
```

## Prior art

Yraf wouldn't exist if it wasn't for excellent prior art. Yraf has been inspired by the following projects:

 - [yarn](https://github.com/yarnpkg/yarn)
 - [npm](https://github.com/npm/cli)
