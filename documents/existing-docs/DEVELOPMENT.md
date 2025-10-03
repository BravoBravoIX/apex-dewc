# Development Setup Guide

## Overview

This guide provides instructions for setting up a local development environment for the SCIP v3 platform. The setup includes all necessary services and tools for developing and testing the platform.

## Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   # Check version
   node --version
   
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **Python** (v3.10 or higher)
   ```bash
   # Check version
   python3 --version
   
   # Install Python 3.10
   sudo apt update
   sudo apt install python3.10 python3.10-venv python3-pip
   ```

3. **Docker & Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Git**
   ```bash
   sudo apt install git
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### Development Tools (Recommended)

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Python
  - Docker
  - Thunder Client (API testing)
- **MQTT Explorer** for MQTT debugging
- **PostgreSQL client** (pgAdmin or DBeaver)

## Project Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/cyberops/scip-v3.git
cd scip-v3

# Create branch for development
git checkout -b development
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Key environment variables for development:

```env
# Development Settings
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost

# Database (local development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scip_v3_dev
DB_USER=scip_dev
DB_PASSWORD=dev_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_dev_password

# MQTT
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_WS_PORT=9001
MQTT_USER=dev_user
MQTT_PASSWORD=dev_password

# JWT
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRY=86400

# Development Ports
CLIENT_PORT=3000
API_PORT=8000
ORCHESTRATION_PORT=8001
```

### 3. Install Dependencies

#### Client Dashboard
```bash
cd client-dashboard
npm install

# Install additional dev dependencies
npm install --save-dev @types/react @types/node eslint prettier
```

#### Team Dashboard
```bash
cd ../team-dashboard
npm install

# Lighter dependencies for team dashboards
npm install mqtt zustand lucide-react
```

#### Orchestration Service
```bash
cd ../orchestration
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

#### API Service
```bash
cd ../api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Development Services

### Start Core Services

```bash
# Start PostgreSQL, Redis, and MQTT
docker-compose -f docker-compose.dev.yml up -d postgres redis mqtt

# Verify services are running
docker-compose ps
```

### Database Setup

```bash
# Create database
docker-compose exec postgres createdb -U postgres scip_v3_dev

# Run migrations
cd api
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Start Development Servers

#### Terminal 1: API Service
```bash
cd api
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2: Orchestration Service
```bash
cd orchestration
source venv/bin/activate
python main.py
```

#### Terminal 3: Client Dashboard
```bash
cd client-dashboard
npm run dev
```

#### Terminal 4: Team Dashboard (for testing)
```bash
cd team-dashboard
# Set team environment variables
export TEAM_ID=blue
export TEAM_COLOR="#0066CC"
npm run dev
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# Test locally
# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### 2. Running Tests

#### Frontend Tests
```bash
# Client Dashboard
cd client-dashboard
npm test
npm run test:coverage

# Team Dashboard
cd team-dashboard
npm test
```

#### Backend Tests
```bash
# API Tests
cd api
pytest tests/
pytest tests/ --cov=app --cov-report=html

# Orchestration Tests
cd orchestration
pytest tests/
```

#### Integration Tests
```bash
# Run full integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### 3. Code Quality

#### Linting
```bash
# JavaScript/TypeScript
npm run lint
npm run lint:fix

# Python
flake8 .
black . --check
black .  # Auto-format
```

#### Type Checking
```bash
# TypeScript
npm run type-check

# Python
mypy .
```

## Local Development Tips

### 1. MQTT Testing

Test MQTT connectivity:
```bash
# Subscribe to all topics
mosquitto_sub -h localhost -t '#' -v

# Publish test message
mosquitto_pub -h localhost -t 'test' -m 'Hello MQTT'

# Monitor exercise topics
mosquitto_sub -h localhost -t '/exercise/+/team/+/feed' -v
```

Use MQTT Explorer for GUI-based testing:
- Host: localhost
- Port: 1883
- Username: dev_user
- Password: dev_password

### 2. Database Management

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d scip_v3_dev

# Backup database
docker-compose exec postgres pg_dump -U postgres scip_v3_dev > backup.sql

# Restore database
docker-compose exec postgres psql -U postgres scip_v3_dev < backup.sql
```

### 3. Redis Monitoring

```bash
# Access Redis CLI
docker-compose exec redis redis-cli -a redis_dev_password

# Monitor Redis commands
docker-compose exec redis redis-cli -a redis_dev_password monitor

# Check Redis keys
docker-compose exec redis redis-cli -a redis_dev_password keys '*'
```

### 4. Creating Test Data

#### Create Test Timeline
```python
# scripts/create_test_timeline.py
import json
from datetime import datetime

timeline = {
    "id": "test-timeline",
    "name": "Test Timeline",
    "duration_minutes": 30,
    "injects": [
        {
            "id": "inject-001",
            "time": 0,
            "type": "news",
            "content": {
                "headline": "Test Exercise Begins",
                "body": "This is a test inject.",
                "source": "Test Source"
            }
        },
        {
            "id": "inject-002",
            "time": 60,
            "type": "social",
            "content": {
                "platform": "twitter",
                "username": "@TestUser",
                "text": "Test tweet content",
                "likes": 100
            }
        }
    ]
}

with open('media/exercises/test/timelines/test-timeline.json', 'w') as f:
    json.dump(timeline, f, indent=2)
```

#### Create Test Exercise
```bash
# Use API to create test exercise
curl -X POST http://localhost:8000/api/v1/exercises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Exercise",
    "scenario_id": "test-scenario",
    "teams": [
      {
        "id": "blue",
        "name": "Blue Team",
        "color": "#0066CC",
        "timeline_id": "test-timeline"
      }
    ],
    "duration_minutes": 30
  }'
```

## Hot Reload Configuration

### Frontend Hot Reload

The frontend applications are configured for hot reload by default:

```javascript
// vite.config.js for client-dashboard
export default {
  server: {
    port: 3000,
    host: true,
    hmr: {
      port: 3000
    }
  }
}
```

### Backend Hot Reload

FastAPI with uvicorn supports hot reload:

```bash
# API with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Orchestration with watchdog
watchmedo auto-restart -d . -p '*.py' -- python main.py
```

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Client Dashboard",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/client-dashboard/src"
    },
    {
      "name": "Debug API",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
      ],
      "cwd": "${workspaceFolder}/api"
    },
    {
      "name": "Debug Orchestration",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/orchestration/main.py"
    }
  ]
}
```

### Browser DevTools

For React debugging:
1. Install React Developer Tools extension
2. Use Components tab to inspect component state
3. Use Profiler tab for performance analysis

### Python Debugging

```python
# Add breakpoints in code
import pdb; pdb.set_trace()

# Or use IPython for better debugging
import IPython; IPython.embed()
```

## Common Development Issues

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000
# Kill process
sudo kill -9 <PID>

# Or change port in .env file
```

### Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Python Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Development Best Practices

1. **Use Version Control**
   - Commit frequently with meaningful messages
   - Create feature branches for new work
   - Keep main branch stable

2. **Write Tests**
   - Write unit tests for new functions
   - Add integration tests for API endpoints
   - Test UI components with React Testing Library

3. **Document Your Code**
   - Add JSDoc comments for JavaScript
   - Add docstrings for Python functions
   - Update README files when adding features

4. **Follow Code Style**
   - Use Prettier for JavaScript formatting
   - Use Black for Python formatting
   - Follow existing patterns in codebase

5. **Test Locally**
   - Test with multiple teams
   - Test failure scenarios
   - Test with slow network conditions

## Resources

- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MQTT Documentation](https://mqtt.org/)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Getting Help

- Check existing documentation in `/docs`
- Review code comments and examples
- Contact the development team
- Submit issues on GitHub
