# Docker Compose - Unified Platform Configuration
## Complete SCIP v2 Platform Setup

---

## Overview

This Docker Compose configuration provides the complete infrastructure for all three SCIP v2 systems:
1. **SCIP Control** - CyberOps administrative platform
2. **Client Dashboard** - Client organization portal (DEWC)
3. **Team Dashboards** - End-user training interfaces

All systems share the same backend infrastructure while maintaining strict data isolation through authentication and authorization.

---

## Complete Docker Compose Configuration

```yaml
version: '3.8'

services:
  # ===========================================
  # CORE INFRASTRUCTURE SERVICES
  # ===========================================
  
  # PostgreSQL Database (Shared by all systems)
  postgres:
    image: postgres:15-alpine
    container_name: scip-postgres
    environment:
      POSTGRES_DB: scip_v2
      POSTGRES_USER: scip_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-scip_secure_password}
      POSTGRES_HOST_AUTH_METHOD: scram-sha-256
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scip_user -d scip_v2"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - scip-network
    restart: unless-stopped

  # Redis Cache & Session Storage (Shared)
  redis:
    image: redis:7-alpine
    container_name: scip-redis
    command: >
      redis-server 
      --appendonly yes 
      --requirepass ${REDIS_PASSWORD:-scip_redis_password}
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - scip-network
    restart: unless-stopped

  # MQTT Broker for Real-time Communication
  mqtt:
    image: eclipse-mosquitto:2.0
    container_name: scip-mqtt
    volumes:
      - ./docker/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - ./docker/mosquitto/passwd:/mosquitto/config/passwd
      - mqtt_data:/mosquitto/data
      - mqtt_logs:/mosquitto/log
    ports:
      - "1883:1883"    # MQTT TCP
      - "9001:9001"    # MQTT WebSocket
    healthcheck:
      test: ["CMD-SHELL", "mosquitto_pub -h localhost -t test -m 'health-check' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - scip-network
    restart: unless-stopped

  # ===========================================
  # BACKEND API SERVICE (Shared by all frontends)
  # ===========================================
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: scip-backend
    environment:
      # Database Configuration
      DATABASE_URL: postgresql://scip_user:${DB_PASSWORD:-scip_secure_password}@postgres:5432/scip_v2
      
      # Redis Configuration
      REDIS_URL: redis://:${REDIS_PASSWORD:-scip_redis_password}@redis:6379/0
      
      # MQTT Configuration
      MQTT_BROKER_HOST: mqtt
      MQTT_BROKER_PORT: 1883
      MQTT_USERNAME: ${MQTT_USERNAME:-scip_service}
      MQTT_PASSWORD: ${MQTT_PASSWORD:-scip_mqtt_service}
      
      # Security Configuration
      SECRET_KEY: ${SECRET_KEY:-your-secret-key-change-in-production}
      JWT_SECRET_KEY: ${JWT_SECRET:-jwt-secret-key-change-in-production}
      
      # Admin Configuration
      ADMIN_USERNAME: ${ADMIN_USERNAME:-cyberops_admin}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-secure_admin_password}
      
      # Storage Configuration
      UPLOAD_PATH: /app/uploads
      MAX_UPLOAD_SIZE: 104857600  # 100MB
      
      # Feature Flags
      DEBUG: ${DEBUG:-false}
      ENABLE_BILLING: ${ENABLE_BILLING:-true}
      ENABLE_ANALYTICS: ${ENABLE_ANALYTICS:-true}
      ENABLE_MONITORING: ${ENABLE_MONITORING:-true}
    volumes:
      - ./backend:/app
      - ./shared:/app/shared
      - uploads_data:/app/uploads
      - ./scenarios:/app/scenarios
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mqtt:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - scip-network
    restart: unless-stopped

  # ===========================================
  # SCIP CONTROL - CyberOps Admin Interface
  # ===========================================
  
  scip-control:
    build:
      context: ./scip-control
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: scip-control-frontend
    environment:
      - VITE_API_URL=http://backend:8000/api/v1/admin
      - VITE_MQTT_URL=ws://mqtt:9001
      - VITE_APP_TITLE=SCIP Control Center
      - VITE_APP_MODE=admin
    volumes:
      - ./scip-control:/app
      - /app/node_modules  # Prevent overwriting node_modules
    ports:
      - "3000:3000"  # Admin interface on port 3000
    depends_on:
      - backend
    networks:
      - scip-network
    restart: unless-stopped

  # ===========================================
  # CLIENT DASHBOARD - DEWC Portal
  # ===========================================
  
  client-dashboard:
    build:
      context: ./client-dashboard
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: client-dashboard-frontend
    environment:
      - VITE_API_URL=http://backend:8000/api/v1/client
      - VITE_MQTT_URL=ws://mqtt:9001
      - VITE_APP_TITLE=DEWC Training Platform
      - VITE_APP_MODE=client
      - VITE_BRANDING_ENDPOINT=/api/v1/client/branding
      - VITE_ORG_ID=${CLIENT_ORG_ID:-dewc}
    volumes:
      - ./client-dashboard:/app
      - /app/node_modules
    ports:
      - "3100:3000"  # Client portal on port 3100
    depends_on:
      - backend
    networks:
      - scip-network
    restart: unless-stopped

  # ===========================================
  # TEAM DASHBOARDS - Dynamic Deployment
  # ===========================================
  
  # Team Alpha Dashboard
  team-dashboard-alpha:
    build:
      context: ./team-dashboard
      dockerfile: Dockerfile
      args:
        - TEAM_ID=alpha
        - TEAM_COLOR="#0066CC"
    container_name: team-dashboard-alpha
    environment:
      - VITE_API_URL=http://backend:8000/api/v1/dashboard
      - VITE_MQTT_URL=ws://mqtt:9001
      - VITE_TEAM_ID=alpha
      - VITE_TEAM_NAME=Blue Team Alpha
      - VITE_TEAM_COLOR=#0066CC
      - VITE_EXERCISE_ID=${EXERCISE_ID:-ex_demo}
    ports:
      - "3201:3000"  # Team Alpha on port 3201
    depends_on:
      - backend
      - mqtt
    networks:
      - scip-network
      - team-network-alpha
    restart: unless-stopped

  # Team Bravo Dashboard
  team-dashboard-bravo:
    build:
      context: ./team-dashboard
      dockerfile: Dockerfile
      args:
        - TEAM_ID=bravo
        - TEAM_COLOR="#00AA66"
    container_name: team-dashboard-bravo
    environment:
      - VITE_API_URL=http://backend:8000/api/v1/dashboard
      - VITE_MQTT_URL=ws://mqtt:9001
      - VITE_TEAM_ID=bravo
      - VITE_TEAM_NAME=Blue Team Bravo
      - VITE_TEAM_COLOR=#00AA66
      - VITE_EXERCISE_ID=${EXERCISE_ID:-ex_demo}
    ports:
      - "3202:3000"  # Team Bravo on port 3202
    depends_on:
      - backend
      - mqtt
    networks:
      - scip-network
      - team-network-bravo
    restart: unless-stopped

  # Team Charlie Dashboard
  team-dashboard-charlie:
    build:
      context: ./team-dashboard
      dockerfile: Dockerfile
      args:
        - TEAM_ID=charlie
        - TEAM_COLOR="#FF6600"
    container_name: team-dashboard-charlie
    environment:
      - VITE_API_URL=http://backend:8000/api/v1/dashboard
      - VITE_MQTT_URL=ws://mqtt:9001
      - VITE_TEAM_ID=charlie
      - VITE_TEAM_NAME=Blue Team Charlie
      - VITE_TEAM_COLOR=#FF6600
      - VITE_EXERCISE_ID=${EXERCISE_ID:-ex_demo}
    ports:
      - "3203:3000"  # Team Charlie on port 3203
    depends_on:
      - backend
      - mqtt
    networks:
      - scip-network
      - team-network-charlie
    restart: unless-stopped

  # ===========================================
  # SCENARIO EXECUTION AGENT
  # ===========================================
  
  scenario-agent:
    build:
      context: ./scenario-agent
      dockerfile: Dockerfile
    container_name: scip-scenario-agent
    environment:
      - DATABASE_URL=postgresql://scip_user:${DB_PASSWORD:-scip_secure_password}@postgres:5432/scip_v2
      - REDIS_URL=redis://:${REDIS_PASSWORD:-scip_redis_password}@redis:6379/0
      - MQTT_BROKER_HOST=mqtt
      - MQTT_BROKER_PORT=1883
      - MQTT_USERNAME=${MQTT_USERNAME:-scenario_agent}
      - MQTT_PASSWORD=${MQTT_PASSWORD:-agent_password}
    volumes:
      - ./scenario-agent:/app
      - ./scenarios:/app/scenarios
    depends_on:
      - backend
      - mqtt
      - redis
    networks:
      - scip-network
    restart: unless-stopped

  # ===========================================
  # NGINX REVERSE PROXY (Production)
  # ===========================================
  
  nginx:
    image: nginx:alpine
    container_name: scip-nginx
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - scip-control
      - client-dashboard
      - backend
    networks:
      - scip-network
    restart: unless-stopped

# ===========================================
# NETWORKS
# ===========================================

networks:
  scip-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  
  # Isolated networks for each team
  team-network-alpha:
    driver: bridge
    internal: false
  
  team-network-bravo:
    driver: bridge
    internal: false
  
  team-network-charlie:
    driver: bridge
    internal: false

# ===========================================
# VOLUMES
# ===========================================

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  mqtt_data:
    driver: local
  mqtt_logs:
    driver: local
  uploads_data:
    driver: local
```

---

## Environment Variables Configuration (.env)

Create a `.env` file in the project root:

```env
# Database Configuration
DB_PASSWORD=scip_secure_password_change_me
DB_HOST=postgres
DB_PORT=5432
DB_NAME=scip_v2

# Redis Configuration
REDIS_PASSWORD=scip_redis_password_change_me
REDIS_HOST=redis
REDIS_PORT=6379

# MQTT Configuration
MQTT_USERNAME=scip_service
MQTT_PASSWORD=scip_mqtt_service_change_me
MQTT_HOST=mqtt
MQTT_PORT=1883

# Security Keys
SECRET_KEY=your-very-long-secret-key-for-encryption-change-in-production
JWT_SECRET=your-jwt-secret-key-for-token-signing-change-in-production

# Admin Credentials
ADMIN_USERNAME=cyberops_admin
ADMIN_PASSWORD=very_secure_admin_password_change_me

# Client Configuration (DEWC)
CLIENT_ORG_ID=dewc
CLIENT_NAME=Defence Enterprise Wales Centre
CLIENT_ADMIN_EMAIL=admin@dewc.mil

# Exercise Configuration
EXERCISE_ID=ex_indo_pacific_001
MAX_TEAMS=10
MAX_CONCURRENT_EXERCISES=5

# Feature Flags
DEBUG=false
ENABLE_BILLING=true
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
ENABLE_WHITE_LABEL=true

# Storage Limits
MAX_UPLOAD_SIZE=104857600  # 100MB
STORAGE_QUOTA_GB=50

# Performance Tuning
POSTGRES_MAX_CONNECTIONS=200
REDIS_MAX_MEMORY=2gb
MQTT_MAX_CLIENTS=1000
```

---

## Directory Structure

The complete project structure should be organized as follows:

```
scip-v2/
├── docker-compose.yml              # Main orchestration file
├── .env                            # Environment variables
├── .env.example                    # Template for environment variables
│
├── backend/                        # Shared FastAPI backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                   # Database migrations
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── admin/        # SCIP Control endpoints
│   │   │       ├── client/       # Client Dashboard endpoints
│   │   │       └── dashboard/    # Team Dashboard endpoints
│   │   ├── core/                  # Security, config, database
│   │   ├── models/                # SQLAlchemy models
│   │   ├── schemas/               # Pydantic schemas
│   │   └── services/              # Business logic
│   └── tests/
│
├── scip-control/                   # CyberOps Admin Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── stores/
│   └── public/
│
├── client-dashboard/               # Client Portal Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── stores/
│   └── public/
│       └── branding/              # Client logos and assets
│
├── team-dashboard/                 # Team Interface Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── feeds/            # News, social, docs
│   │   │   ├── decisions/       # Decision capture
│   │   │   └── alerts/          # Alert system
│   │   ├── services/
│   │   └── stores/
│   └── public/
│
├── scenario-agent/                 # Python Scenario Executor
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── agent.py
│   ├── mqtt_handler.py
│   ├── state_tracker.py
│   └── inject_executor.py
│
├── shared/                         # Shared code/types
│   ├── types/                    # TypeScript interfaces
│   ├── schemas/                  # JSON schemas
│   └── constants/                # Shared constants
│
├── docker/                         # Docker configurations
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── ssl/                  # SSL certificates
│   ├── mosquitto/
│   │   ├── mosquitto.conf
│   │   └── passwd                # MQTT user passwords
│   └── init-db.sql               # Database initialization
│
├── scenarios/                      # Scenario storage
│   ├── templates/                # Master templates
│   ├── organizations/            # Org-specific scenarios
│   └── active/                   # Running scenarios
│
├── uploads/                        # Media uploads
│   ├── images/
│   ├── videos/
│   └── documents/
│
├── scripts/                        # Utility scripts
│   ├── setup.sh                  # Initial setup script
│   ├── reset.sh                  # Reset environment
│   ├── deploy-team.sh            # Deploy team dashboard
│   └── backup.sh                 # Backup data
│
└── docs/                          # Documentation
    ├── setup.md
    ├── api.md
    ├── deployment.md
    └── troubleshooting.md
```

---

## Service Configuration Files

### Nginx Configuration (docker/nginx/nginx.conf)

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Upstream definitions
    upstream backend {
        server backend:8000;
    }

    upstream scip_control {
        server scip-control:3000;
    }

    upstream client_dashboard {
        server client-dashboard:3000;
    }

    # Main server block
    server {
        listen 80;
        server_name _;

        # API Routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SCIP Control (Admin)
        location /admin/ {
            proxy_pass http://scip_control/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Client Dashboard
        location /client/ {
            proxy_pass http://client_dashboard/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Team Dashboards (Dynamic routing)
        location ~ ^/team/([a-z]+)/ {
            set $team $1;
            proxy_pass http://team-dashboard-$team:3000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket support for MQTT
        location /mqtt {
            proxy_pass http://mqtt:9001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Default route
        location / {
            return 301 /client/;
        }
    }
}
```

### Mosquitto Configuration (docker/mosquitto/mosquitto.conf)

```conf
# Mosquitto Configuration for SCIP v2

# Listeners
listener 1883
protocol mqtt

listener 9001
protocol websockets

# Security
allow_anonymous false
password_file /mosquitto/config/passwd

# Persistence
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_type all

# Performance
max_connections 1000
max_inflight_messages 100
max_queued_messages 1000

# Access Control Rules
acl_file /mosquitto/config/acl.conf
```

### Database Initialization (docker/init-db.sql)

```sql
-- Initialize SCIP v2 Database

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'client_admin', 'operator');
CREATE TYPE subscription_tier AS ENUM ('consumer', 'builder', 'enterprise');
CREATE TYPE scenario_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE exercise_status AS ENUM ('scheduled', 'running', 'completed', 'cancelled');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subscription_tier subscription_tier DEFAULT 'consumer',
    branding_config JSONB DEFAULT '{}',
    resource_quotas JSONB DEFAULT '{}',
    billing_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios table
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    config JSONB NOT NULL,
    triggers JSONB DEFAULT '[]',
    status scenario_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    scenario_id UUID REFERENCES scenarios(id),
    organization_id UUID REFERENCES organizations(id),
    config JSONB NOT NULL,
    status exercise_status DEFAULT 'scheduled',
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team assignments table
CREATE TABLE team_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID REFERENCES exercises(id),
    team_id VARCHAR(50) NOT NULL,
    team_name VARCHAR(100),
    team_color VARCHAR(7),
    dashboard_port INTEGER,
    participants JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_scenarios_org ON scenarios(organization_id);
CREATE INDEX idx_exercises_org ON exercises(organization_id);
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_audit_user ON audit.activity_log(user_id);
CREATE INDEX idx_audit_org ON audit.activity_log(organization_id);

-- Row Level Security
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Insert default data
INSERT INTO organizations (identifier, name, subscription_tier) VALUES
('cyberops', 'CyberOps', 'enterprise'),
('dewc', 'Defence Enterprise Wales Centre', 'builder');

-- Create default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (email, username, password_hash, role, organization_id) VALUES
('admin@cyberops.io', 'cyberops_admin', crypt('admin123', gen_salt('bf')), 'super_admin', 
 (SELECT id FROM organizations WHERE identifier = 'cyberops'));
```

---

## Deployment Commands

### Initial Setup

```bash
# Clone repository and navigate to project
cd scip-v2

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build all services
docker-compose build

# Initialize database
docker-compose up -d postgres
sleep 10  # Wait for postgres to initialize
docker-compose exec postgres psql -U scip_user -d scip_v2 -f /docker-entrypoint-initdb.d/init-db.sql

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
docker-compose logs -f --tail=50
```

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend
docker-compose logs -f scip-control

# Scale team dashboards
docker-compose up -d --scale team-dashboard-alpha=1

# Execute commands in containers
docker-compose exec backend python -m alembic upgrade head
docker-compose exec postgres psql -U scip_user -d scip_v2
```

### Development Mode

```bash
# Start with hot-reload for development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run specific service in development
docker-compose run --rm --service-ports scip-control npm run dev

# Access service shells
docker-compose exec backend /bin/bash
docker-compose exec scip-control /bin/sh
```

---

## Access URLs

After starting all services, access the systems at:

- **SCIP Control (Admin):** http://localhost:3000
- **Client Dashboard (DEWC):** http://localhost:3100
- **Team Dashboard Alpha:** http://localhost:3201
- **Team Dashboard Bravo:** http://localhost:3202
- **Team Dashboard Charlie:** http://localhost:3203
- **Backend API:** http://localhost:8000/docs
- **MQTT WebSocket:** ws://localhost:9001

With Nginx proxy:
- **Admin:** http://localhost/admin/
- **Client:** http://localhost/client/
- **Teams:** http://localhost/team/alpha/

---

## Health Checks

### Service Health Endpoints

```bash
# Backend API health
curl http://localhost:8000/health

# Database connection
docker-compose exec postgres pg_isready

# Redis connection
docker-compose exec redis redis-cli ping

# MQTT broker
docker-compose exec mqtt mosquitto_pub -h localhost -t test -m "health"

# Frontend services
curl http://localhost:3000/health
curl http://localhost:3100/health
```

---

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check for services using required ports
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   lsof -i :1883  # MQTT
   lsof -i :3000  # Frontend ports
   ```

2. **Database connection issues:**
   ```bash
   # Reset database
   docker-compose down -v
   docker-compose up -d postgres
   docker-compose exec postgres createdb -U scip_user scip_v2
   ```

3. **MQTT connection failures:**
   ```bash
   # Check MQTT logs
   docker-compose logs mqtt
   # Test MQTT connection
   docker-compose exec mqtt mosquitto_sub -h localhost -t test -C 1
   ```

4. **Frontend build errors:**
   ```bash
   # Clear node_modules and rebuild
   docker-compose exec scip-control rm -rf node_modules
   docker-compose exec scip-control npm install
   docker-compose restart scip-control
   ```

---

## Performance Tuning

### PostgreSQL Optimization

```sql
-- Add to postgresql.conf or docker environment
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

### Redis Optimization

```conf
# Add to redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
```

### Docker Resource Limits

```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

---

This complete Docker configuration provides a production-ready setup for the SCIP v2 platform with all three systems properly integrated and isolated.