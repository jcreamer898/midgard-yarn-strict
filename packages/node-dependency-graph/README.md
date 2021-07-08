## dependency-graph

Construct a node dependency graph. Resolves dependencies, devDependencies and peerDependencies.

### Features

- Support circular dependencies.
- Support circular peerDependencies.
- Create duplicate versions of a package when there is a peerDependency conflict.
- Ignore optional dependencies and optional peer-dependencies if they cannot be fulfilled.

### Usage

```js
const { createDependencyGraph } = require("dependency-graph");

const packageManifests = [
  {
    name: "A",
    version: "1.0.0",
    isLocal: true,
    dependencies: {
      "B": "^1.0.0",
      "C": "^1.0.0"
    }
  },
  {
    name: "B",
    version: "1.1.0",
    isLocal: false
  },
  {
    name: "C",
    version: "1.0.1",
    isLocal: false,
    peerDependencies: {
      "B": "*"
    }
  }
];

const resolutionMap = {
  "B": { "^1.0.0": "1.1.0" },
  "C": { "^1.0.0": "1.0.1" }
} 
const graph = createDependencyGraph(packageManifests, resolutionMap);
console.log(graph);
/*
{
  nodes: [
    { id: 0, name: "A", version: "1.0.0" },
    { id: 1, name: "B", version: "1.1.0" },
    { id: 2, name: "C", version: "1.0.1" }
  ],
  links: [
    { sourceId: 0, targetId: 1 },
    { sourceId: 0, targetId: 2 },
    { sourceId: 2, targetId: 1 }
  ]
}
*/
```
