// 001/RF-4.5
// Runs async tasks one at a time, in arrival order. A task starts only when the previous one has
// finished, whether it succeeded or failed, so a failure never blocks the queue.
// Limitation (plan D5): it only orders writes inside one server process.
export function createWriteQueue() {
  let tail = Promise.resolve();

  return {
    run(task) {
      const result = tail.then(() => task());
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}
