# SCIP v3 Platform Documentation

## Overview

The Strategic Crisis Information Platform (SCIP) v3 is a multi-team exercise platform designed for the Defence Electronics Warfare Centre (DEWC) in Adelaide. It provides isolated information feeds to multiple teams during synchronized training exercises, simulating information warfare conditions.

## Key Features

- **Multi-Team Exercises**: Support for up to 10 simultaneous teams with isolated information feeds
- **MQTT-Driven Architecture**: Real-time message delivery using MQTT for inject distribution
- **Synchronized Timelines**: All teams operate on the same exercise timer with coordinated inject delivery
- **Local Media Storage**: Media files stored locally for efficient access by team dashboards
- **Flexible Timeline System**: Reusable inject timelines that can be assigned to different teams
- **Real-Time Monitoring**: Live exercise monitoring with team status and inject delivery tracking

## Platform Components

### 1. Client Dashboard (DEWC Portal)
- Exercise configuration and launch control
- Timeline management and inject scheduling
- Real-time exercise monitoring
- Team dashboard deployment

### 2. Team Dashboards
- Isolated views for each team
- Multiple feed types: Social Media, News, SMS, Email, Intelligence
- Real-time inject reception via MQTT
- Synchronized exercise timer display

### 3. Orchestration Service
- Exercise timer management
- MQTT message publishing
- Timeline execution engine
- Failed inject retry handling

### 4. Media Storage
- Local file system storage
- Organized by exercise and media type
- Direct access for team dashboards

## Quick Start

1. Configure teams and assign timelines in the Client Dashboard
2. Deploy team dashboards (automatic Docker container creation)
3. Start the exercise to begin synchronized timeline execution
4. Monitor inject delivery and team status in real-time
5. Handle any failed deliveries with manual resend options

## Documentation Structure

- **[Architecture](ARCHITECTURE.md)** - Technical architecture and system design
- **[Client Dashboard](CLIENT_DASHBOARD.md)** - DEWC portal specifications
- **[Team Dashboards](TEAM_DASHBOARDS.md)** - Team interface specifications
- **[Orchestration](ORCHESTRATION.md)** - Exercise execution engine
- **[Timeline Format](TIMELINE_FORMAT.md)** - JSON structure for inject timelines
- **[Deployment](DEPLOYMENT.md)** - Installation and deployment guide
- **[API Reference](API.md)** - API endpoints and data models
- **[User Guide](USER_GUIDE.md)** - Operational guide for DEWC staff

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: FastAPI (Python)
- **Messaging**: MQTT (Eclipse Mosquitto)
- **Database**: PostgreSQL
- **Containerization**: Docker
- **State Management**: Zustand (Team Dashboards), Redux (Client Dashboard)

## Contact

For questions or support, contact the CyberOps development team.
