# API Documentation

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

Get all departments.

**Authorization:** Public

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Department objects` (See structure below)

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
*   **Content:** `Array of Service objects` (See structure below)

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
    "maxCapacityPerSlot": 10
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
    "maxCapacityPerSlot": 8
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

Get available appointment slots for a service on a specific date, including current queue size and max capacity.

**Authorization:** Public

**Query Parameters:**
* `date` (string, required, format: `YYYY-MM-DD`): The date to check for slots.

**Success Response:**

*   **Code:** `200 OK`
*   **Content:**
    ```json
    {
        "slots": [
            {
                "time": "07:00",
                "currentQueueSize": 2,
                "maxCapacity": 6,
                "isAvailable": true
            },
            {
                "time": "08:00",
                "currentQueueSize": 6,
                "maxCapacity": 6,
                "isAvailable": false
            }
        ]
    }
    ```

### `POST /appointments`

Book a new appointment.

**Authorization:** Citizen, Admin, Super Admin

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

**Error Responses:**

*   **Code:** `409 Conflict` - This time slot is full.

### `POST /appointments/:appointmentId/documents`

Associates an externally stored document with an appointment.

**Authorization:** Authenticated User

**Path Parameters:**
* `appointmentId` (string, required): The ID of the appointment.

**Request Body:**

```json
{
    "externalDocumentId": "<id_from_external_service>"
}
```

**Success Response:**

*   **Code:** `201 Created`
*   **Content:** `The created SubmittedDocument object`

---

## User

### `GET /user/appointments`

Get all appointments for the logged-in citizen.

**Authorization:** Citizen

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Appointment objects`

---

## Admin

### `GET /admin/appointments`

Get all appointments for the admin's department.

**Authorization:** Admin, Super Admin

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of detailed Appointment objects` (See structure in previous documentation version)

### `PUT /admin/appointments/:appointmentId`

Update the status of an appointment.

**Authorization:** Admin, Super Admin

**Path Parameters:**
* `appointmentId` (string, required): The ID of the appointment to update.

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

### `PUT /admin/documents/:documentId`

Update the status of a submitted document.

**Authorization:** Admin, Super Admin

**Path Parameters:**
* `documentId` (string, required): The internal ID of the document record to update.

**Request Body:**

```json
{
    "isApproved": true,
    "remarks": "Document looks good."
}
```

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `The updated SubmittedDocument object`

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
    "externalDocumentId": "<id_from_external_service>",
    "isApproved": true,
    "remarks": "Document looks good.",
    "createdAt": "2025-08-13T12:05:00.000Z",
    "updatedAt": "2025-08-13T12:10:00.000Z"
}
```

---

## Real-time System (WebSockets)

The system provides real-time queue updates and appointment booking using WebSockets via the Socket.IO library.

### Connection

Clients should connect to the root of the server URL.

**Example (Client-side JavaScript):**

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "<your_jwt_token>" // See Authentication section
  }
});

socket.on("connect", () => {
  console.log("Connected to the server!", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from the server.");
});
```

### Authentication

The WebSocket connection is authenticated using the same JWT token as the REST API. The token **must** be passed in the `auth.token` field during the initial connection setup.

If the token is missing or invalid, the server will refuse the connection.

### Events

The following section details the events you can use to interact with the real-time system.

#### `emit`: Client-to-Server Events

These are events that the client application should emit to the server.

**1. `join_service_queue`**

Joins a room to receive real-time updates for a specific service queue. The client should emit this event when a user views a service they might book an appointment for.

*   **Payload:** `string` - The `serviceId` of the queue to watch.
*   **Example:**
    ```javascript
    socket.emit('join_service_queue', 'SER1723532294023');
    ```

**2. `book_appointment`**

Books a new appointment. This is the real-time equivalent of the `POST /appointments` REST endpoint.

*   **Payload:** `object` - The appointment details.
*   **Payload Structure:**
    ```json
    {
        "departmentId": "DEP1723532294023",
        "serviceId": "SER1723532294023",
        "appointmentDate": "2025-12-25", // Format: YYYY-MM-DD
        "appointmentTime": "10:00",      // Format: HH:MM
        "notes": "I need this urgently."
    }
    ```
*   **Example:**
    ```javascript
    const appointmentDetails = { /* ...payload structure... */ };
    socket.emit('book_appointment', appointmentDetails);
    ```

#### `on`: Server-to-Client Events

These are events that the client application should listen for.

**1. `queue_update`**

Provides the current queue size for a service. This is sent immediately after a client joins a service queue and is broadcast to all clients in that queue's room whenever a new appointment is booked.

*   **Payload:** `object`
*   **Payload Structure:**
    ```json
    {
        "serviceId": "SER1723532294023",
        "queueCount": 5
    }
    ```
*   **Example:**
    ```javascript
    socket.on('queue_update', (data) => {
      console.log(`Queue for service ${data.serviceId} is now ${data.queueCount}`);
      // Update UI here
    });
    ```

**2. `appointment_booked`**

Confirms to the originating user that their appointment was successfully created. The payload is the full appointment object.

*   **Payload:** `Appointment Object` (See structure in REST API docs)
*   **Example:**
    ```javascript
    socket.on('appointment_booked', (appointment) => {
      console.log('Appointment successfully booked:', appointment);
      // Navigate to confirmation page
    });
    ```

**3. `admin_queue_update` (Admins Only)**

Sent only to authenticated admin/superadmin clients. This event fires whenever *any* service queue changes, allowing for a real-time dashboard view of the entire system.

*   **Payload:** `object`
*   **Payload Structure:**
    ```json
    {
        "serviceId": "SER1723532294023",
        "queueCount": 6
    }
    ```
*   **Example:**
    ```javascript
    socket.on('admin_queue_update', (data) => {
      console.log(`ADMIN VIEW: Queue for ${data.serviceId} is now ${data.queueCount}`);
      // Update admin dashboard UI
    });
    ```

**4. `error`**

Sent by the server if an operation fails (e.g., invalid data for booking, authentication error).

*   **Payload:** `object`
*   **Payload Structure:**
    ```json
    {
        "message": "This time slot is full."
    }
    ```
*   **Example:**
    ```javascript
    socket.on('error', (error) => {
      console.error('An error occurred:', error.message);
      // Show an error message to the user
    });
    ```
