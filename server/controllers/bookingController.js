import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import stripe from "stripe";

// Function to check Availability of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      $or: [
        {
          checkInDate: { $lte: new Date(checkOutDate) },
          checkOutDate: { $gte: new Date(checkInDate) },
        },
      ],
    });
    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

// API to check Availability of Room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;

    if (!room || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Room, check-in date, and check-out date are required",
      });
    }

    const isAvailable = await checkAvailability({
      room,
      checkInDate,
      checkOutDate,
    });

    res.json({ success: true, isAvailable });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// API to create a new Booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login to continue.",
      });
    }

    const user = req.user._id;

    if (!room || !checkInDate || !checkOutDate || !guests) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (room, checkInDate, checkOutDate, guests) are required",
      });
    }

    // Validate guests is a real positive number (parseInt silently returns NaN otherwise)
    const guestCount = parseInt(guests, 10);
    if (isNaN(guestCount) || guestCount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a valid positive number",
      });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    if (checkIn < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past",
      });
    }

    // Before Booking Check Availability
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: "Room is not available for the selected dates",
      });
    }

    // Get room data to calculate total price
    const roomData = await Room.findById(room).populate("hotel");

    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (!roomData.hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel data missing for this room",
      });
    }

    // Calculate total price based on nights
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const totalPrice = roomData.pricePerNight * nights;

    // Create booking (totelPrice matches the existing schema field name)
    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: guestCount,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totelPrice: totalPrice,
    });

    // IMPORTANT: the booking has already been created successfully above.
    // Email is a nice-to-have — it must NEVER cause the booking request to fail.
    // In production this is the #1 cause of "booking doesn't work" reports:
    // SMTP is blocked/misconfigured on the host, so sendMail throws, and
    // (with no try/catch) the whole request used to 500 even though the
    // booking already existed in the database.
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: req.user.email,
        subject: "Hotel Booking Confirmation",
        html: `
        <h2>Your booking Details</h2>
        <p>Dear ${req.user.username},</p>
        <p>Thank you for Your booking! Here are your booking details:</p>
        <ul>
        <li><strong>Booking ID:</strong> ${booking._id}</li>
        <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
        <li><strong>Location:</strong> ${roomData.hotel.address}</li>
        <li><strong>Date:</strong> ${booking.checkInDate.toLocaleDateString()}</li>
        <li><strong>Booking Amount:</strong> ${
          process.env.CURRENCY || "$"
        } ${booking.totelPrice} / night</li>
        </ul>
        <p>We look forward to welcome you!</p>
        <p>If you need to make any changes or cancel your booking, please contact us.</p>
        <p>Thank you for choosing our services!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      // Log it so you can see failures in production logs, but do not fail the booking.
      console.error(
        "Booking confirmation email failed to send:",
        emailError.message,
      );
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: booking,
    });
  } catch (error) {
    console.log("Booking creation error:", error);
    res.status(500).json({
      success: false,
      // Surface the real reason in logs; keep the client message generic but useful
      message: "Failed to create booking. Please try again.",
    });
  }
};

// API to Get All bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.log("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// API to Get Hotel bookings for hotel owner
// GET /api/bookings/hotel
export const getHotelBookings = async (req, res) => {
  try {
    // NOTE: this route uses req.auth() (Clerk-style) while the routes above use
    // req.user. If these two auth patterns aren't BOTH wired up correctly by
    // your middleware in production, this endpoint will silently 401 there
    // even though it works locally. Confirm your production auth middleware
    // actually populates req.auth() on this route before relying on this as-is.
    if (!req.auth || !req.auth() || !req.auth().userId) {
      return res.status(401).json({
        success: false,
        message: "Hotel owner not authenticated",
      });
    }

    const hotel = await Hotel.findOne({ owner: req.auth().userId });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "No hotel found for this owner",
      });
    }

    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + (booking.totelPrice || 0),
      0,
    );

    res.json({
      success: true,
      dashboardData: { totalBookings, totalRevenue, bookings },
    });
  } catch (error) {
    console.log("Get hotel bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel bookings",
    });
  }
};

export const stripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const roomData = await Room.findById(booking.room).populate("hotel");
    if (!roomData || !roomData.hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Room or hotel data not found" });
    }

    const totelPrice = booking.totelPrice;

    // Don't trust req.headers.origin in production — behind proxies/CDNs it can
    // be missing or wrong, which produces broken redirect URLs like
    // "undefined/loader/my-bookings". Prefer an explicit env var and fall back
    // to the origin header only if it's actually present.
    const baseUrl = process.env.CLIENT_URL || req.headers.origin;

    if (!baseUrl) {
      console.error(
        "stripePayment: no CLIENT_URL env var set and no Origin header present",
      );
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: missing client URL for redirect",
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("stripePayment: STRIPE_SECRET_KEY is not set");
      return res
        .status(500)
        .json({ success: false, message: "Payment configuration error" });
    }

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: Math.round(totelPrice * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${baseUrl}/loader/my-bookings`,
      cancel_url: `${baseUrl}/my-bookings`,
      metadata: {
        bookingId,
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe payment error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Payment Failed", error: error.message });
  }
};
