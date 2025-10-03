# SCIP v2 Team Dashboard Fixes

## Issues Resolved

### 1. Docker Container Deployment Issue
**Problem**: Team dashboards deployed via client dashboard were stuck on "Connecting to exercise... Please wait while we establish connection..." with continuous reloading.

**Root Cause**: Docker containers were using cached image with old broken code that had MQTT disabled in "standby mode".

**Solution**:
1. Fixed NPM scripts in `package.json` by adding `npx` prefix:
   ```json
   "dev": "npx vite --host 0.0.0.0 --port 3000",
   "preview": "npx vite preview --host 0.0.0.0 --port 3000"
   ```

2. Restored MQTT connection logic in `src/hooks/useMQTT.ts`:
   - Removed "standby mode" bypass that prevented real MQTT connections
   - Enabled actual MQTT broker connection with proper error handling
   - Fixed `sendMessage` function to actually publish messages

3. Rebuilt Docker image with fixes:
   ```bash
   cd /Users/brettburford/Development/CyberOps/scip-v2/team-dashboard
   docker build -t scip-team-dashboard:latest .
   ```

### 2. Configuration System Validation
**Verified Working**:
- Docker entrypoint script properly injects team configuration
- Config file `/config.js` generated with correct team settings
- HTML modified to include `<script src="/config.js"></script>`
- Team ID, colors, and MQTT settings properly configured

## MQTT Connection Fix
**Problem**: MQTT connection failures with "Connection Error - Failed to connect to exercise server. Retrying..."

**Root Cause**: 
1. Port 9001 conflict - Docker Desktop was using port 9001, preventing MQTT broker WebSocket listener
2. Docker containers using `localhost` couldn't reach host machine MQTT broker

**Solution**:
1. Switched to standard MQTT protocol (port 1883) instead of WebSocket
2. Updated orchestration service to use `host.docker.internal:1883` for Docker containers
3. Modified team dashboard MQTT connection from `ws://` to `mqtt://`

**Files Modified**:
- `/Users/brettburford/Development/CyberOps/scip-v2/orchestration-service/main-real.py:130` - Changed MQTT port from 9001 to 1883
- `/Users/brettburford/Development/CyberOps/scip-v2/team-dashboard/src/hooks/useMQTT.ts:51` - Changed from WebSocket to standard MQTT

## Current Architecture
- **Development Server**: Port 3000 (npm run dev)
- **Docker Containers**: Ports 3201-3299 (dynamically assigned)
- **Client Dashboard**: Port 3001
- **Orchestration Service**: Port 8001
- **MQTT Broker**: Port 1883 (Standard MQTT)

## Port Management
Created comprehensive port documentation in `/Users/brettburford/Development/CyberOps/scip-v2/PORT_ASSIGNMENTS.md`

## Files Modified
1. `/Users/brettburford/Development/CyberOps/scip-v2/team-dashboard/package.json` - Fixed NPM scripts
2. `/Users/brettburford/Development/CyberOps/scip-v2/team-dashboard/src/hooks/useMQTT.ts` - Restored MQTT functionality
3. `/Users/brettburford/Development/CyberOps/scip-v2/PORT_ASSIGNMENTS.md` - Created port documentation

## Validation Results
✅ Docker image builds successfully  
✅ Containers start and serve content  
✅ Configuration injection working  
✅ Team dashboards load (no longer stuck on connection screen)

## Next Steps
- Investigate MQTT connection errors in deployed containers
- Ensure MQTT broker is accessible from Docker containers
- Validate end-to-end MQTT message flow