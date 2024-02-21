import mongoose from "mongoose";
import AccountModel, { IAccount } from "../../models/account";
import mongoMemServer from "../../db";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("Account Model", () => {
  let db: MongoMemoryServer;
  beforeAll(async () => {
    // Spinning up the database
    db = await mongoMemServer();
    await mongoose.connect(db.getUri());
  });

  afterAll(async () => {
    // Disconnect from the MongoDB test database
    await mongoose.connection.close();
    await db.stop();
  });

  beforeEach(async () => {
    // Clear the accounts collection before each test
    await AccountModel.deleteMany({});
  });

  it("should create and save a new account successfully", async () => {
    const accountData = {
      id: "1",
      balance: 100,
    };

    const account = new AccountModel(accountData);
    const savedAccount = await account.save();

    expect(savedAccount._id).toBeDefined();
    expect(savedAccount.id).toBe(accountData.id);
    expect(savedAccount.balance).toBe(accountData.balance);
  });

  it("should fail to save an account with a duplicate id", async () => {
    const accountData = {
      id: "1",
      balance: 200,
    };

    const account1 = new AccountModel(accountData);
    await account1.save();

    const account2 = new AccountModel(accountData);
    let error: Error | null = null;
    try {
      await account2.save();
    } catch (err: any) {
      error = err as Error;
    }

    expect(error).toBeDefined();
    expect(error?.message).toBe('E11000 duplicate key error collection: test.accounts index: id_1 dup key: { id: "1" }');
  });

  it("Should update an account successfully", async () => {
    const accountData = {
      id: "1",
      balance: 100,
    };

    const account = new AccountModel(accountData);
    await account.save();

    const updatedAccount = await AccountModel.findOneAndUpdate({ id: accountData.id }, { balance: 200 }, { new: true });

    expect(updatedAccount).toBeDefined();
    expect(updatedAccount?.id).toBe(accountData.id);
    expect(updatedAccount?.balance).toBe(200);
  });

  it("Should fail to update an account that does not exist", async () => {
    const accountData = {
      id: "1",
      balance: 100,
    };

    const account = new AccountModel(accountData);
    await account.save();

    const updatedAccount = await AccountModel.findOneAndUpdate({ id: "2" }, { balance: 200 }, { new: true });

    expect(updatedAccount).toBeNull();
  });

  it("Should delete an account successfully", async () => {
    const accountData = {
      id: "1",
      balance: 100,
    };

    const account = new AccountModel(accountData);
    await account.save();

    const deletedAccount = await AccountModel.findOneAndDelete({ id: accountData.id });

    expect(deletedAccount).toBeDefined();
    expect(deletedAccount?.id).toBe(accountData.id);
    expect(deletedAccount?.balance).toBe(accountData.balance);
  });

  it("Should fail to delete an account that does not exist", async () => {
    const accountData = {
      id: "1",
      balance: 100,
    };

    const account = new AccountModel(accountData);
    await account.save();

    const deletedAccount = await AccountModel.findOneAndDelete({ id: "2" });

    expect(deletedAccount).toBeNull();
  });
});
