import paho.mqtt.client as mqtt
import json
import time
import threading

# MQTT setup
client = mqtt.Client()
client.connect("localhost", 1883, 60)

def publish_message(topic, message):
    """Publish message and print for debugging"""
    print(f"Publishing to {topic}: {message}")
    client.publish(topic, json.dumps(message))

# Simulated VMs that will send heartbeats
simulated_vms = [
    "ground-station-1",
    "satellite-1",
    "rf-simulator-1"
]

def vm_heartbeat(vm_id):
    """Simulate heartbeat from a VM"""
    while True:
        heartbeat = {
            "vm_id": vm_id,
            "timestamp": int(time.time() * 1000),
            "status": "running"
        }
        publish_message(f"range/vm/{vm_id}/heartbeat", heartbeat)
        time.sleep(2)

try:
    # Start MQTT loop
    client.loop_start()

    # Start VM heartbeat threads
    threads = []
    for vm_id in simulated_vms:
        t = threading.Thread(target=vm_heartbeat, args=(vm_id,))
        t.daemon = True
        t.start()
        threads.append(t)

    # Main status updates
    while True:
        # System health status
        status = {
            "timestamp": int(time.time() * 1000),
            "service_status": "operational",
            "active_connections": len(simulated_vms) + 1  # VMs + dashboard
        }
        publish_message("range/status/health", status)
        time.sleep(2)

except KeyboardInterrupt:
    print("\nStopping publisher...")
    client.loop_stop()
    client.disconnect()