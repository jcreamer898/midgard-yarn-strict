Install a node dependency tree on disk.

The installation is done using a flat folder structure where packages are connected with symlinks.
This package is meant to be used as a component of a package manager.

Features:

- Install packages in a flat structure.
- Install bin scripts.
- Support package names with a namespace.
- Multiple packages can have the same name (usefull to support various version or conflicting peerDependencies).

Usage:
```javascript
const { installLocalStore } = require("local-package-store");

const location = "<path to an empty folder>";
const dependencyGraph = {
    nodes: [{
        key: "1",
        location: "location where the uninstalled package is on disk"
    },
    {
        key: "2",
        location: "location where the uninstalled package is on disk"
    }],
    links: [{ source: "1", target: "2"}]
}

installLocalStore(
    dependencyGraph,
    location
).then(() => {
    /* Installation is done */
})
```

The inputs are:
- The dependency graph of packages. Contains a list of packages and a list of dependencies between them.
- The location of a store. This is where the packages will be installed on disk.
