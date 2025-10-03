import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Shield,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  BellOff,
  Zap,
  Eye,
  EyeOff,
  Archive,
  Filter
} from 'lucide-react'
import { InjectionMessage, mqttClient } from '../../services/mqttClient'
import InjectedMediaCard from './InjectedMediaCard'

interface Alert {
  id: string
  title: string
  message: string
  type: 'critical' | 'warning' | 'info' | 'success'
  priority: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  source: string
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  category: string
  actions?: string[]
  isInjection?: boolean
  injectionId?: string
}

interface AlertSystemProps {
  exerciseId: string
  teamId: string
  className?: string
}

const AlertSystem: React.FC<AlertSystemProps> = ({ exerciseId, teamId, className = '' }) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [injections, setInjections] = useState<InjectionMessage[]>([])
  const [showInjections, setShowInjections] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Mock baseline alerts
  const mockAlerts: Alert[] = [
    {
      id: '1',
      title: 'Multiple Failed Login Attempts Detected',
      message: 'Unusual login pattern detected from IP address 192.168.1.100. 15 failed attempts in the last 5 minutes.',
      type: 'warning',
      priority: 'high',
      timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
      source: 'Security Monitor',
      status: 'active',
      category: 'Authentication',
      actions: ['Block IP', 'Investigate', 'Ignore']
    },
    {
      id: '2',
      title: 'Malware Signature Detected',
      message: 'Trojan.Win32.Malware detected in file system. File quarantined automatically.',
      type: 'critical',
      priority: 'critical',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      source: 'Antivirus Engine',
      status: 'acknowledged',
      category: 'Malware',
      actions: ['Full Scan', 'Isolate System', 'Report Incident']
    },
    {
      id: '3',
      title: 'System Updates Available',
      message: '12 critical security updates are available for installation. Recommend immediate deployment.',
      type: 'info',
      priority: 'medium',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      source: 'Update Manager',
      status: 'active',
      category: 'Maintenance',
      actions: ['Install Now', 'Schedule', 'Review Updates']
    },
    {
      id: '4',
      title: 'Backup Completed Successfully',
      message: 'Daily system backup completed without errors. All critical data secured.',
      type: 'success',
      priority: 'low',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      source: 'Backup Service',
      status: 'resolved',
      category: 'Backup'
    }
  ]

  useEffect(() => {
    // Initialize with mock alerts
    setAlerts(mockAlerts)

    // Subscribe to injections
    mqttClient.onInjectionReceived((injection) => {
      if (injection.type === 'alert' && injection.team_id === teamId) {
        setInjections(prev => [injection, ...prev])

        // Play alert sound if enabled
        if (soundEnabled) {
          playAlertSound(injection.content.priority)
        }

        // Also add as an alert
        const alert: Alert = {
          id: injection.injection_id,
          title: injection.content.title,
          message: injection.content.content,
          type: mapPriorityToType(injection.content.priority || 'medium'),
          priority: injection.content.priority || 'medium',
          timestamp: injection.timestamp,
          source: injection.content.source,
          status: 'active',
          category: injection.content.alert_type || 'Security',
          isInjection: true,
          injectionId: injection.injection_id
        }

        setAlerts(prev => [alert, ...prev])
      }
    })

    // Subscribe to alert injections
    mqttClient.subscribeToInjections(exerciseId, teamId)
  }, [exerciseId, teamId, soundEnabled])

  const mapPriorityToType = (priority: string): Alert['type'] => {
    switch (priority) {
      case 'critical': return 'critical'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'info'
    }
  }

  const playAlertSound = (priority?: string) => {
    // Play different sounds based on priority
    const audio = new Audio()
    switch (priority) {
      case 'critical':
        audio.src = '/sounds/critical-alert.mp3'
        break
      case 'high':
        audio.src = '/sounds/warning-alert.mp3'
        break
      default:
        audio.src = '/sounds/notification.mp3'
    }
    audio.play().catch(() => {
      // Sound play failed, ignore silently
    })
  }

  const handleAcknowledge = (injectionId: string) => {
    mqttClient.acknowledgeInjection(injectionId, teamId, exerciseId)
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
  }

  const handleDismiss = (injectionId: string) => {
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
    setAlerts(prev => prev.filter(alert => alert.injectionId !== injectionId))
  }

  const handleAlertAction = (alertId: string, action: string, newStatus?: Alert['status']) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: newStatus || 'acknowledged' }
          : alert
      )
    )

    // If this is an injection alert, also acknowledge it
    const alert = alerts.find(a => a.id === alertId)
    if (alert?.isInjection && alert.injectionId) {
      handleAcknowledge(alert.injectionId)
    }
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  const getAlertColor = (type: Alert['type'], status: Alert['status']) => {
    const baseColor = {
      critical: 'border-red-500 bg-red-50 text-red-700',
      warning: 'border-orange-500 bg-orange-50 text-orange-700',
      info: 'border-blue-500 bg-blue-50 text-blue-700',
      success: 'border-green-500 bg-green-50 text-green-700'
    }[type]

    if (status === 'acknowledged' || status === 'resolved') {
      return baseColor.replace('50', '25').replace('700', '500')
    }

    return baseColor
  }

  const getPriorityBadge = (priority: Alert['priority']) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    }

    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${colors[priority]}`}>
        {priority}
      </span>
    )
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false
    if (filterPriority !== 'all' && alert.priority !== filterPriority) return false
    return true
  })

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length
  const criticalAlertsCount = alerts.filter(a => a.priority === 'critical' && a.status === 'active').length

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Security Alerts</h2>
            {criticalAlertsCount > 0 && (
              <span className="px-2 py-1 bg-red-600 text-white text-sm font-bold rounded-full">
                {criticalAlertsCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {injections.length > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{injections.length}</span>
              </div>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowInjections(!showInjections)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                showInjections
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {showInjections ? 'Hide' : 'Show'} Injections
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{activeAlertsCount}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.status === 'acknowledged').length}
            </div>
            <div className="text-xs text-gray-500">Acknowledged</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.status === 'resolved').length}
            </div>
            <div className="text-xs text-gray-500">Resolved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {alerts.filter(a => a.status === 'dismissed').length}
            </div>
            <div className="text-xs text-gray-500">Dismissed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Injection Messages */}
      {showInjections && injections.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Active Alert Injections</h3>
          <div className="space-y-2">
            {injections.map((injection) => (
              <InjectedMediaCard
                key={injection.injection_id}
                injection={injection}
                onAcknowledge={handleAcknowledge}
                onDismiss={handleDismiss}
                className="text-sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 border-b border-gray-100 ${getAlertColor(alert.type, alert.status)} ${
              alert.isInjection ? 'border-l-4 border-blue-400' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    {alert.isInjection && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        INJECTION
                      </span>
                    )}
                    {getPriorityBadge(alert.priority)}
                  </div>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{alert.source}</span>
                    <span>•</span>
                    <span>{alert.category}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end space-y-2 ml-4">
                <div className={`px-2 py-1 text-xs rounded-full ${
                  alert.status === 'active'
                    ? 'bg-red-100 text-red-700'
                    : alert.status === 'acknowledged'
                    ? 'bg-orange-100 text-orange-700'
                    : alert.status === 'resolved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {alert.status.toUpperCase()}
                </div>

                {alert.status === 'active' && (
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleAlertAction(alert.id, 'acknowledge', 'acknowledged')}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleAlertAction(alert.id, 'resolve', 'resolved')}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleAlertAction(alert.id, 'dismiss', 'dismissed')}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {alert.actions && alert.status === 'active' && (
                  <div className="flex flex-col space-y-1 mt-2">
                    {alert.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleAlertAction(alert.id, action)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAlerts.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No alerts to display</p>
          {(filterStatus !== 'all' || filterPriority !== 'all') && (
            <button
              onClick={() => {
                setFilterStatus('all')
                setFilterPriority('all')
              }}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default AlertSystem