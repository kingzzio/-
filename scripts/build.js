// Bundles and minifies the front end into public/dist/ (one request instead of ~30).
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const result = await build({
  entryPoints: ["public/js/app.js"],
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2020", "safari14"],
  outfile: "public/dist/app.js",
  sourcemap: true,
  metafile: true,
  legalComments: "none",
});
const js = await readFile("public/dist/app.js");
const css = await readFile("public/css/styles.css");
const version = createHash("sha1").update(js).update(css).digest("hex").slice(0, 10);
// Stamp a version so phones always pick up the newest files.
await writeFile("public/dist/version.json", JSON.stringify({ version }));
const html = (await readFile("public/index.html", "utf8")).replace(/(dist\/app\.js|css\/styles\.css)(\?v=[\w]+)?/g, `$1?v=${version}`);
await writeFile("public/index.html", html);
const sw = (await readFile("public/sw.js", "utf8")).replace(/const CACHE = "brainboro-[\w-]+";/, `const CACHE = "brainboro-${version}";`);
await writeFile("public/sw.js", sw);
const kb = (Object.values(result.metafile.outputs).find((o) => o.entryPoint)?.bytes || js.length) / 1024;
console.log(`built public/dist/app.js (${kb.toFixed(0)} KB) v${version}`);
