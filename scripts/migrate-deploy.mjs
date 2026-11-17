/**
 * `prisma migrate deploy` with retries. The direct (migration) connection has a small cap,
 * so a deploy can briefly find it busy; wait and retry instead of failing the build.
 * Any other error fails immediately.
 */
import { spawnSync } from "node:child_process";

const ATTEMPTS = 5;
const WAIT_MS = 15_000;
const BUSY = /too many connections|P1001|Can't reach database server|P1017|connection.*closed/i;

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const res = spawnSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf8" });
  process.stdout.write(res.stdout ?? "");
  process.stderr.write(res.stderr ?? "");
  if (res.status === 0) process.exit(0);
  const output = `${res.stdout}\n${res.stderr}`;
  if (!BUSY.test(output) || attempt === ATTEMPTS) process.exit(res.status ?? 1);
  console.warn(`[migrate] database busy (attempt ${attempt}/${ATTEMPTS}); retrying in ${WAIT_MS / 1000}s…`);
  await new Promise((r) => setTimeout(r, WAIT_MS));
}
