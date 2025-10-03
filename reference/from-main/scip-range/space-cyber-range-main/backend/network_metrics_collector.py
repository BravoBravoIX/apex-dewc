#!/usr/bin/env python3

import psutil
import time
import json
import paho.mqtt.client as mqtt
import schedule
import socket
import subprocess
import netifaces
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler('/tmp/network_metrics.log'),
                        logging.StreamHandler()
                    ])

class NetworkMetricsCollector:
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
        
        # Primary network interface
        self.primary_interface = self._get_primary_interface()
    
    def _get_primary_interface(self):
        """Determine the primary network interface"""
        try:
            # Get default gateway interface
            gws = netifaces.gateways()
            default_interface = gws['default'][netifaces.AF_INET][1]
            self.logger.info(f"Primary network interface: {default_interface}")
            return default_interface
        except Exception as e:
            self.logger.error(f"Error detecting primary interface: {e}")
            return 'eth0'  # Fallback default
    
    def get_network_metrics(self):
        """Collect comprehensive network metrics"""
        metrics = {
            "status": "operational",
            "latency": self._measure_latency(),
            "bandwidth": self._estimate_bandwidth(),
            "active_connections": self._count_active_connections(),
            "interface": self.primary_interface
        }
        self.logger.debug(f"Collected network metrics: {metrics}")
        return metrics
    
    def _measure_latency(self):
        """Measure network latency to a reliable server"""
        try:
            # Measure latency to Google's DNS
            result = subprocess.run(
                ['ping', '-c', '4', '8.8.8.8'], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            
            # Extract average latency
            for line in result.stdout.split('\n'):
                if 'avg' in line:
                    latency = float(line.split('/')[-3])
                    self.logger.info(f"Measured latency: {latency}ms")
                    return latency
            
            return 0
        except Exception as e:
            self.logger.error(f"Latency measurement error: {e}")
            return 0
    
    def _estimate_bandwidth(self):
        """Estimate network bandwidth using network interface stats"""
        try:
            # Get network interface statistics
            net_io = psutil.net_io_counters(pernic=True)
            
            # Use the primary interface
            if self.primary_interface in net_io:
                interface_stats = net_io[self.primary_interface]
                
                # Estimate bandwidth based on bytes sent/received
                download_speed = interface_stats.bytes_recv / (1024 * 1024)  # MB
                upload_speed = interface_stats.bytes_sent / (1024 * 1024)  # MB
                
                result = {
                    "download": round(download_speed, 2),
                    "upload": round(upload_speed, 2)
                }
                self.logger.info(f"Estimated bandwidth: {result}")
                return result
            
            return {"download": 0, "upload": 0}
        except Exception as e:
            self.logger.error(f"Bandwidth estimation error: {e}")
            return {"download": 0, "upload": 0}
    
    def _count_active_connections(self):
        """Count active network connections"""
        try:
            connections = psutil.net_connections()
            active_count = len([conn for conn in connections if conn.status == 'ESTABLISHED'])
            self.logger.info(f"Active network connections: {active_count}")
            return active_count
        except Exception as e:
            self.logger.error(f"Connection counting error: {e}")
            return 0
    
    def publish_metrics(self):
        """Publish network metrics to MQTT topics"""
        try:
            # Get network metrics
            network_metrics = self.get_network_metrics()
            
            # Prepare management payload
            management_payload = {
                "status": network_metrics['status'],
                "latency": network_metrics['latency'],
                "bandwidth": network_metrics['bandwidth'].get('download', 0),
                "active_connections": network_metrics['active_connections']
            }
            
            # Publish management topic
            result = self.mqtt_client.publish(
                'range/status/health/network/management', 
                json.dumps(management_payload)
            )
            
            # Check publication result
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                self.logger.info("Network management metrics published successfully")
            else:
                self.logger.error(f"Failed to publish network management metrics. Error code: {result.rc}")
            
            # Publish additional detailed topics
            self.mqtt_client.publish(
                'range/status/health/network/bandwidth', 
                json.dumps(network_metrics['bandwidth'])
            )
            
            self.mqtt_client.publish(
                'range/status/health/network/interface', 
                json.dumps({
                    "name": network_metrics['interface']
                })
            )
            
        except Exception as e:
            self.logger.error(f"Error publishing network metrics: {e}")
    
    def start(self, interval=30):
        """Start periodic metrics collection and publishing"""
        self.logger.info(f"Starting network metrics collector. Publishing every {interval} seconds.")
        
        try:
            # Publish initial metrics immediately
            self.publish_metrics()
            
            # Then schedule periodic publishing
            schedule.every(interval).seconds.do(self.publish_metrics)
            
            while True:
                schedule.run_pending()
                time.sleep(1)
        except KeyboardInterrupt:
            self.logger.info("Network metrics collector stopped by user")
        except Exception as e:
            self.logger.error(f"Unexpected error in metrics collector: {e}")

if __name__ == "__main__":
    # Example usage
    collector = NetworkMetricsCollector()
    collector.start()
