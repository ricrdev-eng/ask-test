import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import searchRouter from "./routes/search.js";
import chatRouter from "./routes/chat.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/search", searchRouter);
app.use("/chat", chatRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));