// In-memory stand-in for activityRepository. Records every call so tests can check what the
// service did (and did not) ask for.
export function createFakeRepository({ failWith = null, delayMs = 0 } = {}) {
  const stored = [];
  const calls = [];
  let nextId = 1;
  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs));

  return {
    stored,
    calls,
    async findByDay(day) {
      calls.push(["findByDay", day]);
      await wait();
      if (failWith) throw failWith;
      return stored.filter((a) => a.day === day);
    },
    async findAll() {
      calls.push(["findAll"]);
      await wait();
      if (failWith) throw failWith;
      return [...stored];
    },
    async insert(activity) {
      calls.push(["insert", activity]);
      await wait();
      if (failWith) throw failWith;
      const record = { id: String(nextId++), createdAt: new Date(), ...activity };
      stored.push(record);
      return record;
    },
  };
}
