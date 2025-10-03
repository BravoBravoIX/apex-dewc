#!/usr/bin/env python3

import time
import json
import random
import paho.mqtt.client as mqtt
import schedule
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler('/tmp/instances_simulator.log'),
                        logging.StreamHandler()
                    ])

class InstancesSimulator:
    def __init__(self, mqtt_broker='localhost', mqtt_port=1883):
        # Logging setup
        self.logger = logging.getLogger(__name__)
        
        # MQTT Client Setup
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.enable_logger(self.logger)
        
        try:
            self.logger.info(f"Attempting to connect to MQTT broker at {mqtt_broker}:{mqtt_port}")
            self.mqtt_client.connect(mqtt_broker, mqtt_port, 60)
            self.logger.info("MQTT connection successful")
        except Exception as e:
            self.logger.error(f"MQTT Connection Error: {e}")
        
        # Single active scenario
        self.scenario = {
            "id": "scenario-1",
            "name": "Satellite Communication Disruption",
            "status": "running",
            "startTime": int(time.time()),
            "teams": [
                {"id": "team-alpha", "name": "Team Alpha"},
                {"id": "team-beta", "name": "Team Beta"}
            ]
        }
    
    def update_scenario(self):
        """Update scenario state and progress"""
        # Simulate progress increase
        if self.scenario.get('progress', 0) < 100:
            self.scenario['progress'] = min(
                100, 
                self.scenario.get('progress', 0) + random.randint(1, 5)
            )
        
        # Randomly change status
        if random.random() < 0.1:  # 10% chance of status change
            statuses = ['running', 'paused', 'stopped']
            self.scenario['status'] = random.choice(statuses)
        
        # Update duration
        self.scenario['duration'] = int(time.time()) - self.scenario['startTime']
    
    def publish_scenario(self):
        """Publish the active scenario to MQTT"""
        try:
            # Update scenario before publishing
            self.update_scenario()
            
            # Publish the scenario
            self.mqtt_client.publish(
                'range/scenarios/instances', 
                json.dumps([self.scenario])
            )
            
            self.logger.info("Published scenario instance")
        except Exception as e:
            self.logger.error(f"Error publishing scenario: {e}")
    
    def start(self, interval=30):
        """Start periodic scenario updates"""
        self.logger.info(f"Starting scenario instances simulator. Publishing every {interval} seconds.")
        
        try:
            # Publish initial scenario
            self.publish_scenario()
            
            # Then schedule periodic publishing
            schedule.every(interval).seconds.do(self.publish_scenario)
            
            while True:
                schedule.run_pending()
                time.sleep(1)
        
        except KeyboardInterrupt:
            self.logger.info("Scenario instances simulator stopped by user")
        except Exception as e:
            self.logger.error(f"Unexpected error in instances simulator: {e}")

if __name__ == "__main__":
    # Example usage
    simulator = InstancesSimulator()
    simulator.start()
