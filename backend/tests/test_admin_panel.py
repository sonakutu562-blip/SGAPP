"""
Admin Panel Backend Tests - Iteration 11
Tests for admin dashboard, customers, payments, chapters, and product settings endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "sonakutu562@gmail.com"
ADMIN_PASSWORD = "admin123"

# Test user credentials
TEST_USER_EMAIL = "admin_test_user@test.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Admin Test User"
TEST_USER_PHONE = "9876543210"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.fail(f"Admin login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_user_data(api_client):
    """Get admin user data from login"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("user")
    return None


@pytest.fixture(scope="module")
def test_user_token(api_client):
    """Create or login test user and get token"""
    # Try to login first
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    
    # If login fails, create user
    response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
        "name": TEST_USER_NAME,
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "phone": TEST_USER_PHONE
    })
    if response.status_code == 200:
        return response.json().get("token")
    
    pytest.skip("Could not create or login test user")


@pytest.fixture(scope="module")
def test_user_id(api_client, test_user_token):
    """Get test user ID"""
    response = api_client.get(f"{BASE_URL}/api/auth/me", headers={
        "Authorization": f"Bearer {test_user_token}"
    })
    if response.status_code == 200:
        return response.json().get("id")
    return None


# ─── Auth Tests ───────────────────────────────────────────────────────────────

class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_returns_admin_role(self, api_client):
        """Admin login should return role='admin' for sonakutu562@gmail.com"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token missing from response"
        assert "user" in data, "User missing from response"
        assert data["user"]["role"] == "admin", f"Expected role='admin', got '{data['user'].get('role')}'"
        assert data["user"]["email"] == ADMIN_EMAIL
    
    def test_normal_user_login_returns_user_role(self, api_client, test_user_token):
        """Normal user login should return role='user'"""
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["role"] == "user", f"Expected role='user', got '{data.get('role')}'"


# ─── Admin Stats Tests ────────────────────────────────────────────────────────

class TestAdminStats:
    """Admin dashboard stats endpoint tests"""
    
    def test_admin_stats_returns_all_fields(self, api_client, admin_token):
        """GET /api/admin/stats should return total_customers, total_revenue, today_signups, today_revenue"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Stats failed: {response.text}"
        
        data = response.json()
        assert "total_customers" in data, "total_customers missing"
        assert "total_revenue" in data, "total_revenue missing"
        assert "today_signups" in data, "today_signups missing"
        assert "today_revenue" in data, "today_revenue missing"
        
        # Validate types
        assert isinstance(data["total_customers"], int)
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["today_signups"], int)
        assert isinstance(data["today_revenue"], (int, float))
    
    def test_admin_stats_requires_auth(self, api_client):
        """GET /api/admin/stats should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403]
    
    def test_admin_stats_denies_non_admin(self, api_client, test_user_token):
        """GET /api/admin/stats should return 403 for non-admin users"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


# ─── Admin Customers Tests ────────────────────────────────────────────────────

class TestAdminCustomers:
    """Admin customers endpoint tests"""
    
    def test_admin_customers_returns_list(self, api_client, admin_token):
        """GET /api/admin/customers should return customer list with products and total_paid"""
        response = api_client.get(f"{BASE_URL}/api/admin/customers", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Customers failed: {response.text}"
        
        data = response.json()
        assert "customers" in data, "customers key missing"
        assert isinstance(data["customers"], list)
        
        # If there are customers, validate structure
        if len(data["customers"]) > 0:
            customer = data["customers"][0]
            assert "id" in customer
            assert "name" in customer
            assert "email" in customer
            assert "products" in customer
            assert "total_paid" in customer
            assert isinstance(customer["products"], list)
    
    def test_admin_customers_search_filter(self, api_client, admin_token):
        """GET /api/admin/customers?search=test should filter by name/email"""
        response = api_client.get(f"{BASE_URL}/api/admin/customers", 
            params={"search": "test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "customers" in data
        # All returned customers should match search term
        for customer in data["customers"]:
            name_match = "test" in customer.get("name", "").lower()
            email_match = "test" in customer.get("email", "").lower()
            assert name_match or email_match, f"Customer {customer['email']} doesn't match search 'test'"
    
    def test_admin_customers_paid_filter(self, api_client, admin_token):
        """GET /api/admin/customers?filter=paid should return only paid customers"""
        response = api_client.get(f"{BASE_URL}/api/admin/customers",
            params={"filter": "paid"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        for customer in data["customers"]:
            assert customer["total_paid"] > 0, f"Customer {customer['email']} has total_paid=0 but filter=paid"
    
    def test_admin_customers_free_filter(self, api_client, admin_token):
        """GET /api/admin/customers?filter=free should return only free customers"""
        response = api_client.get(f"{BASE_URL}/api/admin/customers",
            params={"filter": "free"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        for customer in data["customers"]:
            assert customer["total_paid"] == 0, f"Customer {customer['email']} has total_paid>0 but filter=free"
    
    def test_admin_customers_today_filter(self, api_client, admin_token):
        """GET /api/admin/customers?filter=today should work"""
        response = api_client.get(f"{BASE_URL}/api/admin/customers",
            params={"filter": "today"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "customers" in response.json()
    
    def test_admin_customers_denies_non_admin(self, api_client, test_user_token):
        """GET /api/admin/customers should return 403 for non-admin"""
        response = api_client.get(f"{BASE_URL}/api/admin/customers", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 403


# ─── Admin Grant Access Tests ─────────────────────────────────────────────────

class TestAdminGrantAccess:
    """Admin grant access endpoint tests"""
    
    def test_admin_grant_access_success(self, api_client, admin_token, test_user_id):
        """POST /api/admin/grant-access should unlock product for user"""
        if not test_user_id:
            pytest.skip("Test user ID not available")
        
        response = api_client.post(f"{BASE_URL}/api/admin/grant-access",
            json={"user_id": test_user_id, "product_key": "vaastu_guide"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Grant access failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "vaastu_guide" in data.get("message", "")
    
    def test_admin_grant_access_invalid_product(self, api_client, admin_token, test_user_id):
        """POST /api/admin/grant-access with invalid product should fail"""
        if not test_user_id:
            pytest.skip("Test user ID not available")
        
        response = api_client.post(f"{BASE_URL}/api/admin/grant-access",
            json={"user_id": test_user_id, "product_key": "invalid_product"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
    
    def test_admin_grant_access_invalid_user(self, api_client, admin_token):
        """POST /api/admin/grant-access with invalid user should fail"""
        response = api_client.post(f"{BASE_URL}/api/admin/grant-access",
            json={"user_id": "nonexistent-user-id", "product_key": "main_guide"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
    
    def test_admin_grant_access_denies_non_admin(self, api_client, test_user_token, test_user_id):
        """POST /api/admin/grant-access should return 403 for non-admin"""
        response = api_client.post(f"{BASE_URL}/api/admin/grant-access",
            json={"user_id": test_user_id, "product_key": "main_guide"},
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 403


# ─── Admin Payments Tests ─────────────────────────────────────────────────────

class TestAdminPayments:
    """Admin payments endpoint tests"""
    
    def test_admin_payments_returns_list(self, api_client, admin_token):
        """GET /api/admin/payments should return payments with customer info and total_revenue"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Payments failed: {response.text}"
        
        data = response.json()
        assert "payments" in data
        assert "total_revenue" in data
        assert isinstance(data["payments"], list)
        assert isinstance(data["total_revenue"], (int, float))
        
        # If there are payments, validate structure
        if len(data["payments"]) > 0:
            payment = data["payments"][0]
            assert "customer_name" in payment
            assert "customer_email" in payment
    
    def test_admin_payments_success_filter(self, api_client, admin_token):
        """GET /api/admin/payments?filter=success should work"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments",
            params={"filter": "success"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        for payment in data["payments"]:
            assert payment.get("payment_status") in ["success", "captured"]
    
    def test_admin_payments_failed_filter(self, api_client, admin_token):
        """GET /api/admin/payments?filter=failed should work"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments",
            params={"filter": "failed"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        for payment in data["payments"]:
            assert payment.get("payment_status") == "failed"
    
    def test_admin_payments_today_filter(self, api_client, admin_token):
        """GET /api/admin/payments?filter=today should work"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments",
            params={"filter": "today"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "payments" in response.json()
    
    def test_admin_payments_week_filter(self, api_client, admin_token):
        """GET /api/admin/payments?filter=week should work"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments",
            params={"filter": "week"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "payments" in response.json()
    
    def test_admin_payments_month_filter(self, api_client, admin_token):
        """GET /api/admin/payments?filter=month should work"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments",
            params={"filter": "month"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "payments" in response.json()
    
    def test_admin_payments_denies_non_admin(self, api_client, test_user_token):
        """GET /api/admin/payments should return 403 for non-admin"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 403


# ─── Admin Chapters Tests ─────────────────────────────────────────────────────

class TestAdminChapters:
    """Admin chapters endpoint tests"""
    
    def test_admin_chapters_returns_22_chapters(self, api_client, admin_token):
        """GET /api/admin/chapters should return 22 chapters with content status"""
        response = api_client.get(f"{BASE_URL}/api/admin/chapters", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Chapters failed: {response.text}"
        
        data = response.json()
        assert "chapters" in data
        assert len(data["chapters"]) == 22, f"Expected 22 chapters, got {len(data['chapters'])}"
        
        # Validate chapter structure
        chapter = data["chapters"][0]
        assert "chapter_number" in chapter
        assert "title" in chapter
        assert "description" in chapter
        assert "has_content" in chapter
        assert "content" in chapter
    
    def test_admin_update_chapter_content(self, api_client, admin_token):
        """PUT /api/admin/chapters/1 should update chapter content"""
        test_content = "TEST_ADMIN_CONTENT: This is test content for chapter 1."
        
        response = api_client.put(f"{BASE_URL}/api/admin/chapters/1",
            json={"content": test_content},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Update chapter failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        # Verify content was saved by fetching chapters
        get_response = api_client.get(f"{BASE_URL}/api/admin/chapters", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        chapters = get_response.json()["chapters"]
        chapter_1 = next((c for c in chapters if c["chapter_number"] == 1), None)
        assert chapter_1 is not None
        assert chapter_1["content"] == test_content
        assert chapter_1["has_content"] == True
    
    def test_admin_update_chapter_invalid_number(self, api_client, admin_token):
        """PUT /api/admin/chapters/999 should return 404"""
        response = api_client.put(f"{BASE_URL}/api/admin/chapters/999",
            json={"content": "test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
    
    def test_admin_chapters_denies_non_admin(self, api_client, test_user_token):
        """GET /api/admin/chapters should return 403 for non-admin"""
        response = api_client.get(f"{BASE_URL}/api/admin/chapters", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 403


# ─── Admin Products Settings Tests ────────────────────────────────────────────

class TestAdminProductsSettings:
    """Admin products settings endpoint tests"""
    
    def test_admin_products_settings_returns_6_products(self, api_client, admin_token):
        """GET /api/admin/products-settings should return 6 products with pdf_url"""
        response = api_client.get(f"{BASE_URL}/api/admin/products-settings", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Products settings failed: {response.text}"
        
        data = response.json()
        assert "products" in data
        assert len(data["products"]) == 6, f"Expected 6 products, got {len(data['products'])}"
        
        # Validate product structure
        product = data["products"][0]
        assert "product_key" in product
        assert "product_name" in product
        assert "price" in product
        assert "pdf_url" in product
    
    def test_admin_update_product_pdf_url(self, api_client, admin_token):
        """PUT /api/admin/products-settings/main_guide should update pdf_url"""
        test_url = "https://example.com/test_pdf_url.pdf"
        
        response = api_client.put(f"{BASE_URL}/api/admin/products-settings/main_guide",
            json={"pdf_url": test_url},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Update PDF URL failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        # Verify URL was saved
        get_response = api_client.get(f"{BASE_URL}/api/admin/products-settings", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        products = get_response.json()["products"]
        main_guide = next((p for p in products if p["product_key"] == "main_guide"), None)
        assert main_guide is not None
        assert main_guide["pdf_url"] == test_url
    
    def test_admin_update_product_invalid_key(self, api_client, admin_token):
        """PUT /api/admin/products-settings/invalid_key should return 404"""
        response = api_client.put(f"{BASE_URL}/api/admin/products-settings/invalid_key",
            json={"pdf_url": "https://example.com/test.pdf"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
    
    def test_admin_products_settings_denies_non_admin(self, api_client, test_user_token):
        """GET /api/admin/products-settings should return 403 for non-admin"""
        response = api_client.get(f"{BASE_URL}/api/admin/products-settings", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 403


# ─── Existing Features Still Work Tests ───────────────────────────────────────

class TestExistingFeaturesStillWork:
    """Verify existing customer-facing features still work"""
    
    def test_dashboard_summary_works(self, api_client, test_user_token):
        """GET /api/dashboard/summary should still work for normal users"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/summary", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "reading_progress" in data
        assert "checklist_progress" in data
    
    def test_guide_chapters_works(self, api_client, test_user_token):
        """GET /api/guide/chapters should still work for normal users"""
        response = api_client.get(f"{BASE_URL}/api/guide/chapters", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "chapters" in data
        assert len(data["chapters"]) == 22
    
    def test_library_works(self, api_client, test_user_token):
        """GET /api/library should still work for normal users"""
        response = api_client.get(f"{BASE_URL}/api/library", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
