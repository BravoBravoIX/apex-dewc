#!/bin/bash

# SCIP v3 Complete Setup Script
# This script consolidates all reference materials and documentation for SCIP v3

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           SCIP v3 Complete Setup Script                   ║"
echo "║     Consolidating Reference Materials & Documentation      ║"  
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Define paths
SOURCE_BASE="/Users/brettburford/Development/CyberOps"
TARGET_BASE="/Users/brettburford/Development/CyberOps/scip-v3"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}${BOLD}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $2"
    else
        echo -e "  ${RED}✗${NC} $2"
    fi
}

# ============================================================================
# STEP 1: Create Directory Structure
# ============================================================================

print_section "Step 1: Creating Directory Structure"

directories=(
    "reference"
    "reference/from-scip-v2"
    "reference/from-main"
    "reference/phase-implementations"
    "documents"
    "documents/specifications"
    "documents/architecture"
    "documents/build-plans"
    "documents/use-cases"
    "documents/guides"
    "documents/from-scip-v2"
    "documents/existing-docs"
)

for dir in "${directories[@]}"; do
    mkdir -p "$TARGET_BASE/$dir"
    print_status $? "Created $dir"
done

# ============================================================================
# STEP 2: Copy Reference Applications
# ============================================================================

print_section "Step 2: Copying Reference Applications"

# Copy from scip-v2/reference if it exists
if [ -d "$SOURCE_BASE/scip-v2/reference" ]; then
    echo -e "${CYAN}Copying from scip-v2/reference...${NC}"
    
    for app in Gap_Analysis media-range rf-range scip-range; do
        if [ -d "$SOURCE_BASE/scip-v2/reference/$app" ]; then
            cp -r "$SOURCE_BASE/scip-v2/reference/$app" "$TARGET_BASE/reference/from-scip-v2/" 2>/dev/null
            print_status $? "Copied $app"
        fi
    done
fi

# Copy from main CyberOps directory
echo -e "\n${CYAN}Copying from main CyberOps directory...${NC}"

apps_to_copy=(
    "Gap_Analysis"
    "media-range"
    "rf-range"
    "scip-range"
    "portfall-archive"
    "client-dashboard"
)

for app in "${apps_to_copy[@]}"; do
    if [ -d "$SOURCE_BASE/$app" ]; then
        cp -r "$SOURCE_BASE/$app" "$TARGET_BASE/reference/from-main/" 2>/dev/null
        print_status $? "Copied $app"
    fi
done

# Copy phase implementations
echo -e "\n${CYAN}Copying phase implementations...${NC}"

phase_dirs=(
    "scip-v2.phase1"
    "scip-v2.phase2.15"
    "scip-v2.phase2.15.2"
    "scip-v2.phase2.16"
    "scip-v2.phase2.16.2"
    "scip-v2.phase2.16.3"
    "scip-v2.phase2.16.4"
)

for phase in "${phase_dirs[@]}"; do
    if [ -d "$SOURCE_BASE/$phase" ]; then
        phase_name=${phase#scip-v2.}
        cp -r "$SOURCE_BASE/$phase" "$TARGET_BASE/reference/phase-implementations/$phase_name" 2>/dev/null
        print_status $? "Copied $phase"
    fi
done

# ============================================================================
# STEP 3: Copy Documentation
# ============================================================================

print_section "Step 3: Consolidating Documentation"

# Copy markdown files from scip-v2
if [ -d "$SOURCE_BASE/scip-v2" ]; then
    echo -e "${CYAN}Copying documentation from scip-v2...${NC}"
    
    # Copy all .md files from root
    find "$SOURCE_BASE/scip-v2" -maxdepth 1 -name "*.md" -exec cp {} "$TARGET_BASE/documents/from-scip-v2/" \; 2>/dev/null
    print_status $? "Copied root markdown files"
    
    # Copy documents directory content
    if [ -d "$SOURCE_BASE/scip-v2/documents" ]; then
        cp -r "$SOURCE_BASE/scip-v2/documents/"* "$TARGET_BASE/documents/from-scip-v2/" 2>/dev/null
        print_status $? "Copied documents directory"
    fi
fi

# Move existing docs from scip-v3/docs
if [ -d "$TARGET_BASE/docs" ]; then
    echo -e "\n${CYAN}Preserving existing documentation...${NC}"
    cp -r "$TARGET_BASE/docs/"* "$TARGET_BASE/documents/existing-docs/" 2>/dev/null
    print_status $? "Preserved existing docs"
fi

# ============================================================================
# STEP 4: Create Master Index
# ============================================================================

print_section "Step 4: Creating Master Documentation Index"

cat > "$TARGET_BASE/MASTER_INDEX.md" << 'EOF'
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
EOF

print_status $? "Created MASTER_INDEX.md"

# ============================================================================
# STEP 5: Create Component Mapping
# ============================================================================

print_section "Step 5: Creating Component Mapping"

cat > "$TARGET_BASE/COMPONENT_MAP.md" << 'EOF'
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
EOF

print_status $? "Created COMPONENT_MAP.md"

# ============================================================================
# STEP 6: Summary Report
# ============================================================================

print_section "Summary Report"

echo -e "${GREEN}${BOLD}✅ Setup Complete!${NC}\n"

# Count files
ref_count=$(find "$TARGET_BASE/reference" -type f 2>/dev/null | wc -l)
doc_count=$(find "$TARGET_BASE/documents" -type f -name "*.md" 2>/dev/null | wc -l)

echo -e "${CYAN}Statistics:${NC}"
echo -e "  📁 Reference files: ${BOLD}$ref_count${NC}"
echo -e "  📄 Documentation files: ${BOLD}$doc_count${NC}"

echo -e "\n${CYAN}Key Locations:${NC}"
echo -e "  🏠 Project Root: ${BOLD}$TARGET_BASE${NC}"
echo -e "  📚 Master Index: ${BOLD}$TARGET_BASE/MASTER_INDEX.md${NC}"
echo -e "  🗺️ Component Map: ${BOLD}$TARGET_BASE/COMPONENT_MAP.md${NC}"
echo -e "  💼 Phase 2.16: ${BOLD}$TARGET_BASE/reference/phase-implementations/phase2.16/${NC}"

echo -e "\n${YELLOW}${BOLD}⚡ Critical Next Steps:${NC}"
echo -e "  1. Review ${GREEN}MASTER_INDEX.md${NC} for navigation"
echo -e "  2. Study ${GREEN}phase2.16${NC} for CLIENT dashboard patterns"
echo -e "  3. Extract Docker config from ${GREEN}scip-range${NC}"
echo -e "  4. Begin Phase 1 implementation"

echo -e "\n${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}🎉 SCIP v3 is ready for development!${NC}"
echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
