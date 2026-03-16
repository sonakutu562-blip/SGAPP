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
        self.failed_tests = []

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
                    response_data = response.json()
                    print(f"   Response: {response_data}")
                    return success, response_data
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200] if response.text else "No response"
                })

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
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
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

    def test_chapter_uncomplete_functionality(self):
        """Test the uncomplete functionality specifically"""
        print("\n=== CHAPTER UNCOMPLETE TESTS ===")
        
        # First ensure chapter 1 is completed
        success, _ = self.run_test(
            "Mark Chapter 1 Complete (setup)",
            "POST",
            "guide/chapters/1/complete",
            200,
            auth_required=True
        )
        
        # Test uncomplete endpoint for chapter 1 
        success, uncomplete_response = self.run_test(
            "POST /api/guide/chapters/1/uncomplete - removes completion",
            "POST",
            "guide/chapters/1/uncomplete",
            200,
            auth_required=True
        )
        
        if success:
            expected_fields = ['success', 'chapter_number', 'message', 'completed_count', 'total_chapters']
            missing_fields = [field for field in expected_fields if field not in uncomplete_response]
            if missing_fields:
                print(f"⚠️  Missing response fields: {missing_fields}")
                return False
            else:
                print(f"✅ Uncomplete response has all required fields")
                print(f"   Completed count after uncomplete: {uncomplete_response.get('completed_count')}")
        
        # Test uncomplete endpoint for invalid chapter (should return 404)
        success, invalid_response = self.run_test(
            "POST /api/guide/chapters/99/uncomplete - returns 404 for invalid chapter",
            "POST",
            "guide/chapters/99/uncomplete",
            404,
            auth_required=True
        )
        
        # Restore chapter 1 completion for next tests
        self.run_test(
            "Restore Chapter 1 Complete (cleanup)",
            "POST",
            "guide/chapters/1/complete",
            200,
            auth_required=True
        )
        
        return True
        
    def test_guide_list_data_structure(self):
        """Test guide list endpoint for proper data structure"""
        print("\n=== GUIDE LIST STRUCTURE TESTS ===")
        
        success, guide_data = self.run_test(
            "Get Guide Chapters List - Check Structure",
            "GET",
            "guide/chapters",
            200,
            auth_required=True
        )
        
        if success:
            required_fields = ['total_chapters', 'completed_count', 'chapters']
            missing_fields = [field for field in required_fields if field not in guide_data]
            if missing_fields:
                print(f"❌ Missing guide list response fields: {missing_fields}")
                return False
            else:
                print(f"✅ Guide list has all required fields")
                print(f"   Total chapters: {guide_data.get('total_chapters')}")
                print(f"   Completed count: {guide_data.get('completed_count')}")
                
                # Check chapter status structure
                chapters = guide_data.get('chapters', [])
                if chapters:
                    first_chapter = chapters[0]
                    chapter_fields = ['chapter_number', 'title', 'description', 'status']
                    missing_chapter_fields = [field for field in chapter_fields if field not in first_chapter]
                    if missing_chapter_fields:
                        print(f"❌ Missing chapter fields: {missing_chapter_fields}")
                        return False
                    else:
                        print(f"✅ Chapter objects have correct structure")
                        
                        # Check if we have both completed and reading statuses
                        statuses = [ch.get('status') for ch in chapters]
                        unique_statuses = set(statuses)
                        print(f"   Chapter statuses found: {unique_statuses}")
                        
                        if 'completed' in unique_statuses:
                            print(f"✅ Found completed chapters")
                        if 'reading' in unique_statuses:
                            print(f"✅ Found reading chapter")
                        if 'locked' in unique_statuses:
                            print(f"✅ Found locked chapters")
        
        return success

    def test_get_checklists(self):
        """Test GET /checklists - should return 3 categories with 37 total items"""
        success, response = self.run_test(
            "Get Checklists",
            "GET",
            "/checklists",
            200,
            auth_required=True
        )
        if success:
            # Verify structure
            required_fields = ['total_items', 'total_checked', 'categories']
            if not all(field in response for field in required_fields):
                print(f"❌ Missing fields in checklists response")
                return False
            
            total_items = response.get('total_items', 0)
            total_checked = response.get('total_checked', 0)
            categories = response.get('categories', [])
            
            print(f"   ✓ Total items: {total_items}")
            print(f"   ✓ Total checked: {total_checked}")
            print(f"   ✓ Categories count: {len(categories)}")
            
            # Should have exactly 37 total items and 3 categories
            if total_items != 37:
                print(f"❌ Expected 37 total items, got {total_items}")
                return False
                
            if len(categories) != 3:
                print(f"❌ Expected 3 categories, got {len(categories)}")
                return False
            
            # Verify category structure and item counts
            expected_counts = {"site_visit": 15, "material_quality": 12, "legal_documents": 10}
            for cat in categories:
                cat_type = cat.get('type')
                total_cat_items = cat.get('total_items', 0)
                expected_count = expected_counts.get(cat_type, 0)
                
                if total_cat_items != expected_count:
                    print(f"❌ Category {cat_type}: expected {expected_count} items, got {total_cat_items}")
                    return False
                
                print(f"   ✓ {cat.get('title', cat_type)}: {cat.get('checked_count', 0)}/{total_cat_items} items")
            
            return True
        return False

    def test_checklist_toggle(self):
        """Test POST /checklists/toggle - toggle item checked state"""
        # Test toggling a specific item
        success, response = self.run_test(
            "Toggle Checklist Item",
            "POST",
            "/checklists/toggle",
            200,
            data={
                "checklist_type": "site_visit", 
                "item_key": "site_2"
            },
            auth_required=True
        )
        if success:
            required_fields = ['item_key', 'is_checked', 'total_checked', 'total_items']
            if not all(field in response for field in required_fields):
                print(f"❌ Missing fields in toggle response")
                return False
                
            print(f"   ✓ Item {response.get('item_key')} is_checked: {response.get('is_checked')}")
            print(f"   ✓ Total checked: {response.get('total_checked')}/{response.get('total_items')}")
            return True
        return False

    def test_get_budget(self):
        """Test GET /budget - should return budget summary with 8 categories"""
        success, response = self.run_test(
            "Get Budget Summary",
            "GET",
            "/budget",
            200,
            auth_required=True
        )
        if success:
            required_fields = ['total_budget', 'total_spent', 'remaining', 'categories', 'recent_expenses']
            if not all(field in response for field in required_fields):
                print(f"❌ Missing fields in budget response")
                return False
            
            categories = response.get('categories', [])
            print(f"   ✓ Total budget: ₹{response.get('total_budget', 0)}")
            print(f"   ✓ Total spent: ₹{response.get('total_spent', 0)}")
            print(f"   ✓ Remaining: ₹{response.get('remaining', 0)}")
            print(f"   ✓ Categories count: {len(categories)}")
            print(f"   ✓ Recent expenses: {len(response.get('recent_expenses', []))}")
            
            # Should have exactly 8 budget categories
            if len(categories) != 8:
                print(f"❌ Expected 8 budget categories, got {len(categories)}")
                return False
                
            # Verify category structure
            expected_keys = ["foundation", "bricks_cement", "steel_roofing", "labour", 
                           "plumbing_electrical", "doors_windows", "interior", "miscellaneous"]
            
            category_keys = [cat.get('key') for cat in categories]
            for expected_key in expected_keys:
                if expected_key not in category_keys:
                    print(f"❌ Missing expected category: {expected_key}")
                    return False
            
            for cat in categories:
                cat_fields = ['key', 'name', 'icon', 'budgeted_amount', 'spent_amount']
                if not all(field in cat for field in cat_fields):
                    print(f"❌ Category {cat.get('key')} missing required fields")
                    return False
            
            return True
        return False

    def test_set_budget_total(self):
        """Test POST /budget/total - set total budget"""
        test_budget = 3000000  # 30 lakh
        success, response = self.run_test(
            "Set Total Budget",
            "POST", 
            "/budget/total",
            200,
            data={"total_budget": test_budget},
            auth_required=True
        )
        if success:
            if not all(field in response for field in ['success', 'total_budget']):
                print(f"❌ Missing fields in budget total response")
                return False
            
            if response.get('total_budget') != test_budget:
                print(f"❌ Budget not set correctly. Expected {test_budget}, got {response.get('total_budget')}")
                return False
                
            print(f"   ✓ Total budget set to: ₹{response.get('total_budget')}")
            return True
        return False

    def test_set_category_budget(self):
        """Test POST /budget/category - set category budget"""
        test_amount = 500000  # 5 lakh for foundation
        success, response = self.run_test(
            "Set Category Budget",
            "POST",
            "/budget/category", 
            200,
            data={
                "category": "foundation",
                "budgeted_amount": test_amount
            },
            auth_required=True
        )
        if success:
            required_fields = ['success', 'category', 'budgeted_amount']
            if not all(field in response for field in required_fields):
                print(f"❌ Missing fields in category budget response")
                return False
                
            if response.get('budgeted_amount') != test_amount:
                print(f"❌ Category budget not set correctly")
                return False
                
            print(f"   ✓ Category {response.get('category')} budget set to: ₹{response.get('budgeted_amount')}")
            return True
        return False

    def test_add_expense(self):
        """Test POST /budget/expense - add expense entry"""
        test_expense = {
            "category": "foundation",
            "amount": 75000,
            "note": "Test cement purchase",
            "date": "2024-12-01"
        }
        success, response = self.run_test(
            "Add Budget Expense",
            "POST",
            "/budget/expense",
            200,
            data=test_expense,
            auth_required=True
        )
        if success:
            if not response.get('success', False):
                print(f"❌ Add expense did not return success")
                return False
                
            expense = response.get('expense', {})
            if not expense:
                print(f"❌ No expense data returned")
                return False
            
            # Verify expense fields
            required_fields = ['id', 'user_id', 'category', 'amount', 'note', 'date', 'created_at']
            if not all(field in expense for field in required_fields):
                print(f"❌ Missing fields in expense response")
                return False
            
            print(f"   ✓ Expense added: ₹{expense.get('amount')} for {expense.get('category')}")
            print(f"   ✓ Note: {expense.get('note')}")
            print(f"   ✓ Date: {expense.get('date')}")
            return True
        return False

def main():
    print("🧪 Checklists and Budget Modules Testing - Backend APIs")
    print("=" * 60)
    
    tester = SundarGharAPITester()
    
    # Login with test user
    print("\n=== AUTHENTICATION TEST ===")
    success, response = tester.run_test(
        "Login with test user",
        "POST", 
        "auth/login",
        200,
        data={"email": "test@sundar.com", "password": "password123"}
    )
    
    if success and 'token' in response:
        tester.token = response['token']
        print("✅ Authentication successful")
    else:
        print("❌ Authentication failed - cannot proceed with module tests")
        return 1
    
    print("\n=== CHECKLIST MODULE TESTS ===")
    checklist_tests = [
        tester.test_get_checklists,
        tester.test_checklist_toggle,
    ]
    
    print("\n=== BUDGET MODULE TESTS ===")
    budget_tests = [
        tester.test_get_budget,
        tester.test_set_budget_total,
        tester.test_set_category_budget,
        tester.test_add_expense,
    ]

    all_tests = checklist_tests + budget_tests
    
    for test_func in all_tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test {test_func.__name__} failed with error: {e}")

    print("\n" + "=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    # Print failed tests
    if tester.failed_tests:
        print(f"\n❌ Failed Tests Summary:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"  {i}. {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"     Error: {failure['error']}")
            else:
                print(f"     Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())