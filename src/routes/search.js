import express from "express";
import { getRooms } from "../services/crawler.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { checkin, checkout } = req.body;

    if (!checkin || !checkout) {
      return res.status(400).json({ error: "Missing checkin or checkout date." });
    }

    const rooms = await getRooms(checkin, checkout);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Failed to retrieve room data." });
  }
});

export default router;
