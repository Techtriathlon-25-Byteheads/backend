# API Documentation

## Local Setup (Docker)

The entire backend system, including the database, is containerized with Docker and can be run with a single command. This is the recommended way to run the application for local development.

**Prerequisites:**
- Docker
- Docker Compose

### 1. Configure Environment

First, create a `.env` file for your local environment variables. You can copy the provided example file:

```bash
cp .env.example .env
```

Next, open the `.env` file and change the values for `JWT_SECRET` and `ENCRYPTION_KEY` to your own long, random, secret strings.

### 2. Build and Run

Use Docker Compose to build the API image and start both the API and PostgreSQL containers.

```bash
docker-compose up --build
```

This command will:
- Build the Docker image for the API.
- Start the API and database containers.
- Automatically apply all Prisma database migrations.
- Seed the database with a default super admin user.

The API will be available at `http://localhost:3000`.

### Default Super Admin Credentials

- **Email:** `superadmin@gov.lk`
- **Password:** `password123`

---

This document provides the definitive documentation for the Government Agency Booking App API.

## Base URL

`http://localhost:3000/api`

## Authentication

Most endpoints require a JWT token for authentication. The token should be included in the `Authorization` header as a Bearer token.

`Authorization: Bearer <your_jwt_token>`

---

## Citizen Authentication

Citizen login is a two-step process:
1.  **Request OTP:** Send NIC and phone number to `POST /auth/login`.
2.  **Verify OTP:** Use the `userId` from the previous step and the received OTP to `POST /auth/verify-otp`.

### `POST /auth/signup`

Registers a new citizen user.

**Authorization:** Public

**Request Body:**

```json
{
  "fullName": "John Doe",
  "nic": "123456789V",
  "dob": "1990-01-01",
  "address": {"street": "123 Main St", "city": "Colombo"},
  "contactNumber": "+94771234567"
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:**
    ```json
    {
      "message": "User created successfully. Please verify OTP.",
      "userId": "USR1723532294023"
    }
    ```

### `POST /auth/login`

Initiates the login process for a citizen by sending an OTP via SMS.

**Authorization:** Public

**Request Body:**

```json
{
  "nic": "123456789V",
  "phone": "+94771234567"
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:**
    ```json
    {
      "message": "OTP sent successfully",
      "userId": "USR1723532294023"
    }
    ```

### `POST /auth/verify-otp`

Verifies the OTP and returns a JWT token.

**Authorization:** Public

**Request Body:**

```json
{
  "userId": "USR1723532294023",
  "otp": "123456"
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:**
    ```json
    {
      "message": "OTP verified successfully",
      "token": "<jwt_token>"
    }
    ```

---

## Admin Authentication

### `POST /admin/login`

Logs in an admin or super admin user and returns a JWT token.

**Authorization:** Public

**Request Body:**

```json
{
  "email": "superadmin@gov.lk",
  "password": "password123"
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:**
    ```json
    {
      "token": "<jwt_token>"
    }
    ```

---

## Departments

### `GET /departments`

Get all departments. Can be sorted by city.

**Authorization:** Public

**Query Parameters:**
* `sortBy` (string, optional): Field to sort by. Currently supports `city`.
* `order` (string, optional): Sort order. Accepts `asc` (default) or `desc`.

**Example:** `GET /api/departments?sortBy=city&order=desc`

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Department objects`

### `GET /departments/:id`

Get a department by ID.

**Authorization:** Public

**Path Parameters:**
* `id` (string, required): The ID of the department.

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `A single Department object`

### `POST /departments`

Create a new department.

**Authorization:** Super Admin

**Request Body:**

```json
{
    "departmentName": "Department of Motor Traffic",
    "description": "Provides services related to vehicle registration and driving licenses.",
    "headOfficeAddress": {"street": "123 Main St", "city": "Colombo"},
    "contactInfo": {"phone": "+94112233445"},
    "operatingHours": {"monday-friday": "9am-5pm"}
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:** `The created Department object`

### `PUT /departments/:id`

Update a department.

**Authorization:** Super Admin

**Path Parameters:**
* `id` (string, required): The ID of the department to update.

**Request Body:**

```json
{
    "departmentName": "Department of Motor Traffic (New)",
    "description": "Updated description.",
    "isActive": true
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated Department object`

### `POST /departments/:departmentId/services/:serviceId`

Associates a service with a department.

**Authorization:** Super Admin

**Path Parameters:**
* `departmentId` (string, required): The ID of the department.
* `serviceId` (string, required): The ID of the service.

**Success Response:**

*   **Code:** `201 Created`
*   **Content:**
    ```json
    {
        "departmentId": "DEP1723532294023",
        "serviceId": "SER1723532294023"
    }
    ```

### `DELETE /departments/:departmentId/services/:serviceId`

Disassociates a service from a department.

**Authorization:** Super Admin

**Path Parameters:**
* `departmentId` (string, required): The ID of the department.
* `serviceId` (string, required): The ID of the service.

**Success Response:**

*   **Code:** `204 No Content`
*   **Content:** (empty)

---

## Services

### `GET /services`

Get all services.

**Authorization:** Public

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Service objects`

### `POST /services`

Create a new service.

**Authorization:** Super Admin

**Request Body:**

```json
{
    "serviceName": "New Driving License",
    "description": "Apply for a new driving license.",
    "serviceCategory": "licensing",
    "processingTimeDays": 14,
    "feeAmount": 1500.00,
    "requiredDocuments": {"nic_copy": true, "birth_certificate": true},
    "eligibilityCriteria": "Must be over 18 years old.",
    "onlineAvailable": true,
    "appointmentRequired": true,
    "maxCapacityPerSlot": 10,
    "operationalHours": {
        "monday": ["09:00", "10:00", "11:00"],
        "tuesday": [],
        "wednesday": ["13:00", "14:00", "15:00"],
        "thursday": ["09:00", "10:00", "11:00"],
        "friday": ["09:00", "10:00"],
        "saturday": [],
        "sunday": []
    }
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:** `The created Service object`

### `PUT /services/:id`

Update a service.

**Authorization:** Super Admin

**Path Parameters:**
* `id` (string, required): The ID of the service to update.

**Request Body:**

```json
{
    "serviceName": "Driving License Renewal",
    "feeAmount": 500.00,
    "isActive": true,
        "maxCapacityPerSlot": 8,
    "operationalHours": {
        "monday": ["09:00", "10:00", "11:00"],
        "tuesday": [],
        "wednesday": ["13:00", "14:00", "15:00"]
    }
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated Service object`

---

## Appointments

### `GET /appointments/:departmentId/services`

Get all services for a specific department.

**Authorization:** Public

**Path Parameters:**
* `departmentId` (string, required): The ID of the department.

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Service objects`

### `GET /appointments/:serviceId/slots`

Get available appointment slots for a service on a specific date.

**Authorization:** Public

**Query Parameters:**
* `date` (string, required, format: `YYYY-MM-DD`): The date to check for slots.

**Success Response:**

*   **Code:** `200 OK`
*   **Content:**
    ```json
    {
        "slots": [
            { "time": "07:00", "currentQueueSize": 2, "maxCapacity": 6, "isAvailable": true },
            { "time": "08:00", "currentQueueSize": 6, "maxCapacity": 6, "isAvailable": false }
        ]
    }
    ```

### `POST /appointments`

Book a new appointment.

**Authorization:** Authenticated User

**Request Body:**

```json
{
    "departmentId": "DEP1723532294023",
    "serviceId": "SER1723532294023",
    "appointmentDate": "2025-12-25",
    "appointmentTime": "10:00",
    "notes": "I need this urgently."
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:** `The created Appointment object`

---

## User

Endpoints for the logged-in user.

### `GET /api/user/me`

Retrieves the profile of the currently logged-in user.

**Authorization:** Authenticated User

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `User Object` (password hash is excluded)

### `PUT /api/user/me`

Updates the profile of the currently logged-in user.

**Authorization:** Authenticated User

**Request Body:**

```json
{
    "firstName": "John Updated",
    "lastName": "Doe",
    "phone": "+94777654321",
    "address": {"street": "456 Park Ave", "city": "Kandy"},
    "preferredLanguage": "SI"
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated User object`

### `GET /api/user/appointments`

Get all appointments for the logged-in user.

**Authorization:** Authenticated User

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Appointment objects`

### `PUT /api/user/appointments/:appointmentId/cancel`

Cancels an appointment owned by the logged-in user.

**Authorization:** Authenticated User

**Path Parameters:**
* `appointmentId` (string, required): The ID of the appointment to cancel.

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated Appointment object` with status `cancelled`.

---

## Admin

### Admin Appointment Management

These endpoints allow Admins and Super Admins to manage appointments. For users with the `ADMIN` role, access is restricted to appointments for services they are assigned to. `SUPER_ADMIN` users have unrestricted access.

#### `GET /api/admin/appointments`

Get appointments. For Admins, this is scoped to their assigned services. For Super Admins, it returns all appointments.

**Authorization:** Admin, Super Admin

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of detailed Appointment objects`

#### `POST /api/admin/appointments`

Create a new appointment. Admins can only create appointments for services they are assigned to.

**Authorization:** Admin, Super Admin

**Request Body:**

```json
{
    "userId": "USR...",
    "departmentId": "DEP...",
    "serviceId": "SER...",
    "appointmentDate": "2025-12-25",
    "appointmentTime": "11:00",
    "notes": "Created by admin."
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:** `The created Appointment object`

#### `PUT /api/admin/appointments/:appointmentId`

Update the status or notes of an appointment. Admins can only update appointments for services they are assigned to.

**Authorization:** Admin, Super Admin

**Request Body:**

```json
{
    "status": "confirmed",
    "notes": "All documents are in order."
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated Appointment object`

#### `DELETE /api/admin/appointments/:appointmentId`

Deletes an appointment. Admins can only delete appointments for services they are assigned to.

**Authorization:** Admin, Super Admin

**Path Parameters:**
* `appointmentId` (string, required): The ID of the appointment to delete.

**Success Response:**

*   **Code:** `204 No Content`

### Admin Management (Super Admin Only)

These endpoints are used to manage Admin accounts and are restricted to users with the `SUPER_ADMIN` role.

#### `GET /api/admin/admins`

Retrieves a list of all users with the `ADMIN` role and their assigned services.

**Authorization:** Super Admin

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Admin User objects` (includes `assignedServices`)

#### `POST /api/admin/admins`

Creates a new Admin user and optionally assigns them to services.

**Authorization:** Super Admin

**Request Body:**

```json
{
    "email": "new.admin@gov.lk",
    "password": "a-strong-password",
    "firstName": "New",
    "lastName": "Admin",
    "serviceIds": ["SER...", "SER..."]
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:** `The created Admin User object`

#### `PUT /api/admin/admins/:userId`

Updates an existing Admin user's details and service assignments.

**Authorization:** Super Admin

**Path Parameters:**
* `userId` (string, required): The ID of the admin user to update.

**Request Body:**

```json
{
    "email": "updated.admin@gov.lk",
    "firstName": "Updated",
    "isActive": false,
    "serviceIds": ["SER..."]
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated Admin User object`

#### `DELETE /api/admin/admins/:userId`

Deletes an Admin user.

**Authorization:** Super Admin

**Path Parameters:**
* `userId` (string, required): The ID of the admin user to delete.

**Success Response:**

*   **Code:** `204 No Content`

### User Management (Super Admin Only)

#### `GET /api/admin/users`

Retrieves a list of all users (all roles).

**Authorization:** Super Admin

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of User objects`

#### `PUT /api/admin/users/:userId`

Updates any existing user's details, including their role.

**Authorization:** Super Admin

**Path Parameters:**
* `userId` (string, required): The ID of the user to update.

**Request Body:**

```json
{
    "email": "some.user@example.com",
    "firstName": "Some",
    "lastName": "User",
    "isActive": true,
    "role": "CITIZEN"
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated User object`

---

## Feedback

### `POST /api/feedback`

Submits feedback for a completed appointment.

**Authorization:** Authenticated User (Citizen)

**Request Body:**

```json
{
    "appointmentId": "APP1723532294023",
    "rating": 5,
    "remarks": "Excellent service!"
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:** `The created Feedback object`

### `GET /api/feedback`

Retrieves feedback.
- **Super Admins** get all feedback.
- **Admins** get feedback for services they are assigned to.
- **Citizens** get their own feedback.

**Authorization:** Authenticated User (Admin, Super Admin, Citizen)

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Feedback objects`

### `GET /api/feedback/stats`

Retrieves feedback statistics.
- **Super Admins** get stats for all feedback.
- **Admins** get stats for services they are assigned to.

**Authorization:** Authenticated User (Admin, Super Admin)

**Success Response:**

*   **Code:** `200 OK`
*   **Content:**
    ```json
    {
        "totalFeedback": 1456,
        "averageRating": 4.1,
        "responseRate": 87.3,
        "positiveFeedback": 61,
        "positive": 892,
        "neutral": 324,
        "negative": 240
    }
    ```

---

## Analytics

### `GET /api/analytics`

Retrieves a comprehensive set of analytics data for the platform.

**Authorization:** Admin, Super Admin

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** A structured JSON object containing all analytics data.

**Example Response Body:**

```json
{
  "appointmentStats": { "totalThisMonth": 1250, "percentageChange": 12.5 },
  "activeServiceStats": { "totalThisMonth": 45, "percentageChange": -5.2 },
  "officerStats": { "totalOfficers": 85, "percentageChange": 2.4 },
  "peakHoursToday": [ { "time": "09:00", "count": 25 }, { "time": "10:00", "count": 42 } ],
  "departmentLoad": [ { "departmentName": "Dept of Motor Traffic", "count": 450 } ],
  "quickStatsToday": { "completed": 55, "pending": 112, "noShows": 8, "cancelled": 4 }
}
```

---

## Object Structures

### Department Object
```json
{
    "departmentId": "DEP1723532294023",
    "departmentName": "Department of Motor Traffic",
    "description": "Provides services related to vehicle registration and driving licenses.",
    "headOfficeAddress": {"street": "123 Main St", "city": "Colombo"},
    "contactInfo": {"phone": "+94112233445"},
    "operatingHours": {"monday-friday": "9am-5pm"},
    "isActive": true,
    "createdAt": "2025-08-13T10:00:00.000Z"
}
```

### Service Object
```json
{
    "serviceId": "SER1723532294023",
    "serviceName": "New Driving License",
    "description": "Apply for a new driving license.",
    "serviceCategory": "licensing",
    "feeAmount": "1500.00",
    "isActive": true,
    "createdAt": "2025-08-13T10:00:00.000Z",
    "updatedAt": "2025-08-13T10:00:00.000Z"
}
```

### Appointment Object
```json
{
    "appointmentId": "APP1723532294023",
    "userId": "USR1723532294023",
    "departmentId": "DEP1723532294023",
    "serviceId": "SER1723532294023",
    "appointmentDate": "2025-12-25T00:00:00.000Z",
    "appointmentTime": "1970-01-01T10:00:00.000Z",
    "status": "scheduled",
    "notes": "I need this urgently.",
    "createdAt": "2025-08-13T12:00:00.000Z",
    "updatedAt": "2025-08-13T12:00:00.000Z"
}
```

### SubmittedDocument Object
```json
{
    "documentId": "clv2...",
    "appointmentId": "APP1723532294023",
    "externalDocumentId": "<uuid>",
    "filePath": "/path/to/uploads/encrypted/<uuid>",
    "mimeType": "application/pdf",
    "originalFilename": "mydocument.pdf",
    "fileSizeBytes": 123456,
    "isApproved": true,
    "remarks": "Document looks good.",
    "createdAt": "2025-08-13T12:05:00.000Z",
    "updatedAt": "2025-08-13T12:10:00.000Z"
}
```

---

## Real-time Queue System (WebSockets)

The application uses WebSockets for real-time communication, primarily for managing and displaying appointment queues.

### Connection

Connect to the WebSocket server at the base URL (`http://localhost:3000`). The connection must be authenticated by providing a valid JWT token in the `auth` payload.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "<your_jwt_token>"
  }
});
```

### Emitting Events

#### `join_service_queue`

Joins the queue for a specific service to receive real-time updates.

**Payload:** `serviceId` (string)

**Example:**
```javascript
socket.emit('join_service_queue', 'SER1723532294023');
```

#### `book_appointment`

Books a new appointment. This will also broadcast queue updates to all clients in the service queue and the admin dashboard.

**Payload:** `AppointmentBookingData` (object)

```json
{
  "departmentId": "DEP1723532294023",
  "serviceId": "SER1723532294023",
  "appointmentDate": "2025-12-25",
  "appointmentTime": "10:00",
  "notes": "I need this urgently."
}
```

### Listening for Events

#### `queue_update`

Received when the number of people in a service queue changes.

**Payload:**
```json
{
  "serviceId": "SER1723532294023",
  "queueCount": 15
}
```

#### `appointment_booked`

Received by the user who booked the appointment, confirming the booking.

**Payload:** `Appointment Object`

#### `admin_queue_update`

Received by admins and super admins when a queue count changes.

**Payload:**
```json
{
  "serviceId": "SER1723532294023",
  "queueCount": 15
}
```

#### `error`

Received when an error occurs.

**Payload:**
```json
{
  "message": "Error message here"
}
```

---

## File Upload & Serving

File uploads are handled via a standard `multipart/form-data` endpoint. All uploaded files are encrypted at rest and can only be viewed via a public, unguessable link.

### `POST /api/upload`

Uploads a single file to be associated with an appointment.

**Authorization:** Authenticated User

**Request Type:** `multipart/form-data`

**Form Data:**

*   `appointmentId` (string, required): The ID of the appointment this document belongs to.
*   `document` (file, required): The file to upload. The field name **must** be `document`.

**Success Response:**

*   **Code:** `201 Created`
*   **Content:**
    ```json
    {
        "message": "File uploaded and encrypted successfully.",
        "document": { ...SubmittedDocument Object... }
    }
    ```

### `GET /api/files/:externalDocumentId`

Serves a decrypted file for viewing. This is a public endpoint.

**Authorization:** Public

**Path Parameters:**
* `externalDocumentId` (string, required): The unique ID of the document to retrieve.

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** The raw, decrypted file stream.
