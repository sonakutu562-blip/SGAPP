import requests
import sys
import uuid
from datetime import datetime

class SundarGharAPITester:
    def __init__(self, base_url="https://construction-guide-6.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": response.json() if response.headers.get('content-type') == 'application/json' else response.text
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.headers.get('content-type') == 'application/json':
                    print(f"   Response: {response.json()}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")

            self.test_results.append(result)
            return success, response.json() if response.headers.get('content-type') == 'application/json' else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint, 
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_health_check(self):
        """Test GET / - health check"""
        success, response = self.run_test(
            "Health Check",
            "GET", 
            "/",
            200
        )
        return success and 'message' in response

    def test_signup_valid(self):
        """Test POST /auth/signup with valid data"""
        test_timestamp = datetime.now().strftime("%H%M%S")
        test_data = {
            "name": f"Test User {test_timestamp}",
            "email": f"test{test_timestamp}@sundar.com",
            "password": "password123",
            "phone": "9876543210"
        }
        success, response = self.run_test(
            "Signup Valid User",
            "POST",
            "/auth/signup", 
            200,
            data=test_data
        )
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.test_user_id = response['user']['id']
            return True
        return False

    def test_signup_duplicate_email(self):
        """Test POST /auth/signup with duplicate email"""
        success, response = self.run_test(
            "Signup Duplicate Email",
            "POST",
            "/auth/signup",
            400,
            data={
                "name": "Test User",
                "email": "test@sundar.com",  # Using existing email
                "password": "password123",
                "phone": "9876543210"
            }
        )
        return success

    def test_signup_short_password(self):
        """Test POST /auth/signup with short password"""
        test_timestamp = datetime.now().strftime("%H%M%S")
        success, response = self.run_test(
            "Signup Short Password",
            "POST", 
            "/auth/signup",
            400,
            data={
                "name": f"Test User {test_timestamp}",
                "email": f"test_short{test_timestamp}@sundar.com",
                "password": "123",  # Too short
                "phone": "9876543210"
            }
        )
        return success

    def test_login_valid(self):
        """Test POST /auth/login with valid credentials"""
        success, response = self.run_test(
            "Login Valid Credentials",
            "POST",
            "/auth/login",
            200,
            data={
                "email": "test@sundar.com",
                "password": "password123"
            }
        )
        if success and 'token' in response and 'user' in response:
            # Update token for subsequent tests
            if not self.token:
                self.token = response['token']
            return True
        return False

    def test_login_invalid(self):
        """Test POST /auth/login with invalid credentials"""
        success, response = self.run_test(
            "Login Invalid Credentials",
            "POST",
            "/auth/login", 
            401,
            data={
                "email": "test@sundar.com",
                "password": "wrongpassword"
            }
        )
        return success

    def test_get_me_valid_token(self):
        """Test GET /auth/me with valid token"""
        success, response = self.run_test(
            "Get Current User - Valid Token",
            "GET",
            "/auth/me",
            200,
            auth_required=True
        )
        return success and 'id' in response and 'name' in response

    def test_get_me_no_token(self):
        """Test GET /auth/me without token"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        success, response = self.run_test(
            "Get Current User - No Token", 
            "GET",
            "/auth/me",
            403,  # FastAPI returns 403 for missing bearer token
            auth_required=False
        )
        # Restore token
        self.token = temp_token
        return success

    def test_get_products(self):
        """Test GET /products - should return 6 seeded products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "/products",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products")
            return len(response) == 6
        return False

    def test_get_dashboard_summary(self):
        """Test GET /dashboard/summary with valid token"""
        success, response = self.run_test(
            "Get Dashboard Summary",
            "GET", 
            "/dashboard/summary",
            200,
            auth_required=True
        )
        expected_fields = ['reading_progress', 'checklist_progress', 'budget_used', 'current_stage']
        if success:
            return all(field in response for field in expected_fields)
        return False

    def test_get_guide_chapters(self):
        """Test GET /guide/chapters - should return 22 chapters with status"""
        success, response = self.run_test(
            "Get All Guide Chapters",
            "GET",
            "/guide/chapters",
            200,
            auth_required=True
        )
        if success:
            total_chapters = response.get('total_chapters', 0)
            completed_count = response.get('completed_count', 0)
            chapters = response.get('chapters', [])
            
            print(f"   ✓ Total chapters: {total_chapters}")
            print(f"   ✓ Completed: {completed_count}")
            print(f"   ✓ Chapters returned: {len(chapters)}")
            
            # Verify we have 22 chapters
            if len(chapters) == 22:
                print("   ✓ Correct number of chapters (22)")
                # Check chapter statuses
                completed = [ch for ch in chapters if ch.get('status') == 'completed']
                reading = [ch for ch in chapters if ch.get('status') == 'reading']
                locked = [ch for ch in chapters if ch.get('status') == 'locked']
                
                print(f"   ✓ Status breakdown - Completed: {len(completed)}, Reading: {len(reading)}, Locked: {len(locked)}")
                return True
            else:
                print(f"   ❌ Expected 22 chapters, got {len(chapters)}")
        return False

    def test_get_chapter_detail(self, chapter_number=1):
        """Test GET /guide/chapters/{chapter_number}"""
        success, response = self.run_test(
            f"Get Chapter {chapter_number} Detail",
            "GET",
            f"/guide/chapters/{chapter_number}",
            200,
            auth_required=True
        )
        if success:
            expected_fields = ['chapter_number', 'title', 'description', 'content', 'is_completed']
            has_all_fields = all(field in response for field in expected_fields)
            print(f"   ✓ Chapter title: {response.get('title', 'N/A')}")
            print(f"   ✓ Is completed: {response.get('is_completed', False)}")
            print(f"   ✓ Has content: {'Yes' if response.get('content') else 'No'}")
            return has_all_fields
        return False

    def test_mark_chapter_complete(self, chapter_number=2):
        """Test POST /guide/chapters/{chapter_number}/complete"""
        success, response = self.run_test(
            f"Mark Chapter {chapter_number} Complete",
            "POST",
            f"/guide/chapters/{chapter_number}/complete",
            200,
            data={},
            auth_required=True
        )
        if success:
            expected_fields = ['success', 'chapter_number', 'message', 'completed_count', 'total_chapters']
            has_all_fields = all(field in response for field in expected_fields)
            print(f"   ✓ Success: {response.get('success', False)}")
            print(f"   ✓ Message: {response.get('message', 'N/A')}")
            print(f"   ✓ Completed count: {response.get('completed_count', 0)}")
            return has_all_fields and response.get('success', False)
        return False

    def test_mark_invalid_chapter_complete(self):
        """Test POST /guide/chapters/99/complete - should return 404"""
        success, response = self.run_test(
            "Mark Invalid Chapter Complete (should fail)",
            "POST",
            "/guide/chapters/99/complete",
            404,
            data={},
            auth_required=True
        )
        return success

def main():
    print("🚀 Starting Sundar Ghar Saathi API Tests...")
    print("=" * 60)
    
    tester = SundarGharAPITester()
    
    # Run all tests
    test_functions = [
        tester.test_health_check,
        tester.test_signup_valid,
        tester.test_signup_duplicate_email, 
        tester.test_signup_short_password,
        tester.test_login_valid,
        tester.test_login_invalid,
        tester.test_get_me_valid_token,
        tester.test_get_me_no_token,
        tester.test_get_products,
        tester.test_get_dashboard_summary,
        # Guide API tests
        tester.test_get_guide_chapters,
        tester.test_get_chapter_detail,
        tester.test_mark_chapter_complete,
        tester.test_mark_invalid_chapter_complete
    ]

    for test_func in test_functions:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test {test_func.__name__} failed with error: {e}")

    print("\n" + "=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    # Print detailed results
    print("\n📋 Detailed Results:")
    for result in tester.test_results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['test_name']} - {result['method']} {result['endpoint']} - {result['actual_status']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())