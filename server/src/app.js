import express from "express";
import { rejectOperatorKeys } from "./middleware/rejectOperatorKeys.js";

// Builds the Express app. Dependencies come in as arguments so tests can pass fakes.
// `routers` is a list of [path, router] pairs mounted after the JSON reader.
// `clientDir` is the folder with the compiled client (client/dist); if given, the app serves it.
export function createApp({ routers = [], clientDir = null, logger = console } = {}) {
  const app = express();

  app.use(express.json());
  app.use(rejectOperatorKeys);
  for (const [path, router] of routers) app.use(path, router);

  // 001/RF-1.1, RNF-5
  // The compiled client is served from the app's own address. Any other path that is not under
  // /api gets the page, so the client works without the Vite development server.
  if (clientDir) {
    app.use(express.static(clientDir));
    app.get(/^\/(?!api(\/|$))/, (req, res) => {
      res.sendFile("index.html", { root: clientDir });
    });
  }

  // Anything not handled by a route: no details about the server are shown.
  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND" } });
  });

  // 001/RF-7 (base)
  // Same error shape everywhere, no internal details in the response.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    // Malformed JSON, wrong charset, body too large...: the client sent something unreadable.
    if (error?.type?.startsWith("entity.") || error?.status === 400) {
      return res.status(400).json({ error: { code: "INVALID_BODY" } });
    }
    logger.error(error);
    return res.status(500).json({ error: { code: "INTERNAL" } });
  });

  return app;
}
