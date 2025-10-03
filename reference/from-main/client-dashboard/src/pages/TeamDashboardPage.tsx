import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Users, Settings, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react'
import { mqttClient } from '../services/mqttClient'
import TwitterFeed from '../components/media/TwitterFeed'
import NewsFeed from '../components/media/NewsFeed'
import AlertSystem from '../components/media/AlertSystem'
import EmailInbox from '../components/media/EmailInbox'

const TeamDashboardPage: React.FC = () => {
  const { teamId = 'team1', exerciseId = 'exercise1' } = useParams<{
    teamId?: string
    exerciseId?: string
  }>()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(true)
  const [visibleComponents, setVisibleComponents] = useState({
    alerts: true,
    email: true,
    twitter: true,
    news: true
  })

  useEffect(() => {
    // Initialize MQTT connection
    const initializeConnection = async () => {
      try {
        await mqttClient.connect()
        setIsConnected(true)
        setConnectionError(null)

        // Subscribe to all injection types for this team
        mqttClient.subscribeToInjections(exerciseId, teamId)

        console.log(`Connected to MQTT and subscribed to injections for team ${teamId}, exercise ${exerciseId}`)
      } catch (error) {
        console.error('Failed to connect to MQTT:', error)
        setConnectionError('Failed to connect to exercise server')
        setIsConnected(false)
      }
    }

    // Monitor connection status
    mqttClient.onConnectionChange((connected) => {
      setIsConnected(connected)
      if (!connected) {
        setConnectionError('Connection lost')
      } else {
        setConnectionError(null)
      }
    })

    initializeConnection()

    // Cleanup on unmount
    return () => {
      mqttClient.disconnect()
    }
  }, [teamId, exerciseId])

  const toggleComponent = (component: keyof typeof visibleComponents) => {
    setVisibleComponents(prev => ({
      ...prev,
      [component]: !prev[component]
    }))
  }

  const toggleAllComponents = () => {
    const newState = !showAll
    setShowAll(newState)
    setVisibleComponents({
      alerts: newState,
      email: newState,
      twitter: newState,
      news: newState
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Team Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Team Dashboard</h1>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Team:</span> {teamId} |
                <span className="font-medium ml-2">Exercise:</span> {exerciseId}
              </div>
            </div>

            {/* Connection Status & Controls */}
            <div className="flex items-center space-x-4">
              {/* Component Visibility Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleAllComponents}
                  className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                    showAll ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {showAll ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span>{showAll ? 'Hide All' : 'Show All'}</span>
                </button>

                <div className="flex space-x-1">
                  <button
                    onClick={() => toggleComponent('alerts')}
                    className={`px-2 py-1 text-xs rounded ${
                      visibleComponents.alerts ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    Alerts
                  </button>
                  <button
                    onClick={() => toggleComponent('email')}
                    className={`px-2 py-1 text-xs rounded ${
                      visibleComponents.email ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => toggleComponent('twitter')}
                    className={`px-2 py-1 text-xs rounded ${
                      visibleComponents.twitter ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    Twitter
                  </button>
                  <button
                    onClick={() => toggleComponent('news')}
                    className={`px-2 py-1 text-xs rounded ${
                      visibleComponents.news ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    News
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <WifiOff className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{connectionError}</p>
              <button
                onClick={() => mqttClient.connect()}
                className="mt-1 text-sm text-red-700 underline hover:text-red-900"
              >
                Retry connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Alert System */}
            {visibleComponents.alerts && (
              <AlertSystem
                exerciseId={exerciseId}
                teamId={teamId}
                className="h-[600px]"
              />
            )}

            {/* Twitter Feed */}
            {visibleComponents.twitter && (
              <TwitterFeed
                exerciseId={exerciseId}
                teamId={teamId}
                className="h-[600px]"
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Email Inbox */}
            {visibleComponents.email && (
              <EmailInbox
                exerciseId={exerciseId}
                teamId={teamId}
                className="h-[600px]"
              />
            )}

            {/* News Feed */}
            {visibleComponents.news && (
              <NewsFeed
                exerciseId={exerciseId}
                teamId={teamId}
                className="h-[600px]"
              />
            )}
          </div>
        </div>

        {/* No Components Visible */}
        {!Object.values(visibleComponents).some(v => v) && (
          <div className="text-center py-16">
            <EyeOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All components hidden</h3>
            <p className="text-gray-600 mb-4">
              Use the visibility controls in the header to show individual components or click "Show All" to display everything.
            </p>
            <button
              onClick={toggleAllComponents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Show All Components
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              SCIP v2 Team Dashboard | Connected to Exercise: {exerciseId}
            </div>
            <div className="flex items-center space-x-4">
              <span>Last update: {new Date().toLocaleTimeString()}</span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TeamDashboardPage