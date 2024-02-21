import { MongoMemoryServer } from "mongodb-memory-server";
import AccountController from "../../controllers/accountController";
import AccountModel from "../../models/account";
import mongoMemServer from "../../db";
import mongoose from "mongoose";

describe("AccountController", () => {
  let con: MongoMemoryServer;

  const accountController = new AccountController();
  beforeAll(async () => {
    con = await mongoMemServer();
    await mongoose.connect(con.getUri());
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    await AccountModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await con.stop();
  });
  describe("reset", () => {
    it("should reset the database", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();
      const account2 = new AccountModel({
        id: "2",
        balance: 200,
      });
      await account2.save();
      const accounts = await AccountModel.find({});
      expect(accounts.length).toBe(2);

      const isDbReset = await accountController.reset();
      expect(isDbReset).toBe(true);
      const accountsAfterReset = await AccountModel.find({});
      expect(accountsAfterReset.length).toBe(0);
    });
  });

  describe("getBalance", () => {
    it("should get the balance of an account", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();

      const balance = await accountController.getBalance("1");
      expect(balance).toBe(100);
    });

    it("should return an error if the account does not exist", async () => {
      const balance = await accountController.getBalance("3");
      expect(balance).toEqual({ error: "Account does not exist", account: 0, ERR_CODE: "ACCOUNT_NOT_FOUND" });
    });
  });

  describe("deposit", () => {
    it("should deposit money into an account", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();
      await accountController.deposit({ id: "1", amount: 100 });
      const balance = await accountController.getBalance("1");
      expect(balance).toBe(200);
    });
  });

  describe("withdraw", () => {
    it("should withdraw money from an account", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();
      await accountController.withdraw({ id: "1", amount: 50 });
      const balance = await accountController.getBalance("1");
      expect(balance).toBe(50);
    });

    it("should return an error if the account does not exist", async () => {
      const balance = await accountController.withdraw({ id: "3", amount: 50 });
      expect(balance).toEqual({ error: "Account does not exist", account: 0, ERR_CODE: "ACCOUNT_NOT_FOUND" });
    });

    it("should return an error if the account has insufficient funds", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();
      const balance = await accountController.withdraw({ id: "1", amount: 150 });
      expect(balance).toEqual({ error: "Insufficient funds", account: 100, ERR_CODE: "INSUFFICIENT_FUNDS" });
    });
  });

  describe("transfer", () => {
    it("should transfer money from one account to another", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();
      const account2 = new AccountModel({
        id: "2",
        balance: 100,
      });
      await account2.save();
      await accountController.transfer({ origin: "1", destination: "2", amount: 50 });
      const balance1 = await accountController.getBalance("1");
      const balance2 = await accountController.getBalance("2");
      expect(balance1).toBe(50);
      expect(balance2).toBe(150);
    });
    it("should return an error if the origin account does not exist", async () => {
      const account1 = new AccountModel({
        id: "2",
        balance: 100,
      });
      await account1.save();
      const balance = await accountController.transfer({ origin: "1", destination: "2", amount: 50 });
      expect(balance).toEqual({ error: "Origin account does not exist.", account: 0, ERR_CODE: "ACCOUNT_NOT_FOUND" });
    });

    it("should return an error if the origin account has insufficient funds", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();
      const account2 = new AccountModel({
        id: "2",
        balance: 100,
      });
      await account2.save();
      const balance = await accountController.transfer({ origin: "1", destination: "2", amount: 150 });
      expect(balance).toEqual({ error: "Insufficient funds", account: 100, ERR_CODE: "INSUFFICIENT_FUNDS" });
    });
    it("should rollback the transaction if an error occurs when updating the destination account", async () => {
      const account1 = new AccountModel({
        id: "1",
        balance: 100,
      });
      await account1.save();
      const account2 = new AccountModel({
        id: "2",
        balance: 100,
      });
      await account2.save();

      //@ts-expect-error - Jest and mongoose don't play along well.
      jest.spyOn(AccountModel, "findOneAndUpdate").mockImplementation((cb) => {
        if (cb?.id === "2") {
          throw new Error("An error occurred while transferring funds");
        }
      });

      const balance = await accountController.transfer({ origin: "1", destination: "2", amount: 50 });
      expect(balance).toEqual({ error: "An error occurred while transferring funds", account: 0, ERR_CODE: "TRANSFER_ERROR" });
      const balance1 = await accountController.getBalance("1");
      const balance2 = await accountController.getBalance("2");
      expect(balance1).toBe(100);
      expect(balance2).toBe(100);

      const updatedAccount1 = await AccountModel.findOne({ id: "1" });
      expect(updatedAccount1?.balance).toBe(100);
    });
  });
});
