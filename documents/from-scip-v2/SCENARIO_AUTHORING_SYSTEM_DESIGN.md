# SCIP v2 Scenario Authoring & Execution System Design Document

**Document Version:** 1.0
**Date:** September 17, 2025
**Author:** System Architecture Team
**Status:** Design Phase - Ready for Phase 3 & 4 Implementation

---

## Executive Summary

This document provides comprehensive design specifications for the SCIP v2 Scenario Authoring & Execution System, focusing on Phase 3 (UI Implementation) and Phase 4 (Injection System) of the implementation plan. The system enables instructors to visually create complex multi-team cybersecurity training scenarios with drag-and-drop timeline editing, real-time media injection, and coordinated team deployment.

---

## 1. System Architecture Overview

### 1.1 High-Level Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    SCIP v2 Scenario Authoring System             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐           │
│  │  Visual Timeline     │      │  Drag-Drop Media    │           │
│  │  Editor (React)      │◄────►│  Library (React)    │           │
│  └─────────────────────┘      └─────────────────────┘           │
│           │                             │                         │
│           ▼                             ▼                         │
│  ┌─────────────────────────────────────────────────┐             │
│  │        Scenario State Management (Redux)        │             │
│  └─────────────────────────────────────────────────┘             │
│                          │                                        │
│                          ▼                                        │
│  ┌─────────────────────────────────────────────────┐             │
│  │     Orchestration API (FastAPI + WebSocket)     │             │
│  └─────────────────────────────────────────────────┘             │
│                          │                                        │
│        ┌─────────────────┼─────────────────┐                    │
│        ▼                 ▼                 ▼                     │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐               │
│  │  Timeline   │  │    MQTT    │  │   Docker    │               │
│  │  Execution  │  │  Publisher │  │  Deployment │               │
│  │   Engine    │  │   Service  │  │   Manager   │               │
│  └────────────┘  └────────────┘  └─────────────┘               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Architecture

```mermaid
graph TB
    subgraph "Scenario Creation"
        A[Instructor] --> B[Visual Timeline Editor]
        B --> C[Injection Configuration]
        C --> D[Team Assignment]
        D --> E[Save Scenario JSON]
    end

    subgraph "Scenario Execution"
        E --> F[Load Scenario]
        F --> G[Deploy Team Containers]
        G --> H[Start Timeline Engine]
        H --> I[Execute Injections]
        I --> J[MQTT Publish]
        J --> K[Team Dashboards]
    end

    subgraph "Real-time Monitoring"
        K --> L[Status Updates]
        L --> M[Analytics Collection]
        M --> N[Exercise Dashboard]
    end
```

---

## 2. Visual Timeline Editor Architecture

### 2.1 Component Structure

```typescript
// Core Timeline Component Architecture
interface TimelineEditorProps {
  scenario: Scenario;
  teams: Team[];
  mediaLibrary: MediaFile[];
  onUpdateScenario: (scenario: Scenario) => void;
  onSaveScenario: () => void;
}

interface TimelineTrack {
  id: string;
  teamId: string;
  teamName: string;
  color: string;
  injections: TimelineInjection[];
  isExpanded: boolean;
  isLocked: boolean;
}

interface TimelineInjection {
  id: string;
  type: InjectionType;
  startTime: number;  // seconds from start
  duration: number;   // display duration in seconds
  content: InjectionContent;
  position: TimelinePosition;
  dependencies: string[];  // IDs of dependent injections
  status: InjectionStatus;
}

interface TimelinePosition {
  trackId: string;
  x: number;  // Pixel position on timeline
  y: number;  // Track vertical position
  width: number;  // Visual width based on duration
  height: number; // Standard height per track
}
```

### 2.2 Visual Timeline Editor Components

#### 2.2.1 Main Timeline Container
```typescript
const TimelineEditor: React.FC = () => {
  // State management
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [zoom, setZoom] = useState(1.0);
  const [viewportStart, setViewportStart] = useState(0);
  const [selectedInjections, setSelectedInjections] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  // Grid configuration
  const gridConfig = {
    snapToGrid: true,
    gridSize: 15, // 15-second intervals
    majorGridInterval: 60, // 1-minute major gridlines
    pixelsPerSecond: 2 * zoom,
    maxDuration: 14400 // 4 hours max
  };

  return (
    <div className="timeline-editor">
      <TimelineToolbar
        onZoom={setZoom}
        onAddTrack={addTeamTrack}
        onPlayPreview={startPreview}
      />

      <TimelineRuler
        duration={scenario.duration}
        zoom={zoom}
        viewportStart={viewportStart}
      />

      <TimelineCanvas>
        <TimelineGrid config={gridConfig} />

        {tracks.map(track => (
          <TimelineTrack
            key={track.id}
            track={track}
            onUpdateInjection={updateInjection}
            onDeleteInjection={deleteInjection}
          />
        ))}

        <DragLayer
          isDragging={isDragging}
          preview={dragPreview}
        />
      </TimelineCanvas>

      <TimelinePlayhead
        currentTime={playbackTime}
        isPlaying={isPlaying}
      />
    </div>
  );
};
```

#### 2.2.2 Drag-and-Drop Injection Handler
```typescript
class InjectionDragDropManager {
  private draggedInjection: TimelineInjection | null = null;
  private dragOffset: { x: number, y: number } = { x: 0, y: 0 };
  private validDropZones: DropZone[] = [];

  handleDragStart(injection: TimelineInjection, event: DragEvent) {
    this.draggedInjection = injection;
    this.dragOffset = {
      x: event.clientX - injection.position.x,
      y: event.clientY - injection.position.y
    };

    // Calculate valid drop zones based on dependencies
    this.validDropZones = this.calculateValidDropZones(injection);

    // Visual feedback
    this.highlightDropZones();
    this.createDragPreview(injection);
  }

  handleDragOver(event: DragEvent) {
    event.preventDefault();

    if (!this.draggedInjection) return;

    const newPosition = {
      x: event.clientX - this.dragOffset.x,
      y: event.clientY - this.dragOffset.y
    };

    // Snap to grid
    const snappedPosition = this.snapToGrid(newPosition);

    // Check for conflicts
    const conflicts = this.checkTimelineConflicts(
      snappedPosition,
      this.draggedInjection
    );

    // Update preview
    this.updateDragPreview(snappedPosition, conflicts);
  }

  handleDrop(event: DragEvent, targetTrack: TimelineTrack) {
    event.preventDefault();

    if (!this.draggedInjection) return;

    const dropPosition = {
      x: event.clientX - this.dragOffset.x,
      y: event.clientY - this.dragOffset.y
    };

    const snappedPosition = this.snapToGrid(dropPosition);
    const newStartTime = this.pixelToTime(snappedPosition.x);

    // Validate drop
    if (this.isValidDrop(targetTrack, newStartTime)) {
      // Update injection
      this.updateInjection({
        ...this.draggedInjection,
        startTime: newStartTime,
        position: {
          ...this.draggedInjection.position,
          trackId: targetTrack.id,
          x: snappedPosition.x,
          y: targetTrack.y
        }
      });

      // Update dependencies if needed
      this.updateDependencies(this.draggedInjection.id, newStartTime);
    }

    this.cleanup();
  }

  private checkTimelineConflicts(
    position: Position,
    injection: TimelineInjection
  ): Conflict[] {
    const conflicts: Conflict[] = [];
    const startTime = this.pixelToTime(position.x);
    const endTime = startTime + injection.duration;

    // Check for overlaps with other injections
    this.tracks.forEach(track => {
      track.injections.forEach(existing => {
        if (existing.id === injection.id) return;

        const existingEnd = existing.startTime + existing.duration;

        if (
          (startTime >= existing.startTime && startTime < existingEnd) ||
          (endTime > existing.startTime && endTime <= existingEnd)
        ) {
          conflicts.push({
            type: 'overlap',
            injection: existing,
            message: `Conflicts with ${existing.content.title}`
          });
        }
      });
    });

    // Check dependency violations
    injection.dependencies.forEach(depId => {
      const dependency = this.findInjection(depId);
      if (dependency && startTime < dependency.startTime + dependency.duration) {
        conflicts.push({
          type: 'dependency',
          injection: dependency,
          message: `Must occur after ${dependency.content.title}`
        });
      }
    });

    return conflicts;
  }
}
```

### 2.3 Injection Configuration Forms

```typescript
interface InjectionFormProps {
  injection: TimelineInjection;
  mediaLibrary: MediaFile[];
  onSave: (injection: TimelineInjection) => void;
  onCancel: () => void;
}

const InjectionConfigurationForm: React.FC<InjectionFormProps> = ({
  injection,
  mediaLibrary,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<InjectionFormData>(
    injection || getDefaultInjection()
  );

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="injection-form">
        <h2>Configure Injection</h2>

        {/* Basic Information */}
        <FormSection title="Basic Information">
          <Select
            label="Injection Type"
            value={formData.type}
            options={[
              { value: 'media', label: 'Media Injection' },
              { value: 'alert', label: 'Security Alert' },
              { value: 'email', label: 'Email Message' },
              { value: 'news', label: 'News Update' }
            ]}
            onChange={setType}
          />

          <Select
            label="Target Platform"
            value={formData.target}
            options={getTargetOptions(formData.type)}
            onChange={setTarget}
          />

          <Select
            label="Priority"
            value={formData.priority}
            options={[
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'urgent', label: 'Urgent' }
            ]}
            onChange={setPriority}
          />
        </FormSection>

        {/* Content Configuration */}
        <FormSection title="Content">
          <Input
            label="Title"
            value={formData.content.title}
            onChange={setTitle}
            required
          />

          <TextArea
            label="Description"
            value={formData.content.description}
            onChange={setDescription}
            rows={4}
          />

          {formData.type === 'media' && (
            <MediaSelector
              label="Select Media"
              selectedMedia={formData.content.mediaId}
              mediaLibrary={mediaLibrary}
              onSelect={setMediaId}
              onUpload={openUploadDialog}
            />
          )}
        </FormSection>

        {/* Timing Configuration */}
        <FormSection title="Timing">
          <TimeInput
            label="Start Time"
            value={formData.startTime}
            onChange={setStartTime}
            format="mm:ss"
          />

          <NumberInput
            label="Display Duration (seconds)"
            value={formData.duration}
            onChange={setDuration}
            min={5}
            max={600}
          />

          <Checkbox
            label="Auto-remove after duration"
            checked={formData.autoRemove}
            onChange={setAutoRemove}
          />
        </FormSection>

        {/* Dependencies */}
        <FormSection title="Dependencies">
          <MultiSelect
            label="Must occur after"
            options={getAvailableInjections()}
            selected={formData.dependencies}
            onChange={setDependencies}
          />
        </FormSection>

        {/* Actions */}
        <div className="form-actions">
          <Button variant="primary" onClick={() => onSave(formData)}>
            Save Injection
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

---

## 3. Drag-and-Drop Media Library System

### 3.1 Media Library Architecture

```typescript
interface MediaLibraryState {
  files: MediaFile[];
  categories: MediaCategory[];
  uploadQueue: UploadQueueItem[];
  selectedFiles: string[];
  view: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'size' | 'type';
}

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  thumbnailUrl: string;
  fullUrl: string;
  metadata: MediaMetadata;
  tags: string[];
  usageCount: number;
}

interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  description?: string;
  author?: string;
}
```

### 3.2 Drag-and-Drop Upload Component

```typescript
const MediaUploadDropzone: React.FC = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate files
    const validFiles = acceptedFiles.filter(file =>
      validateFile(file, {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['image/*', 'video/*', 'application/pdf'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.pdf']
      })
    );

    // Process each file
    for (const file of validFiles) {
      const fileId = generateFileId(file);
      setProcessingFiles(prev => new Set(prev).add(fileId));

      try {
        // Generate thumbnail
        const thumbnail = await generateThumbnail(file);

        // Upload file with progress tracking
        await uploadFile(file, {
          onProgress: (progress) => {
            setUploadProgress(prev => new Map(prev).set(fileId, progress));
          },
          onComplete: (response) => {
            // Add to media library
            addToLibrary({
              id: response.id,
              filename: response.filename,
              originalName: file.name,
              mimeType: file.type,
              size: file.size,
              thumbnailUrl: response.thumbnailUrl,
              fullUrl: response.url,
              uploadedAt: new Date()
            });

            // Cleanup
            setUploadProgress(prev => {
              const next = new Map(prev);
              next.delete(fileId);
              return next;
            });
            setProcessingFiles(prev => {
              const next = new Set(prev);
              next.delete(fileId);
              return next;
            });
          },
          onError: (error) => {
            showError(`Failed to upload ${file.name}: ${error.message}`);
            // Cleanup on error
            setProcessingFiles(prev => {
              const next = new Set(prev);
              next.delete(fileId);
              return next;
            });
          }
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  }, []);

  return (
    <div className="media-upload-zone">
      <Dropzone
        onDrop={handleDrop}
        onDragEnter={() => setIsDragActive(true)}
        onDragLeave={() => setIsDragActive(false)}
        accept={{
          'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
          'video/*': ['.mp4', '.webm'],
          'application/pdf': ['.pdf']
        }}
        maxSize={50 * 1024 * 1024}
      >
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />

            <div className="dropzone-content">
              <UploadIcon size={48} />
              <h3>Drop files here or click to browse</h3>
              <p>Supports images, videos, and PDFs up to 50MB</p>
            </div>

            {/* Upload Progress */}
            {uploadProgress.size > 0 && (
              <div className="upload-progress-list">
                {Array.from(uploadProgress.entries()).map(([fileId, progress]) => (
                  <UploadProgressBar
                    key={fileId}
                    fileId={fileId}
                    progress={progress}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Dropzone>
    </div>
  );
};
```

### 3.3 Media Grid with Drag-to-Timeline

```typescript
const MediaLibraryGrid: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);

  const handleMediaDragStart = (media: MediaFile, event: DragEvent) => {
    // Set drag data for timeline
    event.dataTransfer.setData('application/scip-media', JSON.stringify({
      type: 'media',
      mediaId: media.id,
      mediaUrl: media.fullUrl,
      thumbnailUrl: media.thumbnailUrl,
      title: media.originalName,
      mimeType: media.mimeType
    }));

    // Visual feedback
    event.dataTransfer.effectAllowed = 'copy';

    // Create drag image
    const dragImage = createMediaDragImage(media);
    event.dataTransfer.setDragImage(dragImage, 50, 50);
  };

  return (
    <div className="media-library-grid">
      {/* Toolbar */}
      <MediaLibraryToolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        onViewChange={handleViewChange}
      />

      {/* Grid */}
      <div className="media-grid">
        {filteredMedia.map(media => (
          <MediaCard
            key={media.id}
            media={media}
            isSelected={selectedMedia.has(media.id)}
            draggable={true}
            onDragStart={(e) => handleMediaDragStart(media, e)}
            onClick={() => toggleSelection(media.id)}
            onDoubleClick={() => setPreviewMedia(media)}
            onDelete={() => deleteMedia(media.id)}
            onEdit={() => editMediaMetadata(media)}
          />
        ))}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <MediaPreviewModal
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
          onUseInTimeline={() => addToTimeline(previewMedia)}
        />
      )}
    </div>
  );
};
```

---

## 4. Multi-Team Deployment & Coordination System

### 4.1 Team Deployment Architecture

```typescript
interface TeamDeploymentManager {
  scenarioId: string;
  teams: TeamConfiguration[];
  deploymentStatus: Map<string, DeploymentStatus>;
  containerRegistry: Map<string, ContainerInfo>;
}

interface TeamConfiguration {
  id: string;
  name: string;
  color: string;
  dashboardTemplate: 'maritime' | 'cyber' | 'custom';
  assignedPort: number;
  injectionTimeline: InjectionTimeline;
  accessCredentials: TeamCredentials;
  customizations: DashboardCustomization;
}

interface DeploymentStatus {
  teamId: string;
  state: 'pending' | 'deploying' | 'running' | 'error' | 'stopped';
  containerId?: string;
  port?: number;
  url?: string;
  healthCheck?: HealthCheckStatus;
  logs?: string[];
}
```

### 4.2 Dynamic Team Dashboard Deployment

```python
class TeamDashboardDeployer:
    """
    Manages dynamic deployment of team dashboard containers
    """

    def __init__(self, docker_client, port_manager):
        self.docker = docker_client
        self.port_manager = port_manager
        self.deployed_containers = {}

    async def deploy_team_dashboards(
        self,
        scenario_id: str,
        teams: List[TeamConfig]
    ) -> Dict[str, DeploymentResult]:
        """
        Deploy dashboard containers for all teams
        """
        deployment_results = {}

        # Allocate ports
        port_assignments = self.port_manager.allocate_ports(
            scenario_type=scenario.type,
            team_count=len(teams)
        )

        # Deploy containers in parallel
        deployment_tasks = []
        for team, port in zip(teams, port_assignments):
            task = self._deploy_single_dashboard(
                scenario_id=scenario_id,
                team=team,
                port=port
            )
            deployment_tasks.append(task)

        # Wait for all deployments
        results = await asyncio.gather(*deployment_tasks, return_exceptions=True)

        # Process results
        for team, result in zip(teams, results):
            if isinstance(result, Exception):
                deployment_results[team.id] = DeploymentResult(
                    success=False,
                    error=str(result)
                )
            else:
                deployment_results[team.id] = result
                self.deployed_containers[team.id] = result.container_id

        return deployment_results

    async def _deploy_single_dashboard(
        self,
        scenario_id: str,
        team: TeamConfig,
        port: int
    ) -> DeploymentResult:
        """
        Deploy a single team dashboard container
        """
        # Generate container configuration
        container_config = self._generate_container_config(
            scenario_id=scenario_id,
            team=team,
            port=port
        )

        # Create and start container
        container = await self.docker.containers.create(
            image='scip-team-dashboard:latest',
            name=f'team-{team.id}-{scenario_id[:8]}',
            **container_config
        )

        await container.start()

        # Wait for health check
        health_status = await self._wait_for_health(container, timeout=30)

        if health_status.is_healthy:
            return DeploymentResult(
                success=True,
                container_id=container.id,
                port=port,
                url=f'http://localhost:{port}',
                access_token=self._generate_access_token(team.id)
            )
        else:
            raise DeploymentError(f"Container failed health check: {health_status.error}")

    def _generate_container_config(
        self,
        scenario_id: str,
        team: TeamConfig,
        port: int
    ) -> dict:
        """
        Generate Docker container configuration
        """
        return {
            'ports': {
                '80/tcp': port
            },
            'environment': {
                'SCENARIO_ID': scenario_id,
                'TEAM_ID': team.id,
                'TEAM_NAME': team.name,
                'TEAM_COLOR': team.color,
                'MQTT_BROKER': os.environ.get('MQTT_HOST', 'mqtt'),
                'MQTT_PORT': '1883',
                'MQTT_TOPIC_PREFIX': f'scip/{scenario_id}/teams/{team.id}',
                'API_BASE_URL': os.environ.get('API_BASE_URL', 'http://orchestration:8001'),
                'DASHBOARD_TEMPLATE': team.dashboard_template,
                'CUSTOM_CONFIG': json.dumps(team.customizations)
            },
            'labels': {
                'scip.scenario': scenario_id,
                'scip.team': team.id,
                'scip.type': 'team-dashboard',
                'scip.version': '2.0'
            },
            'networks': ['scip-network'],
            'restart_policy': {
                'Name': 'unless-stopped'
            },
            'healthcheck': {
                'test': ['CMD', 'curl', '-f', 'http://localhost/health'],
                'interval': '10s',
                'timeout': '5s',
                'retries': 3
            }
        }
```

### 4.3 Team Coordination Interface

```typescript
const TeamCoordinationDashboard: React.FC = () => {
  const [teams, setTeams] = useState<TeamStatus[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentMap>({});
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const handleDeployTeams = async () => {
    setDeploymentStatus(
      teams.reduce((acc, team) => ({
        ...acc,
        [team.id]: { state: 'deploying', progress: 0 }
      }), {})
    );

    try {
      const response = await deployTeamDashboards(scenario.id, teams);

      // Update deployment status
      response.deployments.forEach(deployment => {
        setDeploymentStatus(prev => ({
          ...prev,
          [deployment.teamId]: {
            state: deployment.success ? 'running' : 'error',
            containerId: deployment.containerId,
            url: deployment.url,
            error: deployment.error
          }
        }));
      });

      // Start health monitoring
      startHealthMonitoring(response.deployments);

    } catch (error) {
      showError('Failed to deploy team dashboards: ' + error.message);
    }
  };

  return (
    <div className="team-coordination-dashboard">
      <div className="deployment-controls">
        <Button
          variant="primary"
          onClick={handleDeployTeams}
          disabled={teams.length === 0}
        >
          Deploy All Teams
        </Button>

        <Button
          variant="secondary"
          onClick={handleTestConnections}
        >
          Test MQTT Connections
        </Button>
      </div>

      <div className="team-grid">
        {teams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            deployment={deploymentStatus[team.id]}
            isSelected={selectedTeam === team.id}
            onClick={() => setSelectedTeam(team.id)}
            onOpenDashboard={() => window.open(deployment.url, '_blank')}
            onRestartContainer={() => restartTeamContainer(team.id)}
            onViewLogs={() => showTeamLogs(team.id)}
          />
        ))}
      </div>

      {selectedTeam && (
        <TeamDetailPanel
          teamId={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onUpdateConfiguration={updateTeamConfig}
          onTestInjection={sendTestInjection}
        />
      )}
    </div>
  );
};
```

---

## 5. Real-Time Trigger Distribution System

### 5.1 MQTT Topic Architecture

```yaml
# Topic Hierarchy for Scenario Execution
scip/
  {scenario-id}/
    control/
      start          # Start exercise command
      pause          # Pause exercise command
      resume         # Resume exercise command
      stop           # Stop exercise command
      reset          # Reset exercise state

    status/
      global         # Overall exercise status
      timeline       # Timeline execution status
      injections     # Injection delivery status

    teams/
      {team-id}/
        injections/
          media      # Media content injections
          alerts     # Security alert injections
          news       # News feed injections
          email      # Email message injections

        responses/   # Team acknowledgments
        analytics/   # Performance metrics

    coordination/
      sync          # Time synchronization
      heartbeat     # System health checks
```

### 5.2 Timeline Execution Engine

```python
class TimelineExecutionEngine:
    """
    Manages real-time execution of scenario timeline with precise timing
    """

    def __init__(self, mqtt_publisher, scenario_store):
        self.mqtt = mqtt_publisher
        self.store = scenario_store
        self.active_timelines = {}
        self.execution_threads = {}
        self.time_sync = TimeSynchronizer()

    async def start_scenario_execution(
        self,
        scenario_id: str
    ) -> ExecutionHandle:
        """
        Start executing a scenario timeline
        """
        # Load scenario and timelines
        scenario = await self.store.load_scenario(scenario_id)
        team_timelines = await self.store.load_team_timelines(scenario_id)

        # Initialize execution context
        context = ExecutionContext(
            scenario_id=scenario_id,
            start_time=datetime.utcnow(),
            state=ExecutionState.RUNNING,
            teams=team_timelines.keys(),
            total_injections=sum(len(t.injections) for t in team_timelines.values()),
            completed_injections=0,
            failed_injections=0
        )

        self.active_timelines[scenario_id] = context

        # Start execution threads for each team
        for team_id, timeline in team_timelines.items():
            thread = asyncio.create_task(
                self._execute_team_timeline(
                    context=context,
                    team_id=team_id,
                    timeline=timeline
                )
            )
            self.execution_threads[f"{scenario_id}_{team_id}"] = thread

        # Publish start event
        await self._publish_control_event(scenario_id, 'start', context)

        return ExecutionHandle(
            scenario_id=scenario_id,
            control_channel=f'scip/{scenario_id}/control',
            status_channel=f'scip/{scenario_id}/status'
        )

    async def _execute_team_timeline(
        self,
        context: ExecutionContext,
        team_id: str,
        timeline: TeamTimeline
    ):
        """
        Execute injections for a specific team
        """
        # Sort injections by time
        sorted_injections = sorted(
            timeline.injections,
            key=lambda x: x.time_offset_seconds
        )

        for injection in sorted_injections:
            try:
                # Wait for injection time
                await self._wait_for_injection_time(
                    context=context,
                    injection=injection
                )

                # Check if still running
                if context.state != ExecutionState.RUNNING:
                    if context.state == ExecutionState.PAUSED:
                        await self._handle_pause(context)
                    elif context.state == ExecutionState.STOPPED:
                        break

                # Execute injection
                await self._execute_injection(
                    context=context,
                    team_id=team_id,
                    injection=injection
                )

                # Update progress
                context.completed_injections += 1
                await self._publish_progress(context)

            except Exception as e:
                logger.error(f"Failed to execute injection {injection.id}: {e}")
                context.failed_injections += 1
                await self._handle_injection_failure(injection, e)

    async def _execute_injection(
        self,
        context: ExecutionContext,
        team_id: str,
        injection: Injection
    ):
        """
        Execute a single injection
        """
        # Build MQTT message
        message = self._build_injection_message(
            scenario_id=context.scenario_id,
            team_id=team_id,
            injection=injection
        )

        # Determine topic
        topic = f"scip/{context.scenario_id}/teams/{team_id}/injections/{injection.target}"

        # Publish with QoS based on priority
        qos = self._get_qos_for_priority(injection.priority)

        # Track delivery
        delivery_tracker = DeliveryTracker(
            injection_id=injection.id,
            team_id=team_id,
            sent_at=datetime.utcnow()
        )

        # Publish message
        tracking_id = await self.mqtt.publish_message(
            topic=topic,
            message=message,
            qos=qos,
            retain=injection.priority == 'critical'
        )

        delivery_tracker.tracking_id = tracking_id

        # Log execution
        await self._log_injection_execution(
            injection=injection,
            tracker=delivery_tracker,
            success=True
        )

        # Update injection status
        injection.execution_status = 'completed'
        injection.executed_at = datetime.utcnow()
        await self.store.update_injection_status(injection)

    def _build_injection_message(
        self,
        scenario_id: str,
        team_id: str,
        injection: Injection
    ) -> dict:
        """
        Build MQTT message for injection
        """
        return {
            'injection_id': injection.id,
            'scenario_id': scenario_id,
            'team_id': team_id,
            'type': injection.type,
            'target': injection.target,
            'priority': injection.priority,
            'timestamp': datetime.utcnow().isoformat(),
            'content': {
                'title': injection.content.title,
                'description': injection.content.description,
                'media_url': injection.content.media_url,
                'media_type': injection.content.media_type,
                'thumbnail_url': injection.content.thumbnail_url,
                'display_duration': injection.content.display_duration,
                'requires_acknowledgment': injection.content.requires_acknowledgment
            },
            'metadata': {
                'source': 'scip-timeline-engine',
                'version': '2.0',
                'correlation_id': str(uuid.uuid4())
            }
        }
```

### 5.3 Real-Time Synchronization

```typescript
class RealTimeSynchronizer {
  private wsConnection: WebSocket;
  private clockOffset: number = 0;
  private syncInterval: NodeJS.Timer;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(private serverUrl: string) {
    this.connect();
    this.startClockSync();
  }

  private connect() {
    this.wsConnection = new WebSocket(`${this.serverUrl}/sync`);

    this.wsConnection.onopen = () => {
      console.log('Connected to sync server');
      this.requestTimeSync();
    };

    this.wsConnection.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleSyncMessage(message);
    };

    this.wsConnection.onclose = () => {
      console.log('Disconnected from sync server');
      setTimeout(() => this.connect(), 5000); // Reconnect
    };
  }

  private startClockSync() {
    // Sync clock every 30 seconds
    this.syncInterval = setInterval(() => {
      this.requestTimeSync();
    }, 30000);

    // Initial sync
    this.requestTimeSync();
  }

  private async requestTimeSync() {
    const timestamps: number[] = [];

    // Perform multiple time sync requests for accuracy
    for (let i = 0; i < 5; i++) {
      const t1 = Date.now();

      const response = await this.sendSyncRequest({
        type: 'time_sync_request',
        client_time: t1
      });

      const t4 = Date.now();
      const t2 = response.server_receive_time;
      const t3 = response.server_send_time;

      // Calculate offset using NTP algorithm
      const offset = ((t2 - t1) + (t3 - t4)) / 2;
      timestamps.push(offset);

      await sleep(100); // Small delay between requests
    }

    // Use median offset for accuracy
    this.clockOffset = median(timestamps);
    console.log(`Clock synchronized. Offset: ${this.clockOffset}ms`);
  }

  public getServerTime(): number {
    return Date.now() + this.clockOffset;
  }

  public scheduleInjection(injection: TimelineInjection, callback: () => void) {
    const serverTime = this.getServerTime();
    const injectionTime = injection.startTime * 1000; // Convert to ms
    const delay = injectionTime - serverTime;

    if (delay > 0) {
      setTimeout(() => {
        // Double-check timing before execution
        const currentServerTime = this.getServerTime();
        const drift = Math.abs(currentServerTime - injectionTime);

        if (drift < 100) { // Within 100ms tolerance
          callback();
        } else {
          console.warn(`Injection skipped due to timing drift: ${drift}ms`);
          // Reschedule if needed
          this.scheduleInjection(injection, callback);
        }
      }, delay);
    } else {
      console.warn(`Injection ${injection.id} is in the past`);
    }
  }

  public subscribeToExerciseEvents(
    scenarioId: string,
    handlers: ExerciseEventHandlers
  ) {
    const topic = `scip/${scenarioId}/status`;

    this.eventHandlers.set(topic, [
      ...this.eventHandlers.get(topic) || [],
      handlers
    ]);

    this.wsConnection.send(JSON.stringify({
      type: 'subscribe',
      topic: topic
    }));
  }

  private handleSyncMessage(message: SyncMessage) {
    switch (message.type) {
      case 'exercise_event':
        this.handleExerciseEvent(message.data);
        break;

      case 'injection_delivered':
        this.handleInjectionDelivered(message.data);
        break;

      case 'team_response':
        this.handleTeamResponse(message.data);
        break;

      case 'timeline_update':
        this.handleTimelineUpdate(message.data);
        break;
    }
  }
}
```

---

## 6. Component Integration Specifications

### 6.1 Data Flow Between Components

```mermaid
sequenceDiagram
    participant UI as Timeline Editor UI
    participant State as Redux State
    participant API as Orchestration API
    participant Engine as Execution Engine
    participant MQTT as MQTT Broker
    participant Team as Team Dashboard

    UI->>State: Create/Edit Injection
    State->>UI: Update Timeline View

    UI->>API: Save Scenario
    API->>API: Validate & Store
    API->>UI: Confirm Save

    UI->>API: Deploy Teams
    API->>API: Create Containers
    API->>Team: Deploy Dashboard
    Team->>API: Health Check OK

    UI->>API: Start Exercise
    API->>Engine: Initialize Timeline
    Engine->>Engine: Schedule Injections

    Engine->>MQTT: Publish Injection
    MQTT->>Team: Deliver Message
    Team->>Team: Display Injection

    Team->>MQTT: Send Response
    MQTT->>Engine: Receive Response
    Engine->>API: Update Analytics
    API->>UI: Update Status
```

### 6.2 State Management Architecture

```typescript
// Redux Store Structure
interface SCIPStore {
  scenario: {
    current: Scenario | null;
    isDirty: boolean;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  };

  timeline: {
    tracks: TimelineTrack[];
    selectedInjections: string[];
    playbackTime: number;
    isPlaying: boolean;
    zoom: number;
    viewport: ViewportConfig;
  };

  media: {
    library: MediaFile[];
    uploadQueue: UploadQueueItem[];
    selectedFiles: string[];
    filters: MediaFilters;
  };

  teams: {
    configurations: TeamConfiguration[];
    deploymentStatus: Map<string, DeploymentStatus>;
    healthStatus: Map<string, HealthStatus>;
  };

  exercise: {
    state: 'idle' | 'deployed' | 'running' | 'paused' | 'stopped';
    startTime: Date | null;
    elapsedTime: number;
    injectionProgress: InjectionProgress;
    analytics: ExerciseAnalytics;
  };

  websocket: {
    connected: boolean;
    subscriptions: string[];
    lastMessage: WebSocketMessage | null;
  };
}

// Action Creators
const timelineActions = {
  addInjection: (injection: TimelineInjection) => ({
    type: 'timeline/addInjection',
    payload: injection
  }),

  moveInjection: (id: string, newPosition: TimelinePosition) => ({
    type: 'timeline/moveInjection',
    payload: { id, newPosition }
  }),

  updateInjectionContent: (id: string, content: InjectionContent) => ({
    type: 'timeline/updateContent',
    payload: { id, content }
  }),

  deleteInjection: (id: string) => ({
    type: 'timeline/deleteInjection',
    payload: id
  })
};

// Selectors
const timelineSelectors = {
  getInjectionsByTeam: (state: SCIPStore, teamId: string) =>
    state.timeline.tracks
      .find(t => t.teamId === teamId)
      ?.injections || [],

  getUpcomingInjections: (state: SCIPStore, windowSeconds: number = 60) => {
    const currentTime = state.exercise.elapsedTime;
    return state.timeline.tracks
      .flatMap(track => track.injections)
      .filter(inj =>
        inj.startTime > currentTime &&
        inj.startTime <= currentTime + windowSeconds
      )
      .sort((a, b) => a.startTime - b.startTime);
  },

  getConflictingInjections: (
    state: SCIPStore,
    injection: TimelineInjection
  ) => {
    const track = state.timeline.tracks.find(
      t => t.id === injection.position.trackId
    );

    if (!track) return [];

    return track.injections.filter(existing => {
      if (existing.id === injection.id) return false;

      const existingEnd = existing.startTime + existing.duration;
      const injectionEnd = injection.startTime + injection.duration;

      return (
        (injection.startTime >= existing.startTime &&
         injection.startTime < existingEnd) ||
        (injectionEnd > existing.startTime &&
         injectionEnd <= existingEnd)
      );
    });
  }
};
```

---

## 7. Performance & Scalability Considerations

### 7.1 Performance Optimizations

```typescript
// Virtual Scrolling for Large Timelines
class VirtualizedTimeline {
  private visibleRange: { start: number; end: number };
  private renderedInjections: Set<string> = new Set();
  private injectionCache: Map<string, RenderedInjection> = new Map();

  updateViewport(scrollLeft: number, viewportWidth: number) {
    const buffer = 200; // Render buffer in pixels

    this.visibleRange = {
      start: scrollLeft - buffer,
      end: scrollLeft + viewportWidth + buffer
    };

    this.updateRenderedInjections();
  }

  private updateRenderedInjections() {
    const newRendered = new Set<string>();

    // Find injections in visible range
    this.tracks.forEach(track => {
      track.injections.forEach(injection => {
        const injectionEnd = injection.position.x + injection.position.width;

        if (
          injection.position.x <= this.visibleRange.end &&
          injectionEnd >= this.visibleRange.start
        ) {
          newRendered.add(injection.id);
        }
      });
    });

    // Update rendered set
    this.renderedInjections = newRendered;
  }

  getRenderableInjections(): RenderedInjection[] {
    return Array.from(this.renderedInjections)
      .map(id => this.injectionCache.get(id))
      .filter(Boolean);
  }
}

// Debounced Auto-Save
const useAutoSave = (scenario: Scenario, delay: number = 3000) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (scenario && scenario.isDirty) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new save timeout
      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');

        try {
          await saveScenario(scenario);
          setSaveStatus('saved');
        } catch (error) {
          setSaveStatus('error');
          console.error('Auto-save failed:', error);
        }
      }, delay);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [scenario, delay]);

  return saveStatus;
};
```

### 7.2 Scalability Architecture

```yaml
# Microservices Architecture for Scale
services:
  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - scip-client
      - orchestration

  # Multiple Client Instances
  scip-client-1:
    build: ./scip-client
    environment:
      - INSTANCE_ID=1

  scip-client-2:
    build: ./scip-client
    environment:
      - INSTANCE_ID=2

  # Orchestration Cluster
  orchestration-1:
    build: ./orchestration
    environment:
      - NODE_ID=1
      - CLUSTER_MODE=true

  orchestration-2:
    build: ./orchestration
    environment:
      - NODE_ID=2
      - CLUSTER_MODE=true

  # MQTT Cluster
  mqtt-1:
    image: eclipse-mosquitto:2
    volumes:
      - ./mosquitto-cluster.conf:/mosquitto/config/mosquitto.conf

  mqtt-2:
    image: eclipse-mosquitto:2
    volumes:
      - ./mosquitto-cluster.conf:/mosquitto/config/mosquitto.conf

  # Redis for Session & Cache
  redis:
    image: redis:alpine
    command: redis-server --appendonly yes

  # PostgreSQL for Persistent Storage
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=scip
      - POSTGRES_USER=scip
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

---

## 8. Testing Strategy

### 8.1 Component Testing

```typescript
// Timeline Editor Tests
describe('TimelineEditor', () => {
  it('should handle drag and drop of injections', async () => {
    const { getByTestId, rerender } = render(
      <TimelineEditor scenario={mockScenario} />
    );

    const injection = getByTestId('injection-1');
    const targetTrack = getByTestId('track-2');

    // Simulate drag
    fireEvent.dragStart(injection);
    fireEvent.dragOver(targetTrack);
    fireEvent.drop(targetTrack);

    // Verify injection moved
    await waitFor(() => {
      expect(injection).toHaveAttribute('data-track-id', '2');
    });
  });

  it('should prevent overlapping injections', async () => {
    const { getByTestId, queryByRole } = render(
      <TimelineEditor scenario={scenarioWithInjections} />
    );

    const injection1 = getByTestId('injection-1');
    const conflictPosition = { x: 100, y: 50 }; // Overlaps with existing

    fireEvent.dragStart(injection1);
    fireEvent.dragOver(document.body, {
      clientX: conflictPosition.x,
      clientY: conflictPosition.y
    });

    // Check for conflict warning
    expect(queryByRole('alert')).toHaveTextContent('Conflict detected');
  });
});

// MQTT Integration Tests
describe('MQTT Publisher', () => {
  let publisher: MQTTPublisherService;
  let mockBroker: MockMQTTBroker;

  beforeEach(async () => {
    mockBroker = new MockMQTTBroker();
    await mockBroker.start(1883);

    publisher = new MQTTPublisherService({
      broker_host: 'localhost',
      broker_port: 1883
    });

    await publisher.initialize();
  });

  it('should publish injections to correct topics', async () => {
    const injection = createMockInjection({
      team_id: 'blue-team',
      type: 'media'
    });

    const trackingId = await publisher.publish_message(injection);

    // Verify message received
    const received = await mockBroker.waitForMessage(
      'scip/test-scenario/teams/blue-team/injections/media'
    );

    expect(received.injection_id).toBe(injection.id);
  });

  it('should retry failed publishes with backoff', async () => {
    // Simulate network failure
    mockBroker.simulateFailure(3);

    const injection = createMockInjection({ priority: 'urgent' });
    const trackingId = await publisher.publish_message(injection);

    // Wait for retries
    await sleep(10000);

    const status = await publisher.get_publish_status(trackingId);
    expect(status.attempts.length).toBeGreaterThan(1);
    expect(status.status).toBe('confirmed');
  });
});
```

---

## 9. Security Considerations

### 9.1 Access Control

```typescript
interface SecurityPolicy {
  authentication: {
    method: 'jwt' | 'oauth2' | 'saml';
    provider: string;
    tokenExpiry: number;
  };

  authorization: {
    roles: Role[];
    permissions: Permission[];
    teamIsolation: boolean;
  };

  encryption: {
    mqttTLS: boolean;
    apiHTTPS: boolean;
    dataAtRest: boolean;
  };
}

class SecurityManager {
  validateInstructorAccess(user: User, scenario: Scenario): boolean {
    return (
      user.roles.includes('instructor') ||
      user.roles.includes('admin') ||
      scenario.owner === user.id
    );
  }

  validateTeamAccess(user: User, teamId: string): boolean {
    return (
      user.teams.includes(teamId) ||
      user.roles.includes('instructor')
    );
  }

  sanitizeInjectionContent(content: InjectionContent): InjectionContent {
    // Sanitize HTML content
    if (content.description) {
      content.description = DOMPurify.sanitize(content.description);
    }

    // Validate media URLs
    if (content.mediaUrl) {
      if (!this.isValidMediaUrl(content.mediaUrl)) {
        throw new SecurityError('Invalid media URL');
      }
    }

    return content;
  }
}
```

---

## 10. Deployment Configuration

### 10.1 Docker Compose Configuration

```yaml
version: '3.8'

networks:
  scip-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
  redis_data:
  mosquitto_data:
  media_storage:

services:
  # SCIP Client - Scenario Authoring UI
  scip-client:
    build:
      context: ./scip-client
      dockerfile: Dockerfile.prod
    ports:
      - "3001:80"
    environment:
      - API_URL=http://orchestration:8001
      - WS_URL=ws://orchestration:8001/ws
      - MQTT_WS_URL=ws://mqtt:9001
    volumes:
      - ./scenarios:/app/scenarios
      - media_storage:/app/media
    networks:
      - scip-network
    depends_on:
      - orchestration
      - mqtt

  # Orchestration Service
  orchestration:
    build: ./orchestration
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://scip:password@postgres:5432/scip
      - REDIS_URL=redis://redis:6379
      - MQTT_HOST=mqtt
      - MQTT_PORT=1883
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./scenarios:/app/scenarios
      - media_storage:/app/media
    networks:
      - scip-network
    depends_on:
      - postgres
      - redis
      - mqtt

  # MQTT Broker
  mqtt:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"  # MQTT
      - "9001:9001"  # WebSocket
    volumes:
      - ./docker/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
    networks:
      - scip-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=scip
      - POSTGRES_USER=scip
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - scip-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - scip-network

  # Team Dashboard Template
  team-dashboard-template:
    build: ./team-dashboard
    image: scip-team-dashboard:latest
    # This is just for building the image
    # Actual containers are deployed dynamically
```

---

## 11. Implementation Roadmap

### Phase 3: UI Implementation (Days 5-7)

#### Day 5: Timeline Editor Foundation
- [ ] Create React project structure for timeline editor
- [ ] Implement basic timeline grid and ruler components
- [ ] Add timeline track management for teams
- [ ] Create injection card components
- [ ] Implement zoom and pan controls

#### Day 6: Drag-and-Drop System
- [ ] Implement drag-and-drop for injections
- [ ] Add grid snapping and alignment
- [ ] Create conflict detection system
- [ ] Add dependency visualization
- [ ] Implement injection configuration forms

#### Day 7: Media Library
- [ ] Create media upload dropzone
- [ ] Implement thumbnail generation
- [ ] Add media grid view with search/filter
- [ ] Create drag-from-library-to-timeline
- [ ] Add media preview modal

### Phase 4: Injection System (Days 8-10)

#### Day 8: Timeline Execution Engine
- [ ] Create Python timeline execution service
- [ ] Implement injection scheduling system
- [ ] Add time synchronization
- [ ] Create execution state management
- [ ] Implement pause/resume functionality

#### Day 9: MQTT Integration
- [ ] Integrate existing MQTT publisher service
- [ ] Create injection message builders
- [ ] Implement topic routing system
- [ ] Add delivery tracking
- [ ] Create retry mechanisms

#### Day 10: Team Coordination
- [ ] Implement team dashboard deployment
- [ ] Create container orchestration
- [ ] Add health monitoring
- [ ] Implement real-time status updates
- [ ] Create coordination dashboard

---

## 12. Success Metrics

### Technical Metrics
- Timeline rendering performance: < 16ms frame time
- Injection delivery latency: < 500ms
- Container deployment time: < 30 seconds per team
- MQTT message delivery rate: > 99.9%
- System uptime: > 99.5%

### User Experience Metrics
- Drag-drop responsiveness: < 100ms visual feedback
- Timeline save time: < 2 seconds
- Media upload time: < 5 seconds for 10MB file
- Exercise start time: < 1 minute for 6 teams
- Real-time update latency: < 1 second

---

## Conclusion

This design document provides a comprehensive architecture for the SCIP v2 Scenario Authoring & Execution System. The design emphasizes:

1. **Intuitive Visual Authoring**: Drag-and-drop timeline editing with real-time preview
2. **Scalable Team Deployment**: Dynamic container orchestration for multi-team scenarios
3. **Reliable Message Delivery**: Enterprise-grade MQTT distribution with retry mechanisms
4. **Real-time Coordination**: WebSocket-based synchronization and monitoring
5. **Performance Optimization**: Virtual scrolling, debouncing, and efficient rendering

The system is designed to be modular, scalable, and maintainable, with clear separation of concerns and well-defined interfaces between components. The implementation roadmap provides a clear path forward for Phase 3 and Phase 4 development.

---

**Document Status**: Complete and ready for implementation review