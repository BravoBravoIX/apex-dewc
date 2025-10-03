# SCIP Control - Technical Specification Guide
## CyberOps Administrative Platform

---

## System Overview

**Purpose:** SCIP Control is the master administrative platform used by CyberOps staff to manage the entire SCIP v2 ecosystem. It provides complete control over client organizations, scenario templates, asset libraries, and system monitoring.

**Users:** CyberOps administrators and engineers only

**Access Level:** Super Admin (unrestricted platform access)

---

## Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL 15 with SQLAlchemy ORM
- **Cache:** Redis 7 for session management and caching
- **Message Queue:** MQTT (Eclipse Mosquitto 2.0) for real-time events
- **Authentication:** JWT tokens with role-based access control
- **File Storage:** Local filesystem with S3-compatible future support
- **API Documentation:** OpenAPI/Swagger auto-generated

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized builds
- **Styling:** Tailwind CSS with Gap_Analysis design system
- **State Management:** Redux Toolkit for global state
- **Routing:** React Router v6
- **Forms:** React Hook Form with Zod validation
- **UI Components:** Custom component library based on Gap_Analysis
- **Data Fetching:** Axios with React Query for caching
- **Tables:** TanStack Table (React Table v8)
- **Charts:** Recharts for analytics visualizations

### Infrastructure
- **Containerization:** Docker with Docker Compose
- **Web Server:** Nginx for reverse proxy and static files
- **Development:** Hot-reload enabled for both frontend and backend
- **Testing:** Jest + React Testing Library, Pytest for backend
- **CI/CD Ready:** GitHub Actions compatible structure

---

## Core Features

### 1. Client Organization Management
**Purpose:** Complete lifecycle management of client organizations

**Functionality:**
- **Create Organizations**
  - Organization name, identifier, contact details
  - Subscription tier selection (Consumer/Builder/Enterprise)
  - Billing configuration and payment tracking
  - Resource quotas and limits
  
- **Branding Configuration**
  - Upload client logos (primary and secondary)
  - Define color schemes (primary, secondary, accent colors)
  - Set typography preferences
  - Configure email templates
  
- **Access Control**
  - Create client admin accounts
  - Set organization-wide permissions
  - Define scenario access levels
  - Configure API rate limits

**Database Schema:**
```sql
organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  identifier VARCHAR(100) UNIQUE NOT NULL,
  subscription_tier ENUM('consumer', 'builder', 'enterprise'),
  branding_config JSONB,
  resource_quotas JSONB,
  billing_config JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
)

organization_users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role ENUM('admin', 'operator'),
  permissions JSONB,
  created_at TIMESTAMP
)
```

### 2. Master Scenario Library
**Purpose:** Create and manage scenario templates available to clients

**Functionality:**
- **Scenario Templates**
  - Create reusable scenario templates
  - Define trigger sequences and timing
  - Set team configurations
  - Specify required assets
  
- **Content Management**
  - Rich text editor for news articles
  - Social media post generator
  - Document template system
  - Media asset linking
  
- **Scenario Configuration**
  ```json
  {
    "id": "scn_indo_pacific_001",
    "name": "Indo-Pacific Crisis Response",
    "description": "Multi-domain crisis scenario",
    "duration_minutes": 60,
    "difficulty": "intermediate",
    "teams_supported": [2, 3, 4, 5],
    "domains": ["maritime", "cyber", "information"],
    "triggers": [
      {
        "id": "trg_001",
        "time_offset": 120,
        "type": "news_article",
        "content": {},
        "target_teams": ["all"]
      }
    ],
    "required_assets": ["news_feed", "social_media", "email"],
    "learning_objectives": []
  }
  ```

- **Version Control**
  - Track scenario versions
  - Changelog management
  - Rollback capabilities
  - A/B testing support

### 3. Asset Library Management
**Purpose:** Centralized management of all platform assets

**Asset Categories:**
- **Infrastructure Assets**
  - Virtual machine templates
  - Network configurations
  - Simulated systems (SCADA, industrial control)
  
- **UI Components**
  - Dashboard templates
  - Widget libraries
  - Visualization components
  
- **Content Assets**
  - Media files (images, videos, audio)
  - Document templates
  - Brand assets
  
- **Integration Assets**
  - API connectors
  - Webhook templates
  - External system interfaces

**Asset Metadata:**
```json
{
  "id": "asset_001",
  "name": "News Dashboard Widget",
  "type": "ui_component",
  "category": "dashboard",
  "version": "2.1.0",
  "compatibility": ["v2.0+"],
  "dependencies": ["mqtt_client", "react_18"],
  "configuration_schema": {},
  "preview_url": "/assets/previews/news_widget.png",
  "documentation_url": "/docs/assets/news_widget"
}
```

### 4. System Monitoring Dashboard
**Purpose:** Real-time monitoring of entire platform health

**Monitoring Panels:**
- **Infrastructure Health**
  - Service status (API, Database, MQTT, Redis)
  - Resource utilization (CPU, Memory, Disk)
  - Network throughput
  - Error rates and logs
  
- **Client Activity**
  - Active organizations
  - Concurrent scenarios
  - User sessions
  - API usage statistics
  
- **Scenario Execution**
  - Running scenarios
  - Team participation
  - Trigger delivery success rates
  - Performance metrics

**Alert System:**
- Critical service failures
- Resource threshold warnings
- Unusual activity detection
- Client quota exceeded notifications

### 5. Billing & Usage Analytics
**Purpose:** Track platform usage and generate billing

**Features:**
- **Usage Tracking**
  - Scenario executions per client
  - Storage consumption
  - API calls
  - Concurrent users
  
- **Billing Generation**
  - Automated monthly invoices
  - Usage-based charging
  - Overage calculations
  - Payment tracking
  
- **Analytics Reports**
  - Client engagement metrics
  - Popular scenarios
  - Resource utilization trends
  - Revenue forecasting

### 6. Advanced Configuration
**Purpose:** Platform-wide settings and configurations

**Configuration Areas:**
- **Security Settings**
  - Password policies
  - Session timeouts
  - IP whitelisting
  - Audit log retention
  
- **Performance Tuning**
  - Cache settings
  - Database connection pools
  - MQTT broker parameters
  - Rate limiting rules
  
- **Integration Management**
  - Webhook endpoints
  - External API keys
  - SSO configuration
  - Export formats

---

## API Endpoints

### Organizations
```
POST   /api/v1/admin/organizations              Create organization
GET    /api/v1/admin/organizations              List all organizations
GET    /api/v1/admin/organizations/{id}         Get organization details
PUT    /api/v1/admin/organizations/{id}         Update organization
DELETE /api/v1/admin/organizations/{id}         Archive organization
POST   /api/v1/admin/organizations/{id}/users   Add user to organization
```

### Scenarios
```
POST   /api/v1/admin/scenarios                  Create scenario template
GET    /api/v1/admin/scenarios                  List all scenarios
GET    /api/v1/admin/scenarios/{id}            Get scenario details
PUT    /api/v1/admin/scenarios/{id}            Update scenario
DELETE /api/v1/admin/scenarios/{id}            Archive scenario
POST   /api/v1/admin/scenarios/{id}/assign     Assign to organization
POST   /api/v1/admin/scenarios/{id}/clone      Clone scenario
```

### Assets
```
POST   /api/v1/admin/assets                     Upload asset
GET    /api/v1/admin/assets                     List assets
GET    /api/v1/admin/assets/{id}               Get asset details
PUT    /api/v1/admin/assets/{id}               Update asset metadata
DELETE /api/v1/admin/assets/{id}               Delete asset
POST   /api/v1/admin/assets/{id}/assign        Assign to organization
```

### Monitoring
```
GET    /api/v1/admin/health                     System health status
GET    /api/v1/admin/metrics                    Platform metrics
GET    /api/v1/admin/logs                       System logs
GET    /api/v1/admin/alerts                     Active alerts
POST   /api/v1/admin/alerts/{id}/acknowledge   Acknowledge alert
```

### Billing
```
GET    /api/v1/admin/billing/usage              Usage statistics
GET    /api/v1/admin/billing/invoices           List invoices
POST   /api/v1/admin/billing/generate           Generate invoice
GET    /api/v1/admin/billing/reports            Financial reports
```

---

## User Interface Components

### 1. Main Dashboard
- System status overview cards
- Active scenario count
- Client organization summary
- Recent activity feed
- Quick action buttons

### 2. Organization Manager
- Sortable/filterable organization table
- Organization detail modal
- User assignment interface
- Branding preview
- Usage statistics per org

### 3. Scenario Builder
- Visual timeline editor (simplified from drag-drop)
- Trigger configuration forms
- Content preview panels
- Team assignment matrix
- Testing/validation tools

### 4. Asset Library Browser
- Grid/list view toggle
- Category filtering
- Search functionality
- Asset preview
- Usage tracking

### 5. Monitoring Center
- Real-time status indicators
- Performance graphs
- Log viewer with filtering
- Alert management panel
- Client activity heat map

---

## Security Considerations

### Authentication & Authorization
- Multi-factor authentication required
- IP whitelisting for admin access
- Session timeout after 30 minutes of inactivity
- Audit logging of all admin actions

### Data Protection
- Encrypted storage for sensitive configuration
- TLS for all API communications
- Database encryption at rest
- Regular security audits

### Access Control
- Role-based permissions system
- Granular action permissions
- Organization isolation
- API key management with rotation

---

## Development Setup

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://scip_user:password@postgres:5432/scip_v2

# Redis
REDIS_URL=redis://:password@redis:6379/0

# MQTT
MQTT_BROKER_HOST=mqtt
MQTT_BROKER_PORT=1883
MQTT_USERNAME=admin
MQTT_PASSWORD=admin_password

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret
ADMIN_USERNAME=cyberops_admin
ADMIN_PASSWORD=secure_password

# Storage
UPLOAD_PATH=/app/uploads
MAX_UPLOAD_SIZE=104857600  # 100MB

# Features
ENABLE_BILLING=true
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
```

### Docker Services Required
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scip_v2
      POSTGRES_USER: scip_user
      POSTGRES_PASSWORD: scip_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  mqtt:
    image: eclipse-mosquitto:2.0
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mqtt_data:/mosquitto/data
    ports:
      - "1883:1883"
      - "9001:9001"
```

---

## Testing Strategy

### Unit Tests
- API endpoint testing with pytest
- React component testing with Jest
- Database model validation
- Utility function testing

### Integration Tests
- Full API workflow testing
- Database transaction testing
- MQTT message flow testing
- Authentication flow validation

### E2E Tests
- Complete organization creation flow
- Scenario creation and assignment
- User management workflows
- Billing calculation verification

---

## Performance Requirements

- API response time: < 200ms for 95% of requests
- Dashboard load time: < 2 seconds
- Concurrent users supported: 100+
- Database query optimization: < 50ms
- Real-time updates latency: < 100ms via MQTT

---

## Future Enhancements

### Phase 2 (Months 2-3)
- Advanced scenario branching logic
- AI-powered scenario generation
- Automated client onboarding
- Advanced analytics with ML insights

### Phase 3 (Months 4-6)
- Multi-region deployment support
- Advanced RF integration management
- Hardware-in-the-loop configuration
- Marketplace for third-party assets

### Phase 4 (Months 7-12)
- White-label platform deployment
- Client self-service portal
- Advanced compliance reporting
- API ecosystem development