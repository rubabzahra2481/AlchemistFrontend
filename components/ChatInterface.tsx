'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { colors, typography, spacing, borderRadius, shadows, motion, zIndex } from '../design-tokens';
import { MessageBubble } from './MessageBubble';
// TypingIndicator removed - using inline streaming indicators in MessageBubble
import { AICreditsBar } from './AICreditsBar';
import { ChatHistorySidebar, ChatSession } from './ChatHistorySidebar';
import { LLMSelector, LLMModel } from './LLMSelector';
import { TierBadge } from './TierBadge';
// import { PsychologicalProfileDebug } from './PsychologicalProfileDebug'; // COMMENTED OUT FOR PRODUCTION

// Helper to get API URL (treat localhost and 127.0.0.1 as local so TIER_OVERRIDE / local backend is used)
const getApiUrl = () => {
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('192.168'));
  return isLocal
    ? `http://${window.location.hostname}:9000`
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
  // Streaming state
  isStreaming?: boolean;
  streamingPhase?: 'analyzing' | 'generating' | 'done';
  streamingReasoning?: string; // Reasoning being streamed
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, selectedLLM?: string, onStream?: (chunk: any) => void) => Promise<any>;
  sessionId?: string;
  userId?: string; // User ID for fetching sessions and history
  onNewChat?: () => void; // Add callback to reset session in parent
  onSessionChange?: (sessionId: string) => void; // Add callback to update session in parent
  decisionIntelligenceMode?: boolean;
  onToggleDecisionMode?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  sessionId,
  userId,
  onNewChat: onNewChatProp,
  onSessionChange,
  decisionIntelligenceMode = false,
  onToggleDecisionMode,
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
  const [selectedLLM, setSelectedLLM] = useState<string>('gpt-4o-mini'); // Free tier default
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

  // Track if we're in the middle of an active chat (to avoid reloading history)
  // Using a REF instead of state to avoid stale closure issues in useEffect
  const isActiveChatRef = useRef(false);
  
  // Load chat history when sessionId changes (e.g., when user returns to an existing session)
  // BUT NOT when we just got a new sessionId from our own message
  useEffect(() => {
    console.log('⚡⚡⚡ [useEffect TRIGGERED] sessionId changed to:', sessionId, 'isActiveChatRef.current:', isActiveChatRef.current);
    
    const loadChatHistory = async () => {
      if (!sessionId) {
        // No session ID - clear messages for new chat
        console.log('❌ [useEffect] No sessionId - clearing messages');
        setMessages([]);
        isActiveChatRef.current = false;
        return;
      }

      // IMPORTANT: If we already have messages (active chat), DON'T reload from API
      // Using ref.current to get the LATEST value (avoids stale closure)
      console.log('🔍 [useEffect] Checking isActiveChatRef.current:', isActiveChatRef.current);
      if (isActiveChatRef.current) {
        console.log('🔒🔒🔒 [useEffect] SKIPPING history reload - active chat session');
        return;
      }
      console.log('📜📜📜 [useEffect] WILL LOAD history from API - this will OVERWRITE messages!');

      try {
        console.log('📜 [ChatInterface] Loading history for session:', sessionId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only run when sessionId changes, NOT when isActiveChatSession changes

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

  const [creditsBlocked, setCreditsBlocked] = useState(false);
  const [maxInputWords, setMaxInputWords] = useState<number>(300); // default Free limit

  // Load credit usage from tier-info endpoint (same API iOS uses)
  const loadCreditStats = useCallback(async () => {
    const uid = userId || 'ANONYMOUS_USER_ID';
    try {
      const apiUrl = `${getApiUrl()}/chat/tier-info/${uid}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        const credits = data.credits;
        if (credits) {
          setAiCredits(credits.usagePercentage || 0);
          setCreditWarning(credits.warning || false);
          setCreditMessage(credits.message || undefined);
          setCreditsBlocked(!credits.allowed);
        }
        // Set word limit from tier limits (maxInputWords = maxInputTokens * 0.75 approx)
        if (data.limits?.maxInputWords) {
          setMaxInputWords(data.limits.maxInputWords);
        }
      }
    } catch (error) {
      console.error('Error loading credit stats:', error);
    }
  }, [userId]);

  // Count words in the input
  const wordCount = inputValue.trim() === '' ? 0 : inputValue.trim().split(/\s+/).length;
  const wordLimitExceeded = wordCount > maxInputWords;
  const wordLimitWarning = wordCount > maxInputWords * 0.8 && !wordLimitExceeded;
  const wordCountColor = wordLimitExceeded
    ? '#DC2626'
    : wordLimitWarning
    ? '#D97706'
    : wordCount > 0
    ? '#6B7280'
    : 'transparent';

  // Load credit stats on mount and after messages
  useEffect(() => {
    loadCreditStats();
  }, [loadCreditStats]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || creditsBlocked || wordLimitExceeded) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);
    
    // Mark that we're in an active chat - prevents history reload when sessionId updates
    // Using ref to avoid stale closure issues
    isActiveChatRef.current = true;
    console.log('🔐 [handleSendMessage] Set isActiveChatRef.current = true');

    // Create placeholder AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    console.log('🆕🆕🆕 [NEW MESSAGE] Creating AI message with ID:', aiMessageId);
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
      streamingPhase: 'analyzing',
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      let accumulatedResponse = '';
      let finalReasoning = '';
      let finalProfile: any = null;
      let finalAnalysis: any = null;
      let finalSessionId = sessionId;

      // Always use streaming for better UX
      console.log('🚀🚀🚀 [ChatInterface] CALLING onSendMessage for aiMessageId:', aiMessageId);
      const response = await onSendMessage(messageText, selectedLLM, (chunk: any) => {
        console.log('📡 [ChatInterface] Chunk received for aiMessageId:', aiMessageId, 'type:', chunk.type);
        
        // Handle streaming chunks
        if (chunk.type === 'analyzing') {
          // Update to analyzing phase - initial placeholder
          console.log('📊 [ANALYZING] Starting analysis phase...');
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, isStreaming: true, streamingPhase: 'analyzing', streamingReasoning: 'Analyzing your message...' }
              : msg
          ));
        } else if (chunk.type === 'generating') {
          // Update to generating phase
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, isStreaming: true, streamingPhase: 'generating' }
              : msg
          ));
        } else if (chunk.type === 'token') {
          accumulatedResponse += chunk.data?.content || '';
          console.log('🔤 [TOKEN] Accumulated:', accumulatedResponse.substring(0, 100));
          
          // Cursor-style sequential streaming: reasoning first, then response
          let displayContent = '';
          let currentPhase: 'analyzing' | 'generating' | 'done' = 'analyzing';
          let streamingReasoning = '';
          
          // Detect if we're streaming JSON format
          if (accumulatedResponse.trim().startsWith('{')) {
            // Check if we've started the response field (means reasoning is done)
            const hasResponseField = accumulatedResponse.includes('"response"');
            
            if (hasResponseField) {
              // We're now in the response phase - extract response content
              currentPhase = 'generating';
              const responseMatch = accumulatedResponse.match(/"response"\s*:\s*"([\s\S]*?)(?:"|$)/);
              if (responseMatch) {
                displayContent = responseMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\t/g, '\t');
              }
              
              // Also get the complete reasoning AND set streamingReasoning for display
              const reasoningMatch = accumulatedResponse.match(/"reasoning"\s*:\s*"([\s\S]*?)"\s*,/);
              if (reasoningMatch) {
                finalReasoning = reasoningMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"');
                streamingReasoning = finalReasoning; // Also set for streaming display
                console.log('💭 [RESPONSE PHASE] Set streamingReasoning:', streamingReasoning.substring(0, 50));
              }
            } else {
              // Still in reasoning phase - show reasoning streaming
              currentPhase = 'analyzing';
              const reasoningMatch = accumulatedResponse.match(/"reasoning"\s*:\s*"([\s\S]*?)(?:"|$)/);
              if (reasoningMatch) {
                streamingReasoning = reasoningMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"');
                console.log('💭 [TOKEN REASONING] Extracted reasoning from JSON:', streamingReasoning.substring(0, 50));
              }
              displayContent = ''; // Don't show response content yet
            }
          } else {
            // Plain text response (no JSON)
            currentPhase = 'generating';
            displayContent = accumulatedResponse;
          }
          
          // Update the message in real-time
          // IMPORTANT: Only update streamingReasoning if we have new content, otherwise preserve existing
          const newStreamingReasoning = streamingReasoning || finalReasoning;
          setMessages(prev => prev.map(msg => {
            if (msg.id !== aiMessageId) return msg;
            return { 
              ...msg, 
              content: displayContent, 
              reasoning: finalReasoning || msg.reasoning, // Preserve existing if no new
              streamingReasoning: newStreamingReasoning || msg.streamingReasoning, // Preserve existing if no new
              isStreaming: true, 
              streamingPhase: currentPhase
            };
          }));
          // Force scroll to bottom on each token
          setTimeout(() => scrollToBottom(), 0);
        } else if (chunk.type === 'reasoning') {
          // ACTUAL LLM REASONING - this is the real thinking from the AI
          finalReasoning = chunk.data.content;
          console.log('🧠🧠🧠 [REAL LLM REASONING] for message', aiMessageId, ':', finalReasoning?.substring(0, 100));
          setMessages(prev => {
            console.log('🧠 [REASONING UPDATE] Current messages:', prev.map(m => ({ id: m.id, hasReasoning: !!m.reasoning })));
            const updated = prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, reasoning: finalReasoning, streamingReasoning: finalReasoning }
                : msg
            );
            console.log('🧠 [REASONING UPDATE] Updated messages:', updated.map(m => ({ id: m.id, hasReasoning: !!m.reasoning, reasoningLen: m.reasoning?.length })));
            return updated;
          });
        } else if (chunk.type === 'profile') {
          finalProfile = chunk.data;
          setLatestProfile(finalProfile);
        } else if (chunk.type === 'analysis') {
          finalAnalysis = chunk.data;
          setLatestAnalysis(finalAnalysis);
        } else if (chunk.type === 'done') {
          finalSessionId = chunk.data.sessionId || finalSessionId;
          
          console.log('🏁 [DONE CHUNK] Received done chunk for aiMessageId:', aiMessageId);
          console.log('🏁 [DONE CHUNK] chunk.data.reasoning:', chunk.data.reasoning?.substring(0, 50));
          console.log('🏁 [DONE CHUNK] finalReasoning (from reasoning chunks):', finalReasoning?.substring(0, 50));
          
          // Parse the final response, handling JSON format from LLM
          let finalContent = chunk.data.response || accumulatedResponse;
          let finalReasoningFromResponse = chunk.data.reasoning || finalReasoning;
          
          // If the accumulated response is JSON, extract the fields
          if (accumulatedResponse.trim().startsWith('{')) {
            try {
              // Try to find complete JSON
              const jsonMatch = accumulatedResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.response) {
                  finalContent = parsed.response;
                }
                if (parsed.reasoning) {
                  finalReasoningFromResponse = parsed.reasoning;
                }
              }
            } catch (e) {
              // If JSON parsing fails, try regex extraction
              const responseMatch = accumulatedResponse.match(/"response"\s*:\s*"([\s\S]*?)"\s*[,}]/);
              if (responseMatch) {
                finalContent = responseMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\t/g, '\t');
              }
            }
          }
          
          // Mark streaming as done
          console.log('✅✅✅ [DONE] Setting reasoning for message:', aiMessageId);
          console.log('✅ finalReasoningFromResponse:', finalReasoningFromResponse?.substring(0, 100));
          console.log('✅ chunk.data.reasoning:', chunk.data.reasoning?.substring(0, 100));
          console.log('✅ finalReasoning (from chunks):', finalReasoning?.substring(0, 100));
          
          setMessages(prev => {
            const newMessages = prev.map(msg => {
              if (msg.id === aiMessageId) {
                console.log('✅ Found message to update:', msg.id, 'Setting reasoning of length:', finalReasoningFromResponse?.length);
                return { 
                  ...msg, 
                  content: finalContent,
                  reasoning: finalReasoningFromResponse,
                  profile: chunk.data.profile || finalProfile,
                  analysis: chunk.data.analysis || finalAnalysis,
                  isStreaming: false,
                  streamingPhase: 'done' as const,
                };
              }
              return msg;
            });
            console.log('✅ Messages after update:', newMessages.map(m => ({ id: m.id, hasReasoning: !!m.reasoning, reasoningLen: m.reasoning?.length })));
            return newMessages;
          });
          
          // Store sessionId to update AFTER all processing is complete
          // This prevents the useEffect from triggering during streaming
          if (chunk.data.sessionId) {
            finalSessionId = chunk.data.sessionId;
            console.log('📝 [DONE] Stored sessionId:', finalSessionId, '(will update parent later)');
          }
        } else if (chunk.type === 'error') {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: `Error: ${chunk.data.message}`, isStreaming: false, streamingPhase: 'done' }
              : msg
          ));
        }
      });
      
      // If non-streaming response (fallback)
      if (response && response.response) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: response.response,
                reasoning: response.reasoning,
                profile: response.profile,
                analysis: response.analysis,
              }
            : msg
        ));
        
        if (response.profile) {
          setLatestProfile(response.profile);
        }
        if (response.analysis) {
          setLatestAnalysis(response.analysis);
        }
        
        if (response.sessionId) {
          finalSessionId = response.sessionId;
        }
      }
      
      // NOW update the sessionId in parent - AFTER all message processing is complete
      // This ensures the useEffect doesn't trigger during streaming
      if (finalSessionId && onSessionChange) {
        console.log('🔄 [AFTER STREAMING] Updating parent sessionId to:', finalSessionId);
        onSessionChange(finalSessionId);
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
          content: 'Your credit limit has been reached. Please upgrade your plan or wait for the next billing cycle to continue using Decision Intelligence Expert.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        // Refresh credit stats to show current status
        await loadCreditStats();
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: error?.message
            ? `Something went wrong: ${error.message}`
            : 'I apologize, but I encountered an error. Please try again.',
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
    // Reset active chat flag so we load history from API for this existing session
    isActiveChatRef.current = false;
    
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
    // Reset active chat flag so history can be loaded for future sessions
    isActiveChatRef.current = false;
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

    const editedIndex = messages.findIndex(msg => msg.id === editingMessageId);
    if (editedIndex === -1) return;

    const messagesUpToEdit = messages.slice(0, editedIndex);
    const updatedMessage = { ...messages[editedIndex], content: editedContent };

    setEditingMessageId(null);
    setEditedContent('');
    setIsLoading(true);
    isActiveChatRef.current = true;

    // Use same streaming path as normal send so Decision Mode and behavior are identical
    const aiMessageId = (Date.now() + 1).toString();
    const placeholder: Message = {
      id: aiMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
      streamingPhase: 'analyzing',
    };
    setMessages([...messagesUpToEdit, updatedMessage, placeholder]);

    let accumulatedResponse = '';
    let finalReasoning = '';
    let finalProfile: any = null;
    let finalAnalysis: any = null;
    let finalSessionId = sessionId;

    const streamCallback = (chunk: any) => {
      if (chunk.type === 'analyzing') {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, isStreaming: true, streamingPhase: 'analyzing', streamingReasoning: 'Analyzing your message...' } : msg
        ));
      } else if (chunk.type === 'generating') {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, isStreaming: true, streamingPhase: 'generating' } : msg
        ));
      } else if (chunk.type === 'token') {
        accumulatedResponse += chunk.data?.content || '';
        let displayContent = '';
        let currentPhase: 'analyzing' | 'generating' | 'done' = 'analyzing';
        let streamingReasoning = '';
        if (accumulatedResponse.trim().startsWith('{')) {
          const hasResponseField = accumulatedResponse.includes('"response"');
          if (hasResponseField) {
            currentPhase = 'generating';
            const responseMatch = accumulatedResponse.match(/"response"\s*:\s*"([\s\S]*?)(?:"|$)/);
            if (responseMatch) {
              displayContent = responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');
            }
            const reasoningMatch = accumulatedResponse.match(/"reasoning"\s*:\s*"([\s\S]*?)"\s*,/);
            if (reasoningMatch) {
              finalReasoning = reasoningMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
              streamingReasoning = finalReasoning;
            }
          } else {
            const reasoningMatch = accumulatedResponse.match(/"reasoning"\s*:\s*"([\s\S]*?)(?:"|$)/);
            if (reasoningMatch) {
              streamingReasoning = reasoningMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
          }
        } else {
          currentPhase = 'generating';
          displayContent = accumulatedResponse;
        }
        const newStreamingReasoning = streamingReasoning || finalReasoning;
        setMessages(prev => prev.map(msg =>
          msg.id !== aiMessageId ? msg : { ...msg, content: displayContent, reasoning: finalReasoning || msg.reasoning, streamingReasoning: newStreamingReasoning || msg.streamingReasoning, isStreaming: true, streamingPhase: currentPhase }
        ));
        setTimeout(() => scrollToBottom(), 0);
      } else if (chunk.type === 'reasoning') {
        finalReasoning = chunk.data.content;
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, reasoning: finalReasoning, streamingReasoning: finalReasoning } : msg));
      } else if (chunk.type === 'profile') {
        finalProfile = chunk.data;
        setLatestProfile(finalProfile);
      } else if (chunk.type === 'analysis') {
        finalAnalysis = chunk.data;
        setLatestAnalysis(finalAnalysis);
      } else if (chunk.type === 'done') {
        finalSessionId = chunk.data.sessionId || finalSessionId;
        let finalContent = chunk.data.response || accumulatedResponse;
        let finalReasoningFromResponse = chunk.data.reasoning || finalReasoning;
        if (accumulatedResponse.trim().startsWith('{')) {
          try {
            const jsonMatch = accumulatedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.response) finalContent = parsed.response;
              if (parsed.reasoning) finalReasoningFromResponse = parsed.reasoning;
            }
          } catch {
            const responseMatch = accumulatedResponse.match(/"response"\s*:\s*"([\s\S]*?)"\s*[,}]/);
            if (responseMatch) {
              finalContent = responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');
            }
          }
        }
        setMessages(prev => prev.map(msg =>
          msg.id !== aiMessageId ? msg : { ...msg, content: finalContent, reasoning: finalReasoningFromResponse, profile: chunk.data.profile || finalProfile, analysis: chunk.data.analysis || finalAnalysis, isStreaming: false, streamingPhase: 'done' as const }
        ));
      } else if (chunk.type === 'error') {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, content: `Error: ${chunk.data.message}`, isStreaming: false, streamingPhase: 'done' } : msg
        ));
      }
    };

    try {
      await onSendMessage(editedContent, selectedLLM, streamCallback);
      if (finalSessionId && onSessionChange) onSessionChange(finalSessionId);
      await loadChatSessions(false);
      await loadCreditStats();
    } catch (error: any) {
      console.error('Error on edit resend:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId ? { ...msg, content: error?.message ? `Something went wrong: ${error.message}` : "I apologize, but I encountered an error. Please try again.", isStreaming: false, streamingPhase: 'done' } : msg
      ));
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
                Decision Intelligence Expert
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
            href="/debug"
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
          
          {/* Elegant Tier Badge in Header - Like ChatGPT's subtle indicators */}
          {userId && userId !== '00000000-0000-0000-0000-000000000000' && (
            <div style={{ position: 'relative' }}>
              <TierBadge 
                userId={userId} 
                apiUrl={getApiUrl()} 
                selectedModel={selectedLLM}
              />
            </div>
          )}
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
                  Welcome to Decision Intelligence Expert
                </h2>
                <p style={{
                  fontFamily: typography.body.fontFamily,
                  fontSize: isMobile ? '15px' : "16px",
                  lineHeight: typography.body.lineHeight,
                  color: colors.gray600,
                  maxWidth: isMobile ? '100%' : '480px',
                  padding: isMobile ? '0 8px' : '0',
                  fontWeight: 400,
                  marginBottom: isMobile ? '24px' : '32px',
                }}>
                  I transform your thoughts and feelings into actionable growth. 
                  What would you like to explore today?
                </p>
                
                {/* Elegant Tier Badge - Minimal, contextual */}
                {userId && userId !== '00000000-0000-0000-0000-000000000000' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: isMobile ? '16px' : '20px',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <TierBadge 
                        userId={userId} 
                        apiUrl={getApiUrl()} 
                        selectedModel={selectedLLM}
                      />
                    </div>
                  </div>
                )}
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
            {/* Decision Intelligence mode toggle */}
            {onToggleDecisionMode && (
              <div style={{
                maxWidth: '900px',
                width: '100%',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <label style={{
                  fontSize: '14px',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}>
                  Decision mode
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={decisionIntelligenceMode}
                  onClick={onToggleDecisionMode}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: decisionIntelligenceMode ? colors.brandOrange.base : colors.gray300,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: decisionIntelligenceMode ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: colors.white,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                  }} />
                </button>
                {decisionIntelligenceMode && (
                  <span style={{ fontSize: '12px', color: colors.brandOrange.base }}>On — workbook-guided decisions</span>
                )}
              </div>
            )}
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
                border: `1.5px solid ${wordLimitExceeded ? '#FCA5A5' : colors.border.base}`,
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
                e.target.style.borderColor = wordLimitExceeded ? '#EF4444' : colors.brandOrange.base;
                e.target.style.boxShadow = wordLimitExceeded
                  ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                  : '0 0 0 3px rgba(246, 120, 47, 0.1), 0 4px 12px rgba(246, 120, 47, 0.15)';
                e.target.style.background = colors.white;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = wordLimitExceeded ? '#FCA5A5' : colors.border.base;
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                e.target.style.background = colors.white;
              }}
            />

            {/* Word counter — shown when user starts typing */}
            {wordCount > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '6px',
                left: '14px',
                fontSize: '11px',
                fontWeight: 500,
                color: wordCountColor,
                pointerEvents: 'none',
                transition: 'color 150ms',
              }}>
                {wordCount.toLocaleString()} / {maxInputWords.toLocaleString()} words
                {wordLimitExceeded && ' — message too long'}
              </div>
            )}
            
            {/* Integrated LLM Selector - Premium Positioning */}
            <div style={{
              position: 'absolute',
              right: isMobile ? '50px' : '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}>
              <LLMSelector
                selectedLLM={selectedLLM}
                onLLMChange={handleLLMChange}
                availableModels={availableModels}
                isLoading={isLoadingModels}
                isIntegrated={true}
              />
              {/* Elegant Tier Badge - Minimal, contextual, next to model selector */}
              {userId && userId !== '00000000-0000-0000-0000-000000000000' && (
                <div style={{ position: 'relative' }}>
                  <TierBadge 
                    userId={userId} 
                    apiUrl={getApiUrl()} 
                    selectedModel={selectedLLM}
                  />
                </div>
              )}
            </div>
            
            {/* Credits blocked / word limit banner above send */}
            {(creditsBlocked || wordLimitExceeded) && (
              <div style={{
                position: 'absolute',
                top: '-36px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#DC2626',
                background: '#FEF2F2',
                padding: '6px 12px',
                borderRadius: borderRadius.md,
                border: '1px solid #FEE2E2',
              }}>
                {creditsBlocked
                  ? 'Credits exhausted — upgrade your plan to continue'
                  : `Message too long — shorten to ${maxInputWords.toLocaleString()} words or upgrade your plan`}
              </div>
            )}

            {/* Send Button - Integrated inside input with brand colors */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || creditsBlocked || wordLimitExceeded}
              aria-label={creditsBlocked ? 'Credits exhausted' : wordLimitExceeded ? 'Message too long' : inputValue.trim() && !isLoading ? 'Send message' : 'Type a message to send'}
              aria-disabled={!inputValue.trim() || isLoading || creditsBlocked || wordLimitExceeded}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '32px',
                width: '32px',
                borderRadius: '50%',
                border: 'none',
                background: creditsBlocked || wordLimitExceeded
                  ? '#EF4444'
                  : inputValue.trim() && !isLoading 
                    ? 'linear-gradient(135deg, #42047D 0%, #F6782F 100%)'
                    : colors.gray200,
                color: creditsBlocked || wordLimitExceeded ? '#fff' : inputValue.trim() && !isLoading ? colors.white : colors.gray400,
                cursor: inputValue.trim() && !isLoading && !creditsBlocked && !wordLimitExceeded ? 'pointer' : 'not-allowed',
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



