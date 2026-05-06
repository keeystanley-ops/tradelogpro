import requests

url = "http://127.0.0.1:3001/api/auth/signup"
data = {
    "email": "test_bug_8@example.com",
    "password": "password123",
    "displayName": "Test User"
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=data, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response Body: '{response.text}'")
    
    if response.status_code == 200:
        print("Success!")
    else:
        print("Failed.")
except Exception as e:
    print(f"Request failed: {str(e)}")
