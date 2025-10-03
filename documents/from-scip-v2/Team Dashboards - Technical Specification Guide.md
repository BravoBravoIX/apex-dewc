# Team Dashboards - Technical Specification Guide
## End-User Training Interface

---

## System Overview

**Purpose:** Team Dashboards are the isolated, real-time interfaces used by training participants during exercises. Each team receives a separate dashboard instance displaying only their assigned information feeds, creating realistic information warfare conditions where teams must make decisions based on incomplete or conflicting information.

**Users:** Training participants (operators) assigned to specific teams

**Access Level:** Operator (read-only access to assigned content only)

---

## Technology Stack

### Backend (Lightweight Services)
- **Framework:** FastAPI endpoints for dashboard data
- **Database:** PostgreSQL (read-only access to assigned content)
- **Cache:** Redis for dashboard state
- **Message Queue:** MQTT subscriber for real-time triggers
- **Authentication:** Exercise token + team assignment
- **Session:** Ephemeral, exercise-duration only

### Frontend
- **Framework:** React 18 (lightweight build per team)
- **Build Tool:** Vite with production optimization
- **Styling:** Tailwind CSS with team color theming
- **State Management:** Zustand (lightweight alternative to Redux)
- **Real-time Updates:** MQTT.js client for WebSocket connection
- **UI Components:** Adapted from ui-portfall reference
- **Media Display:** Native HTML5 for video/audio
- **Document Viewer:** PDF.js for document display

### Deployment Architecture
- **Containerization:** Docker container per team
- **Port Management:** Dynamic port allocation (3001-3099)
- **Isolation:** Network isolation between teams
- **Scaling:** Horizontal scaling for multiple exercises
- **CDN:** Static assets served via CDN

---

## Core Features

### 1. Dashboard Authentication & Setup
**Purpose:** Secure, simple access for training participants

**Authentication Flow:**
```javascript
// Simplified auth for participants
const teamAuth = {
  exercise_id: "ex_dewc_001",
  team_id: "team_alpha",
  access_token: "temporary_token_valid_for_exercise",
  dashboard_url: "https://training.dewc.com:3001",
  valid_until: "2024-11-15T16:00:00Z"
}
```

**Login Process:**
1. Participants receive unique team URL
2. Enter simple team access code
3. Dashboard initializes with team configuration
4. MQTT subscription established
5. Ready for trigger reception

### 2. Information Feed Modules

#### News Media Feed
**Purpose:** Display news articles and breaking news alerts

**Interface:**
```
┌─────────────────────────────────────────┐
│ 📰 News Feed                     [LIVE] │
├─────────────────────────────────────────┤
│                                         │
│ BREAKING: Naval Blockade at Spratly    │
│ 2 minutes ago • ABC News               │
│ [Image: Ships at sea]                  │
│ Indonesian Navy vessels have blocked.. │
│ [Read More]                            │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Humanitarian Crisis Deepens            │
│ 15 minutes ago • Reuters               │
│ Aid organizations report critical...   │
│ [Read More]                            │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Chronological feed with timestamps
- Source attribution
- Media attachments (images/video)
- Urgency indicators (Breaking/Urgent/Standard)
- Auto-scroll for new content
- Read/unread status tracking

#### Social Media Stream
**Purpose:** Simulate social media platforms with posts and engagement

**Interface:**
```
┌─────────────────────────────────────────┐
│ 💬 Social Media                         │
├─────────────────────────────────────────┤
│                                         │
│ @IndoPacificWatch                       │
│ ⚠️ URGENT: Civilians evacuating from   │
│ Darwin port area. Military operations? │
│ 🔄 1.2K  💬 456  ❤️ 2.3K               │
│                                         │
│ @DefenseAnalyst                        │
│ Satellite imagery shows unusual naval  │
│ movements near disputed waters         │
│ [Attached image]                       │
│ 🔄 567  💬 123  ❤️ 890                 │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Twitter-style post display
- Engagement metrics (likes, shares, comments)
- Trending hashtags
- Verified/unverified accounts
- Image/video attachments
- Real-time update animation

#### Document Repository
**Purpose:** Access to leaked documents, reports, and official communications

**Interface:**
```
┌─────────────────────────────────────────┐
│ 📁 Documents                            │
├─────────────────────────────────────────┤
│                                         │
│ 🔴 CLASSIFIED - Operations Plan        │
│ Received: 5 minutes ago                │
│ Classification: SECRET                 │
│ [View Document] [Download]             │
│                                         │
│ 📄 NGO Report - Humanitarian Situation │
│ Received: 12 minutes ago               │
│ Source: Red Cross                      │
│ [View Document] [Download]             │
│                                         │
│ 📊 Intelligence Brief - Naval Activity │
│ Received: 18 minutes ago               │
│ Classification: CONFIDENTIAL            │
│ [View Document] [Download]             │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Document classification levels
- Inline PDF viewer
- Download capability
- Source attribution
- Receipt timestamps
- Search functionality

#### Email/Communications
**Purpose:** Receive direct communications and messages

**Interface:**
```
┌─────────────────────────────────────────┐
│ ✉️ Communications          [3 New]      │
├─────────────────────────────────────────┤
│                                         │
│ 🔴 FLASH: Command Priority Message     │
│ FROM: Joint Operations Command         │
│ TIME: 14:32                           │
│ Subject: Immediate Response Required   │
│                                         │
│ 🟡 URGENT: Diplomatic Communication    │
│ FROM: Embassy Jakarta                  │
│ TIME: 14:28                           │
│ Subject: Host Nation Concerns          │
│                                         │
│ 🟢 ROUTINE: Logistics Update          │
│ FROM: Supply Command                   │
│ TIME: 14:15                           │
│ Subject: Fuel Status Report            │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Priority indicators (Flash/Urgent/Routine)
- Sender identification
- Read receipts
- Reply capability (if enabled)
- Attachment support
- Folder organization

### 3. Decision Capture System
**Purpose:** Collect team decisions at critical points

**Decision Interface:**
```
┌─────────────────────────────────────────┐
│ ⚡ DECISION REQUIRED                    │
├─────────────────────────────────────────┤
│                                         │
│ Situation: Naval vessels approaching   │
│ your humanitarian convoy               │
│                                         │
│ Time Remaining: 4:32                   │
│                                         │
│ Options:                               │
│ ○ Continue on current course          │
│ ○ Alter course to avoid confrontation │
│ ○ Stop and await instructions         │
│ ○ Return to port immediately          │
│                                         │
│ Rationale: [Text input field]          │
│                                         │
│ [Submit Decision]                      │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Timed decision windows
- Multiple choice options
- Rationale capture
- Confidence level indicator
- Team consensus tools
- Decision history log

### 4. Situational Awareness Display
**Purpose:** Provide context and operational awareness

**Status Panel:**
```
┌─────────────────────────────────────────┐
│ 🌍 Situation Overview                   │
├─────────────────────────────────────────┤
│ Exercise: Indo-Pacific Crisis          │
│ Current Phase: Escalation (2/3)        │
│ Mission Time: T+22:15                  │
│ Team: Blue Alpha                       │
│                                         │
│ Operational Status:                    │
│ • Comms: OPERATIONAL                   │
│ • Intel: LIMITED                       │
│ • Supply: CRITICAL                     │
│ • Diplomatic: DEGRADED                 │
│                                         │
│ Key Objectives:                        │
│ ✓ Establish contact with HQ           │
│ ⧗ Deliver humanitarian aid            │
│ ⧗ Maintain diplomatic relations       │
│ ✗ Avoid escalation                    │
└─────────────────────────────────────────┘
```

### 5. Team Collaboration Tools
**Purpose:** Enable internal team coordination

**Team Chat:**
```javascript
// Simple team-only chat
const teamChat = {
  enabled: true,
  scope: "team_only",  // No cross-team communication
  history: "exercise_duration",
  features: ["text", "quick_reactions", "mentions"]
}
```

**Shared Notes:**
- Team scratchpad
- Collaborative editing
- Auto-save functionality
- Export capability

### 6. Alert & Notification System
**Purpose:** Ensure critical information is noticed

**Alert Types:**
- **Flash Override:** Full-screen alert, requires acknowledgment
- **Priority:** Banner notification with sound
- **Urgent:** Highlighted in feed with badge
- **Routine:** Standard feed entry

**Notification Delivery:**
```javascript
// MQTT message format for alerts
{
  "type": "alert",
  "priority": "flash",
  "title": "IMMEDIATE ACTION REQUIRED",
  "message": "Critical decision point reached",
  "require_ack": true,
  "timeout": null,
  "sound": "alert_critical.mp3"
}
```

---

## Real-Time Data Flow

### MQTT Topic Structure
```
exercise/{exercise_id}/team/{team_id}/feed     # General feed updates
exercise/{exercise_id}/team/{team_id}/news     # News articles
exercise/{exercise_id}/team/{team_id}/social   # Social media posts
exercise/{exercise_id}/team/{team_id}/docs     # Documents
exercise/{exercise_id}/team/{team_id}/email    # Communications
exercise/{exercise_id}/team/{team_id}/decision # Decision requests
exercise/{exercise_id}/team/{team_id}/alert    # Priority alerts
```

### Message Processing Pipeline
```javascript
// Dashboard MQTT client
class DashboardClient {
  constructor(teamId, exerciseId) {
    this.client = mqtt.connect('wss://mqtt.scip.io:9001', {
      username: teamId,
      password: exerciseToken,
      clientId: `dashboard_${teamId}_${Date.now()}`
    });
    
    this.subscribeToFeeds();
  }
  
  subscribeToFeeds() {
    const topics = [
      `exercise/${this.exerciseId}/team/${this.teamId}/+`
    ];
    
    this.client.subscribe(topics, (err) => {
      if (!err) {
        console.log('Connected to exercise feeds');
      }
    });
    
    this.client.on('message', (topic, payload) => {
      this.processMessage(topic, JSON.parse(payload));
    });
  }
  
  processMessage(topic, data) {
    const feedType = topic.split('/').pop();
    
    switch(feedType) {
      case 'news':
        this.updateNewsFeed(data);
        break;
      case 'social':
        this.updateSocialFeed(data);
        break;
      case 'decision':
        this.showDecisionPrompt(data);
        break;
      case 'alert':
        this.showAlert(data);
        break;
    }
  }
}
```

---

## Deployment Architecture

### Container Configuration
```yaml
# Docker configuration for team dashboard
services:
  team-dashboard-alpha:
    build:
      context: ./team-dashboard
      args:
        TEAM_ID: alpha
        TEAM_COLOR: "#0066CC"
    environment:
      - EXERCISE_ID=${EXERCISE_ID}
      - TEAM_ID=alpha
      - API_URL=http://backend:8000
      - MQTT_URL=wss://mqtt:9001
      - PORT=3001
    ports:
      - "3001:3000"
    networks:
      - exercise-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Multi-Team Deployment
```python
# Python deployment orchestrator
def deploy_team_dashboards(exercise_config):
    dashboards = {}
    base_port = 3001
    
    for idx, team in enumerate(exercise_config['teams']):
        port = base_port + idx
        
        container = docker_client.containers.run(
            image='scip/team-dashboard:latest',
            detach=True,
            ports={'3000/tcp': port},
            environment={
                'EXERCISE_ID': exercise_config['id'],
                'TEAM_ID': team['id'],
                'TEAM_NAME': team['name'],
                'TEAM_COLOR': team['color']
            },
            name=f"dashboard_{exercise_config['id']}_{team['id']}",
            network='exercise-network'
        )
        
        dashboards[team['id']] = {
            'container_id': container.id,
            'port': port,
            'url': f"https://training.scip.io:{port}"
        }
    
    return dashboards
```

---

## User Interface Design

### Layout Structure
```
┌──────────────────────────────────────────────┐
│ Team Alpha Dashboard        Exercise: Active │
├────────┬─────────────────────────────────────┤
│ News   │                                     │
│ Social │         Main Content Area           │
│ Docs   │                                     │
│ Email  │      (Selected feed displays here)  │
│ ────── │                                     │
│ Status │                                     │
│ Notes  │                                     │
│ Chat   │                                     │
└────────┴─────────────────────────────────────┘
```

### Visual Design Principles
- Clean, distraction-free interface
- High contrast for readability
- Team color accents
- Clear typography hierarchy
- Minimal animations
- Focus on content consumption

### Responsive Behavior
- Desktop: Full multi-panel layout
- Tablet: Collapsible sidebar
- Mobile: Single feed view (emergency only)

---

## Performance Optimization

### Frontend Optimization
- Virtualized lists for long feeds
- Lazy loading of media content
- Image compression and optimization
- Minimal bundle size (~200KB)
- Service worker for offline capability

### Real-time Optimization
- Message batching for high-volume periods
- Throttled UI updates (max 10/second)
- Priority queue for critical alerts
- Automatic reconnection handling
- Local state persistence

### Resource Management
```javascript
// Resource limits per dashboard
const resourceLimits = {
  maxFeedItems: 100,        // Older items archived
  maxMediaCache: 50,        // MB of cached images/videos
  maxChatHistory: 500,      // Messages retained
  updateThrottle: 100,      // ms between UI updates
  reconnectDelay: 5000,     // ms before reconnect attempt
}
```

---

## Security Considerations

### Isolation Mechanisms
- Network segmentation between teams
- Separate MQTT topic trees
- Independent Redis namespaces
- No cross-team data access
- Encrypted WebSocket connections

### Content Security
- Content Security Policy (CSP) headers
- XSS protection
- Sanitized HTML rendering
- Secure media serving
- No executable content

### Session Management
- Temporary exercise tokens
- Automatic expiry after exercise
- No persistent storage
- Memory-only state
- Clean shutdown procedures

---

## Testing Requirements

### Functional Testing
- Feed update reception
- Decision capture flow
- Alert delivery
- Media rendering
- Team isolation verification

### Load Testing
- 50 concurrent dashboards
- 100 messages/second per dashboard
- 5MB/s aggregate bandwidth
- Sub-second update latency
- 4-hour continuous operation

### Failure Testing
- Network disconnection recovery
- MQTT broker failure
- Partial content delivery
- Browser refresh handling
- Container restart resilience

---

## Monitoring & Diagnostics

### Health Checks
```javascript
// Dashboard health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    team_id: process.env.TEAM_ID,
    exercise_id: process.env.EXERCISE_ID,
    mqtt_connected: mqttClient.connected,
    last_message: lastMessageTime,
    feed_counts: {
      news: newsFeed.length,
      social: socialFeed.length,
      documents: documents.length
    }
  });
});
```

### Performance Metrics
- Message delivery latency
- UI render performance
- Memory usage
- Network bandwidth
- Error rates

---

## Configuration

### Environment Variables
```env
# Team Dashboard Configuration
EXERCISE_ID=ex_dewc_001
TEAM_ID=alpha
TEAM_NAME="Blue Team Alpha"
TEAM_COLOR=#0066CC

# API Configuration
API_URL=http://backend:8000/api/v1
API_TIMEOUT=5000

# MQTT Configuration
MQTT_URL=wss://mqtt.scip.io:9001
MQTT_USERNAME=team_alpha
MQTT_PASSWORD=exercise_token
MQTT_RECONNECT=true
MQTT_RECONNECT_DELAY=5000

# UI Configuration
ENABLE_CHAT=true
ENABLE_NOTES=true
ENABLE_DECISIONS=true
MAX_FEED_ITEMS=100
AUTO_SCROLL=true

# Performance
UPDATE_THROTTLE_MS=100
CACHE_SIZE_MB=50
```

---

## API Endpoints (Minimal)

### Dashboard Data
```
GET    /api/v1/dashboard/config          Get dashboard configuration
GET    /api/v1/dashboard/status          Get current status
POST   /api/v1/dashboard/decision        Submit decision
GET    /api/v1/dashboard/history         Get feed history
POST   /api/v1/dashboard/acknowledge     Acknowledge alert
```

### Team Collaboration
```
POST   /api/v1/team/chat                 Send chat message
GET    /api/v1/team/chat/history         Get chat history
POST   /api/v1/team/notes                Update shared notes
GET    /api/v1/team/notes                Get shared notes
```

---

## Future Enhancements

### Phase 2 Features
- Video conferencing integration
- AR/VR display options
- Multi-language support
- Advanced decision trees
- AI-powered content summarization

### Phase 3 Features
- Offline operation mode
- Mobile native apps
- Voice commands
- Biometric stress monitoring
- Automated performance coaching