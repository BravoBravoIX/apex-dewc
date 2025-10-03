# SCIP v2 Port Assignments

## Port Management for SCIP v2 Services

This document tracks all port assignments across the SCIP v2 system to prevent conflicts and ensure proper service communication.

## Reserved Port Ranges

### Development Services (3000-3099)
- **3000**: Team Dashboard Development Server (default)
- **3001**: Client Dashboard Development Server
- **3002**: Reserved for additional development services
- **3003-3099**: Available for development instances

### Team Dashboard Production (3201-3299)
- **3201-3299**: Docker containers for team dashboards
- Each team gets a dynamically assigned port in this range
- Managed by orchestration service

### API Services (8000-8099)
- **8001**: Orchestration Service API
- **8002**: Message Testing API / MQTT Trigger Service
- **8003-8099**: Reserved for additional API services

### Message/Communication Services (9000-9099)
- **9001**: MQTT Broker WebSocket Port
- **1883**: MQTT Broker Standard Port (if used)
- **9002-9099**: Reserved for additional messaging services

## Service Dependencies

```
Client Dashboard (3001)
    ↓ HTTP API calls
Orchestration Service (8001)
    ↓ Docker container creation
Team Dashboard Containers (3201-3299)
    ↓ MQTT connection
MQTT Broker (9001)
    ↓ Message routing
Message Testing API (8002)
```

## Port Conflict Detection

To check for port conflicts:

```bash
# Check if a port is in use
lsof -i :PORT_NUMBER

# Check all SCIP-related ports
lsof -i :3000 -i :3001 -i :8001 -i :8002 -i :9001
```

## Environment Variables

Services should use these environment variables for port configuration:

```bash
# Team Dashboard
VITE_PORT=3000

# Client Dashboard  
CLIENT_DASHBOARD_PORT=3001

# Orchestration Service
ORCHESTRATION_PORT=8001

# Message Testing API
MESSAGE_API_PORT=8002

# MQTT Broker
MQTT_PORT=1883
MQTT_WEBSOCKET_PORT=9001

# Team Dashboard Container Range
TEAM_DASHBOARD_PORT_START=3201
TEAM_DASHBOARD_PORT_END=3299
```

## Troubleshooting Port Issues

### Common Issues
1. **Port already in use**: Check with `lsof -i :PORT` and kill conflicting processes
2. **Permission denied**: Use `sudo` if binding to ports < 1024
3. **Container conflicts**: Use `docker ps` to check running containers

### Kill Commands
```bash
# Kill processes on specific ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:8001 | xargs kill -9

# Kill all Docker containers
docker stop $(docker ps -q)
```

## Notes
- Ports 3000-3099 are for development only
- Ports 3201-3299 are managed automatically by orchestration service
- Do not manually bind to the team dashboard production range
- Always check this document before assigning new services to ports