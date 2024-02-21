import express from "express";
import router from "./routes";
import mongoMemServer from "./db";
import mongoose from "mongoose";
const app = express();

app.use(router);

(async () => {
  // Spinning up the database
  const db = await mongoMemServer();
  console.log("Database is up");

  //Connecting the database to mongoose
  const mongooseDb = await mongoose.connect(db.getUri());
  console.log("Database is connected");

  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });

  // Handling the database shutdown
  process.on("SIGINT", async () => {
    console.log("Gracefully shutting down...");

    await mongooseDb.disconnect();
    await db.stop();

    process.exit(0);
  });
})();
