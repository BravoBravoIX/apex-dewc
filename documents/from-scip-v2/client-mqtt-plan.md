# MQTT WebSocket Connection Fix Plan

## **Problem Summary**
Team dashboard containers cannot establish WebSocket connections to the MQTT broker (`ws://host.docker.internal:9001`) due to Docker container networking limitations.

## **Root Cause Analysis**
- **MQTT Broker Configuration**: ✅ Working correctly (mosquitto running with WebSocket support on port 9001)
- **Team Dashboard MQTT Code**: ✅ Working correctly (useMQTT.ts hook properly configured)
- **Root Issue**: ❌ WebSocket connectivity from containers to `host.docker.internal:9001`
  - MQTT logs show only regular MQTT connections (port 1883), no WebSocket connections (port 9001)
  - Docker container networking blocks WebSocket protocol connections to host

## **Solution Strategy: Containerized MQTT Broker**

**Best approach**: Create a dedicated MQTT broker container that team dashboard containers can access directly within the Docker network.

### **Phase 1: Immediate Fix (Quick Solution)**
1. **Test current connectivity** - Verify the exact failure point
2. **Create MQTT broker container** - Deploy mosquitto in a container accessible to team dashboards  
3. **Update team dashboard configuration** - Point to containerized broker instead of host

### **Phase 2: Architecture Enhancement**
4. **Implement client-level MQTT networks** - Per-client broker isolation
5. **Add MQTT health monitoring** - Real-time status tracking for client dashboard
6. **Test message routing** - End-to-end scenario message flow

## **Implementation Steps**

### **Step 1: Test Container WebSocket Connectivity**
```bash
# Exec into team dashboard container
docker exec -it <container-name> /bin/sh

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" \
  http://host.docker.internal:9001/
```

### **Step 2: Create Containerized MQTT Solution**
Create `orchestration-service/docker-compose.mqtt.yml`:
```yaml
version: '3.8'
services:
  mqtt-broker:
    image: eclipse-mosquitto:2.0
    container_name: scip-mqtt-broker
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
    networks:
      - scip-network

networks:
  scip-network:
    driver: bridge
```

### **Step 3: Update Team Dashboard Deployment**
- Modify orchestration service to deploy team containers on `scip-network`
- Update team dashboard config to use `mqtt-broker:9001` instead of `host.docker.internal:9001`
- Test connection from deployed containers

### **Step 4: Implement Health Monitoring**
```python
# Add to orchestration service
@app.get("/api/v1/mqtt/health")
async def check_mqtt_health():
    # Connect to MQTT broker and return status
    pass

@app.get("/api/v1/dashboards/{team_id}/mqtt-status")
async def get_team_mqtt_status(team_id: str):
    # Check specific team's MQTT connection
    pass
```

### **Step 5: End-to-End Testing**
- Deploy multiple team dashboards on shared network
- Send test messages through MQTT broker
- Verify team isolation and message routing
- Test client dashboard status indicators

## **Current Configuration**

### **Working MQTT Broker (Host)**
- Location: `/tmp/mosquitto.conf`
- Ports: 1883 (MQTT), 9001 (WebSocket)
- Status: ✅ Running and accessible from host

### **Team Dashboard MQTT Config**
- File: `team-dashboard/src/hooks/useMQTT.ts`
- Current URL: `ws://host.docker.internal:9001`
- Status: ❌ Cannot connect from containers

### **Target Architecture**
```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Client Dashboard  │───▶│ Orchestration    │───▶│   MQTT Broker       │
│   (Host Process)    │    │ Service          │    │   (Container)       │
└─────────────────────┘    │ (Host Process)   │    └─────────────────────┘
                           └──────────────────┘              │
                                     │                       │
                           ┌─────────▼────────┐             │
                           │  Team Dashboard  │◀────────────┘
                           │  (Container)     │
                           └──────────────────┘
```

## **Benefits of This Approach**
1. **Reliable Connectivity**: Containers can reliably connect to containerized MQTT broker
2. **Client Isolation**: Future support for per-client MQTT brokers  
3. **Scalability**: Easy to deploy multiple isolated MQTT networks
4. **Monitoring**: Container-based health checks and status tracking
5. **Consistency**: Same networking approach across all services

## **Migration Path**
1. **Phase 1**: Single shared MQTT broker container (immediate fix)
2. **Phase 2**: Per-client MQTT broker containers (full isolation)
3. **Phase 3**: Per-scenario MQTT broker containers (ultimate scalability)

This approach maintains client isolation while fixing the WebSocket connectivity issue by moving the MQTT broker into the container network where team dashboards can access it reliably.