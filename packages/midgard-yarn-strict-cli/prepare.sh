#!/usr/bin/bash

cd ../yraf 
yarn
yarn build
yarn link

cd ../local-package-store
yarn
yarn build
yarn link

cd ../node-dependency-graph
yarn
yarn build
yarn link

cd ../midgard-yarn-strict
yarn 
yarn link yraf
yarn link local-package-store
yarn link node-dependency-graph
