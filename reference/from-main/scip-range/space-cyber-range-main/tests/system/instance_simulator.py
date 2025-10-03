#!/usr/bin/env python3

import json
import time
import random
import argparse
import signal
import sys
import uuid
from datetime import datetime
import paho.mqtt.client as mqtt
import redis

class InstanceSimulator:
    def __init__(self, team_name):
        # Generate unique instance ID
        self.instance_id = str(uuid.uuid4())[:8]
        self.team_name = team_name
        self.start_time = time.time()

        # Initialize MQTT client - using same pattern as catalog simulator
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect("localhost", 1883, 60)
        self.mqtt_client.loop_start()

        # Initialize Redis connection
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)

        # Initialize state - flattened structure
        self.state = {
            "instance_status": "running",
            "instance_progress": 0,
            "team_name": team_name,
            "active_time": 0,

            # System metrics
            "gs_status": "operational",
            "gs_cpu": 45,
            "gs_memory_used": 2.1,
            "gs_memory_total": 4,
            "gs_frequency": 2200,
            "gs_power": 10,
            "gs_tracking": "active",

            "sat_status": "standby",
            "sat_cpu": 32,
            "sat_memory_used": 1.8,
            "sat_memory_total": 4,
            "sat_altitude": 500,
            "sat_inclination": 51.6,
            "sat_power_status": "nominal",
            "sat_comms_status": "standby",

            "rf_status": "active",
            "rf_cpu": 28,
            "rf_memory_used": 1.5,
            "rf_memory_total": 4,
            "rf_frequency": 2200,
            "rf_power": -70,
            "rf_interference_active": False,
            "rf_interference_type": "none",
            "rf_interference_strength": 0,

            # Current stage tracking
            "current_stage": "Ground Station Setup",
            "stage_progress": 0,
            "current_task": "gs_config",
            "task_progress": 0,
            "task_status": "in_progress"
        }

        # Control flag for simulation loop
        self.running = True

        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle cleanup on shutdown"""
        print("\nShutting down instance simulator...")
        self.running = False
        self.mqtt_client.loop_stop()
        sys.exit(0)

    def _update_system_metrics(self):
        """Update system metrics"""
        # Update Ground Station
        self.state["gs_cpu"] = min(95, max(5, self.state["gs_cpu"] + random.uniform(-5, 5)))
        self.state["gs_memory_used"] = min(self.state["gs_memory_total"],
            max(0.1, self.state["gs_memory_used"] + random.uniform(-0.2, 0.2)))
        self.state["gs_power"] += random.uniform(-0.5, 0.5)

        # Update Satellite
        self.state["sat_cpu"] = min(95, max(5, self.state["sat_cpu"] + random.uniform(-5, 5)))
        self.state["sat_memory_used"] = min(self.state["sat_memory_total"],
            max(0.1, self.state["sat_memory_used"] + random.uniform(-0.2, 0.2)))
        self.state["sat_altitude"] += random.uniform(-0.1, 0.1)
        if random.random() < 0.05:
            self.state["sat_comms_status"] = random.choice(["standby", "active", "degraded"])

        # Update RF Simulator
        self.state["rf_cpu"] = min(95, max(5, self.state["rf_cpu"] + random.uniform(-5, 5)))
        self.state["rf_memory_used"] = min(self.state["rf_memory_total"],
            max(0.1, self.state["rf_memory_used"] + random.uniform(-0.2, 0.2)))
        if random.random() < 0.1:
            self.state["rf_interference_active"] = not self.state["rf_interference_active"]
            if self.state["rf_interference_active"]:
                self.state["rf_interference_type"] = random.choice(["noise", "jamming", "multipath"])
                self.state["rf_interference_strength"] = random.uniform(-90, -60)

    def _update_progress(self):
        """Update stage and task progress"""
        # Update task progress
        if self.state["task_status"] == "in_progress":
            self.state["task_progress"] = min(100, self.state["task_progress"] + random.uniform(0, 5))
            if self.state["task_progress"] >= 100:
                self.state["task_status"] = "completed"
                # Move to next task
                if self.state["current_task"] == "gs_config":
                    self.state["current_task"] = "rf_chain"
                    self.state["task_progress"] = 0
                    self.state["task_status"] = "in_progress"
                elif self.state["current_task"] == "rf_chain":
                    self.state["current_task"] = "tracking_init"
                    self.state["task_progress"] = 0
                    self.state["task_status"] = "in_progress"
                elif self.state["current_task"] == "tracking_init":
                    # Move to next stage
                    self.state["current_stage"] = "Satellite Acquisition"
                    self.state["current_task"] = "tle_lookup"
                    self.state["task_progress"] = 0
                    self.state["task_status"] = "in_progress"
                    self.state["stage_progress"] = 0

        # Update stage progress based on tasks
        if self.state["current_stage"] == "Ground Station Setup":
            if self.state["current_task"] == "rf_chain":
                self.state["stage_progress"] = 33
            elif self.state["current_task"] == "tracking_init":
                self.state["stage_progress"] = 66
            elif self.state["task_status"] == "completed":
                self.state["stage_progress"] = 100

        # Update overall progress
        if self.state["current_stage"] == "Ground Station Setup":
            self.state["instance_progress"] = self.state["stage_progress"] / 2
        else:
            self.state["instance_progress"] = 50 + (self.state["stage_progress"] / 2)

    def _publish_metrics(self):
        """Publish all metrics to MQTT - using simpler direct publishing"""
        base_topic = f"range/instance/{self.instance_id}"

        # Publish basic instance info
        print(f"Publishing to {base_topic}/status: {self.state['instance_status']}")
        self.mqtt_client.publish(f"{base_topic}/status", json.dumps(self.state["instance_status"]))
        
        print(f"Publishing to {base_topic}/progress: {self.state['instance_progress']}")
        self.mqtt_client.publish(f"{base_topic}/progress", json.dumps(self.state["instance_progress"]))

        # Publish Ground Station metrics
        gs_data = {
            "status": self.state["gs_status"],
            "cpu": self.state["gs_cpu"],
            "memory": {
                "used": self.state["gs_memory_used"],
                "total": self.state["gs_memory_total"]
            },
            "parameters": {
                "frequency": self.state["gs_frequency"],
                "power": self.state["gs_power"],
                "tracking": self.state["gs_tracking"]
            }
        }
        print(f"Publishing to {base_topic}/assets/ground_station/status: {gs_data}")
        self.mqtt_client.publish(f"{base_topic}/assets/ground_station/status", json.dumps(gs_data))

        # Publish Satellite metrics
        sat_data = {
            "status": self.state["sat_status"],
            "cpu": self.state["sat_cpu"],
            "memory": {
                "used": self.state["sat_memory_used"],
                "total": self.state["sat_memory_total"]
            },
            "orbital": {
                "altitude": self.state["sat_altitude"],
                "inclination": self.state["sat_inclination"]
            },
            "telemetry": {
                "power_status": self.state["sat_power_status"],
                "comms_status": self.state["sat_comms_status"]
            }
        }
        print(f"Publishing to {base_topic}/assets/satellite/status: {sat_data}")
        self.mqtt_client.publish(f"{base_topic}/assets/satellite/status", json.dumps(sat_data))

        # Publish RF Simulator metrics
        rf_data = {
            "status": self.state["rf_status"],
            "cpu": self.state["rf_cpu"],
            "memory": {
                "used": self.state["rf_memory_used"],
                "total": self.state["rf_memory_total"]
            },
            "params": {
                "frequency": self.state["rf_frequency"],
                "power": self.state["rf_power"],
                "interference": {
                    "active": self.state["rf_interference_active"],
                    "type": self.state["rf_interference_type"],
                    "strength": self.state["rf_interference_strength"]
                }
            }
        }
        print(f"Publishing to {base_topic}/assets/rf_simulator/status: {rf_data}")
        self.mqtt_client.publish(f"{base_topic}/assets/rf_simulator/status", json.dumps(rf_data))

        # Publish stage and task info
        stage_data = {
            "name": self.state["current_stage"],
            "progress": self.state["stage_progress"],
            "current_task": self.state["current_task"],
            "task_progress": self.state["task_progress"],
            "task_status": self.state["task_status"]
        }
        print(f"Publishing to {base_topic}/stages/current: {stage_data}")
        self.mqtt_client.publish(f"{base_topic}/stages/current", json.dumps(stage_data))

        # Update Redis state
        self.redis_client.hset("range:instances", self.instance_id, json.dumps(self.state))

    def run(self, duration_minutes: int = None):
        """Run the instance simulator"""
        start_time = time.time()

        print(f"Starting instance simulator for team: {self.team_name}")
        print(f"Instance ID: {self.instance_id}")
        print(f"Duration: {'Indefinite' if duration_minutes is None else f'{duration_minutes} minutes'}")

        try:
            while self.running:
                # Check if duration has elapsed
                if duration_minutes is not None:
                    if (time.time() - start_time) > (duration_minutes * 60):
                        print("\nSimulation duration completed")
                        break

                # Update active time
                self.state["active_time"] = int(time.time() - start_time)

                # Update all metrics
                self._update_system_metrics()
                self._update_progress()

                # Publish updates
                self._publish_metrics()

                # Wait before next update
                time.sleep(1)

        except KeyboardInterrupt:
            print("\nSimulator stopped by user")
        finally:
            self.mqtt_client.loop_stop()
            print("Instance simulator shutdown complete")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Instance Simulator')
    parser.add_argument('-n', '--team', required=True, help='Team name for this instance')
    parser.add_argument('-t', '--time', type=int, help='Duration in minutes to run the simulator')
    args = parser.parse_args()

    simulator = InstanceSimulator(args.team)
    simulator.run(args.time)
