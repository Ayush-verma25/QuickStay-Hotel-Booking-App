🏨 Hotel Booking App — MERN Stack

A full-stack hotel booking platform built with the MERN stack, Clerk authentication, Stripe Checkout, Cloudinary image uploads, and Nodemailer email notifications.

The application supports two main user experiences:

Guests can discover hotels/rooms, filter listings, check availability, create bookings, and pay securely through Stripe.

Hotel owners can register their hotel, add rooms with images and amenities, manage room availability, and monitor bookings/revenue from an owner dashboard.

✨ Key Features

👤 Guest Features

Clerk-based user authentication

Browse available hotel rooms

Search/filter rooms by:

Destination/city

Room type

Price range

Sort rooms by:

Price: Low to High

Price: High to Low

Newest First

View detailed room information

Select check-in and check-out dates

Check room availability before booking

Select number of guests

Create hotel bookings

View personal booking history

Pay for unpaid bookings using Stripe Checkout

Receive booking confirmation emails

Store recently searched cities

🏢 Hotel Owner Features

Register a new hotel

Automatically switch the user role to hotelOwner

Add rooms to the registered hotel

Upload up to 4 room images

Store images through Cloudinary

Configure room type, price, and amenities

Enable/disable room availability

View hotel bookings

View total booking count

View total revenue

View recent booking/payment status

💳 Payment Integration

Stripe Checkout session creation

Booking-specific Stripe metadata

Stripe webhook support

Booking payment status update after successful payment

Ownership/authentication checks before creating a payment session

Prevents already-paid bookings from being paid again

☁️ External Services

Service

Purpose

MongoDB

Application database

Clerk

Authentication and user identity

Stripe

Online payments

Cloudinary

Room image storage

Nodemailer / SMTP

Booking email notifications

Vercel

Deployment configuration

🛠️ Tech Stack

Frontend

React 19

Vite

React Router

Tailwind CSS

Axios

Clerk React

React Hot Toast

Backend

Node.js

Express.js

MongoDB

Mongoose

Clerk Express

Stripe

Cloudinary

Multer

Nodemailer

Svix

Architecture

React + Vite Client
        │
        │ Axios / REST API
        ▼
Express + Node.js Server
        │
        ├── Clerk Authentication
        ├── Stripe Checkout / Webhooks
        ├── Cloudinary Image Uploads
        ├── Nodemailer
        │
        ▼
     MongoDB

📁 Project Structure

Hotel Booking App/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── hotelOwner/
│   │   ├── context/
│   │   ├── pages/
│   │   │   └── hotelOwner/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── server/
│   ├── configs/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   └── nodemailer.js
│   ├── controllers/
│   │   ├── bookingController.js
│   │   ├── clerkWebHooks.js
│   │   ├── hotelController.js
│   │   ├── roomController.js
│   │   ├── stripeWebhooks.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── Booking.js
│   │   ├── Hotel.js
│   │   ├── Room.js
│   │   └── User.js
│   ├── routes/
│   │   ├── bookingRoutes.js
│   │   ├── hotelRoutes.js
│   │   ├── roomRoutes.js
│   │   └── userRoutes.js
│   ├── server.js
│   └── package.json
│
└── README.md

node_modules should not be committed to GitHub. The uploaded project archive contains installed dependencies, but a clean repository should rely on package.json/lock files instead.

🔄 Application Flow

Guest Booking Flow

Login with Clerk
      ↓
Browse Rooms
      ↓
Select Room
      ↓
Choose Check-in / Check-out Dates
      ↓
Check Availability
      ↓
Create Booking
      ↓
Booking Stored in MongoDB
      ↓
Open "My Bookings"
      ↓
Pay Now
      ↓
Stripe Checkout
      ↓
Stripe Webhook
      ↓
Booking marked as Paid

Hotel Owner Flow

Login with Clerk
      ↓
Register Hotel
      ↓
User role → hotelOwner
      ↓
Owner Dashboard
      ↓
Add Room
      ↓
Upload Images → Cloudinary
      ↓
Room Stored in MongoDB
      ↓
Manage Availability
      ↓
Monitor Bookings & Revenue

🔐 Authentication & Authorization

The project uses Clerk for authentication.

The backend authentication middleware:

Reads the Clerk authenticated user ID.

Finds the corresponding user in MongoDB.

Attaches the database user to req.user.

Rejects unauthenticated requests with HTTP 401.

Example protected endpoints include:

POST /api/hotels
POST /api/rooms
GET  /api/rooms/owner
POST /api/rooms/toggle-availability
POST /api/bookings/book
GET  /api/bookings/user
GET  /api/bookings/hotel
POST /api/bookings/stripe-payment

Clerk webhooks synchronize user creation, updates, and deletion with the application's MongoDB User collection.

💳 Stripe Payment Flow

The application creates a Stripe Checkout Session from an existing booking.

Booking created
   ↓
isPaid = false
   ↓
User clicks "Pay Now"
   ↓
Backend validates booking ownership
   ↓
Stripe Checkout Session created
   ↓
User completes payment on Stripe
   ↓
Stripe sends webhook
   ↓
Booking is updated:
isPaid = true
paymentMethod = "Stripe"

The Checkout Session stores the booking ID as metadata so the backend can identify the booking after payment.

📡 API Endpoints

User APIs

Method

Endpoint

Description

Auth

GET

/api/user/

Get current user data/role

✅

POST

/api/user/store-recent-search

Store recent searched city

✅

Hotel APIs

Method

Endpoint

Description

Auth

POST

/api/hotels/

Register a hotel

✅

Room APIs

Method

Endpoint

Description

Auth

GET

/api/rooms/

Get available rooms

❌

POST

/api/rooms/

Create a room with images

✅

GET

/api/rooms/owner

Get owner's rooms

✅

POST

/api/rooms/toggle-availability

Toggle room availability

✅

Booking APIs

Method

Endpoint

Description

Auth

POST

/api/bookings/check-availability

Check room availability

❌

POST

/api/bookings/book

Create booking

✅

GET

/api/bookings/user

Get current user's bookings

✅

GET

/api/bookings/hotel

Get owner's hotel bookings

✅

POST

/api/bookings/stripe-payment

Create Stripe Checkout Session

✅

Webhooks

POST /api/clerk
POST /api/stripe

/api/clerk handles Clerk user lifecycle webhooks.

/api/stripe handles Stripe payment webhooks.

🗃️ MongoDB Data Models

User

Stores:

Clerk user ID

Username

Email

Profile image

Role

Recently searched cities

Roles:

user
hotelOwner

Hotel

Stores:

Hotel name

Address

Contact

City

Owner

Room

Stores:

Hotel reference

Room type

Price per night

Amenities

Cloudinary image URLs

Availability status

Booking

Stores:

User

Room

Hotel

Check-in date

Check-out date

Number of guests

Total price

Booking status

Payment method

Payment status

⚙️ Environment Variables

Client .env

VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BACKEND_URL=http://localhost:5000
VITE_CURRENCY=$

Server .env

MONGODB_URL=your_mongodb_connection_string

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SENDER_EMAIL=your_sender_email
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

Never commit real API keys, database credentials, webhook secrets, or SMTP passwords to GitHub.

🚀 Local Development Setup

1. Clone the repository

git clone https://github.com/your-username/hotel-booking-app.git
cd hotel-booking-app

2. Install frontend dependencies

cd client
npm install

3. Configure client environment

Create:

client/.env

and add the required frontend variables.

4. Install backend dependencies

cd ../server
npm install

5. Configure server environment

Create:

server/.env

and add MongoDB, Clerk, Cloudinary, SMTP, and Stripe credentials.

6. Start the backend

cd server
npm run server

The backend defaults to:

http://localhost:5000

7. Start the frontend

Open another terminal:

cd client
npm run dev

Vite will provide the local frontend URL.

🔔 Stripe Webhook Configuration

For local development, configure Stripe to send webhook events to:

http://localhost:5000/api/stripe

The backend expects the Stripe webhook route to receive the raw JSON request body so that Stripe signature verification can work correctly.

Set the webhook signing secret in:

STRIPE_WEBHOOK_SECRET=your_webhook_secret

Use Stripe test mode while developing.

📧 Email Notifications

After a booking is created, the backend uses Nodemailer to send a booking confirmation email containing information such as:

Booking ID

Hotel name

Location

Check-in date

Check-out date

Total booking amount

SMTP configuration is controlled through the server environment variables.

🖼️ Image Uploads

Hotel owners can upload up to four images when creating a room.

The upload flow is:

React FormData
     ↓
Multer
     ↓
Cloudinary
     ↓
Secure Image URLs
     ↓
MongoDB Room Document

Only the resulting image URLs are stored in MongoDB.

📊 Owner Dashboard

The hotel owner dashboard provides:

Total bookings

Total revenue

Recent bookings

Guest names

Room information

Payment status

Owners can also manage room availability from the Room Listings section.

🧪 Recommended Testing Checklist

Before deploying, test the following:

Authentication

New Clerk user is synchronized to MongoDB

Login/logout works

Protected API requests reject unauthenticated users

Hotel owner role is applied after hotel registration

Hotel Management

Hotel registration works

Duplicate hotel registration is rejected

Room creation works

Image uploads work

Room availability toggle works

Booking

Invalid dates are rejected

Past check-in dates are rejected

Overlapping bookings are rejected

Booking total is calculated correctly

User can view their bookings

Payments

Stripe Checkout session is created

User cannot pay for another user's booking

Already-paid booking cannot be paid again

Stripe webhook signature is verified

Successful payment updates isPaid

Email

Booking confirmation email is sent

SMTP configuration works

Email failures are handled appropriately

🔎 Code Review Notes & Recommended Improvements

The current implementation is functional, but there are a few areas worth improving before presenting the project as production-ready.

1. Rename totelPrice

The booking model currently uses:

totelPrice

This should be renamed to:

totalPrice

and updated consistently across controllers and frontend components.

2. Consolidate Stripe webhook implementations

The project currently contains Stripe webhook logic in both:

server/controllers/bookingController.js
server/controllers/stripeWebhooks.js

It would be cleaner to maintain a single webhook implementation.

Also standardize on one Stripe event flow, preferably checkout.session.completed when using Checkout Sessions.

3. Strengthen authorization

Some owner-specific endpoints rely on the authenticated Clerk user but do not consistently enforce the user's database role.

Recommended approach:

authenticate user
      ↓
verify role === "hotelOwner"
      ↓
verify resource belongs to current owner
      ↓
perform operation

4. Prevent booking race conditions

Availability is checked before creating a booking. Two requests arriving at almost the same time could theoretically both pass the availability check.

For a production booking system, consider stronger concurrency/locking strategies and appropriate database indexes.

5. Validate request payloads

Add schema validation using a library such as Zod or Joi for:

Hotel registration

Room creation

Booking creation

Payment requests

This improves API reliability and security.

6. Improve error handling

Use a centralized Express error-handling middleware instead of repeating similar try/catch response patterns throughout controllers.

7. Add rate limiting

Public endpoints such as availability checks should be protected with rate limiting in a production deployment.

8. Improve database references

The current models store several references as String. If MongoDB ObjectIds are used for those relationships, using:

type: mongoose.Schema.Types.ObjectId,
ref: "ModelName"

would make the data model more idiomatic and improve relationship handling.

🌐 Deployment

The repository already includes Vercel configuration files for both client and server.

Typical deployment architecture:

                ┌──────────────────┐
                │     Vercel       │
                │ React Frontend   │
                └────────┬─────────┘
                         │
                         │ REST API
                         ▼
                ┌──────────────────┐
                │     Vercel       │
                │ Node/Express API │
                └────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      MongoDB         Stripe       Cloudinary
          │
          ▼
       User/Hotel/
       Room/Booking

For production deployment, configure the frontend backend URL and all server-side secrets through the hosting provider's environment-variable settings.

🔒 Security Checklist

Keep .env files out of Git

Never expose STRIPE_SECRET_KEY

Never expose CLERK_SECRET_KEY

Never expose CLOUDINARY_API_SECRET

Never expose SMTP passwords

Verify Clerk webhook signatures

Verify Stripe webhook signatures

Validate authenticated ownership before payment operations

Validate uploaded files

Add rate limiting for public APIs

Use HTTPS in production

💡 Resume / Portfolio Description

You can describe this project on your resume as:

Hotel Booking Platform — MERN StackDeveloped a full-stack hotel booking platform using React, Node.js, Express.js, and MongoDB with Clerk authentication, Stripe Checkout payments, Cloudinary image management, and Nodemailer email notifications. Implemented hotel-owner registration, room management, availability checking, booking workflows, payment status synchronization through Stripe webhooks, and an owner dashboard for booking and revenue tracking.

Suggested Resume Keywords

MERN Stack
React.js
Node.js
Express.js
MongoDB
Mongoose
REST APIs
Clerk Authentication
Stripe Checkout
Stripe Webhooks
Cloudinary
Nodemailer
Multer
JWT / Authentication Concepts
Role-Based Access
Hotel Booking System
Payment Gateway Integration
API Integration
Responsive UI
Vite
Tailwind CSS
CRUD Operations
Database Design
Third-Party API Integration

👨‍💻 Author

Ayush Verma

MERN Stack / Full Stack Developer

📄 License

This project is licensed under the MIT License.
