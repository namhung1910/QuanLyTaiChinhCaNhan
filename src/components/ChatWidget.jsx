import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api'
import './ChatWidget.css'
import fingyImage from '../assets/Fingy.png'
import ReactMarkdown from 'react-markdown';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const [quickSummary, setQuickSummary] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [user, setUser] = useState(null)
  const messagesEndRef = useRef(null)

  // Helper to create message objects consistently
  const createMessage = (type, content) => ({
    id: Date.now() + Math.random(), // Add random to avoid key collision
    type,
    content,
    timestamp: new Date().toISOString()
  })

  // Get avatar text for user
  const getAvatarText = () => (user?.hoTen || 'NN').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load user data once
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    loadUser()
  }, [])

  const loadInitialData = useCallback(async () => {
    // Set initial greeting and suggested questions
    setMessages([createMessage('bot', `👋 Xin chào! Tôi là Fingy - trợ lý tài chính thông minh của bạn. Tôi có thể giúp bạn phân tích tài chính, đưa ra lời khuyên và trả lời các câu hỏi về quản lý tiền bạc. Hãy hỏi tôi bất cứ điều gì! 💰`)])
    setSuggestedQuestions([
      "Tôi chi tiêu nhiều nhất ở đâu?",
      "Tháng này tôi có tiết kiệm được không?",
      "Tôi nên làm gì để quản lý tài chính tốt hơn?",
      "Ngân sách của tôi có ổn không?",
      "So với tháng trước, tài chính của tôi thế nào?"
    ])
    setQuickSummary(null) // Reset summary

    // Load quick summary in the background
    try {
      const summaryRes = await api.get('/chatbot/summary')
      if (summaryRes.data.success) {
        setQuickSummary(summaryRes.data.summary)
      }
    } catch (error) {
      console.error('Error loading quick summary:', error)
    }
  }, [])

  const loadChatHistory = useCallback(async () => {
    try {
      const historyRes = await api.get('/lich-su-chat')
      if (historyRes.data.success && historyRes.data.chatHistory.messages.length > 0) {
        setMessages(historyRes.data.chatHistory.messages)
      } else {
        await loadInitialData()
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      await loadInitialData() // Fallback to initial state
    }
  }, [loadInitialData])

  // Load chat history or initial data when widget opens
  useEffect(() => {
    if (isOpen) {
      loadChatHistory()
    }
  }, [isOpen, loadChatHistory])

  const saveMessagesToDB = async (messagesToSave) => {
    try {
      await api.post('/lich-su-chat/messages', { messages: messagesToSave })
    } catch (error) {
      console.error('Error saving messages to DB:', error)
    }
  }

  const sendMessage = async (messageContent = inputMessage) => {
    const trimmedMessage = messageContent.trim()
    if (!trimmedMessage || isLoading) return

    const userMessage = createMessage('user', trimmedMessage)
    const currentMessages = [...messages, userMessage]

    setMessages(currentMessages)
    setInputMessage('')
    setIsLoading(true)

    let botMessage;
    try {
      const response = await api.post('/chatbot/message', { message: trimmedMessage })
      if (response.data.success) {
        botMessage = createMessage('bot', response.data.response)
      } else {
        const errorContent = response.data.isGeminiError
          ? `🤖 ${response.data.message}\n\nVui lòng thử lại sau hoặc hỏi câu hỏi khác. Tôi đang sử dụng Gemini AI để phân tích tài chính của bạn.`
          : response.data.message || 'Có lỗi xảy ra'
        botMessage = createMessage('bot', errorContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      botMessage = createMessage('bot', 'Xin lỗi, tôi không thể xử lý câu hỏi của bạn lúc này. Vui lòng thử lại sau. 😔')
    } finally {
      const finalMessages = [...currentMessages, botMessage]
      setMessages(finalMessages)
      await saveMessagesToDB(finalMessages)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClearChat = async () => {
    try {
      await api.delete('/lich-su-chat/clear')
    } catch (error) {
      console.error('Error clearing chat:', error)
    } finally {
      await loadInitialData()
      setShowConfirmModal(false)
    }
  }

  const renderMessageContent = (content) => {
    return <ReactMarkdown>{content}</ReactMarkdown>;
  };

  return (
    <div className="chat-widget">
      {/* Chat Toggle Button */}
      <button 
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {isOpen ? (
          <span className="material-symbols-rounded">close</span>
        ) : (
          <img src={fingyImage} alt="Fingy" className="chat-toggle-image" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <img src={fingyImage} alt="Fingy" className="chat-header-avatar" />
              <div>
                <h3>Fingy</h3>
                <p>Trợ lý tài chính của bạn</p>
              </div>
            </div>
            <div className="chat-header-actions">
              <button 
                className="chat-action-btn"
                onClick={() => setShowConfirmModal(true)}
                title="Tạo chat mới"
              >
                <span className="material-symbols-rounded">add</span>
              </button>
            </div>
          </div>

          {/* Quick Summary */}
          {quickSummary && (
            <div className="quick-summary">
              <div className="summary-item">
                <span className="material-symbols-rounded">account_balance_wallet</span>
                <span>Số dư: {quickSummary.currentBalance.toLocaleString()} VNĐ</span>
              </div>
              <div className="summary-item">
                <span className="material-symbols-rounded">trending_up</span>
                <span>Thu tháng: {quickSummary.monthlyIncome.toLocaleString()} VNĐ</span>
              </div>
              <div className="summary-item">
                <span className="material-symbols-rounded">trending_down</span>
                <span>Chi tháng: {quickSummary.monthlyExpense.toLocaleString()} VNĐ</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === 'user' ? (
                    <div className="user-avatar-text">{getAvatarText()}</div>
                  ) : (
                    <img src={fingyImage} alt="Fingy" className="bot-avatar-image" />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">{renderMessageContent(msg.content)}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  <img src={fingyImage} alt="Fingy" className="bot-avatar-image" />
                </div>
                <div className="message-content">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && messages.length <= 1 && (
            <div className="suggested-questions">
              <h4>💡 Câu hỏi gợi ý:</h4>
              <div className="suggestions-grid">
                {suggestedQuestions.map((q, index) => (
                  <button key={index} className="suggestion-btn" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input">
            <div className="input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isLoading}
              />
              <button className="send-btn" onClick={() => sendMessage()} disabled={!inputMessage.trim() || isLoading}>
                <span className="material-symbols-rounded">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="chat-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <h3>Tạo chat mới</h3>
              <button className="chat-modal-close-btn" onClick={() => setShowConfirmModal(false)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="chat-modal-body">
              <p>Bạn có chắc chắn muốn tạo chat mới không?</p>
              <p className="chat-warning-text">⚠️ Cuộc trò chuyện cũ của bạn sẽ bị xóa và không thể khôi phục.</p>
            </div>
            <div className="chat-modal-actions">
              <button className="chat-modal-btn chat-modal-btn-secondary" onClick={() => setShowConfirmModal(false)}>Hủy</button>
              <button className="chat-modal-btn chat-modal-btn-danger" onClick={handleClearChat}>Tạo chat mới</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}