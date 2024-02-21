import AccountModel from "../models/account";

class AccountController {
  /**
   * Reset the Database.
   * @returns - True if the database was reset.
   */

  public async reset() {
    await AccountModel.deleteMany({});
    return true;
  }

  /**
   * Gets the balance of a given account.
   * @param id - The account id.
   * @returns - The balance of the account.
   * @returns - 0 if the account does not exist.
   */
  public async getBalance(id: string) {
    const account = await AccountModel.findOne({ id });
    if (!account) {
      return { error: "Account does not exist", account: 0, ERR_CODE: "ACCOUNT_NOT_FOUND" };
    }
    return account?.balance;
  }

  /**
   * Deposit an amount to a given account.
   * @param id - The account id.
   * @param amount - The amount to deposit.
   * @returns - The updated account.
   */

  public async deposit({ id, amount }: { id: string; amount: number }) {
    const account = await AccountModel.findOneAndUpdate({ id }, { $inc: { balance: amount } }, { new: true });
    return account;
  }

  /**
   * Withdraw an amount from a given account.
   * @param id - The account id.
   * @param amount - The amount to withdraw.
   * @returns - The updated account.
   * @returns - An error if the account does not exist or if the account has insufficient funds.
   */

  public async withdraw({ id, amount }: { id: string; amount: number }) {
    const account = await AccountModel.findOne({ id });
    if (!account) {
      return { error: "Account does not exist", account: 0, ERR_CODE: "ACCOUNT_NOT_FOUND" };
    }
    if (account.balance < amount) {
      return { error: "Insufficient funds", account: account.balance, ERR_CODE: "INSUFFICIENT_FUNDS" };
    }
    const accountWithNewBalance = await AccountModel.findOneAndUpdate({ id }, { $inc: { balance: -amount } }, { new: true });
    return accountWithNewBalance;
  }

  public async rollback({ id, amount }: { id: string; amount: number }) {
    try {
      await AccountModel.findOneAndUpdate({ id }, { $inc: { balance: amount } }, { new: true });
    } catch (err) {
      console.error("Failed to rollback transaction", err);
    }
  }

  public async transfer({ origin, amount, destination }: { origin: string; destination: string; amount: number }) {
    const originAccount = await AccountModel.findOne({ id: origin });
    if (!originAccount) {
      return { error: "Origin account does not exist.", account: 0, ERR_CODE: "ACCOUNT_NOT_FOUND" };
    }
    if (originAccount.balance < amount) {
      return { error: "Insufficient funds", account: originAccount.balance, ERR_CODE: "INSUFFICIENT_FUNDS" };
    }
    try {
      const originAccountWithNewBalance = await AccountModel.findOneAndUpdate(
        { id: origin },
        { $inc: { balance: -amount } },
        { new: true }
      );
      try {
        const destinationAccountWithNewBalance = await AccountModel.findOneAndUpdate(
          { id: destination },
          { $inc: { balance: amount } },
          { new: true }
        );
        return { origin: originAccountWithNewBalance, destination: destinationAccountWithNewBalance };
      } catch (err) {
        await this.rollback({ id: origin, amount });
        return { error: "An error occurred while transferring funds", account: 0, ERR_CODE: "TRANSFER_ERROR" };
      }
    } catch (err) {
      return { error: "An error occurred while transferring funds", account: 0, ERR_CODE: "TRANSFER_ERROR" };
    }
  }
}

export default AccountController;
