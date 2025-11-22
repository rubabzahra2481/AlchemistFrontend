'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { colors, typography, spacing, borderRadius, shadows, motion } from '../design-tokens';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { AICreditsBar } from './AICreditsBar';
import { ChatHistorySidebar, ChatSession } from './ChatHistorySidebar';
import { LLMSelector, LLMModel } from './LLMSelector';
import { refreshTokenOn401, getStoredToken } from '../utils/token-handler';
// import { PsychologicalProfileDebug } from './PsychologicalProfileDebug'; // COMMENTED OUT FOR PRODUCTION

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
  onNewChat?: () => void; // Add callback to reset session in parent
  onSessionChange?: (sessionId: string) => void; // Add callback to update session in parent
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  sessionId,
  onNewChat: onNewChatProp,
  onSessionChange
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiCredits, setAiCredits] = useState(75); // Example: 75% filled
  const [showReasoning, setShowReasoning] = useState(true); // Always show LLM reasoning
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        // Get Supabase token from localStorage
        const token = getStoredToken();

        if (!token) {
          console.log('No token available - skipping history load');
          return;
        }

        // Use deployed backend URL for production, localhost for development
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
        
        const apiUrl = isLocalhost 
          ? `http://${window.location.hostname}:5000/chat/session/${sessionId}/history`
          : `https://ptvmvy9qhn.us-east-1.awsapprunner.com/chat/session/${sessionId}/history`;
        
        // Wrap API call for 401 refresh handling
        const makeHistoryCall = async (authToken: string) => {
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });

          if (response.ok) {
            const historyData = await response.json();
            // Transform backend messages to frontend format
            const transformedMessages: Message[] = historyData.map((msg: any, index: number) => {
              console.log('📥 [ChatInterface] Loading message from session select:', msg.role, 'timestamp:', msg.timestamp, 'type:', typeof msg.timestamp);
              const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
              console.log('📥 [ChatInterface] Parsed timestamp:', timestamp, 'isValid:', !isNaN(timestamp.getTime()));
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
            console.log('✅ [ChatInterface] Transformed messages for session:', transformedMessages);
            setMessages(transformedMessages);
            return transformedMessages;
          } else if (response.status === 404) {
            // Session doesn't exist yet - this is fine for new sessions
            setMessages([]);
            return [];
          } else if (response.status === 401) {
            // Token expired - signal for refresh handler
            throw new Error('TOKEN_EXPIRED');
          } else {
            throw new Error(`Failed to load chat history: ${response.status} ${response.statusText}`);
          }
        };

        try {
          await makeHistoryCall(token);
        } catch (error: any) {
          // Handle 401 with automatic refresh and retry
          if (error.message === 'TOKEN_EXPIRED') {
            console.log('🔄 [ChatInterface] Token expired, refreshing and retrying history load...');
            await refreshTokenOn401(makeHistoryCall);
          } else {
            console.error('Failed to load chat history:', error);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [sessionId]);

  // Fetch available LLM models
  useEffect(() => {
    const fetchAvailableModels = async () => {
      try {
        // Get Supabase token from localStorage
        const token = getStoredToken();

        // Use deployed backend URL for production, localhost for development
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
        
        const apiUrl = isLocalhost 
          ? `http://${window.location.hostname}:5000/chat/llms`
          : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com/chat/llms';
        
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`; // ✅ Send token for authenticated endpoints
        }
        
        const response = await fetch(apiUrl, { headers });
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || []);
          if (data.default && !selectedLLM) {
            setSelectedLLM(data.default);
          }
        }
      } catch (error) {
        console.error('Error fetching available models:', error);
        // Fallback to default models
        setAvailableModels([
          { id: 'gpt-4o', name: 'gpt-4o', provider: 'openai', maxTokens: 4000 },
          { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', provider: 'openai', maxTokens: 2000 },
          { id: 'claude-3-5-sonnet', name: 'claude-3-5-sonnet-20241022', provider: 'claude', maxTokens: 4000 },
          { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', provider: 'gemini', maxTokens: 4000 },
        ]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchAvailableModels();
  }, []);

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

  // Load chat sessions function (extracted for reuse)
  const loadChatSessions = useCallback(async (showLoading: boolean = true) => {
    console.log('🔄 [ChatInterface] loadChatSessions() called');
    
    if (showLoading) {
      setIsLoadingSessions(true);
    }
    
    try {
      // Get Supabase token from localStorage
      const token = getStoredToken();

      if (!token) {
        console.warn('⚠️ [ChatInterface] No token available - skipping session load');
        if (showLoading) {
          setIsLoadingSessions(false);
        }
        return;
      }

      // Use deployed backend URL for production, localhost for development
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
      
      const apiUrl = isLocalhost 
        ? `http://${window.location.hostname}:5000/chat/sessions`
        : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com/chat/sessions';
      
      console.log('🌐 [ChatInterface] API URL for sessions:', apiUrl);
      
      console.log('📡 [ChatInterface] Fetching sessions from:', apiUrl);
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 [ChatInterface] Sessions response status:', response.status);
      if (response.ok) {
        const sessionsData = await response.json();
        console.log('✅ [ChatInterface] Sessions data received:', sessionsData);
        console.log('✅ [ChatInterface] Number of sessions:', sessionsData?.length || 0);
        // Transform backend response to frontend format
        const transformedSessions: ChatSession[] = sessionsData.map((session: any) => {
          const timestamp = session.lastActivity || session.createdAt;
          console.log('📅 [ChatInterface] Processing session:', session.id, 'timestamp:', timestamp, 'type:', typeof timestamp);
          return {
            id: session.id,
            title: session.title || 'Untitled Chat',
            lastMessage: session.lastMessage || '',
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            messageCount: session.messageCount || 0,
          };
        });
        console.log('✅ [ChatInterface] Transformed sessions:', transformedSessions);
        setChatSessions(transformedSessions);
        // Cache sessions for next visit
        cacheSessions(transformedSessions);
        console.log('✅ [ChatInterface] setChatSessions() called with', transformedSessions.length, 'sessions');
        setIsLoadingSessions(false);
        setSessionsAuthTimeout(false); // Clear timeout flag on success
      } else if (response.status === 401) {
        console.warn('⚠️ [ChatInterface] Unauthorized - token may be expired');
        console.warn('⚠️ [ChatInterface] Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to refresh token and retry
        try {
          console.log('🔄 [ChatInterface] Attempting to refresh token and retry...');
          await refreshTokenOn401(async (newToken: string) => {
            const retryResponse = await fetch(apiUrl, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
              },
            });
            
            if (retryResponse.ok) {
              const sessionsData = await retryResponse.json();
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
              // Cache refreshed sessions
              cacheSessions(transformedSessions);
              console.log('✅ [ChatInterface] Sessions loaded after token refresh');
              setIsLoadingSessions(false);
              setSessionsAuthTimeout(false);
            } else {
              throw new Error(`Failed to load sessions after refresh: ${retryResponse.status}`);
            }
          });
        } catch (error) {
          console.error('❌ [ChatInterface] Failed to refresh token and retry:', error);
        }
      } else if (response.status === 404) {
        console.error('❌ [ChatInterface] Endpoint not found (404) - backend may not have /chat/sessions endpoint deployed');
        console.error('❌ [ChatInterface] API URL was:', apiUrl);
        console.error('❌ [ChatInterface] Response status:', response.status);
        console.error('❌ [ChatInterface] This endpoint should exist in backend/src/controllers/chat.controller.ts');
      } else {
        console.error('❌ [ChatInterface] Failed to load chat sessions:', response.status, response.statusText);
        const errorText = await response.text().catch(() => 'Could not read error');
        console.error('❌ [ChatInterface] Error response:', errorText);
        setIsLoadingSessions(false);
      }
    } catch (error) {
      console.error('❌ [ChatInterface] Error loading chat sessions:', error);
      setIsLoadingSessions(false);
    }
  }, [cacheSessions]);

  // Option 5 (Hybrid): Load cached sessions on mount, then poll for token and refresh
  useEffect(() => {
    console.log('🚀 [ChatInterface] Component mounted - implementing Option 5 Hybrid');
    
    let pollInterval: NodeJS.Timeout | null = null;
    
    // Step 1: Load cached sessions immediately (Option 4)
    const cachedSessions = loadCachedSessions();
    if (cachedSessions.length > 0) {
      console.log('📦 [ChatInterface] Showing cached sessions immediately:', cachedSessions.length);
      setChatSessions(cachedSessions);
    }
    
    // Step 2: Check if token is already available
    const token = getStoredToken();
    if (token) {
      // Token available immediately - load fresh sessions
      console.log('✅ [ChatInterface] Token available - loading fresh sessions');
      loadChatSessions(true);
    } else {
      // Step 3: Start polling for token (Option 3)
      console.log('⏳ [ChatInterface] Token not available - starting polling');
      setIsLoadingSessions(true);
      
      let pollCount = 0;
      const maxPolls = 15; // 15 seconds max (15 polls × 1 second)
      pollInterval = setInterval(() => {
        pollCount++;
        const currentToken = getStoredToken();
        
        if (currentToken) {
          // Token arrived - load fresh sessions
          console.log('✅ [ChatInterface] Token detected after polling - loading fresh sessions');
          if (pollInterval) clearInterval(pollInterval);
          loadChatSessions(true);
          setIsLoadingSessions(false);
        } else if (pollCount >= maxPolls) {
          // Timeout reached - show auth message (Option 2)
          console.warn('⏰ [ChatInterface] Token polling timeout - showing auth message');
          if (pollInterval) clearInterval(pollInterval);
          setIsLoadingSessions(false);
          setSessionsAuthTimeout(true);
        }
      }, 1000); // Poll every 1 second
    }
    
    // Cleanup on unmount
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loadCachedSessions, loadChatSessions]);

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
      console.log('🔄 [ChatInterface] Refreshing chat sessions list...');
      await loadChatSessions(false); // false = don't show loading state
      console.log('✅ [ChatInterface] Chat sessions refreshed');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSessionSelect = async (sessionId: string) => {
    setIsSidebarOpen(false);
    
    try {
      // Get Supabase token from localStorage
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('supabase_token') || localStorage.getItem('sb_token')
        : null;

      if (!token) {
        console.error('No token available - cannot load session');
        return;
      }

      // Use deployed backend URL for production, localhost for development
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
      
      const apiUrl = isLocalhost 
        ? `http://${window.location.hostname}:5000/chat/session/${sessionId}/history`
        : `https://ptvmvy9qhn.us-east-1.awsapprunner.com/chat/session/${sessionId}/history`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const historyData = await response.json();
        // Transform backend messages to frontend format
        const transformedMessages: Message[] = historyData.map((msg: any, index: number) => {
          console.log('📥 [ChatInterface] Loading message from history:', msg.role, 'timestamp:', msg.timestamp, 'type:', typeof msg.timestamp);
          const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
          console.log('📥 [ChatInterface] Parsed timestamp:', timestamp, 'isValid:', !isNaN(timestamp.getTime()));
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
      background: `linear-gradient(135deg, ${colors.architectIndigo}15 0%, ${colors.scaleOrange}15 100%)`,
      fontFamily: typography.body.fontFamily,
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '16px' : spacing.containerPadding.desktop,
        background: colors.white,
        borderBottom: `1px solid ${colors.precisionPink}20`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '12px' : '0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleSidebarToggle}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: borderRadius.sm,
              border: 'none',
              background: isSidebarOpen ? colors.architectScale : `${colors.precisionPink}20`,
              color: isSidebarOpen ? colors.white : colors.deepPlum,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${motion.cardHover}`,
              fontSize: '18px',
            }}
            onMouseEnter={(e) => {
              if (!isSidebarOpen) {
                e.currentTarget.style.background = colors.precisionPink;
                e.currentTarget.style.color = colors.white;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSidebarOpen) {
                e.currentTarget.style.background = `${colors.precisionPink}20`;
                e.currentTarget.style.color = colors.deepPlum;
              }
            }}
          >
            ☰
          </button>
          
        <div>
          <h1 style={{
              fontFamily: typography.h1.fontFamily, 
              fontSize: isMobile ? '32px' : "64px", 
              lineHeight: typography.h1.lineHeight,
            color: colors.architectIndigo,
            margin: 0,
            background: colors.architectScale,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            }}            >
              AI Alchemist
          </h1>
          <p style={{
              fontFamily: typography.caption.fontFamily,
              fontSize: isMobile ? '11px' : '13px',
              lineHeight: typography.caption.lineHeight,
            color: colors.deepPlum,
            margin: '4px 0 0 0',
          }}>
              Transforming thoughts into growth
          </p>
          </div>
        </div>
        
        <div style={{
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <AICreditsBar credits={aiCredits} />
          
          <div style={{
              padding: '8px 16px',
            background: `${colors.precisionPink}10`,
              borderRadius: borderRadius.sm,
            border: `1px solid ${colors.precisionPink}30`,
              fontFamily: typography.caption.fontFamily,
              fontSize: typography.caption.fontSize.desktop,
            color: colors.deepPlum,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
          }}>
            <span>🧠</span>
            <span>Psychological analysis active</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '16px' : spacing.containerPadding.desktop,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            color: colors.deepPlum,
            padding: isMobile ? '0 20px' : '0',
          }}>
            <div style={{
              width: isMobile ? '64px' : '80px',
              height: isMobile ? '64px' : '80px',
              borderRadius: '50%',
              background: colors.architectScale,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: isMobile ? '16px' : '24px',
            }}>
              <span style={{ fontSize: isMobile ? '28px' : '32px' }}>🧠</span>
            </div>
            <h2 style={{
              fontFamily: typography.h2.fontFamily, 
              fontSize: isMobile ? '24px' : "64px", 
              lineHeight: isMobile ? '1.2' : typography.h2.lineHeight,
              color: colors.architectIndigo,
              marginBottom: isMobile ? '12px' : '16px',
            }}>
              Welcome to AI Alchemist
            </h2>
            <p style={{
              fontFamily: typography.body.fontFamily,
              fontSize: isMobile ? '15px' : "16px",
              lineHeight: isMobile ? '1.5' : typography.body.lineHeight,
              color: colors.deepPlum,
              maxWidth: isMobile ? '100%' : '400px',
              padding: isMobile ? '0 8px' : '0',
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
        padding: isMobile ? '16px' : spacing.containerPadding.desktop,
        background: colors.white,
        borderTop: `1px solid ${colors.precisionPink}20`,
      }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}>
          <div style={{
            flex: 1,
            position: 'relative',
            marginRight: '8px',
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
                minHeight: '48px',
                maxHeight: '120px',
                padding: '12px 16px',
                paddingRight: isMobile ? '110px' : '120px', // Make room for LLM selector
                border: `2px solid ${colors.precisionPink}30`,
                borderRadius: borderRadius.md,
                fontFamily: typography.body.fontFamily,
                fontSize: typography.body.fontSize.desktop,
                lineHeight: typography.body.lineHeight,
                color: colors.black,
                resize: 'none',
                outline: 'none',
                transition: `border-color ${motion.cardHover}`,
                background: colors.white,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.scaleOrange;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${colors.precisionPink}30`;
              }}
            />
            
            {/* Integrated LLM Selector */}
            <div style={{
              position: 'absolute',
              right: '8px',
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
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              height: '48px',
              width: '48px',
              borderRadius: '50%',
              border: 'none',
              background: inputValue.trim() && !isLoading 
                ? colors.architectScale 
                : `${colors.precisionPink}30`,
              color: colors.white,
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${motion.cardHover}`,
              boxShadow: inputValue.trim() && !isLoading ? shadows.md : 'none',
              flexShrink: 0,
              marginLeft: '4px',
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.background = colors.ctaHover;
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.background = colors.architectScale;
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <span style={{ 
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transform: 'translateY(-1px)'
            }}>
              {isLoading ? '⏳' : '➤'}
            </span>
          </button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={chatSessions}
        activeSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isLoading={isLoadingSessions}
        authTimeout={sessionsAuthTimeout}
      />

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



