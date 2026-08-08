import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import stripe from "stripe";

// Function to check Availability of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    // Simplified - the $or with a single clause was redundant
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: new Date(checkOutDate) },
      checkOutDate: { $gte: new Date(checkInDate) },
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

    // Validate required fields
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

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login to continue.",
      });
    }

    const user = req.user._id;

    // Validate required fields
    if (!room || !checkInDate || !checkOutDate || !guests) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (room, checkInDate, checkOutDate, guests) are required",
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

    // FIX: previously only "today" had its time zeroed, so a checkInDate that
    // included a time component was compared unfairly against midnight.
    const checkInDateOnly = new Date(checkIn);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    if (checkInDateOnly < today) {
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

    // Calculate total price based on nights
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const totalPrice = roomData.pricePerNight * nights;

    console.log("Calculated total price:", totalPrice); // Debug log

    // NOTE: your Booking schema currently stores this field as "totelPrice"
    // (typo, but required by the existing schema). Writing to "totalPrice"
    // here will fail validation until the schema itself is renamed.
    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: parseInt(guests),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totelPrice: totalPrice,
      isPaid: false, // becomes true once the Stripe webhook confirms payment
      paymentMethod: "Pay At Hotel", // overwritten to "Stripe" on successful payment
    });

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
      <li><strong>Check-in:</strong> ${booking.checkInDate.toLocaleDateString()}</li>
      <li><strong>Check-out:</strong> ${booking.checkOutDate.toLocaleDateString()}</li>
      <li><strong>Total Amount:</strong> ${process.env.CURRENCY || "$"} ${
        booking.totelPrice
      }</li>
      </ul>
      <p>We look forward to welcome you!</p>
      <p>If you need to make any changes or cancel your booking, please contact us.</p>
      <p>Thank you for choosing our services!</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: booking,
    });
  } catch (error) {
    console.log("Booking creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking. Please try again.",
    });
  }
};

// API to Get All bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    // Check if user is authenticated
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
    // Check if user is authenticated (Clerk auth for hotel owners)
    if (!req.auth() || !req.auth().userId) {
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

    // Total Bookings
    const totalBookings = bookings.length;

    // NOTE: reading from "totelPrice" to match the existing schema field name
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totelPrice,
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

// API to create a Stripe Checkout session for a booking
// POST /api/bookings/stripe-payment
export const stripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // FIX: added authentication + ownership checks (previously anyone
    // could pay for/inspect any bookingId) and existence checks so the
    // handler doesn't throw when booking/roomData is null.
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated. Please login to continue.",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to pay for this booking",
      });
    }

    if (booking.isPaid) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid for",
      });
    }

    const roomData = await Room.findById(booking.room).populate("hotel");

    if (!roomData) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const totalPrice = booking.totelPrice; // schema field is spelled "totelPrice"
    const { origin } = req.headers;

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = [
      {
        price_data: {
          currency: (process.env.CURRENCY || "usd").toLowerCase(),
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      },
    ];

    // Create Checkout session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      metadata: {
        bookingId,
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.log("Stripe payment error:", error);
    res.status(500).json({ success: false, message: "Payment Failed" });
  }
};

// API/Webhook to receive Stripe payment confirmation and update the booking
// POST /api/bookings/stripe (must be mounted with express.raw({type: "application/json"}))
export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // req.body MUST be the raw, unparsed request body for signature
    // verification to succeed - see the route setup note below.
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.log("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { bookingId } = session.metadata || {};

        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentMethod: "Stripe",
          });
          console.log(`Booking ${bookingId} marked as paid`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        console.log(
          `Checkout session expired for booking ${session.metadata?.bookingId}`,
        );
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.log("Webhook handler error:", error.message);
    res.status(500).json({ received: false });
  }
};