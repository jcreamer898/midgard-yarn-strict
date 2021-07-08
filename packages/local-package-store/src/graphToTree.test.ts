import type { Graph } from "./graphToTree";
import { convertGraphToTree } from "./graphToTree";
describe("most simple graph", () => {
  it("has only one root component", () => {
    const graph: Graph = {
      nodes: [{ key: "foo", isRoot: true }, { key: "bar" }],
      links: [{ source: "foo", target: "bar" }],
    };

    const tree = convertGraphToTree(graph);

    expect(tree.rootComponents.length).toBe(1);
  });

  it("respects the key of the root component", () => {
    const graph: Graph = {
      nodes: [{ key: "foo", isRoot: true }, { key: "bar" }],
      links: [{ source: "foo", target: "bar" }],
    };

    const tree = convertGraphToTree(graph);

    const root = tree.rootComponents[0]!;

    expect(tree.components.get(root)!.keys).toEqual(["foo"]);
  });

  it("respect the dependency number of the root component", () => {
    const graph: Graph = {
      nodes: [{ key: "foo", isRoot: true }, { key: "bar" }],
      links: [{ source: "foo", target: "bar" }],
    };

    const tree = convertGraphToTree(graph);

    const root = tree.rootComponents[0]!;

    const dep = tree.components.get(root)!.dependencies;

    expect(dep.length).toBe(1);
  });

  it("respect the dependency key of the root component", () => {
    const graph: Graph = {
      nodes: [{ key: "foo", isRoot: true }, { key: "bar" }],
      links: [{ source: "foo", target: "bar" }],
    };

    const tree = convertGraphToTree(graph);

    const root = tree.rootComponents[0]!;

    const dep = tree.components.get(root)!.dependencies;

    expect(tree.components.get(dep[0])!.keys).toEqual(["bar"]);

    expect(tree.components.get(dep[0])!.dependencies).toEqual([]);
  });

  
  it("respect the number of dependencies of the second component", () => {
    const graph: Graph = {
      nodes: [{ key: "foo", isRoot: true }, { key: "bar" }],
      links: [{ source: "foo", target: "bar" }],
    };

    const tree = convertGraphToTree(graph);

    const root = tree.rootComponents[0]!;

    const dep = tree.components.get(root)!.dependencies;

    expect(tree.components.get(dep[0])!.dependencies).toEqual([]);
  });
});
