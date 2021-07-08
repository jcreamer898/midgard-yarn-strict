#!/bin/bash
set -Exu
set -o pipefail
# Builds the release tarball for Yarn.

umask 0022 # Ensure permissions are correct (0755 for dirs, 0644 for files)

# Workaround for https://github.com/yarnpkg/yarn/issues/2591
case "$(uname -s)" in
  *CYGWIN*|MSYS*|MINGW*)
    system_yarn=yarn.cmd
    ;;
  *)
    system_yarn=yarn
    ;;
esac

version=`node -p "require('./package.json').version"`
node_version=`node -p "process.versions.node.split('.')[0]"`

eval $system_yarn run build

rm -rf dist
mkdir dist 

cp package.json dist/
cp worker.js dist/worker.js
cp README.md dist/
cp LICENSE dist/
cp -r lib dist
cp types.d.ts dist/

./scripts/update-dist-manifest.js $(node -p "require('fs').realpathSync('dist/package.json')")
