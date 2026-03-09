import requests
import threading
import time
import os

URL = 'http://localhost:5000/predict'
PENDING_COUNT = 5

# Find a test image
UPLOADS_DIR = 'uploads'
test_image_path = None

if os.path.exists(UPLOADS_DIR):
    for f in os.listdir(UPLOADS_DIR):
        if f.endswith('.jpg'):
            test_image_path = os.path.join(UPLOADS_DIR, f)
            break

if not test_image_path:
    # Create a dummy image file with junk data if no real image exists
    test_image_path = 'dummy_test.jpg'
    with open(test_image_path, 'wb') as f:
        f.write(b'\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00')

def make_request(request_id, results):
    try:
        with open(test_image_path, 'rb') as img_file:
            files = {'file': ('proof.jpg', img_file, 'image/jpeg')}
            
            # Start timer for this specific request
            start_req = time.time()
            response = requests.post(URL, files=files)
            end_req = time.time()
            
            if response.status_code == 200:
                results['success'] += 1
                # print(f"Request {request_id} SUCCESS in {end_req - start_req:.2f}s")
            else:
                results['failed'] += 1
                # print(f"Request {request_id} FAILED ({response.status_code}) in {end_req - start_req:.2f}s")
                
    except Exception as e:
        results['failed'] += 1
        # print(f"Request {request_id} ERROR: {str(e)}")

print("\n🤖 --- AI CONCURRENCY BENCHMARK ---")

# =========================================================================
# TEST 1: The "Bad" Way (Parallel requests simulating Promise.all)
# =========================================================================
print(f"\n[TEST 1: THE BOTTLENECK] Hitting the AI Server with {PENDING_COUNT} parallel requests (Simulating Promise.all)...")

results_parallel = {'success': 0, 'failed': 0}
threads = []

start_parallel = time.time()

# Fire all requests at the exact same time
for i in range(PENDING_COUNT):
    t = threading.Thread(target=make_request, args=(i, results_parallel))
    threads.append(t)
    t.start()

# Wait for all to finish
for t in threads:
    t.join()

end_parallel = time.time()

print(f"   Time taken: {(end_parallel - start_parallel) * 1000:.2f} ms")
print(f"   Successful analyses: {results_parallel['success']}")
print(f"   Failed inferences: {results_parallel['failed']}")

if results_parallel['failed'] > 0:
    print("   ⚠️ Look! The AI server dropped requests/crashed under parallel load!")

time.sleep(2) # Let the server catch its breath

# =========================================================================
# TEST 2: The "Good" Way (Sequential requests simulating the fix)
# =========================================================================
print(f"\n[TEST 2: THE FIX] Hitting the AI Server with {PENDING_COUNT} sequential requests...")

results_sequential = {'success': 0, 'failed': 0}
start_sequential = time.time()

# Fire requests one after the other
for i in range(PENDING_COUNT):
    make_request(i, results_sequential)

end_sequential = time.time()

print(f"   Time taken: {(end_sequential - start_sequential) * 1000:.2f} ms")
print(f"   Successful analyses: {results_sequential['success']}")
print(f"   Failed inferences: {results_sequential['failed']}")

print("\n✅ Benchmark complete.")
