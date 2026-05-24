import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/generation-auth.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

const exports = {};
const cjsModule = { exports };

new Function("exports", "module", output.outputText)(exports, cjsModule);

assert.equal(
  cjsModule.exports.shouldUseSupabaseGenerationAuth({
    projectId: "demo",
    supabaseReady: true,
  }),
  false,
);
assert.equal(
  cjsModule.exports.shouldUseSupabaseGenerationAuth({
    projectId: "",
    supabaseReady: true,
  }),
  false,
);
assert.equal(
  cjsModule.exports.shouldUseSupabaseGenerationAuth({
    projectId: "real-project",
    supabaseReady: true,
  }),
  true,
);
assert.equal(
  cjsModule.exports.shouldUseSupabaseGenerationAuth({
    projectId: "real-project",
    supabaseReady: false,
  }),
  false,
);

console.log("generation auth tests passed");
