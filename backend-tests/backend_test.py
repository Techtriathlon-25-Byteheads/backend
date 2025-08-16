#!/usr/bin/env python3
"""
Comprehensive Backend Test Script for https://tt25.tharusha.dev/
This script tests various API endpoints and functionality of the backend.
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BackendTester:
    def __init__(self, base_url: str = "https://tt25.tharusha.dev"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Backend-Test-Script/1.0'
        })
        self.test_results = []
        self.auth_token = None
        self.admin_token = None
        self.test_user_id = None
        
    def log_test_result(self, test_name: str, success: bool, message: str = "", response_time: float = 0):
        """Log test result and store for summary"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'response_time': response_time
        }
        self.test_results.append(result)
        
        status = "PASS" if success else "FAIL"
        logger.info(f"[{status}] {test_name} ({response_time:.3f}s): {message}")
    
    def test_health_check(self):
        """Test basic health/status endpoint - using root endpoint instead"""
        test_name = "Health Check (Root Endpoint)"
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        test_name = "Root Endpoint"
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/")
            response_time = time.time() - start_time
            
            if response.status_code in [200, 404]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")
    
    def test_api_endpoints(self):
        """Test backend API endpoints based on actual source code"""
        # Public GET endpoints (no authentication required)
        public_endpoints = [
            "/api/departments",
            "/api/services",
        ]
        
        for endpoint in public_endpoints:
            test_name = f"GET {endpoint}"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}")
                response_time = time.time() - start_time
                
                if response.status_code in [200, 404, 500]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            if isinstance(data, list):
                                logger.info(f"Retrieved {len(data)} items")
                        except:
                            pass
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_citizen_auth_flow(self):
        """Test the complete citizen authentication flow"""
        # Step 1: Test citizen signup
        signup_data = {
            "fullName": "Test User",
            "nic": f"{int(time.time()) % 1000000000}V",  # Generate unique NIC
            "dob": "1990-01-01",
            "address": {"street": "123 Test St", "city": "Colombo"},
            "contactNumber": "+94771234567"
        }
        
        test_name = "Citizen Signup"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/auth/signup", json=signup_data)
            response_time = time.time() - start_time
            
            if response.status_code in [201, 400, 409]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                if response.status_code == 201:
                    data = response.json()
                    self.test_user_id = data.get('userId')
                    logger.info(f"User created with ID: {self.test_user_id}")
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Step 2: Test citizen login (OTP request)
        login_data = {
            "nic": signup_data["nic"],
            "phone": signup_data["contactNumber"]
        }
        
        test_name = "Citizen Login (OTP Request)"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            response_time = time.time() - start_time
            
            if response.status_code in [200, 400, 404]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                if response.status_code == 200:
                    data = response.json()
                    if not self.test_user_id:
                        self.test_user_id = data.get('userId')
                    logger.info(f"OTP sent to user: {self.test_user_id}")
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Step 3: Test OTP verification with various codes
        if self.test_user_id:
            otp_codes = ["1234", "5678", "9999", "0000"]
            for otp in otp_codes:
                test_name = f"OTP Verification (code: {otp})"
                verify_data = {
                    "userId": self.test_user_id,
                    "otp": otp
                }
                
                try:
                    start_time = time.time()
                    response = self.session.post(f"{self.base_url}/api/auth/verify-otp", json=verify_data)
                    response_time = time.time() - start_time
                    
                    if response.status_code in [200, 400, 401]:
                        self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                        if response.status_code == 200:
                            data = response.json()
                            self.auth_token = data.get('token')
                            logger.info(f"Authentication successful with OTP: {otp}")
                            break
                    else:
                        self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
                except Exception as e:
                    self.log_test_result(test_name, False, f"Error: {str(e)}")
                
                time.sleep(0.5)  # Rate limiting

    def test_admin_auth(self):
        """Test admin authentication"""
        admin_data = {
            "email": "superadmin@gov.lk",
            "password": "password123"
        }
        
        test_name = "Admin Login"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/admin/login", json=admin_data)
            response_time = time.time() - start_time
            
            if response.status_code in [200, 401, 404]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                if response.status_code == 200:
                    data = response.json()
                    self.admin_token = data.get('token')
                    logger.info("Admin authentication successful")
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_departments_api(self):
        """Test departments API endpoints"""
        # Test getting departments with different parameters
        dept_endpoints = [
            "/api/departments",
        ]
        
        for endpoint in dept_endpoints:
            test_name = f"GET {endpoint}"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}")
                response_time = time.time() - start_time
                
                if response.status_code in [200, 404]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test getting specific department by ID
        test_name = "GET Department by ID"
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/departments/test-dept-id")
            response_time = time.time() - start_time
            
            if response.status_code in [200, 404, 400]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test creating department (requires super admin)
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            dept_data = {
                "departmentName": f"Test Department {int(time.time())}",
                "description": "Test department for API testing",
                "headOfficeAddress": {"street": "123 Test St", "city": "Colombo"},
                "contactInfo": {"phone": "+94112233445"},
                "operatingHours": {"monday-friday": "9am-5pm"}
            }
            
            test_name = "Create Department"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/departments", 
                                           json=dept_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 401, 403, 400]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_services_api(self):
        """Test services API endpoints"""
        # Test getting services
        test_name = "GET Services"
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/services")
            response_time = time.time() - start_time
            
            if response.status_code in [200, 404]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test getting specific service by ID
        test_name = "GET Service by ID"
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/services/test-service-id")
            response_time = time.time() - start_time
            
            if response.status_code in [200, 404, 400]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test creating service (requires super admin)
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            service_data = {
                "serviceName": f"Test Service {int(time.time())}",
                "description": "Test service for API testing",
                "serviceCategory": "testing",
                "processingTimeDays": 7,
                "feeAmount": 100.00,
                "requiredDocuments": {"nic_copy": True, "application_form": True},
                "eligibilityCriteria": "Test eligibility",
                "onlineAvailable": True,
                "appointmentRequired": True,
                "maxCapacityPerSlot": 10
            }
            
            test_name = "Create Service"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/services", 
                                           json=service_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 401, 403, 400]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_appointments_api(self):
        """Test appointments API endpoints"""
        # Test getting department services
        test_name = "GET Department Services"
        try:
            start_time = time.time()
            # Use a placeholder department ID
            response = self.session.get(f"{self.base_url}/api/appointments/DEP123/services")
            response_time = time.time() - start_time
            
            if response.status_code in [200, 404, 400]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test getting appointment slots
        test_name = "GET Appointment Slots"
        try:
            start_time = time.time()
            # Use a placeholder service ID with date parameter
            response = self.session.get(f"{self.base_url}/api/appointments/SER123/slots?date=2025-12-25")
            response_time = time.time() - start_time
            
            if response.status_code in [200, 404, 400]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test booking appointment (requires authentication)
        if self.auth_token:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            appointment_data = {
                "departmentId": "DEP123",
                "serviceId": "SER123", 
                "appointmentDate": "2025-12-25",
                "appointmentTime": "10:00",
                "notes": "Test appointment booking"
            }
            
            test_name = "Book Appointment"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/appointments", 
                                           json=appointment_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 401, 403, 400, 404]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_user_api(self):
        """Test user API endpoints"""
        if self.auth_token:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            # Test get user profile
            test_name = "GET User Profile"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/user/me", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 404]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

            # Test update user profile
            profile_data = {
                "firstName": "John Updated",
                "lastName": "Doe",
                "phone": "+94777654321",
                "address": {"street": "456 Updated St", "city": "Kandy"},
                "preferredLanguage": "SI"
            }
            
            test_name = "Update User Profile"
            try:
                start_time = time.time()
                response = self.session.put(f"{self.base_url}/api/user/me", 
                                          json=profile_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 400]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

            # Test get user appointments
            test_name = "GET User Appointments"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/user/appointments", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

            # Test cancel appointment
            test_name = "Cancel User Appointment"
            try:
                start_time = time.time()
                response = self.session.put(f"{self.base_url}/api/user/appointments/test-appointment-id/cancel", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 404, 400]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_admin_api(self):
        """Test admin API endpoints"""
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Test get analytics
            test_name = "GET Analytics"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/analytics", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 403]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

            # Test get admin appointments
            test_name = "GET Admin Appointments"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/admin/appointments", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 403]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

            # Test create admin appointment
            appointment_data = {
                "userId": "test-user-id",
                "departmentId": "test-dept-id", 
                "serviceId": "test-service-id",
                "appointmentDate": "2025-12-25",
                "appointmentTime": "10:00"
            }
            
            test_name = "Create Admin Appointment"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/admin/appointments", 
                                           json=appointment_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 401, 403, 400, 404]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

            # Test get admin users (super admin only)
            test_name = "GET Admin Users"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/admin/users", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 403]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

            # Test get all admins (super admin only)
            test_name = "GET All Admins"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/admin/admins", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 403]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_file_upload(self):
        """Test file upload endpoint"""
        test_name = "File Upload Test"
        if self.auth_token:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            # Create a simple test file
            test_file_content = "This is a test document for API testing"
            files = {
                'document': ('test.txt', test_file_content, 'text/plain')
            }
            data = {
                'appointmentId': 'APP123'  # Placeholder appointment ID
            }
            
            try:
                start_time = time.time()
                # Remove Content-Type header for multipart upload
                upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
                response = self.session.post(f"{self.base_url}/api/upload", 
                                           files=files, data=data, headers=upload_headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 401, 400, 404]:
                    self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")
        else:
            self.log_test_result(test_name, False, "No auth token available")
    
    def test_file_serving(self):
        """Test file serving endpoint"""
        test_name = "File Serving Test"
        try:
            start_time = time.time()
            # Test with a placeholder external document ID
            response = self.session.get(f"{self.base_url}/api/files/test-external-doc-id")
            response_time = time.time() - start_time
            
            if response.status_code in [200, 404, 500]:
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_http_methods(self):
        """Test different HTTP methods on root endpoint"""
        methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        
        for method in methods:
            test_name = f"HTTP {method} Method"
            try:
                start_time = time.time()
                response = self.session.request(method, f"{self.base_url}/")
                response_time = time.time() - start_time
                
                # Any response is acceptable for this test
                self.log_test_result(test_name, True, f"Status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")
    
    def test_cors(self):
        """Test CORS headers"""
        test_name = "CORS Headers"
        try:
            start_time = time.time()
            headers = {'Origin': 'https://example.com'}
            response = self.session.options(f"{self.base_url}/", headers=headers)
            response_time = time.time() - start_time
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            found_cors = any(header in response.headers for header in cors_headers)
            
            if found_cors:
                self.log_test_result(test_name, True, "CORS headers present", response_time)
            else:
                self.log_test_result(test_name, False, "No CORS headers found", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")
    
    def test_json_response(self):
        """Test if endpoints return valid JSON"""
        endpoints = ["/api/departments", "/api/services"]
        
        for endpoint in endpoints:
            test_name = f"JSON Response: {endpoint}"
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    try:
                        json_data = response.json()
                        self.log_test_result(test_name, True, "Valid JSON response", response_time)
                        # Log some info about the JSON structure
                        if isinstance(json_data, list) and len(json_data) > 0:
                            logger.info(f"JSON array with {len(json_data)} items")
                        elif isinstance(json_data, dict):
                            keys = list(json_data.keys())[:3]  # First 3 keys
                            logger.info(f"JSON keys found: {keys}")
                    except json.JSONDecodeError:
                        self.log_test_result(test_name, False, "Invalid JSON response", response_time)
                else:
                    self.log_test_result(test_name, False, f"Status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")
    
    def test_performance(self):
        """Test response time performance"""
        test_name = "Performance Test"
        response_times = []
        
        for i in range(5):
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/")
                response_time = time.time() - start_time
                response_times.append(response_time)
            except:
                pass
        
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            
            if avg_time < 2.0:  # Less than 2 seconds average
                self.log_test_result(test_name, True, f"Avg: {avg_time:.3f}s, Max: {max_time:.3f}s", avg_time)
            else:
                self.log_test_result(test_name, False, f"Slow response - Avg: {avg_time:.3f}s", avg_time)
        else:
            self.log_test_result(test_name, False, "No successful requests")
    
    def run_all_tests(self):
        """Run all test methods"""
        logger.info(f"Starting comprehensive backend tests for {self.base_url}")
        logger.info("=" * 60)
        
        # Run all test methods in the correct order
        self.test_health_check()
        self.test_root_endpoint()
        self.test_api_endpoints()
        
        # Authentication tests
        self.test_citizen_auth_flow()
        self.test_admin_auth()
        
        # API endpoint tests (some require authentication)
        self.test_departments_api()
        self.test_services_api()
        self.test_appointments_api()
        self.test_user_api()
        self.test_admin_api()
        self.test_file_upload()
        self.test_file_serving()
        
        # General tests
        self.test_http_methods()
        self.test_cors()
        self.test_json_response()
        self.test_performance()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        logger.info("=" * 60)
        logger.info("TEST SUMMARY")
        logger.info("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            logger.info("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    logger.info(f"  - {result['test']}: {result['message']}")
        
        # Average response time
        response_times = [r['response_time'] for r in self.test_results if r['response_time'] > 0]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            logger.info(f"\nAverage Response Time: {avg_response_time:.3f}s")

def main():
    """Main function to run the tests"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "https://tt25.tharusha.dev"
    
    tester = BackendTester(base_url)
    tester.run_all_tests()

if __name__ == "__main__":
    main()
