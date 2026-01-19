# NGO EventFlow API Testing Guide

## Prerequisites

1. **Add JWT_SECRET to your `.env` file** (in `backend/.env`):
   ```env
   PORT=5000
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Base URL:** `http://localhost:5000`

---

## Testing Tools

You can use any of these:
- **Postman** (Recommended - GUI)
- **Thunder Client** (VS Code extension)
- **curl** (Command line)
- **Insomnia** (Alternative GUI)

---

## API Endpoints

### 1. Authentication Endpoints

#### Register a User
**POST** `/api/auth/register`

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Team Member"
}
```

**Roles:** `"Admin"`, `"Event Manager"`, `"Team Member"` (default)

**Response:**
```json
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Team Member"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the `token` for authenticated requests!**

---

#### Login
**POST** `/api/auth/login`

**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as register (user + token)

---

### 2. Event Endpoints

**All require authentication** (add token to headers)

#### Get All Events
**GET** `/api/events`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
- **Team Members:** See events with only their assigned/open tasks
- **Managers/Admins:** See all events

---

#### Create Event (Event Manager only)
**POST** `/api/events`

**Headers:**
```
Authorization: Bearer YOUR_EVENT_MANAGER_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Summer Fundraiser 2024",
  "description": "Annual fundraising event",
  "date": "2024-07-15T18:00:00Z",
  "location": "Community Center",
  "status": "Upcoming",
  "attendees": []
}
```

**Status options:** `"Draft"`, `"Upcoming"`, `"In Progress"`, `"Completed"`, `"Cancelled"`

---

#### Get Event by ID
**GET** `/api/events/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 3. Task Endpoints

**All require authentication**

#### Get All Tasks
**GET** `/api/tasks`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
- **Team Members:** Only see tasks assigned to them OR unassigned (null assignee)
- **Managers/Admins:** See all tasks

---

#### Create Task (Event Manager only)
**POST** `/api/tasks`

**Headers:**
```
Authorization: Bearer YOUR_EVENT_MANAGER_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Set up sound system",
  "description": "Install and test audio equipment",
  "event": "EVENT_ID_HERE",
  "assignee": null,
  "status": "Pending",
  "completionPercentage": 0,
  "dueDate": "2024-07-10T12:00:00Z",
  "domain": "Logistics"
}
```

**Domain options:** `"Logistics"`, `"Marketing"`, `"General"`, `"Fundraising"`, `"Outreach"`, `"Operations"`, `"Other"`

**Status options:** `"Pending"`, `"In Progress"`, `"Completed"`

---

#### Update Task
**PATCH** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
- **Team Members:** Can only update `status` and `completionPercentage` of tasks assigned to them
- **Managers/Admins:** Can update any field

```json
{
  "status": "In Progress",
  "completionPercentage": 50
}
```

---

#### Delete Task (Admin/Event Manager only)
**DELETE** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_MANAGER_TOKEN
```

---

### 4. Admin Endpoints

#### Get Dashboard Stats (Admin only)
**GET** `/api/admin/dashboard`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**
```json
{
  "events": [
    {
      "event": { ... },
      "totalTasks": 5,
      "averageCompletion": 45.5
    }
  ]
}
```

---

## Testing Workflow Example

### Step 1: Register Users
1. Register an **Admin**
2. Register an **Event Manager**
3. Register a **Team Member**

### Step 2: Login as Event Manager
- Get token
- Create an event
- Note the event ID

### Step 3: Create Tasks (as Event Manager)
- Create tasks linked to the event
- Leave some unassigned (null assignee)
- Assign some to the Team Member

### Step 4: Login as Team Member
- Get token
- View events (should see volunteer view)
- View tasks (should only see assigned/open tasks)
- Update task progress

### Step 5: Login as Admin
- Get token
- View dashboard stats
- View all events and tasks

---

## Using Postman

1. **Create a Collection:** "NGO EventFlow API"
2. **Set Collection Variables:**
   - `baseUrl`: `http://localhost:5000`
   - `token`: (will be set after login)
3. **Add Authorization to Collection:**
   - Type: Bearer Token
   - Token: `{{token}}`
4. **Create Requests:**
   - Register
   - Login (use "Tests" tab to save token: `pm.collectionVariables.set("token", pm.response.json().token)`)
   - Get Events
   - Create Event
   - etc.

---

## Using curl (Command Line)

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"Team Member"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Events (with token)
```bash
curl -X GET http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Event
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","description":"Test","date":"2024-07-15T18:00:00Z","location":"Test Location","status":"Upcoming"}'
```

---

## Common Issues

1. **401 Unauthorized:** Token missing or invalid
   - Make sure you're including `Authorization: Bearer TOKEN` header
   - Token might be expired (default: 7 days)

2. **403 Forbidden:** Insufficient permissions
   - Check user role matches endpoint requirements
   - Event Manager endpoints need `"Event Manager"` role
   - Admin endpoints need `"Admin"` role

3. **404 Not Found:** 
   - Check endpoint URL
   - Check if resource exists (event/task ID)

4. **400 Bad Request:**
   - Check required fields in request body
   - Check enum values (status, domain, role)

---

## Quick Test Script

Save this as `test-api.js` and run with `node test-api.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function test() {
  try {
    // Register
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'Admin'
    });
    console.log('Registered:', registerRes.data);
    const token = registerRes.data.token;

    // Get Events
    const eventsRes = await axios.get(`${BASE_URL}/api/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Events:', eventsRes.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
```

