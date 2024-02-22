import { Response } from "express";
import AccountModel from "../models/account";

class AccountController {
  /**
   * Reset the Database.
   * @returns - A boolean indicating if the database was reset.
   */

  async reset() {
    await AccountModel.deleteMany({});
    return { body: "OK", status: 200 };
  }

  /**
   * Get the balance of a given account.
   * @param id - The account id.
   * @returns - The account balance.
   * @returns - An error if the account does not exist.
   */
  async getBalance(
    id: string
  ): Promise<{ body: number | { id: string; balance: number }; status: Response["statusCode"]; error?: string }> {
    const account = await AccountModel.findOne({ id });
    if (!account) {
      return { error: "Account does not exist", body: 0, status: 404 };
    }
    return { body: account.toObject(), status: 200 };
  }

  /**
   * Deposit an amount to a given account.
   * @param destination - The account id.
   * @param amount - The amount to deposit.
   * @returns - The updated account.
   */

  async deposit({
    destination,
    amount,
  }: {
    destination: string;
    amount: number;
  }): Promise<{ body: { destination: { id: string; balance: number } }; status: Response["statusCode"] }> {
    const account = await AccountModel.findOneAndUpdate(
      { id: destination },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );
    return { body: { destination: account.toObject() }, status: 201 };
  }

  /**
   * Withdraw an amount from a given account.
   * @param id - The account id.
   * @param amount - The amount to withdraw.
   * @returns - The updated account.
   * @returns - An error if the account does not exist or if the account has insufficient funds.
   */

  async withdraw({
    origin,
    amount,
  }: {
    origin: string;
    amount: number;
  }): Promise<{ body: { origin: { id: string; balance: number } } | number; status: Response["statusCode"]; error?: string }> {
    const account = await AccountModel.findOne({ id: origin });
    if (!account) {
      return { error: "Account does not exist", body: 0, status: 404 };
    }
    if (account?.balance < amount) {
      return { error: "Insufficient funds", body: { origin: account.toObject() }, status: 400 };
    }

    const updatedAccount = (
      await AccountModel.findOneAndUpdate({ id: origin }, { $inc: { balance: -amount } }, { new: true })
    )?.toObject();
    if (!updatedAccount) return { body: 0, status: 500, error: "An error occurred while withdrawing funds" };
    return { body: { origin: updatedAccount }, status: 201 };
  }

  private async rollback({
    id,
    amount,
  }: {
    id: string;
    amount: number;
  }): Promise<{ body: { id: string; balance: number } | number; error?: string; status: Response["statusCode"] }> {
    try {
      const rolledBackAccount = (await AccountModel.findOneAndUpdate({ id }, { $inc: { balance: amount } }, { new: true })) as {
        id: string;
        balance: number;
      };
      return { body: rolledBackAccount, status: 200 };
    } catch (err) {
      return { error: "An error occurred while rolling back the transaction", body: 0, status: 500 };
    }
  }

  async transfer({ origin, amount, destination }: { origin: string; destination: string; amount: number }): Promise<{
    body:
      | { origin: { id: string; balance: number }; destination: { id: string; balance: number } }
      | number
      | { origin: { id: string; balance: number } };
    error?: string;
    status: Response["statusCode"];
  }> {
    const originAccount = (await AccountModel.findOne({ id: origin }))?.toObject();
    if (!originAccount) {
      return { error: "Origin account does not exist.", body: 0, status: 404 };
    }
    if (originAccount.balance < amount) {
      return { error: "Insufficient funds", body: { origin: originAccount }, status: 400 };
    }
    try {
      const originAccountWithNewBalance = (
        await AccountModel.findOneAndUpdate({ id: origin }, { $inc: { balance: -amount } }, { new: true })
      )?.toObject();
      if (originAccountWithNewBalance) {
        try {
          const destinationAccountWithNewBalance = (
            await AccountModel.findOneAndUpdate({ id: destination }, { $inc: { balance: amount } }, { new: true, upsert: true })
          ).toObject();
          return { body: { origin: originAccountWithNewBalance, destination: destinationAccountWithNewBalance }, status: 201 };
        } catch (err) {
          await this.rollback({ id: origin, amount });
          return { error: "An error occurred while transferring funds", body: 0, status: 500 };
        }
      }
      return { body: 0, status: 500, error: "An error occurred while transferring funds" };
    } catch (err) {
      return { error: "An error occurred while transferring funds", body: 0, status: 500 };
    }
  }
}

export default AccountController;
