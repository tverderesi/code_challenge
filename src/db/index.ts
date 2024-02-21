import { MongoMemoryServer } from "mongodb-memory-server";

export default async () => {
  const db = await MongoMemoryServer.create({
    instance: {
      dbName: "db",
    },
    binary: {
      version: "4.4.17",
    },
  });

  return db;
};
