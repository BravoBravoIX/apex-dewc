# SCIP v3 Documentation Index

## Documentation Overview

This directory contains comprehensive documentation for the Strategic Crisis Information Platform (SCIP) v3, a multi-team exercise platform designed for the Defence Electronics Warfare Centre (DEWC) in Adelaide.

## Documentation Structure

### 📚 Core Documentation

| Document | Description | Primary Audience |
|----------|-------------|------------------|
| [README.md](README.md) | Platform overview and main documentation hub | All users |
| [QUICK_START.md](QUICK_START.md) | Get up and running in 15 minutes | Developers, First-time users |
| [USER_GUIDE.md](USER_GUIDE.md) | Complete operational guide for DEWC staff | DEWC Training Coordinators |

### 🏗️ Technical Architecture

| Document | Description | Primary Audience |
|----------|-------------|------------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design and technical architecture | Developers, System Architects |
| [DOCKER.md](DOCKER.md) | Docker configuration and container orchestration | DevOps, System Administrators |
| [MQTT.md](MQTT.md) | MQTT messaging configuration and patterns | Backend Developers |

### 💻 Platform Components

| Document | Description | Primary Audience |
|----------|-------------|------------------|
| [CLIENT_DASHBOARD.md](CLIENT_DASHBOARD.md) | DEWC portal specifications and UI design | Frontend Developers, UX Designers |
| [TEAM_DASHBOARDS.md](TEAM_DASHBOARDS.md) | Team interface specifications | Frontend Developers |
| [ORCHESTRATION.md](ORCHESTRATION.md) | Exercise execution engine details | Backend Developers |

### 🔧 Development & Operations

| Document | Description | Primary Audience |
|----------|-------------|------------------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Local development environment setup | Developers |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide | DevOps, System Administrators |
| [TESTING.md](TESTING.md) | Testing strategies and procedures | QA Engineers, Developers |

### 📋 Reference Documentation

| Document | Description | Primary Audience |
|----------|-------------|------------------|
| [API.md](API.md) | Complete API reference and endpoints | API Developers, Integration Engineers |
| [TIMELINE_FORMAT.md](TIMELINE_FORMAT.md) | JSON structure for inject timelines | Content Creators, Scenario Designers |

## Quick Navigation

### For DEWC Staff (End Users)
Start here if you're operating the platform:
1. [USER_GUIDE.md](USER_GUIDE.md) - Learn how to create and run exercises
2. [TIMELINE_FORMAT.md](TIMELINE_FORMAT.md) - Understand inject structure
3. [CLIENT_DASHBOARD.md](CLIENT_DASHBOARD.md) - Navigate the interface

### For Developers
Start here if you're developing or extending the platform:
1. [QUICK_START.md](QUICK_START.md) - Get running quickly
2. [DEVELOPMENT.md](DEVELOPMENT.md) - Set up development environment
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand system design
4. [API.md](API.md) - API integration reference

### For System Administrators
Start here if you're deploying or maintaining the platform:
1. [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
2. [DOCKER.md](DOCKER.md) - Container management
3. [MQTT.md](MQTT.md) - Message broker configuration

## Key Concepts

### Platform Components
- **Client Dashboard**: Web interface for DEWC staff to configure and launch exercises
- **Team Dashboards**: Isolated interfaces for exercise participants
- **Orchestration Service**: Engine that executes scenarios and delivers injects
- **MQTT Broker**: Real-time message delivery system

### Exercise Flow
1. **Configuration**: DEWC staff create teams and assign timelines
2. **Deployment**: Docker containers created for each team
3. **Execution**: Timer starts, injects delivered via MQTT
4. **Monitoring**: Real-time status and inject delivery tracking
5. **Completion**: Exercise ends, dashboards cleaned up

### Timeline Structure
Timelines are JSON files containing sequences of injects (news, social media, emails, SMS, documents) that are delivered to teams at specific times during an exercise.

## Architecture Summary

```
┌─────────────────────────────────────────┐
│         Client Dashboard (React)         │
│         DEWC Portal Interface            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           Backend API (FastAPI)          │
│         Authentication & Data            │
└─────┬───────────────────────┬───────────┘
      │                       │
┌─────▼──────┐         ┌─────▼──────────┐
│ PostgreSQL │         │  Orchestration  │
│  Database  │         │    Service      │
└────────────┘         └─────┬──────────┘
                             │
                    ┌────────▼────────┐
                    │   MQTT Broker   │
                    │   (Mosquitto)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼─────┐      ┌───────▼─────┐     ┌───────▼─────┐
│Team Blue    │      │Team Red     │     │Team Orange  │
│Dashboard    │      │Dashboard    │     │Dashboard    │
└─────────────┘      └─────────────┘     └─────────────┘
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** (Team Dashboards) / **Redux** (Client Dashboard) for state
- **MQTT.js** for real-time messaging

### Backend
- **FastAPI** (Python 3.10+) for REST API
- **PostgreSQL 15** for data storage
- **Redis 7** for caching and sessions
- **Eclipse Mosquitto** for MQTT messaging
- **Docker** for containerization

### Development Tools
- **Docker Compose** for local development
- **Jest** and **React Testing Library** for frontend tests
- **Pytest** for backend tests
- **GitHub Actions** for CI/CD

## Common Tasks

### Start the Platform
```bash
docker-compose up -d
# Access at http://localhost:3000
```

### Create a Timeline
See [TIMELINE_FORMAT.md](TIMELINE_FORMAT.md) for JSON structure

### Run an Exercise
See [USER_GUIDE.md](USER_GUIDE.md) for step-by-step instructions

### Deploy to Production
See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment procedures

### Run Tests
```bash
# Frontend tests
cd client-dashboard && npm test

# Backend tests
cd api && pytest tests/

# Integration tests
docker-compose -f docker-compose.test.yml up
```

## Support & Contact

### Getting Help
1. Check the relevant documentation file
2. Review [QUICK_START.md](QUICK_START.md) for common issues
3. Check logs: `docker-compose logs [service_name]`
4. Contact the development team

### Reporting Issues
When reporting issues, please include:
- Exercise ID and timestamp
- Error messages from logs
- Steps to reproduce
- Screenshots if applicable

### Contributing
1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for setup
2. Follow existing code patterns
3. Write tests for new features
4. Update relevant documentation

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v3.0.0 | 2024-01 | Initial release with MQTT-driven architecture |
| v3.1.0 | TBD | Decision capture interface (Phase 2) |
| v3.2.0 | TBD | Advanced analytics and reporting (Phase 3) |

## License

Copyright © 2024 CyberOps

## Glossary

- **Exercise**: A training session with multiple teams
- **Inject**: A piece of information delivered to teams (news, social media, etc.)
- **Timeline**: A sequence of injects with timing information
- **Scenario**: A pre-built exercise configuration
- **Orchestration**: The process of executing an exercise and delivering injects
- **MQTT**: Message protocol for real-time inject delivery
- **Team Dashboard**: Isolated interface for exercise participants
- **Client Dashboard**: Administrative interface for DEWC staff

---

**Documentation Version:** 1.0.0  
**Last Updated:** January 2024  
**Platform Version:** SCIP v3.0.0
