import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config();

async function startServer() {
  try {
    await connectDB();
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on PORT:${port}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

startServer();
