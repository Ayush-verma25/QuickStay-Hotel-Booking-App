import express from "express";
import {
  checkAvailabilityAPI,
  createBooking,
  getHotelBookings,
  getUserBookings,
  stripePayment,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const bookingRoutes = express.Router();

bookingRoutes.post("/check-availability", checkAvailabilityAPI);
bookingRoutes.post("/book", protect, createBooking);
bookingRoutes.get("/user", protect, getUserBookings);
bookingRoutes.get("/hotel", protect, getHotelBookings);

bookingRoutes.post("/stripe-payment", protect, stripePayment);

export default bookingRoutes;
