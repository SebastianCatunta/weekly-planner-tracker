// 001/RF-7.1
// Own error for any failure to reach MongoDB. Its message never includes the connection string.
export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database unavailable");
    this.name = "DatabaseUnavailableError";
  }
}
