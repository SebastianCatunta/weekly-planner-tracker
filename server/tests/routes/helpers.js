import { createApp } from "../../src/app.js";

// Starts the app on a free port and returns helpers to call it with real HTTP.
export async function startApp(options = {}) {
  const logged = [];
  const app = createApp({ logger: { error: (error) => logged.push(error) }, ...options });
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return {
    baseUrl,
    logged,
    close: () => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }),
    request: (path, init) => fetch(baseUrl + path, init),
  };
}
