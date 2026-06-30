const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "MAINTENANCE.md",
  "REPOSITORY_STATUS.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "LICENSE",
  ".gitignore",
  ".env.example",
  "package.json",
  "bin/endpoint-auditor.cjs",
  "examples/endpoints.example.json",
  "scripts/check-syntax.cjs",
  "scripts/check-public-repo.cjs",
  "scripts/mock-smoke-test.cjs",
  ".github/workflows/ci.yml",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/endpoint_compatibility.md",
  ".github/pull_request_template.md",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length > 0) {
  console.error(`missing_files=${missing.join(",")}`);
  process.exit(1);
}

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const requiredReadmeSnippets = [
  "OpenAI-compatible",
  "No real API keys",
  "apiKeyEnv",
  "GET /models",
  "POST /chat/completions",
  "npm run check",
  "SECURITY.md",
  "CONTRIBUTING.md",
];

const missingReadme = requiredReadmeSnippets.filter((snippet) => !readme.includes(snippet));
if (missingReadme.length > 0) {
  console.error(`missing_readme_snippets=${missingReadme.join(",")}`);
  process.exit(1);
}

const trackedSensitive = [".env", "endpoints.local.json", "outputs/results.json"].filter((file) => fs.existsSync(path.join(root, file)));
if (trackedSensitive.length > 0) {
  console.error(`local_secret_files_present=${trackedSensitive.join(",")}`);
  process.exit(1);
}

console.log("public_repo_ok=true");
