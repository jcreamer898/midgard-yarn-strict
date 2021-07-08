
import { cpus } from "os";
const worker = require('worker');

const maxWorkers = process.env.WORKERS_LIMIT
  ? parseInt(process.env.WORKERS_LIMIT)
  : cpus().length;



export async function copyFiles(fileActions: { src: string; dest: string }[]) {
  const worker_group = worker.group('./copy.js', Math.min(maxWorkers, fileActions.length));
    const armed_group = worker_group.data(fileActions);
    const active_group = armed_group.map("copyFiles");

    await active_group.end();
}