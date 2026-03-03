import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

import { MongoClient, MongoClientOptions } from "mongodb";

// ─── Validation ───────────────────────────────────────────────────────────────

if (!process.env.MONGODB_URI) {
  throw new Error(
    'Missing environment variable "MONGODB_URI". ' +
      "Add it to your .env.local file and restart the dev server.",
  );
}

if (!process.env.MONGODB_DB) {
  throw new Error(
    'Missing environment variable "MONGODB_DB". ' +
      "Add it to your .env.local file and restart the dev server.",
  );
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

// ─── Connection options ───────────────────────────────────────────────────────

const options: MongoClientOptions = {
  socketTimeoutMS: 30_000,
  connectTimeoutMS: 10_000,
  serverSelectionTimeoutMS: 10_000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
};

// ─── Client singleton ─────────────────────────────────────────────────────────
//
// Next.js hot-reload in development creates a new module instance on every
// file change, which would open a new MongoClient on every reload and quickly
// exhaust the Atlas free-tier connection limit (500 connections).
//
// The fix: cache the client promise on the Node.js `global` object, which
// persists across hot-reloads. In production this is a no-op since the
// module is only ever loaded once per serverless function instance.

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * Returns the connected MongoClient.
 * Use this when you need direct access to the client (e.g. transactions).
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Returns the application database.
 * Recommended import for all API routes and server actions.
 *
 * @example
 * const db = await getDb();
 * const user = await db.collection("users").findOne({ email });
 */
export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
