import React, { useState, useEffect } from 'react'
import {
  Globe,
  Clock,
  ExternalLink,
  Bookmark,
  Share2,
  Zap,
  TrendingUp,
  Eye,
  AlertCircle
} from 'lucide-react'
import { InjectionMessage, mqttClient } from '../../services/mqttClient'
import InjectedMediaCard from './InjectedMediaCard'

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: string
  author?: string
  timestamp: string
  category: string
  image_url?: string
  url?: string
  views: number
  isBreaking?: boolean
  isInjection?: boolean
  injectionId?: string
}

interface NewsFeedProps {
  exerciseId: string
  teamId: string
  className?: string
}

const NewsFeed: React.FC<NewsFeedProps> = ({ exerciseId, teamId, className = '' }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [injections, setInjections] = useState<InjectionMessage[]>([])
  const [showInjections, setShowInjections] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'cybersecurity', 'technology', 'business', 'breaking']

  // Mock baseline news articles
  const mockArticles: NewsArticle[] = [
    {
      id: '1',
      title: 'Major Data Breach Affects 50 Million Users Worldwide',
      summary: 'A sophisticated cyber attack on a leading social media platform has compromised personal data of millions of users across multiple countries.',
      content: 'Security researchers have discovered that attackers gained access through a previously unknown vulnerability in the platform\'s authentication system...',
      source: 'CyberNews Daily',
      author: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      category: 'cybersecurity',
      image_url: '/api/placeholder/600/300',
      views: 15420,
      isBreaking: true
    },
    {
      id: '2',
      title: 'New AI-Powered Security Tool Detects Threats in Real-Time',
      summary: 'Leading cybersecurity firm releases revolutionary machine learning solution that can identify and respond to threats 75% faster than traditional methods.',
      content: 'The new system leverages advanced artificial intelligence algorithms to analyze network traffic patterns and identify potential security threats...',
      source: 'Tech Security Review',
      author: 'Michael Chen',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      category: 'technology',
      views: 8934
    },
    {
      id: '3',
      title: 'Government Announces New Cybersecurity Regulations',
      summary: 'Federal authorities introduce stricter compliance requirements for financial institutions and healthcare providers.',
      content: 'The new regulations mandate enhanced security protocols, regular audits, and immediate breach reporting requirements...',
      source: 'Policy Watch',
      author: 'Lisa Rodriguez',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      category: 'business',
      views: 6721
    },
    {
      id: '4',
      title: 'Ransomware Gang Targets Critical Infrastructure',
      summary: 'Security experts warn of coordinated attacks against power grids and water treatment facilities across multiple states.',
      content: 'Intelligence agencies report increasing sophistication in attacks targeting industrial control systems...',
      source: 'Infrastructure Security Alert',
      author: 'David Park',
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      category: 'cybersecurity',
      views: 12543,
      isBreaking: true
    }
  ]

  useEffect(() => {
    // Initialize with mock articles
    setArticles(mockArticles)

    // Subscribe to injections
    mqttClient.onInjectionReceived((injection) => {
      if (injection.type === 'news' && injection.team_id === teamId) {
        setInjections(prev => [injection, ...prev])

        // Also add as a news article
        const article: NewsArticle = {
          id: injection.injection_id,
          title: injection.content.title,
          summary: injection.content.content.substring(0, 200) + '...',
          content: injection.content.content,
          source: injection.content.source,
          timestamp: injection.timestamp,
          category: injection.content.media_type || 'breaking',
          image_url: injection.content.image_url,
          views: 0,
          isBreaking: injection.content.priority === 'critical' || injection.content.priority === 'high',
          isInjection: true,
          injectionId: injection.injection_id
        }

        setArticles(prev => [article, ...prev])
      }
    })

    // Subscribe to news injections
    mqttClient.subscribeToInjections(exerciseId, teamId)
  }, [exerciseId, teamId])

  const handleAcknowledge = (injectionId: string) => {
    mqttClient.acknowledgeInjection(injectionId, teamId, exerciseId)
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
  }

  const handleDismiss = (injectionId: string) => {
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
    setArticles(prev => prev.filter(article => article.injectionId !== injectionId))
  }

  const handleReadArticle = (articleId: string) => {
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId
          ? { ...article, views: article.views + 1 }
          : article
      )
    )
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(article => article.category === selectedCategory)

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">News Feed</h2>
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

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-full transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
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

      {/* News Articles */}
      <div className="max-h-96 overflow-y-auto">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
              article.isInjection ? 'bg-blue-50 border-l-4 border-blue-400' : ''
            }`}
            onClick={() => handleReadArticle(article.id)}
          >
            <div className="flex space-x-4">
              {/* Article Image */}
              {article.image_url && (
                <div className="flex-shrink-0">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="flex-1 min-w-0">
                {/* Breaking News Badge */}
                {article.isBreaking && (
                  <div className="flex items-center space-x-1 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
                      Breaking News
                    </span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                  {article.isInjection && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      INJECTION
                    </span>
                  )}
                </h3>

                {/* Summary */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {article.summary}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="font-medium">{article.source}</span>
                    {article.author && (
                      <>
                        <span>•</span>
                        <span>{article.author}</span>
                      </>
                    )}
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(article.timestamp)}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.views.toLocaleString()} views</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      article.category === 'cybersecurity'
                        ? 'bg-red-100 text-red-700'
                        : article.category === 'technology'
                        ? 'bg-blue-100 text-blue-700'
                        : article.category === 'business'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {article.category}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle bookmark
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle share
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    {article.url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(article.url, '_blank')
                        }}
                        className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No news articles to display</p>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Show all categories
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default NewsFeed