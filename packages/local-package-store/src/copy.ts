import * as fs from "fs";

const worker = require("worker");

worker.dedicated({
  copyFiles(actions: { src: string; dest: string }[]) {
    try {
      let running = actions.length;

      actions.forEach((a) => {
        fs.copyFile(a.src, a.dest, 0, (err) => {
          if (err) {
            throw err;
          } else {
            running -= 1;
            if (running === 0) {
              process.exit(0);
            }
          }
        });
      });
    } catch (err) {
      throw err;
    }
  },
});
