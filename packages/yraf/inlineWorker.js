/**
 * Script to inline the worker code in the production code.
 * This allows the consumers of this package to bundle the code
 * without needed to know about the fact that we use workers.
 */

const fs = require("fs");
const path = require("path");

const copyFilesContent = fs.readFileSync(path.join("lib", "util", "fs.js"), { encoding: "utf-8"});
const workerContent = fs.readFileSync(path.join("lib", "worker.js"), { encoding: "utf-8"});

const newContent = copyFilesContent.replace("___WORKER___PLACEHOLDER___", workerContent);

fs.writeFileSync(path.join("lib", "util", "fs.js"), newContent);
