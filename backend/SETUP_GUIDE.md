# NGO EventFlow Backend – Setup Guide

Complete setup guide for getting the backend running on your local machine.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone and Install](#2-clone-and-install)
3. [Environment Variables](#3-environment-variables)
4. [Email Configuration](#4-email-configuration-optional)
5. [Run the Server](#5-run-the-server)
6. [Verify Installation](#6-verify-installation)
7. [Initial Setup](#7-initial-setup)
8. [Postman Setup (Recommended)](#8-postman-setup-recommended)
9. [Project Structure](#9-project-structure)
10. [Common Issues & Troubleshooting](#10-common-issues--troubleshooting)

---

## 1) Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ (Node.js 22 tested and recommended)
- **npm** (comes with Node.js)
- **MongoDB**:
  - MongoDB Atlas account (cloud) **OR**
  - Local MongoDB installation
- **Git** (for cloning the repository)
- **Postman** or similar API testing tool (recommended)

### Verify Installation

```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
git --version   # Should show git version
```

---

## 2) Clone and Install

### Step 1: Clone the Repository

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- Express.js (web framework)
- Mongoose (MongoDB ODM)
- JWT & bcryptjs (authentication)
- nodemailer, multer, xlsx (volunteer import features)
- And other dependencies

**Expected output:** `added XXX packages` with no errors

---

## 3) Environment Variables

### Step 1: Create `.env` File

Create a file named `.env` in the `backend/` folder (same level as `package.json`).

**Important:** The `.env` file should be in:
```
backend/
  ├── .env          ← Create here
  ├── package.json
  └── src/
```

### Step 2: Add Required Variables

Copy this template into your `.env` file:

```env
# Server Configuration
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority

# JWT Secret (use a long random string, minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random-and-secure

# Email Configuration (Optional - for volunteer credential emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=NGO EventFlow <your-email@gmail.com>
FRONTEND_URL=http://localhost:3000
```

### Step 3: Configure MongoDB

**Option A: MongoDB Atlas (Cloud - Recommended)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with your database name (e.g., `ngo-eventflow`)
4. Whitelist your IP address:
   - Go to "Network Access" → "Add IP Address"
   - Add your current IP or `0.0.0.0/0` for development (not recommended for production)

**Option B: Local MongoDB**

If running MongoDB locally:
```env
MONGO_URI=mongodb://localhost:27017/ngo-eventflow
```

### Step 4: Generate JWT Secret

Generate a secure random string for `JWT_SECRET`:

**On Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or use an online generator:** [RandomKeygen](https://randomkeygen.com/)

### Important Notes

- ❌ **Do NOT** wrap values in quotes in `.env` file
- ✅ Ensure key names are exact (case-sensitive): `MONGO_URI`, `JWT_SECRET`
- ✅ No spaces around the `=` sign
- ✅ The `.env` file is gitignored - it won't be committed to the repository

---

## 4) Email Configuration (Optional)

Email configuration is **optional** but required if you want to send login credentials to volunteers via email.

### Gmail Setup

1. **Enable 2-Step Verification:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification" if not already enabled

2. **Generate App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Add to `.env`:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # The 16-char app password (remove spaces)
   ```

**Note:** If email is not configured, volunteer import will still work, but emails won't be sent. Volunteers can still log in using credentials shown in the import response.

---

## 5) Run the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make code changes.

### Production Mode

```bash
npm start
```

### Expected Output

You should see:
```
[nodemon] starting `node src/server.js`
MongoDB connected
Server running on port 5000
```

If you see errors, check the [Troubleshooting](#10-common-issues--troubleshooting) section.

---

## 6) Verify Installation

### Test the API

Open your browser or use curl:

```bash
curl http://localhost:5000
```

**Expected response:**
```json
{
  "message": "NGO EventFlow API"
}
```

If you see this, the server is running correctly! ✅

---

## 7) Initial Setup

### Create Initial Users

You need to create at least one user of each role to test the system. Use Postman or curl:

#### 1. Register an Admin

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "Admin"
}
```

#### 2. Register an Event Manager

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Event Manager",
  "email": "manager@example.com",
  "password": "password123",
  "role": "Event Manager"
}
```

#### 3. Register a Team Member (Optional)

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Team Member",
  "email": "member@example.com",
  "password": "password123",
  "role": "Team Member"
}
```

**Save the tokens** returned from these requests - you'll need them for authenticated endpoints.

---

## 8) Postman Setup (Recommended)

### Step 1: Create Collection

1. Open Postman
2. Create a new Collection: "NGO EventFlow API"
3. Set Collection Variables:
   - Go to Collection → Variables tab
   - Add variables:
     - `baseUrl` = `http://localhost:5000`
     - `token` = (leave empty - will be auto-filled)
     - `eventManagerToken` = (leave empty)
     - `teamMemberToken` = (leave empty)
     - `adminToken` = (leave empty)

### Step 2: Configure Collection Authorization

1. Go to Collection → Authorization tab
2. Type: **Bearer Token**
3. Token: `{{token}}`
4. This will automatically apply to all requests in the collection

### Step 3: Auto-Save Token on Login

1. Create a request: `POST {{baseUrl}}/api/auth/login`
2. Go to the **Tests** tab
3. Add this script:

```javascript
// Auto-save token after login
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    
    if (jsonData.token) {
        // Save to default token variable
        pm.collectionVariables.set("token", jsonData.token);
        
        // Save role-specific tokens
        if (jsonData.user.role === "Event Manager") {
            pm.collectionVariables.set("eventManagerToken", jsonData.token);
        } else if (jsonData.user.role === "Team Member") {
            pm.collectionVariables.set("teamMemberToken", jsonData.token);
        } else if (jsonData.user.role === "Admin") {
            pm.collectionVariables.set("adminToken", jsonData.token);
        }
        
        console.log("Token saved automatically!");
    }
}
```

4. Do the same for the Register request

### Step 4: Test It

1. Run the Login request
2. Check Postman Console (View → Show Postman Console) - you should see "Token saved automatically!"
3. Check Collection Variables - `token` should now have a value
4. Run any protected endpoint - it should work without manually setting the token!

**Now you never have to copy/paste tokens manually!** 🎉

For detailed API testing instructions, see [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)

---

## 9) Project Structure

```
backend/
├── .env                    # Environment variables (not in git)
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
├── SETUP_GUIDE.md         # This file
├── API_TESTING_GUIDE.md   # Detailed API testing guide
│
└── src/
    ├── server.js          # Entry point
    │
    ├── config/
    │   └── db.js          # MongoDB connection
    │
    ├── models/
    │   ├── User.js        # User schema
    │   ├── Event.js       # Event schema
    │   ├── Task.js        # Task schema
    │   └── EventVolunteer.js  # Volunteer-Event linking
    │
    ├── controllers/
    │   ├── authController.js      # Authentication logic
    │   ├── eventController.js     # Event CRUD
    │   ├── taskController.js      # Task CRUD
    │   ├── volunteerController.js # Volunteer import
    │   └── adminController.js     # Admin dashboard
    │
    ├── middleware/
    │   ├── authMiddleware.js     # JWT verification
    │   ├── roleMiddleware.js      # Role-based access control
    │   ├── errorMiddleware.js     # Error handling
    │   └── uploadMiddleware.js    # File upload handling
    │
    ├── routes/
    │   ├── authRoutes.js          # Auth endpoints
    │   ├── eventRoutes.js         # Event endpoints
    │   ├── taskRoutes.js          # Task endpoints
    │   └── adminRoutes.js         # Admin endpoints
    │
    └── utils/
        ├── emailService.js        # Email sending
        └── passwordGenerator.js   # Password generation
```

---

## 10) Common Issues & Troubleshooting

### Issue: "MONGO_URI is not defined"

**Solution:**
- Check that `.env` file exists in `backend/` folder (not in `src/`)
- Verify `MONGO_URI` is spelled correctly (case-sensitive)
- Restart the server after adding `.env` variables
- Make sure there are no quotes around the value

### Issue: "MongoDB connection error"

**Solutions:**
- Check your MongoDB connection string is correct
- For Atlas: Verify your IP is whitelisted
- For Atlas: Check username/password are correct
- For local: Ensure MongoDB service is running
- Check internet connection (for Atlas)

### Issue: "Not authorized, token missing"

**Solution:**
- Make sure you're including the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN_HERE`
- Verify the token hasn't expired (default: 7 days)
- Re-login to get a new token

### Issue: "403 Forbidden"

**Solution:**
- Check your user role matches the endpoint requirement
- Event Manager endpoints require `"Event Manager"` role
- Admin endpoints require `"Admin"` role
- Verify you're using the correct token for your role

### Issue: "Email sending error: Missing credentials"

**Solution:**
- Verify `EMAIL_USER` and `EMAIL_PASS` are set in `.env`
- For Gmail: Use App Password (not regular password)
- Check 2-Step Verification is enabled on Google Account
- Restart server after adding email config

### Issue: "Cannot find module './config/db'"

**Solution:**
- Make sure you're running `npm run dev` from the `backend/` folder
- Verify `server.js` is at `backend/src/server.js`
- Check all files are in the correct locations (see Project Structure)

### Issue: Port 5000 already in use

**Solution:**
- Change `PORT` in `.env` to a different port (e.g., `5001`)
- Or stop the process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:5000 | xargs kill
  ```

### Issue: Volunteer import not sending emails

**Check:**
1. Email configuration in `.env` is correct
2. Check server console logs for email errors
3. Verify Gmail App Password is correct
4. Check if volunteers already exist (emails only sent to new users)

### Issue: Excel file upload fails

**Solutions:**
- File must be `.xlsx` format (not `.xls`)
- Maximum file size: 5MB
- Required columns: `Name`, `Email`, `PreferredDomain`
- Use Postman with `form-data` body type, field name: `file`

---

## Next Steps

1. ✅ Server is running
2. ✅ Initial users created
3. ✅ Postman configured
4. 📖 Read [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for detailed endpoint documentation
5. 🚀 Start building features!

---

## Getting Help

If you encounter issues not covered here:

1. Check the [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for endpoint details
2. Review server console logs for error messages
3. Verify all environment variables are set correctly
4. Check MongoDB connection and database access
5. Contact the team lead or create an issue in the repository

---

**Happy Coding! 🎉**
