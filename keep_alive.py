import requests

url = "https://elite-lifts.onrender.com/api/status"

try:
    response = requests.get(url, timeout=30)
    print("Server status:", response.status_code)
except requests.exceptions.RequestException as e:
    print("Error:", e)