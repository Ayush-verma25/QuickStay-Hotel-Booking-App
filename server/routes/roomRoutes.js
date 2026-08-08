import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRoom,
  getOwnerRooms,
  getRooms,
  toggleRoomAvailability,
} from "../controllers/roomController.js";

const roomRoutes = express.Router();

roomRoutes.post("/", upload.array("images", 4), protect, createRoom);
roomRoutes.get("/", getRooms);
roomRoutes.get("/owner", protect, getOwnerRooms);
roomRoutes.post("/toggle-availability", protect, toggleRoomAvailability);

export default roomRoutes;
