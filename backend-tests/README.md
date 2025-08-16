# Backend Test Suite

This is a comprehensive test suite for testing the backend hosted at `https://tt25.tharusha.dev/`.

# Government Agency Booking API Test Suite

This is a comprehensive test suite for testing the Government Agency Booking backend API hosted at `https://tt25.tharusha.dev/`.

## Features

The test suite includes the following comprehensive tests based on the API documentation:

- **Health Check**: Tests basic connectivity and health endpoints
- **Citizen Authentication Flow**: Complete signup, login (OTP request), and OTP verification process
- **Admin Authentication**: Tests admin login with default super admin credentials
- **Departments API**: Tests department retrieval, creation, and sorting functionality
- **Services API**: Tests service management and creation endpoints
- **Appointments API**: Tests appointment booking, slot checking, and department services
- **User Management**: Tests user profile operations and appointment management
- **Admin Operations**: Tests analytics, admin appointments, and user management
- **File Upload**: Tests document upload functionality for appointments
- **CORS & Performance**: Infrastructure and performance testing

## API Documentation Based Testing

The test suite is specifically designed for the Government Agency Booking API and includes:

- **Citizen Flow**: NIC-based signup → Phone/NIC login → OTP verification with 4-digit codes
- **Admin Operations**: Super admin login and administrative functions
- **Real Data Structures**: Uses actual data formats from the API documentation
- **Authentication Tokens**: Proper JWT token handling and authorization testing
- **Government Services**: Department and service management testing

## Requirements

- Python 3.6+
- `requests` library (installed automatically)

## Usage

### Method 1: Using the bash script (Recommended)

```bash
# Make the script executable
chmod +x run_tests.sh

# Run tests on default URL (https://tt25.tharusha.dev/)
./run_tests.sh

# Run tests on a custom URL
./run_tests.sh https://your-backend-url.com
```

### Method 2: Direct Python execution

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests on default URL
python3 backend_test.py

# Run tests on custom URL
python3 backend_test.py https://your-backend-url.com
```

## Test Output

The script will output:
- **PASS** - Test passed successfully
- **FAIL** - Test failed with error details
- Response times for performance analysis
- Final summary with success rate and failed tests

## Example Output

```
Starting comprehensive backend tests for https://tt25.tharusha.dev
============================================================
[PASS] Health Check (0.245s): Status: 200
[PASS] GET /api/v1/departments (0.189s): Status: 200
[PASS] Citizen Signup (0.456s): Status: 201
[PASS] Citizen Login (OTP Request) (0.234s): Status: 200
[PASS] OTP Verification (code: 1234) (0.167s): Status: 200
[PASS] Admin Login (0.198s): Status: 200
[PASS] GET Analytics (0.234s): Status: 200
[FAIL] Book Appointment (1.203s): Status: 404
...
============================================================
TEST SUMMARY
============================================================
Total Tests: 35
Passed: 28
Failed: 7
Success Rate: 80.0%
Average Response Time: 0.287s
```

## Files

- `backend_test.py` - Main test script
- `run_tests.sh` - Bash script for easy execution
- `requirements.txt` - Python dependencies
- `README.md` - This documentation file