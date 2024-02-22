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
      const insertedAccounts = await AccountModel.insertMany([
        {
          id: "1",
          balance: 100,
        },
        {
          id: "2",
          balance: 200,
        },
      ]);

      expect(insertedAccounts.length).toBe(2);
      const response = await accountController.reset();
      expect(response).toStrictEqual({ body: "OK", status: 200 });
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

      const response = (await accountController.getBalance("1")) as { body: { id: string; balance: number }; status: number };

      expect(response.body.id).toBe("1");
      expect(response.body.balance).toBe(100);
      expect(response.status).toBe(200);
    });

    it("should return an error if the account does not exist", async () => {
      const balance = await accountController.getBalance("3");
      expect(balance).toStrictEqual({ error: "Account does not exist", body: 0, status: 404 });
    });
  });

  describe("deposit", () => {
    it("should deposit money into an existent account", async () => {
      await AccountModel.insertMany([
        {
          id: "1",
          balance: 100,
        },
      ]);
      const response = (await accountController.deposit({ destination: "1", amount: 100 })) as {
        body: { destination: { id: string; balance: number } };
        status: number;
      };

      expect(response.body.destination.id).toBe("1");
      expect(response.body.destination.balance).toBe(200);
      expect(response.status).toBe(201);
    });
    it("should create an account and deposit money into it if the account does not exist", async () => {
      const response = (await accountController.deposit({ destination: "2", amount: 100 })) as {
        body: { destination: { id: string; balance: number } };
        status: number;
      };
      expect(response.body.destination.id).toBe("2");
      expect(response.body.destination.balance).toBe(100);
      expect(response.status).toBe(201);
    });
  });

  describe("withdraw", () => {
    it("should withdraw money from an account", async () => {
      await AccountModel.insertMany([
        {
          id: "1",
          balance: 100,
        },
      ]);

      const response = (await accountController.withdraw({ origin: "1", amount: 50 })) as {
        body: { origin: { id: string; balance: number } };
        status: number;
      };

      expect(response.body.origin.id).toBe("1");
      expect(response.body.origin.balance).toBe(50);
      expect(response.status).toBe(201);
    });

    it("should return an error if the account does not exist", async () => {
      const response = await accountController.withdraw({ origin: "3", amount: 50 });
      expect(response.body).toBe(0);
      expect(response.status).toBe(404);
      expect(response.error).toBe("Account does not exist");
    });

    it("should return an error if the account has insufficient funds", async () => {
      await AccountModel.insertMany([
        {
          id: "1",
          balance: 100,
        },
      ]);

      const response = (await accountController.withdraw({ origin: "1", amount: 150 })) as {
        body: { origin: { id: string; balance: number } };
        status: number;
        error?: string;
      };

      expect(response.body.origin.id).toBe("1");
      expect(response.body.origin.balance).toBe(100);
      expect(response.status).toBe(400);
      expect(response.error).toBe("Insufficient funds");
    });
  });

  describe("transfer", () => {
    it("should transfer money from one account to another", async () => {
      await AccountModel.insertMany([
        {
          id: "1",
          balance: 100,
        },
        {
          id: "2",
          balance: 100,
        },
      ]);

      const response = (await accountController.transfer({ origin: "1", destination: "2", amount: 50 })) as {
        body: { origin: { id: string; balance: number }; destination: { id: string; balance: number } };
        status: number;
      };
      expect(response.body.origin.id).toBe("1");
      expect(response.body.origin.balance).toBe(50);
      expect(response.body.destination.id).toBe("2");
      expect(response.body.destination.balance).toBe(150);
      expect(response.status).toBe(201);
    });
    it("should return an error if the origin account does not exist", async () => {
      await AccountModel.insertMany([
        {
          id: "2",
          balance: 100,
        },
      ]);
      const response = await accountController.transfer({ origin: "1", destination: "2", amount: 50 });
      expect(response.body).toBe(0);
      expect(response.status).toBe(404);
      expect(response.error).toBe("Origin account does not exist.");
    });

    it("should return an error if the origin account has insufficient funds", async () => {
      await AccountModel.insertMany([
        {
          id: "1",
          balance: 100,
        },
        {
          id: "2",
          balance: 100,
        },
      ]);

      const response = (await accountController.transfer({ origin: "1", destination: "2", amount: 150 })) as {
        body: { origin: { id: string; balance: number } };
        status: number;
        error?: string;
      };
      expect(response.body.origin.id).toBe("1");
      expect(response.body.origin.balance).toBe(100);
      expect(response.status).toBe(400);
      expect(response.error).toBe("Insufficient funds");
    });

    it("should rollback the transaction if an error occurs when updating the destination account", async () => {
      await AccountModel.insertMany([
        {
          id: "1",
          balance: 100,
        },
        {
          id: "2",
          balance: 100,
        },
      ]);

      //@ts-expect-error - Jest and mongoose don't play along well.
      jest.spyOn(AccountModel, "findOneAndUpdate").mockImplementation((cb) => {
        if (cb?.id === "2") {
          throw new Error("An error occurred while transferring funds");
        }
      });

      const response = await accountController.transfer({ origin: "1", destination: "2", amount: 50 });
      expect(response.body).toBe(0);
      expect(response.status).toBe(500);
      expect(response.error).toBe("An error occurred while transferring funds");
    });
  });
});
