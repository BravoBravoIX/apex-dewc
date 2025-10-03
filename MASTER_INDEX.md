# SCIP v3 Platform - Master Index

## 🚀 Quick Start Paths

### For Developers
1. Start here: `documents/build-plans/` - Phase 1, 2, 3 implementation guides
2. Architecture: `documents/architecture/` - Technical decisions
3. Extract components: `documents/guides/Component-Extraction-Guide.md`
4. Reference code: `reference/` - All source applications

### For Project Managers  
1. Overview: `documents/specifications/` - System specifications
2. Use cases: `documents/use-cases/` - Real-world scenarios
3. Timeline: `documents/build-plans/Build-Timeline-Diagram.html`

## 📁 Directory Structure

```
scip-v3/
├── reference/                      # Source code references
│   ├── from-scip-v2/              # Reference apps from scip-v2
│   │   ├── Gap_Analysis/          # UI theme and components
│   │   ├── media-range/           # MQTT patterns (Portfall)
│   │   ├── rf-range/              # RF integration
│   │   └── scip-range/            # Management tool
│   ├── from-main/                 # Latest versions from main
│   │   ├── Gap_Analysis/          # Latest UI components
│   │   ├── media-range/           # Latest MQTT implementation
│   │   ├── client-dashboard/      # Client portal reference
│   │   └── ...
│   └── phase-implementations/      # Previous build phases
│       ├── phase2.16/             # ⭐ CLIENT dashboard (critical!)
│       ├── phase1/                # Foundation reference
│       └── ...
│
├── documents/                      # All documentation
│   ├── specifications/            # Technical specifications
│   ├── architecture/              # Architecture decisions
│   ├── build-plans/               # 10-day build plan
│   ├── use-cases/                 # Implementation scenarios
│   ├── guides/                    # How-to guides
│   ├── from-scip-v2/             # Legacy documentation
│   └── existing-docs/             # Original scip-v3 docs
│
└── docs/                          # Original documentation (preserved)
```

## 🎯 Priority References

### Critical for Phase 1 (Days 1-3)
- **Docker Setup**: `reference/from-scip-v2/scip-range/docker-compose.yml`
- **FastAPI Backend**: `reference/from-scip-v2/scip-range/backend/`
- **Auth Patterns**: `reference/from-scip-v2/Gap_Analysis/`
- **Build Guide**: `documents/build-plans/Phase-1-Multi-Tenant-Foundation.md`

### Critical for Phase 2 (Days 4-7)
- **CLIENT Dashboard**: `reference/phase-implementations/phase2.16/` ⭐⭐⭐
- **Feed Components**: `reference/from-scip-v2/media-range/src/components/feeds/`
- **MQTT Patterns**: `reference/from-scip-v2/media-range/src/services/mqtt.js`
- **Build Guide**: `documents/build-plans/Phase-2-Platform-Interfaces.md`

### Critical for Phase 3 (Days 8-10)
- **Admin UI**: `reference/from-scip-v2/Gap_Analysis/app/`
- **RF Integration**: `reference/from-scip-v2/rf-range/`
- **Build Guide**: `documents/build-plans/Phase-3-SCIP-Control.md`

## 📚 Key Documentation Files

### System Specifications
- `documents/specifications/SCIP-Control-Technical-Specification.md`
- `documents/specifications/Client-Dashboard-Technical-Specification.md`
- `documents/specifications/Team-Dashboards-Technical-Specification.md`

### Architecture & Design
- `documents/architecture/Technical-Architecture-Stack.md`
- `documents/architecture/Docker-Compose-Configuration.md`
- `documents/architecture/Scenario-Management-Models.md`

### Implementation Guides
- `documents/guides/Component-Extraction-Guide.md` - What to extract from each reference
- `documents/guides/Phase2-16-Review-Guide.md` - Understanding phase2.16 implementation
- `documents/guides/Documentation-Assessment-Summary.md` - What we have vs. need

## 🔧 Technology Stack

- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15 with RLS
- **Cache**: Redis 7
- **Message Queue**: MQTT (Eclipse Mosquitto 2.0)
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT with RS256

## 🎨 Component Sources

| Component | Source Location | Used For |
|-----------|----------------|----------|
| Docker Config | `scip-range` | Service orchestration |
| MQTT Patterns | `media-range` | Real-time messaging |
| UI Theme | `Gap_Analysis` | Professional interface |
| Dashboard Deploy | `phase2.16` | Team dashboard launching |
| RF Control | `rf-range` | Jamming demonstrations |

## ⚡ Next Steps

1. **Review phase2.16**: Contains working CLIENT dashboard implementation
2. **Set up Docker**: Use patterns from scip-range
3. **Start Phase 1**: Follow the multi-tenant foundation guide
4. **Extract components**: Use the extraction guide for each reference app

## 📊 Success Metrics

- Support 50+ organizations
- 100+ concurrent exercises  
- 500+ team dashboards
- 10,000 messages/second
- < 100ms real-time latency
- 99.9% uptime

## 📝 Notes

- **phase2.16 is critical** - It shows how dashboard deployment actually works
- Gap_Analysis provides the professional white/grey theme
- media-range (Portfall) has all the MQTT patterns we need
- scip-range has the Docker and backend structure

---

Generated: $(date)
Project: SCIP v3 Platform
Organization: CyberOps
