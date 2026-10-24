import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The server listens on this port during development (see server/src/server.js).
const SERVER_PORT = 3001;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": `http://localhost:${SERVER_PORT}`,
    },
  },
});
