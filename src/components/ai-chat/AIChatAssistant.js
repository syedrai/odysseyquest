import React, { useState, useRef, useEffect } from 'react';
import { chatAssistance, translateContent } from '../../services/ai/openAIService';
import { speakText, recognizeSpeech } from '../../services/ai/speechService';
import '../../styles/AIChat.css';

const AIChatAssistant = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([{
      id: 1,
      text: `Hi ${user.name}! I'm your AI learning assistant. How can I help you with your studies today?`,
      sender: 'ai',
      timestamp: new Date()
    }]);
  }, [user.name]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatAssistance(inputMessage, {
        grade: user.grade,
        subject: detectSubject(inputMessage)
      });

      const aiMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'ai',
        timestamp: new Date(),
        followUp: response.followUpQuestions,
        resources: response.resources
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response
      speakText(response.response);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    setIsListening(true);
    try {
      const transcript = await recognizeSpeech();
      setInputMessage(transcript);
    } catch (error) {
      console.error('Voice recognition error:', error);
    } finally {
      setIsListening(false);
    }
  };

  const handleQuickQuestion = async (question) => {
    setInputMessage(question);
    // Small delay to allow state update before sending
    setTimeout(() => {
      const sendButton = document.querySelector('.send-button');
      if (sendButton) sendButton.click();
    }, 100);
  };

  const detectSubject = (message) => {
    if (message.match(/math|algebra|calculus|equation|numbers/gi)) return 'math';
    if (message.match(/science|biology|chemistry|physics|experiment/gi)) return 'science';
    if (message.match(/english|grammar|writing|literature|vocabulary/gi)) return 'english';
    if (message.match(/history|historical|past|events|civilization/gi)) return 'history';
    return 'general';
  };

  const translateMessage = async (text) => {
    try {
      const translated = await translateContent(text, user.language);
      speakText(translated);
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  return (
    <div className="ai-chat-assistant">
      <div className="chat-header">
        <h2>AI Learning Assistant 🤖</h2>
        <p>Get help with homework, explanations, and study tips</p>
      </div>

      <div className="quick-questions">
        <h4>Quick Questions:</h4>
        <div className="quick-buttons">
          {[
            "Explain algebra basics",
            "Help with science homework",
            "What's photosynthesis?",
            "How to write an essay?"
          ].map((question, index) => (
            <button
              key={index}
              className="btn btn-sm btn-outline"
              onClick={() => handleQuickQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-content">
                <p>{message.text}</p>
                {message.sender === 'ai' && message.followUp && (
                  <div className="follow-up">
                    <p>Follow-up:</p>
                    {message.followUp.map((q, i) => (
                      <button
                        key={i}
                        className="follow-up-btn"
                        onClick={() => handleQuickQuestion(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {message.sender === 'ai' && message.resources && (
                  <div className="resources">
                    <p>Suggested resources:</p>
                    <ul>
                      {message.resources.map((resource, i) => (
                        <li key={i}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="message-actions">
                <button 
                  className="action-btn"
                  onClick={() => speakText(message.text)}
                  title="Listen"
                >
                  🔊
                </button>
                <button 
                  className="action-btn"
                  onClick={() => translateMessage(message.text)}
                  title="Translate"
                >
                  🌐
                </button>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="input-container">
          <div className="input-group">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about your studies..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <button 
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              disabled={isLoading || isListening}
              title="Voice Input"
            >
              🎤
            </button>
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatAssistant;