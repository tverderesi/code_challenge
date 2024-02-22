import { Router, Response, Request } from "express";
import AccountController from "../controllers/accountController";
const router = Router();
const accountController = new AccountController();

router.get("/", (req: Request, res: Response) => {
  res.send("API is working.");
});

router.post("/reset", async (req: Request, res: Response) => {
  const result = await accountController.reset();
  res.sendStatus(result.status);
});

router.get("/balance", async (req: Request, res: Response) => {
  const id = req.query.account_id as string;
  const result = await accountController.getBalance(id);

  typeof result?.body === "number"
    ? res.status(result.status).json(result.body)
    : res.status(result.status).json(result.body.balance);
});

router.post("/event", async (req: Request, res: Response) => {
  const { type, destination, amount, origin } = req.body;
  let result;
  switch (type) {
    case "deposit":
      result = await accountController.deposit({ destination, amount });
      break;
    case "withdraw":
      result = await accountController.withdraw({ origin, amount });
      break;
    case "transfer":
      result = await accountController.transfer({ origin, destination, amount });
      break;
    default:
      result = { body: "Invalid event type", status: 400 };
  }
  res.status(result.status).json(result.body);
});

export default router;
