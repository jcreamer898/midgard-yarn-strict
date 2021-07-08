const fs = require("fs");
const path = require("path");
const temp = require("temp")//.track();
const child_process = require("child_process");

function installYrafGlobally() {
  const yrafPath = temp.mkdirSync("yrafInstall");
  const yrafInstallPJ = {
    name: "yrafInstall",
    version: "1.0.0",
    license: "MIT"
  };
  fs.writeFileSync(path.join(yrafPath, "package.json"), JSON.stringify(yrafInstallPJ));
  child_process.spawnSync("yarn", ["add", path.join(process.cwd(), "dist")], { cwd: yrafPath } );
  return require(path.join(yrafPath, "node_modules", "yraf", "lib", "index.js"));
}

function setupFixture(name) {
  const repoPath = temp.mkdirSync(name);
  fs.copyFileSync(path.join("test_fixtures", name, "package.json"), path.join(repoPath, "package.json"));
  fs.copyFileSync(path.join("test_fixtures", name, "yarn.lock"), path.join(repoPath, "yarn.lock"));
  return repoPath;
}

it("simple repo", async () => {
  const yraf = installYrafGlobally();

  const repo = setupFixture("simple-repo");

  process.chdir(repo);
  const { resolutionMap, locationMap } = await yraf.resolveAndFetch();

  expect(resolutionMap.length).toBe(1);
  expect(resolutionMap[0].range).toBe("typescript@^4.1.2");
  expect(resolutionMap[0].version).toBe("4.1.2");
  expect(locationMap.length).toBe(1);
  expect(locationMap[0].name).toBe("typescript");
  expect(locationMap[0].version).toBe("4.1.2");

  const pj = require(locationMap[0].location);
  expect(pj.name).toBe("typescript");
  expect(pj.version).toBe("4.1.2");

})


