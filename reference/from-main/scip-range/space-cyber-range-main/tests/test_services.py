import redis
import json
import time

# Load scenario file
with open('/app/data/scenarios/default_scenario.json', 'r') as f:
    scenario_data = json.load(f)

# Connect to Redis
r = redis.Redis(host='redis', port=6379, decode_responses=True)

# Store scenario data
r.set('scenario:sat-ground-link-001', json.dumps(scenario_data))

print("Scenario data loaded into Redis")
