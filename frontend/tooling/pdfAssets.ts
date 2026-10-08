import { cpSync, mkdirSync, readdirSync } from "node:fs";
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
  for (const name of ["pkijs", "asn1js"]) {
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
