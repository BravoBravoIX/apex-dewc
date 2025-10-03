#!/usr/bin/env python3
import requests
import json

# First, get the current timeline
response = requests.get("http://localhost:8001/api/v1/timelines/maritime-crisis-scenario/blue")
timeline = response.json()

print("Original timeline first inject time:", timeline['injects'][0]['time'])

# Modify the first inject's time
timeline['injects'][0]['time'] = 15

# Update the timeline
update_response = requests.put(
    "http://localhost:8001/api/v1/timelines/maritime-crisis-scenario/blue",
    json=timeline
)

print("Update response:", update_response.json())

# Verify the change
verify_response = requests.get("http://localhost:8001/api/v1/timelines/maritime-crisis-scenario/blue")
updated_timeline = verify_response.json()
print("Updated timeline first inject time:", updated_timeline['injects'][0]['time'])