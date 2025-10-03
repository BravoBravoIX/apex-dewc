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

class InstanceSimulator:
    def __init__(self, team_name):
        self.team_id = team_name.lower()  # Use lowercase team name as ID
        self.team_name = f"Team {team_name.capitalize()}"
        self.start_time = time.time()
        self.scenario_id = None  # Will be set after fetching active scenario

        # Initialize MQTT client
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect("localhost", 1883, 60)
        self.mqtt_client.loop_start()

        # Initialize Redis connection
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

        # Initialize state
        self.state = {
            "team_id": self.team_id,
            "team_name": self.team_name,
            "status": "initializing",
            "progress": 0,
            "start_time": self.start_time,
            "current_stage": "Ground Station Setup",
            "stage_progress": 0,
            "assets": {
                "ground_station": {
                    "status": "initializing",
                    "cpu": 45,
                    "memory": {"used": 2.1, "total": 4},
                    "parameters": {
                        "frequency": 2200,
                        "power": 10,
                        "tracking": "active"
                    }
                },
                "satellite": {
                    "status": "initializing",
                    "cpu": 32,
                    "memory": {"used": 1.8, "total": 4},
                    "orbital": {
                        "altitude": 500,
                        "inclination": 51.6
                    },
                    "telemetry": {
                        "power_status": "nominal",
                        "comms_status": "standby"
                    }
                },
                "rf_simulator": {
                    "status": "initializing",
                    "cpu": 28,
                    "memory": {"used": 1.5, "total": 4},
                    "params": {
                        "frequency": 2200,
                        "power": -70,
                        "interference": {
                            "active": False,
                            "type": "none",
                            "strength": 0
                        }
                    }
                }
            }
        }

        # Control flag
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

    async def register_with_active_scenario(self):
        """Register this instance with the active scenario"""
        try:
            # Get active scenario
            response = requests.get('http://localhost:4000/api/scenarios/active')
            if response.status_code != 200:
                raise Exception("Failed to get active scenario")
            
            data = response.json()
            if data.get('active') is False:
                raise Exception("No active scenario found")
            
            self.scenario_id = data['scenario_id']
            
            # Register instance
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

    def _update_system_metrics(self):
        """Update system metrics"""
        # Update Ground Station
        gs = self.state["assets"]["ground_station"]
        gs["cpu"] = min(95, max(5, gs["cpu"] + random.uniform(-5, 5)))
        gs["memory"]["used"] = min(gs["memory"]["total"],
            max(0.1, gs["memory"]["used"] + random.uniform(-0.2, 0.2)))
        gs["parameters"]["power"] += random.uniform(-0.5, 0.5)
        gs["status"] = "operational"

        # Update Satellite
        sat = self.state["assets"]["satellite"]
        sat["cpu"] = min(95, max(5, sat["cpu"] + random.uniform(-5, 5)))
        sat["memory"]["used"] = min(sat["memory"]["total"],
            max(0.1, sat["memory"]["used"] + random.uniform(-0.2, 0.2)))
        sat["orbital"]["altitude"] += random.uniform(-0.1, 0.1)
        if random.random() < 0.05:
            sat["telemetry"]["comms_status"] = random.choice(["standby", "active", "degraded"])
        sat["status"] = "operational"

        # Update RF Simulator
        rf = self.state["assets"]["rf_simulator"]
        rf["cpu"] = min(95, max(5, rf["cpu"] + random.uniform(-5, 5)))
        rf["memory"]["used"] = min(rf["memory"]["total"],
            max(0.1, rf["memory"]["used"] + random.uniform(-0.2, 0.2)))
        if random.random() < 0.1:
            rf["params"]["interference"]["active"] = not rf["params"]["interference"]["active"]
            if rf["params"]["interference"]["active"]:
                rf["params"]["interference"]["type"] = random.choice(["noise", "jamming", "multipath"])
                rf["params"]["interference"]["strength"] = random.uniform(-90, -60)
        rf["status"] = "operational"

    def _update_progress(self):
        """Update progress tracking"""
        # Simulate progress increase
        if self.state["status"] == "running":
            self.state["progress"] = min(100, self.state["progress"] + random.uniform(0, 0.5))
            self.state["stage_progress"] = min(100, self.state["stage_progress"] + random.uniform(0, 1))

            # Update stages based on progress
            if self.state["progress"] >= 33 and self.state["current_stage"] == "Ground Station Setup":
                self.state["current_stage"] = "Satellite Acquisition"
                self.state["stage_progress"] = 0
            elif self.state["progress"] >= 66 and self.state["current_stage"] == "Satellite Acquisition":
                self.state["current_stage"] = "Mission Operations"
                self.state["stage_progress"] = 0

    def _publish_metrics(self):
        """Publish metrics to MQTT and update Redis"""
        if not self.scenario_id:
            return

        # Base topic for this instance
        base_topic = f"range/scenarios/{self.scenario_id}/instances/{self.team_id}"

        # Publish instance status
        status_data = {
            "team_id": self.team_id,
            "team_name": self.team_name,
            "status": self.state["status"],
            "progress": self.state["progress"],
            "current_stage": self.state["current_stage"],
            "stage_progress": self.state["stage_progress"]
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
        """Run the instance simulator"""
        print(f"Starting instance simulator for {self.team_name}")
        
        # Register with active scenario
        if not await self.register_with_active_scenario():
            print("Failed to register with active scenario. Exiting.")
            return

        self.state["status"] = "running"
        start_time = time.time()

        try:
            while self.running:
                # Check duration
                if duration_minutes and (time.time() - start_time) > (duration_minutes * 60):
                    print("\nSimulation duration completed")
                    break

                # Update metrics
                self._update_system_metrics()
                self._update_progress()
                self._publish_metrics()

                # Wait before next update
                await asyncio.sleep(1)

        except KeyboardInterrupt:
            print("\nSimulator stopped by user")
        finally:
            self.state["status"] = "stopped"
            self._publish_metrics()
            self.mqtt_client.loop_stop()
            print("Instance simulator shutdown complete")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Instance Simulator')
    parser.add_argument('-n', '--team', required=True, help='Team name (e.g., alpha, beta)')
    parser.add_argument('-t', '--time', type=int, help='Duration in minutes to run the simulator')
    args = parser.parse_args()

    simulator = InstanceSimulator(args.team)
    asyncio.run(simulator.run(args.time))