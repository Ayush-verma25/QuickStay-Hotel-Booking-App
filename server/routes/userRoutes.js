import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserData,
  storeRecentSearchedCities,
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.get("/", protect, getUserData);
userRoutes.post("/store-recent-search", protect, storeRecentSearchedCities);

export default userRoutes;
