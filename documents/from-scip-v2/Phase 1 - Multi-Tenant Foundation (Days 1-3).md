# Phase 1: Multi-Tenant Foundation (Days 1-3)

## Phase Overview
**Duration:** 3 Days  
**Priority:** Critical - This is the foundation everything builds upon  
**Goal:** Establish a production-ready multi-tenant platform infrastructure with proper organization isolation, authentication framework, and real-time messaging architecture. No data, no scenarios - pure foundation.
**Tasks:** 1-10 (10 main tasks with sub-tasks)

## Success Criteria
- [ ] Docker environment running with all core services (PostgreSQL, Redis, MQTT, Backend)
- [ ] Database schema with full multi-tenancy support via row-level security
- [ ] JWT authentication system with organization context
- [ ] MQTT broker with organization-isolated topic namespacing
- [ ] Core API structure with proper middleware and dependencies
- [ ] Organization isolation proven through integration tests
- [ ] Audit logging system operational
- [ ] Security headers and CORS properly configured
- [ ] Environment-based configuration system
- [ ] Health monitoring endpoints

## Required Source References
- **scip-range:** Backend structure, Docker setup, MQTT patterns
- **media-range (Portfall):** MQTT message queue patterns
- **Gap_Analysis:** Authentication patterns, JWT implementation, security
- **rf-range:** MQTT broker configuration
- **All projects:** Docker patterns, environment configuration

---

## Task List

### Task 1: Docker Infrastructure Setup
**Goal:** Production-ready Docker Compose environment with all services

**1.1 Create Project Structure**
- Create root directory: `scip-v2/`
- Create subdirectories:
  ```
  scip-v2/
  ├── backend/
  ├── docker/
  │   ├── nginx/
  │   ├── mosquitto/
  │   └── postgres/
  ├── shared/
  │   ├── types/
  │   └── schemas/
  ├── scripts/
  │   ├── backup/
  │   └── monitoring/
  └── tests/
      └── integration/
  ```

**1.2 Create Docker Compose Configuration**
Reference docker patterns from existing projects but enhance for production:
- Main `docker-compose.yml` for production
- `docker-compose.dev.yml` override for development
- `docker-compose.test.yml` for testing
- Services required:
  - PostgreSQL 15 with proper resource limits
  - Redis 7 with persistence
  - Eclipse Mosquitto 2.0
  - Backend (FastAPI)
  - Nginx (reverse proxy ready)

**1.3 PostgreSQL Configuration**
- Production-ready postgresql.conf
- Connection pooling configuration
- Backup strategy setup
- Performance tuning (shared_buffers, work_mem)
- SSL certificate setup for connections

**1.4 Redis Configuration**
- Production redis.conf with security
- AOF persistence configuration
- Memory management policies
- Connection limits
- Password authentication

**1.5 MQTT Broker Configuration**
- Production mosquitto.conf
- TLS certificate configuration
- Authentication mechanism setup
- ACL rules file structure
- Connection limits and QoS settings
- Logging configuration

**1.6 Environment Configuration**
- `.env.example` template
- `.env.development`
- `.env.test`
- Secret management structure (not in git)
- Docker secrets for production passwords

**Testing for Task 1:**
- All services start with `docker-compose up`
- Services restart on failure
- Volumes persist data correctly
- Resource limits enforced
- Logs aggregated properly

---

### Task 2: Database Architecture
**Goal:** Production-ready database schema with bulletproof multi-tenancy

**2.1 Database Initialization**
- Create migration system using Alembic
- Initial migration for schema creation
- Separate migrations directory structure
- Rollback procedures documented

**2.2 Core Schema Design**
Design tables with multi-tenancy from ground up:
- Every tenant table has `organization_id`
- Audit fields on all tables (created_at, updated_at, created_by, updated_by)
- Soft delete support (deleted_at)
- Version tracking for critical entities

**2.3 Table Structure**
Core tables needed (no data, just structure):
```sql
- organizations (master tenant table)
- users (with organization association)
- user_sessions (JWT tracking)
- permissions (granular permission system)
- user_permissions (user-permission mapping)
- organization_settings (tenant configuration)
- audit_log (complete audit trail)
- api_keys (for future integrations)
```

**2.4 Row-Level Security Implementation**
- Enable RLS on all tenant tables
- Create security policies for organization isolation
- Create database roles (app_user, app_admin, superadmin)
- Test isolation with different database users
- Document RLS patterns for future tables

**2.5 Performance Optimization**
- Create appropriate indexes
- Partition large tables by organization_id
- Configure autovacuum properly
- Set up connection pooling parameters

**2.6 Audit System**
- Trigger-based audit log
- Capture all CRUD operations
- Store user, timestamp, IP, changes
- Separate audit schema

**Testing for Task 2:**
- Migrations run successfully up and down
- RLS prevents cross-tenant access
- Audit triggers capture all changes
- Performance benchmarks meet requirements
- Database can be restored from backup

---

### Task 3: FastAPI Core Architecture
**Goal:** Production-ready API foundation with security-first design

**Note:** Based on scip-range FastAPI patterns but extended for multi-tenancy and real-time messaging

**3.1 Project Structure**
Create modular, scalable structure based on scip-range but enhanced:
```
backend/
├── alembic/           (database migrations)
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   └── dependencies/
│   │   └── v2/        (future-ready)
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   └── exceptions.py
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── middleware/
├── tests/
└── requirements.txt
```

**3.2 Configuration Management**
- Pydantic Settings for type-safe config
- Environment variable validation
- Configuration classes for different environments
- Secrets management
- Feature flags system

**3.3 Database Connection**
- SQLAlchemy 2.0 setup
- Connection pooling configuration
- Session management with context managers
- Transaction handling
- Query logging for development

**3.4 Security Implementation**
- bcrypt for password hashing
- JWT token generation with RS256
- Token blacklist system in Redis
- Rate limiting middleware
- CORS configuration
- Security headers (helmet-style)
- Input validation middleware

**3.5 Error Handling**
- Global exception handlers
- Custom exception classes
- Consistent error response format
- Error tracking setup (Sentry-ready)
- Correlation IDs for request tracking

**3.6 Middleware Stack**
- Request ID injection
- Organization context setter
- Audit logging middleware  
- Performance monitoring
- Request/response logging

**Testing for Task 3:**
- API starts successfully
- Configuration loads correctly
- Database connections pool properly
- Error handlers catch all exceptions
- Middleware executes in correct order

---

### Task 4: Authentication & Authorization System
**Goal:** Enterprise-grade auth system with organization context

**4.1 JWT Token System**
- RS256 algorithm (public/private key)
- Access token (15 minutes)
- Refresh token (7 days)
- Token rotation on refresh
- Blacklist for revoked tokens

**4.2 Token Payload Structure**
Define comprehensive JWT claims:
```
{
  "sub": "user_uuid",
  "org": "organization_uuid",
  "role": "role_name",
  "permissions": ["permission_array"],
  "session_id": "session_uuid",
  "iat": issued_at,
  "exp": expiration,
  "jti": "unique_token_id"
}
```

**4.3 Authentication Flow**
- Password validation with attempt tracking
- MFA support structure (TOTP ready)
- Session management
- Device fingerprinting
- Suspicious activity detection

**4.4 Authorization System**
- Permission-based (not just role-based)
- Hierarchical permissions
- Organization-scoped permissions
- Resource-level permissions ready
- Permission inheritance

**4.5 Organization Context**
- Middleware to extract org from token
- Database session filtering
- Automatic query scoping
- Cross-organization request prevention

**4.6 Security Features**
- Brute force protection
- Account lockout mechanism
- Password complexity requirements
- Password history
- Session invalidation

**Testing for Task 4:**
- Token generation and validation
- Refresh flow works correctly
- Blacklist prevents revoked tokens
- Organization context properly set
- Permission checks enforced

---

### Task 5: MQTT Multi-Tenant Architecture
**Goal:** Isolated real-time messaging per organization

**5.1 Topic Structure Design**
Implement hierarchical topic structure:
```
/system/health                          # System level
/org/{org_id}/                         # Organization root
  /events                              # Org-wide events
  /exercise/{exercise_id}/              # Exercise specific
    /control                           # Control messages
    /team/{team_id}/                   # Team specific
      /feeds/{feed_type}               # Actual feeds
```

**5.2 Authentication System**
- Dynamic user creation for MQTT
- JWT-based authentication
- Token validation before connection
- Automatic disconnection on expiry

**5.3 ACL Implementation**
- Generate ACL rules dynamically
- Organization-based isolation
- Read/write permissions per topic pattern
- Admin override capabilities
- Audit logging of connections

**5.4 Connection Management**
- Connection pooling for backend
- Automatic reconnection logic
- Connection state tracking
- Clean session handling
- Last will and testament setup

**5.5 Message Standards**
- Define message envelope format
- Timestamp all messages
- Include correlation IDs
- Define QoS levels per message type
- Message versioning strategy

**Testing for Task 5:**
- Connection with valid credentials
- Rejection of invalid credentials
- Topic isolation between organizations
- Message delivery confirmation
- Reconnection after broker restart

---

### Task 6: Core API Framework
**Goal:** RESTful API structure ready for feature development

**6.1 API Versioning**
- URL path versioning (/api/v1/)
- Version negotiation headers
- Deprecation strategy
- Breaking change policy

**6.2 Base Endpoints**
Create foundation endpoints only:
```
GET  /health                    # System health
GET  /ready                     # Readiness check
GET  /api/v1/auth/login        # Authentication
POST /api/v1/auth/refresh      # Token refresh
POST /api/v1/auth/logout       # Session end
GET  /api/v1/auth/me           # Current user
```

**6.3 Request/Response Standards**
- Consistent response envelope
- Pagination standards
- Filtering and sorting patterns
- Field selection support ready
- Response compression

**6.4 API Documentation**
- OpenAPI 3.0 specification
- Auto-generated from code
- Example requests/responses
- Authentication documentation
- Error code dictionary

**6.5 Dependency Injection**
- Database session injection
- Current user injection
- Organization context injection
- Service layer injection ready
- Configuration injection

**Testing for Task 6:**
- All endpoints return correct status codes
- Response format consistent
- Documentation auto-generates
- Pagination works correctly
- Error responses follow standard

---

### Task 7: Service Layer Architecture
**Goal:** Business logic layer foundation

**7.1 Service Pattern**
- Separate business logic from API
- Service classes for each domain
- Dependency injection ready
- Transaction management
- Service interfaces defined

**7.2 Repository Pattern**
- Data access layer abstraction
- Repository per entity
- Query builder pattern
- Specification pattern ready
- Cache integration points

**7.3 Event System**
- Event dispatcher setup
- Event handlers structure
- Async event processing ready
- Event store preparation
- Domain events defined

**7.4 Background Jobs**
- Job queue structure (using Redis)
- Worker process setup
- Job scheduling system ready
- Job status tracking
- Retry logic framework

**Testing for Task 7:**
- Services properly injected
- Transactions rollback on error
- Events dispatch correctly
- Background job structure works
- Repository pattern isolates data access

---

### Task 8: Monitoring & Observability
**Goal:** Production-ready monitoring from day one

**8.1 Health Checks**
- Database connectivity check
- Redis connectivity check
- MQTT broker status
- Disk space monitoring
- Memory usage monitoring

**8.2 Structured Logging**
- JSON logging format
- Correlation ID in all logs
- Log levels properly used
- Sensitive data masking
- Log aggregation ready

**8.3 Metrics Collection**
- Request duration histogram
- Request count by endpoint
- Error rate tracking
- Business metrics structure
- Prometheus format ready

**8.4 Tracing Preparation**
- OpenTelemetry setup
- Span creation structure
- Distributed tracing ready
- Performance profiling hooks

**8.5 Alerting Structure**
- Alert rules definition format
- Critical vs warning alerts
- Alert routing preparation
- Escalation policies ready

**Testing for Task 8:**
- Health endpoints return accurate status
- Logs contain correlation IDs
- Metrics increment correctly
- No sensitive data in logs
- Performance baseline established

---

### Task 9: Security Hardening
**Goal:** Security-first implementation

**9.1 API Security**
- Rate limiting per endpoint
- Request size limits
- Timeout configurations
- HTTPS enforcement ready
- API key system structure

**9.2 Input Validation**
- Pydantic models for all inputs
- SQL injection prevention
- XSS prevention
- File upload restrictions ready
- Path traversal prevention

**9.3 Security Headers**
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security ready
- Permissions-Policy

**9.4 Secrets Management**
- Environment variable encryption
- Database credential rotation ready
- API key rotation system
- Certificate management structure

**9.5 Audit System**
- All authentication attempts logged
- API access logging
- Permission changes tracked
- Data modification audit trail
- Suspicious activity detection

**Testing for Task 9:**
- Security headers present
- Rate limiting enforces limits
- SQL injection attempts blocked
- Audit logs capture all events
- Secrets not exposed in logs

---

### Task 10: Testing Infrastructure
**Goal:** Comprehensive testing foundation

**10.1 Unit Test Structure**
- pytest configuration
- Test database setup
- Fixtures for common entities
- Mock services setup
- Coverage configuration

**10.2 Integration Tests**
- API client for testing
- Database isolation per test
- MQTT testing setup
- Redis testing configuration
- Transaction rollback per test

**10.3 End-to-End Test Framework**
- Multi-organization scenarios
- Authentication flow testing
- Organization isolation verification
- Performance benchmarks
- Load test structure

**10.4 Security Tests**
- Authentication bypass attempts
- Authorization boundary testing
- Input fuzzing setup
- Rate limit verification
- SQL injection tests

**10.5 CI/CD Preparation**
- GitHub Actions workflow ready
- Test automation on PR
- Coverage reporting
- Linting and formatting
- Security scanning setup

**Testing for Task 10:**
- All tests pass
- Coverage above 80%
- Integration tests verify isolation
- Security tests find no vulnerabilities
- Performance benchmarks established

---

## Validation Checklist
Before moving to Phase 2, verify:

1. **Infrastructure**
   - [ ] All Docker services running stable
   - [ ] Database migrations working
   - [ ] Redis persistence verified
   - [ ] MQTT broker accepting connections

2. **Multi-Tenancy**
   - [ ] RLS policies enforced
   - [ ] Organization context in API
   - [ ] MQTT topics isolated
   - [ ] Audit trail working

3. **Security**
   - [ ] JWT authentication working
   - [ ] Rate limiting active
   - [ ] Security headers present
   - [ ] Input validation enforced

4. **API Foundation**
   - [ ] Health checks passing
   - [ ] Documentation generating
   - [ ] Error handling consistent
   - [ ] Logging structured

5. **Testing**
   - [ ] Unit tests passing
   - [ ] Integration tests passing
   - [ ] Security tests passing
   - [ ] Coverage adequate

## Files to Reference from Existing Projects

From **scip-range:**
- Docker Compose structure
- FastAPI application structure
- MQTT client implementation patterns
- Basic model structures

From **media-range (Portfall):**
- MQTT message patterns
- Real-time update mechanisms

From **Gap_Analysis:**
- Authentication implementation
- JWT token management
- Security patterns
- User model structure

From **rf-range:**
- MQTT broker configuration
- Hardware integration preparation (future use)

## Success Metrics
- Zero security vulnerabilities in scan
- 100% test coverage on critical paths
- < 100ms API response time (95th percentile)
- Zero cross-organization data leakage
- All health checks passing
- Audit trail captures all operations

## Next Phase Dependencies
Phase 2 will require:
- Authentication system operational
- Organization context working
- MQTT broker configured
- API framework established
- Database multi-tenancy proven

---

## Implementation Notes
- Build for production from start
- No hardcoded values
- All configuration via environment
- Security first approach
- Document all decisions
- Test everything thoroughly
- Use established patterns from existing projects
- Don't compromise on quality for speed