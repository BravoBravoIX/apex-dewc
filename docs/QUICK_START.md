# Quick Start Guide

Get the SCIP v3 platform running in under 15 minutes!

## Prerequisites

Ensure you have the following installed:
- Docker Desktop (version 20.10+)
- Docker Compose (version 2.0+)
- Git
- 8GB RAM available
- 10GB disk space

## 1. Clone and Setup (2 minutes)

```bash
# Clone the repository
git clone https://github.com/cyberops/scip-v3.git
cd scip-v3

# Copy environment configuration
cp .env.example .env

# Create media directories
mkdir -p media/exercises/{images,videos,documents,timelines}
```

## 2. Start Core Services (3 minutes)

```bash
# Start PostgreSQL, Redis, and MQTT
docker-compose up -d postgres redis mqtt

# Wait for services to be healthy (about 30 seconds)
docker-compose ps

# You should see:
# scip-postgres   ... Up (healthy)
# scip-redis      ... Up (healthy)
# scip-mqtt       ... Up (healthy)
```

## 3. Initialize Database (2 minutes)

```bash
# Run database migrations
docker-compose exec postgres psql -U scip_user -d scip_v3 < scripts/init.sql

# Verify database
docker-compose exec postgres psql -U scip_user -d scip_v3 -c "\dt"
```

## 4. Start Application Services (3 minutes)

```bash
# Start API and Orchestration services
docker-compose up -d api orchestration

# Start Client Dashboard
docker-compose up -d client-dashboard

# Verify all services running
docker-compose ps
```

## 5. Create Your First Timeline (2 minutes)

Create a test timeline file:

```bash
cat > media/exercises/timelines/quick-start.json << 'EOF'
{
  "id": "quick-start",
  "name": "Quick Start Timeline",
  "duration_minutes": 10,
  "injects": [
    {
      "id": "inject-001",
      "time": 0,
      "type": "news",
      "content": {
        "headline": "Exercise Started",
        "body": "Welcome to SCIP v3 Quick Start Exercise",
        "source": "System"
      }
    },
    {
      "id": "inject-002",
      "time": 60,
      "type": "social",
      "content": {
        "platform": "twitter",
        "username": "@SCIPSystem",
        "text": "Test inject at T+1 minute",
        "likes": 42
      }
    },
    {
      "id": "inject-003",
      "time": 120,
      "type": "sms",
      "content": {
        "from": "+1234567890",
        "text": "This is a test SMS at T+2 minutes"
      }
    }
  ]
}
EOF
```

## 6. Access the Platform (1 minute)

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the DEWC Client Dashboard login page.

Default credentials:
- Username: `admin`
- Password: `admin123`

## 7. Run a Test Exercise (2 minutes)

### Quick Exercise Setup

1. **From Dashboard**: Click "Quick Start" or navigate to "Scenarios"

2. **Configure Teams**:
   - Team 1: ID=`blue`, Name=`Blue Team`
   - Team 2: ID=`red`, Name=`Red Team`

3. **Assign Timeline**: Select `quick-start` for both teams

4. **Deploy**: Click "Deploy" to create team dashboards

5. **Start Exercise**: Click "START" button

### View Team Dashboards

Open team dashboards in new tabs:
- Blue Team: http://localhost:3101
- Red Team: http://localhost:3102

Watch as injects appear at T+0, T+1, and T+2 minutes!

## Quick Commands Reference

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]
```

### Testing MQTT

```bash
# Monitor all MQTT messages
docker-compose exec mqtt mosquitto_sub -h localhost -t '#' -v

# Send test inject
docker-compose exec mqtt mosquitto_pub -h localhost \
  -t '/exercise/test/team/blue/feed' \
  -m '{"type":"test","content":"Hello World"}'
```

### Database Access

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U scip_user -d scip_v3

# Backup database
docker-compose exec postgres pg_dump -U scip_user scip_v3 > backup.sql
```

## Quick Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
lsof -i :3000  # Client Dashboard
lsof -i :8000  # API
lsof -i :5432  # PostgreSQL

# Kill conflicting processes or change ports in .env
```

### Can't Access Dashboard

```bash
# Check if service is running
docker-compose ps client-dashboard

# Check logs for errors
docker-compose logs client-dashboard

# Restart the service
docker-compose restart client-dashboard
```

### MQTT Connection Issues

```bash
# Test MQTT broker
telnet localhost 1883

# Check MQTT logs
docker-compose logs mqtt

# Restart MQTT
docker-compose restart mqtt
```

## Sample Timeline Templates

### 5-Minute Demo Timeline

```json
{
  "id": "demo-5min",
  "name": "5 Minute Demo",
  "duration_minutes": 5,
  "injects": [
    {
      "id": "d1",
      "time": 0,
      "type": "news",
      "content": {
        "headline": "Scenario Begins",
        "body": "Monitoring situation...",
        "source": "Command"
      }
    },
    {
      "id": "d2",
      "time": 60,
      "type": "social",
      "content": {
        "platform": "twitter",
        "username": "@BreakingNews",
        "text": "Developing situation detected",
        "likes": 234
      }
    },
    {
      "id": "d3",
      "time": 120,
      "type": "email",
      "content": {
        "from": "ops@command.gov",
        "subject": "Status Update Required",
        "body": "Please provide current status."
      }
    },
    {
      "id": "d4",
      "time": 180,
      "type": "sms",
      "content": {
        "from": "COMMAND",
        "text": "Exercise entering final phase"
      }
    },
    {
      "id": "d5",
      "time": 240,
      "type": "news",
      "content": {
        "headline": "Exercise Complete",
        "body": "All objectives achieved",
        "source": "Command"
      }
    }
  ]
}
```

### Crisis Response Timeline

```json
{
  "id": "crisis-30min",
  "name": "Crisis Response 30min",
  "duration_minutes": 30,
  "injects": [
    {
      "id": "c1",
      "time": 0,
      "type": "news",
      "content": {
        "headline": "Crisis Alert",
        "body": "Initial reports of cyber incident",
        "source": "Security Operations"
      }
    },
    {
      "id": "c2",
      "time": 120,
      "type": "social",
      "content": {
        "platform": "twitter",
        "username": "@PublicAlert",
        "text": "Banks reporting service disruptions #cyberattack",
        "likes": 5234,
        "retweets": 1823
      }
    },
    {
      "id": "c3",
      "time": 300,
      "type": "email",
      "content": {
        "from": "director@defence.gov",
        "subject": "URGENT: Activate Response Protocol",
        "body": "All teams implement emergency procedures immediately."
      }
    },
    {
      "id": "c4",
      "time": 600,
      "type": "sms",
      "content": {
        "from": "OPS",
        "text": "CODE RED: Critical infrastructure affected"
      }
    },
    {
      "id": "c5",
      "time": 900,
      "type": "news",
      "content": {
        "headline": "Government Response",
        "body": "Emergency task force activated",
        "source": "Reuters"
      }
    },
    {
      "id": "c6",
      "time": 1200,
      "type": "social",
      "content": {
        "platform": "twitter",
        "username": "@GovResponse",
        "text": "Situation contained. Services being restored.",
        "likes": 10234
      }
    },
    {
      "id": "c7",
      "time": 1500,
      "type": "email",
      "content": {
        "from": "command@defence.gov",
        "subject": "Stand Down",
        "body": "Crisis resolved. Begin after-action review."
      }
    },
    {
      "id": "c8",
      "time": 1800,
      "type": "news",
      "content": {
        "headline": "Exercise Complete",
        "body": "All objectives met. Debrief at 1400hrs.",
        "source": "Exercise Control"
      }
    }
  ]
}
```

## Development Quick Start

For development with hot-reload:

```bash
# Terminal 1: Backend services
docker-compose up postgres redis mqtt

# Terminal 2: API (with hot reload)
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Orchestration
cd orchestration
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminal 4: Client Dashboard (with hot reload)
cd client-dashboard
npm install
npm run dev

# Terminal 5: Team Dashboard (for testing)
cd team-dashboard
npm install
TEAM_ID=blue TEAM_COLOR="#0066CC" npm run dev
```

## Useful Links

Once running, access:

- **Client Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Team Blue**: http://localhost:3101 (when deployed)
- **Team Red**: http://localhost:3102 (when deployed)
- **MQTT WebSocket**: ws://localhost:9001

## Next Steps

1. **Read the User Guide**: Learn how to create complex scenarios
2. **Explore Timeline Format**: Understand inject structure
3. **Review API Documentation**: Integrate with external systems
4. **Check Architecture Guide**: Understand system design

## Getting Help

- Check `/docs` folder for detailed documentation
- Review logs: `docker-compose logs [service_name]`
- Common issues are in the Troubleshooting section
- Contact: support@cyberops.io

## Quick Reset

If you need to start fresh:

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Remove media files
rm -rf media/exercises/*

# Start fresh
docker-compose up -d
```

---

**Congratulations!** You now have SCIP v3 running locally. 🎉

Start creating your own training scenarios and run multi-team exercises!
