import React, { useState, useEffect } from 'react'
import {
  X,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Clock,
  User,
  Mail,
  Twitter,
  Globe,
  Shield,
  ExternalLink,
  Heart,
  Repeat,
  Share
} from 'lucide-react'
import { InjectionMessage } from '../../services/mqttClient'

interface InjectedMediaCardProps {
  injection: InjectionMessage
  onAcknowledge?: (injectionId: string) => void
  onDismiss?: (injectionId: string) => void
  onVisibilityToggle?: (injectionId: string, visible: boolean) => void
  className?: string
}

const InjectedMediaCard: React.FC<InjectedMediaCardProps> = ({
  injection,
  onAcknowledge,
  onDismiss,
  onVisibilityToggle,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    // Auto-remove timer if specified
    if (injection.metadata.auto_remove && injection.metadata.duration) {
      const injectionTime = new Date(injection.timestamp).getTime()
      const now = Date.now()
      const elapsed = now - injectionTime
      const remaining = injection.metadata.duration - elapsed

      if (remaining > 0) {
        setTimeLeft(Math.ceil(remaining / 1000))

        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev && prev <= 1) {
              onDismiss?.(injection.injection_id)
              return null
            }
            return prev ? prev - 1 : null
          })
        }, 1000)

        return () => clearInterval(timer)
      } else {
        // Already expired
        onDismiss?.(injection.injection_id)
      }
    }
  }, [injection, onDismiss])

  const handleVisibilityToggle = () => {
    const newVisibility = !isVisible
    setIsVisible(newVisibility)
    onVisibilityToggle?.(injection.injection_id, newVisibility)
  }

  const handleAcknowledge = () => {
    onAcknowledge?.(injection.injection_id)
  }

  const handleDismiss = () => {
    onDismiss?.(injection.injection_id)
  }

  const getTypeIcon = () => {
    switch (injection.type) {
      case 'email':
        return <Mail className="h-5 w-5" />
      case 'twitter':
        return <Twitter className="h-5 w-5" />
      case 'news':
        return <Globe className="h-5 w-5" />
      case 'alert':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  const getTypeColor = () => {
    switch (injection.type) {
      case 'email':
        return 'text-blue-600 bg-blue-100'
      case 'twitter':
        return 'text-cyan-600 bg-cyan-100'
      case 'news':
        return 'text-green-600 bg-green-100'
      case 'alert':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = () => {
    switch (injection.content.priority) {
      case 'critical':
        return 'border-red-500 bg-red-50'
      case 'high':
        return 'border-orange-500 bg-orange-50'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-300 bg-white'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  if (!isVisible) {
    return (
      <div className={`p-2 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Hidden injection</span>
          <button
            onClick={handleVisibilityToggle}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`border-2 rounded-lg p-4 ${getPriorityColor()} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{injection.content.title}</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{injection.content.source}</span>
              <span>•</span>
              <span>{formatTime(injection.timestamp)}</span>
              {injection.content.priority && (
                <>
                  <span>•</span>
                  <span className="capitalize font-medium">{injection.content.priority}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {timeLeft && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{timeLeft}s</span>
            </div>
          )}
          <button
            onClick={handleVisibilityToggle}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <EyeOff className="h-4 w-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <div className={`text-gray-700 ${!isExpanded && injection.content.content.length > 200 ? 'line-clamp-3' : ''}`}>
          {injection.content.content}
        </div>
        {injection.content.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm mt-1"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Media Content */}
      {injection.content.image_url && (
        <div className="mb-3">
          <img
            src={injection.content.image_url}
            alt="Injection media"
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      )}

      {/* Twitter-specific content */}
      {injection.type === 'twitter' && (
        <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {injection.content.username && (
              <span className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>@{injection.content.username}</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {injection.content.likes !== undefined && (
              <span className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{injection.content.likes}</span>
              </span>
            )}
            {injection.content.retweets !== undefined && (
              <span className="flex items-center space-x-1">
                <Repeat className="h-4 w-4" />
                <span>{injection.content.retweets}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Email-specific content */}
      {injection.type === 'email' && (
        <div className="mb-3 text-sm text-gray-600">
          {injection.content.sender && (
            <div className="mb-1">
              <strong>From:</strong> {injection.content.sender}
            </div>
          )}
          {injection.content.recipient && (
            <div className="mb-1">
              <strong>To:</strong> {injection.content.recipient}
            </div>
          )}
          {injection.content.subject && (
            <div className="mb-1">
              <strong>Subject:</strong> {injection.content.subject}
            </div>
          )}
          {injection.content.attachments && injection.content.attachments.length > 0 && (
            <div className="mb-1">
              <strong>Attachments:</strong> {injection.content.attachments.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>ID: {injection.injection_id.substring(0, 8)}...</span>
            {injection.metadata.classification && (
              <span className="px-2 py-1 bg-gray-200 rounded">
                {injection.metadata.classification}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {injection.content.video_url && (
              <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                <ExternalLink className="h-3 w-3" />
                <span>Video</span>
              </button>
            )}
            <button
              onClick={handleAcknowledge}
              className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              <Check className="h-3 w-3" />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InjectedMediaCard