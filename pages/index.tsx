import React, { useState } from 'react';
import { ChatInterface } from '../components/ChatInterface';

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

  return (
    <ChatInterface 
      onSendMessage={handleSendMessage} 
      sessionId={sessionId}
      onNewChat={handleNewChat}
    />
  );
}
