# 🏨 QuickStay – Hotel Booking App

A full-stack **MERN** hotel booking platform where guests can discover hotel rooms, check live availability, book a stay and pay online, while hotel owners can register their property, publish rooms and track bookings and revenue from a dedicated dashboard.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture](#-architecture)
5. [Project Structure](#-project-structure)
6. [Data Models](#-data-models)
7. [API Reference](#-api-reference)
8. [Frontend Routes](#-frontend-routes)
9. [Key Workflows](#-key-workflows)
10. [Getting Started](#-getting-started)
11. [Environment Variables](#-environment-variables)
12. [Setting Up Webhooks](#-setting-up-webhooks)
13. [Deployment](#-deployment)
14. [Roadmap & Known Limitations](#-roadmap--known-limitations)
15. [Contributing](#-contributing)
16. [License](#-license)
17. [Author](#-author)

---

## 📖 Overview

QuickStay is a two-sided marketplace:

- **Guests** browse rooms across cities, filter and sort them, check whether a room is free for their dates, book it, and pay securely through Stripe Checkout (or leave the booking unpaid and pay later from *My Bookings*).
- **Hotel owners** sign in with the same account, register their hotel with one click, upload room photos, toggle room availability, and see total bookings and revenue on their dashboard.

The repository is a monorepo with two independent apps:

| Folder    | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `client/` | React 19 + Vite single-page application (UI)                   |
| `server/` | Node.js + Express 5 REST API with MongoDB, Stripe and Clerk    |

---

## ✨ Features

### 👤 For Guests
- 🔐 **Authentication** with Clerk (sign-up, sign-in, profile menu) – no custom password handling.
- 🔎 **Destination search** from the hero section, with a city auto-suggest list.
- 🏙️ **Recommended hotels** on the home page, based on your last 3 searched cities (stored per user).
- 🛏️ **Browse all rooms** with filters (room type, price range) and sorting (price low→high, high→low, newest first).
- 📸 **Room details page** with an image gallery, amenities, host info and a booking form.
- 📅 **Live availability check** – prevents double-booking by detecting overlapping reservations.
- 🧾 **Booking creation** with server-side validation (dates, guests, past dates) and automatic total-price calculation.
- 📧 **Email confirmation** sent through SMTP (Brevo) after each booking.
- 💳 **Online payment** via Stripe Checkout, with payment status updated by a signed webhook.
- 📋 **My Bookings** page showing every reservation with a Paid / Unpaid badge and a *Pay Now* button.

### 🏢 For Hotel Owners
- 🏨 **"List Your Hotel"** registration form (name, phone, address, city) – promotes the user to the `hotelOwner` role.
- 📊 **Dashboard** with total bookings, total revenue and a recent-bookings table (guest, room, amount, payment status).
- ➕ **Add Room** – room type, price per night, amenities and up to **4 images** uploaded to Cloudinary.
- 📃 **Room listings** with a one-click availability toggle.
- 🛡️ **Protected owner area** – non-owners are redirected away from `/owner`.

### ⚙️ Platform
- 🔄 **Clerk → MongoDB user sync** through verified (Svix) webhooks for `user.created`, `user.updated` and `user.deleted`.
- 🔒 **Signed Stripe webhooks** for trustworthy payment confirmation.
- 📱 **Responsive UI** built with Tailwind CSS, including a mobile slide-in menu.
- 🔔 **Toast notifications** for user feedback.
- 🚀 **Vercel-ready** configuration for both client and server.

---

## 🧰 Tech Stack

| Layer            | Technology                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| **Frontend**     | React 19, Vite 7, React Router 7, Tailwind CSS 4, Axios, React Hot Toast   |
| **Backend**      | Node.js, Express 5, Mongoose 8, Multer, CORS, dotenv                       |
| **Database**     | MongoDB (database name: `hotel-booking`)                                   |
| **Auth**         | [Clerk](https://clerk.com) (`@clerk/clerk-react`, `@clerk/express`) + Svix for webhook verification |
| **Payments**     | [Stripe](https://stripe.com) Checkout + webhooks                           |
| **Media storage**| [Cloudinary](https://cloudinary.com)                                       |
| **Email**        | Nodemailer via [Brevo](https://www.brevo.com) SMTP relay                   |
| **Tooling**      | ESLint 9, Nodemon, Yarn                                                    |
| **Hosting**      | Vercel (client and server)                                                 |

---

## 🏛️ Architecture

```mermaid
flowchart LR
    A["React 19 + Vite SPA"] -->|"REST + Bearer token"| B["Express 5 API"]
    A -->|"Sign-in / sign-up UI"| C["Clerk"]
    B -->|"Verify session"| C
    C -->|"user.* webhooks"| B
    B --> D[("MongoDB (Mongoose)")]
    B -->|"Upload room images"| E["Cloudinary"]
    B -->|"Create Checkout session"| F["Stripe"]
    F -->|"payment_intent.succeeded webhook"| B
    B -->|"Booking confirmation email"| G["Brevo SMTP"]
```

**How the pieces fit together**

1. The React app wraps everything in `ClerkProvider` → `BrowserRouter` → `AppProvider` (a global React Context).
2. `AppProvider` sets the Axios base URL, loads all rooms, and, once a user is signed in, calls `GET /api/user` to learn their role (`user` / `hotelOwner`) and recent searches.
3. Every protected request carries a Clerk session token in the `Authorization: Bearer <token>` header. The `protect` middleware reads the Clerk user ID, looks the user up in MongoDB and attaches it to `req.user`.
4. Users are **created in MongoDB by the Clerk webhook**, not by the API itself (see [Setting Up Webhooks](#-setting-up-webhooks)).

---

## 📂 Project Structure

```
QuickStay-Hotel-Booking-App/
├── client/                         # React + Vite frontend
│   ├── public/                     # Static files (favicon)
│   ├── src/
│   │   ├── assets/                 # Images, SVG icons and assets.js (icons, cities, offers, testimonials)
│   │   ├── components/
│   │   │   ├── hotelOwner/         # Owner-area Navbar & Sidebar
│   │   │   ├── ExclusiveOffers.jsx
│   │   │   ├── FeaturedDestination.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx            # Search form
│   │   │   ├── HotelCard.jsx
│   │   │   ├── HotelReg.jsx        # "Register your hotel" modal
│   │   │   ├── Loader.jsx          # Post-payment redirect spinner
│   │   │   ├── Navbar.jsx
│   │   │   ├── NewsLetter.jsx
│   │   │   ├── RecommendedHotels.jsx
│   │   │   ├── StarRating.jsx
│   │   │   ├── Testimonial.jsx
│   │   │   └── Title.jsx
│   │   ├── context/AppContext.jsx  # Global state: user role, rooms, searched cities, axios, currency
│   │   ├── pages/
│   │   │   ├── hotelOwner/         # Layout, Dashboard, AddRoom, ListRoom
│   │   │   ├── AllRooms.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   └── RoomDetails.jsx
│   │   ├── App.jsx                 # Routes
│   │   ├── index.css               # Tailwind import, theme colours, fonts
│   │   └── main.jsx                # Providers (Clerk, Router, AppContext)
│   ├── vercel.json                 # SPA rewrite rule
│   ├── vite.config.js
│   └── package.json
│
└── server/                         # Express REST API
    ├── configs/
    │   ├── cloudinary.js           # Cloudinary SDK setup
    │   ├── db.js                   # MongoDB connection
    │   └── nodemailer.js           # Brevo SMTP transporter
    ├── controllers/
    │   ├── bookingController.js    # Availability, create booking, list bookings, Stripe payment session
    │   ├── clerkWebHooks.js        # Syncs Clerk users to MongoDB
    │   ├── hotelController.js      # Register hotel
    │   ├── roomController.js       # Create / list rooms, toggle availability
    │   ├── stripeWebhooks.js       # Marks bookings as paid (the handler mounted in server.js)
    │   └── userController.js       # User role & recent searches
    ├── middleware/
    │   ├── authMiddleware.js       # `protect` – Clerk auth + DB user lookup
    │   └── uploadMiddleware.js     # Multer (temporary disk storage)
    ├── models/                     # Booking, Hotel, Room, User
    ├── routes/                     # user, hotel, room, booking routers
    ├── server.js                   # App entry point
    ├── vercel.json                 # Vercel serverless config
    └── package.json
```

---

## 🗄️ Data Models

All collections live in the `hotel-booking` database and use Mongoose timestamps (`createdAt`, `updatedAt`).

> **Note:** relationships are stored as **string IDs** (`ref` to the related model). A user's `_id` is the **Clerk user ID**, not a MongoDB `ObjectId`.

### `User`
| Field                  | Type       | Notes                                         |
| ---------------------- | ---------- | --------------------------------------------- |
| `_id`                  | String     | Clerk user ID                                 |
| `username`             | String     | First + last name from Clerk                  |
| `email`                | String     | Primary email from Clerk                      |
| `image`                | String     | Profile image URL                             |
| `role`                 | String     | `"user"` (default) or `"hotelOwner"`          |
| `recentSearchedCities` | [String]   | Last 3 searched cities                        |

### `Hotel`
| Field     | Type   | Notes                           |
| --------- | ------ | ------------------------------- |
| `name`    | String | Hotel name                      |
| `address` | String | Street address                  |
| `contact` | String | Phone number                    |
| `city`    | String | One of the supported cities     |
| `owner`   | String | Ref → `User` (one hotel per owner) |

### `Room`
| Field          | Type     | Notes                                          |
| -------------- | -------- | ---------------------------------------------- |
| `hotel`        | String   | Ref → `Hotel`                                  |
| `roomType`     | String   | Single Bed, Double Bed, Luxury Room, Family Suite |
| `pricePerNight`| Number   |                                                |
| `amenities`    | Array    | e.g. Free WiFi, Free Breakfast, Room Service, Mountain View, Pool Access |
| `images`       | [String] | Cloudinary secure URLs (max 4)                 |
| `isAvailable`  | Boolean  | Default `true`; owner can toggle               |

### `Booking`
| Field          | Type    | Notes                                                    |
| -------------- | ------- | -------------------------------------------------------- |
| `user`         | String  | Ref → `User`                                             |
| `room`         | String  | Ref → `Room`                                             |
| `hotel`        | String  | Ref → `Hotel`                                            |
| `checkInDate`  | Date    |                                                          |
| `checkOutDate` | Date    |                                                          |
| `totelPrice`   | Number  | Nights × `pricePerNight` (field name is spelled `totelPrice` in the schema) |
| `guests`       | Number  |                                                          |
| `status`       | String  | `pending` (default), `confirmed`, `cancelled`            |
| `paymentMethod`| String  | `"Pay At Hotel"` initially → `"Stripe"` after payment    |
| `isPaid`       | Boolean | Set to `true` by the Stripe webhook                      |

---

## 🔌 API Reference

**Base URL (local):** `http://localhost:5000`

Protected endpoints require the header:

```
Authorization: Bearer <Clerk session token>
```

### Health
| Method | Endpoint | Auth | Description          |
| ------ | -------- | ---- | -------------------- |
| GET    | `/`      | –    | Returns "API is Working Fine." |

### Users — `/api/user`
| Method | Endpoint                         | Auth | Description                                              |
| ------ | -------------------------------- | ---- | -------------------------------------------------------- |
| GET    | `/api/user`                      | ✅   | Returns the user's `role` and `recentSearchedCities`     |
| POST   | `/api/user/store-recent-search`  | ✅   | Body: `{ recentSearchedCity }` – keeps only the latest 3 |

### Hotels — `/api/hotels`
| Method | Endpoint       | Auth | Description                                                                  |
| ------ | -------------- | ---- | ---------------------------------------------------------------------------- |
| POST   | `/api/hotels`  | ✅   | Body: `{ name, address, contact, city }` – registers a hotel and sets role to `hotelOwner` |

### Rooms — `/api/rooms`
| Method | Endpoint                          | Auth | Description                                                                                  |
| ------ | --------------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| GET    | `/api/rooms`                      | –    | All rooms where `isAvailable` is true (hotel + owner image populated), newest first          |
| POST   | `/api/rooms`                      | ✅   | `multipart/form-data`: `roomType`, `pricePerNight`, `amenities` (JSON string), `images` (up to 4 files) |
| GET    | `/api/rooms/owner`                | ✅   | Rooms belonging to the signed-in owner's hotel                                               |
| POST   | `/api/rooms/toggle-availability`  | ✅   | Body: `{ roomId }` – flips `isAvailable`                                                     |

### Bookings — `/api/bookings`
| Method | Endpoint                          | Auth | Description                                                                                  |
| ------ | --------------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| POST   | `/api/bookings/check-availability`| –    | Body: `{ room, checkInDate, checkOutDate }` → `{ success, isAvailable }`                     |
| POST   | `/api/bookings/book`              | ✅   | Body: `{ room, checkInDate, checkOutDate, guests }` – validates, prices, saves and emails the guest |
| GET    | `/api/bookings/user`              | ✅   | The signed-in user's bookings (room + hotel populated), newest first                         |
| GET    | `/api/bookings/hotel`             | ✅   | Owner dashboard data: `{ totalBookings, totalRevenue, bookings }`                            |
| POST   | `/api/bookings/stripe-payment`    | ✅   | Body: `{ bookingId }` – creates a Stripe Checkout session and returns `{ url }`              |

### Webhooks
| Method | Endpoint       | Source | Events handled                                      |
| ------ | -------------- | ------ | --------------------------------------------------- |
| POST   | `/api/clerk`   | Clerk (Svix-signed) | `user.created`, `user.updated`, `user.deleted` |
| POST   | `/api/stripe`  | Stripe (signature-verified, raw body) | `payment_intent.succeeded` |

### Typical response shape
```json
{ "success": true, "message": "Booking created successfully", "booking": { } }
```
Errors return `{ "success": false, "message": "..." }` with an appropriate HTTP status (400, 401, 403, 404, 409, 500).

---

## 🧭 Frontend Routes

| Path                  | Component        | Access          | Description                                         |
| --------------------- | ---------------- | --------------- | --------------------------------------------------- |
| `/`                   | `Home`           | Public          | Hero search, recommended hotels, featured destinations, offers, testimonials, newsletter |
| `/rooms`              | `AllRooms`       | Public          | Room listing with filters, sorting and `?destination=` search |
| `/rooms/:id`          | `RoomDetails`    | Public (login required to book) | Gallery, amenities, availability check and booking form |
| `/my-bookings`        | `MyBookings`     | Signed-in users | Booking history and *Pay Now*                       |
| `/loader/:nexUrl`     | `Loader`         | –               | Spinner shown after Stripe checkout, then redirects to `/:nexUrl` after ~8 s |
| `/owner`              | `Layout` → `Dashboard` | Hotel owners | Stats and recent bookings                     |
| `/owner/add-room`     | `AddRoom`        | Hotel owners    | Create a room with images and amenities             |
| `/owner/list-room`    | `ListRoom`       | Hotel owners    | Manage rooms and availability                       |

---

## 🔄 Key Workflows

### 1. Authentication & user sync
1. The user signs up or signs in with the Clerk modal.
2. Clerk sends a `user.created` webhook to `POST /api/clerk`; the server verifies the Svix signature and inserts the user into MongoDB (using the Clerk ID as `_id`).
3. From then on, the `protect` middleware can resolve `req.user` for every authenticated request.

### 2. Becoming a hotel owner
1. A signed-in user clicks **List Your Hotel** and submits the registration form.
2. `POST /api/hotels` creates the `Hotel` (one per owner) and updates the user's role to `hotelOwner`.
3. The navbar button changes to **Dashboard** and `/owner` becomes accessible.

### 3. Booking & payment

```mermaid
sequenceDiagram
    actor Guest
    participant UI as React Client
    participant API as Express API
    participant DB as MongoDB
    participant Stripe

    Guest->>UI: Choose dates & guests, click "Check Availability"
    UI->>API: POST /api/bookings/check-availability
    API->>DB: Find overlapping bookings for the room
    API-->>UI: isAvailable true/false

    Guest->>UI: Click "Book Now"
    UI->>API: POST /api/bookings/book (Bearer token)
    API->>DB: Re-check availability, calculate price, save booking (isPaid=false)
    API-->>Guest: Confirmation email
    API-->>UI: Booking created → redirect to /my-bookings

    Guest->>UI: Click "Pay Now"
    UI->>API: POST /api/bookings/stripe-payment
    API->>Stripe: Create Checkout session (metadata.bookingId)
    API-->>UI: Checkout URL
    UI->>Stripe: Redirect guest to Stripe
    Stripe-->>API: Webhook payment_intent.succeeded
    API->>DB: isPaid = true, paymentMethod = "Stripe"
    Stripe-->>UI: Redirect to /loader/my-bookings → /my-bookings
```

**Availability rule:** a room is unavailable if any existing booking satisfies `existing.checkIn <= requested.checkOut` **and** `existing.checkOut >= requested.checkIn`.

**Price rule:** `nights = ceil((checkOut − checkIn) / 1 day)`, `total = nights × pricePerNight`.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20.19+ (required by Vite 7) and **Yarn** (the repo ships `yarn.lock` files; npm also works)
- A **MongoDB** database – local or [MongoDB Atlas](https://www.mongodb.com/atlas)
- Free accounts for: [Clerk](https://clerk.com), [Cloudinary](https://cloudinary.com), [Stripe](https://stripe.com) (test mode) and [Brevo](https://www.brevo.com) (SMTP)

### 1. Clone the repository
```bash
git clone https://github.com/Ayush-verma25/QuickStay-Hotel-Booking-App.git
cd QuickStay-Hotel-Booking-App
```

### 2. Set up the backend
```bash
cd server
yarn install          # or: npm install
```
Create `server/.env` (see [Environment Variables](#-environment-variables)), then start the API:
```bash
yarn server           # development with nodemon
# or
yarn start            # production (node server.js)
```
The API runs on **http://localhost:5000** by default.

### 3. Set up the frontend
Open a second terminal:
```bash
cd client
yarn install          # or: npm install
```
Create `client/.env` and start Vite:
```bash
yarn dev
```
The app runs on **http://localhost:5173**.

### 4. Configure the webhooks
Without the Clerk webhook, newly signed-up users will not exist in MongoDB and authenticated requests will fail with *"User not found"*. Follow [Setting Up Webhooks](#-setting-up-webhooks).

### Available scripts

| Where     | Command          | Purpose                          |
| --------- | ---------------- | -------------------------------- |
| `server/` | `yarn server`    | Start API with auto-reload (nodemon) |
| `server/` | `yarn start`     | Start API with Node              |
| `client/` | `yarn dev`       | Start Vite dev server            |
| `client/` | `yarn build`     | Production build into `dist/`    |
| `client/` | `yarn preview`   | Preview the production build     |
| `client/` | `yarn lint`      | Run ESLint                       |

---

## 🔐 Environment Variables

> ⚠️ Never commit real secrets. Both `.env` files are already listed in `.gitignore`.

### `server/.env`

| Variable                  | Required | Description                                                                 |
| ------------------------- | :------: | --------------------------------------------------------------------------- |
| `PORT`                    | No       | API port (defaults to `5000`)                                               |
| `MONGODB_URL`             | ✅       | MongoDB connection string **without** a database name or trailing slash – the app appends `/hotel-booking` itself. Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net` |
| `CLERK_PUBLISHABLE_KEY`   | ✅       | Clerk publishable key                                                       |
| `CLERK_SECRET_KEY`        | ✅       | Clerk secret key                                                            |
| `CLERK_WEBHOOK_SECRET`    | ✅       | Signing secret of the Clerk webhook endpoint                                |
| `CLOUDINARY_CLOUD_NAME`   | ✅       | Cloudinary cloud name                                                       |
| `CLOUDINARY_API_KEY`      | ✅       | Cloudinary API key                                                          |
| `CLOUDINARY_API_SECRET`   | ✅       | Cloudinary API secret                                                       |
| `SMTP_USER`               | ✅       | Brevo SMTP login                                                            |
| `SMTP_PASS`               | ✅       | Brevo SMTP key/password                                                     |
| `SENDER_EMAIL`            | ✅       | Verified "from" address used for booking emails                             |
| `STRIPE_SECRET_KEY`       | ✅       | Stripe secret key (`sk_test_...`)                                           |
| `STRIPE_WEBHOOK_SECRET`   | ✅       | Stripe webhook signing secret (`whsec_...`)                                 |
| `STRIPE_PUBLISHABLE_KEY`  | No       | Present in the template but not used by the current code                    |
| `CURRENCY`                | No       | Currency **code** for Stripe, e.g. `usd` (defaults to `usd`)                |

### `client/.env`

| Variable                      | Required | Description                                                       |
| ----------------------------- | :------: | ----------------------------------------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY`  | ✅       | Clerk publishable key (the app throws on start if missing)        |
| `VITE_BACKEND_URL`            | ✅       | Base URL of the API, e.g. `http://localhost:5000`                 |
| `VITE_CURRENCY`               | No       | Currency **symbol** shown in the UI, e.g. `$` (defaults to `$`)   |

**Example templates**

```env
# server/.env
MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SENDER_EMAIL=you@example.com
SMTP_USER=your_brevo_login
SMTP_PASS=your_brevo_smtp_key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CURRENCY=usd
```

```env
# client/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_BACKEND_URL=http://localhost:5000
VITE_CURRENCY=$
```

---

## 🪝 Setting Up Webhooks

### Clerk (user sync)
1. In the Clerk Dashboard go to **Configure → Webhooks → Add Endpoint**.
2. Set the endpoint URL to `https://<your-api-domain>/api/clerk`.
3. Subscribe to `user.created`, `user.updated` and `user.deleted`.
4. Copy the **Signing Secret** into `CLERK_WEBHOOK_SECRET`.
5. **Local development:** Clerk cannot reach `localhost`, so expose your API with a tunnel such as [ngrok](https://ngrok.com) or Cloudflare Tunnel (`ngrok http 5000`) and use that public URL.

### Stripe (payment confirmation)
1. In the Stripe Dashboard (test mode) add an endpoint `https://<your-api-domain>/api/stripe` listening for `payment_intent.succeeded`.
2. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
3. **Local development:** use the [Stripe CLI](https://docs.stripe.com/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:5000/api/stripe
   ```
   and use the `whsec_...` value it prints.
4. Pay with the test card `4242 4242 4242 4242`, any future expiry date and any CVC.

---

## ☁️ Deployment

Both apps include a `vercel.json`, so they can be deployed as **two separate Vercel projects** from the same repo:

| Project  | Root directory | Notes                                                                                   |
| -------- | -------------- | --------------------------------------------------------------------------------------- |
| API      | `server`       | Uses `@vercel/node` and routes every request to `server.js`. Add all server env vars.   |
| Frontend | `client`       | Build command `yarn build`, output `dist`. The rewrite rule makes React Router deep links work. Add the client env vars. |

After deploying:
1. Set `VITE_BACKEND_URL` on the frontend to the deployed API URL (and redeploy).
2. Update the Clerk and Stripe webhook endpoints to the production API URL.
3. Switch Clerk and Stripe from test keys to live keys when you are ready to go live.

---

## 🛣️ Roadmap & Known Limitations

QuickStay is a working end-to-end project. These are the areas to improve next:

**Backend**
- [ ] **Authorization on rooms:** `toggle-availability` only checks that the user is signed in; add a check that the room belongs to the caller's hotel. Also guard `GET /api/rooms/owner` for users without a hotel.
- [ ] **Booking status workflow:** the `status` field (`pending` / `confirmed` / `cancelled`) exists but is never updated; cancelled bookings should stop blocking availability, and a cancel endpoint is missing.
- [ ] **Availability edge case:** the overlap check is inclusive, so a same-day check-out/check-in turnover is treated as a conflict.
- [ ] **Stripe webhook hardening:** return immediately after a failed signature check; remove the duplicate, unused `stripeWebhooks` function inside `bookingController.js` (the handler in `stripeWebhooks.js` is the one mounted).
- [ ] **Schema naming:** rename `totelPrice` → `totalPrice` (requires a small data migration).
- [ ] **Security:** restrict CORS to the frontend origin and add rate limiting / input validation (e.g. `zod` or `express-validator`).
- [ ] **Race conditions:** wrap availability check + booking creation in a transaction to prevent double-booking under concurrent requests.

**Frontend**
- [ ] Wire the **check-in / check-out / guests** fields in the hero search form into the room search.
- [ ] Replace static values (ratings, "200+ reviews", offers, newsletter, testimonials) with real data.
- [ ] Use `VITE_CURRENCY` everywhere instead of the hard-coded `$` in room cards and room lists.
- [ ] Redirect unauthenticated users to the Clerk sign-in instead of navigating to `/login`, which has no route.
- [ ] Use `<Link>` instead of `<a href>` in the navbar to avoid full page reloads; give "Experience" and "About" real targets.
- [ ] Replace the fixed 8-second `Loader` delay with polling for the booking's payment status.

**Features & quality**
- [ ] Reviews and ratings, booking cancellation, owner-side booking management, room editing/deletion.
- [ ] More cities / dynamic city list (currently Dubai, Singapore, New York, London).
- [ ] Automated tests (Jest / Supertest for the API, Vitest / React Testing Library for the UI) and CI.
- [ ] Add `.env.example` files and a `LICENSE` file to the repository.

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** (as declared in `server/package.json`). Add a `LICENSE` file to the repository root to make this explicit on GitHub.

---

## 👤 Author

**Ayush Verma**

- GitHub: [@Ayush-verma25](https://github.com/Ayush-verma25)

If you found this project helpful, please consider giving it a ⭐ on GitHub!
