import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const srvUri = process.env.MONGODB_URI ?? "";
  const credMatch = srvUri.match(/mongodb\+srv:\/\/([^@]+)@/);

  if (!credMatch) {
    return NextResponse.json(
      { ok: false, error: "Could not parse credentials from MONGODB_URI" },
      { status: 500 },
    );
  }

  const credentials = credMatch[1];
  const dbName = process.env.MONGODB_DB ?? "diuscadi";

  const directUri =
    `mongodb://${credentials}@` +
    `ac-gwesgzy-shard-00-00.xvgxlmo.mongodb.net:27017,` +
    `ac-gwesgzy-shard-00-01.xvgxlmo.mongodb.net:27017,` +
    `ac-gwesgzy-shard-00-02.xvgxlmo.mongodb.net:27017` +
    `/${dbName}?ssl=true&authSource=admin&retryWrites=true`;

  const start = Date.now();
  let client: MongoClient | null = null;

  try {
    client = new MongoClient(directUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      family: 4,
    });
    await client.connect();
    await client.db(dbName).command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      method: "direct-hosts",
      latencyMs: Date.now() - start,
      directUri: directUri.replace(/:([^@]+)@/, ":<hidden>@"),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        method: "direct-hosts",
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 503 },
    );
  } finally {
    await client?.close();
  }
}
