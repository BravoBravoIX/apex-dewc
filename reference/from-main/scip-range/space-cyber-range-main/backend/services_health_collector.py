#!/usr/bin/env python3

import psutil
import time
import json
import paho.mqtt.client as mqtt
import schedule
import logging
import redis
import socket
import subprocess

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler('/tmp/services_health.log'),
                        logging.StreamHandler()
                    ])

class ServicesHealthCollector:
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
        
        # Start time tracking
        self.start_times = {
            'mqtt': time.time(),
            'redis': time.time(),
            'api': time.time()
        }
    
    def check_mqtt_health(self):
        """Check MQTT broker health"""
        try:
            # Try connecting to the MQTT port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex(('localhost', 1883))
            sock.close()
            
            status = 'healthy' if result == 0 else 'error'
            uptime = int(time.time() - self.start_times['mqtt'])
            
            return {
                'status': status,
                'uptime': uptime
            }
        except Exception as e:
            self.logger.error(f"MQTT health check error: {e}")
            return {
                'status': 'error',
                'uptime': int(time.time() - self.start_times['mqtt'])
            }
    
    def check_redis_health(self):
        """Check Redis health"""
        try:
            # Attempt to connect to Redis
            r = redis.Redis(host='localhost', port=6379, socket_timeout=5)
            
            # Ping Redis
            r.ping()
            
            # Get server info
            info = r.info()
            
            status = 'healthy'
            uptime = int(time.time() - self.start_times['redis'])
            
            return {
                'status': status,
                'uptime': uptime,
                'clients': info.get('connected_clients', 0),
                'memory_usage': info.get('used_memory_human', '0B')
            }
        except Exception as e:
            self.logger.error(f"Redis health check error: {e}")
            return {
                'status': 'error',
                'uptime': int(time.time() - self.start_times['redis']),
                'clients': 0,
                'memory_usage': '0B'
            }
    
    def check_api_health(self):
        """Check API service health"""
        try:
            # Check if the process is running
            for proc in psutil.process_iter(['name', 'cmdline']):
                try:
                    # Adjust this to match how your API is typically started
                    if ('uvicorn' in proc.info['name'] or 
                        'gunicorn' in proc.info['name'] or 
                        'python3' in proc.info['name'] and 
                        any('api' in str(cmd).lower() for cmd in proc.info['cmdline'] or [])):
                        
                        status = 'healthy'
                        uptime = int(time.time() - proc.create_time())
                        
                        return {
                            'status': status,
                            'uptime': uptime,
                            'pid': proc.pid
                        }
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            return {
                'status': 'error',
                'uptime': 0,
                'pid': None
            }
        except Exception as e:
            self.logger.error(f"API health check error: {e}")
            return {
                'status': 'error',
                'uptime': 0,
                'pid': None
            }
    
    def publish_services_health(self):
        """Publish health status for all services"""
        try:
            # Check health of each service
            services = {
                'mqtt': self.check_mqtt_health(),
                'redis': self.check_redis_health(),
                'api': self.check_api_health()
            }
            
            # Publish each service's health
            for service_name, service_data in services.items():
                topic = f'range/status/services/{service_name}'
                
                # Publish full health data
                self.mqtt_client.publish(
                    topic, 
                    json.dumps(service_data)
                )
                
                self.logger.info(f"Published {service_name} health: {service_data}")
        
        except Exception as e:
            self.logger.error(f"Error publishing services health: {e}")
    
    def start(self, interval=30):
        """Start periodic health checks and publishing"""
        self.logger.info(f"Starting services health collector. Publishing every {interval} seconds.")
        
        try:
            # Publish initial metrics immediately
            self.publish_services_health()
            
            # Then schedule periodic publishing
            schedule.every(interval).seconds.do(self.publish_services_health)
            
            while True:
                schedule.run_pending()
                time.sleep(1)
        
        except KeyboardInterrupt:
            self.logger.info("Services health collector stopped by user")
        except Exception as e:
            self.logger.error(f"Unexpected error in health collector: {e}")

if __name__ == "__main__":
    # Example usage
    collector = ServicesHealthCollector()
    collector.start()
