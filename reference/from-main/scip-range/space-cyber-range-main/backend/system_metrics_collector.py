#!/usr/bin/env python3

import psutil
import time
import json
import paho.mqtt.client as mqtt
import schedule

class SystemMetricsCollector:
    def __init__(self, mqtt_broker='localhost', mqtt_port=1883):
        # MQTT Client Setup
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect(mqtt_broker, mqtt_port, 60)
        
    def get_cpu_metrics(self):
        """Collect CPU usage metrics."""
        cpu_count = psutil.cpu_count()
        cpu_percent = psutil.cpu_percent()
        used_cores = int(cpu_count * cpu_percent / 100)
        
        return {
            "total": cpu_count,
            "used": used_cores,
            "available": cpu_count - used_cores,
            "usage_percent": cpu_percent
        }
    
    def get_memory_metrics(self):
        """Collect memory usage metrics."""
        memory = psutil.virtual_memory()
        
        return {
            "total": round(memory.total / (1024 * 1024 * 1024), 2),  # Convert to GB
            "used": round(memory.used / (1024 * 1024 * 1024), 2),
            "available": round(memory.available / (1024 * 1024 * 1024), 2),
            "usage_percent": memory.percent
        }
    
    def get_storage_metrics(self, path='/'):
        """Collect storage usage metrics for root directory."""
        storage = psutil.disk_usage(path)
        
        return {
            "total": round(storage.total / (1024 * 1024 * 1024), 2),  # Convert to GB
            "used": round(storage.used / (1024 * 1024 * 1024), 2),
            "available": round(storage.free / (1024 * 1024 * 1024), 2),
            "usage_percent": storage.percent
        }
    
    def publish_metrics(self):
        """Publish system metrics to MQTT topics."""
        try:
            # Publish CPU metrics
            self.mqtt_client.publish(
                'range/status/resources/cpu', 
                json.dumps(self.get_cpu_metrics())
            )
            
            # Publish Memory metrics
            self.mqtt_client.publish(
                'range/status/resources/memory', 
                json.dumps(self.get_memory_metrics())
            )
            
            # Publish Storage metrics
            self.mqtt_client.publish(
                'range/status/resources/storage', 
                json.dumps(self.get_storage_metrics())
            )
            
            print("Metrics published successfully")
        except Exception as e:
            print(f"Error publishing metrics: {e}")
    
    def start(self, interval=5):
        """Start periodic metrics collection and publishing."""
        schedule.every(interval).seconds.do(self.publish_metrics)
        
        print(f"Starting system metrics collector. Publishing every {interval} seconds.")
        
        while True:
            schedule.run_pending()
            time.sleep(1)

if __name__ == "__main__":
    # Example usage
    collector = SystemMetricsCollector()
    collector.start()
