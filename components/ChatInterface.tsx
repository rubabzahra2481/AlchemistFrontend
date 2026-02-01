'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { colors, typography, spacing, borderRadius, shadows, motion, zIndex } from '../design-tokens';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { AICreditsBar } from './AICreditsBar';
import { ChatHistorySidebar, ChatSession } from './ChatHistorySidebar';
import { LLMSelector, LLMModel } from './LLMSelector';
// import { PsychologicalProfileDebug } from './PsychologicalProfileDebug'; // COMMENTED OUT FOR PRODUCTION

// Helper to get API URL
const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
  return isLocalhost 
    ? `http://${window.location.hostname}:5000`
    : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com';
};

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  psychologicalProfile?: any;
  profile?: any; // New structured profile from backend
  analysis?: any; // Legacy analysis for compatibility
  reasoning?: string;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, selectedLLM?: string) => Promise<any>;
  sessionId?: string;
  userId?: string; // User ID for fetching sessions and history
  onNewChat?: () => void; // Add callback to reset session in parent
  onSessionChange?: (sessionId: string) => void; // Add callback to update session in parent
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  sessionId,
  userId,
  onNewChat: onNewChatProp,
  onSessionChange
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiCredits, setAiCredits] = useState(0); // Real credit usage percentage
  const [creditWarning, setCreditWarning] = useState(false); // Warning at 80%
  const [creditMessage, setCreditMessage] = useState<string | undefined>(undefined); // Warning/error message
  const [showReasoning, setShowReasoning] = useState(true); // Always show LLM reasoning
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Open by default like ChatGPT
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsAuthTimeout, setSessionsAuthTimeout] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState<string>('gpt-4o');
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [latestProfile, setLatestProfile] = useState<any>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Cache key for localStorage
  const SESSIONS_CACHE_KEY = 'chat_sessions_cache';
  const SESSIONS_CACHE_TIMESTAMP_KEY = 'chat_sessions_cache_timestamp';

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll to bottom if there are messages (don't scroll on initial empty load)
    if (messages.length > 0) {
    scrollToBottom();
    }
  }, [messages]);

  // Load chat history when sessionId changes (e.g., when user returns to an existing session)
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!sessionId) {
        // No session ID - clear messages for new chat
        setMessages([]);
        return;
      }

      try {
        const apiUrl = `${getApiUrl()}/chat/session/${sessionId}/history`;
        
        const response = await fetch(apiUrl);

        if (response.ok) {
          const historyData = await response.json();
          // Transform backend messages to frontend format
          const transformedMessages: Message[] = historyData.map((msg: any, index: number) => {
            const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
            return {
              id: `${sessionId}-${index}`,
              content: msg.content,
              isUser: msg.role === 'user',
              timestamp: timestamp,
              reasoning: msg.reasoning,
              analysis: msg.analysis,
              profile: msg.profile,
            };
          });
          setMessages(transformedMessages);
        } else if (response.status === 404) {
          // Session doesn't exist yet - this is fine for new sessions
          setMessages([]);
        } else {
          console.error('Failed to load chat history:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [sessionId]);

  // Load available LLM models function (no auth required)
  const loadAvailableModels = useCallback(async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoadingModels(true);
    }
    
    const apiUrl = `${getApiUrl()}/chat/llms`;
    
    try {
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
          
          if (data.default && !selectedLLM) {
            setSelectedLLM(data.default);
          }
        } else {
          // Fallback to default models
          const fallbackModels = [
            { id: 'gpt-4o', name: 'gpt-4o', provider: 'openai', maxTokens: 4000 },
            { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', provider: 'openai', maxTokens: 2000 },
            { id: 'claude-3-5-sonnet', name: 'claude-3-5-sonnet-20241022', provider: 'claude', maxTokens: 4000 },
            { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', provider: 'gemini', maxTokens: 4000 },
          ];
          setAvailableModels(fallbackModels);
        }
      } else {
        // Fallback to default models on error
        const fallbackModels = [
          { id: 'gpt-4o', name: 'gpt-4o', provider: 'openai', maxTokens: 4000 },
          { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', provider: 'openai', maxTokens: 2000 },
          { id: 'claude-3-5-sonnet', name: 'claude-3-5-sonnet-20241022', provider: 'claude', maxTokens: 4000 },
          { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', provider: 'gemini', maxTokens: 4000 },
        ];
        setAvailableModels(fallbackModels);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      // Fallback to default models
      const fallbackModels = [
        { id: 'gpt-4o', name: 'gpt-4o', provider: 'openai', maxTokens: 4000 },
        { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', provider: 'openai', maxTokens: 2000 },
        { id: 'claude-3-5-sonnet', name: 'claude-3-5-sonnet-20241022', provider: 'claude', maxTokens: 4000 },
        { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', provider: 'gemini', maxTokens: 4000 },
      ];
      setAvailableModels(fallbackModels);
    } finally {
      if (showLoading) {
        setIsLoadingModels(false);
      }
    }
  }, [selectedLLM]);

  // Load models on mount (no auth required)
  useEffect(() => {
    loadAvailableModels(true);
  }, [loadAvailableModels]);

  // Load cached sessions from localStorage
  const loadCachedSessions = useCallback((): ChatSession[] => {
    try {
      if (typeof window === 'undefined') return [];
      
      const cachedData = localStorage.getItem(SESSIONS_CACHE_KEY);
      if (!cachedData) return [];
      
      const sessions: ChatSession[] = JSON.parse(cachedData).map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp), // Convert back to Date object
      }));
      
      console.log('📦 [ChatInterface] Loaded cached sessions:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('❌ [ChatInterface] Error loading cached sessions:', error);
      return [];
    }
  }, []);

  // Cache sessions to localStorage
  const cacheSessions = useCallback((sessions: ChatSession[]) => {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(sessions));
      localStorage.setItem(SESSIONS_CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 [ChatInterface] Cached sessions to localStorage:', sessions.length);
    } catch (error) {
      console.error('❌ [ChatInterface] Error caching sessions:', error);
    }
  }, []);

  // Load chat sessions function (no auth required)
  const loadChatSessions = useCallback(async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoadingSessions(true);
    }
    
    try {
      // Include userId to fetch sessions for this specific user
      const baseUrl = `${getApiUrl()}/chat/sessions`;
      const apiUrl = userId ? `${baseUrl}?userId=${userId}` : baseUrl;
      
      const response = await fetch(apiUrl);

      if (response.ok) {
        const sessionsData = await response.json();
        // Transform backend response to frontend format
        const transformedSessions: ChatSession[] = sessionsData.map((session: any) => {
          const timestamp = session.lastActivity || session.createdAt;
          return {
            id: session.id,
            title: session.title || 'Untitled Chat',
            lastMessage: session.lastMessage || '',
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            messageCount: session.messageCount || 0,
          };
        });
        setChatSessions(transformedSessions);
        
        // Cache sessions for next visit
        cacheSessions(transformedSessions);
        setSessionsAuthTimeout(false);
      } else {
        console.error('Failed to load chat sessions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      if (showLoading) {
        setIsLoadingSessions(false);
      }
    }
  }, [cacheSessions, userId]);

  // Load sessions on mount (no auth required)
  useEffect(() => {
    // Load cached sessions first for instant UI
    const cachedSessions = loadCachedSessions();
    if (cachedSessions.length > 0) {
      setChatSessions(cachedSessions);
    }
    
    // Then load fresh sessions from server
    loadChatSessions(true);
  }, [loadCachedSessions, loadChatSessions]);

  // Load credit usage statistics (no auth required)
  const loadCreditStats = useCallback(async () => {
    try {
      const apiUrl = `${getApiUrl()}/chat/credits`;

      const response = await fetch(apiUrl);

      if (response.ok) {
        const creditData = await response.json();
        setAiCredits(creditData.usagePercentage || 0);
        setCreditWarning(creditData.warning || false);
        setCreditMessage(creditData.message || undefined);
      }
    } catch (error) {
      console.error('Error loading credit stats:', error);
    }
  }, []);

  // Load credit stats on mount and after messages
  useEffect(() => {
    loadCreditStats();
  }, [loadCreditStats]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(inputValue, selectedLLM);
      
      // Update latest profile and analysis for debug panel
      if (response.profile) {
        setLatestProfile(response.profile);
      }
      if (response.analysis) {
        setLatestAnalysis(response.analysis);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
        psychologicalProfile: response.analysis, // Legacy
        profile: response.profile, // New structured profile
        analysis: response.analysis, // Legacy analysis
        reasoning: response.reasoning,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      console.log('✅ [ChatInterface] AI message added to state');
      console.log('📋 [ChatInterface] Response from backend:', response);
      console.log('📋 [ChatInterface] Response.sessionId:', response.sessionId);
      console.log('📋 [ChatInterface] Current sessionId:', sessionId);
      console.log('📋 [ChatInterface] onSessionChange available:', !!onSessionChange);
      
      // Update sessionId in parent if it's in the response
      if (response.sessionId && onSessionChange) {
        console.log('🔄 [ChatInterface] Updating sessionId in parent:', response.sessionId);
        onSessionChange(response.sessionId);
      }
      
      // Refresh chat sessions list after sending message (don't show loading state)
      console.log('🔄 [ChatInterface] ⚠️⚠️⚠️ AFTER MESSAGE: Refreshing chat sessions list...');
      console.log('🔄 [ChatInterface] ⚠️⚠️⚠️ This should have already loaded on mount!');
      console.log('🔄 [ChatInterface] Current chatSessions count:', chatSessions.length);
      await loadChatSessions(false); // false = don't show loading state
      console.log('✅ [ChatInterface] ⚠️⚠️⚠️ AFTER MESSAGE: Chat sessions refreshed');
      
      // Refresh credit stats after sending message
      await loadCreditStats();
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle credit limit exceeded (402)
      if (error.message?.includes('402') || error.message?.includes('Credit limit') || error.message?.includes('CREDIT_LIMIT')) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Your credit limit has been reached. Please upgrade your plan or wait for the next billing cycle to continue using AI Alchemist.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        // Refresh credit stats to show current status
        await loadCreditStats();
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'I apologize, but I encountered an error. Please try again.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  const handleSessionSelect = async (sessionId: string) => {
    setIsSidebarOpen(false);
    
    try {
      const apiUrl = `${getApiUrl()}/chat/session/${sessionId}/history`;
      
      const response = await fetch(apiUrl);

      if (response.ok) {
        const historyData = await response.json();
        // Transform backend messages to frontend format
        const transformedMessages: Message[] = historyData.map((msg: any, index: number) => {
          const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
          return {
            id: `${sessionId}-${index}`,
            content: msg.content,
            isUser: msg.role === 'user',
            timestamp: timestamp,
            reasoning: msg.reasoning,
            analysis: msg.analysis,
            profile: msg.profile,
          };
        });
        setMessages(transformedMessages);
        // Update sessionId in parent to maintain it
        if (onSessionChange) {
          onSessionChange(sessionId);
        }
      } else {
        console.error('Failed to load session history:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setIsSidebarOpen(false);
    // Clear any cached profile state
    setLatestProfile(null);
    setLatestAnalysis(null);
    // Reset session ID in parent component so backend generates a fresh one
    if (onNewChatProp) {
      onNewChatProp();
    }
    console.log('Starting new chat - session will be reset on next message');
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    try {
      const apiUrl = `${getApiUrl()}/chat/session/${sessionIdToDelete}`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`);
      }

      // Remove from local state
      setChatSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
      
      // Update cache
      const updatedSessions = chatSessions.filter(s => s.id !== sessionIdToDelete);
      cacheSessions(updatedSessions);

      // If deleted session was active, start new chat
      if (sessionIdToDelete === sessionId) {
        setMessages([]);
        if (onNewChatProp) {
          onNewChatProp();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };

  const handleRenameSession = async (sessionIdToRename: string, newTitle: string) => {
    try {
      const apiUrl = `${getApiUrl()}/chat/session/${sessionIdToRename}`;

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to rename session (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      // Success - update local state
      setChatSessions(prev => prev.map(s => 
        s.id === sessionIdToRename ? { ...s, title: newTitle } : s
      ));
      
      // Update cache
      const updatedSessions = chatSessions.map(s => 
        s.id === sessionIdToRename ? { ...s, title: newTitle } : s
      );
      cacheSessions(updatedSessions);
    } catch (error) {
      console.error('Error renaming session:', error);
      throw error;
    }
  };

  const handleLLMChange = (llmId: string) => {
    setSelectedLLM(llmId);
  };

  const handleEditStart = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditedContent(currentContent);
  };

  const handleEditChange = (content: string) => {
    setEditedContent(content);
  };

  const handleEditSave = async () => {
    if (!editingMessageId) return;
    
    // Find the index of the edited message
    const editedIndex = messages.findIndex(msg => msg.id === editingMessageId);
    if (editedIndex === -1) return;
    
    // Remove all messages after the edited one (including AI's old response)
    const messagesUpToEdit = messages.slice(0, editedIndex);
    
    // Update the edited message with new content
    const updatedMessage = { ...messages[editedIndex], content: editedContent };
    
    setMessages([...messagesUpToEdit, updatedMessage]);
    setEditingMessageId(null);
    setEditedContent('');
    setIsLoading(true);
    
    // Resend the edited message to get a fresh AI response
    try {
      const response = await onSendMessage(editedContent, selectedLLM);
      
      // Update profile and analysis
      if (response.profile) {
        setLatestProfile(response.profile);
      }
      if (response.analysis) {
        setLatestAnalysis(response.analysis);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
        psychologicalProfile: response.profile,
        analysis: response.analysis,
        reasoning: response.reasoning,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Refresh chat sessions list after sending edited message (don't show loading state)
      await loadChatSessions(false); // false = don't show loading state
    } catch (error) {
      console.error('Error regenerating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#FAF5F9',
      fontFamily: typography.body.fontFamily,
      overflow: 'hidden',
    }}>
      {/* Unified Header Bar - Spans full width */}
      <div style={{
        height: '56px',
        background: colors.white,
        borderBottom: `1px solid ${colors.gray200}`,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        boxShadow: '0 1px 0 rgba(0, 0, 0, 0.04)',
      }}>
        {/* Left section - Menu button + Title */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: 0,
        }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: colors.gray600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${motion.smooth}`,
              fontSize: '18px',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.gray100;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ☰
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <h1 style={{
              fontFamily: typography.h3.fontFamily, 
              fontSize: '16px', 
              lineHeight: '1.2',
              fontWeight: 600,
              color: colors.gray900,
              margin: 0,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                background: colors.architectScale,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                AI Alchemist
              </span>
            </h1>
          </div>
        </div>
        
        {/* Right section - Status indicators */}
        <div style={{
          marginLeft: 'auto',
          padding: '0 20px',
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <Link 
            href="/debug-panel"
            style={{
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              borderRadius: '6px',
              fontFamily: typography.caption.fontFamily,
              fontSize: '11px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '12px' }}>🔍</span>
            <span>Debug</span>
          </Link>
        </div>
      </div>

      {/* Content Area - Sidebar + Main Chat */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Sidebar - Part of layout, not overlay */}
        <ChatHistorySidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={chatSessions}
          activeSessionId={sessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          isLoading={isLoadingSessions}
          authTimeout={sessionsAuthTimeout}
          isLayoutSidebar={true}
        />

        {/* Main Chat Area */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {/* Messages Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '20px 16px' : '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '900px',
            width: '100%',
            margin: '0 auto',
          }}>
            {messages.length === 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: isMobile ? '0 20px' : '0',
              }}>
                <div style={{
                  width: isMobile ? '64px' : '72px',
                  height: isMobile ? '64px' : '72px',
                  borderRadius: '20px',
                  background: colors.architectScale,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: isMobile ? '20px' : '24px',
                  boxShadow: shadows.card,
                }}>
                  <span style={{ fontSize: isMobile ? '32px' : '36px' }}>🧠</span>
                </div>
                <h2 style={{
                  fontFamily: typography.h2.fontFamily, 
                  fontSize: isMobile ? '24px' : '32px', 
                  lineHeight: typography.h2.lineHeight,
                  fontWeight: 600,
                  color: colors.gray900,
                  marginBottom: isMobile ? '8px' : '12px',
                  letterSpacing: '-0.02em',
                }}>
                  Welcome to AI Alchemist
                </h2>
                <p style={{
                  fontFamily: typography.body.fontFamily,
                  fontSize: isMobile ? '15px' : "16px",
                  lineHeight: typography.body.lineHeight,
                  color: colors.gray600,
                  maxWidth: isMobile ? '100%' : '480px',
                  padding: isMobile ? '0 8px' : '0',
                  fontWeight: 400,
                }}>
                  I transform your thoughts and feelings into actionable growth. 
                  What would you like to explore today?
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                showReasoning={showReasoning}
                isEditing={editingMessageId === message.id}
                editedContent={editedContent}
                onEditStart={() => handleEditStart(message.id, message.content)}
                onEditChange={handleEditChange}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
              />
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: isMobile ? '16px' : '20px 24px 24px',
            background: colors.white,
            borderTop: `1px solid ${colors.gray200}`,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.02)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              maxWidth: '900px',
              width: '100%',
              margin: '0 auto',
            }}>
          <div style={{
            flex: 1,
            position: 'relative',
          }}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              disabled={isLoading}
              autoFocus={false}
              style={{
                width: '100%',
                minHeight: '56px',
                maxHeight: '200px',
                padding: '16px 18px',
                paddingRight: isMobile ? '60px' : '70px',
                border: `1.5px solid ${colors.border.base}`,
                borderRadius: '14px',
                fontFamily: typography.body.fontFamily,
                fontSize: '15px',
                lineHeight: '1.6',
                color: colors.text.primary,
                resize: 'none',
                outline: 'none',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                background: colors.white,
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.brandOrange.base;
                e.target.style.boxShadow = '0 0 0 3px rgba(246, 120, 47, 0.1), 0 4px 12px rgba(246, 120, 47, 0.15)';
                e.target.style.background = colors.white;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border.base;
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                e.target.style.background = colors.white;
              }}
            />
            
            {/* Integrated LLM Selector - Premium Positioning */}
            <div style={{
              position: 'absolute',
              right: isMobile ? '50px' : '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}>
              <LLMSelector
                selectedLLM={selectedLLM}
                onLLMChange={handleLLMChange}
                availableModels={availableModels}
                isLoading={isLoadingModels}
                isIntegrated={true}
              />
            </div>
            
            {/* Send Button - Integrated inside input with brand colors */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label={inputValue.trim() && !isLoading ? 'Send message' : 'Type a message to send'}
              aria-disabled={!inputValue.trim() || isLoading}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '32px',
                width: '32px',
                borderRadius: '50%',
                border: 'none',
                background: inputValue.trim() && !isLoading 
                  ? 'linear-gradient(135deg, #42047D 0%, #F6782F 100%)'
                  : colors.gray200,
                color: inputValue.trim() && !isLoading ? colors.white : colors.gray400,
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: inputValue.trim() && !isLoading 
                  ? '0 2px 6px rgba(66, 4, 125, 0.3), 0 1px 3px rgba(246, 120, 47, 0.25)' 
                  : 'none',
                opacity: (!inputValue.trim() || isLoading) ? 0.4 : 1,
                zIndex: 10,
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #35066A 0%, #D65F1F 100%)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(66, 4, 125, 0.35), 0 2px 4px rgba(246, 120, 47, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #42047D 0%, #F6782F 100%)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(66, 4, 125, 0.3), 0 1px 3px rgba(246, 120, 47, 0.25)';
                }
              }}
              onMouseDown={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }
              }}
              onFocus={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.outline = `2px solid ${colors.brandOrange.base}`;
                  e.currentTarget.style.outlineOffset = '2px';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
              title={inputValue.trim() && !isLoading ? 'Send message (Enter)' : 'Type a message to send'}
            >
              {isLoading ? (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  aria-hidden="true"
                  style={{
                    animation: 'spin 0.8s linear infinite',
                  }}
                >
                  <circle 
                    cx="8" 
                    cy="8" 
                    r="6" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeDasharray="19" 
                    strokeDashoffset="14"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </svg>
              ) : (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  aria-hidden="true"
                  style={{
                    transition: `transform 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  }}
                >
                  <path 
                    d="M8 2L8 14M8 2L3 7M8 2L13 7" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <style jsx>{`
                @keyframes spin {
                  from {
                    transform: rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}</style>
            </button>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Psychological Profile Debug Panel - COMMENTED OUT FOR PRODUCTION */}
      {/* Uncomment the section below to see detailed psychological analysis in debug panel */}
      {/* 
      <PsychologicalProfileDebug 
        profile={latestProfile}
        analysis={latestAnalysis}
      />
      */}
    </div>
  );
};



