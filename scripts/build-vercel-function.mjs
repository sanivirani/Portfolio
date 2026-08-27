import { build } from "esbuild";

await build({
  entryPoints: ["api/_handler.cts"],
  outfile: "api/[...path].js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  sourcemap: false,
  logLevel: "info",
  tsconfig: "tsconfig.json",
});
