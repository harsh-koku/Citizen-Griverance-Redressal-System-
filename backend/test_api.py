import requests

print("Testing root endpoint...")
try:
    response = requests.get("http://localhost:8000/", timeout=5)
    print(f"Status: {response.status_code}")
    print(response.text)
except Exception as e:
    print(e)
