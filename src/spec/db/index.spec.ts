import { MongoClient } from "mongodb";
import mongoMemServer from "../../db";
import type { MongoMemoryServer } from "mongodb-memory-server";

describe("Single MongoMemoryServer", () => {
  let con: MongoClient;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await mongoMemServer();
    con = await MongoClient.connect(mongoServer.getUri(), {});
  });

  afterAll(async () => {
    if (con) {
      await con.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("should successfully set & get information from the database", async () => {
    const db = con.db(mongoServer.instanceInfo!.dbName);

    expect(db).toBeDefined();
    const col = db.collection("account");
    const result = await col.insertMany([
      { id: 1, ammount: 100 },
      { id: 2, ammount: 200 },
    ]);
    expect(result.insertedCount).toStrictEqual(2);
    expect(await col.countDocuments({})).toBe(2);
  });

  it("should successfully retrieve informatuion details from the database", async () => {
    const db = con.db(mongoServer.instanceInfo!.dbName);

    expect(db).toBeDefined();
    const col = db.collection("account");
    const result = await col.find({}).toArray();
    expect(result.length).toStrictEqual(2);
    expect(result[0].id).toBe(1);
    expect(result[0].ammount).toBe(100);
    expect(result[1].id).toBe(2);
    expect(result[1].ammount).toBe(200);
  });

  it("should successfully delete information from the database", async () => {
    const db = con.db(mongoServer.instanceInfo!.dbName);

    expect(db).toBeDefined();
    const col = db.collection("account");
    const result = await col.deleteMany({});
    expect(result.deletedCount).toStrictEqual(2);
    expect(await col.countDocuments({})).toBe(0);
  });
});
