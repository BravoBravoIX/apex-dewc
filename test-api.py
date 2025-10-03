#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

# Test data
data = {
    "id": "timeline-blue",
    "name": "Test Timeline",
    "description": "Test",
    "version": "1.0.0",
    "injects": []
}

# Make request
url = "http://localhost:8001/api/v1/timelines/maritime-crisis-scenario/blue"
req = urllib.request.Request(url,
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='PUT')

try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.reason}")
    print("Response:", e.read().decode())