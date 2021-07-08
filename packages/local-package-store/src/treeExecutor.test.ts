import { rejects } from "assert";
import type { ExecutableTree } from "./treeExecutor";
import { executeTree } from "./treeExecutor";

it("executes in order", async () => {
    const tree: ExecutableTree = {
        components: new Map([[0, { dependencies: [1]}], [1, { dependencies: []}]]),
        rootComponents: [0]
    }

    const calls: string[] = [];
    const executor = (component: number): Promise<void> => {
        return new Promise((resolve) => {
            calls.push(`starting ${component}`);
            setTimeout(() => {
                calls.push(`finishing ${component}`);
                resolve();
            }, 50)
        });
    }

    await executeTree(tree, executor);

    expect(calls).toEqual(['starting 1', 'finishing 1', 'starting 0', 'finishing 0']);
})

it("throws when it should", async () => {
    const tree: ExecutableTree = {
        components: new Map([[0, { dependencies: []}]]),
        rootComponents: [0]
    }

    const executor = (component: number): Promise<void> => {
        return new Promise<void>((_, reject) => {
            reject(new Error("foobar"));
        })
    }

    await expect(executeTree(tree, executor)).rejects.toHaveProperty("message", "foobar");
})