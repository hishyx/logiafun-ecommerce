# LogiaFun

> A full stack storefront and admin workspace for discovering, buying, and managing products.

LogiaFun is a server-rendered e-commerce application built with Express and EJS. Customers can browse a product catalog, manage their account, and complete orders. Administrators get tools to manage products, categories, customers, orders, offers, and coupons.

## ✨ What’s inside

### For shoppers

- Product catalog with search, sorting, filtering, and product detail pages
- Account signup and login, email OTP verification, password recovery, and Google sign-in
- Cart, wishlist, profile, addresses, and profile image management
- Checkout with coupons, Razorpay payment, and payment retry flow
- Order history, item cancellation and returns, downloadable invoices
- Wallet, referral rewards, and transaction history

### For administrators

- Dashboard and sales analytics with Excel and PDF exports
- Product and category management, including image uploads
- Customer and order management, including status updates and returns
- Coupon and offer management

## 🧰 Built with

| Layer | Technologies |
| --- | --- |
| Application | Node.js, Express 5 (ES modules) |
| Views | EJS, HTML, CSS, browser-side JavaScript |
| Data | MongoDB, Mongoose |
| Authentication | Express sessions, Passport, Google OAuth 2.0 |
| Payments | Razorpay |
| Images | Cloudinary, Multer |
| Email and exports | Nodemailer, ExcelJS, Puppeteer |

## 🚀 Run locally

### Requirements

- Node.js and npm
- A MongoDB database
- Provider credentials for the integrations you plan to use (see [environment variables](#-environment-variables))

### Setup

```bash
git clone <your-repository-url>
cd logiafun-ecommerce/server
npm install
```

Create `server/.env` and add the configuration values below. Then start the development server:

```bash
npm run dev
```

The app listens on the port set by `PORT`. Open `http://localhost:<PORT>` in your browser. `npm start` runs the same Nodemon entry point as `npm run dev`.

## 🔐 Environment variables

Create a `.env` file in the `server` directory. Keep real credentials out of source control.

```dotenv
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
SESSION_SECRET=replace-with-a-long-random-secret

DATABASE_URL=mongodb://127.0.0.1:27017/logiafun

EMAIL_USER=your-smtp-account@example.com
EMAIL_PASS=your-smtp-password-or-app-password

GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_SECRET=your-razorpay-key-secret

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Configure your Google OAuth client callback URL as `${BASE_URL}/auth/google/callback`. Optional integrations need valid credentials to work; for example, Google sign-in requires Google OAuth credentials and checkout payments require Razorpay credentials.

## 🗂️ Project layout

```text
.
├── docs/                         # Project notes
└── server/
    ├── public/                   # Static assets and browser JavaScript
    ├── src/
    │   ├── app.js                # Express app, middleware, and route mounting
    │   ├── server.js             # Database connection and HTTP listener
    │   ├── config/               # Database and third-party service setup
    │   ├── controllers/          # Request handlers
    │   ├── middlewares/          # Authentication, caching, and error handling
    │   ├── models/               # Mongoose models
    │   ├── routes/               # Customer and admin routes
    │   ├── services/             # Application and data operations
    │   ├── utils/                # Shared helpers and templates
    │   └── views/                # EJS pages and partials
    ├── .env                      # Local secrets (create this yourself)
    └── package.json
```

## 🧭 Main pages

| Area | URL |
| --- | --- |
| Storefront | `/home` |
| Product catalog | `/products` |
| Sign in / sign up | `/auth/login`, `/auth/signup` |
| Customer account | `/user/profile` |
| Admin sign in | `/admin/auth/login` |
| Admin dashboard | `/admin` |

Admin and customer account pages require an authenticated account with the appropriate access. Create or seed an admin account using the project’s existing account provisioning process before visiting the admin workspace.

## 🧩 Useful scripts

Run these commands from `server/`:

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the app with Nodemon |
| `npm start` | Start the app with Nodemon |

## 📄 License

No license is currently specified. Add a `LICENSE` file if you plan to distribute or reuse this project.
