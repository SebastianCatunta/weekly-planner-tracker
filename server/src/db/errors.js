// 001/RF-7.1
// Own error for any failure to reach MongoDB. Its message never includes the connection string.
export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database unavailable");
    this.name = "DatabaseUnavailableError";
  }
}

// 001/RF-7.4
// A stored activity breaks the rules of core: the database was changed outside the application.
export class DataCorruptError extends Error {
  constructor() {
    super("Stored data is corrupt");
    this.name = "DataCorruptError";
    this.code = "DATA_CORRUPT";
  }
}
