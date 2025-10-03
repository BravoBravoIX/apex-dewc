# SCIP v2 Security Implementation Roadmap

## Executive Summary
This roadmap provides detailed implementation steps for establishing comprehensive security and monitoring systems for the SCIP v2 platform. Each phase includes specific technical tasks, dependencies, and validation criteria.

---

## Phase 1: Authentication & Authorization Foundation (Days 1-5)

### 1.1 JWT Authentication Implementation

#### Required Files to Create:
```
/backend/app/auth/
├── __init__.py
├── jwt_handler.py          # JWT token generation and validation
├── authentication.py       # Authentication logic
├── password_manager.py     # Password hashing and validation
└── session_manager.py      # Session management with Redis

/backend/app/models/
├── user.py                # Enhanced user model with security fields
├── role.py                # Role and permission models
└── session.py             # Session tracking model
```

#### Key Implementation Tasks:

**Task 1.1.1: JWT Handler Setup**
```python
# /backend/app/auth/jwt_handler.py

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets

class JWTHandler:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 7

    def generate_tokens(self, user_id: str, organization_id: str,
                       roles: list, permissions: list) -> Dict[str, str]:
        """Generate access and refresh tokens"""

        # Access token payload
        access_payload = {
            "sub": user_id,
            "org": organization_id,
            "roles": roles,
            "permissions": permissions,
            "type": "access",
            "jti": secrets.token_hex(16),
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        }

        # Refresh token payload
        refresh_payload = {
            "sub": user_id,
            "type": "refresh",
            "jti": secrets.token_hex(16),
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        }

        return {
            "access_token": jwt.encode(access_payload, self.secret_key, self.algorithm),
            "refresh_token": jwt.encode(refresh_payload, self.secret_key, self.algorithm)
        }

    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            # Check if token is blacklisted
            if self.is_blacklisted(payload.get("jti")):
                return None

            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
```

**Task 1.1.2: Enhanced Password Security**
```python
# /backend/app/auth/password_manager.py

import bcrypt
import re
from typing import List, Tuple
import secrets
import string

class PasswordManager:
    def __init__(self):
        self.min_length = 12
        self.require_uppercase = True
        self.require_lowercase = True
        self.require_numbers = True
        self.require_special = True
        self.password_history_count = 5

    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def validate_password_strength(self, password: str) -> Tuple[bool, List[str]]:
        """Validate password meets security requirements"""
        errors = []

        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters")

        if self.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append("Password must contain uppercase letters")

        if self.require_lowercase and not re.search(r'[a-z]', password):
            errors.append("Password must contain lowercase letters")

        if self.require_numbers and not re.search(r'\d', password):
            errors.append("Password must contain numbers")

        if self.require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain special characters")

        # Check for common patterns
        if self.has_common_patterns(password):
            errors.append("Password contains common patterns")

        return len(errors) == 0, errors

    def generate_secure_password(self, length: int = 16) -> str:
        """Generate a cryptographically secure password"""
        alphabet = string.ascii_letters + string.digits + string.punctuation
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password
```

### 1.2 Role-Based Access Control (RBAC)

**Task 1.2.1: Database Schema for RBAC**
```sql
-- /backend/alembic/versions/002_rbac_schema.sql

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    PRIMARY KEY (user_id, role_id, organization_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_org ON user_roles(organization_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
```

**Task 1.2.2: RBAC Middleware**
```python
# /backend/app/middleware/rbac.py

from fastapi import HTTPException, Depends
from typing import List, Optional

class RBACMiddleware:
    def __init__(self):
        self.permission_cache = {}

    def require_permission(self, resource: str, action: str):
        """Decorator to enforce permission requirements"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                # Get current user from request context
                user = kwargs.get('current_user')
                if not user:
                    raise HTTPException(status_code=401, detail="Not authenticated")

                # Check permission
                if not await self.has_permission(user, resource, action):
                    raise HTTPException(
                        status_code=403,
                        detail=f"Permission denied: {resource}:{action}"
                    )

                return await func(*args, **kwargs)
            return wrapper
        return decorator

    async def has_permission(self, user, resource: str, action: str) -> bool:
        """Check if user has specific permission"""
        # Super admin bypass
        if user.is_super_admin:
            return True

        # Check cached permissions
        cache_key = f"{user.id}:{resource}:{action}"
        if cache_key in self.permission_cache:
            return self.permission_cache[cache_key]

        # Load user permissions from database
        permissions = await self.load_user_permissions(user.id)

        # Check permission
        has_perm = f"{resource}:{action}" in permissions or \
                  f"{resource}:*" in permissions or \
                  "*:*" in permissions

        # Cache result
        self.permission_cache[cache_key] = has_perm

        return has_perm
```

---

## Phase 2: Container Security Implementation (Days 6-10)

### 2.1 Docker Security Configuration

**Task 2.1.1: Secure Dockerfile for Team Dashboard**
```dockerfile
# /team-dashboard/Dockerfile

FROM node:18-alpine AS builder

# Create non-root user for build
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY --chown=nodejs:nodejs . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine-slim

# Install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        ca-certificates \
        tzdata && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Copy built application
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Security configurations
COPY nginx-security.conf /etc/nginx/conf.d/security.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Remove default nginx files
RUN rm /etc/nginx/conf.d/default.conf && \
    rm -rf /usr/share/nginx/html/*.html

# Set up read-only filesystem
RUN mkdir -p /var/cache/nginx && \
    mkdir -p /var/run && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/run && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /var/run

# Switch to non-root user
USER nginx

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Task 2.1.2: Docker Compose with Security Options**
```yaml
# /docker-compose.secure.yml

version: '3.8'

x-security-opts: &security
  security_opt:
    - no-new-privileges:true
    - apparmor:docker-default
    - seccomp:seccomp-profile.json
  cap_drop:
    - ALL
  cap_add:
    - NET_BIND_SERVICE
  read_only: true
  user: "1001:1001"

services:
  team-dashboard-blue:
    image: scip/team-dashboard:v2
    container_name: team-dashboard-blue
    <<: *security
    environment:
      - TEAM_ID=blue
      - MQTT_BROKER=mqtt://mqtt:1883
      - API_URL=http://orchestration:8001
    networks:
      - team_blue_net
    ports:
      - "3201:3000"
    tmpfs:
      - /tmp:noexec,nosuid,size=50M
      - /var/run:noexec,nosuid,size=10M
      - /var/cache/nginx:noexec,nosuid,size=50M
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M

networks:
  team_blue_net:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"
    internal: true
```

### 2.2 Container Runtime Security

**Task 2.2.1: Container Monitoring Service**
```python
# /backend/app/security/container_monitor.py

import docker
import asyncio
from typing import Dict, List, Any
import psutil
import json

class ContainerSecurityMonitor:
    def __init__(self):
        self.docker_client = docker.from_env()
        self.monitoring_interval = 10  # seconds
        self.alert_thresholds = {
            "cpu_percent": 80,
            "memory_percent": 85,
            "network_connections": 100,
            "process_count": 50
        }

    async def monitor_container(self, container_id: str) -> Dict[str, Any]:
        """Monitor container security metrics"""
        try:
            container = self.docker_client.containers.get(container_id)
            stats = container.stats(stream=False)

            metrics = {
                "container_id": container_id,
                "status": container.status,
                "cpu_usage": self.calculate_cpu_percent(stats),
                "memory_usage": self.calculate_memory_percent(stats),
                "network_stats": self.get_network_stats(stats),
                "process_count": self.get_process_count(container),
                "security_violations": []
            }

            # Check for violations
            violations = self.check_security_violations(metrics)
            metrics["security_violations"] = violations

            # Log metrics
            await self.log_metrics(metrics)

            # Alert if needed
            if violations:
                await self.send_security_alert(container_id, violations)

            return metrics

        except docker.errors.NotFound:
            return {"error": "Container not found"}
        except Exception as e:
            return {"error": str(e)}

    def check_security_violations(self, metrics: Dict) -> List[str]:
        """Check for security threshold violations"""
        violations = []

        if metrics["cpu_usage"] > self.alert_thresholds["cpu_percent"]:
            violations.append(f"High CPU usage: {metrics['cpu_usage']}%")

        if metrics["memory_usage"] > self.alert_thresholds["memory_percent"]:
            violations.append(f"High memory usage: {metrics['memory_usage']}%")

        if metrics["process_count"] > self.alert_thresholds["process_count"]:
            violations.append(f"Excessive processes: {metrics['process_count']}")

        # Check for suspicious network connections
        suspicious_connections = self.detect_suspicious_connections(
            metrics.get("network_stats", {})
        )
        if suspicious_connections:
            violations.append(f"Suspicious network activity: {suspicious_connections}")

        return violations

    async def quarantine_container(self, container_id: str, reason: str):
        """Isolate a potentially compromised container"""
        try:
            container = self.docker_client.containers.get(container_id)

            # Disconnect from all networks
            for network in container.attrs['NetworkSettings']['Networks']:
                network_obj = self.docker_client.networks.get(network)
                network_obj.disconnect(container)

            # Connect to quarantine network
            quarantine_net = self.docker_client.networks.get('quarantine_net')
            quarantine_net.connect(container)

            # Log quarantine action
            await self.log_security_event({
                "action": "container_quarantine",
                "container_id": container_id,
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            })

            return True

        except Exception as e:
            logger.error(f"Failed to quarantine container {container_id}: {e}")
            return False
```

---

## Phase 3: File Upload Security (Days 11-13)

### 3.1 File Validation Pipeline

**Task 3.1.1: Comprehensive File Validator**
```python
# /backend/app/security/file_validator.py

import magic
import hashlib
import os
from PIL import Image
import PyPDF2
import clamd
from typing import Optional, Tuple, Dict, Any

class FileSecurityValidator:
    def __init__(self):
        self.allowed_extensions = {
            'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            'video': ['.mp4', '.webm', '.ogg'],
            'document': ['.pdf']
        }

        self.mime_types = {
            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'video': ['video/mp4', 'video/webm', 'video/ogg'],
            'document': ['application/pdf']
        }

        self.max_sizes = {
            'image': 10 * 1024 * 1024,  # 10MB
            'video': 100 * 1024 * 1024,  # 100MB
            'document': 20 * 1024 * 1024  # 20MB
        }

        # Initialize ClamAV connection
        try:
            self.clamav = clamd.ClamdUnixSocket()
        except:
            self.clamav = None
            logger.warning("ClamAV not available - virus scanning disabled")

    async def validate_file(self, file_data: bytes, filename: str,
                           file_type: str) -> Tuple[bool, Optional[str], Optional[bytes]]:
        """Complete file validation pipeline"""

        # Stage 1: Extension validation
        if not self.validate_extension(filename, file_type):
            return False, "Invalid file extension", None

        # Stage 2: File size validation
        if len(file_data) > self.max_sizes.get(file_type, 0):
            return False, f"File exceeds maximum size of {self.max_sizes[file_type]} bytes", None

        # Stage 3: MIME type validation
        detected_mime = magic.from_buffer(file_data, mime=True)
        if detected_mime not in self.mime_types.get(file_type, []):
            return False, f"Invalid MIME type: {detected_mime}", None

        # Stage 4: Magic number validation
        if not self.validate_magic_number(file_data, file_type):
            return False, "File header doesn't match expected type", None

        # Stage 5: Virus scanning
        if self.clamav:
            scan_result = await self.scan_for_virus(file_data)
            if scan_result:
                return False, f"Virus detected: {scan_result}", None

        # Stage 6: Content validation based on type
        if file_type == 'image':
            valid, msg, cleaned = await self.validate_image(file_data)
            if not valid:
                return False, msg, None
            file_data = cleaned or file_data

        elif file_type == 'document':
            valid, msg = await self.validate_pdf(file_data)
            if not valid:
                return False, msg, None

        # Stage 7: Generate file hash for deduplication
        file_hash = hashlib.sha256(file_data).hexdigest()

        return True, file_hash, file_data

    async def validate_image(self, image_data: bytes) -> Tuple[bool, Optional[str], Optional[bytes]]:
        """Validate and sanitize image files"""
        try:
            # Open image
            from io import BytesIO
            img = Image.open(BytesIO(image_data))

            # Check dimensions
            if img.width > 4096 or img.height > 4096:
                return False, "Image dimensions exceed maximum (4096x4096)", None

            # Check for embedded data
            if self.has_exif_data(img):
                # Strip EXIF data
                img_clean = Image.new(img.mode, img.size)
                img_clean.putdata(list(img.getdata()))

                # Convert back to bytes
                output = BytesIO()
                img_clean.save(output, format=img.format)
                cleaned_data = output.getvalue()

                return True, None, cleaned_data

            return True, None, None

        except Exception as e:
            return False, f"Invalid image file: {str(e)}", None

    async def scan_for_virus(self, file_data: bytes) -> Optional[str]:
        """Scan file for viruses using ClamAV"""
        try:
            result = self.clamav.instream(BytesIO(file_data))
            if result['stream'][0] == 'FOUND':
                return result['stream'][1]
            return None
        except Exception as e:
            logger.error(f"Virus scan failed: {e}")
            return None
```

### 3.2 Secure Storage Implementation

**Task 3.2.1: Encrypted File Storage**
```python
# /backend/app/security/secure_storage.py

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import os
import uuid
from pathlib import Path

class SecureFileStorage:
    def __init__(self, base_path: str, encryption_key: bytes):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

        # Derive encryption key
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'stable_salt',  # Should use proper salt management
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(encryption_key))
        self.cipher = Fernet(key)

    async def store_file(self, file_data: bytes, metadata: Dict[str, Any]) -> str:
        """Store file with encryption"""

        # Generate unique file ID
        file_id = str(uuid.uuid4())

        # Encrypt file data
        encrypted_data = self.cipher.encrypt(file_data)

        # Create storage path
        storage_path = self.get_storage_path(file_id)
        storage_path.parent.mkdir(parents=True, exist_ok=True)

        # Write encrypted file
        with open(storage_path, 'wb') as f:
            f.write(encrypted_data)

        # Set file permissions (read-only)
        os.chmod(storage_path, 0o400)

        # Store metadata
        await self.store_metadata(file_id, metadata)

        return file_id

    async def retrieve_file(self, file_id: str) -> Optional[bytes]:
        """Retrieve and decrypt file"""

        storage_path = self.get_storage_path(file_id)

        if not storage_path.exists():
            return None

        # Read encrypted file
        with open(storage_path, 'rb') as f:
            encrypted_data = f.read()

        # Decrypt
        try:
            decrypted_data = self.cipher.decrypt(encrypted_data)
            return decrypted_data
        except Exception as e:
            logger.error(f"Failed to decrypt file {file_id}: {e}")
            return None

    def get_storage_path(self, file_id: str) -> Path:
        """Generate storage path with directory sharding"""
        # Use first 2 characters for directory sharding
        shard = file_id[:2]
        return self.base_path / shard / file_id
```

---

## Phase 4: MQTT Security (Days 14-16)

### 4.1 MQTT Authentication Setup

**Task 4.1.1: MQTT Auth Plugin Configuration**
```python
# /mqtt-auth/auth_plugin.py

import hmac
import hashlib
from typing import Optional, Dict, List
import psycopg2
import json

class MQTTAuthPlugin:
    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.acl_cache = {}
        self.cache_ttl = 300  # 5 minutes

    def authenticate(self, username: str, password: str) -> bool:
        """Authenticate MQTT client"""

        # Connect to database
        conn = psycopg2.connect(**self.db_config)
        cur = conn.cursor()

        try:
            # Check user credentials
            cur.execute("""
                SELECT password_hash, organization_id, roles
                FROM mqtt_users
                WHERE username = %s AND active = true
            """, (username,))

            result = cur.fetchone()
            if not result:
                return False

            password_hash, org_id, roles = result

            # Verify password
            if not self.verify_password(password, password_hash):
                return False

            # Cache user info for ACL checks
            self.cache_user_info(username, org_id, roles)

            # Log successful authentication
            cur.execute("""
                INSERT INTO mqtt_auth_log (username, action, success, timestamp)
                VALUES (%s, 'auth', true, NOW())
            """, (username,))
            conn.commit()

            return True

        except Exception as e:
            logger.error(f"MQTT auth error: {e}")
            return False

        finally:
            cur.close()
            conn.close()

    def check_acl(self, username: str, topic: str, access: str) -> bool:
        """Check topic access permissions"""

        # Get cached user info
        user_info = self.acl_cache.get(username)
        if not user_info:
            return False

        org_id = user_info['organization_id']
        roles = user_info['roles']

        # Parse topic structure
        # Format: scip/{org_id}/exercise/{exercise_id}/teams/{team_id}/...
        topic_parts = topic.split('/')

        # Check organization match
        if len(topic_parts) < 2 or topic_parts[1] != org_id:
            return False

        # Apply role-based ACL rules
        for role in roles:
            if self.check_role_permission(role, topic, access):
                return True

        return False

    def check_role_permission(self, role: str, topic: str, access: str) -> bool:
        """Check if role has permission for topic access"""

        # Admin has full access
        if role == 'admin':
            return True

        # Instructor can publish to control topics
        if role == 'instructor':
            if 'control' in topic and access == 'write':
                return True
            if 'status' in topic and access == 'read':
                return True

        # Team member can only access their team's topics
        if role == 'team_member':
            if f"teams/{self.get_user_team(username)}" in topic:
                if 'injections' in topic and access == 'read':
                    return True
                if 'responses' in topic and access == 'write':
                    return True

        return False
```

**Task 4.1.2: Mosquitto Configuration with Auth**
```conf
# /mqtt/mosquitto.conf

# General Configuration
per_listener_settings true
max_connections 1000
max_queued_messages 1000
message_size_limit 1048576
autosave_interval 300

# Logging
log_type error
log_type warning
log_type notice
log_type information
log_dest file /mosquitto/log/mosquitto.log
log_timestamp true
log_timestamp_format %Y-%m-%dT%H:%M:%S

# Primary Listener (TLS)
listener 8883
protocol mqtt

# TLS Configuration
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
cafile /mosquitto/certs/ca.crt
require_certificate true
use_identity_as_username true
tls_version tlsv1.3

# Authentication Plugin
auth_plugin /mosquitto/plugins/auth-plugin.so
auth_opt_backends postgres
auth_opt_host postgres
auth_opt_port 5432
auth_opt_dbname scip_mqtt
auth_opt_user mqtt_auth
auth_opt_pass ${MQTT_AUTH_DB_PASSWORD}
auth_opt_userquery SELECT password FROM mqtt_users WHERE username = $1
auth_opt_aclquery SELECT topic, access FROM mqtt_acls WHERE username = $1

# WebSocket Listener (TLS)
listener 9883
protocol websockets
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
cafile /mosquitto/certs/ca.crt

# Security Settings
allow_anonymous false
```

---

## Phase 5: Admin Monitoring Dashboard (Days 17-20)

### 5.1 Dashboard Backend Services

**Task 5.1.1: Metrics Collection Service**
```python
# /backend/app/monitoring/metrics_collector.py

import asyncio
from typing import Dict, Any, List
import prometheus_client
from datetime import datetime, timedelta
import psutil
import docker

class MetricsCollector:
    def __init__(self):
        self.docker_client = docker.from_env()

        # Define Prometheus metrics
        self.api_requests = prometheus_client.Counter(
            'api_requests_total',
            'Total API requests',
            ['method', 'endpoint', 'status']
        )

        self.api_latency = prometheus_client.Histogram(
            'api_request_duration_seconds',
            'API request latency',
            ['method', 'endpoint']
        )

        self.active_users = prometheus_client.Gauge(
            'active_users_total',
            'Number of active users'
        )

        self.container_cpu = prometheus_client.Gauge(
            'container_cpu_usage_percent',
            'Container CPU usage',
            ['container_name']
        )

        self.container_memory = prometheus_client.Gauge(
            'container_memory_usage_bytes',
            'Container memory usage',
            ['container_name']
        )

    async def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system-wide metrics"""

        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "total": psutil.virtual_memory().total,
                    "available": psutil.virtual_memory().available,
                    "percent": psutil.virtual_memory().percent
                },
                "disk": {
                    "total": psutil.disk_usage('/').total,
                    "used": psutil.disk_usage('/').used,
                    "percent": psutil.disk_usage('/').percent
                },
                "network": {
                    "bytes_sent": psutil.net_io_counters().bytes_sent,
                    "bytes_recv": psutil.net_io_counters().bytes_recv,
                    "packets_sent": psutil.net_io_counters().packets_sent,
                    "packets_recv": psutil.net_io_counters().packets_recv
                }
            }
        }

        return metrics

    async def collect_container_metrics(self) -> List[Dict[str, Any]]:
        """Collect metrics for all running containers"""

        containers = []

        for container in self.docker_client.containers.list():
            try:
                stats = container.stats(stream=False)

                # Calculate CPU percentage
                cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                           stats['precpu_stats']['cpu_usage']['total_usage']
                system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                              stats['precpu_stats']['system_cpu_usage']
                cpu_percent = (cpu_delta / system_delta) * 100.0

                # Calculate memory usage
                memory_usage = stats['memory_stats']['usage']
                memory_limit = stats['memory_stats']['limit']
                memory_percent = (memory_usage / memory_limit) * 100.0

                container_metrics = {
                    "name": container.name,
                    "id": container.short_id,
                    "status": container.status,
                    "cpu_percent": round(cpu_percent, 2),
                    "memory_usage_mb": round(memory_usage / 1024 / 1024, 2),
                    "memory_percent": round(memory_percent, 2),
                    "network_rx_bytes": stats['networks']['eth0']['rx_bytes'],
                    "network_tx_bytes": stats['networks']['eth0']['tx_bytes']
                }

                containers.append(container_metrics)

                # Update Prometheus metrics
                self.container_cpu.labels(container_name=container.name).set(cpu_percent)
                self.container_memory.labels(container_name=container.name).set(memory_usage)

            except Exception as e:
                logger.error(f"Error collecting metrics for container {container.name}: {e}")

        return containers

    async def collect_security_metrics(self) -> Dict[str, Any]:
        """Collect security-related metrics"""

        # Query database for security events
        query_failed_logins = """
            SELECT COUNT(*) as count
            FROM auth_log
            WHERE success = false
            AND timestamp > NOW() - INTERVAL '5 minutes'
        """

        query_active_sessions = """
            SELECT COUNT(DISTINCT user_id) as count
            FROM sessions
            WHERE expires_at > NOW()
        """

        query_blacklisted_tokens = """
            SELECT COUNT(*) as count
            FROM token_blacklist
            WHERE expires_at > NOW()
        """

        # Execute queries and collect results
        metrics = {
            "failed_login_attempts_5min": await self.execute_query(query_failed_logins),
            "active_sessions": await self.execute_query(query_active_sessions),
            "blacklisted_tokens": await self.execute_query(query_blacklisted_tokens),
            "security_alerts": await self.get_recent_security_alerts()
        }

        return metrics
```

### 5.2 Dashboard Frontend

**Task 5.2.1: Admin Dashboard React Component**
```typescript
// /frontend/src/components/admin/SecurityDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { AlertTriangle, Shield, Users, Server } from 'lucide-react';

interface SecurityMetrics {
  failedLogins: number;
  activeSessions: number;
  suspiciousActivities: Alert[];
  systemHealth: SystemHealth;
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [containerMetrics, setContainerMetrics] = useState<ContainerMetric[]>([]);

  useEffect(() => {
    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket('wss://api.scip.io/ws/admin/metrics');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'security_metrics':
          setMetrics(data.payload);
          break;
        case 'security_alert':
          setAlerts(prev => [data.payload, ...prev].slice(0, 50));
          break;
        case 'container_metrics':
          setContainerMetrics(data.payload);
          break;
      }
    };

    // Initial data fetch
    fetchSecurityMetrics();

    // Set up polling for non-real-time data
    const interval = setInterval(fetchSecurityMetrics, 30000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  const fetchSecurityMetrics = async () => {
    try {
      const response = await fetch('/api/v1/admin/metrics/security', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
    }
  };

  return (
    <div className="security-dashboard">
      <div className="dashboard-header">
        <h1>Security Monitoring Dashboard</h1>
        <div className="system-status">
          <StatusIndicator status={metrics?.systemHealth.overall || 'unknown'} />
        </div>
      </div>

      <div className="metrics-grid">
        {/* Security Overview */}
        <div className="metric-card security-overview">
          <div className="card-header">
            <Shield className="icon" />
            <h3>Security Status</h3>
          </div>
          <div className="card-content">
            <div className="stat-row">
              <span>Failed Logins (5min)</span>
              <span className={`value ${metrics?.failedLogins > 10 ? 'danger' : ''}`}>
                {metrics?.failedLogins || 0}
              </span>
            </div>
            <div className="stat-row">
              <span>Active Sessions</span>
              <span className="value">{metrics?.activeSessions || 0}</span>
            </div>
            <div className="stat-row">
              <span>Threat Level</span>
              <ThreatLevel level={calculateThreatLevel(metrics)} />
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="metric-card alerts">
          <div className="card-header">
            <AlertTriangle className="icon" />
            <h3>Active Alerts</h3>
          </div>
          <div className="card-content alert-list">
            {alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* Container Security */}
        <div className="metric-card container-security">
          <div className="card-header">
            <Server className="icon" />
            <h3>Container Security</h3>
          </div>
          <div className="card-content">
            <ContainerGrid containers={containerMetrics} />
          </div>
        </div>

        {/* Real-time Activity */}
        <div className="metric-card activity-chart">
          <div className="card-header">
            <h3>API Activity (Real-time)</h3>
          </div>
          <div className="card-content">
            <Line
              data={getActivityChartData()}
              options={chartOptions}
            />
          </div>
        </div>
      </div>

      {/* Security Event Log */}
      <div className="event-log">
        <h2>Security Event Log</h2>
        <EventLogTable events={getSecurityEvents()} />
      </div>
    </div>
  );
};
```

---

## Phase 6: Analytics & Performance Monitoring (Days 21-25)

### 6.1 Analytics Pipeline

**Task 6.1.1: Analytics Data Pipeline**
```python
# /backend/app/analytics/pipeline.py

import asyncio
from typing import Dict, Any, List
from datetime import datetime, timedelta
import pandas as pd
from kafka import KafkaProducer, KafkaConsumer
import json

class AnalyticsPipeline:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

        self.topics = {
            'user_events': 'analytics.user.events',
            'exercise_events': 'analytics.exercise.events',
            'system_events': 'analytics.system.events',
            'security_events': 'analytics.security.events'
        }

    async def track_event(self, event_type: str, event_data: Dict[str, Any]):
        """Track analytics event"""

        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': event_type,
            'data': event_data,
            'session_id': self.get_session_id(),
            'user_id': self.get_user_id(),
            'organization_id': self.get_org_id()
        }

        # Determine topic
        if event_type.startswith('user.'):
            topic = self.topics['user_events']
        elif event_type.startswith('exercise.'):
            topic = self.topics['exercise_events']
        elif event_type.startswith('security.'):
            topic = self.topics['security_events']
        else:
            topic = self.topics['system_events']

        # Send to Kafka
        self.producer.send(topic, value=event)

        # Also store in time-series database for real-time queries
        await self.store_timeseries(event)

    async def aggregate_metrics(self, metric_type: str,
                               time_range: timedelta) -> Dict[str, Any]:
        """Aggregate metrics over time range"""

        end_time = datetime.utcnow()
        start_time = end_time - time_range

        # Query time-series database
        query = f"""
            SELECT
                time_bucket('1 minute', timestamp) AS time,
                COUNT(*) as count,
                AVG(value) as avg_value,
                MAX(value) as max_value,
                MIN(value) as min_value
            FROM metrics
            WHERE metric_type = '{metric_type}'
            AND timestamp BETWEEN '{start_time}' AND '{end_time}'
            GROUP BY time
            ORDER BY time DESC
        """

        results = await self.execute_timeseries_query(query)

        return {
            'metric_type': metric_type,
            'time_range': str(time_range),
            'data_points': results,
            'summary': {
                'total_count': sum(r['count'] for r in results),
                'average': sum(r['avg_value'] for r in results) / len(results),
                'peak': max(r['max_value'] for r in results)
            }
        }

    async def generate_report(self, report_type: str,
                            parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate analytics report"""

        if report_type == 'exercise_performance':
            return await self.generate_exercise_report(parameters)
        elif report_type == 'security_audit':
            return await self.generate_security_report(parameters)
        elif report_type == 'user_activity':
            return await self.generate_user_report(parameters)
        else:
            raise ValueError(f"Unknown report type: {report_type}")
```

### 6.2 Performance Monitoring

**Task 6.2.1: Application Performance Monitor**
```python
# /backend/app/monitoring/apm.py

import time
from functools import wraps
from typing import Dict, Any, Callable
import opentelemetry
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

class ApplicationPerformanceMonitor:
    def __init__(self):
        # Set up OpenTelemetry
        trace.set_tracer_provider(TracerProvider())
        tracer_provider = trace.get_tracer_provider()

        # Configure Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=6831,
        )

        span_processor = BatchSpanProcessor(jaeger_exporter)
        tracer_provider.add_span_processor(span_processor)

        self.tracer = trace.get_tracer(__name__)

        # Performance metrics storage
        self.metrics = {
            'response_times': [],
            'error_counts': {},
            'throughput': {}
        }

    def trace_endpoint(self, endpoint_name: str):
        """Decorator to trace API endpoint performance"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                with self.tracer.start_as_current_span(endpoint_name) as span:
                    start_time = time.time()

                    try:
                        # Execute endpoint
                        result = await func(*args, **kwargs)

                        # Record success metrics
                        duration = time.time() - start_time
                        self.record_success(endpoint_name, duration)

                        span.set_attribute("http.status_code", 200)
                        span.set_attribute("response.time", duration)

                        return result

                    except Exception as e:
                        # Record error metrics
                        duration = time.time() - start_time
                        self.record_error(endpoint_name, str(e), duration)

                        span.set_attribute("http.status_code", 500)
                        span.set_attribute("error", True)
                        span.set_attribute("error.message", str(e))

                        raise

            return wrapper
        return decorator

    def record_success(self, endpoint: str, duration: float):
        """Record successful request metrics"""

        # Update response time percentiles
        self.metrics['response_times'].append({
            'endpoint': endpoint,
            'duration': duration,
            'timestamp': time.time()
        })

        # Update throughput
        current_minute = int(time.time() / 60)
        if endpoint not in self.metrics['throughput']:
            self.metrics['throughput'][endpoint] = {}

        if current_minute not in self.metrics['throughput'][endpoint]:
            self.metrics['throughput'][endpoint][current_minute] = 0

        self.metrics['throughput'][endpoint][current_minute] += 1

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get current performance summary"""

        # Calculate percentiles
        response_times = [m['duration'] for m in self.metrics['response_times'][-1000:]]
        response_times.sort()

        if response_times:
            p50 = response_times[int(len(response_times) * 0.5)]
            p95 = response_times[int(len(response_times) * 0.95)]
            p99 = response_times[int(len(response_times) * 0.99)]
        else:
            p50 = p95 = p99 = 0

        return {
            'response_time_percentiles': {
                'p50': p50,
                'p95': p95,
                'p99': p99
            },
            'error_rate': self.calculate_error_rate(),
            'requests_per_minute': self.calculate_rpm(),
            'active_traces': self.get_active_traces()
        }
```

---

## Validation Criteria

### Security Validation Checklist

#### Authentication & Authorization
- [ ] JWT tokens generated with proper claims
- [ ] Token validation on all protected endpoints
- [ ] Token blacklisting functional
- [ ] MFA implementation working
- [ ] Password complexity enforced
- [ ] Account lockout after failed attempts
- [ ] Session timeout implemented
- [ ] RBAC permissions enforced

#### Container Security
- [ ] Containers running as non-root
- [ ] Resource limits enforced
- [ ] Network isolation verified
- [ ] Read-only filesystems
- [ ] Security profiles applied
- [ ] Health checks functional
- [ ] Container monitoring active

#### File Upload Security
- [ ] File type validation working
- [ ] Size limits enforced
- [ ] Virus scanning operational
- [ ] Metadata stripping functional
- [ ] Encrypted storage verified
- [ ] Signed URLs generated

#### MQTT Security
- [ ] Authentication required
- [ ] TLS encryption enabled
- [ ] Topic ACLs enforced
- [ ] Message encryption working
- [ ] Audit logging active

#### Monitoring & Analytics
- [ ] Metrics collection operational
- [ ] Real-time dashboards updating
- [ ] Alerts triggering correctly
- [ ] Performance tracking accurate
- [ ] Security events logged
- [ ] Reports generating properly

---

## Deployment Instructions

### Prerequisites
1. Docker 20.10+
2. Docker Compose 2.0+
3. PostgreSQL 14+
4. Redis 7+
5. Python 3.11+
6. Node.js 18+

### Deployment Steps

1. **Environment Configuration**
```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with production values
```

2. **Build Containers**
```bash
# Build all service containers
docker-compose -f docker-compose.secure.yml build
```

3. **Initialize Database**
```bash
# Run database migrations
docker-compose run --rm backend alembic upgrade head

# Initialize RBAC roles and permissions
docker-compose run --rm backend python scripts/init_rbac.py
```

4. **Start Services**
```bash
# Start all services
docker-compose -f docker-compose.secure.yml up -d

# Verify all services are running
docker-compose ps
```

5. **Post-Deployment Verification**
```bash
# Run security test suite
docker-compose run --rm backend pytest tests/security/

# Check monitoring dashboard
curl http://localhost:3000/health

# Verify MQTT connectivity
mosquitto_pub -h localhost -p 8883 --cafile ca.crt -t test -m "test"
```

---

## Support & Maintenance

### Regular Maintenance Tasks
- Review security logs daily
- Update container images weekly
- Rotate secrets quarterly
- Conduct security audits monthly
- Performance tuning as needed

### Troubleshooting Guide
- Check container logs: `docker logs <container_name>`
- Verify network connectivity: `docker network inspect`
- Review security alerts in monitoring dashboard
- Check database connections and queries
- Validate certificate expiration dates

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Next Review:** February 2025
**Status:** Ready for Implementation