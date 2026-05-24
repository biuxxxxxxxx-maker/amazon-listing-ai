import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/mvp-tools.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});

const mod = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputText).toString("base64")}`
);

const expectedSlugs = [
  "product-analysis",
  "competitor-analysis",
  "listing-generator",
  "seo-keywords",
  "image-suggestions",
];

assert.deepEqual(
  mod.mvpTools.map((tool) => tool.slug),
  expectedSlugs,
);

for (const tool of mod.mvpTools) {
  assert.ok(tool.titleCn, `${tool.slug} should have a Chinese title`);
  assert.ok(tool.inputLabel, `${tool.slug} should define an input label`);
  assert.ok(tool.buttonLabel, `${tool.slug} should define a button label`);
  assert.ok(tool.emptyHint, `${tool.slug} should define a Chinese hint`);
  assert.ok(tool.mockOutput.length >= 3, `${tool.slug} should have enough mock output`);
}

console.log("mvp tool config tests passed");
