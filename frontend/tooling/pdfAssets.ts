import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
export function copyPdfAssets() {
  const source = dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json"));
  const target = join(process.cwd(), "public", "pdfjs");
  for (const folder of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
    const directory = join(target, folder);
    mkdirSync(directory, { recursive: true });
    for (const name of readdirSync(join(source, folder))) {
      const output = name.startsWith("LICENSE") ? `${name}.txt` : name;
      cpSync(join(source, folder, name), join(directory, output));
    }
  }
  cpSync(join(source, "LICENSE"), join(target, "LICENSE_PDFJS.txt"));
  cpSync(join(process.cwd(), "src/assets/NotoSans-OFL.txt"), join(target, "NotoSans-OFL.txt"));
  cpSync(
    join(process.cwd(), "node_modules/@fontsource/caveat/LICENSE"),
    join(target, "Caveat-OFL.txt")
  );
  copySecurityLicenses(target);
  copyOcrAssets();
}

function copyOcrAssets() {
  const require = createRequire(import.meta.url);
  const engine = dirname(require.resolve("tesseract.js/package.json"));
  const core = dirname(
    createRequire(join(engine, "package.json")).resolve("tesseract.js-core/package.json")
  );
  const language = dirname(require.resolve("@tesseract.js-data/eng/package.json"));
  const target = join(process.cwd(), "public", "ocr");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(join(target, "core"), { recursive: true });
  mkdirSync(join(target, "lang"), { recursive: true });
  cpSync(join(engine, "dist/worker.min.js"), join(target, "worker.min.js"));
  cpSync(join(engine, "LICENSE.md"), join(target, "LICENSE_TESSERACT.txt"));
  for (const name of readdirSync(core))
    if (/^tesseract-core(?:-simd|-relaxedsimd)?-lstm\.wasm\.js$/.test(name))
      cpSync(join(core, name), join(target, "core", name));
  cpSync(join(core, "LICENSE"), join(target, "LICENSE_CORE.txt"));
  cpSync(
    join(language, "4.0.0_best_int/eng.traineddata.gz"),
    join(target, "lang/eng.traineddata.gz")
  );
}

function copySecurityLicenses(target: string) {
  const require = createRequire(import.meta.url);
  const library = dirname(require.resolve("@libpdf/core/package.json"));
  cpSync(join(library, "LICENSE.md"), join(target, "LICENSE_LIBPDF.txt"));
  const dependencies = dirname(dirname(library));
  for (const [name, file] of [
    ["@noble/ciphers", "LICENSE"],
    ["@noble/hashes", "LICENSE"],
    ["@scure/base", "LICENSE"],
    ["pako", "LICENSE"],
    ["lru-cache", "LICENSE.md"],
  ])
    cpSync(
      join(dependencies, name, file),
      join(target, `LICENSE_${name.replaceAll(/[@/]/g, "_")}.txt`)
    );
  for (const name of ["pkijs", "asn1js", "node-forge"]) {
    const root = dirname(require.resolve(`${name}/package.json`));
    cpSync(join(root, "LICENSE"), join(target, `LICENSE_${name}.txt`));
  }
  const pkiRoot = dirname(dirname(require.resolve("pkijs/package.json")));
  for (const name of ["pvutils", "pvtsutils", "bytestreamjs"])
    cpSync(join(pkiRoot, name, "LICENSE"), join(target, `LICENSE_${name}.txt`));
  cpSync(
    join(process.cwd(), "src/assets/LibPDF-FontBox-NOTICE.txt"),
    join(target, "LibPDF-FontBox-NOTICE.txt")
  );
  cpSync(join(target, "LICENSE_PDFJS.txt"), join(target, "LICENSE_LIBPDF_FONTBOX_APACHE.txt"));
}
