'use client';

import React, { useState } from 'react';

// Get API URL
const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
  return isLocalhost 
    ? `http://${window.location.hostname}:5000`
    : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com';
};

const TEST_USER_ID = '9498F4E8-3001-7088-50EB-82853A5A76EB';

export default function DebugTracePage() {
  const [message, setMessage] = useState('I am feeling stressed about work');
  const [userId, setUserId] = useState(TEST_USER_ID);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${getApiUrl()}/chat/debug/trace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch debug trace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '24px',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '24px'
        }}>
          🔍 Debug Trace - Manual Testing
        </h1>

        <form onSubmit={handleSubmit} style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
              User Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
              placeholder="Enter a test message..."
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
              User ID:
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
              placeholder="Enter user ID..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '⏳ Processing...' : '🚀 Run Debug Trace'}
          </button>
        </form>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            color: '#fca5a5'
          }}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {result && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#8b5cf6' }}>
              📊 Debug Trace Results
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#3b82f6' }}>
                Final Response:
              </h3>
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '16px',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                color: '#86efac',
                fontSize: '14px'
              }}>
                {result.finalResponse || 'No response'}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#3b82f6' }}>
                Steps ({result.steps?.length || 0}):
              </h3>
              {result.steps?.map((step: any, idx: number) => (
                <div key={idx} style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#8b5cf6' }}>
                    Step {step.step}: {step.name}
                  </div>
                  <pre style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    overflow: 'auto',
                    maxHeight: '400px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Monaco, Consolas, monospace'
                  }}>
                    {JSON.stringify(step, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            <details style={{ marginTop: '24px' }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '12px'
              }}>
                📋 Full JSON Response
              </summary>
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '16px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '600px',
                fontSize: '12px',
                color: '#94a3b8',
                fontFamily: 'Monaco, Consolas, monospace'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
