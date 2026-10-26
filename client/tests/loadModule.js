import { createServer } from "vite";

// Loads a source file (JSX included) the way Vite does, so tests can render components to HTML
// with react-dom/server without adding a test library or a browser.
let server;

export async function loadModule(path) {
  server ??= await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  return server.ssrLoadModule(path);
}

export async function closeLoader() {
  await server?.close();
  server = undefined;
}
