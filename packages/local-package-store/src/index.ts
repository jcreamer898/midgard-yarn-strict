import * as fs from "fs";
import * as path from "path";
import rimraf from "rimraf";
import { exec } from "child_process";

import { convertGraphToTree } from "./graphToTree";
import { executeTree } from "./treeExecutor";
import { copyFiles } from "./copyFiles";

import type { Graph } from "./graph";
export type { Graph } from "./graph";

import PQueue from "p-queue";

const queue = new PQueue({ concurrency: 300 });

function batchPromises(batchSize: any, collection: any, callback: any) {
  return Promise.resolve(collection).then((arr) =>
    arr
      .map((_: any, i: any) =>
        i % batchSize ? [] : arr.slice(i, i + batchSize)
      )
      .map(
        (group: any) => (res: any) =>
          Promise.all(group.map(callback)).then((r) => res.concat(r))
      )
      .reduce((chain: any, work: any) => chain.then(work), Promise.resolve([]))
  );
}

const cmdShim: (
  from: string,
  to: string
) => Promise<void> = require("cmd-shim");

function rmdir(dir: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    rimraf(dir, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Options to configure the installLocalStore function.
 */
export interface Options {
  /**
   * List of file names that should not be copied over from the cache to the store.
   * This is useful when the cache contains some large files that are not needed in
   * the store (eg. .yarn-metatdata.json or .yarn-tarball.tgz)
   */

  filesToExclude?: string[];
  /**
   * Fails when two dependencies provide the same bin name.
   */
  ignoreBinConflicts?: boolean;
}

/**
 * Install the given dependency graph in the given folder.
 *
 * @param graph Dependency graph to be installed on disk.
 * @param location Absolute path of an empty directory in which the installation will take place.
 */
export async function installLocalStore(
  graph: Graph,
  location: string,
  options?: Options
): Promise<void> {
  const locationMap = new Map<string, string>();

  validateInput(graph, location, options?.ignoreBinConflicts);

  const filesActions: { src: string; dest: string }[] = [];
  await installNodesInStore(
    graph,
    location,
    locationMap,
    filesActions,
    options?.filesToExclude
  );
  await copyFiles(filesActions);

  const newGraph = addSelfLinks(graph);

  await linkNodes(newGraph, location, locationMap);

  await createBins(newGraph, location, locationMap);

  await runScripts(newGraph, locationMap);
}

async function runScripts(
  graph: Graph,
  locationMap: Map<string, string>
): Promise<void> {
  const tree = convertGraphToTree(graph);

  async function executor(component: number): Promise<void> {
    const packages = tree.components.get(component)!.keys;

    await Promise.all(
      packages.map(async (n) => {
        const loc = locationMap.get(n)!;
        try {
          fs.statSync(path.join(loc, "package.json"));
        } catch {
          return;
        }
        const manifest: any = JSON.parse(
          await fs.promises.readFile(path.join(loc, "package.json"), {
            encoding: "utf8",
          })
        );
        if (manifest.scripts && manifest.scripts.install) {
          await new Promise<void>((resolve, reject) => {
            const child = exec("npm run install", { cwd: loc });
            child.on("exit", () => {
              console.log(
                "install script done",
                manifest.name,
                manifest.version
              );
              resolve();
            });
            child.on("error", (e) => reject(e));
          });
        }
        if (manifest.scripts && manifest.scripts.postinstall) {
          await new Promise<void>((resolve, reject) => {
            const child = exec("npm run postinstall", { cwd: loc });
            child.on("exit", () => {
              console.log(
                "postinstall script done",
                manifest.name,
                manifest.version
              );
              resolve();
            });
            child.on("error", (e) => reject(e));
          });
        }
      })
    );
  }

  await executeTree(tree, executor);

  await batchPromises(100, graph.nodes, async (n: any) => {
    const loc = locationMap.get(n.key)!;
    try {
      fs.statSync(path.join(loc, "package.json"));
    } catch {
      return;
    }
    const manifest: any = JSON.parse(
      await fs.promises.readFile(path.join(loc, "package.json"), {
        encoding: "utf8",
      })
    );
    if (manifest.scripts && manifest.scripts.install) {
      await new Promise<void>((resolve, reject) => {
        const child = exec("npm run install", { cwd: loc });
        child.on("exit", () => resolve());
        child.on("error", (e) => reject(e));
      });
    }
    if (manifest.scripts && manifest.scripts.postinstall) {
      await new Promise<void>((resolve, reject) => {
        const child = exec("npm run postinstall", { cwd: loc });
        child.on("exit", () => resolve());
        child.on("error", (e) => reject(e));
      });
    }
  });
}

function addSelfLinks(graph: Graph): Graph {
  const newGraph = {
    nodes: [...graph.nodes],
    links: [...graph.links.filter((link) => link.source !== link.target)],
  };
  graph.nodes.forEach((n) => {
    newGraph.links.push({ source: n.key, target: n.key });
  });
  return newGraph;
}

async function createBins(
  graph: Graph,
  location: string,
  locationMap: Map<string, string>
): Promise<void> {
  const binsMap = new Map<string, Map<string, string>>();

  graph.nodes.forEach((n) => {
    if (!n.bins) {
      return;
    }
    if (!binsMap.get(n.key)) {
      binsMap.set(n.key, new Map<string, string>());
    }

    Object.keys(n.bins).forEach((binName) => {
      binsMap.get(n.key)!.set(binName, n.bins![binName]);
    });
  });

  await Promise.all(
    graph.links.map(async (link) => {
      const bins = binsMap.get(link.target);
      if (!bins) {
        return;
      }
      await fs.promises.mkdir(
        path.join(locationMap.get(link.source)!, "node_modules", ".bin"),
        { recursive: true }
      );
      for (const [binName, binLocation] of bins) {
        const binLoc = path.join(locationMap.get(link.target)!, binLocation);
        try {
          await fs.promises.stat(binLoc);
        } catch {
          continue;
        }
        const binLink = path.join(
          locationMap.get(link.source)!,
          "node_modules",
          ".bin",
          binName
        );
        await queue.add(() => cmdShim(binLoc, binLink));
      }
    })
  );
}

async function linkNodes(
  graph: Graph,
  location: string,
  locationMap: Map<string, string>
): Promise<void> {
  await Promise.all(
    graph.links.map(async (link) => {
      // TODO: this is very bad for perf, improve this.
      const name = graph.nodes.find((n) => n.key === link.target)!.name;
      await fs.promises.mkdir(
        path.dirname(
          path.join(locationMap.get(link.source)!, "node_modules", name)
        ),
        { recursive: true }
      );
      await fs.promises.symlink(
        path.join(locationMap.get(link.target)!),
        path.join(locationMap.get(link.source)!, "node_modules", name),
        "junction"
      );
    })
  );
}

async function installNodesInStore(
  graph: Graph,
  location: string,
  locationMap: Map<string, string>,
  filesActions: { src: string; dest: string }[],
  exclusionList?: string[]
): Promise<void> {
  await Promise.all(
    graph.nodes.map(async (n) => {
      const key = n.key;
      const nodeLoc = n.location;
      const destination = n.keepInPlace ? n.location : path.join(location, key);
      if (n.keepInPlace) {
        await rmdir(path.join(destination, "node_modules"));
      } else {
        await fs.promises.mkdir(destination);
        await copyDir(nodeLoc, destination, filesActions, exclusionList);
      }
      locationMap.set(key, destination);
    })
  );
}

async function copyDir(
  source: string,
  destination: string,
  filesActions: { src: string; dest: string }[],
  exclusionList?: string[]
): Promise<void> {
  const entries = fs.readdirSync(source);
  await Promise.all(
    entries.map(async (e) => {
      const stats = await fs.promises.stat(path.join(source, e));
      if (stats.isDirectory()) {
        await fs.promises.mkdir(path.join(destination, e));
        await copyDir(
          path.join(source, e),
          path.join(destination, e),
          filesActions
        );
      } else if (stats.isFile()) {
        if (!exclusionList || !exclusionList.includes(e)) {
          filesActions.push({
            src: path.join(source, e),
            dest: path.join(destination, e),
          });
        }
      }
    })
  );
}

function validateInput(
  graph: Graph,
  location: string,
  ignoreBinConflicts: boolean | undefined
): void {
  const locationError = getLocationError(location);
  if (locationError !== undefined) {
    throw new Error(locationError);
  }
  const GrapError = getGraphError(graph);
  if (GrapError !== undefined) {
    throw new Error(GrapError);
  }
  const binError = getBinError(graph, ignoreBinConflicts);
  if (binError !== undefined) {
    throw new Error(binError);
  }
}

function getBinError(
  graph: Graph,
  ignoreBinConflicts: boolean | undefined
): string | undefined {
  const errors = graph.nodes
    .map((node) => {
      if (!node.bins) {
        return [];
      }
      return Object.keys(node.bins)
        .map((binName) => {
          if (/\/|\\|\n/.test(binName)) {
            return `Package "${node.key}" exposes a bin script with an invalid name: "${binName}"`;
          }
        })
        .filter((o) => o !== undefined);
    })
    .filter((a) => a.length > 0);
  if (errors.length !== 0) {
    return errors[0]![0]!;
  }

  const binsMap = new Map<string, Set<string>>();
  graph.nodes.forEach((node) => {
    const newSet = new Set<string>();
    if (node.bins) {
      Object.keys(node.bins).forEach((binName) => {
        newSet.add(binName);
      });
    }
    binsMap.set(node.key, newSet);
  });

  const binCollisionErrors: string[] = [];
  const installedBinMap = new Map<string, Set<string>>();
  graph.nodes.forEach((node) => {
    installedBinMap.set(node.key, new Set());
  });
  graph.links.forEach(({ source, target }) => {
    const targetBins = binsMap.get(target)!;
    targetBins.forEach((binName) => {
      if (installedBinMap.get(source)!.has(binName) && !ignoreBinConflicts) {
        binCollisionErrors.push(
          `Several different scripts called "${binName}" need to be installed at the same location (${source}).`
        );
      }
      installedBinMap.get(source)!.add(binName);
    });
  });

  if (binCollisionErrors.length > 0) {
    return binCollisionErrors[0];
  }

  return undefined;
}

function getGraphError(graph: Graph): string | undefined {
  const dupKey = findDups(graph.nodes.map((n) => n.key));
  if (dupKey !== undefined) {
    return `Multiple nodes have the following key: "${dupKey}"`;
  }
  const notAbsoluteLocations = graph.nodes.filter(
    (n) => !path.isAbsolute(n.location)
  );
  if (notAbsoluteLocations.length > 0) {
    return `Location of a node is not absolute: "${notAbsoluteLocations[0].location}"`;
  }

  const nodesWithInvalidName = graph.nodes.filter(
    (n) =>
      !/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-zA-Z0-9-~][a-zA-Z0-9-._~]*$/.test(
        n.name
      )
  );
  if (nodesWithInvalidName.length > 0) {
    return `Package name invalid: "${nodesWithInvalidName[0].name}"`;
  }

  const notFolderLocations = graph.nodes.filter((n) => {
    try {
      const stats = fs.statSync(n.location);
      return !stats.isDirectory();
    } catch {
      /**
       * The location does not exist, this error is treated separately.
       */
      return false;
    }
  });

  if (notFolderLocations.length > 0) {
    return `Location of a node is not a directory: "${notFolderLocations[0].location}"`;
  }

  const linksWithWrongSource = graph.links.filter(
    (l) => graph.nodes.map((n) => n.key).indexOf(l.source) === -1
  );
  if (linksWithWrongSource.length > 0) {
    return `Invalid link source: "${linksWithWrongSource[0].source}"`;
  }

  const linksWithWrongTarget = graph.links.filter(
    (l) => graph.nodes.map((n) => n.key).indexOf(l.target) === -1
  );
  if (linksWithWrongTarget.length > 0) {
    return `Invalid link target: "${linksWithWrongTarget[0].target}"`;
  }

  const dependenciesWithSameNames: {
    source: string;
    targetName: string;
  }[] = findDependenciesWithSameName(graph);
  if (dependenciesWithSameNames.length > 0) {
    const source = dependenciesWithSameNames[0].source;
    const targetName = dependenciesWithSameNames[0].targetName;
    return `Package "${source}" depends on multiple packages called "${targetName}"`;
  }
}

function findDependenciesWithSameName(
  graph: Graph
): { source: string; targetName: string }[] {
  const keyToNameMap = new Map<string, string>();
  const dependenciesMap = new Map<string, Set<string>>();
  const result: { source: string; targetName: string }[] = [];

  graph.nodes.forEach((n) => {
    keyToNameMap.set(n.key, n.name);
  });

  graph.links.forEach((l) => {
    const targetName = keyToNameMap.get(l.target)!;
    if (!dependenciesMap.get(l.source)) {
      dependenciesMap.set(l.source, new Set<string>());
    }
    if (dependenciesMap.get(l.source)!.has(targetName)) {
      result.push({ source: l.source, targetName });
    } else {
      dependenciesMap.get(l.source)!.add(targetName);
    }
  });

  return result;
}

function findDups<T>(array: T[]): T | undefined {
  if (array.length == 0) {
    return undefined;
  }
  const tail = array.slice(1);
  if (tail.indexOf(array[0]) !== -1) {
    return array[0];
  }

  return findDups(tail);
}

function getLocationError(location: string): string | undefined {
  if (!path.isAbsolute(location)) {
    return `Location is not an absolute path: "${location}"`;
  }
  try {
    const stats = fs.statSync(location);
    if (!stats.isDirectory()) {
      return `Location is not a directory: "${location}"`;
    }
    const dir = fs.readdirSync(location);
    if (dir.length > 0) {
      return `Location is not an empty directory: "${location}"`;
    }
  } catch (e) {
    return `Location does not exist: "${location}"`;
  }
}
