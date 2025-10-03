# Docker Configuration Guide

## Overview

This guide details the Docker setup for the SCIP v3 platform, including container architecture, networking, volume management, and orchestration of team dashboard containers.

## Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Host Machine                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Docker Network: scip-network           │   │
│  ├──────────────────────────────────────────────────┤   │
│  │                                                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │ PostgreSQL │  │   Redis    │  │    MQTT    │ │   │
│  │  │  Port:5432 │  │ Port:6379  │  │ Port:1883  │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  │                                                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │    API     │  │Orchestration│ │   Client   │ │   │
│  │  │ Port:8000  │  │ Port:8001  │  │ Port:3000  │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  │                                                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │Team Blue   │  │ Team Red   │  │Team Orange │ │   │
│  │  │ Port:3101  │  │ Port:3102  │  │ Port:3103  │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  │                                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  Volumes:                                                │
│  - postgres_data    - media_files                       │
│  - redis_data       - mqtt_data                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Docker Compose Files

### Main docker-compose.yml

```yaml
version: '3.8'

services:
  # Core Database Service
  postgres:
    image: postgres:15-alpine
    container_name: scip-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-scip_v3}
      POSTGRES_USER: ${DB_USER:-scip_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-scip_password}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --locale=en_US.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-scip_user} -d ${DB_NAME:-scip_v3}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - scip-network
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Cache and Session Store
  redis:
    image: redis:7-alpine
    container_name: scip-redis
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:-redis_password}
      --appendonly yes
      --appendfsync everysec
      --maxmemory ${REDIS_MAX_MEMORY:-2gb}
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - scip-network
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # MQTT Message Broker
  mqtt:
    image: eclipse-mosquitto:2.0
    container_name: scip-mqtt
    volumes:
      - ./mqtt/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - ./mqtt/passwd:/mosquitto/config/passwd:ro
      - mqtt_data:/mosquitto/data
      - mqtt_logs:/mosquitto/log
    ports:
      - "${MQTT_PORT:-1883}:1883"     # MQTT TCP
      - "${MQTT_WS_PORT:-9001}:9001"  # MQTT WebSocket
    healthcheck:
      test: ["CMD-SHELL", "timeout 5 mosquitto_sub -h localhost -t '$$SYS/#' -C 1 | grep -v Error || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - scip-network
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Backend API Service
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
      args:
        - PYTHON_VERSION=3.10
    container_name: scip-api
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-scip_user}:${DB_PASSWORD:-scip_password}@postgres:5432/${DB_NAME:-scip_v3}
      - REDIS_URL=redis://:${REDIS_PASSWORD:-redis_password}@redis:6379/0
      - MQTT_HOST=mqtt
      - MQTT_PORT=1883
      - JWT_SECRET=${JWT_SECRET:-jwt_secret_key}
      - APP_ENV=${APP_ENV:-development}
    volumes:
      - ./api:/app:delegated
      - ./media:/media
      - api_cache:/app/__pycache__
    ports:
      - "${API_PORT:-8000}:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mqtt:
        condition: service_healthy
    networks:
      - scip-network
    restart: unless-stopped
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Orchestration Service
  orchestration:
    build:
      context: ./orchestration
      dockerfile: Dockerfile
    container_name: scip-orchestration
    environment:
      - MQTT_HOST=mqtt
      - MQTT_PORT=1883
      - MQTT_USER=${MQTT_USER:-scip_user}
      - MQTT_PASSWORD=${MQTT_PASSWORD:-mqtt_password}
      - REDIS_URL=redis://:${REDIS_PASSWORD:-redis_password}@redis:6379/1
      - MEDIA_PATH=/media
    volumes:
      - ./orchestration:/app:delegated
      - ./media:/media:ro
      - orchestration_cache:/app/__pycache__
    ports:
      - "${ORCHESTRATION_PORT:-8001}:8001"
    depends_on:
      - mqtt
      - redis
    networks:
      - scip-network
    restart: unless-stopped
    command: python main.py

  # Client Dashboard (DEWC Portal)
  client-dashboard:
    build:
      context: ./client-dashboard
      dockerfile: Dockerfile
      target: ${BUILD_TARGET:-development}
    container_name: scip-client-dashboard
    environment:
      - VITE_API_URL=${CLIENT_API_URL:-http://localhost:8000}
      - VITE_MQTT_WS_URL=${CLIENT_MQTT_URL:-ws://localhost:9001}
      - VITE_APP_ENV=${APP_ENV:-development}
    volumes:
      - ./client-dashboard:/app:delegated
      - /app/node_modules
    ports:
      - "${CLIENT_PORT:-3000}:3000"
    depends_on:
      - api
    networks:
      - scip-network
    restart: unless-stopped
    command: ${CLIENT_COMMAND:-npm run dev}

  # Nginx Reverse Proxy (Production Only)
  nginx:
    image: nginx:alpine
    container_name: scip-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites:/etc/nginx/sites-enabled:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
      - client-dashboard
    networks:
      - scip-network
    profiles:
      - production
    restart: unless-stopped

networks:
  scip-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  mqtt_data:
    driver: local
  mqtt_logs:
    driver: local
  api_cache:
    driver: local
  orchestration_cache:
    driver: local
```

### Development Override (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  api:
    build:
      target: development
    environment:
      - APP_DEBUG=true
      - LOG_LEVEL=DEBUG
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug

  orchestration:
    environment:
      - DEBUG=true
      - LOG_LEVEL=DEBUG
    command: python main.py --debug

  client-dashboard:
    build:
      target: development
    environment:
      - NODE_ENV=development
    command: npm run dev

  # Development-only services
  mailhog:
    image: mailhog/mailhog
    container_name: scip-mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - scip-network
    profiles:
      - dev-tools
```

### Production Override (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  api:
    build:
      target: production
    environment:
      - APP_DEBUG=false
      - LOG_LEVEL=WARNING
    command: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

  client-dashboard:
    build:
      target: production
    command: nginx -g 'daemon off;'
    volumes:
      - ./client-dashboard/dist:/usr/share/nginx/html:ro

  nginx:
    profiles: []  # Always run in production
```

## Team Dashboard Orchestration

### Dynamic Container Deployment

Team dashboards are created dynamically when exercises start:

```python
# orchestration/docker_manager.py
import docker
import random
from typing import Dict, Optional

class TeamDashboardManager:
    def __init__(self):
        self.client = docker.from_env()
        self.network_name = "scip-network"
        self.port_range = (3100, 3200)
        
    def deploy_team_dashboard(
        self, 
        exercise_id: str, 
        team_id: str, 
        team_config: Dict
    ) -> Dict:
        """Deploy a team dashboard container"""
        
        # Find available port
        port = self._find_available_port()
        
        # Container configuration
        container_config = {
            'image': 'scip-team-dashboard:latest',
            'name': f'team-{exercise_id}-{team_id}',
            'detach': True,
            'ports': {'3000/tcp': port},
            'environment': {
                'TEAM_ID': team_id,
                'TEAM_NAME': team_config['name'],
                'TEAM_COLOR': team_config['color'],
                'EXERCISE_ID': exercise_id,
                'MQTT_WS_URL': 'ws://mqtt:9001',
                'MQTT_TOPIC': f'/exercise/{exercise_id}/team/{team_id}/feed'
            },
            'networks': [self.network_name],
            'mem_limit': team_config.get('memory_limit', '256m'),
            'cpu_quota': team_config.get('cpu_quota', 25000),  # 0.25 CPU
            'labels': {
                'scip.type': 'team-dashboard',
                'scip.exercise': exercise_id,
                'scip.team': team_id
            },
            'restart_policy': {'Name': 'on-failure', 'MaximumRetryCount': 3}
        }
        
        # Create and start container
        container = self.client.containers.run(**container_config)
        
        return {
            'container_id': container.id,
            'container_name': container.name,
            'port': port,
            'url': f'http://localhost:{port}',
            'status': container.status
        }
    
    def _find_available_port(self) -> int:
        """Find an available port in the range"""
        used_ports = self._get_used_ports()
        
        for port in range(*self.port_range):
            if port not in used_ports:
                return port
        
        raise RuntimeError("No available ports in range")
    
    def _get_used_ports(self) -> set:
        """Get list of ports in use by team dashboards"""
        containers = self.client.containers.list(
            filters={'label': 'scip.type=team-dashboard'}
        )
        
        used_ports = set()
        for container in containers:
            ports = container.attrs['NetworkSettings']['Ports']
            if '3000/tcp' in ports and ports['3000/tcp']:
                used_ports.add(int(ports['3000/tcp'][0]['HostPort']))
        
        return used_ports
    
    def cleanup_exercise_containers(self, exercise_id: str):
        """Remove all containers for an exercise"""
        containers = self.client.containers.list(
            all=True,
            filters={'label': f'scip.exercise={exercise_id}'}
        )
        
        for container in containers:
            container.stop()
            container.remove()
            
        return len(containers)
```

### Team Dashboard Dockerfile

```dockerfile
# team-dashboard/Dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments for customization
ARG TEAM_ID
ARG TEAM_COLOR
ENV VITE_TEAM_ID=${TEAM_ID}
ENV VITE_TEAM_COLOR=${TEAM_COLOR}

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

## Volume Management

### Volume Types and Usage

```yaml
# Named volumes for persistent data
volumes:
  postgres_data:     # Database data
  redis_data:        # Cache and sessions
  mqtt_data:         # MQTT persistence
  mqtt_logs:         # MQTT logs
  media_files:       # Exercise media

# Bind mounts for development
volumes:
  - ./api:/app                    # Source code
  - ./media:/media                # Media files
  - ./logs:/var/log/scip          # Application logs
```

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup-volumes.sh

BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker run --rm \
  --volumes-from scip-postgres \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/postgres_data.tar.gz /var/lib/postgresql/data

# Backup Redis
docker run --rm \
  --volumes-from scip-redis \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/redis_data.tar.gz /data

# Backup media files
tar czf $BACKUP_DIR/media_files.tar.gz ./media/

echo "Backup completed to $BACKUP_DIR"
```

## Network Configuration

### Network Isolation

```yaml
networks:
  scip-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
    
  # Isolated network for team dashboards
  team-network:
    driver: bridge
    internal: true  # No external access
    ipam:
      config:
        - subnet: 172.21.0.0/16
```

### Service Discovery

Services can communicate using container names:

```python
# Internal service communication
POSTGRES_HOST = "postgres"  # Not localhost
REDIS_HOST = "redis"
MQTT_HOST = "mqtt"
API_HOST = "api"
```

## Health Checks

### Service Health Monitoring

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s       # Check every 30 seconds
  timeout: 10s        # Timeout after 10 seconds
  retries: 3          # Retry 3 times before marking unhealthy
  start_period: 60s   # Grace period on startup
```

### Monitoring Script

```bash
#!/bin/bash
# scripts/check-health.sh

echo "Checking service health..."

# Check PostgreSQL
docker-compose exec postgres pg_isready || echo "PostgreSQL unhealthy"

# Check Redis
docker-compose exec redis redis-cli ping || echo "Redis unhealthy"

# Check MQTT
docker-compose exec mqtt mosquitto_pub -h localhost -t test -n || echo "MQTT unhealthy"

# Check API
curl -f http://localhost:8000/health || echo "API unhealthy"

# Check running team dashboards
docker ps --filter "label=scip.type=team-dashboard" --format "table {{.Names}}\t{{.Status}}"
```

## Resource Management

### Container Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'       # Maximum 2 CPU cores
      memory: 2G        # Maximum 2GB RAM
    reservations:
      cpus: '1.0'       # Reserve 1 CPU core
      memory: 1G        # Reserve 1GB RAM
```

### Monitoring Resource Usage

```bash
# Monitor container resources
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes
```

## Docker Commands Reference

### Common Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart service
docker-compose restart [service_name]

# Execute command in container
docker-compose exec [service_name] [command]

# Build images
docker-compose build

# Pull latest images
docker-compose pull

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Debugging Commands

```bash
# Inspect container
docker inspect [container_name]

# View container processes
docker top [container_name]

# Copy files from container
docker cp [container_name]:/path/to/file ./local/path

# View network details
docker network inspect scip-network

# Clean up stopped containers
docker container prune

# Remove unused images
docker image prune
```

## Production Deployment

### Building for Production

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Push to registry
docker tag scip-api:latest your-registry/scip-api:latest
docker push your-registry/scip-api:latest
```

### Docker Swarm Deployment

```yaml
# docker-stack.yml for Swarm
version: '3.8'

services:
  api:
    image: your-registry/scip-api:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs [service_name]

# Check exit code
docker ps -a --filter "name=scip"

# Inspect container
docker inspect [container_name]
```

### Network Issues
```bash
# Test connectivity between containers
docker-compose exec api ping postgres

# Check DNS resolution
docker-compose exec api nslookup postgres

# Inspect network
docker network inspect scip-network
```

### Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./media
sudo chmod -R 755 ./media

# Add user to docker group
sudo usermod -aG docker $USER
```

### Cleanup and Reset
```bash
# Complete reset (WARNING: deletes all data)
docker-compose down -v
docker system prune -a --volumes
rm -rf ./media/*
```
