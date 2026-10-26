// 001/RF-8.1
// Subscribes to the server's event stream (Server-Sent Events).
//   onCreated(activity): a new activity was registered, in this tab or another one.
//   onReconnect():       the connection was lost and came back; events sent meanwhile were missed,
//                        so the caller should load the full list again.
// Returns a function that closes the connection.

const CLOSED = 2; // EventSource.readyState when the browser gave up on its own retries
const RETRY_MS = 3000;

export function subscribeToActivityEvents({
  onCreated,
  onReconnect,
  createSource = (url) => new EventSource(url),
  retryMs = RETRY_MS,
}) {
  let source;
  let lost = false;
  let stopped = false;
  let retryTimer = null;

  function connect() {
    source = createSource("/api/events");

    source.addEventListener("activity-created", (event) => {
      let activity;
      try {
        activity = JSON.parse(event.data);
      } catch {
        return; // a message that is not an activity is ignored
      }
      onCreated(activity);
    });

    // Usually the browser reconnects by itself after an error. When the server answers with an
    // error status (for example a proxy while the server restarts) the browser gives up
    // (CLOSED): then a new connection is opened after a pause.
    source.addEventListener("error", () => {
      lost = true;
      if (!stopped && source.readyState === CLOSED) {
        retryTimer = setTimeout(connect, retryMs);
      }
    });

    source.addEventListener("open", () => {
      if (!lost) return;
      lost = false;
      onReconnect();
    });
  }

  connect();

  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    source.close();
  };
}
