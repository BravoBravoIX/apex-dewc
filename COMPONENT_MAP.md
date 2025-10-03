# SCIP v3 Component Extraction Map

## Quick Reference: What to Extract From Where

### 🐳 Docker & Infrastructure
**Source**: `reference/from-scip-v2/scip-range/`
- `docker-compose.yml` - Service definitions
- `Dockerfile` - Container configurations  
- `scripts/` - Deployment scripts
- `.env.example` - Environment variables

### ⚡ MQTT Messaging
**Source**: `reference/from-scip-v2/media-range/`
- `src/services/mqtt.js` - MQTT client implementation
- `src/components/feeds/` - Feed display components
- Message format patterns
- Topic structure design

### 🎨 UI Theme & Components
**Source**: `reference/from-scip-v2/Gap_Analysis/`
- `tailwind.config.js` - Theme configuration
- `app/components/` - Professional UI components
- White/grey corporate theme
- Data tables and forms

### 🚀 Dashboard Deployment
**Source**: `reference/phase-implementations/phase2.16/`
- CLIENT dashboard implementation
- Docker orchestration for teams
- Dynamic port allocation
- Team isolation patterns

### 📡 RF Integration
**Source**: `reference/from-scip-v2/rf-range/`
- `rf_controller/` - SDR control
- Frequency generation
- GNU Radio integration
- Safety limits

### 🔧 Backend Structure
**Source**: `reference/from-scip-v2/scip-range/backend/`
- FastAPI application structure
- API endpoint patterns
- Database models
- Authentication flow

## Extraction Priority by Phase

### Phase 1 (Foundation)
1. ✅ Docker configuration from scip-range
2. ✅ FastAPI structure from scip-range
3. ✅ Authentication from Gap_Analysis
4. ✅ Database patterns from scip-range

### Phase 2 (Platform Core)
1. ✅ MQTT client from media-range
2. ✅ Feed components from media-range
3. ✅ Dashboard deployment from phase2.16
4. ✅ Basic UI components from Gap_Analysis

### Phase 3 (Control & Polish)
1. ✅ Admin interface from Gap_Analysis
2. ✅ Data visualizations from Gap_Analysis
3. ✅ RF service from rf-range
4. ✅ Complete theme application

## File-Level Extraction Guide

### Must Extract (Phase 1-2)
```
scip-range/
  ├── docker-compose.yml ➜ /docker/
  ├── backend/app/main.py ➜ /backend/
  └── backend/app/core/ ➜ /backend/core/

media-range/
  ├── src/services/mqtt.js ➜ /shared/mqtt/
  └── src/components/feeds/ ➜ /components/feeds/

Gap_Analysis/
  ├── tailwind.config.js ➜ /shared/theme/
  └── app/components/ui/ ➜ /components/ui/

phase2.16/
  └── [entire implementation] ➜ Study for patterns
```

## Adaptation Notes

- Add organization context to all components
- Implement RLS on database queries
- Add MQTT topic namespacing per org
- Apply Gap_Analysis theme consistently
- Use phase2.16 dashboard deployment patterns
