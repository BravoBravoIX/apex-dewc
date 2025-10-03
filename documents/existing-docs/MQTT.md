# MQTT Configuration Guide

## Overview

MQTT (Message Queuing Telemetry Transport) is the core real-time messaging system for SCIP v3, handling all inject delivery from the orchestration service to team dashboards. This guide covers MQTT setup, configuration, topic structure, and message formats.

## MQTT Architecture

```
┌─────────────────────────────────────────────────────┐
│                 MQTT Broker (Mosquitto)              │
│                     Port: 1883 (TCP)                 │
│                     Port: 9001 (WebSocket)           │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Topics:                                              │
│  ├── /exercise/{id}/control      (Control commands)  │
│  ├── /exercise/{id}/timer        (Timer updates)     │
│  ├── /exercise/{id}/status       (Status updates)    │
│  └── /exercise/{id}/team/{team}/feed  (Injects)     │
│                                                       │
├─────────┬────────────┬───────────────┬──────────────┤
│         │            │               │              │
│    Orchestration   Client         Team Blue      Team Red
│      Service      Dashboard       Dashboard     Dashboard
│    (Publisher)    (Monitor)      (Subscriber)  (Subscriber)
└─────────────────────────────────────────────────────┘
```

## Mosquitto Configuration

### Basic Configuration (mosquitto.conf)

```conf
# /mqtt/mosquitto.conf

# =================================================================
# General Settings
# =================================================================

# Process ID file
pid_file /mosquitto/pid/mosquitto.pid

# Persistence
persistence true
persistence_location /mosquitto/data/
autosave_interval 300
autosave_on_changes true

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_type error
log_type warning
log_type notice
log_type information
log_timestamp true
log_timestamp_format %Y-%m-%dT%H:%M:%S

# =================================================================
# Listeners
# =================================================================

# Standard MQTT Protocol
listener 1883
protocol mqtt
max_connections 1000

# WebSocket Protocol (for browsers)
listener 9001
protocol websockets
http_dir /mosquitto/http
websockets_log_level 255

# =================================================================
# Security
# =================================================================

# Authentication
allow_anonymous false
password_file /mosquitto/config/passwd

# Access Control
acl_file /mosquitto/config/acl.conf

# TLS/SSL (Production)
#listener 8883
#protocol mqtt
#cafile /mosquitto/config/ca.crt
#certfile /mosquitto/config/server.crt
#keyfile /mosquitto/config/server.key
#require_certificate false

# =================================================================
# Performance Tuning
# =================================================================

# Message settings
message_size_limit 10485760  # 10MB max message size
max_inflight_messages 200
max_queued_messages 1000
queue_qos0_messages true

# Keep alive
keepalive_interval 60
max_keepalive 120

# Connection settings
max_connections 1000
connection_messages true

# =================================================================
# Bridge Configuration (for multi-broker setup)
# =================================================================

#connection bridge-to-cloud
#address cloud-mqtt.example.com:1883
#topic # out 1
#topic # in 1
#remote_username bridge_user
#remote_password bridge_password
#try_private true
```

### Access Control List (acl.conf)

```conf
# /mqtt/acl.conf

# =================================================================
# User Permissions
# =================================================================

# Orchestration Service - Full access to exercise topics
user orchestration
topic readwrite /exercise/+/#

# Client Dashboard - Read access to monitoring
user client_admin
topic read /exercise/+/control
topic read /exercise/+/timer
topic read /exercise/+/status
topic read /exercise/+/monitoring

# Team Dashboards - Read only their team feed
user team_blue
topic read /exercise/+/team/blue/feed
topic read /exercise/+/timer
topic read /exercise/+/status

user team_red
topic read /exercise/+/team/red/feed
topic read /exercise/+/timer
topic read /exercise/+/status

user team_orange
topic read /exercise/+/team/orange/feed
topic read /exercise/+/timer
topic read /exercise/+/status

# System monitoring - Read all system topics
user monitor
topic read $SYS/#
topic read /exercise/#

# Default deny all
user *
topic deny #
```

### User Management

Create password file for authentication:

```bash
# Create password file
touch /mqtt/passwd

# Add users (interactive, will prompt for password)
mosquitto_passwd -c /mqtt/passwd orchestration
mosquitto_passwd /mqtt/passwd client_admin
mosquitto_passwd /mqtt/passwd team_blue
mosquitto_passwd /mqtt/passwd team_red

# Add user with password in command (less secure)
mosquitto_passwd -b /mqtt/passwd test_user test_password

# Remove user
mosquitto_passwd -D /mqtt/passwd old_user
```

## Topic Structure

### Topic Hierarchy

```
/exercise/{exercise_id}/
├── control                    # Exercise control commands
│   └── {start|stop|pause|resume}
├── timer                      # Global timer updates
│   └── {current_time}
├── status                     # Exercise status
│   └── {initialized|running|paused|completed}
├── team/{team_id}/
│   ├── feed                  # Team-specific inject feed
│   ├── status                # Team connection status
│   └── metrics               # Team performance metrics
└── monitoring/               # System monitoring
    ├── delivery              # Inject delivery status
    ├── connections           # Client connections
    └── performance          # Performance metrics
```

### Topic Examples

```
# Control topics
/exercise/ex-001/control
/exercise/ex-001/timer
/exercise/ex-001/status

# Team-specific topics
/exercise/ex-001/team/blue/feed
/exercise/ex-001/team/red/feed
/exercise/ex-001/team/orange/feed

# Monitoring topics
/exercise/ex-001/monitoring/delivery
/exercise/ex-001/monitoring/connections
```

## Message Formats

### Control Messages

```json
// Start Exercise
{
  "command": "start",
  "timestamp": "2024-01-15T14:00:00Z",
  "initiated_by": "admin"
}

// Pause Exercise
{
  "command": "pause",
  "timestamp": "2024-01-15T14:15:00Z",
  "reason": "Technical issue",
  "initiated_by": "admin"
}

// Stop Exercise
{
  "command": "stop",
  "timestamp": "2024-01-15T14:45:00Z",
  "reason": "Exercise complete",
  "cleanup": true
}
```

### Timer Updates

```json
{
  "current": 332,              // Current time in seconds
  "total": 2700,               // Total duration in seconds
  "formatted": "T+05:32",      // Human-readable format
  "percentage": 12.3,          // Progress percentage
  "status": "running",         // Timer status
  "timestamp": "2024-01-15T14:05:32Z"
}
```

### Inject Messages

```json
// News Inject
{
  "id": "inject-001",
  "timestamp": "2024-01-15T14:05:00Z",
  "exerciseTime": 300,
  "type": "news",
  "priority": "high",
  "content": {
    "headline": "Breaking: Cyber Attack Detected",
    "body": "Multiple banks report service disruptions...",
    "source": "Reuters",
    "image": "/media/exercises/ex-001/images/breaking.jpg",
    "published": "2024-01-15T14:05:00Z"
  }
}

// Social Media Inject
{
  "id": "inject-002",
  "timestamp": "2024-01-15T14:06:00Z",
  "exerciseTime": 360,
  "type": "social",
  "priority": "medium",
  "content": {
    "platform": "twitter",
    "username": "@CyberAlert",
    "verified": true,
    "text": "🚨 ALERT: Major banks offline across the country",
    "engagement": {
      "likes": 5234,
      "retweets": 1823,
      "replies": 445
    }
  }
}

// SMS Inject
{
  "id": "inject-003",
  "timestamp": "2024-01-15T14:10:00Z",
  "exerciseTime": 600,
  "type": "sms",
  "priority": "urgent",
  "content": {
    "from": "+61 400 123 456",
    "text": "CODE RED: All teams report status immediately",
    "sender": "OPS CONTROL"
  }
}

// Email Inject
{
  "id": "inject-004",
  "timestamp": "2024-01-15T14:12:00Z",
  "exerciseTime": 720,
  "type": "email",
  "priority": "high",
  "content": {
    "from": "director@defence.gov.au",
    "to": "blue.team@exercise.local",
    "subject": "URGENT: Immediate Action Required",
    "body": "Implement Protocol 7 immediately...",
    "attachments": [
      {
        "name": "protocol-7.pdf",
        "path": "/media/exercises/ex-001/docs/protocol-7.pdf"
      }
    ]
  }
}
```

### Status Messages

```json
// Team Status
{
  "team_id": "blue",
  "connected": true,
  "last_seen": "2024-01-15T14:15:00Z",
  "injects_received": 12,
  "connection_quality": "excellent"
}

// Delivery Status
{
  "inject_id": "inject-005",
  "team_id": "red",
  "status": "delivered",
  "delivered_at": "2024-01-15T14:15:30Z",
  "latency_ms": 125
}
```

## Client Implementation

### JavaScript/TypeScript (Team Dashboard)

```typescript
// mqtt-client.ts
import mqtt, { MqttClient } from 'mqtt';

class TeamMQTTClient {
  private client: MqttClient;
  private teamId: string;
  private exerciseId: string;
  private reconnectAttempts: number = 0;
  
  constructor(teamId: string, exerciseId: string) {
    this.teamId = teamId;
    this.exerciseId = exerciseId;
  }
  
  connect(): void {
    const options = {
      protocol: 'ws',
      host: process.env.VITE_MQTT_HOST || 'localhost',
      port: parseInt(process.env.VITE_MQTT_WS_PORT || '9001'),
      username: `team_${this.teamId}`,
      password: process.env.VITE_MQTT_PASSWORD,
      clientId: `team_${this.teamId}_${Date.now()}`,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      clean: true,
      rejectUnauthorized: false
    };
    
    this.client = mqtt.connect(`ws://${options.host}:${options.port}`, options);
    
    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.reconnectAttempts = 0;
      this.subscribe();
    });
    
    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });
    
    this.client.on('error', (error) => {
      console.error('MQTT error:', error);
    });
    
    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
    });
    
    this.client.on('offline', () => {
      console.log('MQTT client offline');
    });
  }
  
  private subscribe(): void {
    const topics = [
      `/exercise/${this.exerciseId}/team/${this.teamId}/feed`,
      `/exercise/${this.exerciseId}/timer`,
      `/exercise/${this.exerciseId}/status`
    ];
    
    this.client.subscribe(topics, { qos: 1 }, (err) => {
      if (err) {
        console.error('Subscription error:', err);
      } else {
        console.log('Subscribed to topics:', topics);
      }
    });
  }
  
  private handleMessage(topic: string, payload: string): void {
    try {
      const message = JSON.parse(payload);
      
      if (topic.endsWith('/feed')) {
        this.handleInject(message);
      } else if (topic.endsWith('/timer')) {
        this.handleTimerUpdate(message);
      } else if (topic.endsWith('/status')) {
        this.handleStatusUpdate(message);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }
  
  private handleInject(inject: any): void {
    // Process inject based on type
    switch (inject.type) {
      case 'news':
        // Add to news feed
        break;
      case 'social':
        // Add to social feed
        break;
      case 'sms':
        // Add to SMS feed
        break;
      case 'email':
        // Add to email feed
        break;
      case 'intel':
        // Add to intel feed
        break;
    }
  }
  
  private handleTimerUpdate(timer: any): void {
    // Update exercise timer display
    console.log(`Timer: ${timer.formatted}`);
  }
  
  private handleStatusUpdate(status: any): void {
    // Update exercise status
    console.log(`Exercise status: ${status}`);
  }
  
  disconnect(): void {
    if (this.client) {
      this.client.end();
    }
  }
}

// Usage
const mqttClient = new TeamMQTTClient('blue', 'ex-001');
mqttClient.connect();
```

### Python (Orchestration Service)

```python
# mqtt_publisher.py
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
import paho.mqtt.client as mqtt
from paho.mqtt.client import MQTTMessage

class OrchestrationMQTTPublisher:
    def __init__(self, host: str, port: int, username: str, password: str):
        self.host = host
        self.port = port
        self.client = mqtt.Client(client_id=f"orchestration_{datetime.now().timestamp()}")
        self.client.username_pw_set(username, password)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
        self.connected = False
        self.connect()
    
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT broker")
            self.connected = True
        else:
            print(f"Connection failed with code {rc}")
            self.connected = False
    
    def _on_disconnect(self, client, userdata, rc):
        print(f"Disconnected from MQTT broker with code {rc}")
        self.connected = False
        if rc != 0:
            print("Unexpected disconnection, attempting to reconnect...")
            self.connect()
    
    def _on_publish(self, client, userdata, mid):
        print(f"Message {mid} published successfully")
    
    def connect(self):
        """Establish connection to MQTT broker"""
        try:
            self.client.connect(self.host, self.port, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            print(f"Connection error: {e}")
            self.connected = False
    
    def publish_inject(
        self, 
        exercise_id: str, 
        team_id: str, 
        inject: Dict[str, Any]
    ) -> bool:
        """Publish inject to team feed"""
        if not self.connected:
            print("Not connected to broker")
            return False
        
        topic = f"/exercise/{exercise_id}/team/{team_id}/feed"
        
        message = {
            "id": inject.get("id"),
            "timestamp": datetime.utcnow().isoformat(),
            "exerciseTime": inject.get("time"),
            "type": inject.get("type"),
            "priority": inject.get("priority", "medium"),
            "content": inject.get("content")
        }
        
        try:
            result = self.client.publish(
                topic, 
                json.dumps(message),
                qos=1,
                retain=False
            )
            
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        except Exception as e:
            print(f"Publish error: {e}")
            return False
    
    def publish_timer(
        self, 
        exercise_id: str, 
        current_time: int, 
        total_time: int
    ) -> bool:
        """Publish timer update"""
        topic = f"/exercise/{exercise_id}/timer"
        
        message = {
            "current": current_time,
            "total": total_time,
            "formatted": f"T+{current_time//60:02d}:{current_time%60:02d}",
            "percentage": (current_time / total_time) * 100,
            "status": "running",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            result = self.client.publish(topic, json.dumps(message), qos=0)
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        except Exception as e:
            print(f"Timer publish error: {e}")
            return False
    
    def publish_control(
        self, 
        exercise_id: str, 
        command: str, 
        reason: Optional[str] = None
    ) -> bool:
        """Publish control command"""
        topic = f"/exercise/{exercise_id}/control"
        
        message = {
            "command": command,
            "timestamp": datetime.utcnow().isoformat(),
            "initiated_by": "orchestration"
        }
        
        if reason:
            message["reason"] = reason
        
        try:
            result = self.client.publish(topic, json.dumps(message), qos=2)
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        except Exception as e:
            print(f"Control publish error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from broker"""
        self.client.loop_stop()
        self.client.disconnect()

# Usage
publisher = OrchestrationMQTTPublisher(
    host="localhost",
    port=1883,
    username="orchestration",
    password="orchestration_password"
)

# Publish inject
publisher.publish_inject(
    exercise_id="ex-001",
    team_id="blue",
    inject={
        "id": "inject-001",
        "time": 300,
        "type": "news",
        "content": {
            "headline": "Breaking News",
            "body": "Crisis escalating..."
        }
    }
)
```

## QoS Levels

MQTT supports three Quality of Service levels:

### QoS 0 - At Most Once (Fire and Forget)
- No acknowledgment
- No retry
- Fastest, least reliable
- Use for: Timer updates, non-critical status

### QoS 1 - At Least Once
- Acknowledgment required
- May deliver duplicates
- Good balance of speed and reliability
- Use for: Inject delivery, important updates

### QoS 2 - Exactly Once
- Four-way handshake
- Guaranteed single delivery
- Slowest, most reliable
- Use for: Critical control commands

## Monitoring and Debugging

### Mosquitto Logging

Enable detailed logging in mosquitto.conf:

```conf
log_type all
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
connection_messages true
websockets_log_level 255
```

### Command Line Tools

```bash
# Subscribe to all topics (monitoring)
mosquitto_sub -h localhost -p 1883 -u monitor -P password -t '#' -v

# Subscribe to specific exercise
mosquitto_sub -h localhost -p 1883 -u monitor -P password -t '/exercise/ex-001/#' -v

# Publish test message
mosquitto_pub -h localhost -p 1883 -u orchestration -P password \
  -t '/exercise/test/team/blue/feed' \
  -m '{"type":"test","content":"Hello Blue Team"}'

# Monitor system topics
mosquitto_sub -h localhost -p 1883 -u monitor -P password -t '$SYS/#' -v
```

### MQTT Explorer

Use MQTT Explorer GUI for visual debugging:

1. Download from: https://mqtt-explorer.com/
2. Configure connection:
   - Host: localhost
   - Port: 1883
   - Username: monitor
   - Password: your_password
3. Features:
   - Topic tree visualization
   - Message history
   - Publish test messages
   - Topic statistics

## Performance Optimization

### Broker Configuration

```conf
# Performance tuning in mosquitto.conf

# Increase message limits
max_inflight_messages 500
max_queued_messages 10000

# Connection pooling
max_connections 5000
persistent_client_expiration 7d

# Memory management
memory_limit 512MB
max_packet_size 10MB

# Persistence optimization
autosave_interval 900
autosave_on_changes false
```

### Client Optimization

```javascript
// Batch message processing
let messageQueue = [];
let processTimer = null;

function handleMessage(topic, message) {
  messageQueue.push({ topic, message });
  
  if (!processTimer) {
    processTimer = setTimeout(() => {
      processBatch(messageQueue);
      messageQueue = [];
      processTimer = null;
    }, 100); // Process every 100ms
  }
}

function processBatch(messages) {
  // Process all messages at once
  messages.forEach(msg => {
    // Handle message
  });
}
```

## Security Best Practices

1. **Authentication**
   - Use strong passwords
   - Implement user-specific credentials
   - Rotate passwords regularly

2. **Authorization**
   - Use ACLs to restrict topic access
   - Implement least privilege principle
   - Separate read/write permissions

3. **Encryption**
   - Enable TLS/SSL in production
   - Use secure WebSocket (wss://)
   - Encrypt sensitive payload data

4. **Network Security**
   - Use firewalls to restrict access
   - Implement VPN for remote access
   - Monitor for unusual activity

5. **Message Validation**
   - Validate all incoming messages
   - Sanitize user-provided content
   - Implement rate limiting

## Troubleshooting

### Connection Issues

```bash
# Test basic connectivity
telnet localhost 1883

# Check if broker is running
ps aux | grep mosquitto

# View broker logs
tail -f /mosquitto/log/mosquitto.log

# Test authentication
mosquitto_pub -h localhost -p 1883 -u testuser -P testpass -t test -m "test" -d
```

### Message Not Received

1. Check subscription topics match exactly
2. Verify ACL permissions
3. Check QoS levels
4. Monitor broker logs for errors
5. Use wildcard subscriptions for testing

### WebSocket Connection Failed

1. Verify WebSocket listener configured
2. Check firewall allows port 9001
3. Ensure correct protocol (ws:// not wss://)
4. Check CORS settings if applicable

### High Latency

1. Reduce message size
2. Lower QoS level if possible
3. Increase broker resources
4. Check network congestion
5. Optimize client processing

## References

- [MQTT Specification](https://mqtt.org/mqtt-specification/)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Paho MQTT Python](https://pypi.org/project/paho-mqtt/)
