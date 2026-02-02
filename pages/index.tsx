import React, { useState } from 'react';
import { ChatInterface } from '../components/ChatInterface';

// Test user with E-DNA quiz results (Munawar Testing - architect type)
// IMPORTANT: Must match iOS app's UUID case exactly for session sync
const TEST_USER_ID = '9498F4E8-3001-7088-50EB-82853A5A76EB';

export default function Home() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleSendMessage = async (message: string, selectedLLM?: string) => {
    try {
      // Use deployed backend URL for production, localhost for development
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
      
      const apiUrl = isLocalhost 
        ? `http://${window.location.hostname}:5000/chat`
        : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com/chat';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
          userId: TEST_USER_ID, // Send real user ID for E-DNA personalization
          selectedLLM: selectedLLM || 'gpt-4o',
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
