import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { gzipSync } from "node:zlib";
export type ServedRequest = {
  path: string;
  status: number;
  decodedBytes: number;
  encodedBytes: number;
};
type HostingOptions = {
  root?: string;
  production?: boolean;
  observe?: (request: ServedRequest) => void;
};
function responseBody(bytes: Buffer, mime: string, accepted: string, production = false) {
  const compressed =
    production &&
    /gzip/.test(accepted) &&
    /^(text\/|font\/ttf|application\/(wasm|manifest\+json))/.test(mime) &&
    bytes.length >= 1024;
  return {
    body: compressed ? gzipSync(bytes) : bytes,
    encoding: compressed ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {},
  };
}
const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
};
export async function startTestServer(options: HostingOptions = {}) {
  let connected = true;
  const root = resolve(options.root ?? "dist"),
    headers = JSON.parse(await readFile("security-headers.json", "utf8")) as Record<string, string>;
  const server = createServer((request, response) => {
    if (!connected) {
      request.socket.destroy();
      return;
    }
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const file = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(`${root}/`)) {
      response.writeHead(403);
      response.end();
      return;
    }
    readFile(file)
      .then((bytes) => {
        const mime = types[extname(file)] ?? "application/octet-stream";
        const { body, encoding } = responseBody(
          bytes,
          mime,
          request.headers["accept-encoding"] ?? "",
          options.production
        );
        response.writeHead(200, {
          ...headers,
          "Content-Type": mime,
          "Cache-Control":
            options.production && pathname.startsWith("/assets/")
              ? "public, max-age=31536000, immutable"
              : "no-cache",
          ...encoding,
        });
        options.observe?.({
          path: pathname,
          status: 200,
          decodedBytes: bytes.length,
          encodedBytes: body.length,
        });
        response.end(body);
      })
      .catch(() => {
        options.observe?.({ path: pathname, status: 404, decodedBytes: 0, encodedBytes: 0 });
        response.writeHead(404);
        response.end();
      });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Temporary test hosting did not start.");
  return {
    url: `http://127.0.0.1:${address.port}`,
    disconnect: () => {
      connected = false;
    },
    reconnect: () => {
      connected = true;
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      ),
  };
}
