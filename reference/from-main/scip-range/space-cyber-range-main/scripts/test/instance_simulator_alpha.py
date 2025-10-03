#!/usr/bin/env python3

import json
import time
import random
import argparse
import signal
import sys
import asyncio
import requests
from datetime import datetime
import paho.mqtt.client as mqtt
import redis

class TeamInstanceSimulator:
    def __init__(self, team_name):
        self.team_id = team_name.lower()
        self.team_name = f"Team {team_name.capitalize()}"
        self.start_time = time.time()
        self.scenario_id = None

        # Initialize MQTT client
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect("localhost", 1883, 60)
        self.mqtt_client.loop_start()

        # Initialize Redis connection
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

        # Initialize task states
        self.tasks = [
            {"name": "Initialize Ground Station", "status": "in_progress"},
            {"name": "Configure RF Parameters", "status": "pending"},
            {"name": "Establish Link Budget", "status": "pending"},
            {"name": "Verify Communication Path", "status": "pending"}
        ]

        # Initialize state
        self.state = {
            "team_id": self.team_id,
            "team_name": self.team_name,
            "status": "initializing",
            "progress": 0,
            "start_time": self.start_time,
            "current_stage": "Ground Station Setup",
            "stage_progress": 0,
            "tasks": self.tasks,
            "assets": {
                "ground_station": {
                    "status": "operational",
                    "stats": {
                        "cpu": 45,
                        "memory": 60,
                        "storage": 30
                    },
                    "details": {
                        "frequency": "2.4 GHz",
                        "power": "10W",
                        "tracking": "Active"
                    }
                },
                "satellite": {
                    "status": "operational",
                    "stats": {
                        "cpu": 65,
                        "memory": 40,
                        "storage": 25
                    },
                    "details": {
                        "altitude": "500 km",
                        "inclination": "45°",
                        "power": "Nominal"
                    }
                },
                "rf_simulator": {
                    "status": "operational",
                    "stats": {
                        "cpu": 28,
                        "memory": 40,
                        "storage": 20
                    },
                    "details": {
                        "frequency": "2.2 GHz",
                        "power": "-70 dBm",
                        "interference": "None"
                    }
                }
            }
        }

        # Control flag
        self.running = True
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        print("\nShutting down simulator...")
        self.running = False
        self.mqtt_client.loop_stop()
        sys.exit(0)

    async def register_with_active_scenario(self):
        try:
            response = requests.get('http://localhost:4000/api/scenarios/active')
            if response.status_code != 200:
                raise Exception("Failed to get active scenario")
            
            data = response.json()
            if data.get('active') is False:
                raise Exception("No active scenario found")
            
            self.scenario_id = data['scenario_id']
            
            register_response = requests.post(
                f'http://localhost:4000/api/scenarios/{self.scenario_id}/instances',
                params={'team_id': self.team_id}
            )
            
            if register_response.status_code != 200:
                raise Exception("Failed to register instance")
            
            print(f"Successfully registered with scenario {self.scenario_id}")
            return True
            
        except Exception as e:
            print(f"Failed to register instance: {e}")
            return False

    def _update_progress(self):
        """Update progress and task status"""
        if self.state["status"] != "running":
            return

        # Update task progress
        for i, task in enumerate(self.tasks):
            if task["status"] == "in_progress":
                if random.random() < 0.05:  # 5% chance to complete current task
                    task["status"] = "completed"
                    if i + 1 < len(self.tasks):
                        self.tasks[i + 1]["status"] = "in_progress"
                break

        # Calculate progress based on completed tasks
        completed_tasks = sum(1 for task in self.tasks if task["status"] == "completed")
        self.state["progress"] = (completed_tasks / len(self.tasks)) * 100
        
        # Update stage progress
        self.state["stage_progress"] = self.state["progress"]

    def _update_assets(self):
        """Update asset metrics"""
        for asset_type, asset in self.state["assets"].items():
            # Update CPU (random fluctuation)
            asset["stats"]["cpu"] = min(95, max(5, 
                asset["stats"]["cpu"] + random.uniform(-5, 5)))
            
            # Update memory (smaller fluctuation)
            asset["stats"]["memory"] = min(95, max(5, 
                asset["stats"]["memory"] + random.uniform(-2, 2)))
            
            # Update storage (very small increase)
            asset["stats"]["storage"] = min(95, max(5, 
                asset["stats"]["storage"] + random.uniform(0, 0.1)))

            # Asset-specific updates
            if asset_type == "satellite":
                altitude = float(asset["details"]["altitude"].split()[0])
                asset["details"]["altitude"] = f"{altitude + random.uniform(-0.1, 0.1)} km"

            elif asset_type == "ground_station":
                power = float(asset["details"]["power"].strip("W"))
                asset["details"]["power"] = f"{power + random.uniform(-0.5, 0.5)}W"

    def _publish_metrics(self):
        if not self.scenario_id:
            return

        base_topic = f"range/scenarios/{self.scenario_id}/instances/{self.team_id}"

        # Publish team status
        status_data = {
            "team_id": self.team_id,
            "team_name": self.team_name,
            "status": self.state["status"],
            "progress": self.state["progress"],
            "current_stage": self.state["current_stage"],
            "stage_progress": self.state["stage_progress"],
            "tasks": self.tasks,
            "active_time": int(time.time() - self.start_time)
        }
        self.mqtt_client.publish(f"{base_topic}/status", json.dumps(status_data))

        # Publish asset status
        for asset_name, asset_data in self.state["assets"].items():
            self.mqtt_client.publish(
                f"{base_topic}/assets/{asset_name}",
                json.dumps(asset_data)
            )

        # Update Redis state
        try:
            instance_key = f"active_scenario:{self.scenario_id}:instance:{self.team_id}"
            self.redis_client.set(instance_key, json.dumps(self.state))
        except Exception as e:
            print(f"Redis update failed: {e}")

    async def run(self, duration_minutes: int = None):
        print(f"Starting simulator for {self.team_name}")
        
        if not await self.register_with_active_scenario():
            print("Failed to register with active scenario. Exiting.")
            return

        self.state["status"] = "running"
        start_time = time.time()

        try:
            while self.running:
                if duration_minutes and (time.time() - start_time) > (duration_minutes * 60):
                    break

                self._update_progress()
                self._update_assets()
                self._publish_metrics()

                await asyncio.sleep(1)

        except KeyboardInterrupt:
            print("\nStopped by user")
        finally:
            self.state["status"] = "stopped"
            self._publish_metrics()
            self.mqtt_client.loop_stop()
            print("Shutdown complete")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Team Instance Simulator')
    parser.add_argument('-t', '--time', type=int, help='Duration in minutes')
    args = parser.parse_args()

    # Hardcoded for this instance
    simulator = TeamInstanceSimulator("alpha")  # Change to "beta" for beta instance
    asyncio.run(simulator.run(args.time))
