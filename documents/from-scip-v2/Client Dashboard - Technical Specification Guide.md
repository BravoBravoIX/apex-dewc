# Client Dashboard - Technical Specification Guide
## Client Organization Administrative Portal

---

## System Overview

**Purpose:** The Client Dashboard is the branded administrative interface used by client organizations (like DEWC) to manage their scenarios, configure training exercises, launch simulations, and monitor team performance. It provides a professional, white-labeled experience while maintaining strict data isolation.

**Users:** Client administrators and training coordinators

**Access Level:** Client Admin (organization-scoped access only)

---

## Technology Stack

### Backend (Shared with SCIP Control)
- **Framework:** FastAPI (Python 3.11+) - Same backend, different endpoints
- **Database:** PostgreSQL 15 - Shared database with row-level security
- **Cache:** Redis 7 - Client-specific cache keys
- **Message Queue:** MQTT - Client-scoped topics
- **Authentication:** JWT with organization scope
- **API Gateway:** Organization-filtered endpoints

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with dynamic theming
- **State Management:** Redux Toolkit with organization context
- **Routing:** React Router v6 with protected routes
- **Forms:** React Hook Form
- **UI Components:** Shared component library with theming
- **Data Fetching:** Axios with React Query
- **Tables:** TanStack Table for scenario lists
- **Real-time:** Socket.io client for live updates

### Branding & Theming
- **Dynamic Branding:** Runtime configuration loading
- **Theme System:** CSS variables for colors
- **Logo Management:** Dual-logo support (client + CyberOps)
- **Font Loading:** Dynamic font import based on config

---

## Core Features

### 1. Branded Login & Authentication
**Purpose:** Professional branded entry point for client organizations

**Functionality:**
- **Branded Login Page**
  - Client logo and colors
  - Organization-specific URL subdomain support
  - Custom welcome messages
  - Password reset workflow
  
- **Session Management**
  - JWT tokens with organization scope
  - Automatic token refresh
  - Session timeout warnings
  - Multi-device session tracking

**Authentication Flow:**
```javascript
// JWT Payload Structure
{
  "user_id": "usr_123",
  "organization_id": "org_dewc",
  "role": "client_admin",
  "permissions": ["scenario.launch", "team.manage", "report.view"],
  "exp": 1234567890
}
```

### 2. Scenario Catalog & Management
**Purpose:** Browse and manage available scenarios for the organization

**Functionality:**
- **Scenario Browser**
  - Grid/list view of available scenarios
  - Filtering by domain, difficulty, duration
  - Search functionality
  - Scenario preview with details
  
- **Scenario Details View**
  ```json
  {
    "id": "scn_001",
    "name": "Indo-Pacific Crisis",
    "description": "Multi-domain crisis response",
    "thumbnail": "/assets/scenarios/indo_pacific.jpg",
    "duration": "60 minutes",
    "teams": "2-5 teams",
    "difficulty": "Intermediate",
    "domains": ["Maritime", "Information Warfare", "Cyber"],
    "learning_objectives": [
      "Crisis communication",
      "Information verification",
      "Team coordination"
    ],
    "prerequisites": ["Basic maritime knowledge"],
    "equipment_required": ["Computer per team", "Internet connection"]
  }
  ```

- **Scenario Customization**
  - Difficulty adjustment
  - Duration modification
  - Team count selection
  - Optional trigger configuration
  - Custom briefing documents

### 3. Training Exercise Configuration
**Purpose:** Configure and prepare scenarios for execution

**Configuration Interface:**
- **Exercise Setup Form**
  - Exercise name and description
  - Scheduled date and time
  - Participant roster
  - Team assignments
  - Communication channels
  
- **Team Configuration**
  ```javascript
  const teamConfig = {
    teams: [
      {
        id: "team_a",
        name: "Blue Team Alpha",
        color: "#0066CC",
        participants: ["user1", "user2", "user3"],
        dashboard_port: 3001,
        capabilities: ["full"]
      },
      {
        id: "team_b", 
        name: "Blue Team Bravo",
        color: "#00AA66",
        participants: ["user4", "user5"],
        dashboard_port: 3002,
        capabilities: ["limited"]
      }
    ],
    communication: {
      internal: true,
      cross_team: false,
      with_control: true
    }
  }
  ```

- **Pre-Exercise Checklist**
  - Participant readiness
  - System requirements check
  - Scenario content review
  - Briefing document distribution
  - Technical setup validation

### 4. Exercise Launch Control
**Purpose:** Launch and control live training exercises

**Launch Interface:**
- **Pre-Launch Validation**
  - All teams connected
  - Dashboard health checks
  - MQTT connectivity test
  - Content delivery verification
  
- **Launch Controls**
  - Start exercise button
  - Countdown timer
  - Emergency stop
  - Pause/resume capability
  - Manual trigger override

- **Launch Sequence:**
  ```python
  # Backend launch process
  def launch_exercise(exercise_id, organization_id):
      # 1. Validate permissions
      # 2. Spin up team dashboards
      # 3. Initialize MQTT channels
      # 4. Load scenario triggers
      # 5. Start timing engine
      # 6. Send launch notification
      return {
          "status": "running",
          "dashboards": {
              "team_a": "https://training.dewc.com:3001",
              "team_b": "https://training.dewc.com:3002",
              "team_c": "https://training.dewc.com:3003"
          },
          "monitor_url": "https://dewc.scip.io/monitor/ex_123"
      }
  ```

### 5. Real-Time Exercise Monitoring
**Purpose:** Monitor ongoing exercises and team performance

**Monitoring Dashboard:**
- **Exercise Timeline**
  - Visual timeline with current position
  - Upcoming triggers highlighted
  - Completed events marked
  - Team-specific event tracking
  
- **Team Status Grid**
  ```
  ┌─────────────┬──────────┬───────────┬──────────┐
  │ Team        │ Status   │ Progress  │ Decisions│
  ├─────────────┼──────────┼───────────┼──────────┤
  │ Blue Alpha  │ ✅ Active│ 12/15     │ 3/3      │
  │ Blue Bravo  │ ✅ Active│ 11/15     │ 2/3      │
  │ Blue Charlie│ ⚠️ Delayed│ 9/15     │ 2/3      │
  └─────────────┴──────────┴───────────┴──────────┘
  ```

- **Live Metrics**
  - Trigger delivery success rate
  - Team response times
  - Decision capture status
  - System performance indicators
  - Participant engagement levels

- **Intervention Tools**
  - Send message to specific team
  - Inject additional content
  - Adjust timing on the fly
  - Skip or repeat triggers
  - Emergency communications

### 6. Post-Exercise Analysis
**Purpose:** Review exercise outcomes and generate reports

**Analysis Features:**
- **Exercise Replay**
  - Timeline replay with all events
  - Team decision review
  - Communication logs
  - Performance metrics
  
- **Performance Analytics**
  - Team comparison charts
  - Decision quality scoring
  - Response time analysis
  - Collaboration effectiveness
  
- **Report Generation**
  - Executive summary
  - Detailed team reports
  - Individual performance
  - Lessons learned
  - Improvement recommendations

**Report Export Formats:**
- PDF with branding
- Excel with raw data
- PowerPoint presentation
- JSON for integration

### 7. Team & User Management
**Purpose:** Manage training participants and teams

**Management Interface:**
- **User Roster**
  - Add/remove participants
  - Role assignments (operator, observer)
  - Contact information
  - Training history
  
- **Team Templates**
  - Pre-defined team structures
  - Quick assignment tools
  - Capability matrices
  - Communication protocols

### 8. Resource Library
**Purpose:** Access training materials and documentation

**Library Contents:**
- **Training Materials**
  - Scenario guides
  - Briefing templates
  - Standard operating procedures
  - Reference documents
  
- **Media Assets**
  - Approved images
  - Video content
  - Audio files
  - Document templates

---

## API Endpoints (Client-Scoped)

All endpoints automatically filter by organization_id from JWT:

### Scenarios
```
GET    /api/v1/client/scenarios                List available scenarios
GET    /api/v1/client/scenarios/{id}          Get scenario details
POST   /api/v1/client/scenarios/{id}/preview  Preview scenario content
```

### Exercises
```
POST   /api/v1/client/exercises               Create exercise
GET    /api/v1/client/exercises               List exercises
GET    /api/v1/client/exercises/{id}          Get exercise details
PUT    /api/v1/client/exercises/{id}          Update exercise
POST   /api/v1/client/exercises/{id}/launch   Launch exercise
POST   /api/v1/client/exercises/{id}/stop     Stop exercise
GET    /api/v1/client/exercises/{id}/status   Get exercise status
```

### Teams
```
POST   /api/v1/client/teams                   Create team
GET    /api/v1/client/teams                   List teams
PUT    /api/v1/client/teams/{id}              Update team
DELETE /api/v1/client/teams/{id}              Delete team
POST   /api/v1/client/teams/{id}/assign       Assign users to team
```

### Monitoring
```
GET    /api/v1/client/monitor/{exercise_id}   Real-time monitoring data
GET    /api/v1/client/monitor/{exercise_id}/timeline   Timeline status
GET    /api/v1/client/monitor/{exercise_id}/teams      Team status
POST   /api/v1/client/monitor/{exercise_id}/intervene  Manual intervention
```

### Reports
```
GET    /api/v1/client/reports                 List reports
GET    /api/v1/client/reports/{id}            Get report
POST   /api/v1/client/reports/generate        Generate report
GET    /api/v1/client/reports/{id}/export     Export report
```

---

## User Interface Design

### 1. Dashboard Home
```
┌────────────────────────────────────────────────┐
│ [DEWC Logo]           SCIP Training    [User]  │
├────────────────────────────────────────────────┤
│                                                 │
│  Welcome to DEWC Training Platform             │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Active   │ │ Scheduled│ │ Completed│      │
│  │ Exercises│ │ This Week│ │ This Month│     │
│  │    2     │ │    5     │ │    12    │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│                                                 │
│  Quick Actions:                                │
│  [Launch Exercise] [Browse Scenarios]          │
│  [View Reports]    [Manage Teams]              │
│                                                 │
└────────────────────────────────────────────────┘
```

### 2. Scenario Browser
- Card-based grid layout
- Scenario thumbnails
- Quick info badges (duration, teams, difficulty)
- Hover for detailed preview
- Launch button on each card

### 3. Exercise Configuration
- Multi-step wizard interface
- Progress indicator
- Validation at each step
- Review before launch
- Save draft capability

### 4. Monitoring Dashboard
- Full-screen monitoring mode
- Multiple panel layouts
- Customizable widget placement
- Real-time data updates
- Alert notifications

---

## Branding Configuration

### Dynamic Branding System
```javascript
// Branding configuration loaded at runtime
const brandingConfig = {
  organization: {
    name: "DEWC",
    tagline: "Defence Enterprise Wales Centre"
  },
  logos: {
    primary: "/brands/dewc/logo.svg",
    secondary: "/brands/cyberops/logo.svg",
    favicon: "/brands/dewc/favicon.ico"
  },
  colors: {
    primary: "#0052CC",
    secondary: "#FF5630",
    accent: "#00B8D9",
    success: "#36B37E",
    warning: "#FFAB00",
    error: "#FF5630"
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    headingFont: "Inter, sans-serif"
  },
  features: {
    showCyberOpsLogo: true,
    customDomain: "training.dewc.com",
    supportEmail: "support@dewc.com"
  }
}
```

### CSS Variable Implementation
```css
:root {
  --brand-primary: var(--config-primary, #0052CC);
  --brand-secondary: var(--config-secondary, #FF5630);
  --brand-accent: var(--config-accent, #00B8D9);
  /* Automatically applied throughout UI */
}
```

---

## Security & Data Isolation

### Organization Isolation
- All queries filtered by organization_id
- Separate Redis cache namespaces
- Isolated MQTT topic trees
- Independent file storage paths

### Row-Level Security
```sql
-- PostgreSQL RLS Policy Example
CREATE POLICY client_scenarios ON scenarios
  FOR ALL
  TO client_role
  USING (organization_id = current_setting('app.organization_id'));
```

### API Security
- Organization validation on every request
- Rate limiting per organization
- API quota enforcement
- Audit logging of all actions

---

## Development Configuration

### Environment Variables
```env
# Client-specific configuration
CLIENT_PORTAL_URL=https://portal.scip.io
ENABLE_BRANDING=true
ENABLE_WHITE_LABEL=true

# Feature flags
ENABLE_CUSTOM_SCENARIOS=false  # Phase 2
ENABLE_API_ACCESS=false        # Phase 2
ENABLE_ADVANCED_ANALYTICS=true

# Resource limits
MAX_CONCURRENT_EXERCISES=5
MAX_TEAMS_PER_EXERCISE=10
MAX_USERS_PER_ORG=100
STORAGE_QUOTA_GB=50
```

### Docker Service (Shared with SCIP Control)
```yaml
services:
  client-frontend:
    build:
      context: ./client-dashboard
      dockerfile: Dockerfile
    environment:
      - API_URL=http://backend:8000
      - ORG_CONFIG_ENDPOINT=/api/v1/client/branding
    ports:
      - "3100:3000"  # Different port from SCIP Control
    depends_on:
      - backend
```

---

## Performance Optimization

### Frontend Optimization
- Lazy loading of scenario content
- Image optimization and CDN delivery
- Code splitting by route
- Caching of branding configuration
- WebSocket connection pooling

### Backend Optimization
- Query result caching in Redis
- Pagination for large lists
- Indexed database queries
- Async processing for reports
- Connection pooling

---

## Mobile Responsiveness

### Tablet Support (Primary)
- Optimized for iPad/tablet monitoring
- Touch-friendly controls
- Responsive grid layouts
- Landscape orientation preferred

### Mobile Phone (Limited)
- Basic monitoring capabilities
- Alert notifications
- Emergency controls
- Not recommended for full operation

---

## Integration Points

### External Systems
- SSO integration (SAML/OAuth)
- Calendar systems for scheduling
- Email notifications
- Video conferencing links
- LMS integration for results

### Webhooks
- Exercise start/stop events
- Report generation completion
- Alert notifications
- User activity events

---

## Testing Requirements

### Functional Testing
- Scenario launch workflows
- Multi-team exercise execution
- Report generation accuracy
- Branding application

### Performance Testing
- 10 concurrent exercises
- 50 simultaneous users
- Real-time update latency < 500ms
- Page load times < 2 seconds

### Security Testing
- Organization isolation verification
- Permission boundary testing
- Session management validation
- API security audit

---

## Future Enhancements

### Phase 2 Features
- Custom scenario creation interface
- Advanced branching scenarios
- API access for integrations
- Mobile app development
- Advanced analytics with ML

### Phase 3 Features
- Self-service portal
- Automated scheduling
- AI-powered exercise adaptation
- Virtual reality interfaces
- Global exercise coordination