#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import json
import sys
import time

def send_inject(inject_type, team_id, content):
    """Send a test inject via MQTT."""
    client = mqtt.Client()
    client.connect("localhost", 9001)

    inject = {
        "id": f"test-{inject_type}-{int(time.time())}",
        "time": 0,
        "type": inject_type,
        "content": content,
        "delivered_at": 0,
        "team_id": team_id,
        "exercise_id": "maritime-crisis-scenario"
    }

    topic = f"/exercise/maritime-crisis-scenario/team/{team_id}/feed"
    client.publish(topic, json.dumps(inject))
    client.disconnect()

    print(f"✓ Sent {inject_type} inject to {team_id} team")
    print(f"  Topic: {topic}")
    print(f"  Content: {json.dumps(content, indent=2)}")

if __name__ == "__main__":
    # Send test injects for all types

    # News inject
    send_inject("news", "blue", {
        "headline": "TEST: Shipping Lane Closure Announced",
        "body": "Port authorities have announced temporary closure of shipping lane Alpha-7 for security reasons.",
        "source": "Maritime News Network"
    })

    time.sleep(0.5)

    # Social inject
    send_inject("social", "blue", {
        "body": "Just saw unusual activity near the port. Multiple vessels moving in formation. #MaritimeSecurity",
        "source": "@PortWatcher"
    })

    time.sleep(0.5)

    # Email inject
    send_inject("email", "blue", {
        "from": "ops@harbor-control.mil",
        "to": "team@blue-force.mil",
        "subject": "URGENT: Vessel Tracking Alert",
        "body": "Our radar systems have detected unidentified vessels approaching territorial waters. Recommend immediate assessment."
    })

    time.sleep(0.5)

    # SMS inject
    send_inject("sms", "blue", {
        "from": "+1-555-0123",
        "to": "+1-555-0199",
        "body": "Intercepted: Package delayed at customs. Will reroute through alternate channel."
    })

    print("\n✓ All test injects sent successfully!")
