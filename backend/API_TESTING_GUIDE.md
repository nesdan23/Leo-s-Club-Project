# NGO EventFlow API Testing Guide

Complete guide for testing all API endpoints using Postman, curl, or other tools.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Postman Setup & Automation](#postman-setup--automation)
3. [Authentication Endpoints](#1-authentication-endpoints)
4. [Event Endpoints](#2-event-endpoints)
5. [Task Endpoints](#3-task-endpoints)
6. [Volunteer Import Endpoints](#4-volunteer-import-endpoints)
7. [Admin Endpoints](#5-admin-endpoints)
8. [Complete Testing Workflow](#complete-testing-workflow)
9. [Using curl](#using-curl-command-line)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## Prerequisites

1. **Server must be running** - Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) first
2. **Base URL:** `http://localhost:5000`
3. **Testing Tool:** Postman (recommended), Thunder Client, Insomnia, or curl

---

## Postman Setup & Automation

### Quick Setup (5 minutes)

1. **Create Collection:**
   - Open Postman → Create Collection: "NGO EventFlow API"
   - Go to Collection → Variables tab
   - Add: `baseUrl` = `http://localhost:5000`
   - Add: `token` = (leave empty - auto-filled)

2. **Set Collection Authorization:**
   - Collection → Authorization tab
   - Type: **Bearer Token**
   - Token: `{{token}}`
   - This applies to ALL requests automatically!

3. **Auto-Save Token:**
   - In Login request → **Tests** tab
   - Add this script:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       if (jsonData.token) {
           pm.collectionVariables.set("token", jsonData.token);
           console.log("Token saved automatically!");
       }
   }
   ```
   - Do the same for Register request

4. **Test It:**
   - Run Login → Check console: "Token saved automatically!"
   - Run any protected endpoint → Works without manual token! 🎉

**Now you never need to copy/paste tokens!**

For detailed setup, see [SETUP_GUIDE.md](./SETUP_GUIDE.md#8-postman-setup-recommended)

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

#### Import Volunteers from Excel (Event Manager only)
**POST** `/api/events/:id/volunteers/import`

**Headers:**
```
Authorization: Bearer YOUR_EVENT_MANAGER_TOKEN
```

**Body (multipart/form-data):**
- Field name: `file`
- File type: `.xlsx` (Excel file)
- Maximum size: 5MB

**Excel File Format:**
Required columns (case-sensitive):
- `Name` - Volunteer's full name
- `Email` - Valid email address
- `PreferredDomain` - Must be one of: `Logistics`, `Marketing`, `General`, `Fundraising`, `Outreach`, `Operations`, `Other`

**Example Excel Structure:**
| Name | Email | PreferredDomain |
|------|-------|-----------------|
| John Doe | john@example.com | Logistics |
| Jane Smith | jane@example.com | Marketing |
| Bob Wilson | bob@example.com | General |

**Response:**
```json
{
  "message": "Volunteer import completed",
  "summary": {
    "total": 3,
    "created": 2,
    "linked": 1,
    "failed": 0,
    "emailsSent": 2,
    "emailsFailed": 0
  },
  "details": {
    "created": [
      {
        "row": 2,
        "email": "john@example.com",
        "name": "John Doe",
        "domain": "Logistics",
        "emailSent": true
      }
    ],
    "linked": [
      {
        "row": 3,
        "email": "jane@example.com",
        "name": "Jane Smith",
        "domain": "Marketing"
      }
    ],
    "failed": []
  }
}
```

**Notes:**
- New volunteers receive login credentials via email automatically
- Existing volunteers (by email) are linked to the event without creating duplicate accounts
- You must be the Event Manager of the event to import volunteers
- Email sending failures are logged but don't stop the import process

---

#### Get Event Volunteers (Event Manager/Admin only)
**GET** `/api/events/:id/volunteers`

**Headers:**
```
Authorization: Bearer YOUR_EVENT_MANAGER_OR_ADMIN_TOKEN
```

**Response:**
```json
{
  "event": {
    "id": "...",
    "title": "Summer Fundraiser 2024"
  },
  "totalVolunteers": 5,
  "volunteersByDomain": {
    "Logistics": [
      {
        "id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Team Member"
      }
    ],
    "Marketing": [
      {
        "id": "...",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "Team Member"
      }
    ]
  },
  "allVolunteers": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "preferredDomain": "Logistics"
    }
  ]
}
```

**Use Case:** Event Managers can view all volunteers for an event, grouped by domain, to help with task assignment.

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

## Complete Testing Workflow

Follow this step-by-step workflow to test the entire system:

### Step 1: Register Initial Users

Create users for each role:

**Register Admin:**
```json
POST {{baseUrl}}/api/auth/register
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "password123",
  "role": "Admin"
}
```

**Register Event Manager:**
```json
POST {{baseUrl}}/api/auth/register
{
  "name": "Event Manager",
  "email": "manager@test.com",
  "password": "password123",
  "role": "Event Manager"
}
```

**Register Team Member (Optional - can be created via import):**
```json
POST {{baseUrl}}/api/auth/register
{
  "name": "Team Member",
  "email": "member@test.com",
  "password": "password123",
  "role": "Team Member"
}
```

**Save tokens** from responses (or use Postman auto-save).

---

### Step 2: Login as Event Manager

```json
POST {{baseUrl}}/api/auth/login
{
  "email": "manager@test.com",
  "password": "password123"
}
```

**Result:** Token is automatically saved (if Postman automation is set up).

---

### Step 3: Create an Event

```json
POST {{baseUrl}}/api/events
Authorization: Bearer {{token}}

{
  "title": "Summer Fundraiser 2024",
  "description": "Annual fundraising event for the community",
  "date": "2024-07-15T18:00:00Z",
  "location": "Community Center, Main Hall",
  "status": "Upcoming",
  "attendees": []
}
```

**Save the `_id` from response** - you'll need it for tasks and volunteer import.

---

### Step 4: Import Volunteers (Excel Upload)

**Prepare Excel File:**
- Create `.xlsx` file with columns: `Name`, `Email`, `PreferredDomain`
- Example:
  ```
  Name          | Email              | PreferredDomain
  John Doe      | john@example.com  | Logistics
  Jane Smith    | jane@example.com  | Marketing
  Bob Wilson    | bob@example.com   | General
  ```

**Upload in Postman:**
1. `POST {{baseUrl}}/api/events/{{eventId}}/volunteers/import`
2. Body → `form-data`
3. Key: `file` (change type to "File")
4. Select your `.xlsx` file
5. Send

**Result:**
- New volunteers receive email with login credentials
- Existing volunteers are linked to event
- Response shows summary: created, linked, failed

---

### Step 5: View Imported Volunteers

```json
GET {{baseUrl}}/api/events/{{eventId}}/volunteers
Authorization: Bearer {{eventManagerToken}}
```

**Use this list** to see available volunteers by domain for task assignment.

---

### Step 6: Create Tasks

```json
POST {{baseUrl}}/api/tasks
Authorization: Bearer {{eventManagerToken}}

{
  "name": "Set up sound system",
  "description": "Install and test audio equipment for the event",
  "event": "{{eventId}}",
  "assignee": "{{volunteerUserId}}",  // From volunteers list, or null for open
  "status": "Pending",
  "completionPercentage": 0,
  "dueDate": "2024-07-10T12:00:00Z",
  "domain": "Logistics"
}
```

**Create multiple tasks:**
- Some assigned to volunteers
- Some with `assignee: null` (open for volunteers)

---

### Step 7: Login as Team Member (New Volunteer)

**Option A: Use credentials from email** (if email was sent):
```json
POST {{baseUrl}}/api/auth/login
{
  "email": "john@example.com",
  "password": "password-from-email"
}
```

**Option B: Use manually created team member:**
```json
POST {{baseUrl}}/api/auth/login
{
  "email": "member@test.com",
  "password": "password123"
}
```

---

### Step 8: Test Team Member View

**View Events (Volunteer View):**
```json
GET {{baseUrl}}/api/events
Authorization: Bearer {{teamMemberToken}}
```

**Result:** Only sees events with tasks assigned to them or open tasks.

**View Tasks:**
```json
GET {{baseUrl}}/api/tasks
Authorization: Bearer {{teamMemberToken}}
```

**Result:** Only sees tasks assigned to them or open tasks.

---

### Step 9: Update Task Progress (Team Member)

```json
PATCH {{baseUrl}}/api/tasks/{{taskId}}
Authorization: Bearer {{teamMemberToken}}

{
  "status": "In Progress",
  "completionPercentage": 50
}
```

**Note:** Team Members can ONLY update:
- `status`
- `completionPercentage`
- And only for tasks assigned to them

---

### Step 10: Login as Admin & View Dashboard

```json
POST {{baseUrl}}/api/auth/login
{
  "email": "admin@test.com",
  "password": "password123"
}
```

**View Dashboard:**
```json
GET {{baseUrl}}/api/admin/dashboard
Authorization: Bearer {{adminToken}}
```

**Result:** See all events with:
- Total tasks per event
- Average completion percentage per event

---

## Detailed Endpoint Documentation

### 4. Volunteer Import Endpoints

#### Import Volunteers from Excel (Event Manager only)
**POST** `/api/events/:id/volunteers/import`

**Headers:**
```
Authorization: Bearer {{eventManagerToken}}
```

**Body (multipart/form-data):**
- Field name: `file`
- Type: File
- File: Your `.xlsx` file (max 5MB)

**Excel File Format:**
Required columns (case-sensitive, first row):
- `Name` - Volunteer's full name
- `Email` - Valid email address
- `PreferredDomain` - Must be one of: `Logistics`, `Marketing`, `General`, `Fundraising`, `Outreach`, `Operations`, `Other`

**Example Excel:**
```
Name          | Email              | PreferredDomain
John Doe      | john@example.com   | Logistics
Jane Smith    | jane@example.com  | Marketing
Bob Wilson    | bob@example.com    | General
```

**Response:**
```json
{
  "message": "Volunteer import completed",
  "summary": {
    "total": 3,
    "created": 2,
    "linked": 1,
    "failed": 0,
    "emailsSent": 2,
    "emailsFailed": 0
  },
  "details": {
    "created": [
      {
        "row": 2,
        "email": "john@example.com",
        "name": "John Doe",
        "domain": "Logistics",
        "emailSent": true
      }
    ],
    "linked": [
      {
        "row": 3,
        "email": "jane@example.com",
        "name": "Jane Smith",
        "domain": "Marketing"
      }
    ],
    "failed": []
  }
}
```

**Notes:**
- ✅ New volunteers: Accounts created + emails sent with credentials
- ✅ Existing volunteers: Linked to event (no duplicate accounts)
- ✅ Email failures: Logged but don't stop import
- ✅ Only Event Manager of the event can import volunteers

**Postman Steps:**
1. Create request: `POST {{baseUrl}}/api/events/{{eventId}}/volunteers/import`
2. Body → `form-data`
3. Key: `file` → Change type to "File" → Select `.xlsx` file
4. Send request
5. Check response for import summary

---

#### Get Event Volunteers (Event Manager/Admin only)
**GET** `/api/events/:id/volunteers`

**Headers:**
```
Authorization: Bearer {{eventManagerToken}}
```

**Response:**
```json
{
  "event": {
    "id": "...",
    "title": "Summer Fundraiser 2024"
  },
  "totalVolunteers": 5,
  "volunteersByDomain": {
    "Logistics": [
      {
        "id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Team Member"
      }
    ],
    "Marketing": [
      {
        "id": "...",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "Team Member"
      }
    ]
  },
  "allVolunteers": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "preferredDomain": "Logistics"
    }
  ]
}
```

**Use Case:** Event Managers can view all volunteers for an event, grouped by domain, to help with task assignment.

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

### Import Volunteers (Excel File Upload)
**Note:** File uploads via curl are complex. Use Postman or similar tools for testing.

```bash
curl -X POST http://localhost:5000/api/events/EVENT_ID/volunteers/import \
  -H "Authorization: Bearer YOUR_EVENT_MANAGER_TOKEN" \
  -F "file=@/path/to/volunteers.xlsx"
```

### Get Event Volunteers
```bash
curl -X GET http://localhost:5000/api/events/EVENT_ID/volunteers \
  -H "Authorization: Bearer YOUR_EVENT_MANAGER_TOKEN"
```

---

## Common Issues & Solutions

### Authentication Issues

**401 Unauthorized: Token missing or invalid**
- ✅ Check `Authorization: Bearer TOKEN` header is included
- ✅ Verify token hasn't expired (default: 7 days)
- ✅ Re-login to get a new token
- ✅ If using Postman, check collection variable `{{token}}` has a value

**403 Forbidden: Insufficient permissions**
- ✅ Check user role matches endpoint requirement
- ✅ Event Manager endpoints require `"Event Manager"` role
- ✅ Admin endpoints require `"Admin"` role
- ✅ Verify you're using the correct token for your role

### Request Issues

**404 Not Found**
- ✅ Check endpoint URL is correct
- ✅ Verify resource exists (event/task ID is valid)
- ✅ Check if you have access to that resource

**400 Bad Request**
- ✅ Check all required fields are in request body
- ✅ Verify enum values are correct:
  - `status`: `"Draft"`, `"Upcoming"`, `"In Progress"`, `"Completed"`, `"Cancelled"`
  - `domain`: `"Logistics"`, `"Marketing"`, `"General"`, `"Fundraising"`, `"Outreach"`, `"Operations"`, `"Other"`
  - `role`: `"Admin"`, `"Event Manager"`, `"Team Member"`
- ✅ Check date formats (ISO 8601: `"2024-07-15T18:00:00Z"`)

### Volunteer Import Issues

**Excel File Upload Fails**
- ✅ File must be `.xlsx` format (not `.xls`)
- ✅ Maximum file size: 5MB
- ✅ Required columns: `Name`, `Email`, `PreferredDomain` (case-sensitive)
- ✅ Use `multipart/form-data` body type (not `application/json`)
- ✅ Field name must be exactly `file`
- ✅ First row must be headers

**Volunteers Not Created**
- ✅ Check Excel file has data rows (not just headers)
- ✅ Verify email format is valid
- ✅ Check domain values match enum options
- ✅ Review response `details.failed` array for specific errors

**Emails Not Sending**
- ✅ Verify email configuration in `.env`:
  - `EMAIL_USER` and `EMAIL_PASS` are set
  - Gmail App Password is correct (16 characters, no spaces)
- ✅ Check server console logs for email errors
- ✅ Verify 2-Step Verification is enabled on Google Account
- ✅ Note: Email failures don't stop import - check `emailsFailed` in response
- ✅ New volunteers only: Emails only sent when accounts are created

### Postman Issues

**Token Not Auto-Saving**
- ✅ Check "Tests" tab script is correct
- ✅ Verify response code is 200
- ✅ Check Postman Console for errors
- ✅ Ensure collection variable `token` exists

**Collection Authorization Not Working**
- ✅ Verify Collection → Authorization is set to "Bearer Token"
- ✅ Check token variable name matches: `{{token}}`
- ✅ Individual requests can override collection auth if needed

### Database Issues

**MongoDB Connection Error**
- ✅ Check `MONGO_URI` in `.env` is correct
- ✅ For Atlas: Verify IP is whitelisted
- ✅ For Atlas: Check username/password are correct
- ✅ Verify internet connection (for Atlas)
- ✅ Check MongoDB service is running (for local)

---

## Quick Test Script

Save this as `test-api.js` and run with `node test-api.js`:

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

async function test() {
  try {
    // Register Event Manager
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Event Manager',
      email: 'manager@test.com',
      password: 'password123',
      role: 'Event Manager'
    });
    console.log('Registered:', registerRes.data);
    const token = registerRes.data.token;

    // Create Event
    const eventRes = await axios.post(
      `${BASE_URL}/api/events`,
      {
        title: 'Test Event',
        description: 'Test Description',
        date: '2024-07-15T18:00:00Z',
        location: 'Test Location',
        status: 'Upcoming'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('Event Created:', eventRes.data);
    const eventId = eventRes.data._id;

    // Get Event Volunteers (should be empty initially)
    const volunteersRes = await axios.get(
      `${BASE_URL}/api/events/${eventId}/volunteers`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('Event Volunteers:', volunteersRes.data);

    // Note: To test volunteer import, you'll need to create an Excel file
    // and use Postman or a similar tool, as file uploads require multipart/form-data
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
```

**Note:** For testing volunteer import, use Postman as it's easier to handle file uploads with multipart/form-data.

---

## Quick Reference

### Base URL
```
http://localhost:5000
```

### Authentication Header Format
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)

### Role Permissions Summary

| Endpoint | Admin | Event Manager | Team Member |
|----------|-------|---------------|-------------|
| Register/Login | ✅ | ✅ | ✅ |
| Get Events | ✅ | ✅ | ✅ (volunteer view) |
| Create Event | ❌ | ✅ | ❌ |
| Get Tasks | ✅ | ✅ | ✅ (assigned/open only) |
| Create Task | ❌ | ✅ | ❌ |
| Update Task | ✅ (all fields) | ✅ (all fields) | ✅ (status/progress only, own tasks) |
| Delete Task | ✅ | ✅ | ❌ |
| Import Volunteers | ❌ | ✅ (own events) | ❌ |
| Admin Dashboard | ✅ | ❌ | ❌ |

---

## Tips & Best Practices

1. **Use Postman Collection Variables** - Saves time, no manual token copying
2. **Test Role-Based Access** - Verify each role can only access allowed endpoints
3. **Check Response Details** - Import responses show exactly what happened
4. **Use Realistic Data** - Test with data similar to production
5. **Test Error Cases** - Invalid inputs, missing fields, wrong roles
6. **Keep Server Logs Open** - Helps debug issues quickly
7. **Save Event/Task IDs** - Use Postman variables to chain requests

---

## Next Steps

1. ✅ All endpoints tested
2. ✅ Postman automation configured
3. ✅ Understanding role-based access
4. 📖 Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for deployment
5. 🚀 Start building frontend integration!

---

**Happy Testing! 🎉**
