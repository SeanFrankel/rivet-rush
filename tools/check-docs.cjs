// Check repository-local Markdown file links without an install or network access.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { encoding: "utf8" })
  .split("\0").filter(file => file.endsWith(".md") && fs.existsSync(file));
let failures = 0;
for (const file of files) {
  const markdown = fs.readFileSync(file, "utf8");
  for (const [, link] of markdown.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    if (/^(?:[a-z]+:|#)/i.test(link)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(link.split("#")[0]));
    if (!fs.existsSync(target)) {
      console.error(file + " links to missing " + link);
      failures++;
    }
  }
}
console.log("Checked local file links in " + files.length + " Markdown files.");
process.exitCode = failures ? 1 : 0;
