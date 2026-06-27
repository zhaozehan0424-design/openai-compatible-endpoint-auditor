const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [];
walk(root);

let failed = false;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(result.stderr || result.stdout || `${file} failed syntax check\n`);
  }
}

if (failed) process.exit(1);
console.log(`syntax_ok=${files.length}`);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "outputs", "work"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && [".js", ".cjs", ".mjs"].includes(path.extname(entry.name))) files.push(fullPath);
  }
}
