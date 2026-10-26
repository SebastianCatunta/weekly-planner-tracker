import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The server listens on this port during development (see server/src/server.js).
const SERVER_PORT = 3001;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${SERVER_PORT}`,
        // When the server stops, the proxy leaves long connections (the event stream) open and the
        // browser never learns the connection is gone. Closing the answer lets the browser notice
        // and reconnect, as it would without the proxy.
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes, req, res) => {
            proxyRes.on("aborted", () => res.end());
            proxyRes.on("close", () => {
              if (!res.writableEnded) res.end();
            });
          });
        },
      },
    },
  },
});
