import { build } from "esbuild";

await build({
  entryPoints: ["api/_handler.ts"],
  outfile: "api/[...path].mjs",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: false,
  logLevel: "info",
  tsconfig: "tsconfig.json",
});
