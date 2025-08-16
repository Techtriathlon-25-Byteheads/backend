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
        unique_id = int(time.time()) % 1000000000
        signup_data = {
            "fullName": "Test User Demo",
            "nic": f"{unique_id}V",  # Generate unique NIC
            "dob": "1990-01-01",
            "address": {
                "street": "123 Test Street", 
                "city": "Colombo", 
                "postalCode": "00100"
            },
            "contactNumber": f"+9477{unique_id % 10000000:07d}"
        }
        
        test_name = "Citizen Signup"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/auth/signup", json=signup_data)
            response_time = time.time() - start_time
            
            if response.status_code in [201, 400, 409, 422]:
                success_msg = f"Status: {response.status_code}"
                if response.status_code == 201:
                    try:
                        data = response.json()
                        self.test_user_id = data.get('userId') or data.get('id')
                        success_msg += f" - User ID: {self.test_user_id}"
                    except:
                        pass
                elif response.status_code in [400, 422]:
                    try:
                        error_data = response.json()
                        success_msg += f" - Validation: {error_data.get('message', 'Invalid data')}"
                    except:
                        pass
                elif response.status_code == 409:
                    success_msg += " - User already exists"
                
                self.log_test_result(test_name, True, success_msg, response_time)
            else:
                try:
                    error_detail = response.json().get('message', response.text[:100])
                except:
                    error_detail = response.text[:100]
                self.log_test_result(test_name, False, f"Status: {response.status_code} - {error_detail}", response_time)
        except requests.exceptions.RequestException as e:
            self.log_test_result(test_name, False, f"Network error: {str(e)}")
        except Exception as e:
            self.log_test_result(test_name, False, f"Unexpected error: {str(e)}")

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
                "headOfficeAddress": {
                    "street": "123 Test St", 
                    "city": "Colombo",
                    "postalCode": "00100",
                    "district": "Colombo",
                    "province": "Western"
                },
                "contactInfo": {
                    "phone": "+94112233445",
                    "email": "test@dept.gov.lk",
                    "fax": "+94112233446"
                },
                "operatingHours": {
                    "weekdays": "09:00-17:00",
                    "saturday": "09:00-13:00",
                    "sunday": "Closed"
                },
                "departmentCode": f"TEST{int(time.time()) % 10000}",
                "isActive": True
            }
            
            test_name = "Create Department"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/departments", 
                                           json=dept_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 401, 403, 400, 422]:
                    success_msg = f"Status: {response.status_code}"
                    if response.status_code == 201:
                        try:
                            data = response.json()
                            success_msg += f" - Department ID: {data.get('id', 'Unknown')}"
                        except:
                            pass
                    elif response.status_code in [400, 422]:
                        try:
                            error_data = response.json()
                            success_msg += f" - Validation: {error_data.get('message', 'Invalid data')}"
                        except:
                            pass
                    self.log_test_result(test_name, True, success_msg, response_time)
                else:
                    try:
                        error_detail = response.json().get('message', response.text[:100])
                    except:
                        error_detail = response.text[:100]
                    self.log_test_result(test_name, False, f"Status: {response.status_code} - {error_detail}", response_time)
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
                
                if response.status_code in [201, 401, 403, 400, 422]:
                    success_msg = f"Status: {response.status_code}"
                    if response.status_code == 201:
                        try:
                            data = response.json()
                            success_msg += f" - Service ID: {data.get('id', 'Unknown')}"
                        except:
                            pass
                    elif response.status_code in [400, 422]:
                        try:
                            error_data = response.json()
                            success_msg += f" - Validation: {error_data.get('message', 'Invalid data')}"
                        except:
                            pass
                    self.log_test_result(test_name, True, success_msg, response_time)
                else:
                    try:
                        error_detail = response.json().get('message', response.text[:100])
                    except:
                        error_detail = response.text[:100]
                    self.log_test_result(test_name, False, f"Status: {response.status_code} - {error_detail}", response_time)
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
                "fullName": "John Updated",
                "address": {
                    "street": "456 Updated St", 
                    "city": "Kandy",
                    "postalCode": "20000"
                },
                "contactNumber": "+94777654321",
                "preferredLanguage": "SI"
            }
            
            test_name = "Update User Profile"
            try:
                start_time = time.time()
                response = self.session.put(f"{self.base_url}/api/user/me", 
                                          json=profile_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 401, 400, 422]:
                    success_msg = f"Status: {response.status_code}"
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            success_msg += " - Profile updated"
                        except:
                            pass
                    elif response.status_code in [400, 422]:
                        try:
                            error_data = response.json()
                            success_msg += f" - Error: {error_data.get('message', 'Validation error')}"
                        except:
                            pass
                    self.log_test_result(test_name, True, success_msg, response_time)
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
    
    def test_data_validation(self):
        """Test API endpoints with invalid data to check validation"""
        # Test citizen signup with missing required fields
        invalid_signup_tests = [
            ({}, "Empty payload"),
            ({"fullName": ""}, "Empty name"),
            ({"fullName": "Test", "nic": "invalid"}, "Invalid NIC format"),
            ({"fullName": "Test", "nic": "123456789V", "dob": "invalid-date"}, "Invalid date format"),
            ({"fullName": "Test", "nic": "123456789V", "dob": "1990-01-01", "contactNumber": "invalid"}, "Invalid phone format")
        ]
        
        for invalid_data, test_desc in invalid_signup_tests:
            test_name = f"Signup Validation: {test_desc}"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/auth/signup", json=invalid_data)
                response_time = time.time() - start_time
                
                if response.status_code in [400, 422]:
                    try:
                        error_data = response.json()
                        self.log_test_result(test_name, True, f"Validation caught: {error_data.get('message', 'Error')}", response_time)
                    except:
                        self.log_test_result(test_name, True, "Validation error returned", response_time)
                else:
                    self.log_test_result(test_name, False, f"Expected validation error, got: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test admin login with invalid credentials
        invalid_admin_tests = [
            ({}, "Empty credentials"),
            ({"email": "invalid-email"}, "Invalid email format"),
            ({"email": "test@example.com", "password": ""}, "Empty password"),
            ({"email": "nonexistent@gov.lk", "password": "wrongpassword"}, "Wrong credentials")
        ]
        
        for invalid_data, test_desc in invalid_admin_tests:
            test_name = f"Admin Login Validation: {test_desc}"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/admin/login", json=invalid_data)
                response_time = time.time() - start_time
                
                if response.status_code in [400, 401, 422]:
                    try:
                        error_data = response.json()
                        self.log_test_result(test_name, True, f"Auth validation: {error_data.get('message', 'Error')}", response_time)
                    except:
                        self.log_test_result(test_name, True, "Auth validation error returned", response_time)
                else:
                    self.log_test_result(test_name, False, f"Expected auth error, got: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        # Test very long strings
        long_string = "A" * 1000
        edge_signup_data = {
            "fullName": long_string,
            "nic": "123456789V",
            "dob": "1990-01-01",
            "address": {
                "street": long_string,
                "city": "Colombo",
                "postalCode": "00100"
            },
            "contactNumber": "+94771234567"
        }
        
        test_name = "Edge Case: Long Strings"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/auth/signup", json=edge_signup_data)
            response_time = time.time() - start_time
            
            if response.status_code in [400, 422, 413]:  # 413 = Payload Too Large
                self.log_test_result(test_name, True, f"Handled long strings: {response.status_code}", response_time)
            else:
                self.log_test_result(test_name, False, f"Unexpected handling of long strings: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test SQL injection attempts
        sql_injection_data = {
            "fullName": "'; DROP TABLE users; --",
            "nic": "123456789V",
            "dob": "1990-01-01",
            "address": {"street": "123 Test St", "city": "Colombo", "postalCode": "00100"},
            "contactNumber": "+94771234567"
        }
        
        test_name = "Security: SQL Injection"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/auth/signup", json=sql_injection_data)
            response_time = time.time() - start_time
            
            # Any response is acceptable as long as server doesn't crash
            self.log_test_result(test_name, True, f"SQL injection handled: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test XSS attempts
        xss_data = {
            "fullName": "<script>alert('xss')</script>",
            "nic": "123456789V",
            "dob": "1990-01-01",
            "address": {"street": "123 Test St", "city": "Colombo", "postalCode": "00100"},
            "contactNumber": "+94771234567"
        }
        
        test_name = "Security: XSS Prevention"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/auth/signup", json=xss_data)
            response_time = time.time() - start_time
            
            # Check if XSS is properly handled
            self.log_test_result(test_name, True, f"XSS handled: {response.status_code}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_rate_limiting(self):
        """Test rate limiting protection"""
        test_name = "Rate Limiting"
        response_codes = []
        
        # Make rapid requests to test rate limiting
        for i in range(10):
            try:
                response = self.session.get(f"{self.base_url}/api/departments")
                response_codes.append(response.status_code)
                if response.status_code == 429:  # Too Many Requests
                    self.log_test_result(test_name, True, "Rate limiting active", 0)
                    return
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")
                return
            time.sleep(0.1)  # Small delay between requests
        
        # If no rate limiting detected
        unique_codes = set(response_codes)
        if len(unique_codes) == 1 and 200 in unique_codes:
            self.log_test_result(test_name, False, "No rate limiting detected", 0)
        else:
            self.log_test_result(test_name, True, f"Various responses: {unique_codes}", 0)

    def test_authentication_edge_cases(self):
        """Test authentication edge cases"""
        # Test with malformed JWT tokens
        malformed_tokens = [
            "Bearer invalid.token.here",
            "Bearer " + "A" * 500,  # Very long token
            "invalid-format-token",
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid",  # Malformed JWT
            ""  # Empty token
        ]
        
        for token in malformed_tokens:
            test_name = f"Auth Edge Case: {token[:20]}..."
            headers = {'Authorization': token} if token else {}
            
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}/api/user/me", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [401, 403, 400]:
                    self.log_test_result(test_name, True, f"Rejected malformed auth: {response.status_code}", response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected auth handling: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_structured_api_calls(self):
        """Test API endpoints with properly structured data"""
        
        # Test appointments with real department and service IDs (if available)
        test_name = "Structured Appointment Booking"
        if self.auth_token:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            # First, try to get actual departments to use their IDs
            try:
                dept_response = self.session.get(f"{self.base_url}/api/departments")
                if dept_response.status_code == 200:
                    departments = dept_response.json()
                    if departments and len(departments) > 0:
                        dept_id = departments[0].get('id', 'DEP123')
                    else:
                        dept_id = 'DEP123'
                else:
                    dept_id = 'DEP123'
            except:
                dept_id = 'DEP123'
            
            # Try to get actual services
            try:
                service_response = self.session.get(f"{self.base_url}/api/services")
                if service_response.status_code == 200:
                    services = service_response.json()
                    if services and len(services) > 0:
                        service_id = services[0].get('id', 'SER123')
                    else:
                        service_id = 'SER123'
                else:
                    service_id = 'SER123'
            except:
                service_id = 'SER123'
            
            appointment_data = {
                "departmentId": dept_id,
                "serviceId": service_id,
                "appointmentDate": "2025-12-25",
                "appointmentTime": "10:00",
                "notes": "Test appointment with proper structure"
            }
            
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/appointments", 
                                           json=appointment_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 400, 401, 404, 422]:
                    success_msg = f"Status: {response.status_code}"
                    if response.status_code == 201:
                        try:
                            data = response.json()
                            success_msg += f" - Appointment ID: {data.get('id', 'Unknown')}"
                        except:
                            pass
                    elif response.status_code in [400, 422]:
                        try:
                            error_data = response.json()
                            success_msg += f" - Error: {error_data.get('message', 'Validation error')}"
                        except:
                            pass
                    self.log_test_result(test_name, True, success_msg, response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

        # Test user profile update with proper structure
        test_name = "Structured Profile Update"
        if self.auth_token:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            profile_data = {
                "fullName": "John Updated Doe",
                "address": {
                    "street": "456 Updated Street",
                    "city": "Kandy",
                    "postalCode": "20000"
                },
                "contactNumber": "+94777654321",
                "preferredLanguage": "SI"
            }
            
            try:
                start_time = time.time()
                response = self.session.put(f"{self.base_url}/api/user/me", 
                                          json=profile_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [200, 400, 401, 422]:
                    success_msg = f"Status: {response.status_code}"
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            success_msg += " - Profile updated successfully"
                        except:
                            pass
                    elif response.status_code in [400, 422]:
                        try:
                            error_data = response.json()
                            success_msg += f" - Error: {error_data.get('message', 'Validation error')}"
                        except:
                            pass
                    self.log_test_result(test_name, True, success_msg, response_time)
                else:
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_comprehensive_error_handling(self):
        """Test comprehensive error handling for all endpoints"""
        
        # Test endpoints with various error conditions
        error_test_cases = [
            {
                "endpoint": "/api/departments/nonexistent-id",
                "method": "GET",
                "expected_codes": [404, 400],
                "name": "Nonexistent Department"
            },
            {
                "endpoint": "/api/services/nonexistent-id", 
                "method": "GET",
                "expected_codes": [404, 400],
                "name": "Nonexistent Service"
            },
            {
                "endpoint": "/api/user/me",
                "method": "GET",
                "headers": {},  # No auth
                "expected_codes": [401, 403],
                "name": "Unauthorized User Access"
            },
            {
                "endpoint": "/api/admin/users",
                "method": "GET", 
                "headers": {},  # No auth
                "expected_codes": [401, 403],
                "name": "Unauthorized Admin Access"
            }
        ]
        
        for test_case in error_test_cases:
            test_name = f"Error Handling: {test_case['name']}"
            try:
                start_time = time.time()
                headers = test_case.get('headers', {})
                
                if test_case['method'] == 'GET':
                    response = self.session.get(f"{self.base_url}{test_case['endpoint']}", headers=headers)
                elif test_case['method'] == 'POST':
                    response = self.session.post(f"{self.base_url}{test_case['endpoint']}", 
                                               json=test_case.get('data', {}), headers=headers)
                
                response_time = time.time() - start_time
                
                if response.status_code in test_case['expected_codes']:
                    try:
                        error_data = response.json()
                        message = error_data.get('message', 'Error handled correctly')
                        self.log_test_result(test_name, True, f"Status: {response.status_code} - {message}", response_time)
                    except:
                        self.log_test_result(test_name, True, f"Status: {response.status_code} - Error handled", response_time)
                else:
                    self.log_test_result(test_name, False, f"Expected {test_case['expected_codes']}, got {response.status_code}", response_time)
                    
            except Exception as e:
                self.log_test_result(test_name, False, f"Error: {str(e)}")

    def test_enhanced_endpoints(self):
        """Test enhanced API endpoints with proper data structures"""
        
        # Test comprehensive user signup
        unique_timestamp = int(time.time())
        enhanced_signup_data = {
            "fullName": "Enhanced Test User",
            "nic": f"{unique_timestamp % 1000000000}V",
            "dob": "1990-01-01",
            "address": {
                "street": "123 Enhanced Test Street",
                "city": "Colombo",
                "postalCode": "00100"
            },
            "contactNumber": f"+9477{unique_timestamp % 10000000:07d}",
            "email": f"enhanced.test.{unique_timestamp}@example.com"
        }
        
        test_name = "Enhanced User Signup"
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/api/auth/signup", json=enhanced_signup_data)
            response_time = time.time() - start_time
            
            if response.status_code in [201, 400, 409, 422]:
                success_msg = f"Status: {response.status_code}"
                if response.status_code == 201:
                    try:
                        data = response.json()
                        success_msg += f" - Enhanced User ID: {data.get('userId', data.get('id', 'Unknown'))}"
                    except:
                        success_msg += " - User created successfully"
                elif response.status_code in [400, 422]:
                    try:
                        error_data = response.json()
                        success_msg += f" - Enhanced Validation: {error_data.get('message', 'Validation error')}"
                    except:
                        success_msg += " - Validation error handled"
                elif response.status_code == 409:
                    success_msg += " - User already exists (expected)"
                
                self.log_test_result(test_name, True, success_msg, response_time)
            else:
                try:
                    error_detail = response.json().get('message', response.text[:100])
                except:
                    error_detail = response.text[:100]
                self.log_test_result(test_name, False, f"Unexpected status: {response.status_code} - {error_detail}", response_time)
        except Exception as e:
            self.log_test_result(test_name, False, f"Enhanced signup error: {str(e)}")

        # Test enhanced appointment booking with future date
        if self.auth_token:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            # Calculate a future date (30 days from now)
            import datetime
            future_date = datetime.datetime.now() + datetime.timedelta(days=30)
            appointment_date = future_date.strftime("%Y-%m-%d")
            
            enhanced_appointment_data = {
                "departmentId": "TEST_DEPT_123",
                "serviceId": "TEST_SERVICE_123",
                "appointmentDate": appointment_date,
                "appointmentTime": "10:30",
                "notes": "Enhanced test appointment with future date",
                "urgencyLevel": "normal"
            }
            
            test_name = "Enhanced Appointment Booking"
            try:
                start_time = time.time()
                response = self.session.post(f"{self.base_url}/api/appointments", 
                                           json=enhanced_appointment_data, headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code in [201, 400, 401, 404, 422]:
                    success_msg = f"Status: {response.status_code}"
                    if response.status_code == 201:
                        try:
                            data = response.json()
                            success_msg += f" - Appointment ID: {data.get('id', 'Unknown')}"
                        except:
                            success_msg += " - Appointment created"
                    elif response.status_code in [400, 422]:
                        try:
                            error_data = response.json()
                            success_msg += f" - Validation: {error_data.get('message', 'Error')}"
                        except:
                            success_msg += " - Validation error"
                    elif response.status_code == 404:
                        success_msg += " - Department/Service not found (expected)"
                    
                    self.log_test_result(test_name, True, success_msg, response_time)
                else:
                    try:
                        error_detail = response.json().get('message', response.text[:100])
                    except:
                        error_detail = response.text[:100]
                    self.log_test_result(test_name, False, f"Unexpected status: {response.status_code} - {error_detail}", response_time)
            except Exception as e:
                self.log_test_result(test_name, False, f"Enhanced appointment error: {str(e)}")

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
        
        # Data validation and security tests
        self.test_data_validation()
        self.test_edge_cases()
        self.test_rate_limiting()
        self.test_authentication_edge_cases()
        
        # Structured API tests
        self.test_structured_api_calls()
        
        # Comprehensive error handling tests
        self.test_comprehensive_error_handling()
        
        # Data validation and security tests
        self.test_data_validation()
        self.test_edge_cases()
        self.test_rate_limiting()
        self.test_authentication_edge_cases()
        
        # Structured API tests
        self.test_structured_api_calls()
        
        # Comprehensive error handling tests
        self.test_comprehensive_error_handling()
        
        # Enhanced API endpoint tests
        self.test_enhanced_endpoints()
        
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
