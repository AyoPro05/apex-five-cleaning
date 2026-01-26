import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'

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
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('quote') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return {
        text: "Great question! Our residential cleaning starts from £45 per visit, end of tenancy from £150, and Airbnb turnover from £60. The exact price depends on your property size and specific requirements. Would you like me to help you get a detailed quote?",
        quickReplies: ['Yes, get a quote', 'Tell me more']
      }
    }

    if (lowerMessage.includes('service') || lowerMessage.includes('what')) {
      return {
        text: "We offer residential cleaning, end of tenancy cleaning, Airbnb turnover cleaning, and commercial cleaning. Our most popular is regular residential cleaning. Which service are you most interested in?",
        quickReplies: ['Residential', 'End of Tenancy', 'Airbnb']
      }
    }

    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return {
        text: "To book a cleaning, the easiest way is to request a quote on our website. You'll answer a few questions about your property, and we'll send you a personalized quote within 24 hours.",
        quickReplies: ['Get a quote', 'Contact us']
      }
    }

    if (lowerMessage.includes('eco') || lowerMessage.includes('product') || lowerMessage.includes('chemical')) {
      return {
        text: "Yes! We offer eco-friendly cleaning using plant-based, non-toxic products that are safe for children and pets. This option is available for a small surcharge of £5 per visit.",
        quickReplies: ['That\'s great', 'More info']
      }
    }

    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      return {
        text: "You can reach us by email at info@apexfivecleaning.co.uk. You can also use our online quote form or chat with me here. A member of our team will respond within 24 hours.",
        quickReplies: ['Send a message']
      }
    }

    return {
      text: "Thanks for your message! I can help answer questions about our services, pricing, and booking. For a detailed quote tailored to your needs, I recommend using our online quote form. Is there anything specific you'd like to know about?",
      quickReplies: ['Get a quote', 'View services']
    }
  }

  const handleSend = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Simulate AI response
    setTimeout(() => {
      const response = getAIResponse(userMessage.text)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: response.text,
        quickReplies: response.quickReplies
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1000)
  }

  const handleQuickReply = (reply) => {
    setInputValue(reply)
    setTimeout(() => handleSend(), 100)
  }

  const handleNavigation = (path) => {
    setIsOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 mb-4 bg-white rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden fade-in">
          {/* Chat Header */}
          <div className="hero-gradient px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
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
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-teal-600" />
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
                            const path = reply.toLowerCase().includes('quote')
                              ? '/request-a-quote'
                              : reply.toLowerCase().includes('service')
                              ? '/services'
                              : reply.toLowerCase().includes('contact')
                              ? '/contact'
                              : null
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
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={handleSend}
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
        onClick={() => setIsOpen(!isOpen)}
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
