import json
import redis
import os

def load_scenario_to_redis():
    # Connect to Redis
    r = redis.Redis(host='redis', port=6379, decode_responses=True)
    
    # Load scenario file
    scenario_path = '/app/data/scenarios/default_scenario.json'
    with open(scenario_path, 'r') as f:
        scenario_data = json.load(f)
    
    # Store in Redis with a unique key
    scenario_id = scenario_data['scenario']['id']
    r.set(f'scenario:{scenario_id}', json.dumps(scenario_data))
    
    print(f"Loaded scenario {scenario_id} to Redis")

if __name__ == '__main__':
    load_scenario_to_redis()
