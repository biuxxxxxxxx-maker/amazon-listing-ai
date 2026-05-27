import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

const tempDir = await mkdtemp(join(tmpdir(), "work-up-generation-test-"));
const mockDataSource = await readFile(new URL("../lib/mock-data.ts", import.meta.url), "utf8");
const resultSource = await readFile(
  new URL("../lib/mock-generation-result.ts", import.meta.url),
  "utf8",
);

await writeFile(join(tempDir, "mock-data.js"), transpile(mockDataSource), "utf8");
await writeFile(
  join(tempDir, "mock-generation-result.js"),
  transpile(resultSource).replace("./mock-data", "./mock-data.js"),
  "utf8",
);

const mod = await import(`file:///${join(tempDir, "mock-generation-result.js").replace(/\\/g, "/")}`);

assert.equal(mod.mockGenerationResult.source, "mock");
assert.ok(mod.mockGenerationResult.title.english.includes("Collapsible Storage Basket"));
assert.ok(mod.mockGenerationResult.title.chinese.includes("可折叠"));
assert.equal(mod.mockGenerationResult.bullets.length, 5);
assert.ok(mod.mockGenerationResult.searchTerms.english.includes("collapsible"));
assert.ok(mod.mockGenerationResult.imageSuggestions.length >= 5);

const normalized = mod.normalizeGenerationResult({
  title: {
    english: "Custom Amazon Title",
  },
});

assert.equal(normalized.title.english, "Custom Amazon Title");
assert.equal(normalized.title.chinese, "");
assert.equal(normalized.bullets.length, 0);

console.log("generation result tests passed");
