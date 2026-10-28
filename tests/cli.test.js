import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("CLI prints usage without starting a network scan", async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, ["src/cli.js"], {
    cwd: new URL("..", import.meta.url),
  });
  assert.match(stdout, /Usage: node src\/cli\.js scan/);
  assert.equal(stderr, "");
});
