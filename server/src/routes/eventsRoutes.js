import { Router } from "express";

const DEFAULT_HEARTBEAT_MS = 25000;

// 001/RF-8.1
// Long-lived Server-Sent Events connection. A periodic comment keeps it alive through proxies.
export function createEventsRouter(eventHub, { heartbeatMs = DEFAULT_HEARTBEAT_MS } = {}) {
  const router = Router();

  router.get("/events", (req, res) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    res.flushHeaders();
    res.write(": connected\n\n");

    const remove = eventHub.add(res);
    const heartbeat = setInterval(() => {
      try {
        res.write(": keep-alive\n\n");
      } catch {
        // The close handler below cleans up.
      }
    }, heartbeatMs);

    // The client went away (tab closed, network lost): forget it.
    res.on("close", () => {
      clearInterval(heartbeat);
      remove();
    });
  });

  return router;
}
