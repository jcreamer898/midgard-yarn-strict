import { createDependencyGraph, PackageManifest } from "./";

it("resolves basic graph", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("ignores non-rooted packages", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "foo",
      version: "1.0.0",
    },
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("resolves devDependency of local packages", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      devDependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("does not resolve devDependency of remote packages", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      devDependencies: {
        B: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      devDependencies: {
        C: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
    ],
    links: [{ sourceId: 0, targetId: 1 }],
  };

  expect(graph).toEqual(expected);
});

it("resolves optionalDependencies when available", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      optionalDependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("ignore peer-dependencies of local packages", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      peerDependencies: {
        C: "*",
      },
    },
  ];

  const resolutionMap = {};
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [{ id: 0, name: "A", version: "1.0.0" }],
    links: [],
  };

  expect(graph).toEqual(expected);
});

it("ignore peer-dependencies of non-rooted local packages", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.0.0",
      isLocal: true,
      peerDependencies: {
        C: "*",
      },
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.0.0" },
    ],
    links: [{ sourceId: 0, targetId: 1 }],
  };

  expect(graph).toEqual(expected);
});

it("ignore self-fulfilled peer-dependencies", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.0.0",
      isLocal: false,
      peerDependencies: {
        C: "*",
      },
      dependencies: {
        C: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.1.0",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.0.0" },
    C: { "^1.0.0": "1.1.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.0.0" },
      { id: 2, name: "C", version: "1.1.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 1, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("propagates peer dependencies even regardless of input order", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        D: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "1.0.0",
      },
    },
    {
      name: "D",
      version: "1.0.0",
      isLocal: false,
      peerDependencies: {
        C: "1.0.0",
      },
      dependencies: {
        B: "^1.0.0",
      },
    },
  ];

  const resolutionMap = {
    A: { "^1.0.0": "1.0.0" },
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
    D: { "^1.0.0": "1.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
      { id: 3, name: "D", version: "1.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 2 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 1, targetId: 2 },
      { sourceId: 3, targetId: 1 },
      { sourceId: 3, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});
it("install peer dependencies even when they don't match", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "2.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    A: { "^1.0.0": "1.0.0" },
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});
it("automatically add peerDependencies from peerDependenciesMeta", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependenciesMeta: {
        C: { optional: true },
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    A: { "^1.0.0": "1.0.0" },
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});
it("properly installs package with two peer dependencies", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
        D: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "^1.0.0",
        D: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
    {
      name: "D",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    A: { "^1.0.0": "1.0.0" },
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
    D: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
      { id: 3, name: "D", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 1, targetId: 2 },
      { sourceId: 1, targetId: 3 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("properly installs package with two peer dependencies and two parents", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
        D: "^1.0.0",
      },
    },
    {
      name: "AA",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
        D: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "^1.0.0",
        D: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
    {
      name: "D",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    A: { "^1.0.0": "1.0.0" },
    AA: { "^1.0.0": "1.0.0" },
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
    D: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "AA", version: "1.0.0" },
      { id: 2, name: "B", version: "1.1.0" },
      { id: 3, name: "C", version: "1.0.1" },
      { id: 4, name: "D", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 2 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 0, targetId: 4 },
      { sourceId: 1, targetId: 2 },
      { sourceId: 1, targetId: 3 },
      { sourceId: 1, targetId: 4 },
      { sourceId: 2, targetId: 3 },
      { sourceId: 2, targetId: 4 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("does not ignore optional peer dependencies when available", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependenciesMeta: {
        C: { optional: true },
      },
      peerDependencies: {
        C: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    A: { "^1.0.0": "1.0.0" },
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("ignore optionalDependencies when not available", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      optionalDependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [{ id: 0, name: "A", version: "1.0.0" }],
    links: [],
  };

  expect(graph).toEqual(expected);
});

it("sorts links", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        C: "^1.0.0",
        B: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("sorts nodes", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        C: "^1.0.0",
        B: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("resolves basic peer dependencies", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "*",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("resolves parent as peer dependencies", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        A: "*",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 0 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("creates virtual packages when needed", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
        D: "^2.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      peerDependencies: {
        D: "*",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      dependencies: {
        B: "^1.0.0",
        D: "^1.0.0",
      },
    },
    {
      name: "D",
      version: "1.0.0",
    },
    {
      name: "D",
      version: "2.0.0",
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
    D: { "^1.0.0": "1.0.0", "^2.0.0": "2.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "B", version: "1.1.0" },
      { id: 3, name: "C", version: "1.0.1" },
      { id: 4, name: "D", version: "1.0.0" },
      { id: 5, name: "D", version: "2.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 0, targetId: 5 },
      { sourceId: 1, targetId: 5 },
      { sourceId: 2, targetId: 4 },
      { sourceId: 3, targetId: 2 },
      { sourceId: 3, targetId: 4 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("ignore links from unreachable nodes", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        D: "^2.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      peerDependencies: {
        D: "*",
      },
      dependencies: {
        C: "^1.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
    },
    {
      name: "D",
      version: "2.0.0",
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
    D: { "^2.0.0": "2.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
      { id: 3, name: "D", version: "2.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 1, targetId: 2 },
      { sourceId: 1, targetId: 3 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("dedups virtual packages when it can", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
        D: "^2.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      peerDependencies: {
        D: "*",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      dependencies: {
        B: "^1.0.0",
        D: "^2.0.0",
      },
    },
    {
      name: "D",
      version: "2.0.0",
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
    D: { "^2.0.0": "2.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
      { id: 3, name: "D", version: "2.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 1, targetId: 3 },
      { sourceId: 2, targetId: 1 },
      { sourceId: 2, targetId: 3 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("handles circular peer dependencies", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      peerDependencies: {
        C: "*",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      peerDependencies: {
        B: "*",
      },
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  //console.log(JSON.stringify(graph, undefined, 2));
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 2 },
      { sourceId: 2, targetId: 1 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("handles packages with two peerDependencies", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
        D: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.0.0",
    },
    {
      name: "C",
      version: "1.0.0",
    },
    {
      name: "D",
      version: "1.0.0",
      peerDependencies: {
        B: "*",
        C: "*",
      },
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.0.0" },
    C: { "^1.0.0": "1.0.0" },
    D: { "^1.0.0": "1.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.0.0" },
      { id: 2, name: "C", version: "1.0.0" },
      { id: 3, name: "D", version: "1.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 3, targetId: 1 },
      { sourceId: 3, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("resolved a convoluted case with a mix of peerDependencies and circular dependencies", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      isLocal: true,
      version: "1.0.0",
      dependencies: {
        B: "^1.0.0",
        E: "^2.0.0",
      },
    },
    {
      name: "B",
      version: "1.0.0",
      dependencies: {
        C: "^1.0.0",
        D: "^1.0.0",
      },
      peerDependencies: {
        E: "*",
      },
    },
    {
      name: "C",
      version: "1.0.0",
      dependencies: {
        B: "^1.0.0",
        E: "^1.0.0",
      },
      peerDependencies: {
        D: "*",
      },
    },
    {
      name: "D",
      version: "1.0.0",
    },
    {
      name: "E",
      version: "1.0.0",
    },
    {
      name: "E",
      version: "2.0.0",
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.0.0" },
    C: { "^1.0.0": "1.0.0" },
    D: { "^1.0.0": "1.0.0" },
    E: { "^1.0.0": "1.0.0", "^2.0.0": "2.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.0.0" },
      { id: 2, name: "B", version: "1.0.0" },
      { id: 3, name: "C", version: "1.0.0" },
      { id: 4, name: "D", version: "1.0.0" },
      { id: 5, name: "E", version: "1.0.0" },
      { id: 6, name: "E", version: "2.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 6 },
      { sourceId: 1, targetId: 3 },
      { sourceId: 1, targetId: 4 },
      { sourceId: 1, targetId: 6 },
      { sourceId: 2, targetId: 3 },
      { sourceId: 2, targetId: 4 },
      { sourceId: 2, targetId: 5 },
      { sourceId: 3, targetId: 2 },
      { sourceId: 3, targetId: 4 },
      { sourceId: 3, targetId: 5 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("resolved a second convoluted case with a mix of peerDependencies and circular dependencies", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.0.0",
      peerDependencies: {
        C: "*",
      },
    },
    {
      name: "B",
      version: "2.0.0",
      peerDependencies: {
        C: "*",
      },
    },
    {
      name: "C",
      version: "1.0.0",
      dependencies: {
        D: "^1.0.0",
      },
      peerDependencies: {
        B: "*",
      },
    },
    {
      name: "D",
      version: "1.0.0",
      dependencies: {
        E: "^1.0.0",
      },
    },
    {
      name: "E",
      version: "1.0.0",
      dependencies: {
        B: "^2.0.0",
        C: "^1.0.0",
      },
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.0.0", "^2.0.0": "2.0.0" },
    C: { "^1.0.0": "1.0.0" },
    D: { "^1.0.0": "1.0.0" },
    E: { "^1.0.0": "1.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.0.0" },
      { id: 2, name: "B", version: "2.0.0" },
      { id: 3, name: "C", version: "1.0.0" },
      { id: 4, name: "C", version: "1.0.0" },
      { id: 5, name: "D", version: "1.0.0" },
      { id: 6, name: "E", version: "1.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 1, targetId: 3 },
      { sourceId: 2, targetId: 4 },
      { sourceId: 3, targetId: 1 },
      { sourceId: 3, targetId: 5 },
      { sourceId: 4, targetId: 2 },
      { sourceId: 4, targetId: 5 },
      { sourceId: 5, targetId: 6 },
      { sourceId: 6, targetId: 2 },
      { sourceId: 6, targetId: 4 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("resolved a third convoluted case with a mix of peerDependencies and circular dependencies", () => {
  const packageManifests: PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
        D: "^1.0.0",
        E: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.0.0",
    },
    {
      name: "C",
      version: "1.0.0",
      peerDependencies: {
        B: "*",
        D: "*",
      },
    },
    {
      name: "D",
      version: "1.0.0",
      peerDependencies: {
        E: "^1.0.0",
      },
    },
    {
      name: "E",
      version: "1.0.0",
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.0.0" },
    C: { "^1.0.0": "1.0.0" },
    D: { "^1.0.0": "1.0.0" },
    E: { "^1.0.0": "1.0.0" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.0.0" },
      { id: 2, name: "C", version: "1.0.0" },
      { id: 3, name: "D", version: "1.0.0" },
      { id: 4, name: "E", version: "1.0.0" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 0, targetId: 4 },
      { sourceId: 2, targetId: 1 },
      { sourceId: 2, targetId: 3 },
      { sourceId: 3, targetId: 4 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("resolves optional peer dependencies", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "*",
      },
      peerDependenciesMeta: {
        C: { optional: true },
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" },
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 2 },
    ],
  };

  expect(graph).toEqual(expected);
});

it("ignores unfulfilled optional peer dependencies", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "*",
      },
      peerDependenciesMeta: {
        C: { optional: true },
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
    ],
    links: [{ sourceId: 0, targetId: 1 }],
  };

  expect(graph).toEqual(expected);
});

it("fails when peer dependencies are unmet", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "*",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  expect(() =>
    createDependencyGraph(packageManifests, resolutionMap)
  ).toThrow();
});

it("does not fail when peer dependencies are unmet, when explicitly asked not to", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "*",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  createDependencyGraph(packageManifests, resolutionMap, false);
});

it("emit warning if peerDependency is fulfilled with wrong version", () => {
  let spy: any = {};

  spy.console = jest.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => spy.console.mockClear());
  afterAll(() => spy.console.mockRestore());

  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        B: "^1.0.0",
        C: "^1.0.0",
      },
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false,
      peerDependencies: {
        C: "^2.0.0",
      },
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false,
    },
  ];

  const resolutionMap = {
    B: { "^1.0.0": "1.1.0" },
    C: { "^1.0.0": "1.0.1" },
  };
  createDependencyGraph(packageManifests, resolutionMap);
  expect(console.error).toHaveBeenCalledTimes(1);
  expect(spy.console.mock.calls[0][0]).toContain(
    "[WARNING] unmatching peer dependency"
  );
});
