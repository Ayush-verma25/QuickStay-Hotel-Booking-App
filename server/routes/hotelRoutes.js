import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { registerHotel } from "../controllers/hotelController.js";

const hotelRoutes = express.Router();

hotelRoutes.post("/", protect, registerHotel);

export default hotelRoutes;
