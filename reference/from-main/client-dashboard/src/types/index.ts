/**
 * Client Dashboard Type Definitions
 * Comprehensive types for the SCIP v2 client dashboard application
 */

// ============================================================================
// User and Authentication Types
// ============================================================================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  organizationId: string
  permissions: Permission[]
  lastLogin?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  OBSERVER = 'observer',
  PARTICIPANT = 'participant'
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface Organization {
  id: string
  name: string
  domain: string
  branding: OrganizationBranding
  settings: OrganizationSettings
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationBranding {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string
  fontFamily?: string
  customCss?: string
}

export interface OrganizationSettings {
  allowScenarioCreation: boolean
  allowScenarioSharing: boolean
  maxConcurrentExercises: number
  maxParticipantsPerExercise: number
  retentionDays: number
}

// ============================================================================
// Scenario Management Types
// ============================================================================

export interface Scenario {
  id: string
  name: string
  description: string
  category: string
  difficulty: ScenarioDifficulty
  estimatedDuration: number // minutes
  thumbnailUrl?: string
  tags: string[]
  isTemplate: boolean
  isPublic: boolean
  organizationId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  version: number
  status: ScenarioStatus
  triggers: ScenarioTrigger[]
  teams: TeamConfiguration[]
  assets: MediaAsset[]
  permissions: ScenarioPermission[]
}

export enum ScenarioDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum ScenarioStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  ARCHIVED = 'archived'
}

export interface ScenarioTrigger {
  id: string
  scenarioId: string
  name: string
  type: TriggerType
  timeOffset: number // seconds from exercise start
  targetTeams: string[] // team IDs or 'all'
  content: TriggerContent
  conditions?: TriggerCondition[]
  isActive: boolean
  order: number
}

export enum TriggerType {
  NEWS = 'news',
  SOCIAL = 'social',
  EMAIL = 'email',
  DOCUMENT = 'document',
  ALERT = 'alert',
  DECISION = 'decision',
  SYSTEM = 'system'
}

export interface TriggerContent {
  type: TriggerType
  title: string
  body: string
  metadata?: Record<string, unknown>
  assets?: string[] // asset IDs
  priority: MessagePriority
  classification?: string
}

export enum MessagePriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  FLASH = 'flash',
  CRITICAL = 'critical'
}

export interface TriggerCondition {
  type: 'decision_made' | 'time_elapsed' | 'team_status'
  parameters: Record<string, unknown>
}

export interface TeamConfiguration {
  id: string
  name: string
  color: string
  maxParticipants: number
  description?: string
  permissions: string[]
  customSettings?: Record<string, unknown>
}

export interface MediaAsset {
  id: string
  scenarioId: string
  name: string
  type: AssetType
  fileUrl: string
  thumbnailUrl?: string
  fileSize: number
  mimeType: string
  classification?: string
  uploadedBy: string
  uploadedAt: Date
  isPublic: boolean
}

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other'
}

export interface ScenarioPermission {
  userId: string
  role: 'viewer' | 'editor' | 'admin'
  grantedAt: Date
  grantedBy: string
}

// ============================================================================
// Exercise Management Types
// ============================================================================

export interface Exercise {
  id: string
  name: string
  description?: string
  scenarioId: string
  scenario?: Scenario
  organizationId: string
  status: ExerciseStatus
  phase: ExercisePhase
  scheduledStart?: Date
  actualStart?: Date
  actualEnd?: Date
  estimatedDuration: number
  actualDuration?: number
  participants: ExerciseParticipant[]
  teams: ExerciseTeam[]
  configuration: ExerciseConfiguration
  state: ExerciseState
  metrics: ExerciseMetrics
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export enum ExerciseStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ExercisePhase {
  PREPARATION = 'preparation',
  BRIEFING = 'briefing',
  EXECUTION = 'execution',
  DEBRIEF = 'debrief',
  WRAP_UP = 'wrap_up'
}

export interface ExerciseParticipant {
  id: string
  userId: string
  user?: User
  teamId: string
  role: ParticipantRole
  joinedAt?: Date
  leftAt?: Date
  isActive: boolean
  connectionStatus: ConnectionStatus
  lastActivity?: Date
}

export enum ParticipantRole {
  TEAM_LEADER = 'team_leader',
  MEMBER = 'member',
  OBSERVER = 'observer'
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting'
}

export interface ExerciseTeam {
  id: string
  exerciseId: string
  name: string
  color: string
  dashboardUrl?: string
  accessCode?: string
  participants: ExerciseParticipant[]
  status: TeamStatus
  metrics: TeamMetrics
}

export enum TeamStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETE = 'complete',
  DISCONNECTED = 'disconnected'
}

export interface ExerciseConfiguration {
  timeZone: string
  allowLateJoin: boolean
  recordSession: boolean
  enableChat: boolean
  autoAdvancePhases: boolean
  pauseOnDisconnect: boolean
  maxReconnectAttempts: number
  customSettings?: Record<string, unknown>
}

export interface ExerciseState {
  currentTriggerIndex: number
  nextTrigger?: ScenarioTrigger
  deliveredTriggers: string[] // trigger IDs
  pendingDecisions: DecisionPoint[]
  teamStates: Record<string, TeamState>
  timeline: TimelineEvent[]
}

export interface TeamState {
  teamId: string
  connectionStatus: ConnectionStatus
  lastActivity: Date
  receivedTriggers: string[]
  completedDecisions: string[]
  currentDecision?: string
}

export interface TimelineEvent {
  id: string
  timestamp: Date
  type: 'trigger_sent' | 'decision_made' | 'team_joined' | 'team_left' | 'phase_change' | 'exercise_paused' | 'exercise_resumed'
  data: Record<string, unknown>
  teamId?: string
  triggerId?: string
}

// ============================================================================
// Decision Management Types
// ============================================================================

export interface DecisionPoint {
  id: string
  exerciseId: string
  triggerId: string
  title: string
  question: string
  description?: string
  options: DecisionOption[]
  timeLimit: number // seconds
  targetTeams: string[]
  allowMultiple: boolean
  requiresRationale: boolean
  confidenceScale: boolean
  isActive: boolean
  responses: DecisionResponse[]
  createdAt: Date
  expiresAt: Date
}

export interface DecisionOption {
  id: string
  text: string
  description?: string
  value: string | number
  icon?: string
  color?: string
  consequences?: string[]
}

export interface DecisionResponse {
  id: string
  decisionId: string
  teamId: string
  participantId: string
  selectedOptions: string[]
  rationale?: string
  confidence?: number // 0-100
  responseTime: number // milliseconds
  submittedAt: Date
}

// ============================================================================
// Monitoring and Metrics Types
// ============================================================================

export interface ExerciseMetrics {
  participantCount: number
  teamCount: number
  triggersDelivered: number
  decisionsRequired: number
  decisionsCompleted: number
  averageResponseTime: number
  connectionUptime: number
  startTime?: Date
  endTime?: Date
  duration: number
}

export interface TeamMetrics {
  participantCount: number
  connectionUptime: number
  triggersReceived: number
  decisionsCompleted: number
  averageResponseTime: number
  lastActivity: Date
}

export interface SystemMetrics {
  cpu: number
  memory: number
  storage: number
  networkLatency: number
  mqttConnections: number
  activeExercises: number
  activeDashboards: number
  timestamp: Date
}

// ============================================================================
// Real-time Monitoring Types
// ============================================================================

export interface MonitoringData {
  exerciseId: string
  timestamp: Date
  exercise: Exercise
  teams: ExerciseTeam[]
  metrics: ExerciseMetrics
  systemHealth: SystemHealth
  alerts: MonitoringAlert[]
}

export interface SystemHealth {
  overall: HealthStatus
  components: {
    database: HealthStatus
    mqtt: HealthStatus
    redis: HealthStatus
    storage: HealthStatus
  }
  metrics: SystemMetrics
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  DOWN = 'down'
}

export interface MonitoringAlert {
  id: string
  level: AlertLevel
  title: string
  message: string
  component?: string
  timestamp: Date
  acknowledged: boolean
  acknowledgedBy?: string
  resolvedAt?: Date
}

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  timestamp: Date
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  category?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  tags?: string[]
}

// ============================================================================
// UI State Types
// ============================================================================

export interface DashboardState {
  selectedExercise: string | null
  sidebarCollapsed: boolean
  activeModal: string | null
  notifications: Notification[]
  loading: Record<string, boolean>
  errors: Record<string, string>
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
  createdAt: Date
}

export interface NotificationAction {
  id: string
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// ============================================================================
// Form Types
// ============================================================================

export interface ScenarioFormData {
  name: string
  description: string
  category: string
  difficulty: ScenarioDifficulty
  estimatedDuration: number
  tags: string[]
  isPublic: boolean
  teams: TeamConfiguration[]
}

export interface ExerciseFormData {
  name: string
  description?: string
  scenarioId: string
  scheduledStart?: Date
  configuration: ExerciseConfiguration
  teams: {
    teamId: string
    participants: string[]
  }[]
}

export interface TriggerFormData {
  name: string
  type: TriggerType
  timeOffset: number
  targetTeams: string[]
  content: TriggerContent
  conditions?: TriggerCondition[]
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Global type declarations
declare global {
  interface Window {
    __SCIP_CONFIG__?: {
      apiUrl: string
      wsUrl: string
      mqttUrl: string
      organization: Organization
    }
  }
}