#!/usr/bin/env python3

import json
import time
import random
import argparse
import math
from datetime import datetime, timedelta
import paho.mqtt.client as mqtt
import redis
from typing import Dict, Any
import signal
import sys

class RangeStatusSimulator:
    def __init__(self):
        # Initialize MQTT client
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect("localhost", 1883, 60)
        self.mqtt_client.loop_start()

        # Initialize Redis connection
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        
        # Initialize base state
        self.state = self._initialize_state()
        
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

    def _initialize_state(self) -> Dict[str, Any]:
        """Initialize the base state for the range"""
        return {
            "health": {
                "services": {
                    "api": {"status": "healthy", "uptime": 0},
                    "db": {"status": "healthy", "uptime": 0},
                    "file_system": {"status": "healthy", "uptime": 0}
                },
                "network": {
                    "management": {
                        "status": "up",
                        "latency": 15,
                        "bandwidth": 1000,
                        "active_connections": 24
                    }
                }
            },
            "resources": {
                "cpu": {
                    "total": 32,
                    "used": 18,
                    "available": 14,
                    "usage_percent": 56
                },
                "memory": {
                    "total": 64,
                    "used": 42,
                    "available": 22,
                    "usage_percent": 65
                },
                "storage": {
                    "total": 1000,
                    "used": 456,
                    "available": 544,
                    "usage_percent": 45
                }
            }
        }

    def _update_service_health(self):
        """Update service health with realistic patterns"""
        services = self.state["health"]["services"]
        for service in services:
            # 99.9% uptime - rare random issues
            if random.random() < 0.001:
                services[service]["status"] = "degraded"
            elif random.random() < 0.0001:
                services[service]["status"] = "error"
            else:
                services[service]["status"] = "healthy"
            
            # Update uptime (reset if service was down)
            if services[service]["status"] == "healthy":
                services[service]["uptime"] += 1
            else:
                services[service]["uptime"] = 0

    def _update_network_metrics(self):
        """Update network metrics with realistic patterns"""
        network = self.state["health"]["network"]["management"]
        
        # Latency variations (10-30ms with occasional spikes)
        base_latency = 15
        jitter = random.gauss(0, 2)
        spike = 50 if random.random() < 0.01 else 0
        network["latency"] = max(1, min(100, base_latency + jitter + spike))

        # Active connections (20-40 with gradual changes)
        current = network["active_connections"]
        change = random.randint(-2, 2)
        network["active_connections"] = max(0, min(50, current + change))

        # Bandwidth usage (varies between 60-90% of capacity)
        network["bandwidth"] = 1000 * (0.6 + 0.3 * random.random())

    def _update_resource_usage(self):
        """Update resource usage with realistic patterns"""
        resources = self.state["resources"]
        
        # CPU usage pattern (40-80% with occasional spikes)
        base_cpu = 60 + 20 * math.sin(time.time() / 300)  # 5-minute cycle
        noise = random.gauss(0, 5)
        spike = 20 if random.random() < 0.05 else 0
        cpu_usage = max(0, min(100, base_cpu + noise + spike))
        
        resources["cpu"]["used"] = int(resources["cpu"]["total"] * cpu_usage / 100)
        resources["cpu"]["available"] = resources["cpu"]["total"] - resources["cpu"]["used"]
        resources["cpu"]["usage_percent"] = cpu_usage

        # Memory usage (gradual changes)
        current_mem = resources["memory"]["usage_percent"]
        mem_change = random.gauss(0, 1)
        new_mem_usage = max(30, min(90, current_mem + mem_change))
        
        resources["memory"]["used"] = int(resources["memory"]["total"] * new_mem_usage / 100)
        resources["memory"]["available"] = resources["memory"]["total"] - resources["memory"]["used"]
        resources["memory"]["usage_percent"] = new_mem_usage

        # Storage (slow, steady increase)
        storage = resources["storage"]
        storage["used"] = min(storage["total"], storage["used"] + random.random() * 0.1)
        storage["available"] = storage["total"] - storage["used"]
        storage["usage_percent"] = (storage["used"] / storage["total"]) * 100

    def _publish_metrics(self):
        """Publish all metrics to MQTT and Redis"""
        # Publish health metrics
        for service, data in self.state["health"]["services"].items():
            topic = f"range/status/health/services/{service}"
            self.mqtt_client.publish(topic, json.dumps(data))
            self.redis_client.hset("range:health:services", service, json.dumps(data))

        # Publish network metrics
        network_data = self.state["health"]["network"]["management"]
        self.mqtt_client.publish("range/status/health/network/management", json.dumps(network_data))
        self.redis_client.set("range:health:network", json.dumps(network_data))

        # Publish resource metrics
        for resource, data in self.state["resources"].items():
            topic = f"range/status/resources/{resource}"
            self.mqtt_client.publish(topic, json.dumps(data))
            self.redis_client.hset("range:resources", resource, json.dumps(data))

    def run(self, duration_minutes: int = None):
        """Run the simulator for specified duration or indefinitely"""
        start_time = time.time()
        
        print(f"Starting range status simulator...")
        print(f"Duration: {'Indefinite' if duration_minutes is None else f'{duration_minutes} minutes'}")
        
        try:
            while self.running:
                # Check if duration has elapsed
                if duration_minutes is not None:
                    if (time.time() - start_time) > (duration_minutes * 60):
                        print("\nSimulation duration completed")
                        break

                # Update all metrics
                self._update_service_health()
                self._update_network_metrics()
                self._update_resource_usage()
                
                # Publish updates
                self._publish_metrics()
                
                # Wait before next update
                time.sleep(1)

        except KeyboardInterrupt:
            print("\nSimulator stopped by user")
        finally:
            self.mqtt_client.loop_stop()
            print("Simulator shutdown complete")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Range Status Simulator')
    parser.add_argument('-t', '--time', type=int, help='Duration in minutes to run the simulator')
    args = parser.parse_args()

    simulator = RangeStatusSimulator()
    simulator.run(args.time)