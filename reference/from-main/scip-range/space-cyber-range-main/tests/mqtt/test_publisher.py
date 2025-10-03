import paho.mqtt.client as mqtt
import json
import time
import random

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

    # Simulate range status updates
    while True:
        # Range health status
        range_status = {
            "service_status": "operational",
            "database": "connected",
            "network_latency": random.randint(30, 60)
        }
        publish_message("range/status/health", range_status)

        # Range resources
        resources = {
            "cpu": random.randint(40, 80),
            "memory": random.randint(6, 14),
            "storage": random.randint(400, 800),
            "network": random.randint(400, 600)
        }
        publish_message("range/status/resources", resources)

        # Instance status (simulate one instance)
        instance_id = "instance-sat-ground-link-001-team-alpha"
        instance_status = {
            "status": "running",
            "progress": random.randint(0, 100),
            "current_stage": "Ground Station Setup",
            "stage_progress": random.randint(0, 100)
        }
        publish_message(f"instance/{instance_id}/status", instance_status)

        # RF Parameters (simulate changes)
        rf_params = {
            "frequency": 2200 + random.randint(-10, 10),
            "power": -30 + random.randint(-5, 5),
            "noise_floor": -120 + random.randint(-5, 5)
        }
        publish_message(f"instance/{instance_id}/assets/ground_station/rf_params", rf_params)

        # Team progress
        team_progress = {
            "team_id": "team-alpha",
            "progress": random.randint(0, 100),
            "active_time": "1h 45m",
            "current_task": "Configure Ground Station Parameters"
        }
        publish_message("teams/team-alpha/progress", team_progress)

        # Wait before next update
        time.sleep(5)

except KeyboardInterrupt:
    print("Stopping publisher...")
    client.loop_stop()
    client.disconnect()
