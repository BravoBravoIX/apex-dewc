#!/usr/bin/env python3

import json
import time
import random
import argparse
import signal
import sys
from datetime import datetime
import paho.mqtt.client as mqtt
import redis

class ScenarioCatalogSimulator:
    def __init__(self):
        # Initialize MQTT client
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect("localhost", 1883, 60)
        self.mqtt_client.loop_start()

        # Initialize Redis connection
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        
        # Initialize base scenarios
        self.scenarios = self._initialize_scenarios()
        
        # Initialize counters
        self.state = {
            "total": len(self.scenarios),
            "active": 2,
            "paused": 1
        }
        
        # Control flag for simulation loop
        self.running = True
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle cleanup on shutdown"""
        print("\nShutting down simulator...")
        self.running = False
        self.mqtt_client.loop_stop()
        sys.exit(0)

    def _initialize_scenarios(self):
        """Initialize the base scenarios"""
        scenario_templates = [
            {
                "id": "sat-ground-link-001",
                "name": "Satellite Ground Link Training",
                "version": "1.0",
                "category": "satellite_operations",
                "metadata": {
                    "description": "Training scenario for establishing and maintaining satellite communications while handling interference",
                    "difficulty": "intermediate",
                    "duration_estimate": "2 hours",
                    "max_instances": 5,
                    "prerequisites": [
                        "Basic RF knowledge",
                        "Satellite operations fundamentals",
                        "Ground station operations experience"
                    ],
                    "learning_objectives": [
                        "Configure ground station for satellite communication",
                        "Establish and maintain satellite links",
                        "Identify and mitigate RF interference",
                        "Perform basic satellite operations"
                    ]
                }
            },
            {
                "id": "network-defense-001",
                "name": "Network Defense Scenario",
                "version": "1.0",
                "category": "cybersecurity",
                "metadata": {
                    "description": "Defend satellite ground network from cyber attacks",
                    "difficulty": "advanced",
                    "duration_estimate": "3 hours",
                    "max_instances": 3,
                    "prerequisites": [
                        "Network security basics",
                        "Intrusion detection experience",
                        "Basic satellite communications"
                    ],
                    "learning_objectives": [
                        "Monitor network traffic",
                        "Detect anomalies",
                        "Implement security measures",
                        "Document incidents"
                    ]
                }
            },
            {
                "id": "jamming-mitigation-001",
                "name": "RF Jamming Mitigation",
                "version": "1.0",
                "category": "rf_operations",
                "metadata": {
                    "description": "Handle and mitigate various RF jamming scenarios",
                    "difficulty": "intermediate",
                    "duration_estimate": "1.5 hours",
                    "max_instances": 4,
                    "prerequisites": [
                        "RF fundamentals",
                        "Signal analysis experience",
                        "Basic mitigation techniques"
                    ],
                    "learning_objectives": [
                        "Identify jamming types",
                        "Analyze signal patterns",
                        "Apply countermeasures",
                        "Maintain communications"
                    ]
                }
            }
        ]
        
        # Store scenarios in Redis
        for scenario in scenario_templates:
            self.redis_client.hset(
                "scenarios:catalog",
                scenario["id"],
                json.dumps(scenario)
            )
        
        return scenario_templates

    def _update_scenario_counts(self):
        """Simulate changes in active/paused scenario counts"""
        # Occasionally modify active/paused counts
        if random.random() < 0.05:  # 5% chance each cycle
            change = random.choice([-1, 1])
            if change == 1 and (self.state["active"] + self.state["paused"]) < 8:
                if random.random() < 0.7:  # 70% chance of new active vs paused
                    self.state["active"] = min(6, self.state["active"] + 1)
                else:
                    self.state["paused"] = min(3, self.state["paused"] + 1)
            elif change == -1 and (self.state["active"] + self.state["paused"]) > 0:
                if self.state["active"] > 0 and random.random() < 0.7:
                    self.state["active"] = max(0, self.state["active"] - 1)
                elif self.state["paused"] > 0:
                    self.state["paused"] = max(0, self.state["paused"] - 1)

    def _publish_catalog(self):
        """Publish complete catalog data"""
        for scenario in self.scenarios:
            self.mqtt_client.publish(
                "range/scenarios/catalog/updates",
                json.dumps({
                    "type": "update",
                    "scenario": scenario
                })
            )

    def _publish_metrics(self):
        """Publish all metrics to MQTT and Redis"""
        # Publish scenario counts
        self.mqtt_client.publish("range/scenarios/total", json.dumps(self.state["total"]))
        self.mqtt_client.publish("range/scenarios/active", json.dumps(self.state["active"]))
        self.mqtt_client.publish("range/scenarios/paused", json.dumps(self.state["paused"]))
        
        # Publish full catalog regularly
        self.mqtt_client.publish(
            "range/scenarios/catalog/updates",
            json.dumps({
                "type": "refresh",
                "scenarios": {scenario["id"]: scenario for scenario in self.scenarios}
            })
        )

    def run(self, duration_minutes: int = None):
        """Run the simulator for specified duration or indefinitely"""
        start_time = time.time()
        
        print(f"Starting scenario catalog simulator...")
        print(f"Duration: {'Indefinite' if duration_minutes is None else f'{duration_minutes} minutes'}")
        
        try:
            # Initial publication of all scenarios
            print("Publishing initial catalog data...")
            self._publish_catalog()
            
            while self.running:
                # Check if duration has elapsed
                if duration_minutes is not None:
                    if (time.time() - start_time) > (duration_minutes * 60):
                        print("\nSimulation duration completed")
                        break

                # Update counts and publish metrics
                self._update_scenario_counts()
                self._publish_metrics()
                
                # Wait before next update
                time.sleep(1)

        except KeyboardInterrupt:
            print("\nSimulator stopped by user")
        finally:
            self.mqtt_client.loop_stop()
            print("Simulator shutdown complete")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scenario Catalog Simulator')
    parser.add_argument('-t', '--time', type=int, help='Duration in minutes to run the simulator')
    args = parser.parse_args()

    simulator = ScenarioCatalogSimulator()
    simulator.run(args.time)