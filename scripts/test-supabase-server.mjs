import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/supabase-server.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

const exports = {};
const cjsModule = { exports };
const require = (specifier) => {
  if (specifier === "@supabase/supabase-js") {
    return { createClient: () => ({}) };
  }

  if (specifier.includes("cloudflare-env")) {
    return { readServerEnv: async () => "" };
  }

  if (specifier.includes("supabase-config")) {
    return {
      normalizeEnvText: (value) => (typeof value === "string" ? value.trim() : ""),
      normalizeSupabaseProjectUrl: (value) => (typeof value === "string" ? value.trim() : ""),
    };
  }

  throw new Error(`Unexpected require: ${specifier}`);
};

new Function("exports", "module", "require", output.outputText)(exports, cjsModule, require);

const { readBearerToken, readRequestAccessToken, readRequestRefreshToken } = cjsModule.exports;

assert.equal(readBearerToken("Bearer abc123"), "abc123");
assert.equal(readBearerToken("bearer abc123"), "abc123");
assert.equal(readBearerToken("Bearer   abc123  "), "abc123");
assert.equal(readBearerToken("Token abc123"), "");
assert.equal(readBearerToken(null), "");
assert.equal(
  readRequestAccessToken(
    new Request("http://localhost/api", {
      headers: { cookie: "work_up_access_token=cookie-token; other=value" },
    }),
  ),
  "cookie-token",
);
assert.equal(
  readRequestAccessToken(
    new Request("http://localhost/api", {
      headers: {
        authorization: "Bearer header-token",
        cookie: "work_up_access_token=cookie-token",
      },
    }),
  ),
  "header-token",
);
assert.equal(
  readRequestRefreshToken(
    new Request("http://localhost/api", {
      headers: { cookie: "work_up_refresh_token=refresh-cookie-token; other=value" },
    }),
  ),
  "refresh-cookie-token",
);
assert.equal(readRequestRefreshToken(new Request("http://localhost/api")), "");

console.log("supabase server helper tests passed");
