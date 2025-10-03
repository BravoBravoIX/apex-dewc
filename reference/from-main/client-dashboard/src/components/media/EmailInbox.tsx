import React, { useState, useEffect } from 'react'
import {
  Mail,
  MailOpen,
  Star,
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  Archive,
  Flag,
  Search,
  Zap,
  Clock,
  User,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { InjectionMessage, mqttClient } from '../../services/mqttClient'
import InjectedMediaCard from './InjectedMediaCard'

interface Email {
  id: string
  sender: string
  senderEmail: string
  recipient: string
  subject: string
  content: string
  timestamp: string
  isRead: boolean
  isStarred: boolean
  isFlagged: boolean
  hasAttachments: boolean
  attachments?: string[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash'
  isInjection?: boolean
  injectionId?: string
  isPhishing?: boolean
  isSuspicious?: boolean
}

interface EmailInboxProps {
  exerciseId: string
  teamId: string
  className?: string
}

const EmailInbox: React.FC<EmailInboxProps> = ({ exerciseId, teamId, className = '' }) => {
  const [emails, setEmails] = useState<Email[]>([])
  const [injections, setInjections] = useState<InjectionMessage[]>([])
  const [showInjections, setShowInjections] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Email['category']>('inbox')

  // Mock baseline emails
  const mockEmails: Email[] = [
    {
      id: '1',
      sender: 'IT Security Team',
      senderEmail: 'security@company.com',
      recipient: 'team@company.com',
      subject: 'Monthly Security Update - Action Required',
      content: 'Please review the attached security policy updates and confirm compliance by end of week. New password requirements are now in effect.',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      isRead: false,
      isStarred: true,
      isFlagged: false,
      hasAttachments: true,
      attachments: ['Security_Policy_v2.1.pdf', 'Password_Requirements.docx'],
      priority: 'high',
      category: 'inbox'
    },
    {
      id: '2',
      sender: 'John Smith',
      senderEmail: 'j.smith@partner.com',
      recipient: 'team@company.com',
      subject: 'Urgent: Invoice Payment Required',
      content: 'Dear Sir/Madam, Please find attached invoice for immediate payment. Click here to verify: http://suspicious-link.com/verify',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isRead: false,
      isStarred: false,
      isFlagged: true,
      hasAttachments: true,
      attachments: ['invoice_2024_001.exe'],
      priority: 'urgent',
      category: 'inbox',
      isPhishing: true,
      isSuspicious: true
    },
    {
      id: '3',
      sender: 'System Administrator',
      senderEmail: 'admin@company.com',
      recipient: 'team@company.com',
      subject: 'Server Maintenance Notification',
      content: 'Scheduled maintenance will occur this weekend from 2 AM to 6 AM EST. All services will be temporarily unavailable.',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      isRead: true,
      isStarred: false,
      isFlagged: false,
      hasAttachments: false,
      priority: 'normal',
      category: 'inbox'
    },
    {
      id: '4',
      sender: 'Training Department',
      senderEmail: 'training@company.com',
      recipient: 'team@company.com',
      subject: 'Cybersecurity Training Completion Certificate',
      content: 'Congratulations! You have successfully completed the mandatory cybersecurity training. Your certificate is attached.',
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      isRead: true,
      isStarred: true,
      isFlagged: false,
      hasAttachments: true,
      attachments: ['Certificate_Cybersecurity_2024.pdf'],
      priority: 'normal',
      category: 'inbox'
    }
  ]

  useEffect(() => {
    // Initialize with mock emails
    setEmails(mockEmails)

    // Subscribe to injections
    mqttClient.onInjectionReceived((injection) => {
      if (injection.type === 'email' && injection.team_id === teamId) {
        setInjections(prev => [injection, ...prev])

        // Also add as an email
        const email: Email = {
          id: injection.injection_id,
          sender: injection.content.sender || 'Unknown Sender',
          senderEmail: injection.content.sender || 'unknown@example.com',
          recipient: injection.content.recipient || teamId,
          subject: injection.content.subject || injection.content.title,
          content: injection.content.content,
          timestamp: injection.timestamp,
          isRead: false,
          isStarred: false,
          isFlagged: injection.content.priority === 'critical' || injection.content.priority === 'high',
          hasAttachments: !!(injection.content.attachments && injection.content.attachments.length > 0),
          attachments: injection.content.attachments,
          priority: injection.content.priority === 'critical' ? 'urgent' :
                   injection.content.priority === 'high' ? 'high' :
                   injection.content.priority === 'low' ? 'low' : 'normal',
          category: 'inbox',
          isInjection: true,
          injectionId: injection.injection_id,
          isPhishing: injection.content.content.toLowerCase().includes('click here') ||
                     injection.content.content.toLowerCase().includes('verify account') ||
                     injection.content.content.toLowerCase().includes('urgent payment'),
          isSuspicious: injection.content.attachments?.some(att =>
            att.endsWith('.exe') || att.endsWith('.scr') || att.endsWith('.bat')
          )
        }

        setEmails(prev => [email, ...prev])
      }
    })

    // Subscribe to email injections
    mqttClient.subscribeToInjections(exerciseId, teamId)
  }, [exerciseId, teamId])

  const handleAcknowledge = (injectionId: string) => {
    mqttClient.acknowledgeInjection(injectionId, teamId, exerciseId)
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
  }

  const handleDismiss = (injectionId: string) => {
    setInjections(prev => prev.filter(inj => inj.injection_id !== injectionId))
    setEmails(prev => prev.filter(email => email.injectionId !== injectionId))
  }

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email)
    if (!email.isRead) {
      setEmails(prev =>
        prev.map(e =>
          e.id === email.id ? { ...e, isRead: true } : e
        )
      )
    }
  }

  const handleStarToggle = (emailId: string) => {
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      )
    )
  }

  const handleFlagToggle = (emailId: string) => {
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId ? { ...email, isFlagged: !email.isFlagged } : email
      )
    )
  }

  const handleEmailAction = (emailId: string, action: string) => {
    switch (action) {
      case 'delete':
        setEmails(prev =>
          prev.map(email =>
            email.id === emailId ? { ...email, category: 'trash' } : email
          )
        )
        break
      case 'archive':
        setEmails(prev => prev.filter(email => email.id !== emailId))
        break
      case 'spam':
        setEmails(prev =>
          prev.map(email =>
            email.id === emailId ? { ...email, category: 'spam' } : email
          )
        )
        break
    }
    setSelectedEmail(null)
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return time.toLocaleDateString()
  }

  const getPriorityColor = (priority: Email['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'normal': return 'text-gray-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const filteredEmails = emails.filter(email => {
    if (email.category !== selectedCategory) return false
    if (searchTerm && !email.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !email.sender.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !email.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const unreadCount = emails.filter(e => !e.isRead && e.category === 'inbox').length

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Email Inbox</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
                {unreadCount}
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

        {/* Search and Categories */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1">
          {(['inbox', 'sent', 'drafts', 'spam', 'trash'] as Email['category'][]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
              {category === 'inbox' && unreadCount > 0 && (
                <span className="ml-1 px-1 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Injection Messages */}
      {showInjections && injections.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-yellow-50">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Active Email Injections</h3>
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

      <div className="flex">
        {/* Email List */}
        <div className="w-1/2 border-r border-gray-200">
          <div className="max-h-96 overflow-y-auto">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleEmailClick(email)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !email.isRead ? 'bg-blue-50' : ''
                } ${
                  email.isInjection ? 'border-l-4 border-blue-400' : ''
                } ${
                  email.isPhishing ? 'border-l-4 border-red-400 bg-red-50' : ''
                } ${
                  selectedEmail?.id === email.id ? 'bg-blue-100' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex items-center space-x-1">
                        {email.isRead ? (
                          <MailOpen className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-600" />
                        )}
                        {email.hasAttachments && (
                          <Paperclip className="h-3 w-3 text-gray-400" />
                        )}
                        {email.isFlagged && (
                          <Flag className="h-3 w-3 text-red-500" />
                        )}
                        {email.isPhishing && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        {email.isInjection && (
                          <Zap className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <span className={`text-sm font-medium truncate ${!email.isRead ? 'font-bold' : ''}`}>
                        {email.sender}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className={`text-sm truncate block ${!email.isRead ? 'font-semibold' : ''}`}>
                        {email.subject}
                        {email.isInjection && (
                          <span className="ml-2 px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            INJ
                          </span>
                        )}
                        {email.isPhishing && (
                          <span className="ml-2 px-1 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                            PHISH
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {email.content.substring(0, 50)}...
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs ${getPriorityColor(email.priority)}`}>
                        {email.priority !== 'normal' && email.priority.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(email.timestamp)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStarToggle(email.id)
                      }}
                      className={`p-1 rounded ${
                        email.isStarred ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredEmails.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No emails to display</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Email Content */}
        <div className="w-1/2">
          {selectedEmail ? (
            <div className="p-4">
              {/* Email Header */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedEmail.subject}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-4 w-4" />
                        <span>From: {selectedEmail.sender} &lt;{selectedEmail.senderEmail}&gt;</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span>To: {selectedEmail.recipient}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleFlagToggle(selectedEmail.id)}
                      className={`p-2 rounded ${
                        selectedEmail.isFlagged ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEmailAction(selectedEmail.id, 'delete')}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEmailAction(selectedEmail.id, 'archive')}
                      className="p-2 text-gray-400 hover:text-blue-500"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Security Warnings */}
                {selectedEmail.isPhishing && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      <span className="text-red-700 font-medium">Potential Phishing Email Detected</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">
                      This email contains suspicious content. Do not click links or download attachments.
                    </p>
                  </div>
                )}

                {selectedEmail.isSuspicious && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <span className="text-orange-700 font-medium">Suspicious Attachments</span>
                    </div>
                    <p className="text-orange-600 text-sm mt-1">
                      This email contains executable files. Exercise caution before opening.
                    </p>
                  </div>
                )}

                {/* Attachments */}
                {selectedEmail.hasAttachments && selectedEmail.attachments && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Attachments ({selectedEmail.attachments.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className={`text-sm p-2 rounded ${
                            attachment.endsWith('.exe') || attachment.endsWith('.scr')
                              ? 'bg-red-100 text-red-700'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          {attachment}
                          {(attachment.endsWith('.exe') || attachment.endsWith('.scr')) && (
                            <span className="ml-2 text-xs font-bold text-red-600">DANGEROUS</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Email Content */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedEmail.content}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex space-x-2">
                  <button className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <Reply className="h-4 w-4" />
                    <span>Reply</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <ReplyAll className="h-4 w-4" />
                    <span>Reply All</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <Forward className="h-4 w-4" />
                    <span>Forward</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select an email to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailInbox