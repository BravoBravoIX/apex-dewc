# SCIP v3 Architecture

## System Architecture Overview

The SCIP v3 platform uses an MQTT-driven architecture for real-time inject delivery to isolated team dashboards during synchronized exercises.

```
┌─────────────────────┐         ┌─────────────────────┐
│   Client Dashboard  │────────▶│ Orchestration       │
│   (DEWC Portal)     │         │ Service             │
└─────────────────────┘         └──────────┬──────────┘
                                           │
                                           ▼
                               ┌─────────────────────┐
                               │   MQTT Broker       │
                               │ (Eclipse Mosquitto) │
                               └──────────┬──────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
         │ Team Dashboard   │  │ Team Dashboard   │  │ Team Dashboard   │
         │ (Blue Team)      │  │ (Red Team)       │  │ (Orange Team)    │
         └──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Core Architecture Principles

### 1. MQTT-Driven Message Delivery
- Central MQTT broker handles all real-time communication
- Topic-based routing ensures team isolation
- Quality of Service (QoS) levels for reliability
- Automatic reconnection handling

### 2. Synchronized Timeline Execution
- Single exercise timer for all teams
- Injects fire at exact predetermined times
- All teams start at T+0 simultaneously
- Coordinated delivery across multiple timelines

### 3. Local Media Storage
- Media files stored on local filesystem
- Direct access by team dashboards on same machine
- Organized directory structure by exercise
- No need for complex CDN or base64 encoding

### 4. Team Isolation
- Each team has dedicated MQTT topics
- Dashboards only subscribe to their team's feed
- No cross-team communication capability
- Complete information isolation

## MQTT Topic Structure

```
/exercise/{exerciseId}/control         # Start/stop/pause commands
/exercise/{exerciseId}/timer          # Current timer state
/exercise/{exerciseId}/status         # Exercise status updates
/exercise/{exerciseId}/team/{teamId}/feed  # Team-specific injects
```

### Topic Examples
```
/exercise/ex-001/control
/exercise/ex-001/timer
/exercise/ex-001/team/blue/feed
/exercise/ex-001/team/red/feed
```

## Message Flow

### 1. Exercise Start
```mermaid
Client Dashboard → Orchestration Service: Start Exercise
Orchestration Service → MQTT Broker: Publish to /control
Orchestration Service → Timer: Start T+0
```

### 2. Inject Delivery
```mermaid
Timer → Orchestration Service: T+60 reached
Orchestration Service → Timeline: Check injects at T+60
Orchestration Service → MQTT Broker: Publish inject to team topics
MQTT Broker → Team Dashboards: Deliver to subscribed teams
```

### 3. Failed Delivery & Retry
```mermaid
MQTT Broker → Orchestration Service: Delivery failed
Orchestration Service → Retry Queue: Add inject
Orchestration Service → MQTT Broker: Retry delivery
Orchestration Service → Client Dashboard: Update status
```

## Data Storage Architecture

### File System Structure
```
/media/
└── exercises/
    └── {exercise-id}/
        ├── images/           # Image files (jpg, png, gif)
        ├── videos/          # Video files (mp4, webm)
        ├── documents/       # Documents (pdf, docx)
        └── timelines/       # Timeline JSON files
            ├── blue-timeline.json
            ├── red-timeline.json
            └── orange-timeline.json
```

### Timeline Storage
- Each timeline stored as JSON file
- Contains all injects with timing and content
- Loaded at exercise start
- Can be reused across exercises

## Component Architecture

### Client Dashboard (React + Redux)
```
src/
├── pages/              # Page components
├── components/         # Reusable components
├── services/          # API and MQTT services
├── store/             # Redux store
└── utils/             # Utilities
```

### Team Dashboard (React + Zustand)
```
src/
├── feeds/             # Feed components
├── components/        # UI components
├── hooks/            # Custom hooks (useMQTT)
├── stores/           # Zustand stores
└── utils/            # Utilities
```

### Orchestration Service (Python)
```
orchestration/
├── timer.py          # Exercise timer
├── executor.py       # Timeline executor
├── mqtt_client.py    # MQTT publisher
├── models.py         # Data models
└── utils.py          # Utilities
```

## Security Considerations

### Team Isolation
- Unique authentication tokens per team
- MQTT ACL rules prevent cross-team access
- Dashboard containers run in isolation
- No shared state between teams

### Access Control
- JWT authentication for Client Dashboard
- Team tokens expire after exercise
- Read-only access for team dashboards
- Admin controls protected

## Performance Specifications

### Capacity
- Support 10+ simultaneous teams
- Handle 1000+ injects per exercise
- Sub-second inject delivery latency
- Concurrent exercise support

### Scalability
- Horizontal scaling of team dashboards
- MQTT broker clustering capability
- Load balanced orchestration services
- CDN-ready media serving (future)

## Technology Stack Details

### Backend
- **FastAPI**: REST API framework
- **Python 3.10+**: Orchestration service
- **PostgreSQL**: Exercise and timeline storage
- **Redis**: Session management and caching

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Zustand**: Lightweight state (Team Dashboards)
- **Redux Toolkit**: Complex state (Client Dashboard)
- **MQTT.js**: MQTT client library

### Infrastructure
- **Docker**: Container orchestration
- **Eclipse Mosquitto**: MQTT broker
- **Nginx**: Reverse proxy
- **Docker Compose**: Local development

## Deployment Architecture

### Development Environment
```yaml
services:
  mqtt:
    image: eclipse-mosquitto:latest
  
  orchestration:
    build: ./orchestration
    
  client-dashboard:
    build: ./client-dashboard
    ports:
      - "3000:3000"
      
  team-dashboard:
    build: ./team-dashboard
    scale: 10  # Up to 10 instances
```

### Production Environment
- Kubernetes for orchestration
- MQTT broker with persistent storage
- Load balanced services
- Automated backup systems

## Monitoring & Observability

### Metrics
- Exercise timer status
- Inject delivery success rate
- Team connection status
- System resource usage

### Logging
- Structured JSON logging
- Centralized log aggregation
- Exercise event audit trail
- Error tracking and alerting
