'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from './Chatbot.module.css';

// Replace hardcoded endpoints with environment variables or configuration
const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "https://pyrenewable-newsletter22.mobiloittegroup.com/query";
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "/api/auth/login";

interface Message {
  from: string;
  text: string;
  isTyping?: boolean;
  displayText?: string;
}

interface ChatResponse {
  response: string;
  answer?: string;  // Adding answer field as it might be the actual response field
  error?: string;   // Adding error field for error handling
}

interface ChatbotComponentProps {
  toggleChatbot: () => void;
}

interface CustomEvent<T = unknown> extends Event {
  detail?: T;
}

// Create initial welcome message
const initialMessage: Message = { 
  from: "bot", 
  text: "Welcome to the chatbot! How can I assist you today?", 
  displayText: "Welcome to the chatbot! How can I assist you today?" 
};

/**
 * Main chatbot component
 */
function ChatbotComponent({ toggleChatbot }: ChatbotComponentProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('selectedChatbotAvatar') || '/images/user/Bot1.png'
      : '/images/user/Bot1.png';
  });
  const [botName, setBotName] = useState<string>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('chatbotName') || 'Planet Pulse'
      : 'Planet Pulse';
  });
  const [welcomeMessage, setWelcomeMessage] = useState<string>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('chatbotWelcomeMessage') || 'How can I help you?'
      : 'How can I help you?';
  });
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    return typeof window !== 'undefined'
      ? sessionStorage.getItem('chatbot_welcome_shown') !== 'true'
      : true;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('chatbot_messages');
      return saved ? JSON.parse(saved) : [initialMessage];
    }
    return [initialMessage];
  });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleStartChat = useCallback(() => {
    setShowWelcome(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('chatbot_welcome_shown', 'true');
    }
  }, []);

  // Improved typing animation with cleanup
  const typeMessage = useCallback((messageIndex: number, text: string) => {
    let currentIndex = 0;
    let isMounted = true;
    
    const typingInterval = setInterval(() => {
      if (!isMounted) {
        clearInterval(typingInterval);
        return;
      }
      
      if (currentIndex < text.length) {
        setMessages(prev => {
          // Only update if the message still exists
          if (messageIndex >= prev.length) {
            clearInterval(typingInterval);
            return prev;
          }
          
          const newMessages = [...prev];
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            displayText: text.substring(0, currentIndex + 1)
          };
          return newMessages;
        });
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setMessages(prev => {
          // Only update if the message still exists
          if (messageIndex >= prev.length) return prev;
          
          const newMessages = [...prev];
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            isTyping: false,
            displayText: text
          };
          return newMessages;
        });
      }
    }, 30); // typing speed: 30ms per character

    // Return cleanup function
    return () => {
      isMounted = false;
      clearInterval(typingInterval);
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    const userMsg: Message = { from: "user", text: userMessage, displayText: userMessage };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({ 
          query: userMessage,
          session_id: "23"
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to get response from chatbot: ${res.status}`);
      }

      const data: ChatResponse = await res.json();
      
      // Check for error in response
      if (data.error) {
        throw new Error(data.error);
      }

      // Get the response text from either response or answer field
      const responseText = data.response || data.answer;
      
      if (!responseText) {
        throw new Error('No response received from chatbot');
      }

      const botMessage: Message = {
        from: "bot",
        text: responseText,
        isTyping: true,
        displayText: ""
      };
      
      setMessages(prev => {
        const newMessages = [...prev, botMessage];
        return newMessages;
      });
      
      // Start typing animation on next tick to ensure message is added
      const botMessageIndex = messages.length + 1;
      setTimeout(() => {
        typeMessage(botMessageIndex, responseText);
      }, 0);

    } catch (e) {
      console.error('Chat error:', e);
      const errorMessage: Message = {
        from: "bot",
        text: e instanceof Error ? e.message : "I apologize, but I'm having trouble responding right now. Please try again later.",
        displayText: e instanceof Error ? e.message : "I apologize, but I'm having trouble responding right now. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, typeMessage]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', email.trim());
      formData.append('password', password.trim());
      formData.append('scope', '');
      formData.append('client_id', 'string');
      formData.append('client_secret', 'string');

      console.log('Attempting login with:', { email: email.trim() });

      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json',
        },
        body: formData.toString(),
      });

      const responseData = await response.json();
      console.log('Login response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || 'Invalid credentials');
      }

      localStorage.setItem('token', responseData.access_token);
      localStorage.setItem('isAuthenticated', 'true');
      document.cookie = `isAuthenticated=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
      setIsAuthenticated(true);
      setLoginError("");
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error instanceof Error ? error.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Login form component
  const LoginForm = () => (
    <div className={styles.customChatbotUi}>
      <div className={styles.customChatbotHeader}>
        <button onClick={toggleChatbot} className={styles.customCloseBtn}>×</button>
        <span className={styles.customBotTitle}>Login</span>
        <div style={{width: '24px'}}></div>
      </div>
      <div className={styles.customChatbotWelcome}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '300px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
              required
            />
          </div>
          {loginError && (
            <div style={{ color: 'red', marginBottom: '1rem' }}>
              {loginError}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );

  // Welcome screen component
  const WelcomeScreen = React.memo(({ onStartChat, toggleChatbot }: { onStartChat: () => void, toggleChatbot: () => void }) => (
    <div className={styles.customChatbotUi}>
      <div className={styles.customChatbotHeader}>
        <button onClick={toggleChatbot} className={styles.customCloseBtn}>×</button>
        <span className={styles.customBotTitle}>Chatbot</span>
        <div style={{width: '24px'}}></div>
      </div>
      <div className={styles.customChatbotWelcome}>
        <div className={styles.customWelcomeAvatar}>
          <Image 
            src={selectedAvatar} 
            alt="AI Avatar" 
            width={100}
            height={100}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div className={styles.customWelcomeTitle}>Hello<br />I&apos;m {botName}</div>
        <div className={styles.customWelcomeDesc}>{welcomeMessage}</div>
        <button className={styles.customWelcomeBtn} onClick={onStartChat}>
          Let&apos;s Chat!
        </button>
      </div>
    </div>
  ));
  WelcomeScreen.displayName = 'WelcomeScreen';

  // Check authentication on component mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Clear chat history only on page refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('chatbot_messages');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Save messages to sessionStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Reset chat event listener
  useEffect(() => {
    const handleResetChat = (event: CustomEvent<{ reset: boolean }>) => {
      if (event.detail?.reset) {
        setMessages([initialMessage]);
        setShowWelcome(true);
        setInput("");
        setSelectedAvatar('/images/user/Bot1.png');
        setBotName('Planet Pulse');
        setWelcomeMessage('How can I help you?');
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedChatbotAvatar', '/images/user/Bot1.png');
          localStorage.setItem('chatbotName', 'Planet Pulse');
          localStorage.setItem('chatbotWelcomeMessage', 'How can I help you?');
          sessionStorage.removeItem('chatbot_welcome_shown');
          sessionStorage.removeItem('chatbot_messages');
        }
      }
    };

    window.addEventListener('resetChat', handleResetChat as EventListener);
    return () => {
      window.removeEventListener('resetChat', handleResetChat as EventListener);
    };
  }, []);

  // Avatar change event listener
  useEffect(() => {
    const handleAvatarChange = (event: CustomEvent<{ avatarPath: string }>) => {
      const newAvatar = event.detail?.avatarPath;
      if (newAvatar) {
        setSelectedAvatar(newAvatar);
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedChatbotAvatar', newAvatar);
        }
      }
    };

    window.addEventListener('avatarChanged', handleAvatarChange as EventListener);
    return () => {
      window.removeEventListener('avatarChanged', handleAvatarChange as EventListener);
    };
  }, []);

  // Bot name change event listener
  useEffect(() => {
    const handleBotNameChange = (event: CustomEvent<{ name: string }>) => {
      const newName = event.detail?.name;
      if (newName) {
        setBotName(newName);
        if (typeof window !== 'undefined') {
          localStorage.setItem('chatbotName', newName);
        }
      }
    };

    window.addEventListener('botNameChanged', handleBotNameChange as EventListener);
    return () => {
      window.removeEventListener('botNameChanged', handleBotNameChange as EventListener);
    };
  }, []);

  // Welcome message change event listener
  useEffect(() => {
    const handleWelcomeMessageChange = (event: CustomEvent<{ message: string }>) => {
      const newMessage = event.detail?.message;
      if (newMessage) {
        setWelcomeMessage(newMessage);
        if (typeof window !== 'undefined') {
          localStorage.setItem('chatbotWelcomeMessage', newMessage);
        }
      }
    };

    window.addEventListener('welcomeMessageChanged', handleWelcomeMessageChange as EventListener);
    return () => {
      window.removeEventListener('welcomeMessageChanged', handleWelcomeMessageChange as EventListener);
    };
  }, []);

  // Scroll effect
  useEffect(() => {
    if (!showWelcome) {
      scrollToBottom();
    }
  }, [messages, showWelcome, scrollToBottom]);

  // Focus effect
  useEffect(() => {
    if (!showWelcome && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showWelcome]);

  // Focus after bot message
  useEffect(() => {
    if (
      !showWelcome &&
      messages.length > 0 &&
      messages[messages.length - 1].from === "bot" &&
      !messages[messages.length - 1].isTyping &&
      inputRef.current
    ) {
      inputRef.current.focus();
    }
  }, [messages, showWelcome]);

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show welcome screen if needed
  if (showWelcome) {
    return <WelcomeScreen 
      onStartChat={handleStartChat} 
      toggleChatbot={toggleChatbot} 
    />;
  }

  // Message bubble component
  const MessageBubble = React.memo(({ message }: { message: Message }) => {
    const bubbleClass = message.from === "bot" 
      ? `${styles.customMessageRow} ${styles.bot}`
      : `${styles.customMessageRow} ${styles.user}`;
      
    const messageClass = message.from === "bot"
      ? `${styles.customMessageBubble} ${styles.bot}`
      : `${styles.customMessageBubble} ${styles.user}`;
      
    return (
      <div className={bubbleClass}>
        <div
          className={messageClass}
          style={{ whiteSpace: 'pre-line', marginBottom: '0.5em' }}
        >
          {message.displayText || message.text}
          {message.isTyping && (
            <span className={styles.typingCursor}>|</span>
          )}
        </div>
      </div>
    );
  });
  MessageBubble.displayName = 'MessageBubble';

  // Main chat interface
  return (
    <div className={styles.customChatbotUi}>
      <div className={styles.customChatbotHeader}>
        <button onClick={toggleChatbot} className={styles.customCloseBtn}>×</button>
        <span className={styles.customBotTitle}>Hello, I&apos;m {botName}</span>
        <div style={{width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden'}}>
          <Image 
            src={selectedAvatar} 
            alt="AI Avatar" 
            width={50}
            height={50}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
      </div>
      
      <div className={styles.customChatbotMessages}>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        
        {loading && (
          <div className={`${styles.customMessageRow} ${styles.bot}`}>
            <div className={`${styles.customMessageBubble} ${styles.bot}`}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className={styles.customChatbotInputArea}>
        <input
          ref={inputRef}
          className={styles.customChatbotInput}
          type="text"
          placeholder="Message"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            fontSize: '25px',
            color: 'white',
            backgroundColor: "#007BFF",
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default React.memo(ChatbotComponent);