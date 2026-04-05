"""
Settings Page API Tests
Tests for: Profile, Password, Preferences, Purchases, Delete Account
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials - will be created fresh for each test run
TEST_USER_EMAIL = f"settings_test_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Settings Test User"
TEST_USER_PHONE = "9876543210"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def test_user(api_client):
    """Create a test user and return user data with token"""
    response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
        "name": TEST_USER_NAME,
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "phone": TEST_USER_PHONE
    })
    assert response.status_code == 200, f"Failed to create test user: {response.text}"
    data = response.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }


@pytest.fixture(scope="module")
def auth_headers(test_user):
    """Get auth headers for authenticated requests"""
    return {"Authorization": f"Bearer {test_user['token']}"}


class TestProfileSettings:
    """Profile update endpoint tests"""

    def test_update_profile_success(self, api_client, auth_headers):
        """PUT /api/settings/profile updates name and phone, returns success"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/profile",
            json={"name": "Updated Name", "phone": "1234567890"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["name"] == "Updated Name"
        assert data["phone"] == "1234567890"
        print("✓ Profile update success")

    def test_update_profile_empty_name_rejected(self, api_client, auth_headers):
        """PUT /api/settings/profile rejects empty name"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/profile",
            json={"name": "", "phone": "1234567890"},
            headers=auth_headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "empty" in data["detail"].lower() or "name" in data["detail"].lower()
        print("✓ Empty name rejected with 400")

    def test_update_profile_whitespace_name_rejected(self, api_client, auth_headers):
        """PUT /api/settings/profile rejects whitespace-only name"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/profile",
            json={"name": "   ", "phone": "1234567890"},
            headers=auth_headers
        )
        assert response.status_code == 400
        print("✓ Whitespace-only name rejected")

    def test_update_profile_requires_auth(self, api_client):
        """PUT /api/settings/profile requires authentication"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/profile",
            json={"name": "Test", "phone": "1234567890"}
        )
        assert response.status_code in [401, 403]
        print("✓ Profile update requires auth")


class TestPasswordSettings:
    """Password change endpoint tests"""

    def test_change_password_success(self, api_client, test_user, auth_headers):
        """PUT /api/settings/password changes password with correct current password"""
        new_password = "newpassword123"
        response = api_client.put(
            f"{BASE_URL}/api/settings/password",
            json={
                "current_password": test_user["password"],
                "new_password": new_password
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "updated" in data["message"].lower() or "success" in data["message"].lower()
        
        # Update test_user password for subsequent tests
        test_user["password"] = new_password
        print("✓ Password changed successfully")

    def test_change_password_wrong_current(self, api_client, auth_headers):
        """PUT /api/settings/password rejects wrong current password (400)"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/password",
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword456"
            },
            headers=auth_headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "incorrect" in data["detail"].lower() or "wrong" in data["detail"].lower() or "current" in data["detail"].lower()
        print("✓ Wrong current password rejected with 400")

    def test_change_password_short_new_password(self, api_client, test_user, auth_headers):
        """PUT /api/settings/password rejects new password < 8 chars (400)"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/password",
            json={
                "current_password": test_user["password"],
                "new_password": "short"  # Less than 8 characters
            },
            headers=auth_headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "8" in data["detail"] or "character" in data["detail"].lower()
        print("✓ Short password rejected with 400")

    def test_change_password_requires_auth(self, api_client):
        """PUT /api/settings/password requires authentication"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/password",
            json={
                "current_password": "test",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code in [401, 403]
        print("✓ Password change requires auth")


class TestPreferencesSettings:
    """Preferences endpoint tests"""

    def test_get_preferences_default(self, api_client, auth_headers):
        """GET /api/settings/preferences returns default preferences for new user"""
        response = api_client.get(
            f"{BASE_URL}/api/settings/preferences",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify default values
        assert data["language"] == "en"
        assert data["email_notifications"] is True
        assert data["construction_reminders"] is True
        assert data["new_content_alerts"] is True
        print("✓ Default preferences returned correctly")

    def test_update_preferences_success(self, api_client, auth_headers):
        """PUT /api/settings/preferences saves language and notification settings"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/preferences",
            json={
                "language": "hi",
                "email_notifications": False,
                "construction_reminders": True,
                "new_content_alerts": False
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify persistence with GET
        get_response = api_client.get(
            f"{BASE_URL}/api/settings/preferences",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        prefs = get_response.json()
        assert prefs["language"] == "hi"
        assert prefs["email_notifications"] is False
        assert prefs["construction_reminders"] is True
        assert prefs["new_content_alerts"] is False
        print("✓ Preferences saved and persisted correctly")

    def test_preferences_requires_auth(self, api_client):
        """GET /api/settings/preferences requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/settings/preferences")
        assert response.status_code in [401, 403]
        print("✓ Preferences requires auth")


class TestPurchasesSettings:
    """Purchases endpoint tests"""

    def test_get_purchases_empty_for_new_user(self, api_client, auth_headers):
        """GET /api/settings/purchases returns user's purchase list (empty for new user)"""
        response = api_client.get(
            f"{BASE_URL}/api/settings/purchases",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "purchases" in data
        assert isinstance(data["purchases"], list)
        # New user should have no purchases
        assert len(data["purchases"]) == 0
        print("✓ Purchases list returned (empty for new user)")

    def test_purchases_requires_auth(self, api_client):
        """GET /api/settings/purchases requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/settings/purchases")
        assert response.status_code in [401, 403]
        print("✓ Purchases requires auth")


class TestDeleteAccount:
    """Delete account endpoint tests"""

    def test_delete_account_wrong_confirmation(self, api_client, auth_headers):
        """DELETE /api/settings/account requires 'DELETE MY ACCOUNT' confirmation"""
        response = api_client.delete(
            f"{BASE_URL}/api/settings/account",
            json={"confirmation": "wrong text"},
            headers=auth_headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "DELETE MY ACCOUNT" in data["detail"]
        print("✓ Wrong confirmation rejected")

    def test_delete_account_empty_confirmation(self, api_client, auth_headers):
        """DELETE /api/settings/account rejects empty confirmation"""
        response = api_client.delete(
            f"{BASE_URL}/api/settings/account",
            json={"confirmation": ""},
            headers=auth_headers
        )
        assert response.status_code == 400
        print("✓ Empty confirmation rejected")

    def test_delete_account_requires_auth(self, api_client):
        """DELETE /api/settings/account requires authentication"""
        response = api_client.delete(
            f"{BASE_URL}/api/settings/account",
            json={"confirmation": "DELETE MY ACCOUNT"}
        )
        assert response.status_code in [401, 403]
        print("✓ Delete account requires auth")


class TestDeleteAccountSuccess:
    """Separate class for delete account success test (runs last)"""

    def test_delete_account_success(self, api_client):
        """DELETE /api/settings/account deletes all user data from all collections"""
        # Create a throwaway user for deletion test
        delete_user_email = f"delete_test_{uuid.uuid4().hex[:8]}@test.com"
        
        # Signup
        signup_response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Delete Test User",
            "email": delete_user_email,
            "password": "deletepass123",
            "phone": "9999999999"
        })
        assert signup_response.status_code == 200
        token = signup_response.json()["token"]
        delete_headers = {"Authorization": f"Bearer {token}"}
        
        # Delete account with correct confirmation
        response = api_client.delete(
            f"{BASE_URL}/api/settings/account",
            json={"confirmation": "DELETE MY ACCOUNT"},
            headers=delete_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "deleted" in data["message"].lower()
        
        # Verify user can no longer login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": delete_user_email,
            "password": "deletepass123"
        })
        assert login_response.status_code == 401
        print("✓ Account deleted successfully and user cannot login")


class TestExistingEndpoints:
    """Verify existing endpoints still work"""

    def test_dashboard_summary_works(self, api_client, auth_headers):
        """Existing /api/dashboard/summary works for normal users"""
        response = api_client.get(
            f"{BASE_URL}/api/dashboard/summary",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "reading_progress" in data
        assert "checklist_progress" in data
        print("✓ Dashboard summary still works")

    def test_guide_chapters_works(self, api_client, auth_headers):
        """Existing /api/guide/chapters works for normal users"""
        response = api_client.get(
            f"{BASE_URL}/api/guide/chapters",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "chapters" in data
        assert "total_chapters" in data
        print("✓ Guide chapters still works")

    def test_library_works(self, api_client, auth_headers):
        """Existing /api/library works for normal users"""
        response = api_client.get(
            f"{BASE_URL}/api/library",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print("✓ Library still works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
