import { Graph } from "./graph";
import * as semver from "semver";

/**
 * Description of a package.
 */
export interface PackageManifest {
  name: string;
  version: string;
  /**
   * Local packages are packages which are located in the repository and should not be
   * copied to another location or duplicated.
   */
  isLocal?: boolean;
  dependencies?: { [name: string]: string };
  devDependencies?: { [name: string]: string };
  optionalDependencies?: { [name: string]: string };
  peerDependencies?: { [name: string]: string };
  peerDependenciesMeta?: { [name: string]: { optional?: boolean } };
}

type ResolutionMap = { [name: string]: { [range: string]: string } };

type Node = {
  id: number;
  name: string;
  version: string;
  resolvedPeerDependencies?: { [name: string]: number };
};
type Link = { sourceId: number; targetId: number };

type DependencyGraph = {
  nodes: Node[];
  links: Link[];
};

export function createDependencyGraph(
  manifests: PackageManifest[],
  resolutionMap: ResolutionMap,
  failOnMissingPeerDependencies?: boolean
): DependencyGraph {
  if (failOnMissingPeerDependencies === undefined) {
    failOnMissingPeerDependencies = true;
  }

  const graph = new Graph();

  // Adding nodes to the graph
  manifests.forEach((m) => {
    graph.addNode(m.name, m.version, m.isLocal || false);
  });

  // Adding dependencies to the graph
  manifests.forEach((m) => {
    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version)!;

    const dependencies = m.dependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach((k) => {
        const targetName = k;
        const targetRange = dependencies[k];
        const targetVersion = resolutionMap[targetName][targetRange];
        const targetId = graph.getNodeWithoutPeerDependencies(
          targetName,
          targetVersion
        )!;
        graph.addLink(sourceId.id, targetId.id);
      });
    }
  });

  // Adding devDependencies to the graph
  manifests.forEach((m) => {
    if (!m.isLocal) {
      return;
    }

    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version)!;

    const dependencies = m.devDependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach((k) => {
        const targetName = k;
        const targetRange = dependencies[k];
        const targetVersion = resolutionMap[targetName][targetRange];
        const targetId = graph.getNodeWithoutPeerDependencies(
          targetName,
          targetVersion
        )!;
        graph.addLink(sourceId.id, targetId.id);
      });
    }
  });

  manifests.forEach((m) => {
    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version)!;

    const dependencies = m.optionalDependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach((k) => {
        const targetName = k;
        const targetRange = dependencies[k];
        const targetVersion = resolutionMap[targetName][targetRange];
        const targetId = graph.getNodeWithoutPeerDependencies(
          targetName,
          targetVersion
        );
        if (!targetId) {
          // This is legal, it means the optional dependency is not installed.
          return;
        }
        graph.addLink(sourceId.id, targetId.id);
      });
    }
  });

  manifests.forEach((m) => {
    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version)!;

    const dependencies = {
      ...(m.peerDependenciesMeta
        ? Object.keys(m.peerDependenciesMeta)
            .map((k) => ({ [k]: "*" }))
            .reduce((a, c) => ({ ...a, ...c }), {})
        : {}),
      ...(m.peerDependencies || {}),
    };
    if (dependencies) {
      Object.keys(dependencies).forEach((k) => {
        const targetName = k;
        const targetRange = dependencies[k];
        const optional = Boolean(
          m.peerDependenciesMeta &&
            m.peerDependenciesMeta[k] &&
            m.peerDependenciesMeta[k].optional
        );
        graph.addPeerLink(sourceId, targetName, targetRange, optional);
      });
    }
  });

  // Resolve PeerLinks
  let peerDeps = graph.getPeerLinks();
  let watchDog = peerDeps.length + 1;
  while (peerDeps.length !== 0) {
    // Stop the loop when the number of elements in the queue are stable
    if (watchDog === 0) {
      break;
    }

    const peerDep = peerDeps.shift()!;
    const { parentId, sourceId, targetName, optional, targetRange } = peerDep;
    if (
      !graph.links.get(parentId) ||
      !graph.links.get(parentId)!.has(sourceId)
    ) {
      watchDog = peerDeps.length + 1;
      continue;
    }
    function resolveChild(
      parent: number,
      name: string,
      optional: boolean
    ): number | "failed" | "ignored" | "retryLater" {
      const children = Array.from(graph.links.get(sourceId)?.keys() || []);
      if (children.some((s) => graph.reversedNodes.get(s)?.name === name)) {
        return "ignored";
      }

      const siblings = Array.from(graph.links.get(parentId)?.keys() || []);
      const candidates = siblings.concat([parentId]);
      const result = candidates.filter(
        (s) => graph.reversedNodes.get(s)?.name === name
      )[0];
      if (result !== undefined) {
        const version = graph.reversedNodes.get(result)!.version;
        if (!semver.satisfies(version, targetRange)) {
          const parentName = graph.reversedNodes.get(parentId)!.name;
          const parentVersion = graph.reversedNodes.get(parentId)!.version;
          const sourceName = graph.reversedNodes.get(sourceId)!.name;
          const sourceVersion = graph.reversedNodes.get(sourceId)!.version;
          console.error(
            `[WARNING] unmatching peer dependency, ${name} in ${sourceName}@${sourceVersion} (parent: ${parentName}@${parentVersion}) was resolved to version ${version} which does not satisfy the given range: ${targetRange}`
          );
        }
        // Install this peerDependency
        return result;
      } else {
        if (optional) {
          return "ignored";
        } else {
          if (graph.hasPeerLink(parent)) {
            return "retryLater";
          } else {
            const parentName = graph.reversedNodes.get(parentId)!.name;
            const parentVersion = graph.reversedNodes.get(parentId)!.version;
            const sourceName = graph.reversedNodes.get(sourceId)!.name;
            const sourceVersion = graph.reversedNodes.get(sourceId)!.version;
            if (failOnMissingPeerDependencies) {
              throw new Error(
                `[ERROR] Unmet peer dependency: ${name} in ${sourceName}@${sourceVersion} (parent: ${parentName}@${parentVersion})`
              );
            } else {
              console.error(
                `[WARNING] Unmet peer dependency: ${name} in ${sourceName}@${sourceVersion} (parent: ${parentName}@${parentVersion})`
              );
              return "failed";
            }
          }
        }
      }
    }
    const result = resolveChild(parentId, targetName, optional);
    if (typeof result === "number") {
      const existingVirtualNode = graph.getVirtualNode(
        sourceId,
        targetName,
        result
      );
      if (existingVirtualNode !== undefined) {
        const newPeerLinks = graph.peerLinks.get(existingVirtualNode) || [];

        for (const newPeerLink of newPeerLinks) {
          peerDeps.push({
            parentId,
            sourceId: existingVirtualNode,
            targetName: newPeerLink.targetName,
            targetRange: newPeerLink.targetRange,
            optional: newPeerLink.optional,
          });
        }
        graph.changeChildren(parentId, sourceId, existingVirtualNode);

        watchDog = peerDeps.length + 1;
      } else {
        const newPackageId = graph.createVirtualNode(
          sourceId,
          targetName,
          result
        );

        const newPeerLinks = graph.peerLinks.get(newPackageId) || [];
        for (const newPeerLink of newPeerLinks) {
          peerDeps.push({
            parentId,
            sourceId: newPackageId,
            targetName: newPeerLink.targetName,
            targetRange: newPeerLink.targetRange,
            optional: newPeerLink.optional,
          });
        }
        const children = Array.from(
          graph.links.get(newPackageId)?.keys() || []
        );
        for (const child of children) {
          const childPeerLinks = graph.peerLinks.get(child) || [];
          for (const childPeerLink of childPeerLinks) {
            peerDeps.push({
              parentId: newPackageId,
              sourceId: child,
              targetName: childPeerLink.targetName,
              targetRange: childPeerLink.targetRange,
              optional: childPeerLink.optional,
            });
          }
        }
        graph.changeChildren(parentId, sourceId, newPackageId);
        watchDog = peerDeps.length + 1;
      }
    } else if (result === "retryLater") {
      peerDeps.push(peerDep);
      watchDog--;
    }
  }

  return graph.toJson();
}
