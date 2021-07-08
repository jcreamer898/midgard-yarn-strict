export interface ExecutableTree {
  components: Map<number, { dependencies: number[] }>;
  rootComponents: number[];
}

function getNodesInOrder(tree: ExecutableTree): number[] {
  const pending = new Set<number>(tree.components.keys());
  const done = new Set<number>();
  const result: number[] = [];

  while (pending.size !== 0) {
    const pendingIterator = pending.values();
    let next = pendingIterator.next();
    while (!next.done) {
      if (
        tree.components.get(next.value)!.dependencies.filter((d) => !done.has(d))
          .length === 0
      ) {
        pending.delete(next.value);
        done.add(next.value);
        result.push(next.value);
      }
      next = pendingIterator.next();
    }
  }
  return result;
}

export async function executeTree(
  tree: ExecutableTree,
  executor: (component: number) => Promise<void>
): Promise<void> {
  const componentOrders = getNodesInOrder(tree);

  const promises: Map<number, Promise<void>> = new Map();
  componentOrders.forEach((c) => {
    promises.set(
      c,
      new Promise((resolve, reject) => {
        Promise.all(
          tree.components.get(c)!.dependencies.map((d) => promises.get(d))
        ).then(() => {
          executor(c).then(() => resolve()).catch((e) => reject(e));
        });
      })
    );
  });

  await Promise.all(promises.values());
}
