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
- **Password:** `superadminpassword`

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

## File Upload & Serving

File uploads are handled via a standard `multipart/form-data` endpoint. All uploaded files are encrypted at rest and can only be viewed via a public, unguessable link.

### `POST /api/v1/upload`

Uploads a single file to be associated with an appointment.

**Authorization:** Authenticated User (Citizen, Admin, Super Admin)

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

**Error Responses:**

*   **Code:** `400 Bad Request` - If `appointmentId` or the file is missing.
*   **Code:** `500 Internal Server Error` - If there is an error during encryption or saving.

### `GET /api/v1/files/:externalDocumentId`

Serves a decrypted file for viewing. This is a public endpoint and does not require authentication. The `externalDocumentId` is generated by the server upon successful upload and is designed to be unguessable.

**Authorization:** Public

**Path Parameters:**
* `externalDocumentId` (string, required): The unique ID of the document to retrieve.

**Success Response:**

*   **Code:** `200 OK`
*   **Headers:**
    *   `Content-Type`: The MIME type of the file (e.g., `application/pdf`).
    *   `Content-Disposition`: `inline; filename="<original_filename>"`
*   **Content:** The raw, decrypted file stream.

**Error Responses:**

*   **Code:** `404 Not Found` - If the document ID is invalid.
*   **Code:** `500 Internal Server Error` - If there is an error during decryption.