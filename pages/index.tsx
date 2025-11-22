import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { listenForToken, requestTokenFromOpener, getStoredToken } from '../utils/token-handler';

export default function Home() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Secure token handling using postMessage API
  useEffect(() => {
    // Check if token already exists in localStorage
    const existingToken = getStoredToken();
    if (existingToken) {
      setIsAuthenticated(true);
      return;
    }

    // Check if token was passed via sessionStorage (same-origin redirect)
    if (typeof window !== 'undefined') {
      const tempToken = sessionStorage.getItem('supabase_token_temp');
      if (tempToken) {
        // Store token securely in localStorage
        localStorage.setItem('supabase_token', tempToken);
        localStorage.setItem('supabase_token_timestamp', Date.now().toString());
        // Clean up sessionStorage
        sessionStorage.removeItem('supabase_token_temp');
        setIsAuthenticated(true);
        return;
      }
    }

    // Listen for token from brandscaling website via postMessage (cross-origin)
    const cleanup = listenForToken((token) => {
      if (token) {
        setIsAuthenticated(true);
        setAuthError(null);
      }
    });

    // If opened via popup/window.open, request token from opener
    if (window.opener) {
      requestTokenFromOpener();
    }

    // Cleanup listener on unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleSendMessage = async (message: string, selectedLLM?: string) => {
    try {
      // Get Supabase token securely from localStorage (set via postMessage)
      const token = getStoredToken();

      if (!token) {
        setAuthError('Authentication required. Please log in on the company website first.');
        throw new Error('Authentication required. Please log in on the company website first.');
      }

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
          'Authorization': `Bearer ${token}`, // ✅ Send token to backend
        },
        body: JSON.stringify({
          message,
          sessionId,
          selectedLLM: selectedLLM || 'gpt-4o',
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid - redirect to login
          throw new Error('Authentication failed. Please log in again on the company website.');
        }
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

  // Show authentication error if token is missing
  if (!isAuthenticated && authError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
          Authentication Required
        </h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
          {authError}
        </p>
        <p style={{ fontSize: '14px', color: '#999' }}>
          Please log in on the company website and try again.
        </p>
      </div>
    );
  }

  const handleSessionChange = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  return (
    <ChatInterface 
      onSendMessage={handleSendMessage} 
      sessionId={sessionId}
      onNewChat={handleNewChat}
      onSessionChange={handleSessionChange}
    />
  );
}
