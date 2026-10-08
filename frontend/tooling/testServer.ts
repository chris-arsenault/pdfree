import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
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
export async function startTestServer() {
  let connected = true;
  const root = resolve("dist"),
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
        response.writeHead(200, {
          ...headers,
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        response.end(bytes);
      })
      .catch(() => {
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
