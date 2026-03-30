"""
AI Chat Module Tests - Sundar Ghar AI Saathi
Tests for POST /api/chat/send, GET /api/chat/history, DELETE /api/chat/clear
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"ai_test_{int(time.time())}@test.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "AI Test User"
TEST_PHONE = "9876543210"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Create test user and get auth token"""
    # Signup new user
    signup_response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
        "name": TEST_NAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "phone": TEST_PHONE
    })
    
    if signup_response.status_code == 200:
        return signup_response.json().get("token")
    
    # If signup fails (user exists), try login
    login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if login_response.status_code == 200:
        return login_response.json().get("token")
    
    pytest.skip("Could not authenticate - skipping AI chat tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestAIChatSend:
    """Tests for POST /api/chat/send endpoint"""
    
    def test_send_message_requires_auth(self, api_client):
        """Test that sending message without auth returns 401/403"""
        # Remove auth header for this test
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/chat/send",
            json={"message": "Hello"},
            headers=headers
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Unauthenticated request correctly rejected with {response.status_code}")
    
    def test_send_empty_message_rejected(self, authenticated_client):
        """Test that empty message returns 400"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"message": ""}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "empty" in data.get("detail", "").lower() or "cannot" in data.get("detail", "").lower()
        print(f"✓ Empty message rejected: {data.get('detail')}")
    
    def test_send_whitespace_only_message_rejected(self, authenticated_client):
        """Test that whitespace-only message returns 400"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"message": "   "}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Whitespace-only message rejected")
    
    def test_send_message_over_500_chars_rejected(self, authenticated_client):
        """Test that message over 500 characters returns 400"""
        long_message = "a" * 501
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"message": long_message}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "500" in data.get("detail", "") or "long" in data.get("detail", "").lower()
        print(f"✓ Message over 500 chars rejected: {data.get('detail')}")
    
    def test_send_valid_message_returns_response(self, authenticated_client):
        """Test that valid message returns AI response with correct structure"""
        # Use a simple construction-related question
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"message": "Cement ki quality kaise check karein?"},
            timeout=60  # AI responses can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response missing 'id'"
        assert "message" in data, "Response missing 'message'"
        assert "response" in data, "Response missing 'response'"
        assert "created_at" in data, "Response missing 'created_at'"
        
        # Verify data types
        assert isinstance(data["id"], str), "id should be string"
        assert isinstance(data["message"], str), "message should be string"
        assert isinstance(data["response"], str), "response should be string"
        assert len(data["response"]) > 0, "AI response should not be empty"
        
        print(f"✓ Valid message sent successfully")
        print(f"  - Message: {data['message'][:50]}...")
        print(f"  - Response: {data['response'][:100]}...")
        print(f"  - ID: {data['id']}")


class TestAIChatHistory:
    """Tests for GET /api/chat/history endpoint"""
    
    def test_get_history_requires_auth(self, api_client):
        """Test that getting history without auth returns 401/403"""
        headers = {"Content-Type": "application/json"}
        response = requests.get(
            f"{BASE_URL}/api/chat/history",
            headers=headers
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Unauthenticated history request rejected with {response.status_code}")
    
    def test_get_history_returns_messages(self, authenticated_client):
        """Test that history returns messages array"""
        response = authenticated_client.get(f"{BASE_URL}/api/chat/history")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "messages" in data, "Response missing 'messages'"
        assert isinstance(data["messages"], list), "messages should be a list"
        
        # Should have at least one message from previous test
        if len(data["messages"]) > 0:
            msg = data["messages"][0]
            assert "id" in msg, "Message missing 'id'"
            assert "message" in msg, "Message missing 'message'"
            assert "response" in msg, "Message missing 'response'"
            assert "created_at" in msg, "Message missing 'created_at'"
            print(f"✓ History returned {len(data['messages'])} messages")
        else:
            print("✓ History returned empty (no messages yet)")
    
    def test_history_returns_max_10_messages(self, authenticated_client):
        """Test that history returns at most 10 messages"""
        response = authenticated_client.get(f"{BASE_URL}/api/chat/history")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["messages"]) <= 10, f"Expected max 10 messages, got {len(data['messages'])}"
        print(f"✓ History respects 10 message limit (returned {len(data['messages'])})")


class TestAIChatClear:
    """Tests for DELETE /api/chat/clear endpoint"""
    
    def test_clear_requires_auth(self, api_client):
        """Test that clearing chat without auth returns 401/403"""
        headers = {"Content-Type": "application/json"}
        response = requests.delete(
            f"{BASE_URL}/api/chat/clear",
            headers=headers
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Unauthenticated clear request rejected with {response.status_code}")
    
    def test_clear_chat_success(self, authenticated_client):
        """Test that clearing chat returns success"""
        response = authenticated_client.delete(f"{BASE_URL}/api/chat/clear")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == True, "Expected success: true"
        print(f"✓ Chat cleared successfully: {data.get('message')}")
    
    def test_history_empty_after_clear(self, authenticated_client):
        """Test that history is empty after clearing"""
        response = authenticated_client.get(f"{BASE_URL}/api/chat/history")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["messages"]) == 0, f"Expected 0 messages after clear, got {len(data['messages'])}"
        print("✓ History is empty after clear")


class TestAIChatIntegration:
    """Integration tests for full chat flow"""
    
    def test_full_chat_flow(self, authenticated_client):
        """Test complete flow: send message -> check history -> clear -> verify empty"""
        # 1. Send a message
        send_response = authenticated_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"message": "Foundation ke liye soil test kab karein?"},
            timeout=60
        )
        assert send_response.status_code == 200, f"Send failed: {send_response.text}"
        sent_data = send_response.json()
        print(f"✓ Step 1: Message sent, got response")
        
        # 2. Check history contains the message
        history_response = authenticated_client.get(f"{BASE_URL}/api/chat/history")
        assert history_response.status_code == 200
        history_data = history_response.json()
        assert len(history_data["messages"]) >= 1, "History should have at least 1 message"
        print(f"✓ Step 2: History has {len(history_data['messages'])} message(s)")
        
        # 3. Clear chat
        clear_response = authenticated_client.delete(f"{BASE_URL}/api/chat/clear")
        assert clear_response.status_code == 200
        print("✓ Step 3: Chat cleared")
        
        # 4. Verify history is empty
        final_history = authenticated_client.get(f"{BASE_URL}/api/chat/history")
        assert final_history.status_code == 200
        assert len(final_history.json()["messages"]) == 0
        print("✓ Step 4: History verified empty")
        
        print("✓ Full chat flow completed successfully!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
