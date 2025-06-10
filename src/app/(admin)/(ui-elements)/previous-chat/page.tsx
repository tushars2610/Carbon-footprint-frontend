'use client';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { getBaseUrl, getDomain } from '@/utils/domainConfig';
import { Send, User } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';

// Define custom event interface
interface CustomEvent<T = unknown> extends Event {
  detail?: T;
}
interface Source {
  title: string;
  url: string;
}
// API Response interface
interface ApiResponse {
  query: string;
  answer: string;
  sources: Source;
}

// API Request interface
interface ApiRequest {
  query: string;
  num_results: number;
  similarity_threshold: number;
  session_id: string;
  use_session_history: boolean;
  session_history_title: string;
}

// Message interface
interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  isTyping: boolean;
}

// Markdown rendering function
const renderMarkdown = (text: string) => {
  // Handle line breaks first
  let html = text.replace(/\n/g, '<br>');

  // Handle bold text (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Handle italic text (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f4f4f4; padding: 8px; border-radius: 4px; overflow-x: auto; margin: 8px 0;"><code>$1</code></pre>');

  // Handle inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code style="background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');

  // Handle headers (# ## ###)
  html = html.replace(/^### (.*$)/gm, '<h3 style="margin: 12px 0 8px 0; font-size: 1.1em; font-weight: bold;">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 style="margin: 16px 0 8px 0; font-size: 1.25em; font-weight: bold;">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 style="margin: 20px 0 8px 0; font-size: 1.5em; font-weight: bold;">$1</h1>');

  // Handle unordered lists (- or *)
  html = html.replace(/^[\-\*] (.*)$/gm, '<li style="margin-left: 20px;">$1</li>');
  html = html.replace(/(<li.*<\/li>)/gm, '<ul style="margin: 8px 0; padding-left: 0;">$1</ul>');

  // Handle ordered lists (1. 2. 3.)
  html = html.replace(/^(\d+)\. (.*)$/gm, '<li style="margin-left: 20px;">$2</li>');
  html = html.replace(/(<li.*<\/li>)/gm, '<ol style="margin: 8px 0; padding-left: 0;">$1</ol>');

  // Handle links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>');

  return html;
};

// Message content component
const MessageContent = ({ content, isTyping }: { content: string; isTyping: boolean }) => {
  const renderedContent = renderMarkdown(content);

  return (
    <div className="text-sm sm:text-base leading-relaxed">
      <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">|</span>
      )}
    </div>
  );
};

interface ConversationHistory {
  query: string;
  response: string;
}

interface Conversation {
  title: string;
  domain: string;
  history: ConversationHistory[];
}

interface ConversationResponse {
  message: string;
  conversation: Conversation;
}

function ChatComponent() {
  // Initialize states with default values
  const [selectedAvatar, setSelectedAvatar] = useState<string>('/images/user/Bot1.png');
  const [botName, setBotName] = useState<string>('AI Agent');
  const [numResults, setNumResults] = useState<number>(15);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.5);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    type: 'assistant',
    content: 'Hello! I\'m AI Agent. How can I help you today?',
    isTyping: false,
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavePopupOpen, setIsSavePopupOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveAlert, setSaveAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const title = searchParams.get('title');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []); // Memoize scrollToBottom function

  // Fetch conversation history when component mounts or title changes
  useEffect(() => {
    const fetchConversation = async () => {
      if (!title) return;

      try {
        const userEmail = localStorage.getItem('userEmail') || '';
        const domain = getDomain(userEmail);
        const baseUrl = getBaseUrl();

        const response = await fetch(`${baseUrl}/domain/${domain}/session/${title}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ConversationResponse = await response.json();
        
        // Convert conversation history to messages
        const conversationMessages: Message[] = data.conversation.history.flatMap((item, index) => [
          {
            id: index * 2 + 1,
            type: 'user',
            content: item.query,
            isTyping: false,
          },
          {
            id: index * 2 + 2,
            type: 'assistant',
            content: item.response,
            isTyping: false,
          }
        ]);

        // Add initial greeting if there are no messages
        if (conversationMessages.length === 0) {
          conversationMessages.push({
            id: 1,
            type: 'assistant',
            content: 'Hello! I\'m AI Agent. How can I help you today?',
            isTyping: false,
          });
        }

        setMessages(conversationMessages);
        setBotName(data.conversation.title);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        setMessages([{
          id: 1,
          type: 'assistant',
          content: 'Sorry, I couldn\'t load the conversation history. Please try again later.',
          isTyping: false,
        }]);
      }
    };

    fetchConversation();
  }, [title]); // Only depend on title

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    // Generate new session ID only if not exists
    if (!sessionId) {
      setSessionId(generateUniqueTimestamp());
    }
  }, [sessionId]); // Add sessionId as dependency

  // Load saved states from localStorage
  useEffect(() => {
    if (!isClient) return;

    const savedAvatar = localStorage.getItem('selectedChatbotAvatar');
    const savedBotName = localStorage.getItem('chatbotName');
    const savedNumResults = localStorage.getItem('numResults');
    const savedSimilarityThreshold = localStorage.getItem('similarityThreshold');

    if (savedAvatar) setSelectedAvatar(savedAvatar);
    if (savedBotName) setBotName(savedBotName);
    if (savedNumResults) setNumResults(Number(savedNumResults));
    if (savedSimilarityThreshold) setSimilarityThreshold(Number(savedSimilarityThreshold));
  }, [isClient]); // Only depend on isClient

  // Save messages to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]); // Only depend on messages

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isChatVisible) {
      scrollToBottom();
    }
  }, [messages, isChatVisible, scrollToBottom]); // Add scrollToBottom as dependency

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
  }, []); // Empty dependency array as this should only run once

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
  }, []); // Empty dependency array as this should only run once

  // Reset chat event listener
  useEffect(() => {
    const handleResetChat = (event: CustomEvent<{ reset: boolean }>) => {
      if (event.detail?.reset) {
        setSelectedAvatar('/images/user/Bot1.png');
        setBotName('Planet Pulse');
        setMessages([
          {
            id: Date.now(),
            type: 'assistant',
            content: `Hello! I'm Planet Pulse. How can I help you today?`,
            isTyping: false,
          },
        ]);
        setInput('');
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedChatbotAvatar', '/images/user/Bot1.png');
          localStorage.setItem('chatbotName', 'Planet Pulse');
          sessionStorage.removeItem('chatbot_messages');
        }
      }
    };

    window.addEventListener('resetChat', handleResetChat as EventListener);
    return () => {
      window.removeEventListener('resetChat', handleResetChat as EventListener);
    };
  }, []); // Empty dependency array as this should only run once

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent<{ numResults: number; similarityThreshold: number }>) => {
      if (event.detail) {
        setNumResults(event.detail.numResults);
        setSimilarityThreshold(event.detail.similarityThreshold);
      }
    };

    window.addEventListener('llmSettingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('llmSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []); // Empty dependency array as this should only run once

  //Unique Session Id Generation
  function generateUniqueTimestamp(): string {
    const now = new Date();
  
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const millis = now.getMilliseconds().toString().padStart(3, '0');
  
    return `${year}${month}${day}${hour}${minute}${second}${millis}`;
  }

  

  // API call function
  const callApi = async (query: string): Promise<string> => {
    try {
      const userEmail = localStorage.getItem('userEmail') || '';
      const domain = getDomain(userEmail);
      const baseUrl = getBaseUrl();
      const title = searchParams.get('title') || '';

      const requestBody: ApiRequest = {
        query: query,
        num_results: numResults,
        similarity_threshold: similarityThreshold,
        session_id: sessionId,
        use_session_history: true,
        session_history_title: title
      };

      const response = await fetch(`${baseUrl}/query/${domain}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      return data.answer;
    } catch (error) {
      console.error('API call failed:', error);
      return "I'm sorry, I'm having trouble connecting to the server right now. Please try again later.";
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: input,
      isTyping: false,
    };

    const currentInput = input;
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the API
      const apiResponse = await callApi(currentInput);
      const assistantMessageId = Date.now() + 1;

      // Add empty message first
      const assistantMessage: Message = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        isTyping: true,
      };

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Type out the message character by character
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= apiResponse.length) {
          setMessages((prev: Message[]) =>
            prev.map((msg: Message) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  content: apiResponse.slice(0, currentIndex),
                  isTyping: currentIndex < apiResponse.length,
                }
                : msg
            )
          );
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 10);
    } catch (error) {
      console.error('Error in API response:', error);
      setIsLoading(false);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm sorry, something went wrong. Please try again.",
        isTyping: false,
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    }
  };

  const handleSaveChat = async () => {
    if (saveName.trim()) {
      try {
        const userEmail = localStorage.getItem('userEmail') || '';
        const domain = getDomain(userEmail);
        const baseUrl = getBaseUrl();

        const response = await fetch(`${baseUrl}/domain/${domain}/save-session`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            title: saveName.trim()
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setSaveAlert({
            type: 'error',
            message: data.detail || 'Failed to save chat. Please try again.'
          });
          return;
        }

        // Close popup first
        setIsSavePopupOpen(false);
        setSaveName('');
        
        // Show success alert outside
        setSaveAlert({
          type: 'success',
          message: data.message || `Session saved successfully as '${data.title}' in domain ${data.domain}`
        });

        // Clear chat after successful save
        setMessages([{
          id: Date.now(),
          type: 'assistant',
          content: 'Hello! I\'m Planet Pulse. How can I help you today?',
          isTyping: false,
        }]);
        setSessionId(generateUniqueTimestamp()); // Generate new session ID for next chat
        sessionStorage.removeItem('chatbot_messages');

        // Clear success alert after 3 seconds
        setTimeout(() => {
          setSaveAlert(null);
        }, 3000);
      } catch (error) {
        console.error('Error saving chat:', error);
        setSaveAlert({
          type: 'error',
          message: 'Failed to save chat. Please try again.'
        });
      }
    }
  };

  const handleCancelSave = () => {
    setIsSavePopupOpen(false);
    setSaveName('');
    setSaveAlert(null);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Threads" subPage="Previous Chat" />
      {/* Success Alert - Outside Popup */}
      {saveAlert?.type === 'success' && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg shadow-lg">
          {saveAlert.message}
        </div>
      )}

      {/* Floating Chat Toggle Button */}
      <button
        onClick={() => setIsChatVisible(!isChatVisible)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 hover:scale-105 rounded-full flex items-center justify-center shadow-lg transition-colors duration-1000"
        title={isChatVisible ? "Hide Chat" : "Show Chat"}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
          {isClient && (
            <Image
              src={selectedAvatar}
              alt="AI Avatar"
              width={20}
              height={20}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      </button>

      {/* Chat Container - Conditionally Rendered */}
      {isChatVisible && (
        <div className="rounded-2xl border w-full min-h-screen border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12 flex justify-center items-center">
          <div className="rounded-2xl border w-full border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12 flex justify-center items-center">
            <div className="mx-auto w-full max-w-4xl flex flex-col h-full py-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {botName}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask me anything and I&apos;ll do my best to help!
                </p>
              </div>

              {/* Chat Container */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-6 space-y-6 max-h-96 lg:max-h-none">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'assistant' && isClient && (
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Image
                            src={selectedAvatar}
                            alt="AI Avatar"
                            width={20}
                            height={20}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      <div
                        className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white ml-auto'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <MessageContent content={message.content} isTyping={message.isTyping} />
                      </div>

                      {message.type === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && isClient && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Image
                          src={selectedAvatar}
                          alt="AI Avatar"
                          width={20}
                          height={20}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="relative">
                  <div className="flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Type your message here..."
                      className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
                      disabled={isLoading}
                    />

                    {/* Send Button */}
                    <button
                      onClick={() => handleSubmit()}
                      disabled={!input.trim() || isLoading}
                      className="flex-shrink-0 w-10 h-10 [background-color:#465FFF] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors duration-200"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Chat Popup */}
      {isSavePopupOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 border-2 border-white">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Save Chat
            </h2>
            {saveAlert?.type === 'error' && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {saveAlert.message}
              </div>
            )}
            <input
              type="text"
              value={saveName}
              onChange={(e) => {
                setSaveName(e.target.value);
                setSaveAlert(null); // Clear alert when user types
              }}
              placeholder="Enter chat name..."
              className="w-full px-4 py-3 mb-4 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChat}
                disabled={!saveName.trim()}
                className="px-4 py-2 [background-color:#465FFF] text-white rounded-xl hover:[background-color:#3b4ccc] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PreviousChat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatComponent />
    </Suspense>
  );
}