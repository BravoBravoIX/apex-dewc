# Deployment Guide

## Overview

This guide provides instructions for deploying the SCIP v3 platform in development, staging, and production environments. The platform uses Docker containers for all services and can be deployed on a single machine or distributed across multiple servers.

## Prerequisites

### System Requirements

#### Minimum Requirements (Development)
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB available
- **OS**: Ubuntu 20.04+ or macOS 12+
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+

#### Recommended Requirements (Production)
- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Storage**: 200+ GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 100 Mbps minimum
- **Docker**: Latest stable version
- **Kubernetes**: Optional for scaling

### Software Dependencies
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 18+ (for local development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.10+ (for orchestration service)
sudo apt-get update
sudo apt-get install -y python3.10 python3.10-venv python3-pip
```

## Project Structure

```
scip-v3/
├── docker-compose.yml           # Main compose file
├── docker-compose.dev.yml       # Development overrides
├── docker-compose.prod.yml      # Production overrides
├── .env.example                 # Environment template
├── .env                        # Environment configuration (create from example)
│
├── client-dashboard/           # DEWC portal frontend
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── team-dashboard/            # Team dashboard frontend
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── orchestration/            # Exercise orchestration service
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│
├── api/                      # Backend API service
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│
├── mqtt/                     # MQTT broker configuration
│   ├── mosquitto.conf
│   └── acl.conf
│
├── nginx/                    # Reverse proxy configuration
│   ├── nginx.conf
│   └── sites/
│
├── media/                    # Media storage
│   └── exercises/
│
└── scripts/                  # Deployment scripts
    ├── deploy.sh
    ├── backup.sh
    └── restore.sh
```

## Environment Configuration

### Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# Edit with your configuration
nano .env
```

### Environment Variables
```env
# Application Configuration
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=scip_v3
DB_USER=scip_user
DB_PASSWORD=secure_password_change_me

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_change_me

# MQTT Configuration
MQTT_HOST=mqtt
MQTT_PORT=1883
MQTT_WS_PORT=9001
MQTT_USER=scip_mqtt
MQTT_PASSWORD=mqtt_password_change_me

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_me
JWT_EXPIRY=86400

# Media Storage
MEDIA_PATH=/media/exercises
MAX_UPLOAD_SIZE=100MB

# Exercise Configuration
MAX_TEAMS=10
MAX_EXERCISE_DURATION=7200
DEFAULT_TEAM_MEMORY=256MB
DEFAULT_TEAM_CPU=0.25

# Client Dashboard
CLIENT_PORT=3000
CLIENT_API_URL=http://localhost:8000

# Team Dashboard
TEAM_PORT_START=3100
TEAM_PORT_END=3200

# Orchestration Service
ORCHESTRATION_PORT=8001
TIMER_PRECISION_MS=100
```

## Docker Compose Configuration

### Main docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: scip-postgres
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - scip-network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: scip-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - scip-network
    restart: unless-stopped

  # MQTT Broker
  mqtt:
    image: eclipse-mosquitto:2
    container_name: scip-mqtt
    volumes:
      - ./mqtt/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mqtt_data:/mosquitto/data
      - mqtt_logs:/mosquitto/log
    ports:
      - "1883:1883"
      - "9001:9001"
    networks:
      - scip-network
    restart: unless-stopped

  # Backend API
  api:
    build: ./api
    container_name: scip-api
    environment:
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./api:/app
      - ./media:/media
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    networks:
      - scip-network
    restart: unless-stopped

  # Orchestration Service
  orchestration:
    build: ./orchestration
    container_name: scip-orchestration
    environment:
      - MQTT_HOST=${MQTT_HOST}
      - MQTT_PORT=${MQTT_PORT}
      - MQTT_USER=${MQTT_USER}
      - MQTT_PASSWORD=${MQTT_PASSWORD}
      - REDIS_HOST=${REDIS_HOST}
      - MEDIA_PATH=${MEDIA_PATH}
    volumes:
      - ./orchestration:/app
      - ./media:/media
    ports:
      - "8001:8001"
    depends_on:
      - mqtt
      - redis
    networks:
      - scip-network
    restart: unless-stopped

  # Client Dashboard
  client-dashboard:
    build: ./client-dashboard
    container_name: scip-client-dashboard
    environment:
      - REACT_APP_API_URL=${CLIENT_API_URL}
      - REACT_APP_MQTT_URL=ws://localhost:9001
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - scip-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: scip-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites:/etc/nginx/sites-enabled
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
      - client-dashboard
    networks:
      - scip-network
    restart: unless-stopped

networks:
  scip-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  mqtt_data:
  mqtt_logs:
```

## Deployment Steps

### 1. Development Deployment

```bash
# Clone the repository
git clone https://github.com/cyberops/scip-v3.git
cd scip-v3

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Create media directories
mkdir -p media/exercises

# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Access services
# Client Dashboard: http://localhost:3000
# API: http://localhost:8000
# MQTT WebSocket: ws://localhost:9001
```

### 2. Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Set production environment
export APP_ENV=production
export APP_DEBUG=false

# Run database migrations
docker-compose exec api python manage.py migrate

# Create superuser
docker-compose exec api python manage.py createsuperuser

# Collect static files
docker-compose exec client-dashboard npm run build
```

### 3. Team Dashboard Deployment

Team dashboards are deployed dynamically when an exercise starts:

```python
# Deployment script (called by orchestration service)
def deploy_team_dashboard(team_id: str, team_config: dict, exercise_id: str):
    """Deploy a team dashboard container"""
    
    import docker
    client = docker.from_env()
    
    # Find available port
    port = find_available_port(3100, 3200)
    
    # Create container
    container = client.containers.run(
        image="scip-team-dashboard:latest",
        name=f"team-{exercise_id}-{team_id}",
        detach=True,
        ports={'3000/tcp': port},
        environment={
            'TEAM_ID': team_id,
            'TEAM_NAME': team_config['name'],
            'TEAM_COLOR': team_config['color'],
            'EXERCISE_ID': exercise_id,
            'MQTT_URL': 'ws://mqtt:9001',
            'MQTT_TOPIC': f'/exercise/{exercise_id}/team/{team_id}/feed'
        },
        networks=["scip-network"],
        mem_limit="256m",
        cpu_quota=25000,  # 0.25 CPU
        labels={
            'scip.exercise': exercise_id,
            'scip.team': team_id
        }
    )
    
    return {
        'container_id': container.id,
        'port': port,
        'url': f"http://localhost:{port}"
    }

# Cleanup after exercise
def cleanup_team_dashboards(exercise_id: str):
    """Remove team dashboard containers"""
    
    client = docker.from_env()
    
    # Find all containers for exercise
    containers = client.containers.list(
        filters={'label': f'scip.exercise={exercise_id}'}
    )
    
    # Stop and remove containers
    for container in containers:
        container.stop()
        container.remove()
```

## Nginx Configuration

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:8000;
    }
    
    upstream client {
        server client-dashboard:3000;
    }
    
    upstream orchestration {
        server orchestration:8001;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Client Dashboard
        location / {
            proxy_pass http://client;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # API
        location /api/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Orchestration Service
        location /orchestration/ {
            proxy_pass http://orchestration;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # MQTT WebSocket
        location /mqtt {
            proxy_pass http://mqtt:9001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Team Dashboards (dynamic routing)
        location ~ ^/team/([0-9]+)/ {
            proxy_pass http://localhost:$1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Media files
        location /media/ {
            alias /media/;
            expires 1d;
        }
    }
}
```

## Database Setup

### Initial Database Schema
```sql
-- scripts/init.sql
CREATE DATABASE IF NOT EXISTS scip_v3;

-- Create tables
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    scenario_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'initialized',
    config JSONB,
    teams JSONB,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE timelines (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    injects JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inject_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id),
    team_id VARCHAR(100),
    inject_id VARCHAR(100),
    delivered_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50),
    retry_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_exercises_created ON exercises(created_at DESC);
CREATE INDEX idx_delivery_exercise ON inject_delivery(exercise_id);
CREATE INDEX idx_delivery_team ON inject_delivery(team_id);
```

## Monitoring & Logging

### Docker Logs
```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f orchestration

# Last 100 lines
docker-compose logs --tail=100 api

# Export logs
docker-compose logs > logs.txt
```

### Health Checks
```bash
# Check service health
docker-compose ps

# Test MQTT connection
mosquitto_pub -h localhost -t test -m "hello"
mosquitto_sub -h localhost -t test -C 1

# Test API health
curl http://localhost:8000/health

# Test database connection
docker-compose exec postgres psql -U scip_user -d scip_v3 -c "SELECT 1"
```

## Backup & Restore

### Backup Script
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec postgres pg_dump -U scip_user scip_v3 > $BACKUP_DIR/database.sql

# Backup media files
tar -czf $BACKUP_DIR/media.tar.gz ./media/

# Backup configurations
tar -czf $BACKUP_DIR/config.tar.gz .env docker-compose.yml mqtt/ nginx/

echo "Backup completed to $BACKUP_DIR"
```

### Restore Script
```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: ./restore.sh <backup_directory>"
    exit 1
fi

# Restore database
docker-compose exec -T postgres psql -U scip_user scip_v3 < $BACKUP_DIR/database.sql

# Restore media files
tar -xzf $BACKUP_DIR/media.tar.gz

# Restore configurations (optional)
# tar -xzf $BACKUP_DIR/config.tar.gz

echo "Restore completed from $BACKUP_DIR"
```

## Troubleshooting

### Common Issues

#### MQTT Connection Failed
```bash
# Check MQTT logs
docker-compose logs mqtt

# Test MQTT broker
telnet localhost 1883

# Restart MQTT
docker-compose restart mqtt
```

#### Database Connection Error
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U scip_user -d scip_v3

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### Team Dashboard Not Accessible
```bash
# List running containers
docker ps | grep team

# Check container logs
docker logs team-<exercise-id>-<team-id>

# Inspect container
docker inspect team-<exercise-id>-<team-id>

# Restart container
docker restart team-<exercise-id>-<team-id>
```

#### Port Conflicts
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different ports in .env
CLIENT_PORT=3001
```

## Security Hardening

### Production Security Checklist
- [ ] Change all default passwords in .env
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Disable debug mode
- [ ] Set up regular backups
- [ ] Enable MQTT authentication
- [ ] Implement rate limiting
- [ ] Set up monitoring alerts
- [ ] Regular security updates

### SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Rest of configuration...
}
```

## Performance Tuning

### Docker Resource Limits
```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### PostgreSQL Tuning
```conf
# postgresql.conf
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

### Redis Optimization
```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Maintenance

### Regular Maintenance Tasks
- Clean up old Docker images: `docker system prune -a`
- Vacuum PostgreSQL: `docker-compose exec postgres vacuumdb -U scip_user -d scip_v3`
- Clear Redis cache: `docker-compose exec redis redis-cli FLUSHALL`
- Rotate logs: Use logrotate or Docker's built-in log rotation
- Update dependencies: Regular security updates

## Support

For issues or questions:
- Check logs first: `docker-compose logs`
- Review this documentation
- Contact the development team
- Submit issues to the project repository
