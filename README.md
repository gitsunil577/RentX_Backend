# E-Rental System - Backend API

![Node.js](https://img.shields.io/badge/Node.js-25.1.0-green)
![Express](https://img.shields.io/badge/Express-4.21.2-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.19.3-green)
![License](https://img.shields.io/badge/License-ISC-blue)

RESTful API backend for RentX_Backend - A premium vehicle rental platform. Built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication** - JWT-based authentication with access & refresh tokens.
- **Role-based Access Control** - Separate permissions for Owners and Customers
- **Vehicle Management** - CRUD operations for vehicles with image uploads
- **Booking System** - Complete booking workflow with status management
- **Payment Integration** - Razorpay payment gateway integration
- **File Uploads** - Cloudinary integration for image storage
- **Email Notifications** - Nodemailer for email alerts
- **SMS Notifications** - Twilio integration for SMS alerts
- **Security** - CORS, cookie-parser, bcrypt password hashing
- **Database** - MongoDB with Mongoose ODM

## 🛠️ Tech Stack

### Core Technologies
- **Node.js** (v25.1.0) - JavaScript runtime
- **Express.js** (v4.21.2) - Web framework
- **MongoDB** (v6.15.0) - NoSQL database
- **Mongoose** (v8.19.3) - MongoDB object modeling

### Authentication & Security
- **JSON Web Token** (v9.0.2) - JWT authentication
- **bcrypt** (v5.1.1) - Password hashing
- **bcryptjs** (v3.0.3) - Alternative bcrypt implementation
- **cookie-parser** (v1.4.7) - Cookie handling
- **cors** (v2.8.5) - Cross-origin resource sharing

### File & Media
- **Cloudinary** (v2.6.0) - Cloud image storage
- **Multer** (v1.4.5) - File upload middleware
- **PDFKit** (v0.17.2) - PDF generation

### External Services
- **Razorpay** (v2.9.6) - Payment gateway
- **Nodemailer** (v7.0.10) - Email service
- **Twilio** (v5.10.4) - SMS service

### Development Tools
- **dotenv** (v16.4.7) - Environment variables
- **nodemon** (v3.1.10) - Auto-restart dev server
- **prettier** (v3.5.3) - Code formatting

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **MongoDB Atlas** account or local MongoDB installation
- **Cloudinary** account for image uploads
- **Razorpay** account for payments (optional)
- **Twilio** account for SMS (optional)
- **Gmail** account for emails (optional)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/gitsunil577/RentX_Backend.git
cd E-Rental\ System/E-Rental_backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory (use `.env.example` as template):

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# CORS Configuration
ORIGIN_URL=http://localhost:5173

# JWT Configuration
ACCESS_TOKEN_SECRET=your_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Razorpay Configuration (Optional)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
Server will start at `http://localhost:8000`

### Production Mode
```bash
npm start
```

### Seed Categories
```bash
npm run seed:categories
```

## 📁 Project Structure

```
E-Rental_backend/
├── public/
│   └── temp/              # Temporary file uploads
├── src/
│   ├── app.js             # Express app configuration
│   ├── index.js           # Entry point
│   ├── constants.js       # App constants
│   ├── controllers/       # Route controllers
│   │   ├── user.controller.js
│   │   ├── owner.controller.js
│   │   ├── vehicle.controller.js
│   │   ├── booking.controller.js
│   │   ├── payment.controller.js
│   │   └── ...
│   ├── middlewares/       # Custom middlewares
│   │   ├── auth.middleware.js
│   │   ├── multer.middleware.js
│   │   └── ...
│   ├── models/           # Mongoose models
│   │   ├── user.model.js
│   │   ├── owner.model.js
│   │   ├── vehicle.model.js
│   │   ├── booking.model.js
│   │   └── ...
│   ├── routes/           # API routes
│   │   ├── user.routes.js
│   │   ├── owner.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── booking.routes.js
│   │   └── ...
│   ├── db/               # Database configuration
│   │   └── db.js
│   ├── utils/            # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── cloudinary.js
│   └── scripts/          # Utility scripts
│       └── seedCategories.js
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies
└── README.md            # This file
```

## 🌐 API Endpoints

### Base URL
- **Local:** `http://localhost:8000/api/v1`
- **Production:** `https://your-app.onrender.com/api/v1`

### Authentication Routes (`/user`)
- `POST /user/register` - Register new user
- `POST /user/login` - User login
- `POST /user/logout` - User logout
- `GET /user/current-user` - Get current user
- `POST /user/refresh-token` - Refresh access token

### Owner Routes (`/owner`)
- `POST /owner/register-owner` - Register as owner
- `GET /owner/owner-profile` - Get owner profile
- All routes require authentication

### Vehicle Routes (`/vehicle`)
- `GET /vehicle/all-vehicles` - Get all vehicles (public)
- `GET /vehicle/vehicleByID/:id` - Get vehicle by ID (public)
- `POST /vehicle/register-vehicle` - Register vehicle (owner only)
- `PUT /vehicle/update-vehicle/:vehicleId` - Update vehicle (owner only)
- `DELETE /vehicle/delete-vehicle/:vehicleId` - Delete vehicle (owner only)
- `GET /vehicle/owner-vehicles` - Get owner's vehicles (owner only)

### Booking Routes (`/booking`)
- `POST /booking/create-booking` - Create booking (customer only)
- `GET /booking/my-bookings` - Get user bookings
- `GET /booking/owner-bookings` - Get owner bookings (owner only)
- `PUT /booking/update-status/:bookingId` - Update booking status (owner only)

### Payment Routes (`/payments`)
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify-payment` - Verify payment

### Category Routes (`/category`)
- `GET /category/all-categories` - Get all categories
- `POST /category/create-category` - Create category

### Cart Routes (`/cart`)
- `POST /cart/add-to-cart` - Add item to cart
- `GET /cart/get-cart` - Get user cart
- `DELETE /cart/remove-from-cart/:vehicleId` - Remove from cart

## 🚀 Deployment on Render

### Prerequisites
- Render account (sign up at [render.com](https://render.com))
- GitHub/GitLab/Bitbucket repository
- MongoDB Atlas database
- All third-party API keys ready

### Step-by-Step Deployment

#### 1. Prepare Your Code

Ensure you have:
- ✅ `package.json` with `"start"` script
- ✅ `.env.example` file (don't commit `.env`)
- ✅ `.gitignore` includes `.env` and `node_modules`

#### 2. Push to GitHub

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

#### 3. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. Configure the service:

**Basic Settings:**
- **Name:** `e-rental-backend` (or your choice)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** `E-Rental_backend` (if monorepo)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Select **Free** tier (or paid for production)

#### 4. Configure Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add all variables from your `.env` file:

```
PORT = 8000
NODE_ENV = production
MONGODB_URI = your_mongodb_atlas_connection_string
ORIGIN_URL = https://your-frontend.vercel.app,http://localhost:5173
ACCESS_TOKEN_SECRET = your_secret_here
REFRESH_TOKEN_SECRET = your_refresh_secret_here
ACCESS_TOKEN_EXPIRY = 30m
REFRESH_TOKEN_EXPIRY = 7d
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
CLOUDINARY_URL = cloudinary://key:secret@cloud_name
EMAIL_USER = your_email@gmail.com
EMAIL_PASSWORD = your_app_password
TWILIO_ACCOUNT_SID = your_twilio_sid
TWILIO_AUTH_TOKEN = your_twilio_token
TWILIO_PHONE_NUMBER = your_twilio_number
RAZORPAY_KEY_ID = your_razorpay_key
RAZORPAY_KEY_SECRET = your_razorpay_secret
```

**Important:** Update `ORIGIN_URL` with your Vercel frontend URL!

#### 5. Deploy

Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Start the server (`npm start`)
4. Provide a URL: `https://your-app.onrender.com`

#### 6. Update Frontend

Update your frontend's `.env` on Vercel:

```env
VITE_API_BASE_URL=https://your-app.onrender.com/api/v1
```

Redeploy frontend on Vercel.

### Post-Deployment Configuration

#### MongoDB Atlas Whitelist
1. Go to MongoDB Atlas → Network Access
2. Add Render's IP or allow `0.0.0.0/0` (all IPs)

#### Test Your API
```bash
curl https://your-app.onrender.com/api/v1/category/all-categories
```

#### View Logs
- Go to Render Dashboard → Your Service → Logs

### Render Configuration File (Optional)

Create `render.yaml` in your backend root:

```yaml
services:
  - type: web
    name: e-rental-backend
    env: node
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8000
```

## 🔒 Security Best Practices

### For Production:
1. **Never commit `.env`** - Use `.env.example` instead
2. **Use strong secrets** - Generate secure JWT secrets
3. **Enable CORS properly** - Set specific frontend URL in `ORIGIN_URL`
4. **Use HTTPS** - Render provides SSL automatically
5. **Validate inputs** - Add input validation middleware
6. **Rate limiting** - Add rate limiting for API endpoints
7. **MongoDB security** - Use Atlas with IP whitelist
8. **Secure cookies** - Use `secure: true` and `httpOnly: true`

### Generate Secure Secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🧪 Testing

### Manual API Testing
Use tools like:
- **Postman** - Import API collection
- **Thunder Client** (VS Code extension)
- **cURL** - Command line testing

### Test Endpoints
```bash
# Health check
curl http://localhost:8000/api/v1/category/all-categories

# Login
curl -X POST http://localhost:8000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

### CORS Errors
- Update `ORIGIN_URL` with your frontend URL
- Include both HTTP and HTTPS versions
- Check credentials are enabled in CORS config

### File Upload Issues
- Verify Cloudinary credentials
- Check `public/temp` directory exists
- Ensure sufficient disk space on Render

### Render Build Fails
```bash
# Clear build cache
# Go to Render Dashboard → Service → Manual Deploy → Clear build cache
```

### App Crashes on Render
- Check Render logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection is successful

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run seed:categories` | Seed initial categories |

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (8000) |
| `NODE_ENV` | Yes | Environment (development/production) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `ORIGIN_URL` | Yes | Frontend URL for CORS |
| `ACCESS_TOKEN_SECRET` | Yes | JWT access token secret |
| `REFRESH_TOKEN_SECRET` | Yes | JWT refresh token secret |
| `ACCESS_TOKEN_EXPIRY` | Yes | Access token expiry (30m) |
| `REFRESH_TOKEN_EXPIRY` | Yes | Refresh token expiry (7d) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `CLOUDINARY_URL` | Yes | Cloudinary URL |
| `EMAIL_USER` | Optional | Gmail for notifications |
| `EMAIL_PASSWORD` | Optional | Gmail app password |
| `TWILIO_ACCOUNT_SID` | Optional | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Optional | Twilio phone number |
| `RAZORPAY_KEY_ID` | Optional | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay secret |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Sunil Dalai - Initial work

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- MongoDB for the powerful database
- Render for the deployment platform
- All open-source contributors

---

**Built with ❤️ using Node.js + Express + MongoDB**

For frontend documentation, see [Frontend README](../E-Rental_System/README.md)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check Render logs for deployment issues
- Review MongoDB Atlas logs for database issues
