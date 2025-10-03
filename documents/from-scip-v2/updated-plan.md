# SCIP v2 - Simplified System Plan

## System Overview

A simplified but functional SCIP system focused on scenario-based team exercises with media injection capabilities.

## Core Architecture

### **Components**
1. **SCIP Client Dashboard** (New container: `scip-client`)
   - React app for scenario management
   - Team configuration and media upload
   - Exercise control (start/pause/stop/reset)
   - Real-time analytics and monitoring

2. **Team Dashboards** (Dynamic containers)
   - Use existing `/team-dashboard` React source
   - Deploy via orchestration service on ports 3201-3299
   - Display injected media on relevant pages (Twitter, news, etc.)

3. **Infrastructure**
   - **MQTT Broker** (Mosquitto on :1883/:9001)
   - **Orchestration Service** (Python FastAPI on :8001)
   - **NO DATABASE** (JSON file storage + in-memory)
   - **NO Redis** (simplified approach)

### **System Flow**
```
SCIP Client (:3001)
    ↓ (scenario config, media upload)
JSON Storage (scenarios/{scenario-id}/)
    ↓ (orchestration API)
Orchestration Service (:8001)
    ↓ (MQTT inject triggers)
MQTT Broker (:1883/:9001)
    ↓ (team-specific topics)
Team Dashboards (:3201-3299)
```

## Use Case Requirements

### **Scenario Management**
- **Scenario Configuration**: Description, duration, max teams (up to 6)
- **Team Creation**: Dynamic team creation with individual JSON configs
- **Media Upload**: Images uploaded via client dashboard with thumbnail preview
- **Timeline Configuration**: Set injection times for each team's media

### **Injection System**
- **Team-Specific Injections**: Different content per team (e.g., Blue Team gets different tweets than Red Team)
- **Media Display**: Images appear on relevant dashboard pages (Twitter, news feeds, alerts)
- **Timed Execution**: Media appears at configured intervals (e.g., every 5 minutes)

### **Exercise Control**
- **Pre-Launch State**: Teams deployed but no injections until manually started
- **Exercise States**:
  - **Stopped** (configured but not started)
  - **Running** (injections active based on timeline)
  - **Paused** (timeline paused, can resume)
  - **Ended** (completed or manually stopped)
  - **Reset** (return to pre-launch state)
- **Global Controls**: All teams affected simultaneously by pause/stop/reset

### **Client Dashboard Organization**
1. **Scenarios Tab**: Create/select/configure scenarios
2. **Teams Tab**: Add teams, upload media, configure injection timelines
3. **Exercise Control**: Start/pause/stop/reset with real-time status
4. **Analytics**: Live monitoring of team dashboards and injection status
5. **Media Library**: Thumbnail view of uploaded images per team

## Technical Implementation

### **Storage Structure**
```
scenarios/
├── scenario-001/
│   ├── config.json              # Scenario metadata
│   ├── teams/
│   │   ├── blue-team.json       # Blue team injection timeline
│   │   ├── red-team.json        # Red team injection timeline
│   │   └── green-team.json      # Green team injection timeline
│   └── media/
│       ├── blue-team/
│       │   ├── tweet-001.jpg
│       │   └── news-002.png
│       ├── red-team/
│       │   └── alert-001.jpg
│       └── green-team/
│           └── tweet-003.png
```

### **JSON Schema Examples**

#### **Scenario Config** (`config.json`)
```json
{
  "id": "scenario-001",
  "name": "Maritime Crisis Exercise",
  "description": "Multi-team response to port security incident",
  "duration_minutes": 60,
  "max_teams": 6,
  "created_at": "2025-09-17T12:00:00Z",
  "status": "configured|running|paused|ended"
}
```

#### **Team Injection Timeline** (`teams/blue-team.json`)
```json
{
  "team_id": "blue-team",
  "team_name": "Blue Team",
  "injections": [
    {
      "id": "inject-001",
      "time_offset_minutes": 5,
      "type": "media",
      "target": "twitter",
      "content": {
        "title": "Breaking: Unusual Activity at Port",
        "media_file": "blue-team/tweet-001.jpg",
        "description": "Social media report"
      }
    },
    {
      "id": "inject-002",
      "time_offset_minutes": 15,
      "type": "alert",
      "target": "alerts",
      "content": {
        "title": "Security Alert",
        "media_file": "blue-team/alert-001.jpg",
        "priority": "urgent"
      }
    }
  ]
}
```

### **MQTT Topic Structure**
- `exercise/{scenario-id}/team/{team-id}/media` - Media injections
- `exercise/{scenario-id}/team/{team-id}/alerts` - Security alerts
- `exercise/{scenario-id}/control/start` - Exercise start signal
- `exercise/{scenario-id}/control/pause` - Exercise pause signal
- `exercise/{scenario-id}/control/stop` - Exercise stop signal
- `exercise/{scenario-id}/control/reset` - Exercise reset signal

### **Container Architecture**

#### **SCIP Client Container** (`scip-client`)
- **Base**: Node.js with React build
- **Port**: 3001
- **Volumes**:
  - `./scenarios:/app/scenarios` (scenario storage)
  - `./uploads:/app/uploads` (media uploads)
- **Features**:
  - Scenario CRUD operations
  - Media upload with thumbnail generation
  - Team configuration interface
  - Exercise control dashboard
  - Real-time analytics

#### **Orchestration Service** (Simplified)
- **Base**: Python FastAPI
- **Port**: 8001
- **Storage**: JSON files + in-memory state
- **Responsibilities**:
  - Team dashboard deployment
  - Exercise timeline execution
  - MQTT message publishing
  - Container lifecycle management

## Implementation Phases

### **Phase 1: Infrastructure Setup**
1. Create simplified `docker-compose.yml` (MQTT + Orchestration only)
2. Remove database dependencies
3. Implement JSON-based storage system

### **Phase 2: SCIP Client Container**
1. Create new `scip-client` Docker container
2. Restructure client dashboard for scenario management
3. Implement media upload with thumbnail preview
4. Add team configuration interface

### **Phase 3: Injection Engine**
1. Build timeline execution engine in orchestration service
2. Implement exercise state management (start/pause/stop/reset)
3. Create MQTT injection system
4. Test media display on team dashboards

### **Phase 4: Integration & Testing**
1. End-to-end scenario execution testing
2. Multi-team injection verification
3. Exercise control validation
4. Analytics and monitoring implementation

## Key Benefits

- **Simplified Architecture**: No database complexity
- **File-Based Storage**: Easy to backup/restore scenarios
- **Visual Media Management**: Thumbnail preview and drag-drop
- **Flexible Team Count**: 1-6 teams per scenario
- **Granular Control**: Individual team injections with precise timing
- **Exercise Management**: Full start/pause/stop/reset capabilities
- **Scalable**: Can add more scenarios and features later

## Next Steps

1. Stop current containers and clean environment
2. Create new `scip-client` container structure
3. Implement scenario management interface
4. Build injection timeline system
5. Test full scenario execution flow