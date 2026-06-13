import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Send, User } from 'lucide-react'
import { getBotResponse } from '../data/websiteContent'
import { post } from '../utils/apiClient'
import { trackEvent } from '../utils/analytics'
import { createIdempotencyKey, withIdempotency } from '../utils/idempotency'
import FallbackImage from './FallbackImage'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "Hi there! 👋 I'm the Apex Five Cleaning assistant. How can I help you today?",
      quickReplies: ['Get a quote', 'Services', 'Pricing']
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [leadSaving, setLeadSaving] = useState(false)
  const [leadError, setLeadError] = useState('')
  const [leadSaved, setLeadSaved] = useState(false)
  const [leadFieldErrors, setLeadFieldErrors] = useState({})
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    postcode: '',
    serviceType: '',
    message: ''
  })
  const [inputValue, setInputValue] = useState('')
  const [conversationId] = useState(() => `cw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const [leadIdempotencyKey, setLeadIdempotencyKey] = useState(() => createIdempotencyKey())
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getFallbackResponse = (message) => {
    // First try the website knowledge base
    const kbResponse = getBotResponse(message)
    if (kbResponse) {
      const quickReplies = ['Get a quote', 'View services', 'Contact us']
      if (kbResponse.link) {
        const pageName = kbResponse.link === '/request-a-quote' ? 'Get a quote' : kbResponse.link === '/services' ? 'View services' : kbResponse.link === '/contact' ? 'Contact us' : null
        if (pageName && !quickReplies.includes(pageName)) quickReplies.unshift(pageName)
      }
      return {
        text: kbResponse.text,
        link: kbResponse.link,
        quickReplies: quickReplies.slice(0, 4),
        ctaPath: kbResponse.link,
        recommendLeadCapture: /quote|book|price|cost/i.test(message)
      }
    }

    // Fallback for greetings/simple queries
    const lower = message.toLowerCase()
    if (['hi', 'hello', 'hey', 'hola'].some((g) => lower.startsWith(g) || lower === g)) {
      return {
        text: "Hi! 👋 I'm the Apex Assistant. I can help with services, pricing, booking, contact info, and more. What would you like to know?",
        quickReplies: ['Get a quote', 'Services', 'Pricing', 'Contact us'],
        recommendLeadCapture: false
      }
    }

    return {
      text: "I can help with our services, pricing, booking, contact details, and more. Try asking about residential cleaning, end of tenancy, Airbnb turnover, or how to get a quote. Or use the quick links below!",
      quickReplies: ['Get a quote', 'View services', 'Pricing', 'Contact us'],
      recommendLeadCapture: /quote|book|price|cost/i.test(message)
    }
  }

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isTyping) return
    trackEvent('chat_message_sent', { conversation_id: conversationId })

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const result = await post('/api/chat/message', { message: text, conversationId })
      const response = result?.response || getFallbackResponse(text)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: response.text,
        quickReplies: response.quickReplies,
        ctaPath: response.ctaPath,
        recommendLeadCapture: Boolean(response.recommendLeadCapture)
      }
      setMessages(prev => [...prev, aiMessage])
      trackEvent('chat_message_replied', {
        conversation_id: conversationId,
        intent: response.intent || 'general',
        recommended_lead_capture: Boolean(response.recommendLeadCapture),
      })
    } catch {
      const response = getFallbackResponse(text)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: response.text,
        quickReplies: response.quickReplies,
        ctaPath: response.ctaPath,
        recommendLeadCapture: Boolean(response.recommendLeadCapture)
      }
      setMessages(prev => [...prev, aiMessage])
      trackEvent('chat_message_fallback', { conversation_id: conversationId })
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickReply = (reply) => {
    setInputValue(reply)
    setTimeout(() => handleSend(), 100)
  }

  const handleNavigation = (path) => {
    setIsOpen(false)
    trackEvent('chat_cta_click', { path, conversation_id: conversationId })
    navigate(path)
  }

  const handleLeadSubmit = async (e) => {
    e.preventDefault()
    setLeadError('')
    setLeadSaved(false)
    const nextFieldErrors = {}
    if (!leadForm.name.trim()) nextFieldErrors.name = 'Name is required.'
    if (!leadForm.email.trim() && !leadForm.phone.trim()) {
      nextFieldErrors.contact = 'Provide at least an email or phone number.'
    }
    if (leadForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email.trim())) {
      nextFieldErrors.email = 'Enter a valid email address.'
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setLeadFieldErrors(nextFieldErrors)
      return
    }
    setLeadFieldErrors({})
    setLeadSaving(true)
    try {
      const payload = {
        ...leadForm,
        conversationId,
      }
      const result = await post('/api/chat/lead', payload, withIdempotency(leadIdempotencyKey))
      if (!result?.success) {
        setLeadError(result?.error || 'Could not submit your details right now.')
        return
      }
      setLeadSaved(true)
      setLeadIdempotencyKey(createIdempotencyKey())
      trackEvent('chat_lead_submitted', {
        conversation_id: conversationId,
        has_email: Boolean(leadForm.email),
        has_phone: Boolean(leadForm.phone),
        service_type: leadForm.serviceType || 'unspecified',
      })
      setLeadFormOpen(false)
      const aiMessage = {
        id: Date.now() + 2,
        type: 'ai',
        text: 'Thanks! Our team has received your details and will follow up shortly.',
        quickReplies: ['Get a quote', 'Contact us']
      }
      setMessages(prev => [...prev, aiMessage])
      setLeadForm({
        name: '',
        email: '',
        phone: '',
        postcode: '',
        serviceType: '',
        message: ''
      })
      setLeadFieldErrors({})
    } catch (err) {
      setLeadError(err?.message || 'Could not submit your details right now.')
      trackEvent('chat_lead_submit_failed', { conversation_id: conversationId })
    } finally {
      setLeadSaving(false)
    }
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 mb-4 bg-white rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden fade-in">
          {/* Chat Header */}
          <div className="hero-gradient px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <FallbackImage src="/apex-five-logo.png" alt="Apex Assistant" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Apex Assistant</h3>
                <p className="text-teal-100 text-xs">Online now</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-teal-100">
                    <FallbackImage src="/apex-five-logo.png" alt="" className="w-5 h-5 object-contain" />
                  </div>
                )}
                <div
                  className={`${
                    message.type === 'user'
                      ? 'bg-teal-600 text-white rounded-r-2xl rounded-tl-2xl'
                      : 'bg-white rounded-r-2xl rounded-tr-2xl shadow-sm'
                  } p-3 max-w-[85%] ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}
                >
                  <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-700'}`}>
                    {message.text}
                  </p>
                  {message.quickReplies && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const explicitPath = message.ctaPath
                            const path = explicitPath || (reply.toLowerCase().includes('quote')
                              ? '/request-a-quote'
                              : reply.toLowerCase().includes('service')
                              ? '/services'
                              : reply.toLowerCase().includes('contact')
                              ? '/contact'
                              : null)
                            if (path) {
                              handleNavigation(path)
                            } else {
                              handleQuickReply(reply)
                            }
                          }}
                          className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full hover:bg-teal-100 transition"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.recommendLeadCapture && (
                    <button
                      type="button"
                      onClick={() => setLeadFormOpen(true)}
                      className="mt-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full hover:bg-amber-200 transition"
                    >
                      Share details for a fast callback
                    </button>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start fade-in">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-teal-100">
                  <FallbackImage src="/apex-five-logo.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="bg-white rounded-r-2xl rounded-tr-2xl shadow-sm p-3 max-w-[85%] mr-2">
                  <p className="text-sm text-gray-500">Typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {leadFormOpen && (
            <form onSubmit={handleLeadSubmit} className="px-3 py-3 border-t bg-white space-y-2">
              <p className="text-xs font-semibold text-gray-700">Share your details for follow-up</p>
              <input
                value={leadForm.name}
                onChange={(e) => {
                  setLeadForm((p) => ({ ...p, name: e.target.value }))
                  if (leadFieldErrors.name) {
                    setLeadFieldErrors((prev) => ({ ...prev, name: '' }))
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                placeholder="Name *"
                required
              />
              {leadFieldErrors.name && <p className="text-[11px] text-red-600">{leadFieldErrors.name}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={leadForm.email}
                  onChange={(e) => {
                    setLeadForm((p) => ({ ...p, email: e.target.value }))
                    if (leadFieldErrors.email || leadFieldErrors.contact) {
                      setLeadFieldErrors((prev) => ({ ...prev, email: '', contact: '' }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  placeholder="Email"
                  type="email"
                />
                <input
                  value={leadForm.phone}
                  onChange={(e) => {
                    setLeadForm((p) => ({ ...p, phone: e.target.value }))
                    if (leadFieldErrors.contact) {
                      setLeadFieldErrors((prev) => ({ ...prev, contact: '' }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  placeholder="Phone"
                />
              </div>
              {(leadFieldErrors.email || leadFieldErrors.contact) && (
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[11px] text-red-600">{leadFieldErrors.email || ''}</p>
                  <p className="text-[11px] text-red-600">{leadFieldErrors.contact || ''}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={leadForm.postcode}
                  onChange={(e) => setLeadForm((p) => ({ ...p, postcode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  placeholder="Postcode"
                />
                <input
                  value={leadForm.serviceType}
                  onChange={(e) => setLeadForm((p) => ({ ...p, serviceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  placeholder="Service needed"
                />
              </div>
              <textarea
                value={leadForm.message}
                onChange={(e) => setLeadForm((p) => ({ ...p, message: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                rows={2}
                placeholder="Anything we should know?"
              />
              {leadError && <p className="text-[11px] text-red-600">{leadError}</p>}
              {leadSaved && <p className="text-[11px] text-green-600">Details sent successfully.</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={leadSaving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs py-2 font-semibold disabled:bg-gray-400"
                >
                  {leadSaving ? 'Sending...' : 'Send details'}
                </button>
                <button
                  type="button"
                  onClick={() => setLeadFormOpen(false)}
                  className="px-3 border border-gray-200 rounded-lg text-xs text-gray-600"
                >
                  Close
                </button>
              </div>
            </form>
          )}

          {/* Chat Input */}
          <div className="p-3 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={handleSend}
                disabled={isTyping}
                className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          trackEvent(next ? 'chat_open' : 'chat_close', { conversation_id: conversationId })
        }}
        className={`chat-bubble fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg shadow-teal-600/30 flex items-center justify-center transition ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </>
  )
}

export default ChatWidget
