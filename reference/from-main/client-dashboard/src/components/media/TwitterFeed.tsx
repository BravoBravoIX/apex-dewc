import React, { useState, useEffect } from 'react'
import {
  Twitter,
  Heart,
  Repeat,
  Share,
  MessageCircle,
  MoreVertical,
  Verified,
  Clock,
  Zap
} from 'lucide-react'
import { InjectionMessage, mqttClient } from '../../services/mqttClient'
import InjectedMediaCard from './InjectedMediaCard'

interface Tweet {
  id: string
  username: string
  handle: string
  verified?: boolean
  content: string
  timestamp: string
  likes: number
  retweets: number
  replies: number
  image_url?: string
  video_url?: string
  isInjection?: boolean
  injectionId?: string
}

interface TwitterFeedProps {
  exerciseId: string
  teamId: string
  className?: string
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ exerciseId, teamId, className = '' }) => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [injections, setInjections] = useState<InjectionMessage[]>([])
  const [showInjections, setShowInjections] = useState(true)

  // Mock baseline tweets
  const mockTweets: Tweet[] = [
    {
      id: '1',
      username: 'cybersecurity_news',
      handle: 'cybersec_news',
      verified: true,
      content: 'Breaking: New vulnerability discovered in popular web framework. Details and patches being coordinated with vendors. #cybersecurity #infosec',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      likes: 247,
      retweets: 89,
      replies: 23
    },
    {
      id: '2',
      username: 'john_security',
      handle: 'john_sec',
      content: 'Just completed our quarterly security audit. Key findings: 95% of vulnerabilities were from unpatched systems. Patch management is critical! 🔒',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      likes: 156,
      retweets: 45,
      replies: 12,
      image_url: '/api/placeholder/400/200'
    },
    {
      id: '3',
      username: 'tech_daily',
      handle: 'tech_daily',
      verified: true,
      content: 'Industry report: 60% increase in ransomware attacks this quarter. Organizations urged to enhance backup strategies and employee training.',
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      likes: 324,
      retweets: 178,
      replies: 67
    },
    {
      id: '4',
      username: 'security_sarah',
      handle: 'sec_sarah',
      content: 'Friendly reminder: Enable 2FA on all your accounts! 📱🔐 It only takes a few minutes but can save you from a world of trouble. #Security101',
      timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
      likes: 89,
      retweets: 34,
      replies: 8
    }
  ]

  useEffect(() => {
    // Initialize with mock tweets
    setTweets(mockTweets)

    // Subscribe to injections
    mqttClient.onInjectionReceived((injection) => {
      if (injection.type === 'twitter' && injection.team_id === teamId) {
        setInjections(prev => [injection, ...prev])

        // Also add as a tweet if it has the required properties
        if (injection.content.username) {
          const tweet: Tweet = {
            id: injection.injection_id,
            username: injection.content.username,
            handle: injection.content.handle || injection.content.username,
            verified: false,
            content: injection.content.content,
            timestamp: injection.timestamp,
            likes: injection.content.likes || 0,
            retweets: injection.content.retweets || 0,
            replies: 0,
            image_url: injection.content.image_url,
            video_url: injection.content.video_url,
            isInjection: true,
            injectionId: injection.injection_id
          }

          setTweets(prev => [tweet, ...prev])
        }
      }
    })

    // Subscribe to Twitter injections
    mqttClient.subscribeToInjections(exerciseId, teamId)
  }, [exerciseId, teamId])

  const handleLike = (tweetId: string) => {
    setTweets(prev =>
      prev.map(tweet =>
        tweet.id === tweetId
          ? { ...tweet, likes: tweet.likes + 1 }
          : tweet
      )
    )
  }

  const handleRetweet = (tweetId: string) => {
    setTweets(prev =>
      prev.map(tweet =>
        tweet.id === tweetId
          ? { ...tweet, retweets: tweet.retweets + 1 }
          : tweet
      )
    )
  }

  const handleAcknowledge = (injectionId: string) => {
    mqttClient.acknowledgeInjection(injectionId, teamId, exerciseId)
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
  }

  const handleDismiss = (injectionId: string) => {
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
    setTweets(prev => prev.filter(tweet => tweet.injectionId !== injectionId))
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Twitter className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900">Twitter Feed</h2>
          </div>
          <div className="flex items-center space-x-2">
            {injections.length > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{injections.length}</span>
              </div>
            )}
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
      </div>

      {/* Injection Messages */}
      {showInjections && injections.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-yellow-50">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Active Injections</h3>
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

      {/* Tweet Feed */}
      <div className="max-h-96 overflow-y-auto">
        {tweets.map((tweet) => (
          <div
            key={tweet.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              tweet.isInjection ? 'bg-blue-50 border-l-4 border-blue-400' : ''
            }`}
          >
            <div className="flex space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {tweet.username[0].toUpperCase()}
                </div>
              </div>

              {/* Tweet Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center space-x-1 mb-1">
                  <span className="font-bold text-gray-900">{tweet.username}</span>
                  {tweet.verified && (
                    <Verified className="h-4 w-4 text-blue-500 fill-current" />
                  )}
                  <span className="text-gray-500">@{tweet.handle}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500">{formatTime(tweet.timestamp)}</span>
                  {tweet.isInjection && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      INJECTION
                    </span>
                  )}
                </div>

                {/* Tweet Text */}
                <div className="text-gray-900 mb-2">{tweet.content}</div>

                {/* Media */}
                {tweet.image_url && (
                  <div className="mb-2">
                    <img
                      src={tweet.image_url}
                      alt="Tweet media"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between max-w-md pt-2">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{tweet.replies}</span>
                  </button>

                  <button
                    onClick={() => handleRetweet(tweet.id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors"
                  >
                    <Repeat className="h-4 w-4" />
                    <span className="text-sm">{tweet.retweets}</span>
                  </button>

                  <button
                    onClick={() => handleLike(tweet.id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{tweet.likes}</span>
                  </button>

                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <Share className="h-4 w-4" />
                  </button>

                  <button className="text-gray-500 hover:text-gray-700 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tweets.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Twitter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No tweets to display</p>
        </div>
      )}
    </div>
  )
}

export default TwitterFeed