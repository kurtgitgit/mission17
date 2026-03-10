import requests

url = "http://localhost:5000/predict"
file_path = "debug_bias_mitigation.jpg"

print("--- First Upload ---")
with open(file_path, "rb") as f:
    r = requests.post(url, files={"file": f})
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

print("\n--- Second Upload ---")
with open(file_path, "rb") as f:
    r = requests.post(url, files={"file": f})
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
