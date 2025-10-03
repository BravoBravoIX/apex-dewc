import paho.mqtt.client as mqtt
import json
import time
import os

# MQTT setup
client = mqtt.Client()
client.connect("localhost", 1883, 60)

def publish_message(topic, message):
    """Publish message and print for debugging"""
    print(f"Publishing to {topic}: {message}")
    client.publish(topic, json.dumps(message))

try:
    # Start MQTT loop
    client.loop_start()

    # Simulate scenario list updates
    scenarios = [
        {
            "id": "sat-ground-link-001",
            "name": "Satellite Ground Link Training",
            "category": "Satellite Operations",
            "difficulty": "Intermediate",
            "estimatedDuration": "2 hours",
            "tags": ["RF Communication", "Interference Mitigation"]
        },
        {
            "id": "network-defence-002",
            "name": "Network Defence Scenario",
            "category": "Cybersecurity",
            "difficulty": "Advanced",
            "estimatedDuration": "3 hours",
            "tags": ["Threat Detection", "Response"]
        },
        {
            "id": "rf-jamming-003",
            "name": "RF Jamming Mitigation",
            "category": "Electronic Warfare",
            "difficulty": "Expert",
            "estimatedDuration": "4 hours",
            "tags": ["Signal Processing", "Interference"]
        }
    ]
    publish_message("scenarios/list", scenarios)

    # Simulate scenario selection
    selected_scenario = "sat-ground-link-001"
    publish_message("scenarios/selected", selected_scenario)

    # Load scenario details from JSON files
    json_directory = "scenarios/templates/"
    for scenario_id in [scenario["id"] for scenario in scenarios]:
        file_path = os.path.join(json_directory, f"{scenario_id}.json")
        with open(file_path, "r") as file:
            scenario_details = json.load(file)
            publish_message(f"scenarios/{scenario_id}", scenario_details)

    # Keep the script running
    while True:
        time.sleep(1)

except KeyboardInterrupt:
    print("Stopping publisher...")
    client.loop_stop()
    client.disconnect()