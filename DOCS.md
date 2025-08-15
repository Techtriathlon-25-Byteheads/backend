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

// ... (omitted for brevity, no changes)

---

## Admin Authentication

// ... (omitted for brevity, no changes)

---

## Departments

// ... (omitted for brevity, no changes)

---

## Services

// ... (omitted for brevity, no changes)

---

## Appointments

// ... (omitted for brevity, no changes)

---

## User

// ... (omitted for brevity, no changes)

---

## Admin

### Admin Appointment Management

These endpoints allow Admins and Super Admins to manage appointments. For users with the `ADMIN` role, access is restricted to appointments for services they are assigned to. `SUPER_ADMIN` users have unrestricted access.

#### `GET /api/v1/admin/appointments`

Get appointments. For Admins, this is scoped to their assigned services. For Super Admins, it returns all appointments.

**Authorization:** Admin, Super Admin

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of detailed Appointment objects`

#### `POST /api/v1/admin/appointments`

Create a new appointment.

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

#### `PUT /api/v1/admin/appointments/:appointmentId`

Update the status or notes of an appointment.

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

#### `DELETE /api/v1/admin/appointments/:appointmentId`

Deletes an appointment.

**Authorization:** Admin, Super Admin

**Path Parameters:**
* `appointmentId` (string, required): The ID of the appointment to delete.

**Success Response:**

*   **Code:** `204 No Content`

### Admin Management (Super Admin Only)

These endpoints are used to manage Admin accounts and are restricted to users with the `SUPER_ADMIN` role.

#### `GET /api/v1/admin/admins`

Retrieves a list of all users with the `ADMIN` role and their assigned services.

**Authorization:** Super Admin

**Success Response:**

*   **Code:** `200 OK`
*   **Content:** `Array of Admin User objects`

#### `POST /api/v1/admin/admins`

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

#### `PUT /api/v1/admin/admins/:userId`

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

#### `DELETE /api/v1/admin/admins/:userId`

Deletes an Admin user.

**Authorization:** Super Admin

**Path Parameters:**
* `userId` (string, required): The ID of the admin user to delete.

**Success Response:**

*   **Code:** `204 No Content`

### User Management (Super Admin Only)

// ... (omitted for brevity, no changes)

---

## Analytics

// ... (omitted for brevity, no changes)

---

## Object Structures

// ... (omitted for brevity, no changes)

---

## File Upload & Serving

// ... (omitted for brevity, no changes)