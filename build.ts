import { build } from "esbuild";
import { assert } from "@std/assert";
import { minify } from "terser";
import { access, readFile } from "node:fs/promises";
import { packAssets, packIntoDataUrl } from "./pack.ts";

const assetPaths: string[] = [];
const buildOutput = await build({
  entryPoints: [Deno.args[0]],
  write: false,
  minify: false,
  bundle: true,
  plugins: [
    {
      name: "Asset loader",
      setup(build) {
        build.onResolve({ filter: /.*/ }, async (args) => {
          if (args.with.type === "bytes") {
            const resolved = await build.resolve(args.path, {
              importer: args.importer,
              kind: args.kind,
              namespace: args.namespace,
              pluginData: args.pluginData,
              resolveDir: args.resolveDir,
            });

            if (resolved.errors.length > 0) {
              return { errors: resolved.errors };
            }

            return {
              path: resolved.path,
              namespace: "bytes",
            };
          }
        });
        build.onLoad({ filter: /.*/, namespace: "bytes" }, async (args) => {
          await access(args.path);
          assetPaths.push(args.path);
          const itemIndex = assetPaths.length - 1;
          return {
            contents: `export default l(${itemIndex + 1})`,
            loader: "js",
          };
        });
      },
    },
  ],
});
assert(buildOutput.outputFiles.length === 1);

const minified = await minify(buildOutput.outputFiles[0].text, {
  compress: {
    passes: 5,
    ecma: 2020,
    toplevel: true,
    pure_getters: true,
    unsafe: true,
    unsafe_math: true,
    hoist_funs: true,
    hoist_vars: true,
    reduce_funcs: true,
    reduce_vars: true,
  },
  mangle: {
    toplevel: true,
  },
  format: {
    comments: false,
    beautify: false,
  },
});
assert(minified.code);
const bundleData = [
  new TextEncoder().encode(minified.code),
  ...(await Promise.all(
    assetPaths.map((path) =>
      readFile(path).then((value) => new Uint8Array(value)),
    ),
  )),
];

const packed = packIntoDataUrl(await packAssets(bundleData));
// console.log(`Packed data url size: ${packed.length}`);
console.log(packed);
