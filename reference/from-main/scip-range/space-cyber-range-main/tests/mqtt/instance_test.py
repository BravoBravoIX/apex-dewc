import paho.mqtt.client as mqtt
import json
import time
import threading
from datetime import datetime, timezone
import random

# MQTT setup
client = mqtt.Client()
client.connect("localhost", 1883, 60)
client.loop_start()

def publish_message(topic, message):
    """Publish message and print for debugging"""
    print(f"Publishing to {topic}: {json.dumps(message)}")
    client.publish(topic, json.dumps(message))

# Define multiple instances with the same scenario_name and same total_tasks
instances = [
    {
        "instance_id": "instance-001",
        "team_id": "Team Alpha",
        "scenario_name": "Satellite Ground Link",
        "progress_rate": random.uniform(1.5, 3.0),  # Random progress rate
    },
    {
        "instance_id": "instance-002",
        "team_id": "Team Beta",
        "scenario_name": "Satellite Ground Link",
        "progress_rate": random.uniform(2.0, 4.0),  # Random progress rate
    },
    {
        "instance_id": "instance-003",
        "team_id": "Team Rockstar",
        "scenario_name": "Satellite Ground Link",
        "progress_rate": random.uniform(1.0, 2.5),  # Random progress rate
    },
]

# Define total tasks and scenario stages
total_tasks = 9
stages = [
    {
        "name": "Ground Station Setup",
        "description": "Initialize and configure ground station systems",
        "completion_criteria": "All systems operational and calibrated",
    },
    {
        "name": "Satellite Acquisition",
        "description": "Establish initial satellite contact",
        "completion_criteria": "Two-way communication established",
    },
    {
        "name": "Communications",
        "description": "Perform basic satellite operations",
        "completion_criteria": "All commanded operations completed successfully",
    },
]

def simulate_instance(instance):
    """Simulate an individual instance's lifecycle."""
    instance_id = instance["instance_id"]
    team_id = instance["team_id"]
    scenario_name = instance["scenario_name"]
    progress_rate = instance["progress_rate"]

    # Dynamic start_time set to current UTC time
    start_time = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat()

    # Initial instance state
    instance_data = {
        "instance_id": instance_id,
        "team_id": team_id,
        "scenario_name": scenario_name,
        "status": "running",
        "start_time": start_time,
        "total_tasks": total_tasks,
        "completed_tasks": 0,
    }

    # Publish instance status
    publish_message(f"instance/{instance_id}/status", instance_data)

    # Publish scenario stages
    for stage in stages:
        stage_data = {
            "instance_id": instance_id,
            "stage_name": stage["name"],
            "description": stage["description"],
            "completion_criteria": stage["completion_criteria"],
            "completed": False,
        }
        publish_message(f"instance/{instance_id}/stage", stage_data)
        time.sleep(1)  # Simulate delay for publishing stages

    # Simulate task completion and progress
    completed = 0
    for stage_index, stage in enumerate(stages):
        while completed < (total_tasks // len(stages)) * (stage_index + 1):
            time.sleep(progress_rate)  # Vary task completion rate per team
            completed += 1

            # Publish task completion updates
            task_update = {
                "instance_id": instance_id,
                "completed_tasks": completed,
                "total_tasks": total_tasks,
                "last_task": f"Task {completed}",
            }
            publish_message(f"instance/{instance_id}/task_complete", task_update)

            # Periodically update instance status and stage completion
            if completed % 3 == 0 or completed == total_tasks:
                instance_data["completed_tasks"] = completed
                instance_data["status"] = "completed" if completed == total_tasks else "running"
                publish_message(f"instance/{instance_id}/status", instance_data)

        # Mark stage as completed
        stage_data = {
            "instance_id": instance_id,
            "stage_name": stage["name"],
            "description": stage["description"],
            "completion_criteria": stage["completion_criteria"],
            "completed": True,
        }
        publish_message(f"instance/{instance_id}/stage", stage_data)

    # Keep publishing completed status periodically after all tasks are done
    while True:
        time.sleep(10)
        publish_message(f"instance/{instance_id}/status", instance_data)

def run_simulation():
    """Run simulations for all instances concurrently."""
    threads = []
    for instance in instances:
        thread = threading.Thread(target=simulate_instance, args=(instance,))
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()

try:
    print("Starting instances simulation...")
    run_simulation()

except KeyboardInterrupt:
    print("\nStopping simulation...")
    client.loop_stop()
    client.disconnect()
