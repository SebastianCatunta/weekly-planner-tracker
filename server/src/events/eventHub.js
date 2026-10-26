// 001/RF-8.1
// Keeps the open Server-Sent Events connections and sends an event to all of them.
export function createEventHub() {
  const clients = new Set();

  function remove(client) {
    clients.delete(client);
  }

  return {
    get size() {
      return clients.size;
    },

    // `client` is a writable response. Returns a function that removes it from the registry.
    add(client) {
      clients.add(client);
      return () => remove(client);
    },

    // Sends the event to every client. A client that fails to receive it is dropped, and the
    // rest still get the event: one broken connection never stops the broadcast.
    broadcast(event, data) {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const client of [...clients]) {
        try {
          client.write(message);
        } catch {
          remove(client);
        }
      }
    },
  };
}
