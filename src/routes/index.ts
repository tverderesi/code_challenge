import { Router, Response, Request } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("API is working.");
});

export default router;
