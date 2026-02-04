import React, { useState } from 'react';
import { ChatInterface } from '../components/ChatInterface';

// Test user with E-DNA quiz results (Munawar Testing - architect type)
// IMPORTANT: Must match iOS app's UUID case exactly for session sync
const TEST_USER_ID = '9498F4E8-3001-7088-50EB-82853A5A76EB';

export default function Home() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleSendMessage = async (message: string, selectedLLM?: string, onStream?: (chunk: any) => void) => {
    try {
      // Use deployed backend URL for production, localhost for development
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
      
      // Use /chat endpoint for both streaming and non-streaming (stream=true/false)
      const useStreaming = !!onStream;
      // Backend runs on port 9000 for localhost
      const backendPort = 9000;
      // Always use /chat endpoint - streaming is controlled by stream parameter in body
      const apiUrl = isLocalhost 
        ? `http://${window.location.hostname}:${backendPort}/chat`
        : `https://ptvmvy9qhn.us-east-1.awsapprunner.com/chat`;
      
      console.log('🚀🚀🚀 [HOME PAGE] CALLING /chat endpoint');
      console.log('📡 URL:', apiUrl);
      console.log('📡 Message:', message);
      console.log('📡 SessionId:', sessionId);
      console.log('📡 Streaming:', useStreaming);
      
      if (useStreaming) {
        // Streaming request - use /chat with stream: true
        console.log('🌊🌊🌊 [INDEX.TSX] STREAMING REQUEST');
        console.log('🌊 [INDEX.TSX] SessionId being sent:', sessionId, '(type:', typeof sessionId, ')');
        console.log('🌊 [INDEX.TSX] onStream callback exists:', !!onStream);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sessionId,
            userId: TEST_USER_ID,
            selectedLLM: selectedLLM || 'gpt-4o-mini', // Free tier default
            stream: true, // Enable streaming via SSE
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          // Split by double newline (SSE format: data: ...\n\n)
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const event of events) {
            // Find data line in event
            const lines = event.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  // Log all chunk types
                  if (data.type === 'reasoning') {
                    console.log('📨📨📨 [INDEX.TSX] REASONING CHUNK:', data.data?.content?.substring(0, 60));
                  } else if (data.type === 'done') {
                    console.log('🏁🏁🏁 [INDEX.TSX] DONE CHUNK received! Reasoning length:', data.data?.reasoning?.length);
                  } else {
                    console.log('📦 [INDEX.TSX] Chunk type:', data.type);
                  }
                  onStream?.(data);
                } catch (e) {
                  console.warn('Failed to parse SSE data:', line, e);
                }
              }
            }
          }
        }
        
        // Process any remaining data in buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onStream?.(data);
              } catch (e) {
                console.warn('Failed to parse final SSE data:', line, e);
              }
            }
          }
        }

        // Return final data structure for compatibility
        return {
          response: '',
          sessionId: sessionId,
          analysis: {},
          recommendations: [],
          reasoning: '',
          profile: {},
        };
      } else {
        // Non-streaming request (original)
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sessionId,
            userId: TEST_USER_ID,
            selectedLLM: selectedLLM || 'gpt-4o-mini', // Free tier default
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        
        // Set session ID from response if not already set
        if (!sessionId && data.sessionId) {
          setSessionId(data.sessionId);
        }

        return data;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleNewChat = () => {
    setSessionId(undefined);
  };

  const handleSessionChange = (newSessionId: string) => {
    console.log('📝 [Home] Session changed to:', newSessionId);
    setSessionId(newSessionId);
  };

  return (
    <ChatInterface 
      onSendMessage={handleSendMessage} 
      sessionId={sessionId}
      userId={TEST_USER_ID}
      onNewChat={handleNewChat}
      onSessionChange={handleSessionChange}
    />
  );
}
